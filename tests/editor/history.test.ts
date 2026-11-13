// E-07: GET /api/admin/revisions, POST /api/admin/revisions/:id/restore.
import { createExecutionContext, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { readSnapshot } from "../../worker/src/store";

const ORIGIN = "http://localhost";
const E: Env = { ...env, ADMIN_DEV_BYPASS: "1" };
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
const one = <T>(sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).first<T>();
const call = (path: string, init: RequestInit = {}) =>
  worker.fetch(new Request(ORIGIN + path, init), E, createExecutionContext());
const post = (path: string, body: unknown = {}, origin: string | null = ORIGIN) =>
  call(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  });
const put = (key: string, locale: string, value: string, baseRev: number) =>
  call("/api/admin/text", {
    method: "PUT",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ key, locale, value, baseRev }),
  });
const lock = async (key: string, locale: "ar" | "en") => (await readSnapshot(db(), "draft")).locks!.text[key]?.[locale] ?? 0;
const save = async (key: string, locale: "ar" | "en", value: string) => {
  const r = await put(key, locale, value, await lock(key, locale));
  expect(r.status).toBe(200);
};
const slot = (id: string, v: unknown) =>
  run(
    `INSERT INTO slot_values (slot, draft_json, updated_by) VALUES (?1, ?2, 'a@b.c')
     ON CONFLICT (slot) DO UPDATE SET draft_json = ?2, rev = rev + 1`,
    id,
    v === null ? null : JSON.stringify(v),
  );
const publish = async () => {
  const c = (await (await call("/api/admin/changes")).json()) as { token: string };
  const r = await post("/api/admin/publish", { token: c.token });
  expect(r.status).toBe(200);
  return ((await r.json()) as { rev: number }).rev;
};
const pick = (s: { text: unknown; slots: unknown }) => ({ text: s.text, slots: s.slots });

let base: number;

beforeEach(async () => {
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  base = (await one<{ m: number }>("SELECT coalesce(max(id), 0) AS m FROM revisions"))!.m;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
  // anchor: revision base+1 = the empty store, so diffs against it are this file's own
  await run(
    "INSERT INTO revisions (id, published_by, snapshot_json) VALUES (?1, 'a@b.c', ?2)",
    base + 1,
    JSON.stringify({ rev: base + 1, text: {}, slots: {}, gallery: [], rings: {}, clients: [] }),
  );
  base += 1;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
});

describe("GET /api/admin/revisions", () => {
  it("newest first, each with what it changed against the one before", async () => {
    await save("hero1", "ar", "واحد");
    const r1 = await publish();
    await save("hero1", "en", "Two");
    await slot("home.media.1", { alt: { ar: "صورة" } });
    const r2 = await publish();
    const res = await call("/api/admin/revisions?limit=2");
    expect(res.status).toBe(200);
    const list = (await res.json()) as { id: number; publishedAt: string; by: string; changed: unknown[] }[];
    expect(list.map((r) => r.id)).toEqual([r2, r1]);
    expect(list[0].by).toContain("@");
    expect(list[0].changed).toEqual([
      { section: "text", id: "hero1", page: "home", locales: ["en"] },
      { section: "slots", id: "home.media.1", page: "home" },
    ]);
    expect(list[1].changed).toEqual([{ section: "text", id: "hero1", page: "home", locales: ["ar"] }]);
  });

  it("limit outside 1..200 → 400", async () => {
    expect((await call("/api/admin/revisions?limit=0")).status).toBe(400);
    expect((await call("/api/admin/revisions?limit=abc")).status).toBe(400);
  });
});

describe("POST /api/admin/revisions/:id/restore", () => {
  it("foreign / missing Origin → 403; unknown id → 404; bad id → 400", async () => {
    expect((await post(`/api/admin/revisions/${base}/restore`, {}, "https://evil.example")).status).toBe(403);
    expect((await post(`/api/admin/revisions/${base}/restore`, {}, null)).status).toBe(403);
    expect((await post("/api/admin/revisions/999999/restore")).status).toBe(404);
    expect((await post("/api/admin/revisions/x1/restore")).status).toBe(400);
  });

  it("publish twice, restore the first: draft = rev 1, live unchanged, publish → live = rev 1", async () => {
    await save("hero1", "ar", "الأول");
    await save("heroPara", "en", "First para");
    await slot("home.media.1", { alt: { ar: "أولى" } });
    const r1 = await publish();
    const snap1 = pick(await readSnapshot(db(), "published"));

    await save("hero1", "ar", "الثاني");
    await save("hero2", "ar", "جديد");
    await slot("home.media.1", null);
    await slot("home.media.2", { alt: { en: "second" } });
    const r2 = await publish();
    const live2 = pick(await readSnapshot(db(), "published"));
    const hero1Lock = await lock("hero1", "ar");

    const auditFrom = (await one<{ m: number }>("SELECT max(id) AS m FROM audit"))!.m;
    const res = await post(`/api/admin/revisions/${r1}/restore`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ restored: r1, skipped: [] });
    expect(pick(await readSnapshot(db(), "draft"))).toEqual(snap1);
    expect(pick(await readSnapshot(db(), "published"))).toEqual(live2);
    expect((await readSnapshot(db(), "published")).rev).toBe(r2);
    const audit = await db().prepare("SELECT action, target FROM audit WHERE id > ?").bind(auditFrom).all();
    expect(audit.results).toEqual([{ action: "restore", target: `rev:${r1}` }]);

    // the restore moved hero1's lock: a save holding the pre-restore rev is a 409
    expect(await lock("hero1", "ar")).toBe(hero1Lock + 1);
    expect((await put("hero1", "ar", "قديم", hero1Lock)).status).toBe(409);

    await publish();
    expect(pick(await readSnapshot(db(), "published"))).toEqual(snap1);
  });

  it("restoring the empty anchor resets every draft to the default", async () => {
    await save("hero1", "ar", "شيء");
    await slot("home.media.1", { alt: { ar: "س" } });
    expect((await post(`/api/admin/revisions/${base}/restore`)).status).toBe(200);
    expect(pick(await readSnapshot(db(), "draft"))).toEqual({ text: {}, slots: {} });
  });

  it("a key the registry no longer has is skipped, the rest restored", async () => {
    await run(
      "INSERT INTO revisions (id, published_by, snapshot_json) VALUES (?1, 'a@b.c', ?2)",
      base + 1,
      JSON.stringify({ rev: base + 1, text: { hero1: { ar: "صالح" }, goneKey: { ar: "x" } }, slots: {}, gallery: [], rings: {}, clients: [] }),
    );
    await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base + 1));
    const res = await post(`/api/admin/revisions/${base + 1}/restore`);
    expect(await res.json()).toEqual({ restored: base + 1, skipped: ["text:goneKey:ar"] });
    expect((await readSnapshot(db(), "draft")).text).toEqual({ hero1: { ar: "صالح" } });
  });
});
