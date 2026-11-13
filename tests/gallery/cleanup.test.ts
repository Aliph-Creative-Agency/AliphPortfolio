// G-08: GET /api/admin/upload/unused + POST /api/admin/upload/cleanup.
// A key under admin/ counts as used when the draft OR the published snapshot
// names it: gallery src/poster, any slot value (media + film frames), and the
// rows a ring pick resolves to. Objects under 24 h old are never touched.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publish } from "../../worker/src/publish";
import { ADMIN, call, del, installAccess, post, put, uninstallAccess } from "./helpers";

beforeEach(async () => {
  await installAccess();
  // installAccess resets publish_rev to 0, but revisions (append-only) outlive a
  // test: start after the last one, since this file publishes in two tests
  await env.DB.prepare(
    "UPDATE meta SET v = CAST((SELECT coalesce(max(id), 0) FROM revisions) AS TEXT) WHERE k = 'publish_rev'",
  ).run();
});
afterEach(() => {
  vi.mocked(Date.now).mockRestore?.();
  uninstallAccess();
});

const DIR = "admin/2026/11";
const URL_OF = (key: string) => `https://media.aliphcreative.com/${key}`;
const DAY = 24 * 3600 * 1000;

/** Puts bytes at admin/2026/11/<name> in the local bucket; returns the key. */
async function obj(name: string, size = 10): Promise<string> {
  const key = `${DIR}/${name}`;
  await env.MEDIA_BUCKET.put(key, new Uint8Array(size));
  return key;
}
/** Every object below is a day and an hour older than "now". */
function later(ms = DAY + 3600 * 1000) {
  const real = Date.now.bind(Date);
  return vi.spyOn(Date, "now").mockImplementation(() => real() + ms);
}
interface Unused { key: string; size: number; uploaded: string; url: string; item?: string }
const unused = async () => {
  const r = await call("/api/admin/upload/unused");
  expect(r.status).toBe(200);
  return (await r.json()) as { files: Unused[]; totalSize: number };
};
const unusedKeys = async () => (await unused()).files.map((f) => f.key).sort();
interface Cleaned { deleted: string[]; refused: { key: string; reason: string }[] }
const cleanup = async (keys: unknown) => post("/api/admin/upload/cleanup", { keys });
const exists = async (key: string) => (await env.MEDIA_BUCKET.head(key)) !== null;
const slot = (id: string, draft: unknown, published: unknown = null) =>
  env.DB.prepare("INSERT INTO slot_values (slot, draft_json, published_json, updated_by) VALUES (?, ?, ?, ?)")
    .bind(id, draft === null ? null : JSON.stringify(draft), published === null ? null : JSON.stringify(published), ADMIN)
    .run();

describe("GET /api/admin/upload/unused", () => {
  it("lists only old orphans; keys the published snapshot or a draft slot names stay", async () => {
    const pubOnly = await obj("aaaaaa-old.webp");
    const draftNow = await obj("bbbbbb-new.webp");
    const slotDraft = await obj("cccccc-slot.webp");
    const film = await obj("dddddd-film.webp");
    const preview = await obj("eeeeee-reel.mp4");
    const reelPoster = await obj("eeeeee-reel.poster.webp");
    const orphan = await obj("ffffff-orphan.webp", 1234);

    // An item published with pubOnly, then replaced in the draft by draftNow.
    expect((await put("/api/admin/gallery/up-a", { src: URL_OF(pubOnly), cat: "photo", baseRev: 0 })).status).toBe(200);
    await publish(env.DB, ADMIN);
    expect((await put("/api/admin/gallery/up-a", { src: URL_OF(draftNow), cat: "photo", baseRev: 1 })).status).toBe(200);
    // Slots are the editor team's; their rows are written directly here.
    await slot("about.media.2", { src: URL_OF(slotDraft) });
    await slot("home.film.1", null, { src: URL_OF(film) });
    await slot("home.media.3", { preview: URL_OF(preview) });

    later();
    const res = await unused();
    expect(res.files.map((f) => f.key)).toEqual([orphan]);
    expect(res.files[0]).toMatchObject({ size: 1234, url: URL_OF(orphan) });
    expect(res.totalSize).toBe(1234);
    // the reel's poster follows its film by name even when no field names it
    expect(await exists(reelPoster)).toBe(true);
  });

  it("a fresh orphan (under 24 h) is not listed", async () => {
    await obj("gggggg-fresh.webp");
    expect(await unusedKeys()).toEqual([]);
    later(DAY - 3600 * 1000);
    expect(await unusedKeys()).toEqual([]);
  });

  it("a deleted upload whose ring still names it keeps its files; one no ring names is listed with its item id", async () => {
    const ringed = await obj("hhhhhh-ringed.webp");
    const gone = await obj("iiiiii-gone.mp4");
    const gonePoster = await obj("iiiiii-gone.poster.webp");
    await put("/api/admin/gallery/up-ringed", { src: URL_OF(ringed), cat: "photo", baseRev: 0 });
    expect((await put("/api/admin/rings/photo", { ids: ["up-ringed"], baseRev: 0 })).status).toBe(200);
    await publish(env.DB, ADMIN);
    // up-gone is created after that publish, so no revision ever names it (a
    // published one would be kept for History restore, see "revisions" below)
    await put("/api/admin/gallery/up-gone", { src: URL_OF(gone), poster: URL_OF(gonePoster), cat: "photo", baseRev: 0 });
    // both deleted and the deletion published: neither snapshot's gallery has them
    await del("/api/admin/gallery/up-ringed?baseRev=1");
    await del("/api/admin/gallery/up-gone?baseRev=1");
    await publish(env.DB, ADMIN);

    later();
    const files = (await unused()).files;
    expect(files.map((f) => f.key).sort()).toEqual([gone, gonePoster].sort());
    expect(files.every((f) => f.item === "up-gone")).toBe(true);
  });

  it("only looks under admin/ and only at keys the uploader writes", async () => {
    await env.MEDIA_BUCKET.put("thumb/x.webp", new Uint8Array(3));
    await env.MEDIA_BUCKET.put("admin/notes.txt", new Uint8Array(3));
    later();
    expect(await unusedKeys()).toEqual([]);
    await env.MEDIA_BUCKET.delete(["thumb/x.webp", "admin/notes.txt"]);
  });
});

describe("POST /api/admin/upload/cleanup", () => {
  it("deletes an old orphan and audits upload.cleanup with the keys", async () => {
    const a = await obj("jjjjjj-a.webp", 50);
    const b = await obj("kkkkkk-b.webp", 70);
    later();
    const r = await cleanup([a, b]);
    expect(r.status).toBe(200);
    expect((await r.json()) as Cleaned).toEqual({ deleted: [a, b], refused: [] });
    expect(await exists(a)).toBe(false);
    expect(await exists(b)).toBe(false);
    const rows = (await env.DB.prepare("SELECT actor, detail FROM audit WHERE action = 'upload.cleanup' AND detail LIKE ?").bind("%jjjjjj-a%").all())
      .results as { actor: string; detail: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].actor).toBe(ADMIN);
    expect(JSON.parse(rows[0].detail)).toEqual({ keys: [a, b], bytes: 120, refused: [] });
  });

  it("re-checks at delete time: a key used since the list, a fresh one and a missing one are refused", async () => {
    const nowUsed = await obj("llllll-used.webp");
    const orphan = await obj("nnnnnn-orphan.webp");
    const clock = later();
    expect(await unusedKeys()).toEqual([nowUsed, orphan]);
    // between the list and the click someone saves an item with it
    await put("/api/admin/gallery/up-late", { src: URL_OF(nowUsed), cat: "design", hidden: true, baseRev: 0 });
    const missing = `${DIR}/oooooo-missing.webp`;
    const r = await cleanup([nowUsed, orphan, missing]);
    expect(r.status).toBe(200);
    const out = (await r.json()) as Cleaned;
    expect(out.deleted).toEqual([orphan]);
    expect(out.refused).toEqual([
      { key: nowUsed, reason: "in use" },
      { key: missing, reason: "not found" },
    ]);
    expect(await exists(nowUsed)).toBe(true);
    expect(await exists(orphan)).toBe(false);

    const audited = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit WHERE action = 'upload.cleanup'").first("n");
    clock.mockRestore(); // real time again: a new object is under 24 h old
    const fresh = await obj("mmmmmm-fresh.webp");
    const tooNew = await cleanup([fresh]);
    expect(((await tooNew.json()) as Cleaned).refused).toEqual([{ key: fresh, reason: "under 24 h old" }]);
    expect(await exists(fresh)).toBe(true);
    // nothing deleted in that call: no audit row for it
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM audit WHERE action = 'upload.cleanup'").first("n")).toBe(audited);
  });

  it("a key only a draft film-frame slot names is refused", async () => {
    const s = await obj("pppppp-slot.webp");
    await slot("home.film.2", { src: URL_OF(s) });
    later();
    const r = await cleanup([s]);
    expect(((await r.json()) as Cleaned).refused).toEqual([{ key: s, reason: "in use" }]);
  });

  it("400s on bad bodies; 403 cross-origin", async () => {
    const bad: unknown[] = [undefined, [], "admin/2026/11/a.webp", ["thumb/a.webp"], ["admin/../x.webp"], [`${DIR}/a.webp`, `${DIR}/a.webp`], [1]];
    for (const keys of bad) expect((await cleanup(keys)).status, JSON.stringify(keys)).toBe(400);
    expect((await cleanup(Array.from({ length: 1001 }, (_, i) => `${DIR}/k${i}.webp`))).status).toBe(400);
    const r = await post("/api/admin/upload/cleanup", { keys: [`${DIR}/a.webp`] }, { origin: "https://evil.example" });
    expect(r.status).toBe(403);
  });
});

describe("revisions (leader fix, relay #7)", () => {
  // The editor's History restore (E-07) copies ANY revision's slots back into the
  // draft, so a file a past revision's slot names is still reachable.
  it("a file named only by a past revision's slot is not listed and is refused", async () => {
    const old = await obj("gggggg-past.webp");
    const orphan = await obj("hhhhhh-orphan.webp");
    const { id } = (await env.DB.prepare("SELECT coalesce(max(id), 0) + 1 AS id FROM revisions").first<{ id: number }>())!;
    const snap = { rev: id, text: {}, slots: { "about.media.2": { src: URL_OF(old) } }, gallery: [], rings: {}, clients: [] };
    await env.DB.prepare("INSERT INTO revisions (id, published_by, snapshot_json) VALUES (?, ?, ?)")
      .bind(id, ADMIN, JSON.stringify(snap))
      .run();
    later();
    expect(await unusedKeys()).toEqual([orphan]);
    const r = await cleanup([old]);
    expect(r.status).toBe(200);
    expect(((await r.json()) as Cleaned).refused).toEqual([{ key: old, reason: "in use" }]);
    expect(await exists(old)).toBe(true);
  });

  // History restore also copies a revision's gallery rows (src/poster) back (G-10).
  it("a file named only by a past revision's gallery item is not listed and is refused", async () => {
    const photo = await obj("jjjjjj-gal.mp4");
    const poster = await obj("jjjjjj-gal.poster.webp");
    const orphan = await obj("kkkkkk-orphan.webp");
    expect((await put("/api/admin/gallery/up-g", { src: URL_OF(photo), poster: URL_OF(poster), cat: "photo", baseRev: 0 })).status).toBe(200);
    await publish(env.DB, ADMIN); // revision N names it
    expect((await del("/api/admin/gallery/up-g?baseRev=1")).status).toBe(200);
    await publish(env.DB, ADMIN); // revision N+1 does not
    // the revision's snapshot really carries the item
    const snaps = await env.DB.prepare("SELECT json_extract(snapshot_json, '$.gallery') AS g FROM revisions").all<{ g: string }>();
    expect(snaps.results.some((r) => r.g.includes(photo))).toBe(true);

    later();
    expect(await unusedKeys()).toEqual([orphan]);
    for (const k of [photo, poster]) {
      const r = await cleanup([k]);
      expect(r.status).toBe(200);
      expect(((await r.json()) as Cleaned).refused).toEqual([{ key: k, reason: "in use" }]);
      expect(await exists(k)).toBe(true);
    }
  });
});
