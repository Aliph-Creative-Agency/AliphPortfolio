// The gallery team's admin routes: uploads, gallery items, ring picks.
// index.ts hands every verified /api/admin/* request that is not its own to
// galleryRoute(); null means "not mine", so the caller answers 404.
//
// Contract for every write route (worker/CONTENT_API.md "Validation"):
// requireSameOrigin → validate.ts → rev-locked write → audit row.
// (upload/cleanup has no row to lock: it re-reads the used set instead.)

import type { AdminCtx, Env } from "../index";
import { cleanupPost, unusedGet } from "./cleanup";
import { itemDelete, itemPut } from "./items";
import { galleryRead } from "./read";
import { ringPut, ringReset } from "./rings";
import { mpuAbort, mpuComplete, mpuCreate, mpuPart } from "./multipart";
import { mediaGet, uploadPut } from "./upload";

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

  if (path === "/api/admin/gallery" && method === "GET") return galleryRead(env);
  if (path.startsWith("/api/admin/gallery/") && method === "PUT") return itemPut(request, env, path, ctx);
  if (path.startsWith("/api/admin/gallery/") && method === "DELETE") return itemDelete(env, path, url, ctx);
  if (path.startsWith("/api/admin/rings/") && method === "PUT") return ringPut(request, env, path, ctx);
  if (path.startsWith("/api/admin/rings/") && method === "DELETE") return ringReset(env, path, url, ctx);
  if (path === "/api/admin/upload" && method === "POST") return uploadPut(request, env, ctx);
  if (path === "/api/admin/upload/mpu" && method === "POST") return mpuCreate(request, env);
  if (path === "/api/admin/upload/mpu/part" && method === "PUT") return mpuPart(request, env, url);
  if (path === "/api/admin/upload/mpu/complete" && method === "POST") return mpuComplete(request, env, url, ctx);
  if (path === "/api/admin/upload/mpu" && method === "DELETE") return mpuAbort(env, url);
  if (path === "/api/admin/upload/unused" && method === "GET") return unusedGet(env);
  if (path === "/api/admin/upload/cleanup" && method === "POST") return cleanupPost(request, env, ctx);
  if (path.startsWith("/api/admin/media/") && method === "GET") return mediaGet(env, url);

  return null;
}
