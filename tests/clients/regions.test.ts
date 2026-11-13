// C-15: @static:archive lists the published clients that have a visible piece,
// as links to their /library?client= views, so a crawler reaches them before
// any script runs. main.js's tables carry no clients, so build_static (and an
// empty or client-only store) writes the archive exactly as before.
import { env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { changedRegions, mergedTables } from "../../worker/src/render/regions";
import { archiveBlock, clientsBlock, pageRegions, type Tables } from "../../worker/src/shared/regions.mjs";
import { emptySnapshot, type Client, type GalleryItem, type Snapshot } from "../../worker/src/store";
import { publish } from "../../worker/src/publish";
import defaults from "../../worker/src/generated/defaults.json";

const ORIGIN = "http://example.com";
const BY = "ceo@aliphcreative.com";
const D = defaults as unknown as Tables;
const db = () => env.DB;
const run = (sql: string, ...b: unknown[]) => db().prepare(sql).bind(...b).run();
const snap = (clients: Client[], gallery: GalleryItem[]): Snapshot => ({ ...emptySnapshot(1), clients, gallery });
/** The archive region's inner HTML of a served or asset page. */
const archiveOf = (html: string) => /<!-- @static:archive -->([\s\S]*?)<!-- @\/static:archive -->/.exec(html)![1];

const MEDIA0 = (D.MEDIA as { f: string }[])[0].f; // a default piece (design, no date)
const A: Client = { id: "acme-ab12", name: { ar: "أكمي", en: "Acme" }, line: { ar: "مطبعة <القدس>", en: "Print" } };
const B: Client = { id: "bara-cd34", name: { ar: "برّا", en: "Bara" } };
const C: Client = { id: "cala-ef56", name: { ar: "كالا", en: "Cala" } };
const up = (id: string, client: string, date: string | undefined, extra: Partial<GalleryItem> = {}): GalleryItem => ({
  id,
  src: `https://media.aliphcreative.com/${id}.webp`,
  cat: "photo",
  date,
  client,
  ...extra,
});

describe("clientsBlock / archiveBlock", () => {
  it("no CLIENTS table (build_static, defaults) → nothing, the archive is the default's", () => {
    expect(clientsBlock(D)).toBe("");
    expect(archiveBlock(mergedTables(emptySnapshot(1)))).toBe(archiveBlock(D));
  });

  it("published clients without a visible piece → no list, no changed region", () => {
    const s = snap([A, B], [up("u-hidden", A.id, "2025-01-01", { hidden: true })]);
    expect(clientsBlock(mergedTables(s))).toBe("");
    // the hidden upload is not in MEDIA either, so the archive equals the default
    expect(changedRegions(s, "library.html").has("archive")).toBe(false);
    expect(changedRegions(snap([A, B, C], []), "library.html").size).toBe(0);
  });

  it("lists clients with visible pieces: newest piece first, counts, escaped names and lines, links", () => {
    const s = snap(
      [A, B, C],
      [
        { id: MEDIA0, client: A.id }, // a default piece, no date
        up("u-a", A.id, "2023-05-01"),
        up("u-b1", B.id, "2025-02-01"),
        up("u-b2", B.id, "2024-01-01"),
        up("u-c", C.id, "2026-01-01", { hidden: true }), // hidden: C has nothing visible
        up("u-x", "draft-only-zz99", "2026-06-01"), // not a published client
      ],
    );
    const html = clientsBlock(mergedTables(s));
    expect(html).toContain('<nav class="acc-static acc-static-clients" aria-label="العملاء">');
    expect(html).toContain('<h2>العملاء <span class="acc-static-count">٢</span></h2>');
    const links = [...html.matchAll(/<a href="([^"]+)">([^<]+)<\/a> <span class="acc-static-count">([^<]+)<\/span>/g)];
    expect(links.map((m) => [m[1], m[2], m[3]])).toEqual([
      ["/library?client=bara-cd34", "برّا", "٢"],
      ["/library?client=acme-ab12", "أكمي", "٢"],
    ]);
    expect(html).toContain("<p>مطبعة &lt;القدس&gt;</p>");
    expect(html).not.toContain("كالا");
    expect(html).not.toContain("draft-only");
    // the list opens the region, before the service panels
    const archive = pageRegions(mergedTables(s))["library.html"].archive;
    expect(archive.startsWith(html)).toBe(true);
    expect(archive.slice(html.length)).toBe(archiveBlock({ ...mergedTables(s), CLIENTS: [] }));
  });
});

describe("served /library", () => {
  beforeEach(async () => {
    await db().batch(
      ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
    );
    const base = (await db().prepare("SELECT coalesce(max(id), 0) AS m FROM revisions").first<{ m: number }>())!.m;
    await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
  });

  it("a published client with a published piece is listed in the crawler's archive; draft-only ones are not", async () => {
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('acme-ab12', 'أكمي', 'Acme', ?)", BY);
    await run(
      "INSERT INTO gallery_items (id, src, cat, date, client_id, updated_by) VALUES ('u-1', 'https://media.aliphcreative.com/u-1.webp', 'photo', '2025-03-01', 'acme-ab12', ?)",
      BY,
    );
    await publish(db(), BY);
    // after the publish: a draft-only client and a draft-only piece naming it
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('later-zz99', 'لاحق', 'Later', ?)", BY);
    await run(
      "INSERT INTO gallery_items (id, src, cat, client_id, updated_by) VALUES ('u-2', 'https://media.aliphcreative.com/u-2.webp', 'photo', 'later-zz99', ?)",
      BY,
    );

    const body = await (await SELF.fetch(ORIGIN + "/library")).text();
    const region = archiveOf(body);
    expect(region).toContain('<a href="/library?client=acme-ab12">أكمي</a> <span class="acc-static-count">١</span>');
    expect(region).not.toContain("later-zz99");
    // the panels after the list are the merged archive's, unchanged in markup
    expect(region).toContain('class="acc-panel acc-static" data-cat="photo"');
  });

  it("only clients published (no pieces) → the archive region is the asset's, byte for byte", async () => {
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('acme-ab12', 'أكمي', 'Acme', ?)", BY);
    await publish(db(), BY);
    const body = await (await SELF.fetch(ORIGIN + "/library")).text();
    const asset = await (await env.ASSETS.fetch(ORIGIN + "/library")).text();
    expect(archiveOf(body)).toBe(archiveOf(asset));
    expect(body).not.toContain("acc-static-clients");
  });
});
