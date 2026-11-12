// GET /api/content — the store as one JSON snapshot (worker/CONTENT_API.md).
//
//   /api/content                    published (the default state). Public.
//   /api/content?state=published    ETag "<publish_rev>"; If-None-Match → 304.
//   /api/content?state=draft        Access only. /api/content is NOT under
//                                   /api/admin, so the router's admin check
//                                   never runs for it: this handler calls
//                                   verifyAccess itself. Kept as an alias;
//                                   the canonical draft read is
//   /api/admin/content              (index.ts admin router, already verified).
//   anything else in ?state=        400.
//
// The published body changes only when publish_rev does (published columns
// are written by publish() alone, which bumps it), so the rev IS the version.
// The snapshot comes through cache.ts (memo + Cache API, keyed by publish).

import { verifyAccess } from "../auth";
import type { Env } from "../index";
import { getPublished } from "../cache";
import { readSnapshot, type State } from "../store";

const PUBLIC_CACHE = "public, max-age=60";

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

const etagOf = (rev: number) => `"${rev}"`;

/** RFC 9110 weak comparison: `*`, or any listed tag equal once W/ is dropped. */
function matches(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch.split(",").some((t) => {
    const tag = t.trim();
    return tag === "*" || tag.replace(/^W\//, "") === etag;
  });
}

export async function contentRoute(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "method not allowed" }, 405, { allow: "GET, HEAD", "cache-control": "no-store" });
  }
  const state = url.searchParams.get("state") ?? "published";
  if (state !== "published" && state !== "draft") {
    return json({ error: "state must be published or draft" }, 400, { "cache-control": "no-store" });
  }
  if (state === "draft") {
    const auth = await verifyAccess(request, env);
    if (!auth.ok) {
      return new Response("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    return draftContent(env);
  }
  return publishedContent(request, env, url);
}

/** From cache.ts: a warm isolate answers this (and its 304) without D1. A
 *  store failure with nothing cached is a 503 that no cache may keep (the
 *  pages themselves fall back to the assets; this JSON has no fallback). */
async function publishedContent(request: Request, env: Env, url: URL): Promise<Response> {
  let snap;
  try {
    ({ snap } = await getPublished(env, url.origin));
  } catch (e) {
    console.error("GET /api/content: store unavailable", e);
    return json({ error: "content store unavailable" }, 503, { "cache-control": "no-store" });
  }
  const etag = etagOf(snap.rev);
  if (matches(request.headers.get("if-none-match"), etag)) {
    return new Response(null, { status: 304, headers: { etag, "cache-control": PUBLIC_CACHE } });
  }
  return json(snap, 200, { etag, "cache-control": PUBLIC_CACHE });
}

/** The draft snapshot (with locks). Callers have verified Access. */
export async function draftContent(env: Env): Promise<Response> {
  const snap = await readSnapshot(env.DB, "draft" satisfies State);
  return json(snap, 200, { "cache-control": "private, no-store" });
}
