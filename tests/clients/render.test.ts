// C-14: the Worker head for /library?client=<id>. A PUBLISHED client gets its
// own <title>, descriptions, canonical and og:url, its own ETag and its own
// page-cache entry; any other ?client= value (unknown, draft-only) is plain
// /library, byte for byte, with /library's ETag and cache key. An empty
// published store still serves the asset untouched.
import { createExecutionContext, env, SELF, waitOnExecutionContext } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { pageKey, resetContentCache } from "../../worker/src/cache";
import { publish } from "../../worker/src/publish";
import { escapeAttr, pageEtag } from "../../worker/src/render/text";

const ORIGIN = "http://example.com";
const BY = "ceo@aliphcreative.com";
const LIB_TITLE = "الأعمال · ألِف";
const LIB_DESC = "أرشيف أعمال ألِف: تصميم جرافيكي، وصناعة محتوى، وحلول تقنية وبرمجية، مرتّبة من الأحدث إلى الأقدم.";
const db = () => env.DB;
const run = (sql: string, ...b: unknown[]) => db().prepare(sql).bind(...b).run();

const page = (path: string, init?: RequestInit) => SELF.fetch(ORIGIN + path, { redirect: "manual", ...init });
const asset = async (path: string) => (await env.ASSETS.fetch(ORIGIN + path)).text();

/** Head values, read the way a crawler would. */
const titleOf = (h: string) => /<title>([^<]*)<\/title>/.exec(h)![1];
const metaOf = (h: string, attr: "name" | "property", n: string) =>
  new RegExp(`<meta ${attr}="${n}" content="([^"]*)"`).exec(h)![1];
const canonicalOf = (h: string) => /<link rel="canonical" href="([^"]*)"/.exec(h)![1];

const client = (id: string, ar: string, en: string, lineAr: string | null = null) =>
  run(
    "INSERT INTO clients (id, name_ar, name_en, line_ar, line_en, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    ar,
    en,
    lineAr,
    lineAr ? "A line" : null,
    BY,
  );
const draftText = (key: string, value: string) =>
  run("INSERT INTO text_values (key, locale, draft, updated_by) VALUES (?, 'ar', ?, ?)", key, value, BY);

beforeEach(async () => {
  resetContentCache();
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  const base = (await db().prepare("SELECT coalesce(max(id), 0) AS m FROM revisions").first<{ m: number }>())!.m;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
  await run("DELETE FROM meta WHERE k = 'publish_id'");
});

describe("empty published store", () => {
  it("/library?client=<draft-only id> is the asset, byte for byte, with the asset's ETag", async () => {
    await client("acme-ab12", "أكمي", "Acme", "سطر"); // a draft, never published
    const res = await page("/library?client=acme-ab12");
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(body).toBe(await asset("/library"));
    expect(body).not.toContain("aliph-content");
    expect(res.headers.get("etag")).toBe((await env.ASSETS.fetch(ORIGIN + "/library")).headers.get("etag"));
  });
});

describe("a published client", () => {
  beforeEach(async () => {
    await client("acme-ab12", "أكمي <للطباعة> & شركاه", "Acme", "مطبعة في القدس منذ ١٩٩٠");
    await client("bare-cd34", "بسيط", "Bare");
    await publish(db(), BY);
    await client("draft-ef56", "مسودة", "Draft"); // added after the publish: draft only
  });

  it("known id: title, descriptions, canonical and og:url are the client's", async () => {
    const res = await page("/library?client=acme-ab12");
    const h = await res.text();
    expect(res.status).toBe(200);
    const name = escapeAttr("أكمي <للطباعة> & شركاه");
    expect(titleOf(h)).toBe(`أكمي &lt;للطباعة&gt; &amp; شركاه · ${LIB_TITLE}`);
    expect(metaOf(h, "property", "og:title")).toBe(`${name} · ${LIB_TITLE}`);
    expect(metaOf(h, "name", "twitter:title")).toBe(`${name} · ${LIB_TITLE}`);
    for (const [a, n] of [
      ["name", "description"],
      ["property", "og:description"],
      ["name", "twitter:description"],
    ] as const)
      expect(metaOf(h, a, n)).toBe("مطبعة في القدس منذ ١٩٩٠");
    expect(canonicalOf(h)).toBe("https://aliphcreative.com/library?client=acme-ab12");
    expect(metaOf(h, "property", "og:url")).toBe("https://aliphcreative.com/library?client=acme-ab12");
    // nothing added: the page has as many <title> strings as the asset (one is in a comment)
    expect(h.split("<title>").length).toBe((await asset("/library")).split("<title>").length);
  });

  it("known id without a line: the library's descriptions stay; titles follow a published library title", async () => {
    let h = await (await page("/library?client=bare-cd34")).text();
    expect(titleOf(h)).toBe(`بسيط · ${LIB_TITLE}`);
    expect(metaOf(h, "name", "description")).toBe(LIB_DESC);
    expect(metaOf(h, "property", "og:description")).toBe(LIB_DESC);

    await draftText("meta.library.title", "أرشيفنا");
    await draftText("meta.library.description", "وصف جديد للأرشيف.");
    await publish(db(), BY);
    h = await (await page("/library?client=bare-cd34")).text();
    expect(titleOf(h)).toBe("بسيط · أرشيفنا");
    expect(metaOf(h, "property", "og:title")).toBe("بسيط · أرشيفنا");
    expect(metaOf(h, "name", "description")).toBe("وصف جديد للأرشيف.");
    expect(metaOf(h, "name", "twitter:description")).toBe("وصف جديد للأرشيف.");
  });

  it("unknown, draft-only and empty ids are plain /library: same bytes, same ETag", async () => {
    const plain = await page("/library");
    const body = await plain.text();
    expect(canonicalOf(body)).toBe("https://aliphcreative.com/library");
    for (const q of ["?client=nope", "?client=draft-ef56", "?client=", "?client=ACME-AB12", "?open=x"]) {
      const res = await page("/library" + q);
      expect(await res.text(), q).toBe(body);
      expect(res.headers.get("etag"), q).toBe(plain.headers.get("etag"));
    }
    // the home page never reads ?client=
    expect(await (await page("/?client=acme-ab12")).text()).toBe(await (await page("/")).text());
  });

  it("the ETag differs per client and answers If-None-Match for that view only", async () => {
    const lib = (await page("/library")).headers.get("etag")!;
    const a = (await page("/library?client=acme-ab12")).headers.get("etag")!;
    const b = (await page("/library?client=bare-cd34")).headers.get("etag")!;
    expect(new Set([lib, a, b]).size).toBe(3);
    expect(a).toMatch(/^W\/".*-cacme-ab12"$/);
    expect((await page("/library?client=acme-ab12", { headers: { "if-none-match": a } })).status).toBe(304);
    const other = await page("/library?client=acme-ab12", { headers: { "if-none-match": lib } });
    expect(other.status).toBe(200);
    expect(titleOf(await other.text())).toContain("أكمي");
  });
});

describe("page cache", () => {
  it("pageKey: one entry per client view; none = the plain page's key", () => {
    const plain = pageKey("3.x", "/library", '"e1"');
    expect(pageKey("3.x", "/library", '"e1"', null)).toBe(plain);
    expect(pageKey("3.x", "/library", '"e1"', "acme-ab12")).not.toBe(plain);
    expect(pageKey("3.x", "/library", '"e1"', "acme-ab12")).not.toBe(pageKey("3.x", "/library", '"e1"', "bare-cd34"));
    expect(pageKey(null, "/library", '"e1"', "acme-ab12")).toBeNull();
    expect(pageEtag('"e1"', 3)).toBe('W/"e1-r3"');
    expect(pageEtag('"e1"', 3, "acme-ab12")).toBe('W/"e1-r3-cacme-ab12"');
  });

  it("with caching on, each view is served its own render, warm or cold", async () => {
    await client("acme-ab12", "أكمي", "Acme");
    await client("bare-cd34", "بسيط", "Bare");
    await publish(db(), BY);
    resetContentCache();
    const e: Env = { ...env, CONTENT_CACHE_TTL_MS: "60000" } as Env;
    const get = async (path: string) => {
      const ctx = createExecutionContext();
      const res = await worker.fetch(new Request("https://aliphcreative.com" + path), e, ctx);
      const body = await res.text();
      await waitOnExecutionContext(ctx);
      return { etag: res.headers.get("etag"), body };
    };
    const first = {
      lib: await get("/library"),
      a: await get("/library?client=acme-ab12"),
      b: await get("/library?client=bare-cd34"),
    };
    expect(titleOf(first.lib.body)).toBe(LIB_TITLE);
    expect(titleOf(first.a.body)).toBe(`أكمي · ${LIB_TITLE}`);
    expect(titleOf(first.b.body)).toBe(`بسيط · ${LIB_TITLE}`);
    // warm: the same bytes again, never another view's
    expect(await get("/library?client=bare-cd34")).toEqual(first.b);
    expect(await get("/library?client=acme-ab12")).toEqual(first.a);
    expect(await get("/library")).toEqual(first.lib);
    expect(await get("/library?client=unknown")).toEqual(first.lib);
  });
});
