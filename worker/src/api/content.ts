// GET /api/content — the store as one JSON snapshot (worker/CONTENT_API.md).
//
//   /api/content                    published (the default state). Public.
//   /api/content?state=published    ETag "<publish_rev>"; If-None-Match → 304
//                                   after reading ONE meta row, no snapshot.
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

import { verifyAccess } from "../auth";
import type { Env } from "../index";
import { readPublishRev, readSnapshot, type State } from "../store";

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
  return publishedContent(request, env);
}

async function publishedContent(request: Request, env: Env): Promise<Response> {
  const inm = request.headers.get("if-none-match");
  if (inm) {
    const etag = etagOf(await readPublishRev(env.DB));
    if (matches(inm, etag)) return new Response(null, { status: 304, headers: { etag, "cache-control": PUBLIC_CACHE } });
  }
  const snap = await readSnapshot(env.DB, "published");
  return json(snap, 200, { etag: etagOf(snap.rev), "cache-control": PUBLIC_CACHE });
}

/** The draft snapshot (with locks). Callers have verified Access. */
export async function draftContent(env: Env): Promise<Response> {
  const snap = await readSnapshot(env.DB, "draft" satisfies State);
  return json(snap, 200, { "cache-control": "private, no-store" });
}
