// Small HTTP helpers shared by every editor handler (routes, save, publish,
// history). One place for the JSON shape, the Origin guard and body parsing.

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

/** CSRF guard for the admin API. The Access cookie is accepted as identity, so
 *  without this a cross-site form could write. Any request that is not GET/HEAD
 *  must carry an Origin header equal to the request URL's own origin; a missing
 *  or foreign one is a 403. Returns the 403 response, or null when fine. */
export function requireSameOrigin(request: Request): Response | null {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const origin = request.headers.get("origin");
  if (origin && origin === new URL(request.url).origin) return null;
  return new Response("Forbidden", {
    status: 403,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

/** The request body as a JSON object, or null when it is not one. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const v = await request.json();
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
