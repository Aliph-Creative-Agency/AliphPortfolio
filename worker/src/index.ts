// The Worker in front of the static site. Public pages pass straight through
// to the assets binding, unchanged, so the site is byte-identical to the
// assets-only deployment — until something is published: then the three
// pages get the published text rendered in (render/text.ts).
// /admin* and /api/admin* need a verified Cloudflare Access identity
// (worker/src/auth.ts); without one they are a 403 before any handler or
// asset is reached.
//
// wrangler.toml `run_worker_first` decides which URLs reach this script at
// all (pages, /api/*, /admin*); css/js/img/fonts are served by the assets
// layer directly and never cost a Worker request.

import { isAdminPath, verifyAccess, type AccessEnv } from "./auth";
import { contentRoute, draftContent } from "./api/content";
import { etagMatches, pageEtag, pageOf, renderText, type Page } from "./render/text";
import { onSlots } from "./render/slots";
import { onRegions } from "./render/regions";
import { getPublished, matchPage, pageKey, putPage, type CacheEnv, type Published } from "./cache";
import { isEmpty } from "./store";
import { editorRoute } from "./editor/routes";
import { galleryRoute } from "./gallery/routes";
import { clientsRoute } from "./clients/routes";

export interface Env extends AccessEnv, CacheEnv {
  ASSETS: Fetcher;
  /** The content store (migrations/). Local miniflare D1 in development. */
  DB: D1Database;
  /** aliph-media, for admin uploads. Local miniflare R2 in development. */
  MEDIA_BUCKET: R2Bucket;
}

/** Who is signed in, for the admin handlers. */
export interface AdminCtx {
  adminEmail: string;
}

const FORBIDDEN = () =>
  new Response("Forbidden", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (isAdminPath(url.pathname)) {
      const auth = await verifyAccess(request, env);
      if (!auth.ok) return FORBIDDEN();
      return admin(request, env, url, { adminEmail: auth.email });
    }

    // The store as JSON (api/content.ts). Public for the published state; a
    // ?state=draft read checks Access itself, since this is not an admin path.
    if (url.pathname === "/api/content") return contentRoute(request, env, url);

    const page = request.method === "GET" ? pageOf(url.pathname) : null;
    if (page) return servePage(request, env, ctx, url, page);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

/** One of the three pages, with the published text, media slots and @static
 *  SEO regions rendered in, in one streaming pass (render/text.ts,
 *  render/slots.ts, render/regions.ts). An empty
 *  store, or a store failure with nothing cached, serves the assets response
 *  untouched: the site never depends on D1 being up. The snapshot and the
 *  finished page come from cache.ts when it has them. */
async function servePage(request: Request, env: Env, ctx: ExecutionContext, url: URL, page: Page): Promise<Response> {
  let pub: Published;
  try {
    pub = await getPublished(env, url.origin);
  } catch (err) {
    console.error("published snapshot unreadable, serving assets as-is", err);
    return env.ASSETS.fetch(request);
  }
  const snap = pub.snap;
  if (isEmpty(snap)) return env.ASSETS.fetch(request);

  // The asset's own validators would 304 a page whose rewrite changed: ask
  // for the full asset and answer the conditional against our own ETag.
  const plain = new Request(request);
  plain.headers.delete("if-none-match");
  plain.headers.delete("if-modified-since");
  const res = await env.ASSETS.fetch(plain);
  if (res.status !== 200 || !(res.headers.get("content-type") ?? "").startsWith("text/html")) return res;

  const etag = pageEtag(res.headers.get("etag"), snap.rev);
  const headers = new Headers(res.headers);
  headers.set("etag", etag);
  headers.delete("last-modified");
  headers.delete("content-length");
  if (etagMatches(request.headers.get("if-none-match"), etag)) {
    await res.body?.cancel();
    headers.delete("content-type");
    return new Response(null, { status: 304, headers });
  }

  const key = pageKey(pub.key, url.pathname, res.headers.get("etag"));
  if (key) {
    const hit = await matchPage(url.origin, key);
    if (hit) {
      await res.body?.cancel();
      return hit;
    }
  }
  const out = renderText(new Response(res.body, { status: 200, headers }), snap, page, (rw) => {
    onSlots(rw, snap, page);
    onRegions(rw, snap, page);
  });
  if (!key) return out;
  // Stored after the response has gone out, from a tee of the same stream.
  ctx.waitUntil(putPage(url.origin, key, out.clone()));
  return out;
}

async function admin(request: Request, env: Env, url: URL, ctx: AdminCtx): Promise<Response> {
  const ed = await editorRoute(request, env, url, ctx);
  if (ed) return ed;
  if (url.pathname.startsWith("/api/")) {
    // Who the Worker thinks you are: the admin UI shows it, and it is the
    // cheapest end-to-end check that Access + the JWT check are wired.
    if (url.pathname === "/api/admin/whoami" && request.method === "GET") return json({ email: ctx.adminEmail });
    // The draft snapshot the editor and gallery screens start from.
    if (url.pathname === "/api/admin/content" && request.method === "GET") return draftContent(env);
    const c = await clientsRoute(request, env, url, ctx); // clients (worker/src/clients)
    if (c) return c;
    const g = await galleryRoute(request, env, url, ctx); // uploads, gallery, rings (worker/src/gallery)
    if (g) return g;
    return json({ error: "not found" }, 404);
  }
  // /admin pages and their files (prototype/admin/**), only once verified.
  return env.ASSETS.fetch(request);
}
