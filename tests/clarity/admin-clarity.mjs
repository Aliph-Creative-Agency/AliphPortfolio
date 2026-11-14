// Batch 2, admin clarity: what the boss is told. Items: U-01 where Publish is, U-03 / U-24 the Saved/Draft chip,
// U-05 raw key in the popover heading, U-13 / U-14 line breaks in a one-line text, U-27 a film in a picture slot,
// U-38 upload progress on the phone, U-60 a refused upload row, U-62 / U-63 / U-65 upload messages and limits,
// U-67 the Offline chip, U-68 no uncaught error after a failed upload.
//   PORT=8787 node tests/clarity/admin-clarity.mjs                          WebKit (the QA harness's exe)
//   PORT=8787 CHROMIUM=/path/to/chrome node tests/clarity/admin-clarity.mjs Chromium instead
// Desktop 1440x900, plus a 390x844 touch phone for U-38. Needs a running `npx wrangler dev --local --port $PORT`
// (ADMIN_DEV_BYPASS=1 in .dev.vars). Local only, never --remote.
// Writes nothing: uploads and picture saves are answered by mocked routes, refused files never leave the page,
// popovers are cancelled. CDN_DIR=<folder with gsap.min.js + ScrollTrigger.min.js> serves gsap when the CDN is blocked.
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium, webkit, devices } from "playwright-core";
import { WEBKIT, check, done } from "../qa/lib/harness.mjs";

const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// a 2x2 PNG, decodable by every browser
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==", "base64");
const PDF = { name: "brief.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%fake\n") };
const FAKE_JPG = { name: "notes.jpg", mimeType: "image/jpeg", buffer: Buffer.from("this is a text file, not a picture") };
const SMALL_MP4 = { name: "clip.mp4", mimeType: "video/mp4", buffer: Buffer.from("not really a film") };
const FORMATS = /JPEG.*PNG.*WebP|JPEG, PNG/;

try { await fetch(ORIGIN + "/admin/", { redirect: "manual" }); }
catch { console.error(`no dev server on ${ORIGIN}: start \`npx wrangler dev --local --port ${PORT}\` first`); process.exit(2); }

let browser, label;
if (process.env.CHROMIUM) { browser = await chromium.launch({ executablePath: process.env.CHROMIUM }); label = "chromium"; }
else { browser = await webkit.launch({ headless: true, ...(existsSync(WEBKIT) ? { executablePath: WEBKIT } : {}) }); label = "webkit"; }
async function context(phone) {
  const ctx = await browser.newContext(phone
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent }
    : { viewport: { width: 1440, height: 900 } });
  if (process.env.CDN_DIR) {
    await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^/]+\/dist\/([^/?]+)/, (r) =>
      r.fulfill({ path: path.join(process.env.CDN_DIR, r.request().url().split("/").pop()), contentType: "text/javascript" }));
  }
  return ctx;
}
const L = label;
const chip = (page) => page.evaluate(() => document.querySelector(".ed-chip").textContent.trim());

/* ── dashboard ── */
async function dashboard(ctx) {
  const page = await ctx.newPage();
  await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
  const text = await page.locator("main").innerText();
  check(`${L} U-01 the dashboard says where Publish is`, /Publish/.test(text) && /bar/i.test(text) && /Gallery/.test(text), JSON.stringify(text.slice(0, 160)));
  await page.close();
}

/* ── editor ── */
async function editor(ctx) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = async (p) => {
    await page.goto(ORIGIN + p, { waitUntil: "load" });
    await page.waitForFunction(() => window.aliphEdit && window.aliphEditorUi && document.querySelector(".ed-bar"), null, { timeout: 30000 });
    await sleep(1500);
  };
  const openText = async (key) => {
    const t = page.locator(`[data-ek="${key}"]`).locator("visible=true").first();
    await t.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await sleep(200);
    await t.click();
    await page.waitForSelector(".ed-pop:not([hidden])");
  };
  await ready("/admin/edit/");

  // U-05: the popover heading names the place, not the key
  await openText("hero1");
  const head = await page.locator(".ed-pop-head").innerText();
  check(`${L} U-05 popover heading has no raw key`, !/hero1|\|/.test(head) && /Home/.test(head) && /Hero/.test(head), JSON.stringify(head));
  // U-03: Cancel with no change leaves the chip at Draft
  check(`${L} chip starts at Draft`, (await chip(page)) === "Draft", await chip(page));
  await page.locator(".ed-pop-actions button", { hasText: "Cancel" }).click();
  await sleep(1200);
  check(`${L} U-03 Cancel with no change keeps the chip at Draft`, (await chip(page)) === "Draft", await chip(page));

  // U-67: typing offline says the text is kept and saved later (then Cancel puts the text back: nothing to save)
  await openText("hero1");
  await ctx.setOffline(true);
  await page.locator('.ed-pop textarea[data-loc="en"]').click();
  await page.keyboard.type(" x");
  await page.waitForFunction(() => document.querySelector(".ed-chip").dataset.state === "offline", null, { timeout: 8000 }).catch(() => {});
  const off = await chip(page);
  check(`${L} U-67 the Offline chip says the change is kept and saved later`, /offline/i.test(off) && /kept|saved/i.test(off) && off.length > 8, JSON.stringify(off));
  await page.locator(".ed-pop-actions button", { hasText: "Cancel" }).click();
  await ctx.setOffline(false);
  await sleep(1500);

  // U-24: a picture's alt text being saved drives the chip like a text does (the save is a mocked 200)
  await ready("/admin/edit/");
  await page.route("**/api/admin/slot**", (r) => r.request().method() === "GET" ? r.continue()
    : r.fulfill({ json: { rev: 1, value: JSON.parse(r.request().postData() || "{}").value || null } }));
  const holder = page.locator('[data-es="home.media.1"]').locator("visible=true").first();
  await holder.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await holder.click();
  await page.waitForSelector("#ed-media:not([hidden])");
  await page.locator('#ed-media input[type="text"]').first().fill("نص بديل");
  await page.waitForFunction(() => document.querySelector(".ed-chip").textContent.trim() !== "Saving…", null, { timeout: 8000 }).catch(() => {});
  await sleep(400);
  check(`${L} U-24 after a picture's alt text is saved the chip says Saved`, (await chip(page)) === "Saved", await chip(page));

  // U-63 / U-27: the picture drawer's messages (no upload starts for either file)
  await page.locator("#ed-media .ed-media-file-input").setInputFiles(PDF);
  await sleep(500);
  const edPdf = (await page.locator("#ed-media .ed-media-uperr").textContent()).trim();
  await page.locator("#ed-media .ed-media-file-input").setInputFiles(SMALL_MP4);
  await sleep(500);
  const edVid = (await page.locator("#ed-media .ed-media-uperr").textContent()).trim();
  check(`${L} U-27 a film on a picture slot is told where films go`, /picture/i.test(edVid) && /Video|reel/i.test(edVid), JSON.stringify(edVid));
  await page.evaluate(() => window.aliphEditorMedia && window.aliphEditorMedia.close());
  await page.unroute("**/api/admin/slot**");

  // U-13 / U-14: a one-line text refuses Enter and the hint says so
  await ready("/admin/edit/about");
  await openText("abLead");
  const hint = await page.locator(".ed-pop .ed-hint").innerText();
  check(`${L} U-13 a one-line text's hint says line breaks are not kept`, /line break/i.test(hint), JSON.stringify(hint));
  const area = page.locator('.ed-pop textarea[data-loc="ar"]');
  const before = await area.inputValue();
  await area.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  const after = await area.inputValue();
  check(`${L} U-14 Enter does not put a line break into a one-line text`, !/\n/.test(after) && after === before, JSON.stringify(after.slice(-20)));
  await page.locator(".ed-pop-actions button", { hasText: "Cancel" }).click();
  check(`${L} editor: no uncaught errors`, !errors.length, errors.join(" | "));
  await page.close();
  return edPdf;
}

/* ── gallery ── */
async function gallery(ctx, edPdf) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForSelector("#grid .adm-tile", { timeout: 30000 });
  const rowMsg = (i) => page.locator("#add-rows .adm-row").nth(i).locator(".adm-rmsg").innerText();
  const clear = () => page.evaluate(() => { for (const b of document.querySelectorAll("#add-rows .adm-row button")) if (b.textContent === "Remove") b.click(); });

  // U-65: the limits are on the page before anything is chosen
  const add = await page.locator(".adm-add").innerText();
  check(`${L} U-65 the Add files box names the formats and the 300 MB film limit`, /300 MB/.test(add) && FORMATS.test(add), JSON.stringify(add.slice(0, 200)));

  // U-62 / U-63 / U-60: a PDF is refused at once, says what IS accepted, matches the editor, and looks refused
  await page.locator("#add-file").setInputFiles(PDF);
  const pdf = await rowMsg(0);
  check(`${L} U-62 a PDF is told which formats are accepted`, FORMATS.test(pdf) && /MP4/.test(pdf), JSON.stringify(pdf));
  check(`${L} U-63 the gallery and the picture drawer say the same thing for a PDF`, pdf === edPdf, `gallery ${JSON.stringify(pdf)} / editor ${JSON.stringify(edPdf)}`);
  const look = await page.evaluate(() => {
    const r = document.querySelector('#add-rows .adm-row[data-status="error"]');
    const cs = getComputedStyle(r);
    const vis = (sel) => [...r.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width > 0).length;
    return { border: parseFloat(cs.borderInlineStartWidth || cs.borderLeftWidth), selects: vis("select"), bars: vis("progress") };
  });
  check(`${L} U-60 a refused row is marked and drops its category selects and empty bar`, look.border >= 2 && !look.selects && !look.bars, JSON.stringify(look));
  await clear();

  // U-65: a film over 300 MB is refused before any upload, naming the limit (a stand-in File: nothing is read)
  await page.evaluate(async () => {
    const m = await import("/admin/gallery/add.js");
    m.stage([{ name: "long-film.mp4", type: "video/mp4", size: 301 * 1024 * 1024, lastModified: Date.now() }]);
  });
  const big = await rowMsg(0);
  const bigStatus = await page.locator("#add-rows .adm-row").first().getAttribute("data-status");
  check(`${L} U-65 a film over 300 MB is refused at once, naming the limit`, bigStatus === "error" && /300 MB/.test(big), `${bigStatus} ${JSON.stringify(big)}`);
  await clear();

  // U-62: a text file named .jpg: refused with the formats, no talk of "the browser" (fails while preparing: no upload)
  await page.locator("#add-file").setInputFiles(FAKE_JPG);
  await page.locator("#add-go").click();
  await page.waitForFunction(() => document.querySelector('#add-rows .adm-row[data-status="error"]'), null, { timeout: 15000 });
  const fake = await rowMsg(0);
  check(`${L} U-62 a text file named .jpg says what to use, not "the browser"`, FORMATS.test(fake) && !/browser/i.test(fake), JSON.stringify(fake));
  await clear();

  // U-63: the piece drawer's Replace file says the same for the same file (it fails while preparing: no upload)
  await page.locator("#grid .adm-tile").first().click();
  await page.waitForSelector("#drawer[open]");
  await page.locator("#d-file").setInputFiles(FAKE_JPG);
  await page.waitForFunction(() => document.getElementById("drawer-msg").dataset.kind === "error", null, { timeout: 15000 }).catch(() => {});
  const rep = (await page.locator("#drawer-msg").innerText()).trim();
  check(`${L} U-63 Replace file says the same as Add files for the same file`, rep === fake, `drawer ${JSON.stringify(rep)} / add ${JSON.stringify(fake)}`);
  await page.locator("#drawer-close").click();

  // U-68: an upload that fails because the network is gone leaves no uncaught error
  await page.locator("#add-file").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
  await ctx.setOffline(true);
  await page.locator("#add-go").click();
  await page.waitForFunction(() => document.querySelector('#add-rows .adm-row[data-status="error"]'), null, { timeout: 15000 });
  await sleep(1500);
  const net = await rowMsg(0);
  await ctx.setOffline(false);
  check(`${L} U-68 a failed upload leaves no uncaught error`, !errors.length, errors.join(" | "));
  check(`${L} a network failure says to check the connection`, /connection|network|Wi-?Fi/i.test(net), JSON.stringify(net));
  await clear();
  await page.close();
}

/* ── U-38: upload progress on the phone (uploads answered by mocks) ── */
async function phoneProgress(ctx) {
  const page = await ctx.newPage();
  let n = 0;
  await page.route("**/api/admin/upload", async (r) => {
    await sleep(700);
    n++;
    r.fulfill({ status: 201, json: { id: `mock-${n}`, key: `admin/mock-${n}.webp`, url: `/api/admin/media/admin/mock-${n}.webp`, type: "image/webp", size: 10 } });
  });
  await page.route("**/api/admin/gallery/mock-*", (r) => r.fulfill({ json: { item: {}, rev: 1 } }));
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForSelector("#grid .adm-tile", { timeout: 30000 });
  const files = Array.from({ length: 6 }, (_, i) => ({ name: `photo-${i + 1}.png`, mimeType: "image/png", buffer: PNG }));
  await page.locator("#add-file").setInputFiles(files);
  await page.locator("#add-go").tap();
  const seen = [];
  for (let i = 0; i < 40; i++) {
    const s = await page.evaluate(() => {
      const row = document.querySelector('#add-rows .adm-row[data-status="uploading"]');
      if (!row) return null;
      const b = row.getBoundingClientRect(), go = document.getElementById("add-go").getBoundingClientRect();
      return { btn: document.getElementById("add-go").textContent.trim(), rowIn: b.top >= 0 && b.bottom <= innerHeight, btnIn: go.top >= 0 && go.bottom <= innerHeight };
    });
    if (s) seen.push(s);
    if (seen.length >= 3) break;
    await sleep(250);
  }
  check(`${L} U-38 the Upload button counts "n of 6" while the batch runs`, seen.length > 0 && seen.every((s) => /\b\d of 6\b/.test(s.btn)), JSON.stringify(seen.map((s) => s.btn)));
  check(`${L} U-38 the row being uploaded is on screen`, seen.length > 0 && seen.every((s) => s.rowIn), JSON.stringify(seen));
  await page.waitForFunction(() => !document.querySelector('#add-rows .adm-row[data-status="uploading"]'), null, { timeout: 20000 }).catch(() => {});
  await page.close();
}

try {
  const desk = await context(false);
  await dashboard(desk);
  const edPdf = await editor(desk);
  await gallery(desk, edPdf);
  await desk.close();
  const phone = await context(true);
  await phoneProgress(phone);
  await phone.close();
} catch (e) { check(`${L} ran`, false, String(e.stack || e)); }
await browser.close();
done();
