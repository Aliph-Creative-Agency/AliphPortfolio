// G-02b: gallery item writes.
//
//   PUT    /api/admin/gallery/:id  {…item fields, baseRev}
//   DELETE /api/admin/gallery/:id?baseRev=n
//
// PUT replaces the row's draft columns with exactly the fields sent: a field
// left out (or sent as null) is NULL, which for an override means "keep the
// MEDIA value". An id that is a MEDIA `f` is an override, any other id an
// upload (validateGalleryItem decides, CONTENT_API "Gallery"). baseRev 0
// creates the row; a row that already exists answers 409. Saving a `deleted`
// row makes it active again.
//
// DELETE stages a removal (state 'deleted') until publish. For an override
// that means "back to the default piece"; `hidden` is how a default piece
// leaves the site. A ring that still lists a removed upload is safe: main.js
// drops an id nothing knows.
//
// Every answer carries the item as GET /api/admin/gallery draws it, so the
// grid can swap one tile: 200 {item}, 409 {error, current} (current null =
// the row is gone).

import type { AdminCtx, Env } from "../index";
import { badRequest, validateGalleryItem } from "../validate";
import { adminItem, ROW_COLS, type Row } from "./read";
import { json } from "./routes";
import { audit } from "./upload";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

const selectRow = (env: Env, id: string) =>
  env.DB.prepare(`SELECT ${ROW_COLS} FROM gallery_items WHERE id = ?`).bind(id).first<Row>();

async function conflict(env: Env, id: string): Promise<Response> {
  const r = await selectRow(env, id);
  return json({ error: "changed elsewhere; reload", current: adminItem(id, r ?? undefined) }, 409);
}

/** The id in the path, decoded; null when it cannot be one. */
function pathId(path: string): string | null {
  try {
    return decodeURIComponent(path.slice("/api/admin/gallery/".length));
  } catch {
    return null;
  }
}

const isRev = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

export async function itemPut(request: Request, env: Env, path: string, ctx: AdminCtx): Promise<Response> {
  const id = pathId(path);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ ok: false, error: "body must be JSON", field: "item" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return badRequest({ ok: false, error: "item must be an object", field: "item" });
  }
  const { baseRev, id: bodyId, ...rest } = body as Record<string, unknown>;
  if (!isRev(baseRev)) return badRequest({ ok: false, error: "baseRev must be the rev you read (0 = new)", field: "baseRev" });
  if (bodyId !== undefined && bodyId !== id) return badRequest({ ok: false, error: "id does not match the path", field: "id" });
  /* null = leave the column empty (the UI clears a field this way) */
  const fields = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null));
  const v = validateGalleryItem({ ...fields, id });
  if (!v.ok) return badRequest(v);
  const it = v.value;

  if (it.client !== undefined) {
    const c = await env.DB.prepare("SELECT 1 FROM clients WHERE id = ? AND state = 'active'").bind(it.client).first();
    if (!c) return badRequest({ ok: false, error: "unknown client", field: "client" });
  }

  const cols = [
    it.src ?? null,
    it.poster ?? null,
    it.cat ?? null,
    it.sub ?? null,
    it.ratio ?? null,
    it.date ?? null,
    it.alt?.ar ?? null,
    it.alt?.en ?? null,
    it.client ?? null,
    it.hidden ? 1 : 0,
    it.sort ?? null,
  ];
  const res =
    baseRev === 0
      ? await env.DB.prepare(
          `INSERT INTO gallery_items (id, src, poster, cat, sub, ratio, date, alt_ar, alt_en, client_id, hidden, sort, updated_by)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13) ON CONFLICT (id) DO NOTHING`,
        )
          .bind(it.id, ...cols, ctx.adminEmail)
          .run()
      : await env.DB.prepare(
          `UPDATE gallery_items SET src = ?2, poster = ?3, cat = ?4, sub = ?5, ratio = ?6, date = ?7, alt_ar = ?8,
             alt_en = ?9, client_id = ?10, hidden = ?11, sort = ?12, state = 'active', rev = rev + 1,
             updated_at = ${NOW}, updated_by = ?13
           WHERE id = ?1 AND rev = ?14`,
        )
          .bind(it.id, ...cols, ctx.adminEmail, baseRev)
          .run();
  if (!res.meta.changes) return conflict(env, it.id);

  const row = await selectRow(env, it.id);
  await audit(env, ctx.adminEmail, "gallery.save", it.id, { baseRev, rev: row?.rev });
  return json({ item: adminItem(it.id, row ?? undefined) });
}

export async function itemDelete(env: Env, path: string, url: URL, ctx: AdminCtx): Promise<Response> {
  const id = pathId(path);
  if (id === null) return badRequest({ ok: false, error: "bad id", field: "id" });
  const raw = url.searchParams.get("baseRev");
  const baseRev = raw !== null && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(baseRev >= 1)) return badRequest({ ok: false, error: "baseRev must be the rev you read", field: "baseRev" });

  const res = await env.DB.prepare(
    `UPDATE gallery_items SET state = 'deleted', rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
     WHERE id = ?1 AND rev = ?3`,
  )
    .bind(id, ctx.adminEmail, baseRev)
    .run();
  if (!res.meta.changes) return conflict(env, id);

  const row = await selectRow(env, id);
  await audit(env, ctx.adminEmail, "gallery.delete", id, { baseRev, rev: row?.rev });
  return json({ item: adminItem(id, row ?? undefined) });
}
