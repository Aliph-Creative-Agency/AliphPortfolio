// The editor's share of the admin routes (text editing, publish, history, the
// edit-mode pages). index.ts calls this first from admin(); returning null
// means "not mine" and the request falls through to the rest.

import type { AdminCtx, Env } from "../index";
import { json, requireSameOrigin } from "./http";
import { editPage, editPageOf } from "./editpage";

export async function editorRoute(
  request: Request,
  env: Env,
  url: URL,
  ctx: AdminCtx,
): Promise<Response | null> {
  void ctx;
  const path = url.pathname;

  // The three pages with the draft rendered in and the editor hooks (E-01).
  const page = editPageOf(path);
  if (page) return editPage(request, env, url, page);

  if (path === "/api/admin/text") {
    const bad = requireSameOrigin(request);
    if (bad) return bad;
    // E-03 fills this in.
    if (request.method === "PUT") return json({ error: "not implemented" }, 501);
    return json({ error: "method not allowed" }, 405);
  }

  return null;
}
