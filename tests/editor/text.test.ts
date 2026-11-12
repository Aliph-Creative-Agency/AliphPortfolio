// E-03: PUT / DELETE /api/admin/text — rev-locked draft writes + audit.
import { createExecutionContext, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { textEntry } from "../../worker/src/validate";

const E: Env = { ...env, ADMIN_DEV_BYPASS: "1" };
const call = (path: string, init: RequestInit = {}) =>
  worker.fetch(new Request("http://localhost" + path, init), E, createExecutionContext());
const send = (method: "PUT" | "DELETE", body: unknown) =>
  call("/api/admin/text", {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
const put = (key: string, locale: string, value: unknown, baseRev: unknown) => send("PUT", { key, locale, value, baseRev });
const del = (key: string, locale: string, baseRev: unknown) => send("DELETE", { key, locale, baseRev });
const draft = async () => (await (await call("/api/admin/content")).json()) as {
  text: Record<string, Record<string, string>>;
  locks: { text: Record<string, Record<string, number>> };
};
const count = async (table: string) =>
  (await env.DB.prepare(`SELECT count(*) AS n FROM ${table}`).first<{ n: number }>())!.n;
/* audit is append-only (a trigger refuses DELETE): look only past this id */
let auditFrom = 0;
const auditRows = async () =>
  (await env.DB.prepare("SELECT actor, action, target FROM audit WHERE id > ? ORDER BY id").bind(auditFrom).all()).results;

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM text_values").run();
  auditFrom = (await env.DB.prepare("SELECT coalesce(max(id), 0) AS m FROM audit").first<{ m: number }>())!.m;
});

describe("PUT /api/admin/text", () => {
  it("first save with baseRev 0 → 200 rev 1, in the draft snapshot, audit row written", async () => {
    const r = await put("hero1", "ar", "عنوان جديد", 0);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ key: "hero1", locale: "ar", value: "عنوان جديد", rev: 1 });
    const d = await draft();
    expect(d.text.hero1).toEqual({ ar: "عنوان جديد" });
    expect(d.locks.text.hero1).toEqual({ ar: 1 });
    const a = await auditRows();
    expect(a).toEqual([{ actor: expect.stringContaining("@"), action: "text.save", target: "hero1:ar" }]);
  });

  it("save with the current rev bumps it; a stale baseRev → 409 with the current value, no audit", async () => {
    await put("hero1", "en", "One", 0);
    const r2 = await put("hero1", "en", "Two", 1);
    expect(await r2.json()).toMatchObject({ value: "Two", rev: 2 });
    const stale = await put("hero1", "en", "Three", 1);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ current: { value: "Two", rev: 2 } });
    expect((await draft()).text.hero1.en).toBe("Two");
    expect((await auditRows()).length).toBe(2);
  });

  it("two first saves with baseRev 0: the second is a 409, never an overwrite", async () => {
    expect((await put("heroPara", "ar", "أ", 0)).status).toBe(200);
    const second = await put("heroPara", "ar", "ب", 0);
    expect(second.status).toBe(409);
    expect(await second.json()).toMatchObject({ current: { value: "أ", rev: 1 } });
  });

  it("concurrent first saves: exactly one wins", async () => {
    const rs = await Promise.all([put("heroPara", "en", "A", 0), put("heroPara", "en", "B", 0)]);
    expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await auditRows()).length).toBe(1);
  });

  it("baseRev > 0 on a row that does not exist → 409 with rev 0", async () => {
    const r = await put("heroPara", "en", "A", 3);
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ current: { value: null, rev: 0 } });
  });

  it("invalid input → 400 before any write", async () => {
    const max = textEntry("hero1")!.maxLength;
    const cases: [string, string, unknown, unknown][] = [
      ["hero1", "ar", "a <b>", 0],
      ["hero1", "ar", 'say "hi"', 0],
      ["hero1", "ar", "x".repeat(max + 1), 0],
      ["hero1", "ar", "two\nlines", 0],
      ["nope.key", "ar", "x", 0],
      ["meta.home.title", "en", "Title", 0],
      ["meta.home.title", "ar", "", 0],
      ["hero1", "fr", "x", 0],
      ["hero1", "ar", null, 0],
      ["hero1", "ar", "x", -1],
      ["hero1", "ar", "x", "1"],
      ["hero1", "ar", "x", undefined],
    ];
    for (const [key, locale, value, baseRev] of cases) {
      const r = await put(key, locale, value, baseRev);
      expect(r.status, `${key} ${locale} ${String(value).slice(0, 20)} ${baseRev}`).toBe(400);
      expect(await r.json()).toHaveProperty("error");
    }
    expect((await send("PUT", [1])).status).toBe(400);
    expect(await count("text_values")).toBe(0);
    expect((await auditRows()).length).toBe(0);
  });

  it("a richline keeps its line break; meta.* ar saves", async () => {
    expect((await put("heroPara", "ar", "سطر\nسطر", 0)).status).toBe(200);
    expect((await put("meta.home.title", "ar", "ألف", 0)).status).toBe(200);
  });
});

describe("DELETE /api/admin/text", () => {
  it("resets the locale: the draft snapshot drops it, rev bumped, audit text.reset", async () => {
    await put("hero1", "ar", "ع", 0);
    await put("hero1", "en", "E", 0);
    const r = await del("hero1", "ar", 1);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ key: "hero1", locale: "ar", value: null, rev: 2 });
    const d = await draft();
    expect(d.text.hero1).toEqual({ en: "E" });
    expect(d.locks.text.hero1).toEqual({ ar: 2, en: 1 });
    expect((await auditRows()).at(-1)).toMatchObject({ action: "text.reset", target: "hero1:ar" });
  });

  it("stale baseRev → 409; unknown key → 400", async () => {
    await put("hero1", "ar", "ع", 0);
    await put("hero1", "ar", "غ", 1);
    expect((await del("hero1", "ar", 1)).status).toBe(409);
    expect((await del("nope", "ar", 1)).status).toBe(400);
  });

  it("other methods → 405", async () => {
    const r = await call("/api/admin/text", { method: "POST", headers: { origin: "http://localhost" }, body: "{}" });
    expect(r.status).toBe(405);
  });
});
