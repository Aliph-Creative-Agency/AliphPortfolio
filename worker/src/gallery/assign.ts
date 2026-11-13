// C-06: bulk client assignment.
//
//   POST /api/admin/gallery/assign  {client: id | null, items: [{id, rev}]}
//
// Gives 1 to 200 pieces one client (or none: `client: null` clears it), each
// with the rev the grid read (0 = a default piece with no row yet). A piece
// is any id the grid lists, except an upload staged for deletion; anything
// else, a duplicate, or a bad {id, rev} is a 400 on `items.N`. The client
// must be ACTIVE (400 on `client` otherwise).
//
// ALL OR NOTHING, the way order.ts does it: one D1 batch whose first
// statement is the audit row ('gallery.assign'). Its detail turns into the
// non-JSON 'stale' — failing audit's json_valid CHECK and rolling the whole
// batch back — when any listed row's rev is not the one sent, or when the
// client is no longer active. That second condition sits in the same
// transaction as the writes, so it pairs with the delete guard of
// clients/write.ts: either the delete lands first and this batch fails, or
// this batch lands first and the delete sees the pieces ("in use").
// Then 409 {error, stale: [ids], current: [items]} (or the 400 on `client`
// when it was the client that went). Per piece:
//   - an active row: client_id + rev, every other column kept
//   - a default with no row: a bare override row (id + client_id); MEDIA keeps
//     every other value
//   - a default whose row is deleted ("revert to default" staged): the row
//     comes back as that bare override + client_id, so the revert still holds
// A piece that already has the client is only rev-checked, not written.
//
// 200 {items} = the listed pieces as the grid draws them, in the order sent.

import type { AdminCtx, Env } from "../index";
import { badRequest, ID_RE } from "../validate";
import { adminItem, itemsOf, ROW_COLS, type Row } from "./read";
import { json } from "./routes";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
export const ASSIGN_MAX = 200;

const isRev = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

const readRows = async (env: Env) =>
  (await env.DB.prepare(`SELECT ${ROW_COLS} FROM gallery_items`).all<Row>()).results;

const clientActive = async (env: Env, id: string) =>
  !!(await env.DB.prepare("SELECT 1 FROM clients WHERE id = ? AND state = 'active'").bind(id).first());

const unknownClient = () => badRequest({ ok: false, error: "unknown client", field: "client" });

export async function assignPost(request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ ok: false, error: "body must be JSON", field: "assign" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return badRequest({ ok: false, error: "body must be {client, items}", field: "assign" });
  }
  const { client, items } = body as Record<string, unknown>;
  if (client !== null && (typeof client !== "string" || !ID_RE.test(client))) {
    return badRequest({ ok: false, error: "client must be a client id or null", field: "client" });
  }
  if (!Array.isArray(items) || items.length < 1 || items.length > ASSIGN_MAX) {
    return badRequest({ ok: false, error: `items must list 1 to ${ASSIGN_MAX} {id, rev}`, field: "items" });
  }
  if (client !== null && !(await clientActive(env, client))) return unknownClient();

  const rows = await readRows(env);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const pieces = new Set(itemsOf(rows).filter((it) => !(it.kind === "upload" && it.deleted)).map((it) => it.id));
  const seen = new Set<string>();
  const sent: { id: string; rev: number }[] = [];
  for (const [i, e] of items.entries()) {
    const field = `items.${i}`;
    const { id, rev } = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>;
    if (typeof id !== "string" || !isRev(rev)) return badRequest({ ok: false, error: "each item is {id, rev}", field });
    if (seen.has(id)) return badRequest({ ok: false, error: "listed twice", field });
    if (!pieces.has(id)) return badRequest({ ok: false, error: "not a piece in the gallery", field });
    seen.add(id);
    sent.push({ id, rev });
  }

  const db = env.DB;
  const to = client as string | null;
  const writes: D1PreparedStatement[] = [];
  for (const e of sent) {
    const row = byId.get(e.id);
    /* nothing to write: already this client, or clearing a default that has no row
       (a stale rev still fails the batch: the guard below checks every listed piece) */
    if (row ? row.state === "active" && row.client_id === to : to === null) continue;
    if (e.rev === 0) {
      writes.push(
        db.prepare("INSERT INTO gallery_items (id, client_id, updated_by) VALUES (?1, ?2, ?3)").bind(e.id, to, ctx.adminEmail),
      );
      continue;
    }
    /* only a default piece is listed with a deleted row (deleted uploads are refused above) */
    const reset =
      row?.state === "deleted"
        ? "src = NULL, poster = NULL, cat = NULL, sub = NULL, ratio = NULL, date = NULL, alt_ar = NULL, alt_en = NULL, " +
          "hidden = 0, sort = NULL, state = 'active', "
        : "";
    writes.push(
      db
        .prepare(
          `UPDATE gallery_items SET ${reset}client_id = ?2, rev = rev + 1, updated_at = ${NOW}, updated_by = ?3
           WHERE id = ?1 AND rev = ?4`,
        )
        .bind(e.id, to, ctx.adminEmail, e.rev),
    );
  }

  const ids = sent.map((e) => e.id);
  try {
    await db.batch([
      // first, so the guard sees the rows (and the client) before this batch touches them
      db
        .prepare(
          `INSERT INTO audit (actor, action, target, detail)
           VALUES (?1, 'gallery.assign', ?2, CASE WHEN (
             SELECT COUNT(*) FROM json_each(?3) j LEFT JOIN gallery_items g ON g.id = json_extract(j.value, '$[0]')
             WHERE coalesce(g.rev, 0) <> json_extract(j.value, '$[1]')
           ) = 0 AND (?2 IS NULL OR EXISTS (SELECT 1 FROM clients WHERE id = ?2 AND state = 'active'))
           THEN ?4 ELSE 'stale' END)`,
        )
        .bind(ctx.adminEmail, to, JSON.stringify(sent.map((e) => [e.id, e.rev])), JSON.stringify({ client: to, ids })),
      ...writes,
    ]);
  } catch (err) {
    if (!/constraint failed/i.test(String((err as Error)?.message ?? err))) throw err;
    if (to !== null && !(await clientActive(env, to))) return unknownClient();
    const now = new Map((await readRows(env)).map((r) => [r.id, r]));
    const stale = sent.filter((e) => (now.get(e.id)?.rev ?? 0) !== e.rev).map((e) => e.id);
    return json(
      { error: "changed elsewhere; reload", stale, current: stale.map((id) => adminItem(id, now.get(id))) },
      409,
    );
  }

  const now = new Map((await readRows(env)).map((r) => [r.id, r]));
  return json({ items: ids.map((id) => adminItem(id, now.get(id))) });
}
