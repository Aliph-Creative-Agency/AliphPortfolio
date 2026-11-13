// Publish and discard (E-06): the routes around the platform's publish(db, by)
// (worker/src/publish.ts) and a discard of the text + slot drafts.
//
//   GET  /api/admin/changes   {rev, token, changes}  changes = diff(draft, published)
//   POST /api/admin/publish   {token}  → {rev, publishedAt, changed}
//   POST /api/admin/discard   {token}  → {discarded}
//
// `token` is the lock: a hash of the publish rev and every draft row's
// key + rev + updated_at, read with the draft the changes came from. A save,
// a publish or a discard changes it, so a POST carrying an old token is a 409
// (the dialog listed something that is no longer what would happen).
//   discard  the token is checked INSIDE its one D1 batch: the audit row's
//            detail is CASE fingerprint-unchanged THEN json ELSE 'stale', and
//            'stale' fails audit's json_valid CHECK, which rolls back the
//            whole batch (publish.ts uses the same trick on revisions).
//   publish  the token is checked just before publish(), which then guards
//            its own read/write window. A discard that lands between the two
//            leaves publish() an empty diff: it still records a revision, and
//            `changed` comes back [] (nothing went live that was not live).
// Discard restores published → draft for every table (history.ts restoreStatements, fed the live snapshot), rev + 1
// on every row it touches so stale saves 409. Rows with no live copy (a new upload, ring pick, client) become
// state 'deleted'; publish purges those.

import type { AdminCtx, Env } from "../index";
import { PublishConflictError, publish } from "../publish";
import { emptySnapshot, readDraftWith, readSnapshot, type Snapshot } from "../store";
import { badRequest } from "../validate";
import { diff, type Change } from "./diff";
import { restoreStatements } from "./history";
import { json, readJson } from "./http";

/* Every draft row's identity + rev + updated_at, and the publish rev (the
   same shape publish.ts fingerprints; a save always bumps rev). */
const rowsFp = (table: string, id: string, order: string) =>
  `coalesce((SELECT group_concat(${id} || '=' || rev || '@' || updated_at, ',') FROM (SELECT * FROM ${table} ORDER BY ${order})), '')`;
const FP_SQL =
  "coalesce((SELECT v FROM meta WHERE k = 'publish_rev'), '0') || '|' || " +
  [
    rowsFp("text_values", "key || '/' || locale", "key, locale"),
    rowsFp("slot_values", "slot", "slot"),
    rowsFp("gallery_items", "id", "id"),
    rowsFp("ring_picks", "service", "service"),
    rowsFp("clients", "id", "id"),
  ].join(" || '|' || ");

async function hash(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface State {
  draft: Snapshot;
  published: Snapshot;
  /** the raw fingerprint, for the in-batch guard */
  fp: string;
  token: string;
  changes: Change[];
}

/** Draft + published + fingerprint describing the same moment. The draft and
 *  the fingerprint come from one batch; the published side only moves with
 *  the publish rev, so equal revs on both reads mean they match (else read
 *  again). */
async function readState(db: D1Database): Promise<State> {
  for (let i = 0; ; i++) {
    const published = await readSnapshot(db, "published");
    const { snap: draft, extra } = await readDraftWith(db, [db.prepare(`SELECT ${FP_SQL} AS fp`)]);
    if (draft.rev !== published.rev && i < 3) continue;
    const fp = (extra[0].results[0] as { fp: string }).fp;
    return { draft, published, fp, token: await hash(fp), changes: diff(draft, published) };
  }
}

const stale = (what: string) => json({ error: `the draft changed since you loaded it; reload and ${what} again` }, 409);

/** The body's token, or a 400 response. */
async function tokenOf(request: Request): Promise<string | Response> {
  const body = await readJson(request);
  if (!body) return badRequest({ ok: false, error: "body must be a JSON object" });
  const t = body.token;
  if (typeof t !== "string" || !/^[0-9a-f]{64}$/.test(t)) {
    return badRequest({ ok: false, error: "token (from GET /api/admin/changes) is required", field: "token" });
  }
  return t;
}

export async function publishRoute(path: string, request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  const db = env.DB;

  if (path === "/api/admin/changes") {
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
    const s = await readState(db);
    return json({ rev: s.published.rev, token: s.token, changes: s.changes });
  }

  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const token = await tokenOf(request);
  if (token instanceof Response) return token;
  const s = await readState(db);
  if (s.token !== token) return stale(path.endsWith("publish") ? "publish" : "discard");

  if (path === "/api/admin/publish") {
    if (!s.changes.length) return json({ error: "nothing to publish" }, 409);
    let r;
    try {
      r = await publish(db, ctx.adminEmail);
    } catch (err) {
      if (err instanceof PublishConflictError) return json({ error: err.message }, 409);
      throw err;
    }
    // What went live = this revision against the one before it: the live
    // snapshot read above, unless another publish slipped in between (then
    // rev-1's stored snapshot; published columns only ever move by publish).
    let before: Snapshot = s.published.rev === r.rev - 1 ? s.published : emptySnapshot();
    if (before !== s.published && r.rev > 1) {
      const row = await db
        .prepare("SELECT snapshot_json AS v FROM revisions WHERE id = ?1")
        .bind(r.rev - 1)
        .first<{ v: string }>();
      before = row ? (JSON.parse(row.v) as Snapshot) : s.published;
    }
    return json({ rev: r.rev, publishedAt: r.publishedAt, changed: diff(r.snapshot, before) });
  }

  // discard: everything back to the live state (text, slots, gallery, rings, clients)
  if (!s.changes.length) return json({ discarded: [] });
  const discarded = s.changes;
  const detail = JSON.stringify(
    Object.fromEntries(
      (["text", "slots", "gallery", "rings", "clients"] as const).map((k) => [
        k,
        discarded.filter((c) => c.section === k).map((c) => c.id),
      ]),
    ),
  );
  // restoreStatements(published snapshot) rebuilds every table from the live snapshot: rows absent from it
  // (an unpublished upload, ring or client) become state deleted, which publish purges.
  const { stmts } = restoreStatements(db, s.published, ctx.adminEmail);
  try {
    await db.batch([
      // first, so the guard sees the rows before this batch touches them
      db
        .prepare(
          `INSERT INTO audit (actor, action, target, detail)
           VALUES (?1, 'discard', 'draft', CASE WHEN (${FP_SQL}) = ?2 THEN ?3 ELSE 'stale' END)`,
        )
        .bind(ctx.adminEmail, s.fp, detail),
      ...stmts,
    ]);
  } catch (err) {
    if (/constraint failed/i.test(String((err as Error)?.message ?? err))) return stale("discard");
    throw err;
  }
  return json({ discarded });
}
