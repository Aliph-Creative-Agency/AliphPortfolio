// P-06: published text rendered into the served HTML (render/text.ts) and
// exact parity while nothing is published.
import { env, SELF } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { pageOf, scriptJson } from "../../worker/src/render/text";

const ORIGIN = "http://example.com";
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();

/** A published text value (and the rev that publish() would have bumped). */
async function publish(key: string, locale: "ar" | "en", value: string, rev = 1) {
  await run(
    "INSERT INTO text_values (key, locale, draft, published, rev, updated_by) VALUES (?, ?, ?, ?, 1, 'ceo@aliphcreative.com')",
    key,
    locale,
    value,
    value,
  );
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(rev));
}

const page = (path: string, init?: RequestInit) => SELF.fetch(ORIGIN + path, { redirect: "manual", ...init });
const asset = async (path: string) => (await env.ASSETS.fetch(ORIGIN + path)).text();
const count = (hay: string, needle: string) => hay.split(needle).length - 1;
const MAIN = '<script src="main.js"></script>';
const BLOB_OPEN = '<script type="application/json" id="aliph-content">';

beforeEach(async () => {
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  await run("UPDATE meta SET v = '0' WHERE k = 'publish_rev'");
});

describe("empty published store → exact parity", () => {
  for (const path of ["/", "/about", "/library"]) {
    it(`${path} is the asset, byte for byte, with no content blob`, async () => {
      // a DRAFT that was never published must not leak either
      await run("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('heroPara', 'ar', 'مسودة', 'x')");
      const res = await page(path);
      const body = await res.text();
      expect(res.status).toBe(200);
      expect(body).toBe(await asset(path));
      expect(body).not.toContain("aliph-content");
    });
  }
});

describe("published text in the served HTML", () => {
  it("an AR override replaces the element's content and nothing else changes", async () => {
    const value = "ألِف تبدأ من جديد.";
    await publish("heroPara", "ar", value);
    const before = await asset("/");
    const orig = /<p data-i18n="heroPara">([^<]*)<\/p>/.exec(before)![1];
    const pub = await (await SELF.fetch(ORIGIN + "/api/content")).json();

    const res = await page("/");
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/^text\/html/);
    const expected = before
      .replace(`<p data-i18n="heroPara">${orig}</p>`, `<p data-i18n="heroPara">${value}</p>`)
      .replace(MAIN, `${BLOB_OPEN}${scriptJson(pub)}</script>\n${MAIN}`);
    expect(body).toBe(expected);
  });

  it("an EN-only override leaves the Arabic HTML alone but ships the blob", async () => {
    await publish("heroPara", "en", "Aliph starts again.");
    const body = await (await page("/")).text();
    expect(body).not.toContain("Aliph starts again.<");
    expect(body).toContain(BLOB_OPEN);
    const json = JSON.parse(body.split(BLOB_OPEN)[1].split("</script>")[0]);
    expect(json.text.heroPara).toEqual({ en: "Aliph starts again." });
  });

  it("a label override sets aria-label on every page that uses it", async () => {
    await publish("navMenu", "ar", "القائمة الكاملة");
    for (const path of ["/", "/about", "/library"]) {
      const body = await (await page(path)).text();
      expect(body).toContain('data-i18n-label="navMenu" aria-label="القائمة الكاملة"');
      expect(body).not.toContain('aria-label="القائمة"');
    }
  });

  it("an element with both attributes gets text and label from their own keys", async () => {
    await publish("testiLabel", "ar", "نصّ");
    await publish("testiLabelNext", "ar", "التالي الآن");
    const body = await (await page("/")).text();
    const el = /<[a-z]+[^>]*data-i18n="testiLabel"[^>]*>([^<]*)</.exec(body)!;
    expect(el[0]).toContain('aria-label="التالي الآن"');
    expect(el[1]).toBe("نصّ");
  });

  it("a richline value keeps its line break as text", async () => {
    await publish("rateAskPhone", "ar", "سطر\nثانٍ");
    const body = await (await page("/about")).text();
    expect(body).toContain('<span class="rt-ask" data-i18n="rateAskPhone">سطر\nثانٍ</span>');
  });

  it("a title override sets <title>, og:title and twitter:title, on its page only", async () => {
    await publish("meta.about.title", "ar", "عنّا · ألِف");
    const about = await (await page("/about")).text();
    expect(count(about, "<title>عنّا · ألِف</title>")).toBe(1);
    expect(about).toContain('<meta property="og:title" content="عنّا · ألِف">');
    expect(about).toContain('<meta name="twitter:title" content="عنّا · ألِف">');
    // description untouched
    const orig = await asset("/about");
    const desc = /<meta name="description" content="[^"]*">/.exec(orig)![0];
    expect(about).toContain(desc);
    // other pages keep their own title
    const home = await (await page("/")).text();
    expect(home).toContain("<title>ألِف · وكالة إبداعية</title>");
  });

  it("og:/twitter: follow their own override over the title, and descriptions work the same way", async () => {
    await publish("meta.library.title", "ar", "عنوان");
    await publish("meta.library.ogTitle", "ar", "عنوان المشاركة");
    await publish("meta.library.description", "ar", "وصف جديد");
    const body = await (await page("/library")).text();
    expect(body).toContain("<title>عنوان</title>");
    expect(body).toContain('<meta property="og:title" content="عنوان المشاركة">');
    expect(body).toContain('<meta name="twitter:title" content="عنوان المشاركة">');
    expect(body).toContain('<meta name="description" content="وصف جديد">');
    expect(body).toContain('<meta property="og:description" content="وصف جديد">');
    expect(body).toContain('<meta name="twitter:description" content="وصف جديد">');
  });

  it("the JSON blob is there exactly once, right before main.js, and equals /api/content", async () => {
    await publish("navHome", "ar", "البيت");
    for (const path of ["/", "/about", "/library"]) {
      const body = await (await page(path)).text();
      expect(count(body, BLOB_OPEN)).toBe(1);
      const at = body.indexOf(BLOB_OPEN);
      const tail = body.slice(at);
      const close = tail.indexOf("</script>") + "</script>".length;
      expect(tail.slice(close)).toMatch(/^\s*<script src="main\.js"><\/script>/);
      const json = JSON.parse(tail.slice(BLOB_OPEN.length, close - "</script>".length));
      expect(json).toEqual(await (await SELF.fetch(ORIGIN + "/api/content")).json());
    }
  });
});

describe("values are text, never markup", () => {
  it("</script> and tags in a value are escaped in the element, the attribute and the JSON", async () => {
    const evil = '</script><img src=x onerror=alert(1)> & "q"';
    await publish("heroPara", "ar", evil);
    await publish("navMenu", "ar", evil);
    const before = await asset("/");
    const body = await (await page("/")).text();
    // exactly one more </script> than the asset: the blob's own closing tag
    expect(count(body, "</script>")).toBe(count(before, "</script>") + 1);
    expect(body).not.toContain("<img src=x");
    expect(body).toContain('<p data-i18n="heroPara">&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt; &amp; "q"</p>');
    expect(body).toContain('aria-label="&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot;"');
    const blob = body.split(BLOB_OPEN)[1].split("</script>")[0];
    expect(blob).not.toMatch(/[<>]/);
    expect(JSON.parse(blob).text.heroPara.ar).toBe(evil);
  });

  it("keys outside I18N never reach a data-i18n element", async () => {
    // a table field shares the text store; the renderer must ignore it here
    await publish("subcat.design.logos.name", "ar", "شعارات!");
    const res = await page("/");
    const body = await res.text();
    expect(body).not.toMatch(/data-i18n="[^"]*">شعارات!/);
    expect(body).toContain(BLOB_OPEN);
  });
});

describe("caching and the rest of the routes", () => {
  it("a rewritten page has its own ETag, answers it with 304, and never passes the asset's 304 on", async () => {
    await publish("navHome", "ar", "البيت", 5);
    const res = await page("/");
    await res.arrayBuffer();
    const etag = res.headers.get("etag")!;
    expect(etag).toMatch(/^W\/".*-r5"$/);
    expect(res.headers.get("content-length")).toBeNull();

    const again = await page("/", { headers: { "if-none-match": etag } });
    expect(again.status).toBe(304);
    expect(again.headers.get("etag")).toBe(etag);

    // the browser still holding the plain asset's tag gets the rewritten page
    const plain = await env.ASSETS.fetch(ORIGIN + "/");
    await plain.arrayBuffer();
    const assetTag = plain.headers.get("etag");
    if (assetTag) {
      const stale = await page("/", { headers: { "if-none-match": assetTag } });
      expect(stale.status).toBe(200);
      expect(await stale.text()).toContain("البيت");
    }

    // a publish changes the tag
    await run("UPDATE meta SET v = '6' WHERE k = 'publish_rev'");
    const next = await page("/", { headers: { "if-none-match": etag } });
    expect(next.status).toBe(200);
    expect(next.headers.get("etag")).toMatch(/-r6"$/);
    await next.arrayBuffer();
  });

  it("non-page URLs, redirects, 404s and HEAD are untouched while the store has content", async () => {
    await publish("navHome", "ar", "البيت");
    for (const path of ["/style.css", "/main.js", "/index.html", "/nope"]) {
      const viaWorker = await page(path);
      const direct = await env.ASSETS.fetch(ORIGIN + path, { redirect: "manual" });
      expect(viaWorker.status).toBe(direct.status);
      expect(viaWorker.headers.get("location")).toBe(direct.headers.get("location"));
      expect(new Uint8Array(await viaWorker.arrayBuffer())).toEqual(new Uint8Array(await direct.arrayBuffer()));
    }
    const head = await page("/about", { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(head.headers.get("etag")).toBe((await env.ASSETS.fetch(ORIGIN + "/about", { method: "HEAD" })).headers.get("etag"));
  });

  it("pageOf maps the public paths and nothing else", () => {
    expect(pageOf("/")).toBe("home");
    expect(pageOf("/index.html")).toBe("home");
    expect(pageOf("/about")).toBe("about");
    expect(pageOf("/about/")).toBe("about");
    expect(pageOf("/about.html")).toBe("about");
    expect(pageOf("/library")).toBe("library");
    expect(pageOf("/library/x")).toBeNull();
    expect(pageOf("/aboutx")).toBeNull();
    expect(pageOf("/admin")).toBeNull();
  });
});
