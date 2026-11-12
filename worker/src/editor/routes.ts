// The editor's share of the admin routes (text editing, publish, history, the
// edit-mode pages). index.ts calls this first from admin(); returning null
// means "not mine" and the request falls through to the rest.

import type { AdminCtx, Env } from "../index";
import { json, requireSameOrigin } from "./http";

export async function editorRoute(
  request: Request,
  env: Env,
  url: URL,
  ctx: AdminCtx,
): Promise<Response | null> {
  void env;
  void ctx;
  const path = url.pathname;

  if (path === "/api/admin/text") {
    const bad = requireSameOrigin(request);
    if (bad) return bad;
    // E-03 fills this in.
    if (request.method === "PUT") return json({ error: "not implemented" }, 501);
    return json({ error: "method not allowed" }, 405);
  }

  return null;
}
