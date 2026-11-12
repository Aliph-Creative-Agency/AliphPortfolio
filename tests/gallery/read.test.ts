// G-02a: GET /api/admin/gallery read model.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import defaults from "../../worker/src/generated/defaults.json";
import { call, installAccess, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

interface Item {
  id: string; kind: string; cat: string; ratio: number; video: boolean; thumb: string; full: string; film?: string;
  hidden: boolean; deleted: boolean; changed: boolean; rev: number; alt: Record<string, string>;
}
interface Model { items: Item[]; subcats: unknown; rings: Record<string, { ids: string[]; isDefault: boolean; rev: number; changed: boolean }>; publishRev: number }
const read = async () => (await (await call("/api/admin/gallery")).json()) as Model;

const row = (id: string, cols: Record<string, unknown>) =>
  env.DB.prepare(
    `INSERT INTO gallery_items (id, src, poster, cat, hidden, state, published_json, updated_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'test')`,
  )
    .bind(id, cols.src ?? null, cols.poster ?? null, cols.cat ?? null, cols.hidden ?? 0, cols.state ?? "active", cols.pub ?? null)
    .run();

describe("GET /api/admin/gallery", () => {
  it("empty store: every default, none changed, rings = defaults", async () => {
    const m = await read();
    expect(m.items).toHaveLength(79);
    expect(m.items.every((i) => i.kind === "default" && !i.changed && !i.hidden && !i.deleted && i.rev === 0)).toBe(true);
    const photo = defaults.RINGS.photo as { f?: string; shot?: string }[];
    expect(m.rings.photo).toMatchObject({ isDefault: true, rev: 0, changed: false });
    expect(m.rings.photo.ids).toEqual(photo.map((x) => x.f ?? x.shot));
    expect(m.publishRev).toBe(0);
    const img = m.items.find((i) => !i.video)!;
    expect(img.thumb).toBe(`https://media.aliphcreative.com/thumb/${img.id}`);
    const vid = m.items.find((i) => i.video)!;
    expect(vid.film).toBe(`https://media.aliphcreative.com/video/${vid.id}`);
    expect(vid.thumb).toMatch(/\/thumb\/.+\.webp$/);
  });

  it("a hidden override row: hidden, changed, kind override", async () => {
    const id = defaults.MEDIA[0].f;
    await row(id, { hidden: 1 });
    const it = (await read()).items.find((i) => i.id === id)!;
    expect(it).toMatchObject({ kind: "override", hidden: true, changed: true, rev: 1 });
    expect(it.cat).toBe(defaults.MEDIA[0].c);
  });

  it("a row equal to its published copy is not changed", async () => {
    const id = defaults.MEDIA[1].f;
    await row(id, { hidden: 1, pub: JSON.stringify({ id, hidden: true }) });
    expect((await read()).items.find((i) => i.id === id)!.changed).toBe(false);
  });

  it("an upload is appended with its URLs; a video upload carries its film", async () => {
    await row("abc123-pic", { src: "https://media.aliphcreative.com/admin/2026/11/abc123-pic.webp", cat: "photo" });
    await row("abc123-film", {
      src: "https://media.aliphcreative.com/admin/2026/11/abc123-film.mp4",
      poster: "https://media.aliphcreative.com/admin/2026/11/abc123-film.poster.webp",
      cat: "photo",
    });
    const m = await read();
    expect(m.items).toHaveLength(81);
    const pic = m.items.find((i) => i.id === "abc123-pic")!;
    expect(pic).toMatchObject({ kind: "upload", video: false, changed: true, cat: "photo" });
    expect(pic.thumb).toBe("https://media.aliphcreative.com/admin/2026/11/abc123-pic.webp");
    const film = m.items.find((i) => i.id === "abc123-film")!;
    expect(film.video).toBe(true);
    expect(film.thumb).toMatch(/poster\.webp$/);
    expect(film.film).toMatch(/\.mp4$/);
  });

  it("a deleted row: deleted true; unpublished deletion is not a change", async () => {
    await row("gone-1", { src: "https://media.aliphcreative.com/admin/2026/11/gone-1.webp", cat: "design", state: "deleted" });
    await row("gone-2", { src: "https://media.aliphcreative.com/admin/2026/11/gone-2.webp", cat: "design", state: "deleted", pub: "{}" });
    const m = await read();
    expect(m.items.find((i) => i.id === "gone-1")).toMatchObject({ deleted: true, changed: false });
    expect(m.items.find((i) => i.id === "gone-2")).toMatchObject({ deleted: true, changed: true });
  });

  it("a stored ring shows its ids, not default, changed until published", async () => {
    await env.DB.prepare(
      "INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('photo', ?1, 'test')",
    ).bind(JSON.stringify([defaults.MEDIA[2].f])).run();
    const r = (await read()).rings.photo;
    expect(r).toMatchObject({ isDefault: false, changed: true, rev: 1, ids: [defaults.MEDIA[2].f] });
  });

  it("needs Access", async () => {
    const r = await (await import("../../worker/src/index")).default.fetch(
      new Request("https://aliphcreative.com/api/admin/gallery"),
      env as never,
      { waitUntil() {}, passThroughOnException() {} } as never,
    );
    expect(r.status).toBe(403);
  });
});
