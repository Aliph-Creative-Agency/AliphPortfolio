// Q-06 (QA): Origin / CSRF guard on every non-GET admin route.
// The Access cookie (CF_Authorization) is accepted as identity, so a page on
// another site that the signed-in admin visits could send a write with it.
// The guard (editor/http.ts requireSameOrigin, gallery/routes.ts
// requireSameOrigin, also used by clients/routes.ts) must refuse every
// non-GET/HEAD that does not carry the request's own Origin. Every request
// below is signed in (valid token), so a 403 can only come from the guard;
// the same request with the right Origin is the control (never 403).
// The route table is checked against the worker source: a new /api/admin
// path literal that is not listed here fails the "route table" test.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, installAccess, ORIGIN, post, uninstallAccess } from "../gallery/helpers";

// ── the route table (worker/src/{editor,gallery,clients}/routes.ts, index.ts)
// `id` stands for a real client id, filled in per test.
type Route = { path: string; methods: string[] };
const WRITES: Route[] = [
  { path: "/api/admin/text", methods: ["PUT", "DELETE"] },
  { path: "/api/admin/slot", methods: ["PUT", "DELETE"] },
  { path: "/api/admin/publish", methods: ["POST"] },
  { path: "/api/admin/discard", methods: ["POST"] },
  { path: "/api/admin/revisions/1/restore", methods: ["POST"] },
  { path: "/api/admin/gallery/order", methods: ["POST"] },
  { path: "/api/admin/gallery/assign", methods: ["POST"] },
  { path: "/api/admin/gallery/qa-item", methods: ["PUT", "DELETE"] },
  { path: "/api/admin/rings/qa-ring", methods: ["PUT", "DELETE"] },
  { path: "/api/admin/upload", methods: ["POST"] },
  { path: "/api/admin/upload/mpu", methods: ["POST", "DELETE"] },
  { path: "/api/admin/upload/mpu/part", methods: ["PUT"] },
  { path: "/api/admin/upload/mpu/complete", methods: ["POST"] },
  { path: "/api/admin/upload/cleanup", methods: ["POST"] },
  { path: "/api/admin/clients", methods: ["POST"] },
  { path: "/api/admin/clients/:id", methods: ["PUT", "DELETE"] },
];
// GET-only paths: any other method must still not succeed cross-site.
const READS = [
  "/api/admin/whoami", "/api/admin/content", "/api/admin/registry", "/api/admin/changes", "/api/admin/revisions",
  "/api/admin/gallery", "/api/admin/upload/unused", "/api/admin/media/admin/qa.jpg", "/api/admin/clients",
];
// Every /api/admin path literal (or prefix) the worker source names, mapped to
// the table entry that covers it. Keep in sync: the guard test below fails on
// any literal missing here.
const COVERED = new Set([
  "/api/admin", "/api/admin/", "/api/admin/text", "/api/admin/slot", "/api/admin/publish", "/api/admin/discard",
  "/api/admin/changes", "/api/admin/revisions", "/api/admin/revisions/", "/api/admin/gallery", "/api/admin/gallery/",
  "/api/admin/gallery/order", "/api/admin/gallery/assign", "/api/admin/rings/", "/api/admin/upload",
  "/api/admin/upload/mpu", "/api/admin/upload/mpu/part", "/api/admin/upload/mpu/complete", "/api/admin/upload/cleanup",
  "/api/admin/upload/unused", "/api/admin/media/", "/api/admin/clients", "/api/admin/clients/", "/api/admin/whoami",
  "/api/admin/content", "/api/admin/registry",
]);

const SOURCES = import.meta.glob("../../worker/src/**/*.{ts,mjs}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

// Origins a cross-site page (or a confused browser) could send.
const BAD_ORIGINS: [string, string | null][] = [
  ["foreign", "https://evil.example"],
  ["null (sandboxed iframe / file:)", "null"],
  ["missing (Referer only, same site)", null],
  ["localhost.evil.com", "http://localhost.evil.com"],
  ["suffix look-alike", "https://aliphcreative.com.evil.example"],
  ["prefix look-alike", "https://evil-aliphcreative.com"],
  ["http downgrade of our host", "http://aliphcreative.com"],
  ["trailing slash", "https://aliphcreative.com/"],
  ["explicit :443", "https://aliphcreative.com:443"],
  ["the other hostname (workers.dev)", "https://aliphcreative.ceo-6c6.workers.dev"],
  ["subdomain (media.)", "https://media.aliphcreative.com"],
  ["two origins", `${"https://evil.example"} ${ORIGIN}`],
];

let clientId = "";
const realPath = (p: string) => p.replace(":id", encodeURIComponent(clientId));

/** Everything a write could touch, as one comparable string. */
async function state(): Promise<string> {
  const tables = ["text_values", "slot_values", "gallery_items", "ring_picks", "clients", "revisions", "meta"];
  const rows = await Promise.all(tables.map(async (t) => [t, (await env.DB.prepare(`SELECT * FROM ${t}`).all()).results]));
  const audit = await env.DB.prepare("SELECT COALESCE(MAX(id), 0) AS n FROM audit").first<{ n: number }>();
  const media = await env.MEDIA_BUCKET.list({ prefix: "admin/" });
  return JSON.stringify({ rows, audit: audit?.n, media: media.objects.map((o) => o.key) });
}

// A body that would be a valid write for the routes that take JSON, so a
// missing guard would show up as a changed store, not as a 400.
const bodyFor = (path: string): string => {
  if (path.startsWith("/api/admin/clients")) return JSON.stringify({ rev: 1, name: { ar: "مُخترِق", en: "Pwned" } });
  if (path === "/api/admin/publish" || path === "/api/admin/discard") return JSON.stringify({});
  return JSON.stringify({ rev: 0, value: "pwned", ids: [], order: [] });
};

function send(path: string, method: string, origin: string | null, contentType = "text/plain;charset=UTF-8", base = ORIGIN, extraEnv = {}) {
  const hasBody = method !== "DELETE" && method !== "OPTIONS";
  return call(realPath(path), {
    method,
    origin,
    base,
    env: extraEnv,
    headers: { "content-type": contentType, Referer: base + "/admin/" },
    body: hasBody ? bodyFor(path) : undefined,
  });
}

beforeEach(async () => {
  await installAccess();
  const r = await post("/api/admin/clients", { name: { ar: "عميل", en: "QA client" } });
  expect(r.status).toBeLessThan(300);
  const j = (await r.json()) as { id?: string; client?: { id: string } };
  clientId = j.client?.id ?? j.id ?? "";
  expect(clientId).not.toBe("");
});
afterEach(uninstallAccess);

describe("Q-06 route table", () => {
  it("every /api/admin path the worker source names is in the table (a new route must be added here)", () => {
    const found = new Set<string>();
    for (const [file, src] of Object.entries(SOURCES)) {
      if (file.includes("/generated/")) continue;
      for (const m of src.replace(/\\\//g, "/").matchAll(/\/api\/admin[a-z0-9/_-]*/g)) found.add(m[0]);
    }
    const missing = [...found].filter((p) => !COVERED.has(p));
    expect(missing, "new admin path(s) in worker/src not covered by tests/qa/origin.test.ts").toEqual([]);
    expect(found.size).toBeGreaterThan(20);
  });
});

describe("Q-06 cross-site writes are refused and change nothing", () => {
  for (const { path, methods } of WRITES) {
    for (const method of methods) {
      it(`${method} ${path}`, async () => {
        const before = await state();
        for (const [name, origin] of BAD_ORIGINS) {
          const r = await send(path, method, origin);
          expect(r.status, `${name}: ${origin}`).toBe(403);
          expect(r.headers.get("cache-control"), name).toBe("no-store");
        }
        // form-encoded and multipart bodies (what a cross-site <form> can send)
        for (const ct of ["application/x-www-form-urlencoded", "multipart/form-data; boundary=x"]) {
          expect((await send(path, method, "https://evil.example", ct)).status, ct).toBe(403);
        }
        expect(await state(), "store or bucket changed by a refused request").toBe(before);
      });
    }
  }

  it("unlisted methods (PATCH, OPTIONS, PUT on POST routes…) cross-site: never 2xx, store unchanged", async () => {
    const before = await state();
    const paths = [...WRITES.map((w) => w.path), ...READS];
    for (const path of paths) {
      for (const method of ["POST", "PUT", "DELETE", "PATCH", "OPTIONS"]) {
        const r = await send(path, method, "https://evil.example");
        expect(r.status, `${method} ${path}`).toBeGreaterThanOrEqual(400);
      }
    }
    expect(await state()).toBe(before);
  });

  it("dev box: bypass identity on localhost still needs the localhost Origin", async () => {
    const before = await state();
    const dev = { ADMIN_DEV_BYPASS: "1" };
    for (const origin of ["https://evil.example", "http://localhost:9999", "http://127.0.0.1:8881", null]) {
      const r = await send("/api/admin/clients", "POST", origin, undefined, "http://localhost:8881", dev);
      expect(r.status, String(origin)).toBe(403);
    }
    expect(await state()).toBe(before);
    // control: its own origin is accepted
    const ok = await send("/api/admin/clients", "POST", "http://localhost:8881", "application/json", "http://localhost:8881", dev);
    expect(ok.status).toBeLessThan(300);
  });
});

describe("Q-06 the documented same-origin case", () => {
  for (const { path, methods } of WRITES) {
    for (const method of methods) {
      it(`${method} ${path} with our own Origin is not refused by the guard`, async () => {
        const r = await send(path, method, ORIGIN, "application/json");
        expect(r.status).not.toBe(403);
      });
    }
  }

  it("own Origin + text/plain body is accepted (pinned: same-origin only; a cross-site form cannot set Origin)", async () => {
    const r = await send("/api/admin/clients", "POST", ORIGIN, "text/plain;charset=UTF-8");
    expect(r.status).toBeLessThan(300);
  });

  it("the workers.dev hostname is its own origin: same-origin there works, aliphcreative.com Origin is refused there", async () => {
    const wd = "https://aliphcreative.ceo-6c6.workers.dev";
    expect((await send("/api/admin/clients", "POST", ORIGIN, "application/json", wd)).status).toBe(403);
    expect((await send("/api/admin/clients", "POST", wd, "application/json", wd)).status).toBeLessThan(300);
  });

  it("GET reads need no Origin (and no GET route writes: store unchanged after every read)", async () => {
    const before = await state();
    for (const path of READS) {
      const r = await call(path, { origin: null });
      expect(r.status, path).not.toBe(403);
    }
    expect(await state()).toBe(before);
  });
});
