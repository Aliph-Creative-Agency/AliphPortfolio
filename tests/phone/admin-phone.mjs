// Batch 1, admin on the phone: the admin pages measured in an iPhone-sized touch browser (390x844, isMobile, hasTouch).
// Items: U-02 touch targets, U-08 gallery grid, U-11 toast, U-12 editor bar, U-17 popover, U-41 reorder note,
// U-44 tick box, U-47 client row, U-52 confirm box, U-58 ring rows, and every admin dialog fitting 390 px.
//   PORT=8787 node tests/phone/admin-phone.mjs                         WebKit (the QA harness's exe)
//   PORT=8787 CHROMIUM=/path/to/chrome node tests/phone/admin-phone.mjs Chromium in phone emulation instead
//   ONLY=editor|gallery limits the run to one page group.
// Needs a running `npx wrangler dev --local --port $PORT` (ADMIN_DEV_BYPASS=1 in .dev.vars). Local only, never --remote.
// Writes nothing: dialogs are opened and cancelled, a reorder is cancelled, the client list is a mocked response.
// CDN_DIR=<folder holding gsap.min.js and ScrollTrigger.min.js> serves gsap from disk when the CDN is not reachable.
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium, webkit, devices } from "playwright-core";
import { WEBKIT, check, done } from "../qa/lib/harness.mjs";

const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const ONLY = process.env.ONLY || "";
const VP = { width: 390, height: 844 };
const MIN = 44; // px, the iPhone touch target
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try { await fetch(ORIGIN + "/admin/", { redirect: "manual" }); }
catch { console.error(`no dev server on ${ORIGIN}: start \`npx wrangler dev --local --port ${PORT}\` first`); process.exit(2); }

async function open() {
  let browser, label;
  if (process.env.CHROMIUM) { browser = await chromium.launch({ executablePath: process.env.CHROMIUM }); label = "chromium"; }
  else { browser = await webkit.launch({ headless: true, ...(existsSync(WEBKIT) ? { executablePath: WEBKIT } : {}) }); label = "webkit"; }
  const context = await browser.newContext({ viewport: VP, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: devices["iPhone 13"].userAgent });
  if (process.env.CDN_DIR) {
    await context.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^/]+\/dist\/([^/?]+)/, (r) =>
      r.fulfill({ path: path.join(process.env.CDN_DIR, r.request().url().split("/").pop()), contentType: "text/javascript" }));
  }
  return { browser, context, label };
}

/** Visible controls under 44 px in either direction, inside `root` (a selector; whole page by default). */
const smallTargets = (page, root = "body") => page.evaluate(([root, MIN]) => {
  const out = [];
  const sel = 'button, a[href], select, summary, [role="button"], input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"])';
  for (const r of document.querySelectorAll(root)) for (const e of r.querySelectorAll(sel)) {
    const b = e.getBoundingClientRect();
    if (!b.width || !b.height || getComputedStyle(e).visibility === "hidden") continue;
    if (e.closest("details:not([open])") && e.tagName !== "SUMMARY") continue;
    if (b.width < MIN - 0.5 || b.height < MIN - 0.5) out.push(`${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ")[0] : ""} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 18)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
  }
  return [...new Set(out)];
}, [root, MIN]);

/** The box of `sel` fits the viewport and nothing in it scrolls sideways. */
const fits = (page, sel) => page.evaluate((sel) => {
  const e = document.querySelector(sel);
  if (!e) return "missing " + sel;
  const b = e.getBoundingClientRect();
  const bad = [];
  if (b.left < -0.5 || b.top < -0.5 || b.right > innerWidth + 0.5 || b.bottom > innerHeight + 0.5) bad.push(`box ${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`);
  if (e.scrollWidth > e.clientWidth + 1) bad.push(`scrolls sideways ${e.scrollWidth}>${e.clientWidth}`);
  return bad.join("; ");
}, sel);

const rect = (page, sel) => page.evaluate((sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; }, sel);

/* ── editor (/admin/edit/*) ── */
async function editor(context, L) {
  const page = await context.newPage();
  const ready = async (p) => {
    await page.goto(ORIGIN + p, { waitUntil: "load" });
    await page.waitForFunction(() => window.aliphEdit && window.aliphEditorUi && document.querySelector(".ed-bar"), null, { timeout: 30000 });
    await sleep(1500); // curtain + taggers
  };
  await ready("/admin/edit/");

  // U-12: two rows at most, and the same height whatever the chip and the Publish count say
  const barH = () => page.evaluate(() => document.querySelector(".ed-bar").getBoundingClientRect().height);
  const h0 = await barH();
  await page.evaluate(() => {
    window.aliphEditorUi.setChip("saving", "Retrying…");
    document.querySelector(".ed-publish").textContent = "Publish (12)";
  });
  const h1 = await barH();
  check(`${L} U-12 editor bar is two rows at most (<= 104 px) and does not grow with the chip / count`, h0 <= 104 && h1 <= h0 + 0.5, `${Math.round(h0)} -> ${Math.round(h1)} px`);
  check(`${L} U-12 nothing in the bar is cut off`, await page.evaluate(() => [...document.querySelector(".ed-bar").children].every((k) => { const b = k.getBoundingClientRect(); return !b.width || (b.left >= -0.5 && b.right <= innerWidth + 0.5); })));
  await page.evaluate(() => { window.aliphEditorUi.setChip("saved", "Draft"); window.aliphEditorUi.refreshChanges(); });

  // U-02: the bar
  let small = await smallTargets(page, ".ed-bar");
  check(`${L} U-02 editor bar targets >= 44 px`, !small.length, small.join(", "));

  // U-11: the toast sits above the bar
  await page.evaluate(() => window.aliphEditorUi.toast("Published. The live site is now revision 1."));
  const t = await rect(page, ".ed-toast"), b = await rect(page, ".ed-bar");
  check(`${L} U-11 toast does not overlap the bar`, t.bottom <= b.top, `toast ${Math.round(t.top)}-${Math.round(t.bottom)}, bar top ${Math.round(b.top)}`);

  // U-02: the text popover (Reset, Cancel, Done)
  await page.locator('[data-ek="hero1"]').locator("visible=true").first().tap();
  await page.waitForSelector(".ed-pop:not([hidden])");
  small = await smallTargets(page, ".ed-pop");
  check(`${L} U-02 popover targets >= 44 px`, !small.length, small.join(", "));
  check(`${L} popover fits the screen`, !(await fits(page, ".ed-pop")), await fits(page, ".ed-pop"));
  await page.keyboard.press("Escape");

  // U-02: Page text panel (close, rows)
  await page.locator(".ed-bar button", { hasText: "Page text" }).tap();
  await page.waitForSelector("#ed-panel:not([hidden])");
  small = await smallTargets(page, "#ed-panel");
  check(`${L} U-02 Page text panel targets >= 44 px`, !small.length, small.slice(0, 6).join(", "));
  check(`${L} Page text panel fits the screen`, !(await fits(page, "#ed-panel")), await fits(page, "#ed-panel"));
  await page.locator("#ed-panel .ed-close").tap();

  // U-02: the picture drawer
  const holder = page.locator('[data-es="home.media.1"]').locator("visible=true").first(); // a reel: the film frames never stand still
  await holder.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await holder.tap();
  await page.waitForSelector("#ed-media:not([hidden])");
  await sleep(300);
  small = await smallTargets(page, "#ed-media");
  check(`${L} U-02 picture drawer targets >= 44 px`, !small.length, small.join(", "));
  check(`${L} picture drawer fits the screen`, !(await fits(page, "#ed-media")), await fits(page, "#ed-media"));
  await page.evaluate(() => window.aliphEditorMedia && window.aliphEditorMedia.close());

  // U-17: the popover stays on screen when its text is scrolled far out of view
  await ready("/admin/edit/about");
  // the last visible text that can still scroll to the middle of the screen (not the footer under the bar)
  await page.evaluate(() => {
    const end = document.documentElement.scrollHeight - innerHeight;
    const all = [...document.querySelectorAll("[data-ek]")].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && b.top + scrollY - innerHeight / 2 < end; });
    all[all.length - 1].setAttribute("data-phone-far", "1");
  });
  const far = page.locator("[data-phone-far]");
  await far.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await sleep(300);
  await far.tap();
  await page.waitForSelector(".ed-pop:not([hidden])");
  await page.evaluate(() => scrollTo(0, 0));
  await sleep(400);
  const pop = await rect(page, ".ed-pop"), bar = await rect(page, ".ed-bar");
  check(`${L} U-17 popover stays on screen above the bar`, pop.top >= 0 && pop.bottom <= bar.top + 0.5, `popover ${Math.round(pop.top)}-${Math.round(pop.bottom)}, bar top ${Math.round(bar.top)}`);
  await page.keyboard.press("Escape");
  await page.close();
}

/* ── gallery (/admin/gallery/) ── */
async function gallery(context, L) {
  const page = await context.newPage();
  const ready = async () => {
    await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
    await page.waitForSelector("#grid .adm-tile", { timeout: 30000 });
    await page.waitForSelector(".adm-ring-box");
    await sleep(500);
  };
  await ready();
  check(`${L} gallery has no sideways scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  // U-08: the first pictures are on the first screen
  const g = await page.evaluate(() => ({ top: document.querySelector("#grid .adm-tile").getBoundingClientRect().top + scrollY, vh: innerHeight }));
  check(`${L} U-08 the first picture starts on the first screen`, g.top < g.vh, `tile top ${Math.round(g.top)} in ${g.vh}`);

  // U-58: a ring opened on the phone: every pick row the same height, its three buttons on one line
  const ring = '.adm-ring-box[data-service="photo"]';
  if (await page.locator(`${ring}:not([open]) > summary`).count()) await page.locator(`${ring} > summary`).tap();
  await sleep(200);
  const rows = await page.evaluate((ring) => [...document.querySelectorAll(`${ring} .adm-pick`)].map((li) => ({
    h: Math.round(li.getBoundingClientRect().height),
    tops: [...li.querySelectorAll(".adm-x")].map((x) => Math.round(x.getBoundingClientRect().top - li.getBoundingClientRect().top)),
  })), ring);
  const hs = [...new Set(rows.map((r) => r.h))];
  check(`${L} U-58 ring pick rows all the same height`, rows.length > 0 && hs.length === 1, hs.join("/"));
  check(`${L} U-58 Earlier / Later / Remove on one line in every row`, rows.every((r) => new Set(r.tops).size === 1), JSON.stringify(rows.slice(0, 3)));

  // U-02: everything on the page (the ring is open, so its buttons count)
  let small = await smallTargets(page);
  check(`${L} U-02 gallery targets >= 44 px`, !small.length, small.slice(0, 8).join(", ") + (small.length > 8 ? ` (+${small.length - 8})` : ""));

  // dialogs fit 390 px: the picker (Add from gallery…)
  await page.locator(`${ring} [data-act=add]`).tap();
  await page.waitForSelector("#picker[open]");
  check(`${L} picker fits the screen`, !(await fits(page, "#picker")), await fits(page, "#picker"));
  small = await smallTargets(page, "#picker");
  check(`${L} U-02 picker targets >= 44 px`, !small.length, small.join(", "));
  await page.locator("#picker-close").tap();

  // U-52: the confirm box is centred, not glued to the top-left corner
  for (const id of ["confirm", "pub-dlg"]) {
    await page.evaluate((id) => { document.getElementById(id === "confirm" ? "confirm-text" : "pub-text").textContent = "Delete photo-1? It disappears from the site when you publish."; document.getElementById(id).showModal(); }, id);
    const c = await rect(page, "#" + id);
    const off = Math.max(Math.abs(c.left + c.width / 2 - VP.width / 2), Math.abs(c.top + c.height / 2 - VP.height / 2));
    check(`${L} U-52 #${id} is centred on the screen`, off <= 2, `box ${Math.round(c.left)},${Math.round(c.top)} ${Math.round(c.width)}x${Math.round(c.height)}`);
    check(`${L} #${id} fits the screen`, !(await fits(page, "#" + id)), await fits(page, "#" + id));
    small = await smallTargets(page, "#" + id);
    check(`${L} U-02 #${id} buttons >= 44 px`, !small.length, small.join(", "));
    await page.evaluate((id) => document.getElementById(id).close(), id);
  }

  // the piece drawer
  await page.locator("#grid .adm-tile").first().tap();
  await page.waitForSelector("#drawer[open]");
  await sleep(300);
  check(`${L} piece drawer fits the screen`, !(await fits(page, "#drawer")), await fits(page, "#drawer"));
  small = await smallTargets(page, "#drawer");
  check(`${L} U-02 piece drawer targets >= 44 px`, !small.length, small.join(", "));
  await page.locator("#drawer-close").tap();

  // the unused files list (read-only: Find lists, nothing is deleted; with nothing to list it only says so,
  // then the empty dialog is opened by hand for its frame)
  await page.locator("#cleanup-find").tap();
  await page.waitForFunction(() => document.getElementById("cleanup-dlg").open || /No unused|Deleted|failed|refused/i.test(document.getElementById("cleanup-note").textContent), null, { timeout: 15000 });
  await page.evaluate(() => { const d = document.getElementById("cleanup-dlg"); if (!d.open) d.showModal(); });
  check(`${L} unused files dialog fits the screen`, !(await fits(page, "#cleanup-dlg")), await fits(page, "#cleanup-dlg"));
  small = await smallTargets(page, "#cleanup-dlg");
  check(`${L} U-02 unused files targets >= 44 px`, !small.length, small.join(", "));
  await page.locator("#cleanup-close").tap();

  // U-44: select mode tick boxes
  await page.locator("#select-toggle").tap();
  await sleep(200);
  const tick = await page.evaluate(() => { const t = document.querySelector("#grid .adm-tick"); if (!t) return null; const b = t.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
  check(`${L} U-44 select tick box >= 44 px`, !!tick && tick[0] >= MIN && tick[1] >= MIN, String(tick));
  small = await smallTargets(page, "#assign-bar");
  check(`${L} U-02 assign bar targets >= 44 px`, !small.length, small.join(", "));
  await page.locator("#select-toggle").tap();

  // U-41: tapping Earlier in a reorder does not shift the page (then Cancel: nothing is saved)
  const run = page.locator("#grid .adm-run").filter({ has: page.locator('[data-act="reorder"]:not([disabled])') }).first();
  await run.locator('[data-act="reorder"]').tap();
  await page.waitForSelector('#grid .adm-run[data-reorder="1"] .adm-move');
  const tileTop = () => page.evaluate(() => document.querySelector('#grid .adm-run[data-reorder="1"] .adm-tile').getBoundingClientRect().top + scrollY);
  const y0 = await tileTop();
  await page.locator('#grid .adm-run[data-reorder="1"] .adm-move button', { hasText: "Earlier" }).nth(1).tap();
  await sleep(200);
  const y1 = await tileTop();
  check(`${L} U-41 the first Earlier tap does not move the grid`, Math.abs(y1 - y0) < 1, `${Math.round(y0)} -> ${Math.round(y1)}`);
  small = await smallTargets(page, '#grid .adm-run[data-reorder="1"]');
  check(`${L} U-02 reorder buttons >= 44 px`, !small.length, small.slice(0, 6).join(", "));
  await page.locator('[data-act="cancel-order"]').tap();

  // U-47: a client row with long names (mocked list: no client is created anywhere)
  await page.route("**/api/admin/clients", (r) => r.request().method() === "GET"
    ? r.fulfill({ json: { clients: [{ id: "phone-check", name: { en: "Mukabbir Social Media Studio", ar: "استوديو مكبّر للتواصل الاجتماعي" }, rev: 1, published: false, changed: true, pieces: 4 }] } })
    : r.continue());
  await ready();
  const row = await page.evaluate(() => {
    const li = document.querySelector("#clients-list .adm-client");
    if (!li) return null;
    const names = li.querySelector(".adm-cnames").getBoundingClientRect(), ar = li.querySelector(".adm-cname-ar");
    const lh = parseFloat(getComputedStyle(ar).lineHeight) || 20;
    return { names: Math.round(names.width), row: Math.round(li.getBoundingClientRect().width), arLines: Math.round(ar.getBoundingClientRect().height / lh) };
  });
  check(`${L} U-47 client names get most of the row and the Arabic name is not 3 lines`, !!row && row.names >= row.row * 0.7 && row.arLines <= 2, JSON.stringify(row));
  small = await smallTargets(page, "#clients");
  check(`${L} U-02 clients targets >= 44 px`, !small.length, small.join(", "));
  await page.unroute("**/api/admin/clients");
  await page.close();
}

const { browser, context, label } = await open();
try {
  if (ONLY !== "gallery") await editor(context, label);
  if (ONLY !== "editor") await gallery(context, label);
} catch (e) { check(`${label} ran`, false, String(e.stack || e)); }
await browser.close();
done();
