// The published snapshot and the pages rendered from it, cached so a warm
// request costs no D1 query and no rewrite (free-plan CPU and D1 budgets).
//
// A publish is identified by its VERSION, meta.publish_rev + meta.publish_id
// (store.ts). Everything cached is keyed by it, so a publish never needs a
// purge: the next request that sees the new version simply misses.
//
//   in-isolate memo   the snapshot of the version last seen, trusted for
//                     CONTENT_CACHE_TTL_MS (default 5 s) without asking D1.
//                     After that ONE row read (the version) re-validates it;
//                     the full snapshot is read only when the version moved.
//                     publish() in this isolate replaces it at once, so the
//                     editor's next request already shows the publish. Other
//                     isolates follow within the TTL.
//   Cache API         the snapshot per version (a cold isolate skips the
//                     6-statement batch) and each rewritten page per version
//                     + asset etag (a deploy changes the etag, so a new
//                     page build never meets an old render). Per colo; on
//                     *.workers.dev the Cache API stores nothing, which only
//                     means misses.
//
// CONTENT_CACHE_TTL_MS = "0" switches all of it off: every request reads D1,
// as before P-09. The test config sets it, so tests that write rows by hand
// see them on the next request; publish-cache.test.ts turns caching back on.

import { readPublishVersion, readPublishedVersioned, type Snapshot, type Version } from "./store";

export interface CacheEnv {
  DB: D1Database;
  /** How long the memo is trusted without a version check. "0" = no caching. */
  CONTENT_CACHE_TTL_MS?: string;
}

/** What the read path gets: the snapshot, and its cache key (null when the
 *  store carries no publish id, i.e. nothing safe to key a shared cache on). */
export interface Published {
  snap: Snapshot;
  key: string | null;
}

const DEFAULT_TTL_MS = 5000;
/** How long the Cache API keeps a version's snapshot / pages. A version never
 *  changes, so this only bounds how long a superseded one occupies the cache. */
const SHARED_TTL_S = 86400;
/** Our own namespace on the site's origin; no request is ever routed here. */
const PREFIX = "/__aliph-cache/";

interface Memo {
  version: Version;
  snap: Snapshot;
  checkedAt: number;
}

let memo: Memo | null = null;
/** One version check at a time per isolate; concurrent requests share it. */
let inflight: Promise<Published> | null = null;

const keyOf = (v: Version) => (v.id ? `${v.rev}.${v.id}` : null);
const ttlOf = (env: CacheEnv) => {
  const n = Number(env.CONTENT_CACHE_TTL_MS ?? DEFAULT_TTL_MS);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_MS;
};
const published = (m: Memo): Published => ({ snap: m.snap, key: keyOf(m.version) });

/** Forget everything this isolate remembers (tests). */
export function resetContentCache(): void {
  memo = null;
  inflight = null;
}

/** publish() hands over what it just made live. A slower refresh that read an
 *  older version can never put it back: the memo only moves forward. */
export function rememberPublished(snap: Snapshot, id: string): void {
  if (memo && snap.rev < memo.version.rev) return;
  memo = { version: { rev: snap.rev, id }, snap, checkedAt: Date.now() };
}

/** The published snapshot, from the memo when it is fresh. Throws only when
 *  D1 fails and nothing was ever cached (the caller then serves the assets). */
export async function getPublished(env: CacheEnv, origin: string): Promise<Published> {
  const ttl = ttlOf(env);
  if (ttl === 0) {
    const r = await readPublishedVersioned(env.DB);
    return { snap: r.snap, key: null };
  }
  if (memo && Date.now() - memo.checkedAt < ttl) return published(memo);
  inflight ??= refresh(env, origin).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function refresh(env: CacheEnv, origin: string): Promise<Published> {
  let version: Version;
  try {
    version = await readPublishVersion(env.DB);
  } catch (err) {
    if (!memo) throw err;
    // D1 is down but we know the last publish: keep serving it.
    console.error("publish version unreadable, serving the cached snapshot", err);
    memo.checkedAt = Date.now();
    return published(memo);
  }
  if (memo && memo.version.rev === version.rev && memo.version.id === version.id) {
    memo.checkedAt = Date.now();
    return published(memo);
  }

  const key = keyOf(version);
  const cached = key ? await matchSnapshot(origin, key) : null;
  if (cached) {
    rememberPublished(cached, version.id);
    return { snap: cached, key };
  }
  // The batch reads the version again: a publish landing in between is
  // simply what this request gets.
  const r = await readPublishedVersioned(env.DB);
  rememberPublished(r.snap, r.id);
  const k = keyOf({ rev: r.snap.rev, id: r.id });
  if (k) await putShared(origin, "snapshot/" + k, Response.json(r.snap));
  return { snap: r.snap, key: k };
}

async function matchSnapshot(origin: string, key: string): Promise<Snapshot | null> {
  const hit = await matchShared(origin, "snapshot/" + key);
  return hit ? ((await hit.json()) as Snapshot) : null;
}

/* ── rendered pages ─────────────────────────────────────────────────── */

/** The cache key of one rendered page, or null when the asset carries no etag
 *  (then a deploy could not be told apart, and the page is not cached). */
export function pageKey(key: string | null, pathname: string, assetEtag: string | null): string | null {
  if (!key || !assetEtag) return null;
  return `page/${key}${pathname}?a=${encodeURIComponent(assetEtag)}`;
}

/** A cached render, with the response headers it was served with. */
export async function matchPage(origin: string, key: string): Promise<Response | null> {
  const hit = await matchShared(origin, key);
  if (!hit) return null;
  const headers = new Headers(hit.headers);
  const cc = headers.get(ORIGINAL_CC);
  headers.delete(ORIGINAL_CC);
  headers.delete("cf-cache-status");
  if (cc) headers.set("cache-control", cc);
  else headers.delete("cache-control");
  return new Response(hit.body, { status: 200, headers });
}

/** Stores a render. The response's own cache-control (the asset's, meant for
 *  browsers) is kept aside, because the Cache API would obey it. */
export function putPage(origin: string, key: string, res: Response): Promise<void> {
  const headers = new Headers(res.headers);
  const cc = headers.get("cache-control");
  if (cc) headers.set(ORIGINAL_CC, cc);
  return putShared(origin, key, new Response(res.body, { status: 200, headers }));
}

const ORIGINAL_CC = "x-aliph-cache-control";

/* ── Cache API, failure-tolerant: a cache problem is only ever a miss ── */

const cacheUrl = (origin: string, key: string) => origin + PREFIX + key;

async function matchShared(origin: string, key: string): Promise<Response | null> {
  try {
    return (await caches.default.match(cacheUrl(origin, key))) ?? null;
  } catch (err) {
    console.error("cache match failed", err);
    return null;
  }
}

async function putShared(origin: string, key: string, res: Response): Promise<void> {
  try {
    const headers = new Headers(res.headers);
    headers.set("cache-control", `public, max-age=${SHARED_TTL_S}`);
    await caches.default.put(cacheUrl(origin, key), new Response(res.body, { status: 200, headers }));
  } catch (err) {
    console.error("cache put failed", err);
  }
}
