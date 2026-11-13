// "Clean up unused files" (G-08):
//   GET  /api/admin/upload/unused             → {files: [{key, size, uploaded, url, item?}], totalSize,
//                                                kept: [{key, url, size, rev}]}
//   (`kept` = old admin/ files that only a past revision names: never listed
//   for deletion, shown so the admin knows why they stay)
//   POST /api/admin/upload/cleanup {keys}     → {deleted, refused: [{key, reason}]}
//
// An admin/ object is USED when the draft or the published state names it:
//   - gallery items: src/poster of every active draft row, and of every
//     row's published_json;
//   - slot values (media slots and the film frames, home.film.N): every URL in
//     draft_json and published_json, whatever the field (src, poster, preview);
//   - ring picks: every id in an active draft ring or a published ring,
//     resolved to its gallery row's draft columns AND published_json, in any
//     state (a ring can still name a row deleted after the ring was saved);
//   - slot values AND gallery rows (src/poster) of EVERY past revision: the
//     editor's History restore copies a revision's slots, gallery rows and
//     clients back into the draft, so a file only an old revision names is
//     still reachable (G-10); `Used.revOnly` tells which revision;
//   - a video's poster by name: <stem>.mp4 used → <stem>.poster.* used.
// A deleted row whose deletion is published is in neither snapshot, so its
// files are listed (with `item` = its id, for the confirm list).
//
// Only keys the uploader writes (ADMIN_KEY_RE, admin/ prefix) are ever listed
// or deleted, and never one uploaded under 24 h ago: an upload that has not
// been saved as an item yet looks exactly like an orphan. POST works out the
// used set again right before deleting, so a key saved since the list is
// refused. D1 and R2 share no transaction: a save landing in the few ms
// between that read and the delete is the remaining window.

import type { AdminCtx, Env } from "../index";
import { badRequest } from "../validate";
import { json } from "./routes";
import { ADMIN_KEY_RE, MEDIA_ORIGIN, audit } from "./upload";

export const MIN_AGE_MS = 24 * 3600 * 1000;
const MAX_KEYS = 1000; // R2 delete() takes at most 1000 keys
const PREFIX = `${MEDIA_ORIGIN}/`;

/** admin/ key of a media URL, or null. */
function keyOf(v: unknown): string | null {
  if (typeof v !== "string" || !v.startsWith(PREFIX)) return null;
  const key = v.slice(PREFIX.length);
  return key.startsWith("admin/") ? key : null;
}

const parse = (s: string | null): unknown => {
  if (s === null) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

/** Every string anywhere inside a parsed JSON value. */
function* strings(v: unknown): Generator<string> {
  if (typeof v === "string") yield v;
  else if (Array.isArray(v)) for (const x of v) yield* strings(x);
  else if (v && typeof v === "object") for (const x of Object.values(v)) yield* strings(x);
}

interface Row {
  id: string;
  src: string | null;
  poster: string | null;
  published_json: string | null;
  state: string;
}

export interface Used {
  keys: Set<string>;
  /** key → the gallery row whose (draft or published) columns name it, for
   *  keys that are NOT used; tells the admin what a listed file was. */
  owner: Map<string, string>;
  /** key → the highest revision id naming it, for keys that ONLY past
   *  revisions protect (not the draft, the published state or a ring). These
   *  are also in `keys`. */
  revOnly: Map<string, number>;
}

/** The used set, read in one D1 batch (one consistent view). */
export async function usedKeys(env: Env): Promise<Used> {
  const [gallery, slots, rings, past] = await env.DB.batch([
    env.DB.prepare("SELECT id, src, poster, published_json, state FROM gallery_items"),
    env.DB.prepare("SELECT draft_json, published_json FROM slot_values"),
    env.DB.prepare("SELECT item_ids_json, published_json, state FROM ring_picks"),
    env.DB.prepare(
      "SELECT id, json_extract(snapshot_json, '$.slots') AS slots, json_extract(snapshot_json, '$.gallery') AS gallery FROM revisions",
    ),
  ]);
  const keys = new Set<string>();
  const owner = new Map<string, string>();
  const add = (v: unknown) => {
    const k = keyOf(v);
    if (k) keys.add(k);
  };
  const rows = new Map<string, Row>();
  /** every key a row names, in its draft columns or its published JSON */
  const rowKeys = (r: Row) => {
    const pub = parse(r.published_json) as { src?: unknown; poster?: unknown } | null;
    return [r.src, r.poster, pub?.src, pub?.poster].map(keyOf).filter((k): k is string => k !== null);
  };

  for (const r of gallery.results as Row[]) {
    rows.set(r.id, r);
    if (r.state === "active") {
      add(r.src);
      add(r.poster);
    }
    const pub = parse(r.published_json) as { src?: unknown; poster?: unknown } | null;
    add(pub?.src);
    add(pub?.poster);
    for (const k of rowKeys(r)) owner.set(k, r.id);
  }
  for (const r of slots.results as { draft_json: string | null; published_json: string | null }[]) {
    for (const s of strings(parse(r.draft_json))) add(s);
    for (const s of strings(parse(r.published_json))) add(s);
  }
  for (const r of rings.results as { item_ids_json: string; published_json: string | null; state: string }[]) {
    const ids = [...(r.state === "active" ? strings(parse(r.item_ids_json)) : []), ...strings(parse(r.published_json))];
    for (const id of ids) {
      const row = rows.get(id);
      if (row) for (const k of rowKeys(row)) keys.add(k);
    }
  }
  /** a video's poster follows it by name */
  const withPosters = (set: Set<string>) => {
    for (const k of [...set]) {
      const m = /^(admin\/.+)\.(mp4|webm)$/.exec(k);
      if (m) for (const ext of ["webp", "jpg", "png", "avif"]) set.add(`${m[1]}.poster.${ext}`);
    }
  };
  withPosters(keys);
  // Past revisions: every URL in their slots, plus src/poster of their gallery rows.
  const inRevs = new Map<string, number>();
  for (const r of past.results as { id: number; slots: string | null; gallery: string | null }[]) {
    const names = new Set<string>();
    for (const s of strings(parse(r.slots))) {
      const k = keyOf(s);
      if (k) names.add(k);
    }
    const rows = parse(r.gallery);
    if (Array.isArray(rows)) {
      for (const row of rows as { src?: unknown; poster?: unknown }[]) {
        for (const v of [row?.src, row?.poster]) {
          const k = keyOf(v);
          if (k) names.add(k);
        }
      }
    }
    withPosters(names);
    for (const k of names) inRevs.set(k, Math.max(inRevs.get(k) ?? 0, r.id));
  }
  const revOnly = new Map<string, number>();
  for (const [k, rev] of inRevs) {
    if (!keys.has(k)) revOnly.set(k, rev);
  }
  for (const k of inRevs.keys()) keys.add(k);
  for (const k of keys) owner.delete(k);
  return { keys, owner, revOnly };
}

const isOld = (uploaded: Date, now: number) => now - uploaded.getTime() >= MIN_AGE_MS;

export async function unusedGet(env: Env): Promise<Response> {
  const used = await usedKeys(env);
  const now = Date.now();
  const files: { key: string; size: number; uploaded: string; url: string; item?: string }[] = [];
  const kept: { key: string; url: string; size: number; rev: number }[] = [];
  let cursor: string | undefined;
  do {
    const l = await env.MEDIA_BUCKET.list({ prefix: "admin/", cursor });
    for (const o of l.objects) {
      if (!ADMIN_KEY_RE.test(o.key) || !isOld(o.uploaded, now)) continue;
      const rev = used.revOnly.get(o.key);
      if (rev !== undefined) kept.push({ key: o.key, url: PREFIX + o.key, size: o.size, rev });
      if (used.keys.has(o.key)) continue;
      const item = used.owner.get(o.key);
      files.push({ key: o.key, size: o.size, uploaded: o.uploaded.toISOString(), url: PREFIX + o.key, ...(item ? { item } : {}) });
    }
    cursor = l.truncated ? l.cursor : undefined;
  } while (cursor);
  files.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  kept.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return json({ files, totalSize: files.reduce((n, f) => n + f.size, 0), kept });
}

export async function cleanupPost(request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ ok: false, error: "body must be JSON", field: "keys" });
  }
  const keys = (body as { keys?: unknown } | null)?.keys;
  if (!Array.isArray(keys) || keys.length === 0 || keys.length > MAX_KEYS) {
    return badRequest({ ok: false, error: `keys must be a list of 1 to ${MAX_KEYS} admin/ keys`, field: "keys" });
  }
  for (const [i, k] of keys.entries()) {
    if (typeof k !== "string" || !ADMIN_KEY_RE.test(k)) {
      return badRequest({ ok: false, error: "not an uploaded admin/ key", field: `keys.${i}` });
    }
  }
  if (new Set(keys).size !== keys.length) return badRequest({ ok: false, error: "duplicate key", field: "keys" });

  const used = await usedKeys(env);
  const now = Date.now();
  const deleted: string[] = [];
  const refused: { key: string; reason: string }[] = [];
  let bytes = 0;
  for (const key of keys as string[]) {
    if (used.keys.has(key)) {
      refused.push({ key, reason: "in use" });
      continue;
    }
    const head = await env.MEDIA_BUCKET.head(key);
    if (!head) refused.push({ key, reason: "not found" });
    else if (!isOld(head.uploaded, now)) refused.push({ key, reason: "under 24 h old" });
    else {
      deleted.push(key);
      bytes += head.size;
    }
  }
  if (deleted.length) {
    await env.MEDIA_BUCKET.delete(deleted);
    await audit(env, ctx.adminEmail, "upload.cleanup", null, { keys: deleted, bytes, refused });
  }
  return json({ deleted, refused });
}
