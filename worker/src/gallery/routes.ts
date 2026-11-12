// The gallery team's admin routes: uploads, gallery items, ring picks.
// index.ts hands every verified /api/admin/* request that is not its own to
// galleryRoute(); null means "not mine", so the caller answers 404.
//
// Contract for every write route (worker/CONTENT_API.md "Validation"):
// requireSameOrigin → validate.ts → rev-locked write → audit row.

import type { AdminCtx, Env } from "../index";
import { publish } from "../publish";

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/** CSRF guard for admin writes: the Origin header must be present and equal
 *  the request URL's origin. Returns the 403 to send, or null when fine. */
export function requireSameOrigin(request: Request, url: URL): Response | null {
  const origin = request.headers.get("origin");
  if (origin && origin === url.origin) return null;
  return json({ error: "cross-origin request refused" }, 403);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** Paths this module owns (used for the Origin guard). */
const isMine = (path: string) => /^\/api\/admin\/(gallery|upload|rings)(\/|$)/.test(path);

export async function galleryRoute(
  request: Request,
  env: Env,
  url: URL,
  ctx: AdminCtx,
): Promise<Response | null> {
  const path = url.pathname;
  const method = request.method;

  // Checked before routing, so a new route cannot forget the guard.
  if (method !== "GET" && method !== "HEAD" && isMine(path)) {
    const bad = requireSameOrigin(request, url);
    if (bad) return bad;
  }

  // Dev only: lets browser e2e publish before the editor team's publish
  // route is merged. Needs the bypass flag AND a local hostname.
  if (path === "/api/admin/gallery/dev-publish" && method === "POST") {
    if (env.ADMIN_DEV_BYPASS !== "1" || !LOCAL_HOSTS.has(url.hostname)) return json({ error: "not found" }, 404);
    const res = await publish(env.DB, ctx.adminEmail);
    return json({ rev: res.rev, publishedAt: res.publishedAt });
  }

  return null;
}
