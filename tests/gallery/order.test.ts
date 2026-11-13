// G-06a: POST /api/admin/gallery/order — the library order of one sub, all or nothing.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { publish } from "../../worker/src/publish";
import { ADMIN, call, del, installAccess, post, put, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

const R2 = "https://media.aliphcreative.com/admin/2026/11";
const ORDER = "/api/admin/gallery/order";

interface Item { id: string; kind: string; cat: string; video: boolean; deleted: boolean; changed: boolean; rev: number; own: { sort?: number } }
type Entry = { id: string; rev: number };

const readAll = async () => ((await (await call("/api/admin/gallery")).json()) as { items: Item[] }).items;
/** The pieces of a library sub as the read model lists them (an upload deleted = gone). */
const sub = async (cat: string, run: string) =>
  (await readAll()).filter(
    (it) => it.cat === cat && !(it.kind === "upload" && it.deleted) &&
      (run === "videos" ? it.video : run === "photos" ? !it.video : true),
  );
const entries = (xs: Item[]): Entry[] => xs.map((it) => ({ id: it.id, rev: it.rev }));
/** Item 3 moved to the front. */
const thirdFirst = <T>(xs: T[]): T[] => [xs[2], ...xs.slice(0, 2), ...xs.slice(3)];
const rows = async () =>
  (await env.DB.prepare("SELECT id, sort, rev, state, hidden, src, cat FROM gallery_items ORDER BY id").all()).results as {
    id: string; sort: number | null; rev: number; state: string; hidden: number; src: string | null; cat: string | null;
  }[];
/** audit is append-only and outlives a test: only rows written since beforeEach count */
let auditFrom = 0;
beforeEach(async () => {
  auditFrom = (await env.DB.prepare("SELECT coalesce(max(id), 0) AS n FROM audit").first<{ n: number }>())!.n;
});
const orderAudits = async () =>
  (await env.DB.prepare("SELECT actor, target, detail FROM audit WHERE action = 'gallery.order' AND id > ?").bind(auditFrom).all()).results as {
    actor: string; target: string; detail: string;
  }[];

describe("POST /api/admin/gallery/order", () => {
  it("writes sort 10, 20, 30… for every piece of the sub, audited; publish carries it ascending", async () => {
    // one upload, one hidden override, one reverted override (deleted row) in design / ads
    await put("/api/admin/gallery/up-ad", { src: `${R2}/up-ad.webp`, cat: "design", date: "2026-11", baseRev: 0 });
    const design = await sub("design", "ads");
    const [hid, rev] = design.filter((it) => it.kind === "default").slice(0, 2);
    await put(`/api/admin/gallery/${hid.id}`, { hidden: true, baseRev: 0 });
    await put(`/api/admin/gallery/${rev.id}`, { src: `${R2}/x.webp`, hidden: true, baseRev: 0 });
    await del(`/api/admin/gallery/${rev.id}?baseRev=1`);

    const before = await sub("design", "ads");
    expect(before.length).toBe(13);
    const want = thirdFirst(entries(before));
    const r = await post(ORDER, { cat: "design", sub: "ads", items: want });
    expect(r.status).toBe(200);
    const out = (await r.json()) as { items: Item[] };
    expect(out.items.map((it) => it.id)).toEqual(want.map((e) => e.id));
    expect(out.items.map((it) => it.own.sort)).toEqual(want.map((_, i) => (i + 1) * 10));

    const byId = new Map((await rows()).map((x) => [x.id, x]));
    want.forEach((e, i) => expect(byId.get(e.id)?.sort, e.id).toBe((i + 1) * 10));
    // a default with no row got a bare override: only id + sort, MEDIA keeps the rest
    const bare = want.find((e) => e.rev === 0)!;
    expect(byId.get(bare.id)).toMatchObject({ rev: 1, state: "active", hidden: 0, src: null, cat: null });
    // …and the grid still reads it as the default piece (no "revert"), now placed
    const shown = new Map(out.items.map((it) => [it.id, it]));
    expect(shown.get(bare.id)).toMatchObject({ kind: "default", rev: 1, changed: true });
    expect(shown.get(rev.id)).toMatchObject({ kind: "default", deleted: false });
    expect(shown.get(hid.id)).toMatchObject({ kind: "override", hidden: true });
    // the hidden override stays hidden; the reverted one is back to the default piece (+ sort), not its old values
    expect(byId.get(hid.id)).toMatchObject({ hidden: 1, state: "active" });
    expect(byId.get(rev.id)).toMatchObject({ hidden: 0, src: null, state: "active" });
    expect(byId.get("up-ad")).toMatchObject({ src: `${R2}/up-ad.webp`, cat: "design" });

    expect(await orderAudits()).toEqual([
      { actor: ADMIN, target: "design/ads", detail: JSON.stringify({ cat: "design", sub: "ads", ids: want.map((e) => e.id) }) },
    ]);

    await publish(env.DB, ADMIN);
    const gallery = ((await (await call("/api/content")).json()) as { gallery: { id: string; sort?: number; hidden?: true; src?: string }[] }).gallery;
    const mine = gallery.filter((g) => want.some((e) => e.id === g.id));
    expect(mine.length).toBe(13);
    const sorted = [...mine].sort((a, b) => a.sort! - b.sort!);
    expect(sorted.map((g) => g.id)).toEqual(want.map((e) => e.id));
    expect(gallery.find((g) => g.id === bare.id)).toEqual({ id: bare.id, sort: want.findIndex((e) => e.id === bare.id) * 10 + 10 });
    expect(gallery.find((g) => g.id === rev.id)).toEqual({ id: rev.id, sort: want.findIndex((e) => e.id === rev.id) * 10 + 10 });
  });

  it("a stale rev on row 2 of 3 changes nothing at all: 409 + the sub as it is now", async () => {
    const design = await sub("design", "ads");
    // three rows exist: 0 and 2 with a sort already, 1 then edited elsewhere
    await put(`/api/admin/gallery/${design[0].id}`, { sort: 5, baseRev: 0 });
    await put(`/api/admin/gallery/${design[1].id}`, { sort: 6, baseRev: 0 });
    await put(`/api/admin/gallery/${design[2].id}`, { sort: 7, baseRev: 0 });
    const read = await sub("design", "ads");
    await put(`/api/admin/gallery/${design[1].id}`, { sort: 6, hidden: true, baseRev: 1 }); // now rev 2
    const before = await rows();
    const auditN = (await env.DB.prepare("SELECT COUNT(*) AS n FROM audit").first<{ n: number }>())!.n;

    const r = await post(ORDER, { cat: "design", sub: "ads", items: thirdFirst(entries(read)) });
    expect(r.status).toBe(409);
    const b = (await r.json()) as { error: string; current: Item[] };
    expect(b.error).toMatch(/changed elsewhere/);
    expect(b.current.find((it) => it.id === design[1].id)).toMatchObject({ rev: 2 });
    expect(b.current.length).toBe(read.length);

    expect(await rows()).toEqual(before); // rows 1 and 3 untouched, no bare override created
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM audit").first<{ n: number }>())!.n).toBe(auditN);
  });

  it("a default sent with rev 0 that got a row in the meantime is stale too", async () => {
    const read = await sub("design", "ads");
    await put(`/api/admin/gallery/${read[4].id}`, { hidden: true, baseRev: 0 });
    const r = await post(ORDER, { cat: "design", sub: "ads", items: entries(read) });
    expect(r.status).toBe(409);
    expect((await rows()).map((x) => x.id)).toEqual([read[4].id]);
  });

  it("400s: a piece of another sub or category, missing, extra, duplicate, bad shapes", async () => {
    await put("/api/admin/gallery/up-gone", { src: `${R2}/up-gone.webp`, cat: "design", baseRev: 0 });
    await del("/api/admin/gallery/up-gone?baseRev=1");
    const ads = entries(await sub("design", "ads"));
    const photos = entries(await sub("photo", "photos"));
    const videos = entries(await sub("photo", "videos"));
    expect(ads.some((e) => e.id === "up-gone")).toBe(false);
    const cases: [string, unknown, string][] = [
      ["video in photos", { cat: "photo", sub: "photos", items: [...photos.slice(1), videos[0]] }, `items.${photos.length - 1}`],
      ["photo in ads", { cat: "design", sub: "ads", items: [...ads.slice(0, 3), photos[0], ...ads.slice(3)] }, "items.3"],
      ["missing", { cat: "design", sub: "ads", items: ads.slice(1) }, "items"],
      ["extra", { cat: "design", sub: "ads", items: [...ads, { id: "nobody", rev: 0 }] }, `items.${ads.length}`],
      ["deleted upload", { cat: "design", sub: "ads", items: [...ads, { id: "up-gone", rev: 2 }] }, `items.${ads.length}`],
      ["duplicate", { cat: "design", sub: "ads", items: [...ads, ads[0]] }, `items.${ads.length}`],
      ["SUBCATS chip is not a library sub", { cat: "design", sub: "posters", items: ads }, "sub"],
      ["unknown cat", { cat: "nope", sub: "ads", items: ads }, "cat"],
      ["items not an array", { cat: "design", sub: "ads", items: "x" }, "items"],
      ["bad rev", { cat: "design", sub: "ads", items: [{ id: ads[0].id, rev: -1 }, ...ads.slice(1)] }, "items.0"],
      ["bad id", { cat: "design", sub: "ads", items: [{ id: 5, rev: 0 }, ...ads.slice(1)] }, "items.0"],
    ];
    const n = (await rows()).length;
    for (const [name, b, field] of cases) {
      const r = await post(ORDER, b);
      expect(r.status, name).toBe(400);
      expect(((await r.json()) as { field?: string }).field, name).toBe(field);
    }
    const bad = await call(ORDER, { method: "POST", body: "{", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);
    expect((await rows()).length).toBe(n);
    expect(await orderAudits()).toEqual([]);
  });

  it("refuses a foreign or missing Origin", async () => {
    const ads = entries(await sub("design", "ads"));
    expect((await post(ORDER, { cat: "design", sub: "ads", items: ads }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await post(ORDER, { cat: "design", sub: "ads", items: ads }, { origin: null })).status).toBe(403);
    expect(await rows()).toEqual([]);
  });

  it("the drawer's save after a reorder keeps the sort (it sends item.own back)", async () => {
    const ads = entries(await sub("design", "ads"));
    expect((await post(ORDER, { cat: "design", sub: "ads", items: ads })).status).toBe(200);
    const it = (await readAll()).find((x) => x.id === ads[1].id)!;
    expect(it.own.sort).toBe(20);
    const r = await put(`/api/admin/gallery/${it.id}`, { ...it.own, alt: { en: "Edited" }, baseRev: it.rev });
    expect(r.status).toBe(200);
    expect((await rows()).find((x) => x.id === it.id)?.sort).toBe(20);
  });
});
