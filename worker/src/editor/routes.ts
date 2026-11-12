// The editor's share of the admin routes (text editing, publish, history, the
// edit-mode pages). index.ts calls this first from admin(); returning null
// means "not mine" and the request falls through to the rest.

import type { AdminCtx, Env } from "../index";
import { json, requireSameOrigin } from "./http";
import registry from "../generated/registry.json";
import { editPage, editPageOf } from "./editpage";
import { textRoute } from "./text";

export async function editorRoute(
  request: Request,
  env: Env,
  url: URL,
  ctx: AdminCtx,
): Promise<Response | null> {
  const path = url.pathname;

  // The three pages with the draft rendered in and the editor hooks (E-01).
  const page = editPageOf(path);
  if (page) return editPage(request, env, url, page);

  // What the editor may edit and how long each value may be (E-04): the same
  // registry validate.ts checks writes against. GET, so no Origin check.
  if (path === "/api/admin/registry" && request.method === "GET") return json(registry);

  if (path === "/api/admin/text") {
    const bad = requireSameOrigin(request);
    if (bad) return bad;
    return textRoute(request, env, ctx);
  }

  return null;
}
