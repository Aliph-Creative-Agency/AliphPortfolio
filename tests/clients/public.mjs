// C-11..C-13: the public /library client features in headless Edge against
//   wrangler dev --local --port 8871 --inspector-port 9271 (ADMIN_DEV_BYPASS=1)
//   node tests/clients/public.mjs
// Makes its own client and uploads in the LOCAL dev store, PUBLISHES them, and in
// the finally removes them and publishes again, so the published store ends as it began.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done, publish } from "../gallery/browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8871";
const OUT = path.join(ROOT, "tests/clients/out");
fs.mkdirSync(OUT, { recursive: true });
const run = Date.now().toString(36);
const H = { origin: ORIGIN };

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const errors = [];
const api = ctx.request;
const clients = async () => (await (await api.get(ORIGIN + "/api/admin/clients")).json()).clients;
const items = async () => (await (await api.get(ORIGIN + "/api/admin/gallery")).json()).items;

/* A fresh page per look: language in localStorage, the library, tiles painted. */
async function look(lang, query = "", opts = {}) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.addInitScript((l) => { try { localStorage.setItem("aliph-lang", l); } catch {} }, lang);
  if (opts.route) await page.route("**/library" + (query || ""), opts.route);
  await page.goto(ORIGIN + "/library" + query);
  await page.waitForSelector(".acc-panel.open .tile, .acc-panel.open .lib-run, .lib-client", { state: "attached" });
  return page;
}
/* the tile a given upload paints (its picture's src carries the upload's id) */
const tileOf = (page, u) => page.locator(`.acc-panel.open .tile:has(img[src*="${u.id}"])`).first();
const captionOf = async (page, u) => {
  const t = tileOf(page, u);
  return (await t.count()) ? (await t.locator(".t-client").allTextContents()).join("|") : null;
};

const ups = [];
const made = [];
const clean = async () => {
  for (const u of ups) {
    try {
      const it = (await items()).find((i) => i.id === u.id);
      if (it) await api.delete(`${ORIGIN}/api/admin/gallery/${u.id}?baseRev=${it.rev}`, { headers: H });
    } catch {}
  }
  try {
    for (const c of await clients()) if (c.name.en.endsWith(run)) await api.delete(`${ORIGIN}/api/admin/clients/${c.id}?rev=${c.rev}`, { headers: H });
  } catch {}
  try { await publish(api, ORIGIN); } catch {}
  await browser.close();
};
try {
  const upload = async (n, extra = {}) => {
    const u = await (await api.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `pub-${run}-${n}.jpg` }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
    ups.push(u);
    const r = await api.put(`${ORIGIN}/api/admin/gallery/${u.id}`, { headers: H, data: { src: u.url, cat: "photo", ratio: 1.5, date: "2026-02", baseRev: 0, ...extra } });
    if (r.status() !== 200) throw new Error("item put " + r.status() + " " + (await r.text()));
    return u;
  };

  /* --- C-11 baseline: empty published store -> archive DOM --- */
  let p = await look("en");
  const empty = await p.locator(".acc").evaluate((e) => e.outerHTML);
  check("no captions and no .lib-clients with no published clients", (await p.locator(".t-client").count()) === 0 && (await p.locator(".lib-clients").count()) === 0);
  await p.close();

  /* a published client with no pieces leaves the archive's DOM identical */
  const lone = (await (await api.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "وحيد", en: `Lone ${run}` } } })).json()).client;
  await publish(api, ORIGIN);
  p = await look("en");
  const withLone = await p.locator(".acc").evaluate((e) => e.outerHTML);
  check("archive DOM identical and no .lib-clients with a published client that has no pieces", withLone === empty && (await p.locator(".lib-clients").count()) === 0, `${empty.length} vs ${withLone.length}`);
  await p.close();

  /* --- C-11 captions --- */
  const A = (await (await api.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: `ألفا ${run}`, en: `Alpha ${run}` } } })).json()).client;
  const withC = await upload("a", { client: A.id });
  const without = await upload("b");
  await publish(api, ORIGIN);

  p = await look("en");
  check("en caption shows the client name", (await captionOf(p, withC)) === `Alpha ${run}`, String(await captionOf(p, withC)));
  const bare = await tileOf(p, without).evaluate((e) => e.outerHTML);
  check("a piece with no client keeps today's markup (date-only figcaption)", !bare.includes("t-client") && /<figcaption><span class="t-date">/.test(bare));
  await p.addStyleTag({ content: ".curtain{display:none!important}" });
  await tileOf(p, withC).scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(OUT, "captions-en-1440.png") });
  await p.close();

  p = await look("ar");
  check("ar caption shows the Arabic name", (await captionOf(p, withC)) === `ألفا ${run}`, String(await captionOf(p, withC)));
  await p.close();

  /* language toggle swaps the name without a reload */
  p = await look("en");
  const toggle = p.locator(".js-lang:visible").first();
  if (await toggle.count()) {
    await toggle.click();
    await p.waitForFunction(() => document.documentElement.lang === "ar");
    check("lang toggle swaps the caption", (await captionOf(p, withC)) === `ألفا ${run}`, String(await captionOf(p, withC)));
  } else check("lang toggle present", false, "no toggle selector matched");
  await p.close();

  /* a piece naming a client the published snapshot does not know: no caption, today's markup */
  p = await look("en", "", {
    route: async (route) => {
      const res = await route.fetch();
      let body = await res.text();
      body = body.replace(/(<script[^>]*id="aliph-content"[^>]*>)([\s\S]*?)(<\/script>)/, (_m, a, json, z) => {
        const s = JSON.parse(json);
        s.clients = (s.clients || []).filter((c) => c.id !== A.id);
        return a + JSON.stringify(s) + z;
      });
      await route.fulfill({ response: res, body });
    },
  });
  const ghost = await tileOf(p, withC).evaluate((e) => e.outerHTML);
  check("unknown (draft-only/deleted) client id gives no caption, markup as today's", !ghost.includes("t-client") && /<figcaption><span class="t-date">/.test(ghost));
  await p.close();
  /* --- C-12 the Clients index --- */
  const LONG = `Al-Mustaqbal Al-Wa'id Foundation for Heritage Arts and Exchange ${run}`;
  const B = (await (await api.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "مؤسسة المستقبل الواعد للتراث والفنون والتبادل الثقافي بين الشعوب", en: LONG }, line: { ar: "تغطية فعاليات", en: "Event coverage" }, year: 2024, url: "https://example.com/b/" } })).json()).client;
  await upload("c", { client: B.id, date: "2026-05" });
  await upload("d", { client: B.id, date: "2026-05" });
  await upload("e", { client: B.id, date: "2026-05", hidden: true });
  await publish(api, ORIGIN);

  p = await look("en");
  const rows = p.locator(".lib-clients .lc-list a");
  check("index lists only clients with visible pieces (Lone absent), 2 rows", (await rows.count()) === 2, String(await rows.count()));
  const txt = await rows.allTextContents();
  check("order: newest piece first (B 2026-05 before A 2026-02)", txt[0].includes("Al-Mustaqbal") && txt[1].includes("Alpha"), txt.map((t) => t.slice(0, 20)).join(" | "));
  check("hidden pieces never count (B shows 2 pieces)", /2 pieces/.test(txt[0]) && /1 piece/.test(txt[1]), txt.join(" | ").replace(/s+/g, " "));
  check("row carries line + year", /Event coverage/.test(txt[0]) && /2024/.test(txt[0]));
  check("row links to /library?client=<id>", (await rows.first().getAttribute("href")) === `/library?client=${B.id}`);
  check("index sits above the archive", await p.evaluate(() => !!(document.querySelector(".lib-clients").compareDocumentPosition(document.querySelector("main")) & Node.DOCUMENT_POSITION_FOLLOWING)));
  await p.addStyleTag({ content: ".curtain{display:none!important}" });
  await p.locator(".lib-clients").scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(OUT, "index-en-1440.png") });
  await p.close();

  p = await look("ar");
  const arRow = (await p.locator(".lib-clients .lc-list a").first().textContent()).replace(/s+/g, " ");
  check("ar index: Arabic name, Arabic-Indic count, left arrow", /مؤسسة المستقبل/.test(arRow) && /٢ قطعة/.test(arRow) && arRow.includes("←"), arRow);
  await p.close();

  /* the narrowest width: no sideways scroll, the long name stays within 2 lines in both languages */
  for (const l of ["en", "ar"]) {
    p = await look(l);
    await p.setViewportSize({ width: 390, height: 844 });
    await p.addStyleTag({ content: ".curtain{display:none!important}" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    const m = await p.evaluate(() => {
      const el = document.querySelector(".lc-name");
      const lh = parseFloat(getComputedStyle(el).lineHeight);
      return { lines: Math.round(el.scrollHeight / lh), sideways: document.documentElement.scrollWidth > innerWidth + 1, clipped: el.scrollHeight > el.clientHeight + 1 };
    });
    check(`390 ${l}: long name <= 2 lines, no sideways scroll`, m.lines <= 2 && !m.sideways && !m.clipped, JSON.stringify(m));
    await p.locator(".lib-clients").scrollIntoViewIfNeeded();
    if (l === "en") await p.screenshot({ path: path.join(OUT, "index-en-390.png") });
    await p.close();
  }
  /* --- C-13a the ?client= filter --- */
  const dUp = ups[ups.length - 2]; // "d", visible, B's
  const aUp = withC;
  const lbOpen = (pg) => pg.locator(".lb:not([hidden])").count().then((n) => n > 0);
  p = await look("en", `?client=${B.id}`);
  const cats = await p.locator(".acc-panel").evaluateAll((els) => els.map((e) => e.dataset.cat));
  check("known client: only the categories that hold its pieces remain", cats.length >= 1 && cats.length <= 2 && cats.includes("all") && !cats.includes("tech"), cats.join(","));
  const counts = await p.locator(".acc-panel .panel-count").allTextContents();
  check("panel counts are the client's visible pieces (2)", counts.every((c) => c.trim() === "2"), counts.join(","));
  check("exactly B's 2 tiles in the open panel, no software projects", (await p.locator(".acc-panel.open .tile").count()) === 2 && (await p.locator(".tile.has-profile").count()) === 0);
  check("no empty sub-section (every .lib-sub has a tile)", await p.locator(".lib-sub").evaluateAll((els) => els.every((e) => e.querySelector(".tile"))));
  await p.close();

  const plain = await look("en");
  const plainDom = await plain.locator(".acc").evaluate((e) => e.outerHTML);
  await plain.close();
  p = await look("en", "?client=nope-0000");
  check("unknown client id: the normal archive (same DOM), no error", (await p.locator(".acc").evaluate((e) => e.outerHTML)) === plainDom);
  await p.close();
  /* ids that are Object.prototype keys are unknown ids too, not a crash (leader fix C-16) */
  for (const id of ["constructor", "__proto__", "toString"]) {
    const n = errors.length;
    p = await look("en", `?client=${id}`);
    check(`?client=${id}: the normal archive, no error`, (await p.locator(".acc").evaluate((e) => e.outerHTML)) === plainDom && errors.length === n && !(await p.locator(".lib-client").count()), errors.slice(n).join(" | "));
    await p.close();
  }

  p = await look("en", `?client=${B.id}&open=${dUp.id}`);
  await p.waitForFunction(() => document.querySelector(".lb") && !document.querySelector(".lb").hidden, null, { timeout: 4000 }).catch(() => {});
  check("?client=B&open=<B piece> opens the lightbox", await lbOpen(p));
  check("lightbox steps only through the view (1 / 2)", new RegExp("^[12] / 2$").test((await p.locator(".lb-count").textContent()).trim()), await p.locator(".lb-count").textContent());
  const before = await p.locator(".lb-count").textContent();
  await p.keyboard.press("ArrowRight");
  const after = await p.locator(".lb-count").textContent();
  check("ArrowRight moves within the view", before !== after && after.trim().endsWith("/ 2"), before + " -> " + after);
  await p.keyboard.press("Escape");
  check("Esc closes it", !(await lbOpen(p)));
  await p.close();

  p = await look("en", `?client=${B.id}&open=${aUp.id}`);
  await p.waitForTimeout(900);
  check("?open=<piece outside the view> opens nothing", !(await lbOpen(p)));
  await p.close();
  /* --- C-13b the client header --- */
  p = await look("en", "?client=" + B.id);
  check("header replaces the index (no .lib-clients), one .lib-client", (await p.locator(".lib-clients").count()) === 0 && (await p.locator(".lib-client").count()) === 1);
  const hd = (await p.locator(".lib-client").innerText());
  check("header: back, name, line, since year, 2 pieces", hd.includes("Back to the archive") && hd.includes("Al-Mustaqbal") && hd.includes("Event coverage") && hd.includes("Since 2024") && hd.includes("2 pieces"), hd);
  check("back link goes to /library", (await p.locator(".ch-back").getAttribute("href")) === "/library");
  const site = p.locator(".ch-meta a");
  check("website link: https, rel=noopener, host shown", (await site.getAttribute("href")) === "https://example.com/b/" && (await site.getAttribute("rel")) === "noopener" && (await site.textContent()).includes("example.com/b"), await site.textContent());
  await p.addStyleTag({ content: ".curtain{display:none!important}" });
  await p.screenshot({ path: path.join(OUT, "header-en-1440.png") });
  await p.close();

  p = await look("en", "?client=" + A.id);
  check("no url -> no website link", (await p.locator(".ch-meta a").count()) === 0 && (await p.locator(".ch-meta").textContent()).includes("1 piece"));
  await p.close();

  p = await look("ar", "?client=" + B.id);
  const hdAr = (await p.locator(".lib-client").innerText());
  check("ar header: Arabic back/since/count, arrow points right", hdAr.includes("العودة إلى الأرشيف") && hdAr.includes("منذ ٢٠٢٤") && hdAr.includes("٢ قطعة") && hdAr.includes("→"), hdAr);
  await p.close();

  /* zero visible pieces: the header and an empty-state line, nothing else, no errors */
  p = await look("en", "?client=" + lone.id);
  check("zero pieces: header + empty line, no panels", (await p.locator(".lib-client .ch-empty").count()) === 1 && (await p.locator(".acc-panel").count()) === 0 && (await p.locator(".lib-client").innerText()).includes("0 pieces"), (await p.locator(".lib-client").innerText()));
  await p.close();

  /* A realistic long name (about 45 characters): two lines at 390 in both languages. The 80-character maximum
     (client B) can need more than two lines at the 0.75 floor; it wraps, never clips (see HANDOVER). */
  const LN = (await (await api.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "مؤسسة القدس للتراث والفنون الشعبية " + run, en: "Jerusalem Heritage Foundation for the Arts " + run }, line: { ar: "تراث", en: "Heritage" } } })).json()).client;
  await publish(api, ORIGIN);
  for (const l of ["en", "ar"]) {
    p = await look(l, "?client=" + LN.id);
    await p.setViewportSize({ width: 390, height: 844 });
    await p.addStyleTag({ content: ".curtain{display:none!important}" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(250);
    const m = await p.evaluate(() => {
      const el = document.querySelector(".ch-name");
      const lh = parseFloat(getComputedStyle(el).lineHeight);
      return { lines: Math.round(el.scrollHeight / lh), sideways: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    check(`390 ${l}: header name (45 chars) <= 2 lines, no sideways scroll`, m.lines <= 2 && !m.sideways, JSON.stringify(m));
    await p.screenshot({ path: path.join(OUT, `header-${l}-390.png`) });
    await p.close();
  }
  void lone; void made;
} finally {
  await clean();
}
check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
done();
