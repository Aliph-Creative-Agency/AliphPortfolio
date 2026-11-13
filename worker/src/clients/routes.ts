// The Clients admin routes (F5, CONTENT_API.md "Clients API"). index.ts hands
// every verified /api/admin/* request to clientsRoute() before the gallery's;
// null means "not mine".
//
// Contract for every write route (CONTENT_API.md "Validation"):
// requireSameOrigin → validate.ts → rev-locked write → audit row.

import type { AdminCtx, Env } from "../index";
import { json, requireSameOrigin } from "../gallery/routes";
import { clientsList } from "./read";
import { clientCreate, clientDelete, clientPathId, clientUpdate } from "./write";

const isMine = (path: string) => /^\/api\/admin\/clients(\/|$)/.test(path);

export async function clientsRoute(request: Request, env: Env, url: URL, ctx: AdminCtx): Promise<Response | null> {
  const path = url.pathname;
  if (!isMine(path)) return null;
  const method = request.method;

  // Checked before routing, so a new route cannot forget the guard.
  if (method !== "GET" && method !== "HEAD") {
    const bad = requireSameOrigin(request, url);
    if (bad) return bad;
  }

  if (path === "/api/admin/clients") {
    if (method === "GET") return json({ clients: await clientsList(env) });
    if (method === "POST") return clientCreate(request, env, ctx);
    return json({ error: "method not allowed" }, 405);
  }
  const id = clientPathId(path);
  if (id === null) return json({ error: "not found" }, 404);
  if (method === "PUT") return clientUpdate(request, env, id, ctx);
  if (method === "DELETE") return clientDelete(env, id, url, ctx);
  return json({ error: "method not allowed" }, 405);
}
