// The editor's share of the admin routes (text editing, publish, history, the
// edit-mode pages). index.ts calls this first from admin(); returning null
// means "not mine" and the request falls through to the rest.

import type { AdminCtx, Env } from "../index";
import { json, requireSameOrigin } from "./http";
import registry from "../generated/registry.json";
import { editPage, editPageOf } from "./editpage";
import { textRoute } from "./text";
import { slotRoute } from "./slot";
import { publishRoute } from "./publish";
import { historyRoute, isHistoryPath } from "./history";

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

  // One media holder's draft: save, reset (E-14).
  if (path === "/api/admin/slot") {
    const bad = requireSameOrigin(request);
    if (bad) return bad;
    return slotRoute(request, env, url, ctx);
  }

  // What would go live, publish it, or throw the text/slot drafts away (E-06).
  if (path === "/api/admin/changes" || path === "/api/admin/publish" || path === "/api/admin/discard") {
    const bad = requireSameOrigin(request);
    if (bad) return bad;
    return publishRoute(path, request, env, ctx);
  }

  // Published revisions, and restoring one into the draft (E-07).
  if (isHistoryPath(path)) {
    const bad = requireSameOrigin(request);
    if (bad) return bad;
    return historyRoute(path, request, env, url, ctx);
  }

  return null;
}
