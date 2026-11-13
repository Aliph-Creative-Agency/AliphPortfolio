// History (E-07): the published revisions, and restoring one into the draft.
//
//   GET  /api/admin/revisions?limit=50      [{id, publishedAt, by, changed}], newest first
//        changed = diff(revision n, revision n-1) (diff.ts); revision 1 against the empty store
//   POST /api/admin/revisions/:id/restore   {restored, skipped}   404 unknown id
//
// Restore copies a revision's snapshot into the DRAFT (BRIEF: never live; the
// admin reviews and publishes). It is ONE D1 batch with no read of the current
// draft, so nothing can slip between a read and the write:
//   text_values  every (key, locale) in the snapshot: draft = its value
//                (INSERT or UPDATE); every other row: draft = NULL (default).
//   slot_values  the same with draft_json.
//   audit        one 'restore' row, target 'rev:<id>'.
// Only rows whose draft actually changes are written, and each of them gets
// rev + 1, so a save still holding a pre-restore lock is a 409 and publish's
// fingerprint sees the change. Values the registry no longer accepts (a key
// or slot removed since that publish) are skipped and listed in `skipped`.

import type { AdminCtx, Env } from "../index";
import type { Snapshot } from "../store";
import { emptySnapshot } from "../store";
import { validateSlot, validateText } from "../validate";
import { diff } from "./diff";
import { json } from "./http";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

interface RevisionRow {
  id: number;
  published_at: string;
  published_by: string;
  snapshot_json: string;
}

const RESTORE_RE = /^\/api\/admin\/revisions\/([^/]+)\/restore$/;

export function isHistoryPath(path: string): boolean {
  return path === "/api/admin/revisions" || RESTORE_RE.test(path);
}

export async function historyRoute(path: string, request: Request, env: Env, url: URL, ctx: AdminCtx): Promise<Response> {
  if (path === "/api/admin/revisions") {
    if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
    return list(env.DB, url);
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const raw = RESTORE_RE.exec(path)![1];
  if (!/^[1-9]\d{0,9}$/.test(raw)) return json({ error: "revision id must be a positive integer", field: "id" }, 400);
  return restore(env.DB, Number(raw), ctx.adminEmail);
}

async function list(db: D1Database, url: URL): Promise<Response> {
  const q = url.searchParams.get("limit");
  const limit = q === null ? 50 : Number(q);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    return json({ error: "limit must be an integer from 1 to 200", field: "limit" }, 400);
  }
  // one extra row: the base the oldest listed revision is diffed against
  const { results } = await db
    .prepare("SELECT id, published_at, published_by, snapshot_json FROM revisions ORDER BY id DESC LIMIT ?1")
    .bind(limit + 1)
    .all<RevisionRow>();
  const snaps = new Map(results.map((r) => [r.id, JSON.parse(r.snapshot_json) as Snapshot]));
  return json(
    results.slice(0, limit).map((r) => ({
      id: r.id,
      publishedAt: r.published_at,
      by: r.published_by,
      changed: diff(snaps.get(r.id)!, snaps.get(r.id - 1) ?? emptySnapshot()),
    })),
  );
}

/** The statements that make the draft equal `snap` (text + slots), plus what
 *  had to be skipped. E-07b appends gallery / rings / clients to the same batch. */
function restoreStatements(db: D1Database, snap: Snapshot, by: string) {
  const skipped: string[] = [];
  const text: [string, string, string][] = [];
  for (const [key, pair] of Object.entries(snap.text ?? {})) {
    for (const loc of ["ar", "en"] as const) {
      const v = pair?.[loc];
      if (v === undefined) continue;
      const ok = validateText(key, loc, v);
      if (ok.ok && typeof ok.value === "string") text.push([key, loc, ok.value]);
      else skipped.push(`text:${key}:${loc}`);
    }
  }
  const slots: [string, string][] = [];
  for (const [id, value] of Object.entries(snap.slots ?? {})) {
    const ok = validateSlot(id, value);
    if (ok.ok && ok.value) slots.push([id, JSON.stringify(ok.value)]);
    else skipped.push(`slot:${id}`);
  }
  const textJson = JSON.stringify(text);
  const slotsJson = JSON.stringify(slots);

  const stmts = [
    // present in the snapshot: set the draft (insert the row if there is none)
    db
      .prepare(
        `INSERT INTO text_values (key, locale, draft, updated_by)
         SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), json_extract(value, '$[2]'), ?2
         FROM json_each(?1) WHERE true
         ON CONFLICT (key, locale) DO UPDATE SET draft = excluded.draft, rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE text_values.draft IS NOT excluded.draft`,
      )
      .bind(textJson, by),
    // absent: back to the default
    db
      .prepare(
        `UPDATE text_values SET draft = NULL, rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE draft IS NOT NULL AND NOT EXISTS (SELECT 1 FROM json_each(?1)
           WHERE json_extract(value, '$[0]') = text_values.key AND json_extract(value, '$[1]') = text_values.locale)`,
      )
      .bind(textJson, by),
    db
      .prepare(
        `INSERT INTO slot_values (slot, draft_json, updated_by)
         SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), ?2
         FROM json_each(?1) WHERE true
         ON CONFLICT (slot) DO UPDATE SET draft_json = excluded.draft_json, rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE slot_values.draft_json IS NOT excluded.draft_json`,
      )
      .bind(slotsJson, by),
    db
      .prepare(
        `UPDATE slot_values SET draft_json = NULL, rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE draft_json IS NOT NULL AND NOT EXISTS (SELECT 1 FROM json_each(?1)
           WHERE json_extract(value, '$[0]') = slot_values.slot)`,
      )
      .bind(slotsJson, by),
  ];
  return { stmts, skipped };
}

async function restore(db: D1Database, id: number, by: string): Promise<Response> {
  const row = await db.prepare("SELECT snapshot_json FROM revisions WHERE id = ?1").bind(id).first<{ snapshot_json: string }>();
  if (!row) return json({ error: `no revision ${id}` }, 404);
  const snap = JSON.parse(row.snapshot_json) as Snapshot;
  const { stmts, skipped } = restoreStatements(db, snap, by);
  await db.batch([
    ...stmts,
    db
      .prepare("INSERT INTO audit (actor, action, target, detail) VALUES (?1, 'restore', ?2, ?3)")
      .bind(by, `rev:${id}`, JSON.stringify({ rev: id, skipped })),
  ]);
  return json({ restored: id, skipped });
}
