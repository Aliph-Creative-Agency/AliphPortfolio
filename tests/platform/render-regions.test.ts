// P-08: the @static:* SEO regions re-rendered from the published store
// (render/regions.ts over shared/merge.mjs + shared/regions.mjs). The
// rewritten page must equal fill() run with the SAME merged tables, every
// region and every byte around them, and an untouched region stays the asset.
import { env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { changedRegions, mergedTables, onRegions, touchesRegions } from "../../worker/src/render/regions";
import { scriptJson } from "../../worker/src/render/text";
import { fieldPath, mergeContent } from "../../worker/src/shared/merge.mjs";
import { archiveBlock, fill, pageRegions, projectsLD, ldScript, regionInner, type Tables } from "../../worker/src/shared/regions.mjs";
import { emptySnapshot, type GalleryItem, type Pair, type Snapshot } from "../../worker/src/store";
import defaults from "../../worker/src/generated/defaults.json";
import registry from "../../worker/src/generated/registry.json";

const ORIGIN = "http://example.com";
const D = defaults as unknown as Tables;
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();
const MAIN = '<script src="main.js"></script>';
const BLOB_OPEN = '<script type="application/json" id="aliph-content">';
type File = "index.html" | "library.html";
const PAGE = { "index.html": "home", "library.html": "library" } as const;

const asset = async (file: File) => (await env.ASSETS.fetch(`${ORIGIN}/${file}`)).text();
const snap = (over: Partial<Snapshot>): Snapshot => ({ ...emptySnapshot(1), ...over });
const text = (t: Record<string, Pair>) => snap({ text: t });
const gallery = (g: GalleryItem[]) => snap({ gallery: g });

/** Only the region handlers, over the real asset. */
async function regionsOnly(file: File, s: Snapshot): Promise<string> {
  const rw = new HTMLRewriter();
  onRegions(rw, s, PAGE[file]);
  return rw.transform(new Response(await asset(file), { headers: { "content-type": "text/html" } })).text();
}

/** What build_static would write with the merged tables: fill() every region. */
async function filled(file: File, T: Tables): Promise<string> {
  let html = await asset(file);
  for (const [name, body] of Object.entries(pageRegions(T)[file])) html = fill(html, name, body, file);
  return html;
}

function between(html: string, name: string): string {
  const open = `<!-- @static:${name} -->`;
  const a = html.indexOf(open);
  const b = html.indexOf(`<!-- @/static:${name} -->`);
  expect(a, name).toBeGreaterThanOrEqual(0);
  expect(b, name).toBeGreaterThan(a);
  return html.slice(a + open.length, b);
}

/** The rewrite equals fill() on the same merged tables; returns it. */
async function expectFill(file: File, s: Snapshot): Promise<string> {
  const out = await regionsOnly(file, s);
  expect(out === (await filled(file, mergedTables(s))), `${file} == fill(T')`).toBe(true);
  return out;
}

describe("the shared merge (shared/merge.mjs)", () => {
  it("derives every registry field's path from its key alone (main.js has no registry)", () => {
    const fields = registry.fields as { key: string; path: (string | number)[] }[];
    expect(fields.length).toBeGreaterThan(50);
    for (const f of fields) expect(fieldPath(D, f.key), f.key).toEqual(f.path);
    for (const bad of ["subcat.design.nope.name", "subcat.design.logos.__proto__", "project.9.name", "project.0.date",
      "testimonial.x.quote", "testimonial.0.constructor", "meta.home.robots", "hero1", "subcat.toString.logos.name"]) {
      expect(fieldPath(D, bad), bad).toBeNull();
    }
  });

  it("sets I18N and field locales in place, creates an anonymous name's holder, leaves defaults alone", () => {
    const before = JSON.stringify(D);
    const T = mergedTables(text({
      pfVisit: { en: "Open it" },
      "testimonial.2.name": { ar: "اسم جديد" },
      "subcat.design.logos.descShort": { ar: "سطر" },
      "project.1.tagline": { ar: "خط" },
      "meta.library.title": { ar: "عنوان" },
    }));
    expect(T.I18N.pfVisit).toEqual({ ar: D.I18N.pfVisit.ar, en: "Open it" });
    expect(D.TESTIMONIALS[2].name).toBeNull();
    expect(T.TESTIMONIALS[2].name).toEqual({ ar: "اسم جديد" });
    expect(T.SUBCATS.design[0].descShort.ar).toBe("سطر");
    expect(T.PROJECTS[1].profile.tagline).toEqual({ ar: "خط", en: D.PROJECTS[1].profile.tagline.en });
    expect(T.META.library.title.ar).toBe("عنوان");
    expect(JSON.stringify(D)).toBe(before);
  });

  it("gallery: an override re-files its row in place, hidden drops it, uploads append (hidden or src-less ones do not)", () => {
    const T = { MEDIA: structuredClone(D.MEDIA) as any[] };
    const first = T.MEDIA[0].f;
    const second = T.MEDIA[1].f;
    const MEDIA = T.MEDIA; // main.js's binding is const: same array, mutated
    mergeContent(T, {
      gallery: [
        { id: first, cat: "photo", date: "2026-01-02", alt: { ar: "بديل" } },
        { id: second, hidden: true },
        { id: "up-1", src: "https://media.aliphcreative.com/video/up-1.mp4", poster: "https://media.aliphcreative.com/img/up-1.webp", cat: "photo", ratio: 0.5625 },
        { id: "up-2", src: "https://media.aliphcreative.com/img/up-2.webp", cat: "design", hidden: true },
        { id: "up-3", cat: "design" },
      ],
    });
    expect(T.MEDIA).toBe(MEDIA);
    expect(T.MEDIA.length).toBe(D.MEDIA.length); // -1 hidden, +1 upload
    expect(T.MEDIA[0]).toEqual({ ...D.MEDIA[0], c: "photo", d: "2026-01-02", alt: { ar: "بديل" } });
    expect(T.MEDIA.some((m) => m.f === second)).toBe(false);
    expect(T.MEDIA.at(-1)).toEqual({
      f: "up-1", c: "photo", r: 0.5625, d: null, v: 1,
      src: "https://media.aliphcreative.com/video/up-1.mp4", poster: "https://media.aliphcreative.com/img/up-1.webp",
    });
  });
});

describe("regions re-rendered in the stream (render/regions.ts)", () => {
  it("an empty store, and snapshots that touch no region's output, leave both pages byte-identical", async () => {
    const untouched = [
      emptySnapshot(1),
      snap({ text: { navHome: { ar: "بيت" }, "meta.home.title": { ar: "عنوان" } }, slots: { "home.media.1": { alt: { ar: "x" } } }, rings: { design: ["a"] } }),
      // English only: the regions are Arabic
      text({ "testimonial.0.quote": { en: "New" }, "subcat.design.logos.desc": { en: "New" }, pfVisit: { en: "Go" } }),
      // the same Arabic as the default
      text({ "testimonial.0.name": { ar: D.TESTIMONIALS[0].name.ar } }),
    ];
    for (const s of untouched) {
      for (const file of ["index.html", "library.html"] as const) {
        expect(changedRegions(s, file).size, file).toBe(0);
        expect((await regionsOnly(file, s)) === (await asset(file)), file).toBe(true);
      }
    }
    expect(touchesRegions(untouched[1])).toBe(false);
  });

  it("trName: an edited first testimonial name lands inside the <p>, escaped, and nowhere else changes but band and ld", async () => {
    const s = text({ "testimonial.0.name": { ar: "اسم <b> & \"جديد\"" } });
    expect([...changedRegions(s, "index.html").keys()].sort()).toEqual(["band", "ld", "trName"]);
    const out = await expectFill("index.html", s);
    expect(out).toContain('<p class="tr-name"><!-- @static:trName -->اسم &lt;b&gt; &amp; &quot;جديد&quot;<!-- @/static:trName --></p>');
  });

  it("trBiz: the business line", async () => {
    const out = await expectFill("index.html", text({ "testimonial.0.business": { ar: "عمل جديد" } }));
    expect(out).toContain('<p class="tr-biz"><!-- @static:trBiz -->عمل جديد<!-- @/static:trBiz --></p>');
  });

  it("trQuote: the quote inside the <blockquote>, with the band and the reviews JSON-LD", async () => {
    const s = text({ "testimonial.0.quote": { ar: "اقتباس جديد" } });
    const out = await expectFill("index.html", s);
    expect(between(out, "trQuote")).toBe("اقتباس جديد");
    expect(between(out, "band")).toContain('<blockquote class="tb-quote">اقتباس جديد</blockquote>');
    expect(between(out, "ld")).toContain('"reviewBody": "اقتباس جديد"');
    expect(await regionsOnly("library.html", s)).toBe(await asset("library.html"));
  });

  it("an anonymous testimonial given a name changes the band and ld, not the tr* lines", async () => {
    const s = text({ "testimonial.2.name": { ar: "مسمّى" } });
    expect([...changedRegions(s, "index.html").keys()].sort()).toEqual(["band", "ld"]);
    const out = await expectFill("index.html", s);
    expect(between(out, "band")).toContain('<span class="tb-name">مسمّى</span>');
  });

  it("a service line edit changes the home services block only", async () => {
    const s = text({ "subcat.photo.reels.desc": { ar: "سطر الخدمة" } });
    expect([...changedRegions(s, "index.html").keys()]).toEqual(["services"]);
    const out = await expectFill("index.html", s);
    expect(between(out, "services")).toContain("<p>سطر الخدمة</p>");
    expect(changedRegions(s, "library.html").size).toBe(0);
  });

  it("a published upload in photo changes only the archive's counts and runs (library ld untouched)", async () => {
    const s = gallery([{ id: "up-v", src: "https://media.aliphcreative.com/video/up-v.mp4", poster: "https://media.aliphcreative.com/img/up-v.webp", cat: "photo", date: "2026-11-01" }]);
    expect([...changedRegions(s, "library.html").keys()]).toEqual(["archive"]);
    expect(changedRegions(s, "index.html").size).toBe(0);
    const out = await expectFill("library.html", s);
    const T = mergedTables(s);
    expect(between(out, "archive")).toBe(regionInner(archiveBlock(T)));
    const count = (m: any[], v: boolean) => m.filter((x) => x.c === "photo" && !!x.v === v).length;
    const ar = (n: number) => String(n).replace(/\d/g, (d) => D.AR_DIGITS[+d]);
    const photo = D.MEDIA.filter((m: any) => m.c === "photo").length;
    expect(between(out, "archive")).toContain(`<span class="acc-static-count">${ar(photo + 1)}</span></h2>`);
    expect(between(out, "archive")).toContain(`فيديوهات <span class="acc-static-count">${ar(count(D.MEDIA, true) + 1)}</span>`);
    expect(between(out, "ld")).toBe(between(await asset("library.html"), "ld"));
  });

  it("a hidden default piece drops from its count", async () => {
    const design = D.MEDIA.filter((m: any) => m.c === "design");
    const s = gallery([{ id: design[0].f, hidden: true }]);
    const out = await expectFill("library.html", s);
    const ar = (n: number) => String(n).replace(/\d/g, (d) => D.AR_DIGITS[+d]);
    expect(between(out, "archive")).toContain(`إعلانات رقمية <span class="acc-static-count">${ar(design.length - 1)}</span>`);
  });

  it("a PROJECTS edit changes the library JSON-LD and the archive, and the home services block", async () => {
    const s = text({ "project.0.name": { ar: "مشروع معدّل" }, "project.0.body": { ar: "نصّ" } });
    expect([...changedRegions(s, "library.html").keys()].sort()).toEqual(["archive", "ld"]);
    expect([...changedRegions(s, "index.html").keys()]).toEqual(["services"]);
    const out = await expectFill("library.html", s);
    expect(between(out, "ld")).toBe(regionInner(ldScript(projectsLD(mergedTables(s)))));
    expect(between(out, "ld")).toContain('"name": "مشروع معدّل"');
    expect(between(out, "archive")).toContain("<p>نصّ</p>");
    await expectFill("index.html", s);
  });

  it("pfVisit (the archive's live-site link) re-renders the archive", async () => {
    const s = text({ pfVisit: { ar: "افتح" } });
    expect([...changedRegions(s, "library.html").keys()]).toEqual(["archive"]);
    expect(await expectFill("library.html", s)).toContain(`rel="noopener">افتح</a>`);
  });
});

describe("served pages (one pass with text, slots and the blob)", () => {
  beforeEach(async () => {
    await db().batch(
      ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
    );
    await run("UPDATE meta SET v = '1' WHERE k = 'publish_rev'");
  });

  const served = async (path: string) => (await SELF.fetch(ORIGIN + path)).text();
  const withBlob = async (html: string) => {
    const pub = await (await SELF.fetch(ORIGIN + "/api/content")).json();
    return html.replace(MAIN, `${BLOB_OPEN}${scriptJson(pub)}</script>\n${MAIN}`);
  };

  it("a published testimonial edit is in the home tr* regions before any script runs", async () => {
    await run("INSERT INTO text_values (key, locale, draft, published, updated_by) VALUES ('testimonial.0.quote', 'ar', 'منشور', 'منشور', 'x')");
    const s = text({ "testimonial.0.quote": { ar: "منشور" } });
    const out = await served("/");
    expect(between(out, "trQuote")).toBe("منشور");
    expect(out).toBe(await withBlob(await filled("index.html", mergedTables(s))));
  });

  it("a published upload is in the served /library archive, and gallery JSON goes through the store", async () => {
    const item = { id: "up-s", src: "https://media.aliphcreative.com/img/up-s.webp", cat: "design", date: "2026-10" };
    await run(
      "INSERT INTO gallery_items (id, src, cat, date, published_json, updated_by) VALUES (?, ?, ?, ?, ?, 'x')",
      item.id, item.src, item.cat, item.date, JSON.stringify(item),
    );
    const out = await served("/library");
    expect(out).toBe(await withBlob(await filled("library.html", mergedTables(gallery([item])))));
    expect(out).not.toBe(await withBlob(await asset("library.html")));
  });
});
