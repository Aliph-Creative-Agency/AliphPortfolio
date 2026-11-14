// G-02b: PUT / DELETE /api/admin/gallery/:id, and what a publish makes of them.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import defaults from "../../worker/src/generated/defaults.json";
import { publish } from "../../worker/src/publish";
import { ADMIN, auditFloor, call, del, installAccess, put, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

type Media = { f: string; c: string; v?: number };
const MEDIA = defaults.MEDIA as Media[];
const DESIGN = MEDIA.find((m) => m.c === "design" && !m.v)!;
const PHOTO_SUB = (defaults.SUBCATS as Record<string, { id: string }[]>).photo[0].id;
const R2 = "https://media.aliphcreative.com/admin/2026/11";

interface Item { id: string; kind: string; cat: string; sub: string | null; hidden: boolean; deleted: boolean; changed: boolean; rev: number; alt: Record<string, string>; thumb: string; video: boolean; film?: string }
const body = async (r: Response) => (await r.json()) as { item: Item; current: Item | null; error: string; field?: string };
const pic = (id: string) => ({ src: `${R2}/${id}.webp`, cat: "photo", ratio: 1.5, date: "2026-11-02" });
const audits = async (action: string) =>
  (await env.DB.prepare("SELECT actor, target, detail FROM audit WHERE action = ? AND id > ?").bind(action, auditFloor).all()).results as {
    actor: string; target: string; detail: string;
  }[];

describe("PUT /api/admin/gallery/:id", () => {
  it("creates an upload at baseRev 0, audited; a second create is a 409 with the current row", async () => {
    const r = await put("/api/admin/gallery/abc123-pic", { ...pic("abc123-pic"), sub: PHOTO_SUB, baseRev: 0 });
    expect(r.status).toBe(200);
    const { item } = await body(r);
    expect(item).toMatchObject({ id: "abc123-pic", kind: "upload", cat: "photo", sub: PHOTO_SUB, rev: 1, changed: true });
    expect(item.thumb).toBe(`${R2}/abc123-pic.webp`);
    expect(await audits("gallery.save")).toEqual([
      { actor: ADMIN, target: "abc123-pic", detail: JSON.stringify({ baseRev: 0, rev: 1 }) },
    ]);

    const again = await put("/api/admin/gallery/abc123-pic", { ...pic("abc123-pic"), baseRev: 0 });
    expect(again.status).toBe(409);
    expect((await body(again)).current).toMatchObject({ id: "abc123-pic", rev: 1, sub: PHOTO_SUB });
  });

  it("overrides a default (hide), then edits it; a stale rev gets 409 + current", async () => {
    const path = `/api/admin/gallery/${encodeURIComponent(DESIGN.f)}`;
    const a = await body(await put(path, { hidden: true, baseRev: 0 }));
    expect(a.item).toMatchObject({ kind: "override", hidden: true, changed: true, rev: 1, cat: "design" });
    const b = await body(await put(path, { alt: { en: "A poster" }, sub: null, baseRev: 1 }));
    expect(b.item).toMatchObject({ hidden: false, rev: 2, alt: { en: "A poster" }, sub: null });
    const stale = await put(path, { hidden: true, baseRev: 1 });
    expect(stale.status).toBe(409);
    expect((await body(stale)).current).toMatchObject({ rev: 2, hidden: false });
    const row = await env.DB.prepare("SELECT src, cat, hidden FROM gallery_items WHERE id = ?").bind(DESIGN.f).first();
    expect(row).toEqual({ src: null, cat: null, hidden: 0 }); // an override keeps MEDIA's columns NULL
  });

  it("400s: invalid sub, a video without a poster, id mismatch, no baseRev, unknown client, markup in alt", async () => {
    const cases: [string, Record<string, unknown>, string][] = [
      ["up-1", { ...pic("up-1"), sub: "nope", baseRev: 0 }, "sub"],
      ["up-2", { src: `${R2}/up-2.mp4`, cat: "photo", baseRev: 0 }, "poster"],
      ["up-3", { ...pic("up-3"), id: "other", baseRev: 0 }, "id"],
      ["up-4", pic("up-4"), "baseRev"],
      ["up-5", { ...pic("up-5"), client: "nobody", baseRev: 0 }, "client"],
      ["up-6", { ...pic("up-6"), alt: { en: "<b>" }, baseRev: 0 }, "alt.en"],
      ["up-7", { cat: "photo", baseRev: 0 }, "src"],
    ];
    for (const [id, b, field] of cases) {
      const r = await put(`/api/admin/gallery/${id}`, b);
      expect(r.status, id).toBe(400);
      expect((await body(r)).field, id).toBe(field);
    }
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM gallery_items").first())!.n).toBe(0);
  });

  it("a video upload with its poster is a video item with a film", async () => {
    const r = await put("/api/admin/gallery/up-film", {
      src: `${R2}/up-film.mp4`, poster: `${R2}/up-film.poster.webp`, cat: "photo", ratio: 1.778, baseRev: 0,
    });
    expect(r.status).toBe(200);
    expect((await body(r)).item).toMatchObject({ video: true, film: `${R2}/up-film.mp4`, thumb: `${R2}/up-film.poster.webp` });
  });

  it("refuses a foreign Origin", async () => {
    expect((await put("/api/admin/gallery/up-x", { ...pic("up-x"), baseRev: 0 }, { origin: "https://evil.example" })).status).toBe(403);
  });
});

describe("DELETE /api/admin/gallery/:id", () => {
  it("stages the removal; stale rev 409; saving again re-activates it", async () => {
    await put("/api/admin/gallery/up-del", { ...pic("up-del"), baseRev: 0 });
    expect((await del("/api/admin/gallery/up-del?baseRev=7")).status).toBe(409);
    expect((await del("/api/admin/gallery/up-del")).status).toBe(400);
    const d = await body(await del("/api/admin/gallery/up-del?baseRev=1"));
    expect(d.item).toMatchObject({ deleted: true, rev: 2 });
    expect((await audits("gallery.delete")).map((a) => a.target)).toEqual(["up-del"]);
    const back = await body(await put("/api/admin/gallery/up-del", { ...pic("up-del"), baseRev: 2 }));
    expect(back.item).toMatchObject({ deleted: false, rev: 3 });
  });

  it("a default with no row cannot be deleted (409, current = the default)", async () => {
    const r = await del(`/api/admin/gallery/${encodeURIComponent(DESIGN.f)}?baseRev=1`);
    expect(r.status).toBe(409);
    expect((await body(r)).current).toMatchObject({ id: DESIGN.f, kind: "default", rev: 0 });
  });
});

describe("after publish()", () => {
  const AR = (defaults as { AR_DIGITS: string[] }).AR_DIGITS;
  /** The archive's headline count for one service, from the served /library. */
  async function count(cat: string): Promise<number> {
    const html = await (await call("/library")).text();
    const archive = html.slice(html.indexOf("<!-- @static:archive -->"), html.indexOf("<!-- @/static:archive -->"));
    const m = archive.match(new RegExp(`data-cat="${cat}">\\s*<h2>[^<]*<span class="acc-static-count">([^<]+)</span>`));
    expect(m, cat).not.toBeNull();
    return Number(m![1].replace(/./g, (d) => String(AR.indexOf(d))));
  }
  const published = async () =>
    ((await (await call("/api/content")).json()) as { gallery: { id: string; hidden?: true }[] }).gallery;

  it("an upload shows; then a deleted upload and a hidden default are gone from /api/content and /library", async () => {
    const design0 = await count("design");
    const photo0 = await count("photo");

    await put("/api/admin/gallery/up-a", { src: `${R2}/up-a.webp`, cat: "design", date: "2026-11", baseRev: 0 });
    await put("/api/admin/gallery/up-b", { ...pic("up-b"), baseRev: 0 });
    await publish(env.DB, ADMIN);
    expect((await published()).map((g) => g.id).sort()).toEqual(["up-a", "up-b"]);
    expect(await count("design")).toBe(design0 + 1);
    expect(await count("photo")).toBe(photo0 + 1);

    await del("/api/admin/gallery/up-a?baseRev=1");
    await put(`/api/admin/gallery/${encodeURIComponent(DESIGN.f)}`, { hidden: true, baseRev: 0 });
    await publish(env.DB, ADMIN);
    const g = await published();
    expect(g.map((x) => x.id).sort()).toEqual([DESIGN.f, "up-b"].sort());
    expect(g.find((x) => x.id === DESIGN.f)!.hidden).toBe(true);
    expect(await count("design")).toBe(design0 - 1);
    expect(await count("photo")).toBe(photo0 + 1);

    const items = ((await (await call("/api/admin/gallery")).json()) as { items: Item[] }).items;
    expect(items.filter((i) => i.changed)).toEqual([]);
  });
});
