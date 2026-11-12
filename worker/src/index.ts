// The Worker in front of the static site. Public pages pass straight through
// to the assets binding, unchanged, so the site is byte-identical to the
// assets-only deployment (later tasks add the published-content rewrite).
// /admin* and /api/admin* need a verified Cloudflare Access identity
// (worker/src/auth.ts); without one they are a 403 before any handler or
// asset is reached.
//
// wrangler.toml `run_worker_first` decides which URLs reach this script at
// all (pages, /api/*, /admin*); css/js/img/fonts are served by the assets
// layer directly and never cost a Worker request.

import { isAdminPath, verifyAccess, type AccessEnv } from "./auth";
import { contentRoute, draftContent } from "./api/content";

export interface Env extends AccessEnv {
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (isAdminPath(url.pathname)) {
      const auth = await verifyAccess(request, env);
      if (!auth.ok) return FORBIDDEN();
      return admin(request, env, url, { adminEmail: auth.email });
    }

    // The store as JSON (api/content.ts). Public for the published state; a
    // ?state=draft read checks Access itself, since this is not an admin path.
    if (url.pathname === "/api/content") return contentRoute(request, env, url);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

async function admin(request: Request, env: Env, url: URL, ctx: AdminCtx): Promise<Response> {
  if (url.pathname.startsWith("/api/")) {
    // Who the Worker thinks you are: the admin UI shows it, and it is the
    // cheapest end-to-end check that Access + the JWT check are wired.
    if (url.pathname === "/api/admin/whoami" && request.method === "GET") return json({ email: ctx.adminEmail });
    // The draft snapshot the editor and gallery screens start from.
    if (url.pathname === "/api/admin/content" && request.method === "GET") return draftContent(env);
    return json({ error: "not found" }, 404);
  }
  // /admin pages and their files (prototype/admin/**), only once verified.
  return env.ASSETS.fetch(request);
}
