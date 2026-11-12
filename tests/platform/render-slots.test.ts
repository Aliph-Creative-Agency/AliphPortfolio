// P-06b: published media slots rendered into the served HTML (render/slots.ts).
import { env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { onSlots } from "../../worker/src/render/slots";
import { scriptJson } from "../../worker/src/render/text";
import { emptySnapshot, type SlotValue, type Snapshot } from "../../worker/src/store";
import registry from "../../worker/src/generated/registry.json";

const ORIGIN = "http://example.com";
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
type Def = { id: string; page: string; kind: string; src: string; preview?: string };
const SLOTS = registry.slots as Def[];
const def = (id: string) => SLOTS.find((d) => d.id === id)!;
const MAIN = '<script src="main.js"></script>';
const BLOB_OPEN = '<script type="application/json" id="aliph-content">';
const NEW = "https://media.aliphcreative.com/pics/new-hero.webp";

async function publishSlot(id: string, value: SlotValue) {
  const j = JSON.stringify(value);
  await run("INSERT INTO slot_values (slot, draft_json, published_json, rev, updated_by) VALUES (?, ?, ?, 1, 'x')", id, j, j);
  await run("UPDATE meta SET v = '1' WHERE k = 'publish_rev'");
}

const asset = async (path: string) => (await env.ASSETS.fetch(ORIGIN + path)).text();
const served = async (path: string) => (await SELF.fetch(ORIGIN + path)).text();

/** Run only the slot handlers over some HTML, collecting warnings. */
async function slotsOnly(html: string, slots: Snapshot["slots"], page: "home" | "about") {
  const warnings: string[] = [];
  const s = { ...emptySnapshot(1), slots };
  const rw = new HTMLRewriter();
  onSlots(rw, s, page, (m) => warnings.push(m));
  const out = await rw.transform(new Response(html, { headers: { "content-type": "text/html" } })).text();
  return { out, warnings };
}

beforeEach(async () => {
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  await run("UPDATE meta SET v = '0' WHERE k = 'publish_rev'");
});

describe("published slots in the served HTML", () => {
  it("one published slot changes that img's src and every other byte is identical", async () => {
    const d = def("home.media.1");
    await publishSlot(d.id, { src: NEW });
    const before = await asset("/");
    const pub = await (await SELF.fetch(ORIGIN + "/api/content")).json();
    expect(before.split(`src="${d.src}"`).length - 1).toBe(1);
    const expected = before
      .replace(`src="${d.src}"`, `src="${NEW}"`)
      .replace(MAIN, `${BLOB_OPEN}${scriptJson(pub)}</script>\n${MAIN}`);
    expect(await served("/")).toBe(expected);
  });

  it("the ordinal count matches the generator on both pages (the LAST slot of each lands)", async () => {
    for (const page of ["home", "about"] as const) {
      const last = SLOTS.filter((d) => d.page === page && d.kind === "media").at(-1)!;
      const html = await asset(page === "home" ? "/" : "/about");
      const { out, warnings } = await slotsOnly(html, { [last.id]: { src: NEW } }, page);
      expect(warnings).toEqual([]);
      expect(out).toBe(html.replace(`src="${last.src}"`, `src="${NEW}"`));
    }
  });

  it("a preview slot: poster → img src, preview → the figure's data-preview, alt.ar → alt", async () => {
    const d = SLOTS.find((x) => x.page === "home" && x.preview)!;
    const poster = "https://media.aliphcreative.com/pics/new-poster.webp";
    const film = "https://media.aliphcreative.com/video/new-film.mp4";
    await publishSlot(d.id, { src: NEW, poster, preview: film, alt: { ar: "فيلم \"جديد\"", en: "New film" } });
    const body = await served("/");
    expect(body).not.toContain(`data-preview="${d.preview}"`);
    expect(body).toMatch(
      new RegExp(`data-preview="${film}">\\s*<img src="${poster}" alt="فيلم &quot;جديد&quot;"`),
    );
  });

  it("a slot on /about leaves / alone, and the other way round", async () => {
    await publishSlot("about.media.1", { src: NEW });
    const home = await served("/");
    expect(home).not.toContain(`src="${NEW}"`);
    expect(await served("/about")).toContain(`src="${NEW}"`);
  });
});

describe("stale registry entries are skipped", () => {
  it("an img whose src no longer matches the registry is untouched, with a warning", async () => {
    const d = def("home.media.2");
    const html = (await asset("/")).replace(`src="${d.src}"`, 'src="assets/media/renamed.webp"');
    const { out, warnings } = await slotsOnly(html, { [d.id]: { src: NEW, alt: { ar: "بديل" } } }, "home");
    expect(out).toBe(html);
    expect(warnings).toEqual([`slot ${d.id}: markup no longer matches the registry, skipped`]);
  });

  it("an extra picture above shifts the ordinals: nothing is painted on the wrong holder", async () => {
    const d1 = def("home.media.1");
    const orig = await asset("/");
    const at = orig.indexOf(`<img src="${d1.src}"`);
    const html = orig.slice(0, at) + '<img src="assets/media/inserted.webp" alt="">' + orig.slice(at);
    const { out, warnings } = await slotsOnly(html, { "home.media.1": { src: NEW }, "home.media.3": { src: NEW } }, "home");
    expect(out).toBe(html);
    expect(warnings.length).toBe(2);
  });

  it("a figure whose data-preview changed keeps it", async () => {
    const d = SLOTS.find((x) => x.page === "home" && x.preview)!;
    const html = (await asset("/")).replace(`data-preview="${d.preview}"`, 'data-preview="https://media.aliphcreative.com/video/other.mp4"');
    const { out, warnings } = await slotsOnly(html, { [d.id]: { preview: "https://media.aliphcreative.com/video/x.mp4" } }, "home");
    expect(out).toBe(html);
    expect(warnings).toEqual([`slot ${d.id}: preview markup changed, skipped`]);
  });

  it("no slot overrides for the page → no handlers, the HTML streams through unchanged", async () => {
    const html = await asset("/library");
    const { out, warnings } = await slotsOnly(html, { "home.media.1": { src: NEW } }, "about");
    expect(out).toBe(html);
    expect(warnings).toEqual([]);
  });
});
