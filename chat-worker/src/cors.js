/* ══════════════════════════════════════════════════════════════════
   CORS — plan §10.5: the widget's origin isn't settled yet, so the
   allowed list is configuration, not code.

   Default is the local preview only. An origin that isn't on the list
   gets a response with no CORS headers, which the browser blocks —
   the request is never answered *to that page*, which is the point.
   `ALLOWED_ORIGINS = "*"` exists for a throwaway staging box; it is
   not a default and shouldn't become one.
   ══════════════════════════════════════════════════════════════════ */

const DEFAULT_ORIGINS = [
  "http://localhost:8321",
  "http://127.0.0.1:8321",
];

export function allowedOrigins(env) {
  const raw = (env && env.ALLOWED_ORIGINS) || "";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

export function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const list = allowedOrigins(env);
  const ok = origin && (list.includes("*") || list.includes(origin));
  if (!ok) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-aliph-session",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(request, env) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

export function json(body, { status = 200, request, env, extra = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      /* nothing here is cacheable and one reply must never be served
         to a second visitor */
      "cache-control": "no-store",
      ...(request ? corsHeaders(request, env) : {}),
      ...extra,
    },
  });
}
