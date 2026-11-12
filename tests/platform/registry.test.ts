// P-04b: the generated defaults + registry cover the whole editable surface of
// the three pages, match the markup they were generated from, and are current.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import defaults from "../../worker/src/generated/defaults.json";
import registry from "../../worker/src/generated/registry.json";

const FILES: Record<string, string> = { home: "index.html", about: "about.html", library: "library.html" };
const html = async (page: string) => (await env.ASSETS.fetch(`http://example.com/${FILES[page]}`)).text();

describe("generated files are current", () => {
  it("committed defaults.json / registry.json equal a fresh generate() (run `npm run gen:defaults`)", () => {
    expect(defaults).toEqual(env.TEST_GENERATED.defaults);
    expect(registry).toEqual(env.TEST_GENERATED.registry);
  });
});

describe("text registry", () => {
  const keys = new Set(registry.text.map((e) => e.key));

  it("has every I18N key exactly once", () => {
    expect(registry.text.length).toBe(keys.size);
    expect([...keys].sort()).toEqual(Object.keys(defaults.I18N).sort());
  });

  it("covers every data-i18n / data-i18n-label in the 3 pages", async () => {
    for (const page of Object.keys(FILES)) {
      const src = await html(page);
      const used = new Set([...src.matchAll(/\bdata-i18n(?:-label)?="([^"]+)"/g)].map((m) => m[1]));
      expect(used.size).toBeGreaterThan(10);
      for (const k of used) expect(keys.has(k), `${page}: ${k}`).toBe(true);
      for (const e of registry.text) {
        if (used.has(e.key)) expect(e.pages, e.key).toContain(page);
      }
    }
  });

  it("maxLength = ceil(longest locale × 1.6) and kind is text or richline", () => {
    for (const e of registry.text) {
      const v = (defaults.I18N as Record<string, { ar: string; en: string }>)[e.key];
      expect(e.maxLength, e.key).toBe(Math.ceil(Math.max(v.ar.length, v.en.length) * 1.6));
      const rich = v.ar.includes("\n") || v.en.includes("\n");
      expect(e.kind, e.key).toBe(rich ? "richline" : "text");
    }
    expect(registry.text.some((e) => e.kind === "richline")).toBe(true);
  });
});

describe("fields (P-05: SEO head strings + SUBCATS / PROJECTS / TESTIMONIALS copy)", () => {
  const D = defaults as Record<string, any>;
  const at = (path: (string | number)[]) => path.reduce((o: any, k) => (o == null ? o : o[k]), D);

  it("keys are unique, never collide with I18N, and follow the documented patterns", () => {
    const keys = registry.fields.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) {
      expect(D.I18N[k], k).toBeUndefined();
      expect(k).toMatch(
        /^(meta\.(home|about|library)\.(title|description|ogTitle|ogDescription)|subcat\.(design|photo|tech)\.[a-z]+\.(name|desc|descShort)|project\.\d+\.(name|desc|tagline|body)|testimonial\.\d+\.(name|business|quote))$/,
      );
    }
  });

  it("every SEO string of the 3 pages is a field whose default is what the HTML has", async () => {
    for (const page of Object.keys(FILES)) {
      const src = await html(page);
      const title = /<title>([^<]*)<\/title>/.exec(src)![1];
      const desc = /<meta name="description" content="([^"]*)"/.exec(src)![1];
      expect(D.META[page].title.ar).toBe(title);
      expect(D.META[page].description.ar).toBe(desc);
      for (const f of ["title", "description", "ogTitle", "ogDescription"]) {
        const e = registry.fields.find((x) => x.key === `meta.${page}.${f}`)!;
        expect(e.locales).toEqual(["ar"]);
        expect(e.minLength).toBe(1);
        expect(e.maxLength).toBe(Math.ceil(D.META[page][f].ar.length * 1.6));
      }
    }
  });

  it("covers every SUBCATS / PROJECTS / TESTIMONIALS entry and each path reaches its default", () => {
    const n = (t: string) => registry.fields.filter((f) => f.table === t).length;
    const subs = Object.values(D.SUBCATS).flat().length;
    expect(n("SUBCATS")).toBe(subs * 3);
    expect(n("PROJECTS")).toBe(D.PROJECTS.length * 4);
    expect(n("TESTIMONIALS")).toBe(D.TESTIMONIALS.length * 3);
    for (const f of registry.fields) {
      const v = at(f.path);
      /* absent/null only where the copy may be ADDED (a phone line, a name) */
      if (v == null) expect(f.key, f.key).toMatch(/\.(descShort|name)$/);
      else for (const l of f.locales) expect(typeof v[l], f.key).toBe("string");
    }
    expect(at(["SUBCATS", "photo", 0, "desc"]).ar).toBe(D.SUBCATS.photo[0].desc.ar);
  });
});

describe("media slots", () => {
  it("ids are <page>.<kind>.<ordinal>, unique, ordinals gapless per page+kind", () => {
    const seen = new Set<string>();
    const count: Record<string, number> = {};
    for (const s of registry.slots) {
      expect(seen.has(s.id), s.id).toBe(false);
      seen.add(s.id);
      const k = `${s.page}.${s.kind}`;
      count[k] = (count[k] || 0) + 1;
      expect(s.id).toBe(`${k}.${count[k]}`);
      expect(s.src, s.id).toBeTruthy();
    }
    expect(count["home.media"]).toBeGreaterThan(5);
    expect(count["about.media"]).toBeGreaterThan(3);
    expect(count["home.film"]).toBe(defaults.FILM_FRAMES.length);
  });

  it("every photograph in index/about has a slot whose default src (and preview) matches the HTML, in order", async () => {
    for (const page of ["home", "about"]) {
      const src = await html(page);
      const imgs = [...src.matchAll(/<img\b[^>]*?\bsrc="(assets\/media\/[^"]+)"[^>]*>/g)];
      const slots = registry.slots.filter((s) => s.page === page && s.kind === "media");
      expect(slots.map((s) => s.src)).toEqual(imgs.map((m) => m[1]));
      for (const s of slots) {
        if (s.preview) {
          expect(src, s.id).toContain(`data-preview="${s.preview}"`);
          expect(s.poster).toBe(s.src);
        }
      }
    }
  });

  it("film slots mirror FILM_FRAMES and reels carry their preview", () => {
    const films = registry.slots.filter((s) => s.kind === "film");
    expect(films.map((s) => s.src)).toEqual(defaults.FILM_FRAMES.map((f: { src: string }) => f.src));
    const reels = registry.slots.filter((s) => s.preview && s.page === "home");
    expect(reels.length).toBe(8);
  });
});

describe("defaults carry the tables the store overrides", () => {
  it("has I18N, SUBCATS, PROJECTS, TESTIMONIALS, MEDIA, RINGS, FILM_FRAMES", () => {
    for (const n of ["I18N", "SUBCATS", "PROJECTS", "TESTIMONIALS", "MEDIA", "RINGS", "FILM_FRAMES"]) {
      expect(defaults[n as keyof typeof defaults], n).toBeTruthy();
    }
    expect(Object.keys(defaults.RINGS).sort()).toEqual(["design", "photo", "tech"]);
    expect(defaults.slots).toEqual(registry.slots);
  });
});
