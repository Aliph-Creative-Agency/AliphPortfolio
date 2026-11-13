// Q-05 (QA): Cloudflare Access JWT, attacked from outside, against
// worker/src/auth.ts. tests/platform/auth.test.ts is the build team's own
// spec; this file is the independent pass: every case it does not already
// cover, plus the asset-layer spellings of /admin that could skip the check.
// A local RSA key stands in for the Access signing key; its JWKS is served by
// a stubbed fetch, so nothing here ever reaches the real Access team.
// Every refusal must be 403 + no-store; `it` pins behaviour that is right
// today, `it.fails("F-NN …")` would prove a current bug (none found).
import { createExecutionContext, env, SELF } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { resetJwksCache } from "../../worker/src/auth";

const TEAM = "qa-team.cloudflareaccess.com";
const AUD = "aud-qa-5f3e";
const ISS = `https://${TEAM}`;
const CERTS = `${ISS}/cdn-cgi/access/certs`;
const EMAIL = "qa@aliphcreative.com";
const RSA = { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };

let good: CryptoKeyPair; // published as kid "A"
let evil: CryptoKeyPair; // the attacker's own key, never published
let jwkA: JsonWebKey;
let spy: ReturnType<typeof vi.spyOn>;
let foreignFetches: string[] = [];

const b64url = (b: Uint8Array | ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
const now = () => Math.floor(Date.now() / 1000);

async function sign(
  claims: Record<string, unknown> = {},
  head: Record<string, unknown> = {},
  key: CryptoKey = good.privateKey,
): Promise<string> {
  const header = { alg: "RS256", kid: "A", typ: "JWT", ...head };
  const t = now();
  const payload = { iss: ISS, aud: [AUD], email: EMAIL, iat: t, nbf: t, exp: t + 600, sub: "qa", ...claims };
  const input = `${enc(header)}.${enc(payload)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

async function hs256(secret: Uint8Array, claims: Record<string, unknown> = {}): Promise<string> {
  const input = `${enc({ alg: "HS256", kid: "A", typ: "JWT" })}.${enc({ iss: ISS, aud: [AUD], email: EMAIL, exp: now() + 600, ...claims })}`;
  const k = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `${input}.${b64url(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(input)))}`;
}

const accessEnv = (extra: Partial<Env> = {}): Env =>
  ({ ...env, ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, ADMIN_DEV_BYPASS: undefined, ...extra }) as Env;

function call(path: string, init: RequestInit = {}, e: Env = accessEnv(), origin = "https://aliphcreative.com") {
  return worker.fetch(new Request(origin + path, init), e, createExecutionContext());
}
const hdr = (t: string): RequestInit => ({ headers: { "Cf-Access-Jwt-Assertion": t } });

// Three doors an admin identity opens: the API, the admin pages, and the
// draft read on the public /api/content route (which calls verifyAccess itself).
const DOORS = ["/api/admin/whoami", "/admin/", "/api/content?state=draft"];

async function refusedEverywhere(init: RequestInit, e: Env = accessEnv(), origin?: string) {
  for (const p of DOORS) {
    const r = await call(p, init, e, origin);
    expect(r.status, `${origin ?? ""}${p}`).toBe(403);
    expect(r.headers.get("cache-control"), p).toBe("no-store");
    // the refusal names no reason (no oracle for an attacker tuning a token)
    expect(await r.text(), p).toBe("Forbidden");
  }
}

async function acceptedWhoami(init: RequestInit, e: Env = accessEnv(), origin?: string) {
  const r = await call("/api/admin/whoami", init, e, origin);
  expect(r.status).toBe(200);
  return (await r.json()) as { email: string };
}

beforeAll(async () => {
  good = (await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])) as CryptoKeyPair;
  evil = (await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])) as CryptoKeyPair;
  jwkA = { ...((await crypto.subtle.exportKey("jwk", good.publicKey)) as JsonWebKey), kid: "A", alg: "RS256", use: "sig" } as JsonWebKey;
});

beforeEach(() => {
  resetJwksCache();
  foreignFetches = [];
  const real = globalThis.fetch;
  spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === CERTS) return Response.json({ keys: [jwkA] });
    if (/^https?:\/\//.test(url) && !url.startsWith("https://aliphcreative.com")) foreignFetches.push(url);
    return real(input, init);
  });
});

afterEach(() => {
  spy.mockRestore();
  // no token, header or env value may make the Worker fetch a URL of the
  // attacker's choosing (jku / x5u / a forged iss)
  expect(foreignFetches).toEqual([]);
});

describe("Q-05 control: a good token opens all three doors", () => {
  it("whoami 200, /admin/ not 403, draft read 200", async () => {
    const t = await sign();
    expect(await acceptedWhoami(hdr(t))).toEqual({ email: EMAIL });
    expect((await call("/admin/", hdr(t))).status).not.toBe(403);
    expect((await call("/api/content?state=draft", hdr(t))).status).toBe(200);
  });
});

describe("Q-05 tokens that must be refused", () => {
  const t0 = () => now();
  const cases: [string, () => Promise<RequestInit>][] = [
    // missing / where the token is carried
    ["missing token", async () => ({})],
    ["empty header", async () => hdr("")],
    ["Authorization: Bearer <valid> (only Access's header/cookie count)", async () => ({ headers: { Authorization: `Bearer ${await sign()}` } })],
    ["header 'Bearer <valid>'", async () => hdr(`Bearer ${await sign()}`)],
    ["empty header beats a valid cookie (header wins, fails closed)", async () => ({
      headers: { "Cf-Access-Jwt-Assertion": "", Cookie: `CF_Authorization=${await sign()}` },
    })],
    ["bad header beats a valid cookie", async () => ({
      headers: { "Cf-Access-Jwt-Assertion": await sign({}, {}, evil.privateKey), Cookie: `CF_Authorization=${await sign()}` },
    })],
    ["cookie with a look-alike name", async () => ({ headers: { Cookie: `XCF_Authorization=${await sign()}; CF_Authorization_=${await sign()}` } })],
    // time
    ["expired 35 s ago (past the 30 s leeway)", async () => hdr(await sign({ exp: t0() - 35 }))],
    ["expired an hour ago", async () => hdr(await sign({ exp: t0() - 3600 }))],
    ["exp as a numeric string", async () => hdr(await sign({ exp: String(t0() + 600) }))],
    ["exp null", async () => hdr(await sign({ exp: null }))],
    ["nbf 35 s in the future", async () => hdr(await sign({ nbf: t0() + 35 }))],
    ["nbf a day in the future", async () => hdr(await sign({ nbf: t0() + 86400 }))],
    ["nbf null", async () => hdr(await sign({ nbf: null }))],
    ["nbf as a string", async () => hdr(await sign({ nbf: "0" }))],
    // audience / issuer
    ["wrong aud", async () => hdr(await sign({ aud: ["another-app"] }))],
    ["aud = AUD + suffix", async () => hdr(await sign({ aud: [AUD + "x"] }))],
    ["aud = prefix of AUD", async () => hdr(await sign({ aud: [AUD.slice(0, -1)] }))],
    ["aud missing", async () => hdr(await sign({ aud: undefined }))],
    ["aud as an object", async () => hdr(await sign({ aud: { 0: AUD } }))],
    ["wrong iss (another team)", async () => hdr(await sign({ iss: "https://evil.cloudflareaccess.com" }))],
    ["iss with a trailing slash", async () => hdr(await sign({ iss: ISS + "/" }))],
    ["iss over http", async () => hdr(await sign({ iss: `http://${TEAM}` }))],
    ["iss missing", async () => hdr(await sign({ iss: undefined }))],
    // algorithm confusion
    ["alg none, empty signature", async () => hdr(`${enc({ alg: "none", kid: "A" })}.${enc({ iss: ISS, aud: [AUD], email: EMAIL, exp: 9e9 })}.`)],
    ["alg None", async () => hdr(`${enc({ alg: "None", kid: "A" })}.${enc({ iss: ISS, aud: [AUD], email: EMAIL, exp: 9e9 })}.`)],
    ["alg NONE with a real RS256 signature", async () => hdr(await sign({}, { alg: "NONE" }))],
    ["alg rs256 (lower case) with a real signature", async () => hdr(await sign({}, { alg: "rs256" }))],
    ["alg missing", async () => hdr(await sign({}, { alg: undefined }))],
    ["HS256 keyed with the JWKS JSON", async () => hdr(await hs256(new TextEncoder().encode(JSON.stringify(jwkA))))],
    ["HS256 keyed with the raw modulus", async () => {
      const n = jwkA.n!.replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(n + "=".repeat((4 - (n.length % 4)) % 4));
      return hdr(await hs256(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    }],
    ["HS256 keyed with the SPKI DER", async () =>
      hdr(await hs256(new Uint8Array((await crypto.subtle.exportKey("spki", good.publicKey)) as ArrayBuffer)))],
    // key selection
    ["unknown kid", async () => hdr(await sign({}, { kid: "Z" }))],
    ["kid missing", async () => hdr(await sign({}, { kid: undefined }))],
    ["kid empty", async () => hdr(await sign({}, { kid: "" }))],
    ["kid as a number", async () => hdr(await sign({}, { kid: 1 }))],
    ["kid __proto__", async () => hdr(await sign({}, { kid: "__proto__" }))],
    ["kid constructor", async () => hdr(await sign({}, { kid: "constructor" }))],
    ["attacker key embedded as header jwk", async () => {
      const jwk = await crypto.subtle.exportKey("jwk", evil.publicKey);
      return hdr(await sign({}, { jwk }, evil.privateKey));
    }],
    ["header jku/x5u pointing at the attacker", async () =>
      hdr(await sign({}, { kid: "Z", jku: "https://evil.example/jwks", x5u: "https://evil.example/x5" }, evil.privateKey))],
    // signature / shape
    ["signed by the attacker under kid A", async () => hdr(await sign({}, {}, evil.privateKey))],
    ["signature truncated", async () => hdr((await sign()).slice(0, -4))],
    ["signature stripped", async () => hdr((await sign()).replace(/\.[^.]*$/, "."))],
    ["signature with = padding", async () => hdr((await sign()) + "==")],
    ["payload swapped for another email (sig kept)", async () => {
      const [h, , s] = (await sign()).split(".");
      return hdr(`${h}.${enc({ iss: ISS, aud: [AUD], email: "attacker@evil.com", exp: 9e9 })}.${s}`);
    }],
    ["header swapped (kid changed, sig kept)", async () => {
      const [, p, s] = (await sign()).split(".");
      return hdr(`${enc({ alg: "RS256", kid: "B" })}.${p}.${s}`);
    }],
    ["four parts", async () => hdr((await sign()) + ".x")],
    ["space inside the token", async () => hdr((await sign()).replace(".", ". "))],
    ["payload is a JSON array", async () => {
      const [h, , s] = (await sign()).split(".");
      return hdr(`${h}.${enc([ISS, AUD, EMAIL])}.${s}`);
    }],
    ["header is not JSON", async () => {
      const [, p, s] = (await sign()).split(".");
      return hdr(`${b64url(new TextEncoder().encode("RS256"))}.${p}.${s}`);
    }],
    // identity
    ["no email (service token)", async () => hdr(await sign({ email: undefined, common_name: "svc.access" }))],
    ["email without @", async () => hdr(await sign({ email: "qa.aliphcreative.com" }))],
    ["email as an array", async () => hdr(await sign({ email: [EMAIL] }))],
    ["email as a number", async () => hdr(await sign({ email: 42 }))],
  ];
  for (const [name, init] of cases) {
    it(`${name} → 403 on every door`, async () => {
      await refusedEverywhere(await init());
    });
  }
});

describe("Q-05 accepted shapes (pinned, correct today)", () => {
  it("exp 25 s ago is still accepted: the 30 s leeway (auth.ts LEEWAY_S)", async () => {
    expect(await acceptedWhoami(hdr(await sign({ exp: now() - 25 })))).toEqual({ email: EMAIL });
  });
  it("nbf 25 s ahead is accepted (same leeway)", async () => {
    expect(await acceptedWhoami(hdr(await sign({ nbf: now() + 25 })))).toEqual({ email: EMAIL });
  });
  it("aud list containing ours among others is accepted", async () => {
    expect(await acceptedWhoami(hdr(await sign({ aud: ["other", AUD] })))).toEqual({ email: EMAIL });
  });
  it("valid header wins over a garbage cookie", async () => {
    expect(await acceptedWhoami({ headers: { "Cf-Access-Jwt-Assertion": await sign(), Cookie: "CF_Authorization=junk" } })).toEqual({ email: EMAIL });
  });
  it("cookie is read when the header is absent, first CF_Authorization wins", async () => {
    const r = await acceptedWhoami({ headers: { Cookie: `a=1; CF_Authorization=${await sign()}; CF_Authorization=junk` } });
    expect(r).toEqual({ email: EMAIL });
  });
  it("surrounding whitespace in the header is trimmed by Headers (fetch spec), token still verified", async () => {
    expect(await acceptedWhoami(hdr(` ${await sign()} `))).toEqual({ email: EMAIL });
  });
  it("email is lower-cased (one admin, one audit identity)", async () => {
    expect(await acceptedWhoami(hdr(await sign({ email: "QA@AliphCreative.com" })))).toEqual({ email: EMAIL });
  });
});

describe("Q-05 dev bypass only on the request's own loopback hostname", () => {
  const dev = (v = "1") => accessEnv({ ADMIN_DEV_BYPASS: v });

  const hosts = [
    "https://aliphcreative.com",
    "https://aliphcreative.ceo-6c6.workers.dev",
    "http://localhost.evil.com",
    "http://127.0.0.1.nip.io",
    "http://localhost.:8881", // trailing-dot FQDN form is not in the allow-list
    "http://[::1]:8881", // IPv6 loopback is not in the allow-list (refused = fail closed)
    "http://localhost@evil.com", // userinfo, hostname is evil.com
    "http://localhost%2eevil.com",
    "http://0.0.0.0:8881",
    "http://10.0.0.5:8881", // LAN address of the dev box
  ];
  for (const h of hosts) {
    it(`flag set, ${h} → 403`, async () => {
      await refusedEverywhere({}, dev(), h);
    });
  }

  it("Host / X-Forwarded-Host / Forwarded / client-IP headers do not turn a real hostname local", async () => {
    const spoof = {
      Host: "localhost",
      "X-Forwarded-Host": "localhost",
      "X-Forwarded-For": "127.0.0.1",
      "X-Real-IP": "127.0.0.1",
      "CF-Connecting-IP": "127.0.0.1",
      Forwarded: "for=127.0.0.1;host=localhost",
      "X-Original-URL": "http://localhost/api/admin/whoami",
    };
    await refusedEverywhere({ headers: spoof }, dev(), "https://aliphcreative.com");
    await refusedEverywhere({ headers: spoof }, dev(), "http://localhost.evil.com");
  });

  it("flag values other than exactly \"1\" on localhost → 403", async () => {
    for (const v of ["1 ", " 1", "01", "true", "TRUE", "on"]) {
      const r = await call("/api/admin/whoami", {}, dev(v), "http://localhost:8881");
      expect(r.status, JSON.stringify(v)).toBe(403);
    }
  });

  it("bypass with Access unconfigured is still refused off-box", async () => {
    await refusedEverywhere({}, accessEnv({ ADMIN_DEV_BYPASS: "1", ACCESS_AUD: "", ACCESS_TEAM_DOMAIN: "" }), "https://aliphcreative.com");
  });

  it("loopback spellings the URL parser normalises are loopback (pinned, harmless)", async () => {
    for (const h of ["http://LOCALHOST:8881", "http://127.1:8881", "http://0x7f000001:8881"]) {
      expect((await call("/api/admin/whoami", {}, dev(), h)).status, h).toBe(200);
    }
  });

  it("without the flag localhost needs a token like everyone else", async () => {
    await refusedEverywhere({}, accessEnv(), "http://localhost:8881");
  });
});

// The real router (SELF, with wrangler.toml's [assets] + run_worker_first):
// no spelling of the admin path may reach an admin asset without the Worker's
// check. No token is sent, so the configured live team is never contacted.
describe("Q-05 asset-layer spellings of /admin", () => {
  const ADMIN_MARK = /Aliph admin|adm-bar|editor\.js|gallery\.js/;
  const paths = [
    "/admin", "/admin/", "/admin/index.html", "/admin/editor.js", "/admin/admin.css", "/admin/gallery/",
    "/admin/gallery/index.html", "/admin/gallery/gallery.js", "/admin/shared/media.js",
    "/%61dmin/", "/%61dmin/index.html", "/%61dmin/editor.js", "/a%64min/gallery/gallery.js",
    "/ADMIN/", "/Admin/index.html", "/ADMIN/editor.js",
    "/admin%2findex.html", "/admin%2Feditor.js", "//admin/", "/./admin/", "/x/../admin/index.html",
    "/%2e/admin/", "/admin%5Ceditor.js", "/admin/%2e%2e/admin/index.html",
    "/admin.html", "/admin/index", "/admin;/", "/admin%00/", "/admin%20/",
    "/api/%61dmin/whoami", "/api/ADMIN/whoami", "/api//admin/whoami", "/API/admin/whoami",
  ];
  for (const p of paths) {
    it(`${p} → 403, or a non-admin 404`, async () => {
      const r = await SELF.fetch("https://aliphcreative.com" + p, { redirect: "manual" });
      const body = await r.text();
      if (r.status === 403) return;
      // a redirect is fine as long as it points back into /admin (checked again there)
      if (r.status >= 300 && r.status < 400) {
        const to = new URL(r.headers.get("location") ?? "", "https://aliphcreative.com").pathname;
        expect(to, `${p} redirected to ${to}`).toMatch(/^\/(api\/)?admin(\/|$)/i);
        return;
      }
      expect(ADMIN_MARK.test(body), `${p} served admin content with status ${r.status}`).toBe(false);
      expect(r.status, p).not.toBe(200);
    });
  }
});
