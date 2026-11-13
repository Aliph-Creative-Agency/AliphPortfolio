// E-06: GET /api/admin/changes, POST /api/admin/publish, POST /api/admin/discard.
import { createExecutionContext, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { diff } from "../../worker/src/editor/diff";
import defaults from "../../worker/src/generated/defaults.json";
import { emptySnapshot } from "../../worker/src/store";

const ORIGIN = "http://localhost";
const E: Env = { ...env, ADMIN_DEV_BYPASS: "1" };
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
const one = <T>(sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).first<T>();
const call = (path: string, init: RequestInit = {}) =>
  worker.fetch(new Request(ORIGIN + path, init), E, createExecutionContext());
const post = (path: string, body: unknown, origin: string | null = ORIGIN) =>
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

interface Changes {
  rev: number;
  token: string;
  changes: { section: string; id: string; page?: string; locales?: string[] }[];
}
const changes = async () => (await (await call("/api/admin/changes")).json()) as Changes;
const draft = async () =>
  (await (await call("/api/admin/content")).json()) as {
    text: Record<string, Record<string, string>>;
    slots: Record<string, unknown>;
    gallery: { id: string }[];
    locks: { text: Record<string, Record<string, number>> };
  };
const publicPage = async () => (await call("/")).text();
const publishRev = async () => Number((await one<{ v: string }>("SELECT v FROM meta WHERE k = 'publish_rev'"))!.v);

const HIDDEN_DEFAULT = (defaults.MEDIA as { f: string }[])[0].f;

let base: number;
let auditFrom: number;

beforeEach(async () => {
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  // revisions and audit are append-only: carry on from the last rev / id.
  base = (await one<{ m: number }>("SELECT coalesce(max(id), 0) AS m FROM revisions"))!.m;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
  auditFrom = (await one<{ m: number }>("SELECT coalesce(max(id), 0) AS m FROM audit"))!.m;
});

const auditActions = async () =>
  (await db().prepare("SELECT action, target FROM audit WHERE id > ? ORDER BY id").bind(auditFrom).all()).results;

describe("Origin guard", () => {
  for (const path of ["/api/admin/publish", "/api/admin/discard"]) {
    it(`${path}: foreign Origin → 403, no Origin → 403, nothing written`, async () => {
      expect((await post(path, { token: "0".repeat(64) }, "https://evil.example")).status).toBe(403);
      expect((await post(path, { token: "0".repeat(64) }, null)).status).toBe(403);
      expect(await publishRev()).toBe(base);
      expect(await auditActions()).toEqual([]);
    });
  }
  it("a missing or malformed token → 400", async () => {
    expect((await post("/api/admin/publish", {})).status).toBe(400);
    expect((await post("/api/admin/discard", { token: "abc" })).status).toBe(400);
  });
});

describe("GET /api/admin/changes", () => {
  it("lists exactly the edited keys, with their page and locales", async () => {
    expect((await changes()).changes).toEqual([]);
    await put("hero1", "ar", "عنوان", 0);
    await put("hero1", "en", "Title", 0);
    await put("meta.about.title", "ar", "عن أليف", 0);
    await run(
      "INSERT INTO slot_values (slot, draft_json, updated_by) VALUES ('home.media.1', ?1, 'a@b.c')",
      JSON.stringify({ alt: { ar: "صورة" } }),
    );
    await run("INSERT INTO gallery_items (id, src, cat, updated_by) VALUES ('up-1', 'assets/media/x.webp', 'design', 'a@b.c')");
    const c = await changes();
    expect(c.rev).toBe(base);
    expect(c.token).toMatch(/^[0-9a-f]{64}$/);
    expect(c.changes).toEqual([
      { section: "text", id: "hero1", page: "home", locales: ["ar", "en"] },
      { section: "text", id: "meta.about.title", page: "about", locales: ["ar"] },
      { section: "slots", id: "home.media.1", page: "home" },
      { section: "gallery", id: "up-1" },
    ]);
  });

  it("a save changes the token; a draft equal to the live value is not a change", async () => {
    const t0 = (await changes()).token;
    await put("heroPara", "ar", "س", 0);
    const t1 = (await changes()).token;
    expect(t1).not.toBe(t0);
    await post("/api/admin/publish", { token: t1 });
    expect((await changes()).changes).toEqual([]);
  });
});

describe("POST /api/admin/publish", () => {
  it("publishes: served HTML has the new Arabic value, /api/content rev + 1, changes empty, audit row", async () => {
    await put("heroPara", "ar", "نص منشور جديد", 0);
    const before = await changes();
    const r = await post("/api/admin/publish", { token: before.token });
    expect(r.status).toBe(200);
    const body = (await r.json()) as { rev: number; publishedAt: string; changed: unknown[] };
    expect(body.rev).toBe(base + 1);
    expect(body.publishedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(body.changed).toEqual(before.changes);
    expect(await publicPage()).toContain(">نص منشور جديد<");
    const api = await call("/api/content");
    expect(api.headers.get("etag")).toBe(`"${base + 1}"`);
    expect((await changes()).changes).toEqual([]);
    expect(await auditActions()).toEqual([
      { action: "text.save", target: "heroPara:ar" },
      { action: "publish", target: `rev:${base + 1}` },
    ]);
  });

  it("`changed` is this revision against the previous one", async () => {
    await put("heroPara", "ar", "أول", 0);
    await post("/api/admin/publish", { token: (await changes()).token });
    await put("hero1", "en", "Second", 0);
    const r = (await (await post("/api/admin/publish", { token: (await changes()).token })).json()) as {
      changed: unknown[];
    };
    expect(r.changed).toEqual([{ section: "text", id: "hero1", page: "home", locales: ["en"] }]);
  });

  it("a stale token (a save after the dialog read) → 409, nothing published", async () => {
    await put("heroPara", "ar", "أ", 0);
    const { token } = await changes();
    await put("heroPara", "ar", "ب", 1);
    const r = await post("/api/admin/publish", { token });
    expect(r.status).toBe(409);
    expect(await publishRev()).toBe(base);
    expect(await publicPage()).not.toContain(">ب<");
  });

  it("nothing to publish → 409", async () => {
    const r = await post("/api/admin/publish", { token: (await changes()).token });
    expect(r.status).toBe(409);
    expect(await publishRev()).toBe(base);
  });
});

describe("POST /api/admin/discard", () => {
  it("text + slot drafts go back to the live values; public unchanged; one audit row", async () => {
    await put("heroPara", "ar", "منشور", 0);
    await post("/api/admin/publish", { token: (await changes()).token });
    const page = await publicPage();

    await put("heroPara", "ar", "مسودة", 1);
    await put("hero1", "en", "Draft only", 0);
    await run(
      "INSERT INTO slot_values (slot, draft_json, updated_by) VALUES ('home.media.1', ?1, 'a@b.c')",
      JSON.stringify({ alt: { ar: "صورة" } }),
    );
    await run("INSERT INTO gallery_items (id, src, cat, updated_by) VALUES ('up-1', 'assets/media/x.webp', 'design', 'a@b.c')");
    const locksBefore = (await draft()).locks.text;
    auditFrom = (await one<{ m: number }>("SELECT max(id) AS m FROM audit"))!.m;

    const r = await post("/api/admin/discard", { token: (await changes()).token });
    expect(r.status).toBe(200);
    expect(((await r.json()) as { discarded: { id: string }[] }).discarded.map((c) => c.id)).toEqual([
      "hero1",
      "heroPara",
      "home.media.1",
      "up-1",
    ]);

    expect((await changes()).changes).toEqual([]);
    const d = await draft();
    expect(d.text).toEqual({ heroPara: { ar: "منشور" } });
    expect(d.slots).toEqual({});
    expect(d.gallery).toEqual([]);
    expect(await publicPage()).toBe(page);
    expect(await publishRev()).toBe(base + 1);
    expect(await auditActions()).toEqual([{ action: "discard", target: "draft" }]);
    // every touched row's lock moved on: a save with the pre-discard rev is a 409
    expect(d.locks.text.heroPara.ar).toBe(locksBefore.heroPara.ar + 1);
    expect((await put("heroPara", "ar", "قديم", locksBefore.heroPara.ar)).status).toBe(409);
  });

  it("gallery, rings and clients drafts go too; the published snapshot is identical before and after", async () => {
    // live: one upload, a ring pick, a client
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('c-live', 'عميل', 'Live client', 'a@b.c')");
    await run("INSERT INTO gallery_items (id, src, cat, updated_by) VALUES ('up-live', 'assets/media/l.webp', 'photo', 'a@b.c')");
    await run("INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('photo', '[\"up-live\"]', 'a@b.c')");
    await post("/api/admin/publish", { token: (await changes()).token });
    const snapshot = async () => JSON.stringify(await (await call("/api/content")).json());
    const before = await snapshot();
    const draftBefore = await draft();

    // draft: a hidden default, a new upload, an edited live upload, a new client, a ring change
    await run("INSERT INTO gallery_items (id, hidden, updated_by) VALUES ('" + HIDDEN_DEFAULT + "', 1, 'a@b.c')");
    await run("INSERT INTO gallery_items (id, src, cat, updated_by) VALUES ('up-new', 'assets/media/n.webp', 'design', 'a@b.c')");
    await run("UPDATE gallery_items SET src = 'assets/media/edited.webp', rev = rev + 1 WHERE id = 'up-live'");
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('c-new', 'جديد', 'New client', 'a@b.c')");
    await run("UPDATE ring_picks SET item_ids_json = '[]', rev = rev + 1 WHERE service = 'photo'");
    expect((await changes()).changes.length).toBeGreaterThanOrEqual(4);

    const r = await post("/api/admin/discard", { token: (await changes()).token });
    expect(r.status).toBe(200);
    expect((await changes()).changes).toEqual([]);
    const d = await draft();
    expect(d.gallery.map((g) => g.id)).toEqual(draftBefore.gallery.map((g) => g.id));
    expect(await snapshot()).toBe(before);
    const detail = JSON.parse((await one<{ detail: string }>("SELECT detail FROM audit WHERE action = 'discard' ORDER BY id DESC"))!.detail);
    expect(detail.gallery).toEqual(expect.arrayContaining(["up-new", "up-live", HIDDEN_DEFAULT]));
    expect(detail.clients).toContain("c-new");
  });

  it("a stale token → 409 and nothing changes", async () => {
    await put("heroPara", "ar", "أ", 0);
    const { token } = await changes();
    await put("hero1", "ar", "ب", 0);
    auditFrom = (await one<{ m: number }>("SELECT max(id) AS m FROM audit"))!.m;
    expect((await post("/api/admin/discard", { token })).status).toBe(409);
    expect((await draft()).text).toEqual({ heroPara: { ar: "أ" }, hero1: { ar: "ب" } });
    expect(await auditActions()).toEqual([]);
  });
});

describe("publish / discard race", () => {
  it("publish then discard with the same token → the discard is a 409", async () => {
    await put("heroPara", "ar", "سباق", 0);
    const { token } = await changes();
    expect((await post("/api/admin/publish", { token })).status).toBe(200);
    expect((await post("/api/admin/discard", { token })).status).toBe(409);
    expect(await publicPage()).toContain(">سباق<");
  });

  it("discard then publish with the same token → the publish is a 409", async () => {
    await put("heroPara", "ar", "سباق", 0);
    const { token } = await changes();
    expect((await post("/api/admin/discard", { token })).status).toBe(200);
    expect((await post("/api/admin/publish", { token })).status).toBe(409);
    expect(await publishRev()).toBe(base);
  });

  it("both at once: the store ends consistent (draft = live, no changes left)", async () => {
    await put("heroPara", "ar", "متزامن", 0);
    const { token } = await changes();
    const [p, d] = await Promise.all([
      post("/api/admin/publish", { token }),
      post("/api/admin/discard", { token }),
    ]);
    expect([p.status, d.status]).toContain(200);
    expect((await changes()).changes).toEqual([]);
    const live = (await one<{ v: string | null }>("SELECT published AS v FROM text_values WHERE key = 'heroPara'"))!.v;
    const pub = p.status === 200 ? ((await p.json()) as { changed: unknown[] }) : null;
    // the value is live exactly when the publish carried it
    expect(live === "متزامن").toBe(!!pub && pub.changed.length === 1);
  });
});

describe("diff()", () => {
  it("ignores rev, locks and key order; sees a removed gallery item and a ring order change", () => {
    const a = { ...emptySnapshot(3), slots: { "home.media.2": { src: "a.webp", alt: { ar: "x" } } } };
    const b = { ...emptySnapshot(1), slots: { "home.media.2": { alt: { ar: "x" }, src: "a.webp" } } };
    expect(diff(a, b)).toEqual([]);
    const c = { ...emptySnapshot(), gallery: [{ id: "g" }], rings: { design: ["a", "b"] } };
    const d = { ...emptySnapshot(), rings: { design: ["b", "a"] } };
    expect(diff(d, c)).toEqual([
      { section: "gallery", id: "g" },
      { section: "rings", id: "design", page: "home" },
    ]);
  });
});
