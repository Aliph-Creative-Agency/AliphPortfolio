// E-04c e2e: the "Page text" panel against `wrangler dev --local` on :8841 (ADMIN_DEV_BYPASS=1), headless Edge.
//   node tests/editor/e2e-panel.mjs
// Edits meta.home.title (ar) in the LOCAL dev D1 and resets it at the end. Never run against anything remote.
import { chromium } from "playwright-core";

const BASE = process.env.EDITOR_BASE || "http://127.0.0.1:8841";
const b = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(cond ? "ok  " : "FAIL", name, extra); if (!cond) fails++; };
const puts = [];
p.on("request", (r) => { if (r.url().endsWith("/api/admin/text") && r.method() === "PUT") puts.push(JSON.parse(r.postData())); });

const PAGES = [["home", "/admin/edit/"], ["about", "/admin/edit/about"], ["library", "/admin/edit/library"]];
for (const [page, path] of PAGES) {
  await p.goto(BASE + path);
  await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
  await p.waitForTimeout(2500);
  await p.click('.ed-bar button[aria-controls="ed-panel"]');
  await p.waitForSelector(".ed-panel .ed-row");
  const r = await p.evaluate(async (page) => {
    const reg = await (await fetch("/api/admin/registry")).json();
    const need = reg.text.concat(reg.fields).filter((e) => e.pages.includes(page)).map((e) => e.key);
    const tagged = new Set([...document.querySelectorAll("[data-ek]")].map((e) => e.dataset.ek));
    const listed = new Set([...document.querySelectorAll(".ed-panel .ed-row")].map((e) => e.dataset.key));
    return { need: need.length, missing: need.filter((k) => !tagged.has(k) && !listed.has(k)), listed: listed.size };
  }, page);
  ok(page + " dom tags + panel cover the registry", r.missing.length === 0, JSON.stringify({ need: r.need, listed: r.listed, missing: r.missing.slice(0, 5) }));
  if (page === "home") await p.screenshot({ path: ".wrangler/e04c-panel-1440.png" });
}

// edit meta.home.title through the panel
await p.goto(BASE + "/admin/edit/");
await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
await p.waitForTimeout(2500);
await p.click('.ed-bar button[aria-controls="ed-panel"]');
await p.fill(".ed-panel input[type=search]", "meta.home.title");
await p.click('.ed-row[data-key="meta.home.title"]');
await p.waitForSelector(".ed-pop:not([hidden])");
ok("meta key opens ar only", (await p.locator(".ed-pop textarea").count()) === 1);
await p.fill('.ed-pop textarea[data-loc="ar"]', "عنوان تجريبي");
await p.waitForTimeout(1500);
ok("exactly one PUT for the meta key", puts.length === 1 && puts[0].key === "meta.home.title" && puts[0].locale === "ar", JSON.stringify(puts));
ok("chip saved", (await p.evaluate(() => document.querySelector(".ed-chip").getAttribute("data-state"))) === "saved");
await p.click(".ed-pop .is-primary");
await p.waitForTimeout(100);
ok("row shows the new text", (await p.textContent('.ed-row[data-key="meta.home.title"] .ed-row-val')) === "عنوان تجريبي");
// a nav link key is listed (links navigate on click)
await p.fill(".ed-panel input[type=search]", "navAbout");
ok("nav link key listed", (await p.locator('.ed-row[data-key="navAbout"]').count()) === 1);
// reload: the draft is in the panel
await p.reload();
await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
await p.click('.ed-bar button[aria-controls="ed-panel"]');
await p.waitForSelector('.ed-row[data-key="meta.home.title"]');
ok("draft shown after reload", (await p.textContent('.ed-row[data-key="meta.home.title"] .ed-row-val')) === "عنوان تجريبي");
// 390 screenshot
await p.setViewportSize({ width: 390, height: 800 });
await p.screenshot({ path: ".wrangler/e04c-panel-390.png" });
// cleanup: reset
await p.click('.ed-row[data-key="meta.home.title"]');
await p.click(".ed-pop .ed-reset");
await p.waitForLoadState("load");
await p.waitForTimeout(1500);
ok("no page errors", errs.length === 0, errs.join("|"));
await b.close();
console.log(fails ? fails + " FAILED" : "ALL OK");
process.exit(fails ? 1 : 0);
