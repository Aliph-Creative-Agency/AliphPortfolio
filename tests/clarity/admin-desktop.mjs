// Admin on a desktop screen (1600x900) after the round-2 fixes:
//   - the admin type is big enough to read on a PC (dashboard, gallery, editor chrome), and the phone sizes stay;
//   - the gallery's sections come in the order Add files, Clients, the pictures (tabs + grid), Ring picks, Unused files;
//   - on /admin/edit/about a clipping's caption opens the TEXT editor (cap1..cap3), the picture still opens the
//     picture drawer, and neither opens the site's lightbox.
//   PORT=8787 node tests/clarity/admin-desktop.mjs                          WebKit (the QA harness's exe)
//   PORT=8787 CHROMIUM=/path/to/chrome node tests/clarity/admin-desktop.mjs Chromium instead
// Needs a running `npx wrangler dev --local --port $PORT` (ADMIN_DEV_BYPASS=1 in .dev.vars). Local only.
// Writes nothing: popovers and drawers are opened and closed with Escape / Cancel.
// CDN_DIR=<folder with gsap.min.js + ScrollTrigger.min.js> serves gsap when the CDN is blocked.
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium, webkit, devices } from "playwright-core";
import { WEBKIT, check, done } from "../qa/lib/harness.mjs";

const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try { await fetch(ORIGIN + "/admin/", { redirect: "manual" }); }
catch { console.error(`no dev server on ${ORIGIN}: start \`npx wrangler dev --local --port ${PORT}\` first`); process.exit(2); }

let browser, L;
if (process.env.CHROMIUM) { browser = await chromium.launch({ executablePath: process.env.CHROMIUM }); L = "chromium"; }
else { browser = await webkit.launch({ headless: true, ...(existsSync(WEBKIT) ? { executablePath: WEBKIT } : {}) }); L = "webkit"; }
async function context(phone) {
  const ctx = await browser.newContext(phone
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent }
    : { viewport: { width: 1600, height: 900 } });
  if (process.env.CDN_DIR) {
    await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^/]+\/dist\/([^/?]+)/, (r) =>
      r.fulfill({ path: path.join(process.env.CDN_DIR, r.request().url().split("/").pop()), contentType: "text/javascript" }));
  }
  return ctx;
}
const px = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; }, sel);
const editorReady = async (page, p) => {
  await page.goto(ORIGIN + p, { waitUntil: "load" });
  await page.waitForFunction(() => window.aliphEdit && window.aliphEditorUi && document.querySelector(".ed-bar"), null, { timeout: 30000 });
  await sleep(1500);
};

/* ── type sizes on a PC, and the phone kept as it was ── */
async function sizes() {
  const desk = await context(false), page = await desk.newPage();
  await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
  const d = { lede: await px(page, ".adm-lede"), card: await px(page, ".adm-links a span"), who: await px(page, ".adm-who") };
  check(`${L} PC dashboard: body text at least 19 px, the smallest at least 17 px`, d.lede >= 19 && d.card >= 17 && d.who >= 17, JSON.stringify(d));
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForSelector("#grid .adm-tile", { timeout: 30000 });
  const g = { body: await px(page, "body"), btn: await px(page, ".adm-btn"), meta: await px(page, "#grid .adm-meta"), sub: await px(page, ".adm-sub") };
  check(`${L} PC gallery: body text at least 17 px, tile labels at least 14 px`, g.body >= 17 && g.btn >= 17 && g.sub >= 17 && g.meta >= 14, JSON.stringify(g));
  check(`${L} PC gallery: nothing scrolls sideways`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await editorReady(page, "/admin/edit/");
  const e = { bar: await px(page, ".ed-bar button"), chip: await px(page, ".ed-chip") };
  check(`${L} PC editor bar: buttons at least 16 px, the chip at least 13 px`, e.bar >= 16 && e.chip >= 13, JSON.stringify(e));
  await desk.close();

  const phone = await context(true), pp = await phone.newPage();
  await pp.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await pp.waitForSelector("#grid .adm-tile", { timeout: 30000 });
  const ph = { body: await px(pp, "body") };
  await pp.goto(ORIGIN + "/admin/", { waitUntil: "load" });
  ph.lede = await px(pp, ".adm-lede");
  check(`${L} phone sizes unchanged (gallery body 14 px, dashboard text 16 px)`, ph.body === 14 && ph.lede === 16, JSON.stringify(ph));
  await phone.close();
}

/* ── the gallery's section order ── */
async function order() {
  for (const phone of [false, true]) {
    const ctx = await context(phone), page = await ctx.newPage();
    await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
    await page.waitForSelector("#grid .adm-tile", { timeout: 30000 });
    await page.waitForSelector(".adm-ring-box");
    // in the order they are on the screen, top to bottom
    const seen = await page.evaluate(() => [
      ["add", ".adm-add"], ["clients", "#clients"], ["pictures", "#tabs"], ["grid", "#grid"], ["rings", "#rings"], ["unused", ".adm-clean"],
    ].map(([n, s]) => [n, document.querySelector(s).getBoundingClientRect().top + scrollY]).sort((a, b) => a[1] - b[1]).map((x) => x[0]));
    const want = ["add", "clients", "pictures", "grid", "rings", "unused"];
    check(`${L} ${phone ? "phone" : "PC"} gallery order: Add files, Clients, pictures, Ring picks, Unused files`, JSON.stringify(seen) === JSON.stringify(want), seen.join(" > "));
    // the screen order is the document order too (keyboard and screen readers follow it)
    const dom = await page.evaluate(() => [".adm-add", "#clients", "#tabs", "#grid", "#rings", ".adm-clean"].map((s) => document.querySelector(s))
      .every((e, i, a) => i === 0 || (a[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)));
    check(`${L} ${phone ? "phone" : "PC"} gallery: the document order matches`, dom);
    await ctx.close();
  }
}

/* ── /admin/edit/about: a caption is text, the picture is the picture ── */
async function captions() {
  const ctx = await context(false), page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await editorReady(page, "/admin/edit/about");
  const lb = () => page.evaluate(() => { const r = document.querySelector(".lb"); return !!r && !r.hidden; });
  for (const key of ["cap1", "cap2", "cap3"]) {
    const cap = page.locator(`figure.clip-photo [data-ek="${key}"]`).first();
    if (!(await cap.count())) { check(`${L} about ${key} is tagged as editable text`, false, "no [data-ek] caption"); continue; }
    await cap.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await cap.click();
    await sleep(500);
    const s = await page.evaluate(() => ({
      pop: !!document.querySelector(".ed-pop:not([hidden])"),
      drawer: !!document.querySelector("#ed-media:not([hidden])"),
      key: document.querySelector(".ed-pop:not([hidden]) textarea") ? document.querySelector(".ed-pop .ed-pop-key")?.textContent : null,
    }));
    check(`${L} about: a click on caption ${key} opens the text editor, not the picture drawer`, s.pop && !s.drawer, JSON.stringify(s));
    check(`${L} about: ...and not the lightbox`, !(await lb()));
    await page.keyboard.press("Escape");
    await sleep(300);
  }
  // the picture itself still opens the picture drawer
  const pic = page.locator('figure.clip-photo [data-es="about.media.1"], figure.clip-photo:has([data-es="about.media.1"]) img').first();
  await pic.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await sleep(300);
  await pic.click();
  await sleep(500);
  const p = await page.evaluate(() => ({ drawer: !!document.querySelector("#ed-media:not([hidden])"), pop: !!document.querySelector(".ed-pop:not([hidden])") }));
  check(`${L} about: a click on the picture still opens the picture drawer`, p.drawer && !p.pop, JSON.stringify(p));
  check(`${L} about: ...and not the lightbox`, !(await lb()));
  check(`${L} about: no page errors`, !errs.length, errs.join(" | "));
  await ctx.close();
}

try {
  await sizes();
  await order();
  await captions();
} catch (e) { check(`${L} ran`, false, String(e.stack || e)); }
await browser.close();
done();
