// G-06a: the library order of one sub.
//
//   POST /api/admin/gallery/order  {cat, sub, items: [{id, rev}]}
//
// `sub` is a LIBRARY sub, the run /library files a piece under (main.js
// LIBSUBS, the admin grid's sections): design → "ads"; photo → "videos" /
// "photos"; any other category → "all". NOT the SUBCATS chip (`item.sub`):
// the public page sorts within these runs, so this is the order that shows
// (editor E-10: `sort` first, ascending; pieces without one after, by date).
//
// `items` is EVERY current piece of that sub (defaults + uploads, hidden ones
// included, an upload staged for deletion excluded, as GET /api/admin/gallery
// lists them) in the new order, each with the rev the client read (0 = a
// default with no row yet). Anything else is a 400 on `items.N` (another
// sub's piece, an unknown id, a duplicate) or on `items` (pieces missing).
//
// Writes sort = 10, 20, 30… for every piece, ALL OR NOTHING: one D1 batch
// whose first statement is the audit row, and its detail turns into the
// non-JSON 'stale' when any listed row's rev is not the one sent, which
// fails audit's json_valid CHECK and rolls the whole batch back (the trick
// of worker/src/editor/publish.ts discard). Then 409 {error, current}.
//   - an active row: sort + rev only, every other column kept
//   - a default with no row: a bare override row (id + sort), MEDIA keeps
//     every other value, so the piece itself does not change
//   - a default whose row is deleted ("revert to default" staged): the row
//     comes back as that bare override, so the revert still holds
// A piece created in the sub between the client's read and this batch is
// not covered by the check; it has no sort and simply files after.
//
// 200 {items} = the sub's pieces as the grid draws them, in the new order.

import type { AdminCtx, Env } from "../index";
import defaults from "../generated/defaults.json";
import { badRequest } from "../validate";
import { itemsOf, ROW_COLS, type AdminItem, type Row } from "./read";
import { json } from "./routes";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
const STEP = 10;

type Run = { id: string; of: (it: AdminItem) => boolean };
const RUNS: Record<string, Run[]> = {
  design: [{ id: "ads", of: () => true }],
  photo: [
    { id: "videos", of: (it) => it.video },
    { id: "photos", of: (it) => !it.video },
  ],
};
const CATS = new Set((defaults.CATS as { id: string }[]).map((c) => c.id).filter((id) => id !== "all"));
const runsOf = (cat: string): Run[] | null => RUNS[cat] ?? (CATS.has(cat) ? [{ id: "all", of: () => true }] : null);

const isRev = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/** The current pieces of one library sub, in the read model's order. */
const piecesOf = (rows: Row[], cat: string, run: Run) =>
  itemsOf(rows).filter((it) => it.cat === cat && !(it.kind === "upload" && it.deleted) && run.of(it));

const readRows = async (env: Env) =>
  (await env.DB.prepare(`SELECT ${ROW_COLS} FROM gallery_items`).all<Row>()).results;

export async function orderPost(request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ ok: false, error: "body must be JSON", field: "order" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return badRequest({ ok: false, error: "body must be {cat, sub, items}", field: "order" });
  }
  const { cat, sub, items } = body as Record<string, unknown>;
  const runs = typeof cat === "string" ? runsOf(cat) : null;
  if (!runs) return badRequest({ ok: false, error: "unknown category", field: "cat" });
  const run = runs.find((r) => r.id === sub);
  if (!run) {
    return badRequest({ ok: false, error: `unknown library sub; one of ${runs.map((r) => r.id).join(", ")}`, field: "sub" });
  }
  if (!Array.isArray(items)) return badRequest({ ok: false, error: "items must be a list of {id, rev}", field: "items" });

  const rows = await readRows(env);
  const pieces = new Map(piecesOf(rows, cat as string, run).map((it) => [it.id, it]));
  const seen = new Set<string>();
  const sent: { id: string; rev: number }[] = [];
  for (const [i, e] of items.entries()) {
    const field = `items.${i}`;
    const { id, rev } = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>;
    if (typeof id !== "string" || !isRev(rev)) return badRequest({ ok: false, error: "each item is {id, rev}", field });
    if (seen.has(id)) return badRequest({ ok: false, error: "listed twice", field });
    if (!pieces.has(id)) return badRequest({ ok: false, error: `not a piece of ${cat} / ${sub}`, field });
    seen.add(id);
    sent.push({ id, rev });
  }
  if (sent.length !== pieces.size) {
    const missing = [...pieces.keys()].filter((id) => !seen.has(id));
    return badRequest({ ok: false, error: `every piece of this sub must be listed; missing ${missing.join(", ")}`, field: "items" });
  }

  const conflict = async () =>
    json({ error: "changed elsewhere; reload", current: piecesOf(await readRows(env), cat as string, run) }, 409);
  /* No early 409 from the read above: the batch's guard is the one check, so
     a stale rev always takes the same (tested) all-or-nothing path. */
  const state = new Map(rows.map((r) => [r.id, r.state]));
  const ids = sent.map((e) => e.id);
  const detail = JSON.stringify({ cat, sub, ids });
  const db = env.DB;
  const writes = sent.map((e, i) => {
    const sort = (i + 1) * STEP;
    if (e.rev === 0) {
      return db.prepare("INSERT INTO gallery_items (id, sort, updated_by) VALUES (?1, ?2, ?3)").bind(e.id, sort, ctx.adminEmail);
    }
    /* only a default piece is listed with a deleted row (uploads are left out) */
    const reset =
      state.get(e.id) === "deleted"
        ? "src = NULL, poster = NULL, cat = NULL, sub = NULL, ratio = NULL, date = NULL, alt_ar = NULL, alt_en = NULL, " +
          "client_id = NULL, hidden = 0, state = 'active', "
        : "";
    return db
      .prepare(
        `UPDATE gallery_items SET ${reset}sort = ?2, rev = rev + 1, updated_at = ${NOW}, updated_by = ?3
         WHERE id = ?1 AND rev = ?4`,
      )
      .bind(e.id, sort, ctx.adminEmail, e.rev);
  });
  try {
    await db.batch([
      // first, so the guard sees the rows before this batch touches them
      db
        .prepare(
          `INSERT INTO audit (actor, action, target, detail)
           VALUES (?1, 'gallery.order', ?2, CASE WHEN (
             SELECT COUNT(*) FROM json_each(?3) j LEFT JOIN gallery_items g ON g.id = json_extract(j.value, '$[0]')
             WHERE coalesce(g.rev, 0) <> json_extract(j.value, '$[1]')
           ) = 0 THEN ?4 ELSE 'stale' END)`,
        )
        .bind(ctx.adminEmail, `${cat}/${sub}`, JSON.stringify(sent.map((e) => [e.id, e.rev])), detail),
      ...writes,
    ]);
  } catch (err) {
    if (/constraint failed/i.test(String((err as Error)?.message ?? err))) return conflict();
    throw err;
  }

  const now = new Map(piecesOf(await readRows(env), cat as string, run).map((it) => [it.id, it]));
  return json({ items: ids.map((id) => now.get(id)).filter(Boolean) });
}
