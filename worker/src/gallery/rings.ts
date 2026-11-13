// G-02c: ring pick writes (worker/CONTENT_API.md "Rings").
//
//   PUT    /api/admin/rings/:service  {ids, baseRev}   the whole list, in ring order
//   DELETE /api/admin/rings/:service?baseRev=n         reset to main.js's RINGS
//
// validateRing accepts a ring's default items and MEDIA files of its category
// on its own; for anything else it asks the lookup built here: an active,
// visible gallery row filed under that category (an upload, or a default
// piece re-filed into it). A hidden or deleted upload is refused, so a ring
// never points at a piece the archive does not show.
//
// baseRev 0 creates the row, n > 0 updates it (a plain UPDATE, so a stale
// rev can never create a row). Reset is a staged removal (state 'deleted')
// until publish; item_ids_json keeps the last list and is ignored.
// 200 {ring}, 409 {error, current}: the shape GET /api/admin/gallery uses.

import type { AdminCtx, Env } from "../index";
import { badRequest, validateRing } from "../validate";
import { adminRing, type RingRow } from "./read";
import { json } from "./routes";
import { audit } from "./upload";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

const selectRing = (env: Env, service: string) =>
  env.DB.prepare("SELECT service, item_ids_json, state, published_json, rev FROM ring_picks WHERE service = ?")
    .bind(service)
    .first<RingRow>();

async function answer(env: Env, service: string, status: 200 | 409): Promise<Response> {
  const r = await selectRing(env, service);
  const ring = adminRing(service, r ?? undefined);
  return status === 200 ? json({ ring }) : json({ error: "changed elsewhere; reload", current: ring }, 409);
}

function pathService(path: string): string | null {
  try {
    return decodeURIComponent(path.slice("/api/admin/rings/".length));
  } catch {
    return null;
  }
}

export async function ringPut(request: Request, env: Env, path: string, ctx: AdminCtx): Promise<Response> {
  const service = pathService(path);
  let body: { ids?: unknown; baseRev?: unknown };
  try {
    body = await request.json();
  } catch {
    return badRequest({ ok: false, error: "body must be JSON", field: "items" });
  }
  const baseRev = body?.baseRev;
  if (typeof baseRev !== "number" || !Number.isInteger(baseRev) || baseRev < 0) {
    return badRequest({ ok: false, error: "baseRev must be the rev you read (0 = new)", field: "baseRev" });
  }
  if (body.ids === null) return badRequest({ ok: false, error: "use DELETE to reset a ring", field: "items" });

  const pre = validateRing(service, null);
  if (!pre.ok) return badRequest(pre);
  const rows = await env.DB.prepare("SELECT id FROM gallery_items WHERE cat = ? AND state = 'active' AND hidden = 0")
    .bind(service)
    .all<{ id: string }>();
  const visible = new Set(rows.results.map((r) => r.id));
  const v = validateRing(service, body.ids, (id) => visible.has(id));
  if (!v.ok) return badRequest(v);
  const ids = JSON.stringify(v.value);

  const res =
    baseRev === 0
      ? await env.DB.prepare(
          "INSERT INTO ring_picks (service, item_ids_json, state, updated_by) VALUES (?1, ?2, 'active', ?3) ON CONFLICT (service) DO NOTHING",
        )
          .bind(service, ids, ctx.adminEmail)
          .run()
      : await env.DB.prepare(
          `UPDATE ring_picks SET item_ids_json = ?2, state = 'active', rev = rev + 1, updated_at = ${NOW}, updated_by = ?3
           WHERE service = ?1 AND rev = ?4`,
        )
          .bind(service, ids, ctx.adminEmail, baseRev)
          .run();
  if (!res.meta.changes) return answer(env, service!, 409);

  await audit(env, ctx.adminEmail, "ring.save", service, { baseRev, ids: v.value });
  return answer(env, service!, 200);
}

export async function ringReset(env: Env, path: string, url: URL, ctx: AdminCtx): Promise<Response> {
  const service = pathService(path);
  const pre = validateRing(service, null);
  if (!pre.ok) return badRequest(pre);
  const raw = url.searchParams.get("baseRev");
  const baseRev = raw !== null && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(baseRev >= 1)) return badRequest({ ok: false, error: "baseRev must be the rev you read", field: "baseRev" });

  const res = await env.DB.prepare(
    `UPDATE ring_picks SET state = 'deleted', rev = rev + 1, updated_at = ${NOW}, updated_by = ?2 WHERE service = ?1 AND rev = ?3`,
  )
    .bind(service, ctx.adminEmail, baseRev)
    .run();
  if (!res.meta.changes) return answer(env, service!, 409);

  await audit(env, ctx.adminEmail, "ring.reset", service, { baseRev });
  return answer(env, service!, 200);
}
