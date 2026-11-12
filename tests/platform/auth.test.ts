// P-03: Cloudflare Access JWT verification on /admin* and /api/admin*.
// A local RSA key pair stands in for the Access team's signing key; its JWKS
// is served by a stubbed fetch for https://<team>/cdn-cgi/access/certs.
import { createExecutionContext, env, SELF } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { isAdminPath, resetJwksCache } from "../../worker/src/auth";

const TEAM = "aliph-test.cloudflareaccess.com";
const AUD = "aud-0123456789abcdef";
const ISS = `https://${TEAM}`;
const CERTS = `${ISS}/cdn-cgi/access/certs`;
const EMAIL = "info@aliphcreative.com";

const RSA = { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };

let keyA: CryptoKeyPair; // published in the JWKS as kid "A"
let keyB: CryptoKeyPair; // a rotation: published as kid "B" only after rotate()
let jwks: { keys: JsonWebKey[] };
let fetchSpy: ReturnType<typeof vi.spyOn>;
let certFetches = 0;

const b64url = (bytes: Uint8Array | ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));

async function pub(pair: CryptoKeyPair, kid: string): Promise<JsonWebKey> {
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  return { ...jwk, kid, alg: "RS256", use: "sig" } as JsonWebKey;
}

async function sign(
  claims: Record<string, unknown> = {},
  opts: { kid?: string; alg?: string; key?: CryptoKey } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: opts.alg ?? "RS256", kid: opts.kid ?? "A", typ: "JWT" };
  const payload = { iss: ISS, aud: [AUD], email: EMAIL, iat: now, nbf: now, exp: now + 600, sub: "u1", ...claims };
  const input = `${enc(header)}.${enc(payload)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", opts.key ?? keyA.privateKey, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

const accessEnv = (extra: Partial<Env> = {}): Env => ({ ...env, ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ...extra });

function call(path: string, init: RequestInit = {}, e: Env = accessEnv(), host = "https://aliphcreative.com") {
  return worker.fetch(new Request(host + path, init), e, createExecutionContext());
}
const withToken = (t: string): RequestInit => ({ headers: { "Cf-Access-Jwt-Assertion": t } });

beforeAll(async () => {
  keyA = (await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])) as CryptoKeyPair;
  keyB = (await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])) as CryptoKeyPair;
});

beforeEach(async () => {
  resetJwksCache();
  certFetches = 0;
  jwks = { keys: [await pub(keyA, "A")] };
  const real = globalThis.fetch;
  fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === CERTS) {
      certFetches++;
      return Response.json(jwks);
    }
    return real(input, init);
  });
});

afterEach(() => {
  fetchSpy.mockRestore();
});

describe("admin paths", () => {
  it("covers /admin and /api/admin by any spelling, and nothing public", () => {
    for (const p of ["/admin", "/admin/", "/admin/edit/about", "/api/admin", "/api/admin/whoami", "/%61dmin/", "/ADMIN", "//admin/", "/api//admin/x", "/%E0%A4%A"]) {
      expect(isAdminPath(p), p).toBe(true);
    }
    for (const p of ["/", "/about", "/library/", "/api/content", "/administrator", "/main.js"]) {
      expect(isAdminPath(p), p).toBe(false);
    }
  });
});

describe("Access JWT", () => {
  it("good token → 200 and the email reaches the handler", async () => {
    const r = await call("/api/admin/whoami", withToken(await sign()));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ email: EMAIL });
  });

  it("falls back to the CF_Authorization cookie", async () => {
    const t = await sign({ email: "CEO@aliphcreative.com" });
    const r = await call("/api/admin/whoami", { headers: { Cookie: `other=1; CF_Authorization=${t}` } });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ email: "ceo@aliphcreative.com" });
  });

  it("aud as a plain string is accepted too", async () => {
    expect((await call("/api/admin/whoami", withToken(await sign({ aud: AUD })))).status).toBe(200);
  });

  it("a verified /admin page request passes on to the assets", async () => {
    const r = await call("/admin/", withToken(await sign()));
    expect(r.status).not.toBe(403);
  });

  const refused: [string, () => Promise<RequestInit>][] = [
    ["no header", async () => ({})],
    ["garbage token", async () => withToken("not.a.jwt")],
    ["two-part token", async () => withToken("eyJhbGciOiJSUzI1NiJ9.eyJ9")],
    ["wrong aud", async () => withToken(await sign({ aud: ["someone-else"] }))],
    ["wrong iss", async () => withToken(await sign({ iss: "https://evil.cloudflareaccess.com" }))],
    ["bad signature (other key, same kid)", async () => withToken(await sign({}, { key: keyB.privateKey }))],
    ["tampered payload", async () => {
      const [h, , s] = (await sign()).split(".");
      return withToken(`${h}.${enc({ iss: ISS, aud: [AUD], email: "x@evil.com", exp: 9e9 })}.${s}`);
    }],
    ["expired", async () => withToken(await sign({ exp: Math.floor(Date.now() / 1000) - 120 }))],
    ["no exp", async () => withToken(await sign({ exp: undefined }))],
    ["not yet valid", async () => withToken(await sign({ nbf: Math.floor(Date.now() / 1000) + 600 }))],
    ["no email (service token)", async () => withToken(await sign({ email: undefined, common_name: "svc" }))],
    ["alg none", async () => {
      const t = `${enc({ alg: "none", kid: "A" })}.${enc({ iss: ISS, aud: [AUD], email: EMAIL, exp: 9e9 })}.`;
      return withToken(t);
    }],
    ["alg HS256 keyed with the public JWK", async () => {
      const input = `${enc({ alg: "HS256", kid: "A" })}.${enc({ iss: ISS, aud: [AUD], email: EMAIL, exp: 9e9 })}`;
      const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(JSON.stringify(jwks.keys[0])), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(input));
      return withToken(`${input}.${b64url(sig)}`);
    }],
    ["unknown kid", async () => withToken(await sign({}, { kid: "Z" }))],
    // a valid RSA-SHA256 signature under a header that names another alg:
    // only the alg check itself can refuse this one
    ["alg RS384 header over an RS256 signature", async () => withToken(await sign({}, { alg: "RS384" }))],
    ["alg PS256 header over an RS256 signature", async () => withToken(await sign({}, { alg: "PS256" }))],
  ];
  for (const [name, init] of refused) {
    it(`${name} → 403`, async () => {
      for (const path of ["/api/admin/whoami", "/admin/"]) {
        const r = await call(path, await init());
        expect(r.status, path).toBe(403);
        expect(r.headers.get("cache-control")).toBe("no-store");
      }
    });
  }

  it("JWKS unreachable → 403 (fail closed)", async () => {
    fetchSpy.mockImplementation(async () => new Response("down", { status: 503 }));
    expect((await call("/api/admin/whoami", withToken(await sign()))).status).toBe(403);
  });

  it("missing env → 403 even with a good token", async () => {
    const t = await sign();
    expect((await call("/api/admin/whoami", withToken(t), accessEnv({ ACCESS_AUD: "" }))).status).toBe(403);
    expect((await call("/api/admin/whoami", withToken(t), accessEnv({ ACCESS_TEAM_DOMAIN: undefined }))).status).toBe(403);
    // and as deployed from wrangler.toml today (empty placeholders)
    expect((await SELF.fetch("https://aliphcreative.com/api/admin/whoami", withToken(t))).status).toBe(403);
    expect((await SELF.fetch("https://aliphcreative.com/admin/", withToken(t))).status).toBe(403);
  });
});

describe("JWKS cache", () => {
  it("fetches once, then serves from memory", async () => {
    const t = await sign();
    for (let i = 0; i < 3; i++) expect((await call("/api/admin/whoami", withToken(t))).status).toBe(200);
    expect(certFetches).toBe(1);
  });

  it("an unknown kid on a cold cache costs one fetch, not two", async () => {
    expect((await call("/api/admin/whoami", withToken(await sign({}, { kid: "Q" })))).status).toBe(403);
    expect(certFetches).toBe(1);
  });

  it("a rotated key (unknown kid) triggers ONE refetch, then is accepted", async () => {
    expect((await call("/api/admin/whoami", withToken(await sign()))).status).toBe(200);
    jwks = { keys: [await pub(keyA, "A"), await pub(keyB, "B")] };
    const tB = await sign({}, { kid: "B", key: keyB.privateKey });
    expect((await call("/api/admin/whoami", withToken(tB))).status).toBe(200);
    expect(certFetches).toBe(2);
    // junk kids right after do not each cost a fetch to Access
    for (const kid of ["X", "Y", "Z"]) {
      expect((await call("/api/admin/whoami", withToken(await sign({}, { kid })))).status).toBe(403);
    }
    expect(certFetches).toBe(2);
  });
});

describe("dev bypass", () => {
  const dev = (extra: Partial<Env> = {}) => accessEnv({ ADMIN_DEV_BYPASS: "1", ...extra });

  it("localhost and 127.0.0.1 with the flag → dev@localhost, no token", async () => {
    for (const host of ["http://localhost:8831", "http://127.0.0.1:8831"]) {
      const r = await call("/api/admin/whoami", {}, dev(), host);
      expect(r.status, host).toBe(200);
      expect(await r.json()).toEqual({ email: "dev@localhost" });
    }
    // works even with Access unconfigured (local dev has no team)
    expect((await call("/api/admin/whoami", {}, dev({ ACCESS_AUD: "" }), "http://localhost:8831")).status).toBe(200);
  });

  it("refused on a real hostname, even with the flag", async () => {
    for (const host of ["https://aliphcreative.com", "https://aliphcreative.ceo-6c6.workers.dev", "http://localhost.evil.com"]) {
      expect((await call("/api/admin/whoami", {}, dev(), host)).status, host).toBe(403);
    }
  });

  it("flag must be exactly \"1\"", async () => {
    for (const v of ["true", "yes", "0", ""]) {
      expect((await call("/api/admin/whoami", {}, dev({ ADMIN_DEV_BYPASS: v }), "http://localhost:8831")).status).toBe(403);
    }
  });
});

describe("public routes untouched", () => {
  it("/ and /api/content do not ask for a token", async () => {
    expect((await SELF.fetch("https://aliphcreative.com/")).status).toBe(200);
    expect((await SELF.fetch("https://aliphcreative.com/api/content")).status).not.toBe(403);
  });
});
