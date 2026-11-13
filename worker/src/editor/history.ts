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
//   clients / gallery_items / ring_picks (E-07b)
//                every row in the snapshot: its columns from the JSON,
//                state 'active' (INSERT or UPDATE); every other active row:
//                state 'deleted' (a staged removal, as the gallery admin
//                stages one). Clients go first: gallery_items.client_id
//                references them, and a client the table never had is
//                written as NULL rather than failing the batch. A client's
//                line/year/url (0003) missing from the snapshot are NULL.
//   audit        one 'restore' row, target 'rev:<id>'.
// Only rows whose draft actually changes are written, and each of them gets
// rev + 1, so a save still holding a pre-restore lock is a 409 and publish's
// fingerprint sees the change. Values the rules no longer accept (a key or
// slot removed since that publish, an item validate.ts now refuses, a ring
// naming an item that is gone) are skipped, listed in `skipped`, and so
// staged as removed like any row absent from the snapshot.

import type { AdminCtx, Env } from "../index";
import type { Snapshot } from "../store";
import { emptySnapshot } from "../store";
import { validateClient, validateGalleryItem, validateRing, validateSlot, validateText } from "../validate";
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

/** The statements that make the draft equal `snap` (text, slots, clients,
 *  gallery, rings), plus what had to be skipped. */
export function restoreStatements(db: D1Database, snap: Snapshot, by: string) {
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
  // [id, name_ar, name_en, line_ar, line_en, year, url]: the clients columns. A detail the snapshot
  // leaves out (every pre-0003 revision) is NULL, so restoring it clears a detail added since.
  const clients: (string | number | null)[][] = [];
  for (const c of snap.clients ?? []) {
    const ok = validateClient(c);
    if (ok.ok) {
      const v = ok.value;
      clients.push([v.id, v.name.ar, v.name.en, v.line?.ar ?? null, v.line?.en ?? null, v.year ?? null, v.url ?? null]);
    }
    else skipped.push(`client:${(c as { id?: unknown })?.id}`);
  }
  // [id, src, poster, cat, sub, ratio, date, alt_ar, alt_en, client_id, hidden, sort]: the gallery_items columns
  const gallery: (string | number | null)[][] = [];
  const visible = new Map<string, string | undefined>();
  for (const g of snap.gallery ?? []) {
    const ok = validateGalleryItem(g);
    if (!ok.ok) {
      skipped.push(`gallery:${(g as { id?: unknown })?.id}`);
      continue;
    }
    const it = ok.value;
    if (!it.hidden) visible.set(it.id, it.cat);
    gallery.push([
      it.id, it.src ?? null, it.poster ?? null, it.cat ?? null, it.sub ?? null, it.ratio ?? null, it.date ?? null,
      it.alt?.ar ?? null, it.alt?.en ?? null, it.client ?? null, it.hidden ? 1 : 0, it.sort ?? null,
    ]);
  }
  // a ring may hold its defaults, MEDIA files of its category, and the
  // snapshot's own visible items of that category (validateRing's lookup)
  const rings: [string, string][] = [];
  for (const [service, ids] of Object.entries(snap.rings ?? {})) {
    const ok = validateRing(service, ids, (id) => visible.has(id) && visible.get(id) === service);
    if (ok.ok && ok.value) rings.push([service, JSON.stringify(ok.value)]);
    else skipped.push(`ring:${service}`);
  }
  const textJson = JSON.stringify(text);
  const slotsJson = JSON.stringify(slots);
  const clientsJson = JSON.stringify(clients);
  const galleryJson = JSON.stringify(gallery);
  const ringsJson = JSON.stringify(rings);
  const col = (i: number) => `json_extract(value, '$[${i}]')`;
  const CLIENT_COLS = ["name_ar", "name_en", "line_ar", "line_en", "year", "url"];
  const GALLERY_COLS = ["src", "poster", "cat", "sub", "ratio", "date", "alt_ar", "alt_en", "client_id", "hidden", "sort"];

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
    // clients before gallery_items (client_id references them)
    db
      .prepare(
        `INSERT INTO clients (id, ${CLIENT_COLS.join(", ")}, state, updated_by)
         SELECT ${col(0)}, ${col(1)}, ${col(2)}, ${col(3)}, ${col(4)}, ${col(5)}, ${col(6)}, 'active', ?2
         FROM json_each(?1) WHERE true
         ON CONFLICT (id) DO UPDATE SET ${CLIENT_COLS.map((c) => `${c} = excluded.${c}`).join(", ")}, state = 'active',
           rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE clients.state IS NOT 'active' OR ${CLIENT_COLS.map((c) => `clients.${c} IS NOT excluded.${c}`).join(" OR ")}`,
      )
      .bind(clientsJson, by),
    db
      .prepare(
        `UPDATE clients SET state = 'deleted', rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE state = 'active' AND NOT EXISTS (SELECT 1 FROM json_each(?1) WHERE ${col(0)} = clients.id)`,
      )
      .bind(clientsJson, by),
    db
      .prepare(
        `INSERT INTO gallery_items (id, ${GALLERY_COLS.join(", ")}, state, updated_by)
         SELECT ${col(0)}, ${col(1)}, ${col(2)}, ${col(3)}, ${col(4)}, ${col(5)}, ${col(6)}, ${col(7)}, ${col(8)},
           CASE WHEN EXISTS (SELECT 1 FROM clients WHERE id = ${col(9)}) THEN ${col(9)} END, ${col(10)}, ${col(11)}, 'active', ?2
         FROM json_each(?1) WHERE true
         ON CONFLICT (id) DO UPDATE SET ${GALLERY_COLS.map((c) => `${c} = excluded.${c}`).join(", ")}, state = 'active',
           rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE gallery_items.state IS NOT 'active' OR ${GALLERY_COLS.map((c) => `gallery_items.${c} IS NOT excluded.${c}`).join(" OR ")}`,
      )
      .bind(galleryJson, by),
    db
      .prepare(
        `UPDATE gallery_items SET state = 'deleted', rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE state = 'active' AND NOT EXISTS (SELECT 1 FROM json_each(?1) WHERE ${col(0)} = gallery_items.id)`,
      )
      .bind(galleryJson, by),
    db
      .prepare(
        `INSERT INTO ring_picks (service, item_ids_json, state, updated_by)
         SELECT ${col(0)}, ${col(1)}, 'active', ?2 FROM json_each(?1) WHERE true
         ON CONFLICT (service) DO UPDATE SET item_ids_json = excluded.item_ids_json, state = 'active',
           rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE ring_picks.state IS NOT 'active' OR json(ring_picks.item_ids_json) IS NOT json(excluded.item_ids_json)`,
      )
      .bind(ringsJson, by),
    db
      .prepare(
        `UPDATE ring_picks SET state = 'deleted', rev = rev + 1, updated_at = ${NOW}, updated_by = ?2
         WHERE state = 'active' AND NOT EXISTS (SELECT 1 FROM json_each(?1) WHERE ${col(0)} = ring_picks.service)`,
      )
      .bind(ringsJson, by),
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
