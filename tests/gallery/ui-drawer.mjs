// G-05a: the item drawer on /admin/gallery/ in headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-drawer.mjs
// Edits one new upload and one default piece in the LOCAL dev store, publishes
// (dev-publish) and puts the default piece back; harmless, the dev DB accumulates.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const run = Date.now().toString(36);
const H = { origin: ORIGIN };

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const api = async (p) => (await (await ctx.request.get(ORIGIN + p)).json());
const item = async (id) => (await api("/api/admin/gallery")).items.find((i) => i.id === id);
const publish = () => ctx.request.post(ORIGIN + "/api/admin/gallery/dev-publish", { headers: H });
const AR = JSON.parse(fs.readFileSync(path.join(ROOT, "worker/src/generated/defaults.json"), "utf8")).AR_DIGITS;
/** The design headline count the served /library (before JS) states. */
const library = async () => {
  const html = await (await ctx.request.get(ORIGIN + "/library")).text();
  const m = html.match(/data-cat="design">\s*<h2>[^<]*<span class="acc-static-count">([^<]+)<\/span>/);
  return Number(m[1].replace(/./g, (d) => String(AR.indexOf(d))));
};

// A fresh upload to work on (API, the pipeline itself is G-04's test).
const up = await (await ctx.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `drawer-${run}.jpg` }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
const put = await ctx.request.put(`${ORIGIN}/api/admin/gallery/${up.id}`, { headers: H, data: { src: up.url, cat: "photo", ratio: 1.5, date: "2026-01", baseRev: 0 } });
check("seed upload created", put.ok(), String(put.status()));

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-tile");
const tile = (id) => page.locator(`.adm-tile[data-id="${id}"]`);
const open = async (id, cat) => {
  await page.click(`.adm-tab[data-cat="${cat}"]`);
  await tile(id).click();
  await page.waitForSelector("#drawer[open]");
};

// 1. Details round-trip: sub, date, alt ar/en, ratio.
await open(up.id, "photo");
const subs = await page.$$eval("#d-sub option", (o) => o.map((x) => x.value).filter(Boolean));
check("sub options come from the category", subs.length > 0, subs.join());
await page.selectOption("#d-sub", subs[0]);
await page.fill("#d-date", "2026-03-15");
await page.fill("#d-ratio", "1.25");
await page.fill("#d-alt-ar", "صورة تجريبية");
await page.fill("#d-alt-en", "A test photo");
await page.screenshot({ path: path.join(OUT, "drawer-1440.png") });
await page.click("#d-save");
await page.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent));
let a = await item(up.id);
check("save round-trips through the API", a.sub === subs[0] && a.date === "2026-03-15" && a.ratio === 1.25 && a.alt.ar === "صورة تجريبية" && a.alt.en === "A test photo" && a.own.src === up.url, JSON.stringify([a.sub, a.date, a.ratio, a.alt]));
check("rev moved, item marked changed", a.rev === 2 && a.changed);
check("grid shows the new sub chip", /./.test(await tile(up.id).locator(".adm-chip").textContent()) && (await tile(up.id).locator(".adm-meta").textContent()).includes("2026-03-15"));

// 2. A `<` in the alt shows the server's 400 on the field and keeps what was typed.
await page.fill("#d-alt-en", "bad <b> alt");
await page.click("#d-save");
await page.waitForFunction(() => document.querySelector('.adm-ferr[data-for="alt.en"]').textContent.length > 0);
const err = await page.locator('.adm-ferr[data-for="alt.en"]').textContent();
check("server 400 shown on the alt field", /“ ”|no </.test(err) || err.length > 5, err);
check("typed text kept", (await page.inputValue("#d-alt-en")) === "bad <b> alt");
check("nothing was saved", (await item(up.id)).alt.en === "A test photo");
await page.fill("#d-alt-en", "A test photo");

// 3. Hide / unhide the upload.
await page.click("#d-hide");
await page.waitForFunction(() => /Hidden/.test(document.getElementById("drawer-msg").textContent));
check("hide: item hidden, tile dimmed + badge", (await item(up.id)).hidden === true && (await tile(up.id).getAttribute("data-hidden")) === "1");
await page.click("#d-hide");
await page.waitForFunction(() => /Unhidden/.test(document.getElementById("drawer-msg").textContent));
check("unhide", (await item(up.id)).hidden === false && (await tile(up.id).getAttribute("data-hidden")) === "0");

// 4. 409: someone else saves first, then this drawer saves with the old rev.
const cur = await item(up.id);
await ctx.request.put(`${ORIGIN}/api/admin/gallery/${up.id}`, { headers: H, data: { ...cur.own, sub: subs[0], alt: { en: "Elsewhere" }, baseRev: cur.rev } });
await page.fill("#d-date", "2026-04");
await page.click("#d-save");
await page.waitForFunction(() => /changed elsewhere/.test(document.getElementById("drawer-msg").textContent));
check("409 message + form refilled with the current values", (await page.inputValue("#d-alt-en")) === "Elsewhere" && (await page.inputValue("#d-date")) === "2026-03-15");
await page.click("#d-save");
await page.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent));
check("after the reload the save goes through", (await item(up.id)).alt.en === "Elsewhere");

// 5. Delete (confirm), restore.
await page.click("#d-delete");
await page.waitForSelector("#confirm[open]");
await page.click("#confirm-no");
check("cancel keeps it", (await item(up.id)).deleted === false);
await page.click("#d-delete");
await page.click("#confirm-yes");
await page.waitForFunction(() => /Deleted/.test(document.getElementById("drawer-msg").textContent));
check("delete: staged, tile struck", (await item(up.id)).deleted === true && (await tile(up.id).getAttribute("data-removed")) === "1");
await page.click("#d-restore");
await page.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent));
a = await item(up.id);
check("restore: active again with its details", a.deleted === false && a.alt.en === "Elsewhere" && a.date === "2026-03-15");
await page.keyboard.press("Escape");
check("Escape closes the drawer", (await page.locator("#drawer[open]").count()) === 0);

// 6. Default piece: hide -> dev-publish -> gone from the public /library; then revert.
const pieces = (await api("/api/admin/gallery")).items.filter((i) => i.kind === "default" && !i.video && i.cat === "design" && !i.hidden);
const def = pieces[0];
await publish();
const before = await library();
await open(def.id, "design");
check("a default offers Hide but not Delete / Restore", (await page.locator("#d-hide").count()) === 1 && (await page.locator("#d-delete, #d-restore, #d-revert").count()) === 0);
await page.click("#d-hide");
await page.waitForFunction(() => /Hidden/.test(document.getElementById("drawer-msg").textContent));
a = await item(def.id);
check("default becomes an override with hidden, MEDIA columns untouched", a.kind === "override" && a.hidden && !a.own.src && !a.own.date && !a.own.ratio, JSON.stringify(a.own));
await publish();
const after = await library();
check("hidden default gone from public /library (design count -1)", after === before - 1, `${before} -> ${after}`);
check("the override offers Revert to default", (await page.locator("#d-revert").count()) === 1);
await page.click("#d-revert");
await page.click("#confirm-yes");
await page.waitForFunction(() => /Reverted/.test(document.getElementById("drawer-msg").textContent));
a = await item(def.id);
check("revert staged: reads as the plain default again", a.kind === "default" && !a.hidden && (await tile(def.id).getAttribute("data-removed")) === "0");
await publish();
check("default back in /library", (await library()) === before);

// 7. Phone width: the drawer fits.
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 390, height: 800 });
await open(up.id, "photo");
const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.getElementById("drawer").scrollWidth, document.getElementById("drawer").clientWidth]);
check("390: no horizontal scroll in page or drawer", sw[0] <= sw[1] && sw[2] <= sw[3], sw.join());
await page.screenshot({ path: path.join(OUT, "drawer-390.png") });

await browser.close();
done();
