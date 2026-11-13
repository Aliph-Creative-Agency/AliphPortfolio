// C-03: history restore, editor discard and the change rows carry a client's
// 0003 details (line / year / url), not just its names.
import { createExecutionContext, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { readSnapshot } from "../../worker/src/store";

const ORIGIN = "http://localhost";
const E: Env = { ...env, ADMIN_DEV_BYPASS: "1" };
const BY = "a@b.c";
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
const one = <T>(sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).first<T>();
const call = (path: string, init: RequestInit = {}) =>
  worker.fetch(new Request(ORIGIN + path, init), E, createExecutionContext());
const post = (path: string, body: unknown = {}) =>
  call(path, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify(body) });
const changes = async () =>
  (await (await call("/api/admin/changes")).json()) as { token: string; changes: { section: string; id: string }[] };
const publish = async () => {
  const r = await post("/api/admin/publish", { token: (await changes()).token });
  expect(r.status).toBe(200);
  return ((await r.json()) as { rev: number }).rev;
};

type Details = { line_ar?: string | null; line_en?: string | null; year?: number | null; url?: string | null };
/** Upsert a client's draft row (a save: rev + 1). */
const client = (id: string, ar: string, en: string, d: Details = {}, state = "active") =>
  run(
    `INSERT INTO clients (id, name_ar, name_en, line_ar, line_en, year, url, state, updated_by)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
     ON CONFLICT (id) DO UPDATE SET name_ar = ?2, name_en = ?3, line_ar = ?4, line_en = ?5, year = ?6, url = ?7,
       state = ?8, rev = rev + 1`,
    id, ar, en, d.line_ar ?? null, d.line_en ?? null, d.year ?? null, d.url ?? null, state, BY,
  );
const draftClients = async () => (await readSnapshot(db(), "draft")).clients;

const A = {
  id: "c1",
  name: { ar: "عميل", en: "Client one" },
  line: { ar: "سطر أ", en: "Line A" },
  year: 2019,
  url: "https://a.example/",
};

let base: number;
beforeEach(async () => {
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  base = (await one<{ m: number }>("SELECT coalesce(max(id), 0) AS m FROM revisions"))!.m;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
  await run(
    "INSERT INTO revisions (id, published_by, snapshot_json) VALUES (?1, ?2, ?3)",
    base + 1, BY, JSON.stringify({ rev: base + 1, text: {}, slots: {}, gallery: [], rings: {}, clients: [] }),
  );
  base += 1;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
});

describe("restore carries client details (C-03)", () => {
  it("publish A, edit every field, publish B, restore A → draft has A's fields; a later client is deleted", async () => {
    await client("c1", "عميل", "Client one", { line_ar: "سطر أ", line_en: "Line A", year: 2019, url: "https://a.example/" });
    const rA = await publish();

    await client("c1", "عميل ب", "Client B", { line_ar: "سطر ب", line_en: "Line B", year: 2023, url: "https://b.example/" });
    await client("c2", "جديد", "Added after A", { year: 2024 });
    await publish();
    const lockB = (await readSnapshot(db(), "draft")).locks!.clients;

    const res = await post(`/api/admin/revisions/${rA}/restore`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ restored: rA, skipped: [] });
    expect(await draftClients()).toEqual([A]);
    expect(await one("SELECT state FROM clients WHERE id = 'c2'")).toEqual({ state: "deleted" });
    const lock = (await readSnapshot(db(), "draft")).locks!.clients;
    expect(lock.c1).toBe(lockB.c1 + 1);

    // a second restore of the same revision writes nothing
    await post(`/api/admin/revisions/${rA}/restore`);
    expect((await readSnapshot(db(), "draft")).locks!.clients).toEqual(lock);

    // and publishing it makes A live again, byte for byte
    await publish();
    expect((await one<{ v: string }>("SELECT published_json AS v FROM clients WHERE id = 'c1'"))!.v).toBe(JSON.stringify(A));
  });

  it("restoring a pre-0003 revision (names only) clears details added since", async () => {
    await run(
      "INSERT INTO revisions (id, published_by, snapshot_json) VALUES (?1, ?2, ?3)",
      base + 1, BY,
      JSON.stringify({ rev: base + 1, text: {}, slots: {}, gallery: [], rings: {}, clients: [{ id: "c1", name: { ar: "ع", en: "Old" } }] }),
    );
    await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base + 1));
    await client("c1", "ع", "Old", { line_en: "Added later", year: 2020, url: "https://x.example/" });

    expect((await post(`/api/admin/revisions/${base + 1}/restore`)).status).toBe(200);
    expect(await draftClients()).toEqual([{ id: "c1", name: { ar: "ع", en: "Old" } }]);
    expect(await one("SELECT line_ar, line_en, year, url FROM clients WHERE id = 'c1'")).toEqual({
      line_ar: null, line_en: null, year: null, url: null,
    });
  });
});

describe("discard and change rows carry client details (C-03)", () => {
  it("a details-only edit is a clients change row, and discard brings the published details back", async () => {
    await client("c1", "عميل", "Client one", { line_ar: "سطر أ", line_en: "Line A", year: 2019, url: "https://a.example/" });
    await publish();
    expect((await changes()).changes).toEqual([]);

    for (const d of [{ line_en: "Changed" }, { year: 2020 }, { url: "https://b.example/" }, { line_ar: null }] as Details[]) {
      await client("c1", "عميل", "Client one", { line_ar: "سطر أ", line_en: "Line A", year: 2019, url: "https://a.example/", ...d });
      expect((await changes()).changes, JSON.stringify(d)).toMatchObject([{ section: "clients", id: "c1" }]);
    }

    const r = await post("/api/admin/discard", { token: (await changes()).token });
    expect(r.status).toBe(200);
    expect(await draftClients()).toEqual([A]);
    expect((await changes()).changes).toEqual([]);
  });

  it("discard removes an unpublished client and restores a published one's cleared details", async () => {
    await client("c1", "عميل", "Client one", { line_ar: "سطر أ", line_en: "Line A", year: 2019, url: "https://a.example/" });
    await publish();
    await client("c1", "عميل", "Client one"); // every detail cleared in the draft
    await client("c9", "مسودة", "Draft only", { url: "https://d.example/" });
    expect((await post("/api/admin/discard", { token: (await changes()).token })).status).toBe(200);
    expect(await draftClients()).toEqual([A]);
    expect(await one("SELECT state FROM clients WHERE id = 'c9'")).toEqual({ state: "deleted" });
  });
});
