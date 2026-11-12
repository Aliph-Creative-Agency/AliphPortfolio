// ══════════════════════════════════════════════════════════════════
// Cloudflare Access, checked by the Worker itself.
//
// Access stands in front of /admin* at the edge and sends the signed-in
// admin's identity as a JWT (header Cf-Access-Jwt-Assertion, cookie
// CF_Authorization). The Worker does NOT trust that it ran: a request that
// reaches this script some other way (a misconfigured Access app, the
// workers.dev hostname, a path Access does not cover) must still be refused.
// So every admin request is verified here, and anything short of a valid,
// unexpired RS256 token for THIS application from THIS team is a 403.
//
// Fails CLOSED: no ACCESS_TEAM_DOMAIN / ACCESS_AUD → every admin request is
// refused. Plain WebCrypto, no library: RS256 is the one algorithm Access
// signs with, so it is the one algorithm accepted — `alg` is never used to
// pick the verifier (no "none", no HS256 with the public key as a secret).
//
// Dev bypass: ADMIN_DEV_BYPASS = "1" (set ONLY in .dev.vars, never in
// wrangler.toml) AND the request's own hostname is localhost / 127.0.0.1.
// On any real hostname the flag is ignored and the token is required.
// ══════════════════════════════════════════════════════════════════

export interface AccessEnv {
  /** e.g. "aliph.cloudflareaccess.com" (a leading https:// is tolerated). */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's Audience (AUD) tag. */
  ACCESS_AUD?: string;
  ADMIN_DEV_BYPASS?: string;
}

export type AccessResult = { ok: true; email: string } | { ok: false; reason: string };

export const DEV_ADMIN_EMAIL = "dev@localhost";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** /admin, /admin/…, /api/admin, /api/admin/… — the paths that need an admin.
 *  Decided on the DECODED, lower-cased path so /%61dmin or /ADMIN/ cannot
 *  slip past the check and reach a handler or an asset by another spelling. */
export function isAdminPath(pathname: string): boolean {
  let p: string;
  try {
    p = decodeURIComponent(pathname).toLowerCase();
  } catch {
    return true; // malformed escapes: treat as admin, i.e. demand a token
  }
  p = p.replace(/\/{2,}/g, "/");
  return /^\/(api\/)?admin(\/|$)/.test(p);
}

export async function verifyAccess(request: Request, env: AccessEnv): Promise<AccessResult> {
  const host = new URL(request.url).hostname;
  if (env.ADMIN_DEV_BYPASS === "1" && LOCAL_HOSTS.has(host)) {
    return { ok: true, email: DEV_ADMIN_EMAIL };
  }

  const team = (env.ACCESS_TEAM_DOMAIN ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const aud = (env.ACCESS_AUD ?? "").trim();
  if (!team || !aud) return { ok: false, reason: "access not configured" };

  const token = request.headers.get("Cf-Access-Jwt-Assertion") ?? readCookie(request, "CF_Authorization");
  if (!token) return { ok: false, reason: "no token" };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed token" };
  const [h, p, s] = parts;

  const header = decodeJson(h);
  const payload = decodeJson(p);
  const sig = b64urlBytes(s);
  if (!header || !payload || !sig) return { ok: false, reason: "malformed token" };
  if (header.alg !== "RS256") return { ok: false, reason: "alg" };
  if (typeof header.kid !== "string" || !header.kid) return { ok: false, reason: "no kid" };

  let key: CryptoKey | undefined;
  try {
    key = await jwksKey(team, header.kid);
  } catch {
    return { ok: false, reason: "jwks unavailable" };
  }
  if (!key) return { ok: false, reason: "unknown kid" };

  const signed = new TextEncoder().encode(`${h}.${p}`);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, signed);
  if (!valid) return { ok: false, reason: "bad signature" };

  // Claims, only after the signature holds.
  if (payload.iss !== `https://${team}`) return { ok: false, reason: "iss" };
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return { ok: false, reason: "aud" };
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now - LEEWAY_S) return { ok: false, reason: "expired" };
  if (payload.nbf !== undefined && (typeof payload.nbf !== "number" || payload.nbf > now + LEEWAY_S)) {
    return { ok: false, reason: "not yet valid" };
  }
  // Service tokens carry no email; only a person may edit the site.
  if (typeof payload.email !== "string" || !payload.email.includes("@")) return { ok: false, reason: "no email" };

  return { ok: true, email: payload.email.toLowerCase() };
}

/** Clock skew tolerated on exp/nbf, seconds. */
const LEEWAY_S = 30;

// ── JWKS: https://<team>/cdn-cgi/access/certs, cached per isolate ─────
// Access rotates its signing keys; a token whose kid we have not seen
// triggers ONE refetch, and at most one such refetch per MISS_REFETCH_MS, so a
// stream of junk kids cannot turn every request into a fetch to Access.
const JWKS_TTL_MS = 10 * 60 * 1000;
const MISS_REFETCH_MS = 30 * 1000;

interface JwksEntry {
  keys: Map<string, CryptoKey>;
  fetchedAt: number;
  lastMissRefetch: number;
}
const jwksCache = new Map<string, JwksEntry>();
const inflight = new Map<string, Promise<JwksEntry>>();

/** Tests only: forget every cached key set. */
export function resetJwksCache(): void {
  jwksCache.clear();
  inflight.clear();
}

async function jwksKey(team: string, kid: string): Promise<CryptoKey | undefined> {
  const now = Date.now();
  let entry = jwksCache.get(team);
  let fresh = false;
  if (!entry || now - entry.fetchedAt > JWKS_TTL_MS) {
    entry = await loadJwks(team, entry?.lastMissRefetch ?? 0);
    fresh = true;
  }
  const hit = entry.keys.get(kid);
  if (hit) return hit;
  // Just fetched and still unknown: asking again this instant would not help.
  if (fresh || now - entry.lastMissRefetch < MISS_REFETCH_MS) return undefined;
  entry.lastMissRefetch = now;
  entry = await loadJwks(team, now);
  return entry.keys.get(kid);
}

function loadJwks(team: string, lastMissRefetch: number): Promise<JwksEntry> {
  const pending = inflight.get(team);
  if (pending) return pending;
  const p = (async () => {
    const res = await fetch(`https://${team}/cdn-cgi/access/certs`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`jwks ${res.status}`);
    const body = (await res.json()) as { keys?: JsonWebKey[] };
    const keys = new Map<string, CryptoKey>();
    for (const jwk of body.keys ?? []) {
      const kid = (jwk as { kid?: unknown }).kid;
      if (jwk.kty !== "RSA" || typeof kid !== "string" || !jwk.n || !jwk.e) continue;
      try {
        const key = await crypto.subtle.importKey(
          "jwk",
          { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          false,
          ["verify"],
        );
        keys.set(kid, key);
      } catch {
        // one unusable key must not take the rest down with it
      }
    }
    const entry = { keys, fetchedAt: Date.now(), lastMissRefetch };
    jwksCache.set(team, entry);
    return entry;
  })().finally(() => inflight.delete(team));
  inflight.set(team, p);
  return p;
}

// ── small decoders ──────────────────────────────────────────────────
function b64urlBytes(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeJson(s: string): Record<string, any> | null {
  const bytes = b64urlBytes(s);
  if (!bytes) return null;
  try {
    const v = JSON.parse(new TextDecoder().decode(bytes));
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim() || null;
  }
  return null;
}
