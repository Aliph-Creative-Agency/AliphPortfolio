// P-09: publish() (worker/src/publish.ts) and the published-content cache
// (worker/src/cache.ts). Caching is OFF in the shared test config
// (CONTENT_CACHE_TTL_MS = "0"); every request here passes an env with it ON.
import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { resetContentCache } from "../../worker/src/cache";
import { publish } from "../../worker/src/publish";
import { readSnapshot } from "../../worker/src/store";

const ORIGIN = "https://aliphcreative.com";
const BY = "ceo@aliphcreative.com";
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
const one = <T>(sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).first<T>();

/** env.DB behind a proxy that records every call the Worker makes on it. */
function spiedDb(calls: string[], before?: (method: string, args: unknown[]) => Promise<void>): D1Database {
  const target = env.DB;
  return new Proxy(target, {
    get(t, p) {
      const v = Reflect.get(t, p);
      if (typeof v !== "function") return v;
      return (...args: unknown[]) => {
        calls.push(String(p));
        // prepare() is synchronous; only batch() may be held up by the hook
        if (before && p === "batch") return before(String(p), args).then(() => v.apply(t, args));
        return v.apply(t, args);
      };
    },
  }) as D1Database;
}

const cachedEnv = (DB: D1Database = env.DB): Env => ({ ...env, DB, CONTENT_CACHE_TTL_MS: "60000" });

async function get(path: string, e: Env = cachedEnv(), init?: RequestInit) {
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request(ORIGIN + path, init), e, ctx);
  const body = await res.text();
  await waitOnExecutionContext(ctx); // the page-cache put runs in waitUntil
  return { res, body };
}

const draftText = (key: string, value: string) =>
  run(
    `INSERT INTO text_values (key, locale, draft, updated_by) VALUES (?1, 'ar', ?2, ?3)
     ON CONFLICT (key, locale) DO UPDATE SET draft = ?2, rev = rev + 1,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`,
    key,
    value,
    BY,
  );

let base: number;

beforeEach(async () => {
  resetContentCache();
  vi.restoreAllMocks();
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  // revisions is append-only: the store carries on from the last rev it has.
  base = (await one<{ m: number }>("SELECT coalesce(max(id), 0) AS m FROM revisions"))!.m;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
  await run("DELETE FROM meta WHERE k = 'publish_id'");
});

afterEach(() => vi.restoreAllMocks());

describe("publish(db, by)", () => {
  it("copies every draft to published in one go, appends the revision and the audit row", async () => {
    await draftText("heroPara", "نص منشور");
    await run("INSERT INTO slot_values (slot, draft_json, updated_by) VALUES ('home.media.1', ?, ?)", '{"alt":{"ar":"بديل"}}', BY);
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('c1', 'عميل', 'Client', ?)", BY);
    await run(
      `INSERT INTO gallery_items (id, src, cat, ratio, sort, hidden, alt_ar, client_id, updated_by)
       VALUES ('up-1', 'https://media.aliphcreative.com/a.webp', 'photo', 2.0, 1.5, 1, 'صورة', 'c1', ?)`,
      BY,
    );
    // removals staged in the draft, live until this publish
    await run("INSERT INTO gallery_items (id, state, published_json, updated_by) VALUES ('gone', 'deleted', '{\"id\":\"gone\"}', ?)", BY);
    await run("INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('design', '[\"a\",\"b\"]', ?)", BY);
    await run(
      "INSERT INTO ring_picks (service, item_ids_json, state, published_json, updated_by) VALUES ('photo', '[\"x\"]', 'deleted', '[\"x\"]', ?)",
      BY,
    );
    const draft = await readSnapshot(db(), "draft");

    const r = await publish(db(), BY);
    expect(r.rev).toBe(base + 1);

    const live = await readSnapshot(db(), "published");
    const { locks: _l, ...expected } = draft;
    expect(live).toEqual({ ...expected, rev: base + 1 });
    expect(r.snapshot).toEqual(live);

    // the contract's exact published_json (CONTENT_API.md "Gallery")
    expect((await one<{ v: string }>("SELECT published_json AS v FROM gallery_items WHERE id = 'up-1'"))!.v).toBe(
      JSON.stringify(draft.gallery[0]),
    );
    expect((await one<{ v: string }>("SELECT published_json AS v FROM clients WHERE id = 'c1'"))!.v).toBe(
      JSON.stringify({ id: "c1", name: { ar: "عميل", en: "Client" } }),
    );
    expect(await one("SELECT published_json AS v FROM gallery_items WHERE id = 'gone'")).toEqual({ v: null });
    expect(await one("SELECT published_json AS v FROM ring_picks WHERE service = 'photo'")).toEqual({ v: null });
    expect(live.rings).toEqual({ design: ["a", "b"] });

    const rev = await one<{ id: number; published_by: string; published_at: string; snapshot_json: string }>(
      "SELECT * FROM revisions WHERE id = ?",
      base + 1,
    );
    expect(rev).toMatchObject({ published_by: BY, published_at: r.publishedAt });
    expect(rev!.snapshot_json).toBe(JSON.stringify(live));
    expect(await one("SELECT v FROM meta WHERE k = 'publish_rev'")).toEqual({ v: String(base + 1) });
    expect((await one<{ v: string }>("SELECT v FROM meta WHERE k = 'publish_id'"))!.v).toMatch(/^[0-9a-f-]{36}$/);
    expect(await one("SELECT actor, action, target FROM audit WHERE target = ?", `rev:${base + 1}`)).toEqual({
      actor: BY,
      action: "publish",
      target: `rev:${base + 1}`,
    });
  });

  it("two concurrent publishes → two revisions, revs increasing by one", async () => {
    await draftText("heroPara", "أ");
    const [a, b] = await Promise.all([publish(db(), "info@aliphcreative.com"), publish(db(), BY)]);
    expect([a.rev, b.rev].sort()).toEqual([base + 1, base + 2]);
    const revs = await db().prepare("SELECT id FROM revisions WHERE id > ? ORDER BY id").bind(base).all<{ id: number }>();
    expect(revs.results.map((x) => x.id)).toEqual([base + 1, base + 2]);
    expect(await one("SELECT v FROM meta WHERE k = 'publish_rev'")).toEqual({ v: String(base + 2) });
  });

  it("a draft saved between the read and the write is not lost: the batch rolls back and retries", async () => {
    await draftText("heroPara", "قديم");
    let raced = false;
    const racy = spiedDb([], async (method, args) => {
      // the write batch is the one that starts with the revisions insert
      if (method === "batch" && !raced && (args[0] as unknown[]).length === 9) {
        raced = true;
        await draftText("heroPara", "جديد");
      }
    });
    const r = await publish(racy, BY);
    expect(raced).toBe(true);
    expect(r.rev).toBe(base + 1); // the first attempt left nothing behind
    expect(await one("SELECT published AS v FROM text_values WHERE key = 'heroPara'")).toEqual({ v: "جديد" });
    expect(JSON.parse((await one<{ s: string }>("SELECT snapshot_json AS s FROM revisions WHERE id = ?", base + 1))!.s).text)
      .toEqual({ heroPara: { ar: "جديد" } });
  });
});

describe("the published cache", () => {
  it("publish → the next request reflects it (page and /api/content)", async () => {
    await draftText("heroPara", "النسخة الأولى");
    await publish(db(), BY);
    expect((await get("/")).body).toContain(">النسخة الأولى<");

    await draftText("heroPara", "النسخة الثانية");
    await publish(db(), BY);
    const page = await get("/");
    expect(page.body).toContain(">النسخة الثانية<");
    expect(page.body).not.toContain("النسخة الأولى");
    const api = await get("/api/content");
    expect(api.res.headers.get("etag")).toBe(`"${base + 2}"`);
    expect(JSON.parse(api.body).text.heroPara).toEqual({ ar: "النسخة الثانية" });
  });

  it("a warm page request does no D1 query, and serves the same bytes", async () => {
    await draftText("heroPara", "دافئ");
    await publish(db(), BY);
    resetContentCache(); // as a fresh isolate

    const cold: string[] = [];
    const first = await get("/", cachedEnv(spiedDb(cold)));
    expect(cold.length).toBeGreaterThan(0);

    const match = caches.default.match.bind(caches.default);
    const hits: string[] = [];
    vi.spyOn(caches.default, "match").mockImplementation(async (req, opts) => {
      const r = await match(req, opts);
      if (r) hits.push(String(req instanceof Request ? req.url : req));
      return r;
    });
    const warm: string[] = [];
    const second = await get("/", cachedEnv(spiedDb(warm)));
    expect(hits).toHaveLength(1); // the rendered page itself came from the Cache API
    expect(hits[0]).toContain("/__aliph-cache/page/");
    const api = await get("/api/content", cachedEnv(spiedDb(warm)));
    expect(warm).toEqual([]);
    expect(second.res.status).toBe(200);
    expect(second.body).toBe(first.body);
    expect(second.res.headers.get("etag")).toBe(first.res.headers.get("etag"));
    expect(second.res.headers.get("cache-control")).toBe(first.res.headers.get("cache-control"));
    expect(api.res.status).toBe(200);
  });

  it("after the TTL one version read revalidates; a cold isolate gets the snapshot from the Cache API", async () => {
    await draftText("heroPara", "مخزن");
    await publish(db(), BY);
    // publish() primes only its own isolate's memo; the first isolate that
    // reads the new version from D1 stores it in the Cache API
    resetContentCache();
    const t0 = Date.now();
    await get("/");

    vi.spyOn(Date, "now").mockReturnValue(t0 + 120_000);
    const later: string[] = [];
    expect((await get("/", cachedEnv(spiedDb(later)))).body).toContain(">مخزن<");
    expect(later).toEqual(["prepare"]); // the version row, no snapshot batch

    resetContentCache();
    const fresh: string[] = [];
    expect((await get("/", cachedEnv(spiedDb(fresh)))).body).toContain(">مخزن<");
    expect(fresh).toEqual(["prepare"]);
  });

  it("the same rev with a different publish id (a restored D1) is a different version", async () => {
    await draftText("heroPara", "قبل");
    await publish(db(), BY);
    const t0 = Date.now();
    await get("/");
    // what a D1 restore + another publish of the same rev number looks like
    await run("UPDATE text_values SET published = 'بعد' WHERE key = 'heroPara'");
    await run("UPDATE meta SET v = 'another-id' WHERE k = 'publish_id'");
    vi.spyOn(Date, "now").mockReturnValue(t0 + 120_000);
    expect((await get("/")).body).toContain(">بعد<");
  });

  it("D1 down after a publish was seen: the cached snapshot keeps being served", async () => {
    await draftText("heroPara", "صامد");
    await publish(db(), BY);
    const t0 = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(t0 + 120_000);
    const broken = new Proxy(env.DB, {
      get() {
        throw new Error("D1 unavailable");
      },
    }) as D1Database;
    const r = await get("/", cachedEnv(broken));
    expect(r.res.status).toBe(200);
    expect(r.body).toContain(">صامد<");
  });
});
