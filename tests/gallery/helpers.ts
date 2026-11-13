// Shared by the gallery worker tests: an Access stand-in (same scheme as
// tests/platform/content-api.test.ts), `call()` against the Worker, and
// same-origin put/post helpers. Use `installAccess()` in beforeEach.
import { createExecutionContext, env } from "cloudflare:test";
import { vi } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { resetJwksCache } from "../../worker/src/auth";

export const ORIGIN = "https://aliphcreative.com";
const TEAM = "aliph-test.cloudflareaccess.com";
const AUD = "aud-gallery";
const ISS = `https://${TEAM}`;
export const ADMIN = "ceo@aliphcreative.com";
const RSA = { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };

let key: CryptoKeyPair | undefined;
let spy: ReturnType<typeof vi.spyOn> | undefined;
/** audit is append-only (a trigger refuses DELETE): tests read rows above this id. */
export let auditFloor = 0;

const b64url = (b: Uint8Array | ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

async function token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const input = `${enc({ alg: "RS256", kid: "K", typ: "JWT" })}.${enc({ iss: ISS, aud: [AUD], email: ADMIN, iat: now, nbf: now, exp: now + 600 })}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key!.privateKey, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

/** Call in beforeEach: serves the JWKS for the stand-in key and clears the
 *  content tables. Pair with `uninstallAccess()` in afterEach. */
export async function installAccess(): Promise<void> {
  key ??= (await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])) as CryptoKeyPair;
  resetJwksCache();
  const jwk = { ...((await crypto.subtle.exportKey("jwk", key.publicKey)) as JsonWebKey), kid: "K", alg: "RS256" };
  const real = globalThis.fetch;
  spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === `${ISS}/cdn-cgi/access/certs`) return Response.json({ keys: [jwk] });
    return real(input, init);
  });
  await env.DB.batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => env.DB.prepare(`DELETE FROM ${t}`)),
  );
  await env.DB.prepare("UPDATE meta SET v = '0' WHERE k = 'publish_rev'").run();
  auditFloor = (await env.DB.prepare("SELECT coalesce(max(id), 0) AS m FROM audit").first<{ m: number }>())!.m;
  await clearMedia();
}

/** Empties admin/ in the local test bucket (storage outlives a test). */
export async function clearMedia(): Promise<void> {
  for (;;) {
    const l = await env.MEDIA_BUCKET.list({ prefix: "admin/" });
    if (!l.objects.length) break;
    await env.MEDIA_BUCKET.delete(l.objects.map((o) => o.key));
  }
}
export function uninstallAccess(): void {
  spy?.mockRestore();
}

export const E = (extra: Partial<Env> = {}): Env => ({ ...env, ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ...extra });

type Init = RequestInit & { origin?: string | null; base?: string; env?: Partial<Env> };

/** A signed-in admin request. `origin: null` sends no Origin header, a string
 *  sends that (foreign) one; the default is the request's own origin on every
 *  non-GET. */
export async function call(path: string, init: Init = {}): Promise<Response> {
  const { origin, base = ORIGIN, env: extra, ...rest } = init;
  const h = new Headers(rest.headers);
  h.set("Cf-Access-Jwt-Assertion", await token());
  if (origin === undefined) {
    if ((rest.method ?? "GET") !== "GET") h.set("Origin", base);
  } else if (origin !== null) h.set("Origin", origin);
  return worker.fetch(new Request(base + path, { ...rest, headers: h }), E(extra), createExecutionContext());
}

const jsonInit = (method: string, body: unknown, init: Init): Init => ({
  ...init,
  method,
  body: JSON.stringify(body),
  headers: { "content-type": "application/json", ...(init.headers as Record<string, string> | undefined) },
});
export const put = (path: string, body: unknown, init: Init = {}) => call(path, jsonInit("PUT", body, init));
export const post = (path: string, body: unknown, init: Init = {}) => call(path, jsonInit("POST", body, init));
export const del = (path: string, init: Init = {}) => call(path, { ...init, method: "DELETE" });
