// publish(db, by): the draft goes live, whole, in ONE D1 batch (one
// transaction). The editor team's Publish route calls it (CONTENT_API.md
// "Publish").
//
//   1. Read the draft snapshot and a FINGERPRINT of every draft row (key/id +
//      rev + updated_at, and the publish rev) in one batch.
//   2. Write, in one batch:
//        revisions   id = rev + 1, snapshot_json = the snapshot being made live.
//                    Its value is CASE fingerprint-still-equal THEN the JSON
//                    ELSE 'stale', and 'stale' fails the json_valid CHECK, so
//                    the whole batch rolls back when anything changed since
//                    step 1. A racing publish also collides on the id.
//        meta        publish_rev = rev + 1, publish_id = a fresh random id.
//        text_values / slot_values   published = draft, in SQL.
//        gallery_items / clients     published_json = the JSON computed in
//                    step 1 for every active row (exactly JSON.stringify of
//                    galleryItemFromRow / clientFromRow), NULL for a 'deleted'
//                    row. The rows stay; a deleted row is invisible in both
//                    states and a later save can make it active again.
//        ring_picks  published_json = item_ids_json when active, else NULL.
//        audit       one 'publish' row.
//   3. A rollback for either reason is retried from step 1 (a few times), so
//      two concurrent publishes both land, as revs n+1 and n+2.
//
// The snapshot stored in the revision equals the published snapshot read
// after the batch (store.ts builds both states the same way), so restoring a
// revision is re-drafting snapshot_json.

import { rememberPublished } from "./cache";
import { readDraftWith, type Snapshot } from "./store";

export interface PublishResult {
  /** The new meta.publish_rev = revisions.id. */
  rev: number;
  publishedAt: string;
  /** What is live now (no locks). */
  snapshot: Snapshot;
}

/** Every attempt lost a race (someone kept saving or publishing). */
export class PublishConflictError extends Error {
  constructor(cause: unknown) {
    super("publish kept colliding with other writes; try again", { cause });
    this.name = "PublishConflictError";
  }
}

const ATTEMPTS = 4;

/* Every draft row's identity + rev + updated_at, and the publish rev. A save
   bumps rev (CONTENT_API.md "Validation"), so any save, insert or delete
   between the read and the write changes this string. */
const rowsFp = (table: string, id: string, order: string) =>
  `coalesce((SELECT group_concat(${id} || '=' || rev || '@' || updated_at, ',') FROM (SELECT * FROM ${table} ORDER BY ${order})), '')`;
const FINGERPRINT_SQL =
  "(SELECT v FROM meta WHERE k = 'publish_rev') || '|' || " +
  [
    rowsFp("text_values", "key || '/' || locale", "key, locale"),
    rowsFp("slot_values", "slot", "slot"),
    rowsFp("gallery_items", "id", "id"),
    rowsFp("ring_picks", "service", "service"),
    rowsFp("clients", "id", "id"),
  ].join(" || '|' || ");

export async function publish(db: D1Database, by: string): Promise<PublishResult> {
  let lastErr: unknown;
  for (let i = 0; i < ATTEMPTS; i++) {
    const { snap: draft, extra } = await readDraftWith(db, [db.prepare(`SELECT ${FINGERPRINT_SQL} AS fp`)]);
    const fp = (extra[0].results[0] as { fp: string }).fp;

    const rev = draft.rev + 1;
    const id = crypto.randomUUID();
    const publishedAt = new Date().toISOString();
    const { locks: _locks, ...live } = draft;
    const snapshot: Snapshot = { ...live, rev };

    // id → the exact published_json of every active row (store.ts read them
    // with galleryItemFromRow / clientFromRow); json_each hands each string
    // back verbatim, and a row missing from the map gets NULL.
    const galleryJson = JSON.stringify(Object.fromEntries(snapshot.gallery.map((g) => [g.id, JSON.stringify(g)])));
    const clientsJson = JSON.stringify(Object.fromEntries(snapshot.clients.map((c) => [c.id, JSON.stringify(c)])));

    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO revisions (id, published_at, published_by, snapshot_json)
             VALUES (?1, ?2, ?3, CASE WHEN (${FINGERPRINT_SQL}) = ?4 THEN ?5 ELSE 'stale' END)`,
          )
          .bind(rev, publishedAt, by, fp, JSON.stringify(snapshot)),
        db
          .prepare("INSERT INTO meta (k, v) VALUES ('publish_rev', ?1) ON CONFLICT (k) DO UPDATE SET v = excluded.v")
          .bind(String(rev)),
        db
          .prepare("INSERT INTO meta (k, v) VALUES ('publish_id', ?1) ON CONFLICT (k) DO UPDATE SET v = excluded.v")
          .bind(id),
        db.prepare("UPDATE text_values SET published = draft WHERE published IS NOT draft"),
        db.prepare("UPDATE slot_values SET published_json = draft_json WHERE published_json IS NOT draft_json"),
        db
          .prepare(
            `UPDATE gallery_items SET published_json = (SELECT value FROM json_each(?1) WHERE key = gallery_items.id)
             WHERE published_json IS NOT (SELECT value FROM json_each(?1) WHERE key = gallery_items.id)`,
          )
          .bind(galleryJson),
        db.prepare(
          `UPDATE ring_picks SET published_json = CASE WHEN state = 'active' THEN item_ids_json END
           WHERE published_json IS NOT (CASE WHEN state = 'active' THEN item_ids_json END)`,
        ),
        db
          .prepare(
            `UPDATE clients SET published_json = (SELECT value FROM json_each(?1) WHERE key = clients.id)
             WHERE published_json IS NOT (SELECT value FROM json_each(?1) WHERE key = clients.id)`,
          )
          .bind(clientsJson),
        db
          .prepare("INSERT INTO audit (at, actor, action, target, detail) VALUES (?1, ?2, 'publish', ?3, ?4)")
          .bind(publishedAt, by, `rev:${rev}`, JSON.stringify({ rev, id })),
      ]);
    } catch (err) {
      // Only a lost race (the fingerprint CHECK or the revisions id) is worth
      // another try; anything else is a real failure.
      if (!/constraint failed/i.test(String((err as Error)?.message ?? err))) throw err;
      lastErr = err;
      continue;
    }

    rememberPublished(snapshot, id);
    return { rev, publishedAt, snapshot };
  }
  throw new PublishConflictError(lastErr);
}
