// E-05 e2e: autosave against `wrangler dev --local` on :8841 (ADMIN_DEV_BYPASS=1), headless Edge.
//   node tests/editor/e2e-autosave.mjs
// Edits hero1 (ar) in the LOCAL dev D1 and resets it at the end. Never run against anything remote.
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

async function load() {
  await p.goto(BASE + "/admin/edit/");
  await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar") && document.querySelector("[data-ek=hero1]"));
  await p.waitForTimeout(2500);
}
async function openHero() {
  const lang = await p.evaluate(() => window.aliphEdit.lang);
  const el = await p.evaluate(() => {
    window.scrollTo(0, 0);
    const e = document.querySelector(".hero-title [data-ek=hero1], .hero-title[data-ek=hero1]");
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await p.mouse.click(el.x, el.y);
  await p.waitForSelector(".ed-pop:not([hidden])");
  return lang;
}
const chip = () => p.evaluate(() => document.querySelector(".ed-chip").getAttribute("data-state"));
const title = () => p.evaluate(() => document.querySelector(".hero-title").textContent.replace(/\s+/g, " ").trim());

await load();
await openHero();
// the test always edits Arabic so the assertions do not depend on the language the page loaded in
const ta = "[data-loc=ar]";

// 1. typing -> exactly one PUT, ~800 ms after the last key
await p.click(ta);
await p.fill(ta, "");
const t0 = Date.now();
await p.type(ta, "اختبار الحفظ", { delay: 40 });
await p.waitForTimeout(500);
ok("no PUT while typing/within 800ms", puts.length === 0, String(puts.length));
await p.waitForTimeout(1500);
ok("exactly one PUT after typing stops", puts.length === 1 && puts[0].value === "اختبار الحفظ" && puts[0].locale === "ar", JSON.stringify(puts));
ok("chip Saved", (await chip()) === "saved");
const rev1 = puts[0].baseRev;

// 2. reload shows the draft
await p.click(".ed-pop button:has-text('Done')");
await load();
ok("reload shows the draft", (await p.evaluate(() => window.aliphEdit.read("hero1", "ar"))) === "اختبار الحفظ");

// 3. 409: Take theirs, then Keep mine
await openHero();
puts.length = 0;
await p.route("**/api/admin/text", (route) => {
  if (route.request().method() !== "PUT") return route.continue();
  return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "conflict", current: { value: "THEIRS", rev: 99 } }) });
});
await p.fill(ta, "mine one");
await p.waitForSelector(".ed-dialog", { timeout: 4000 });
ok("409 shows the dialog", (await chip()) === "conflict");
await p.click(".ed-dialog button:has-text('Take theirs')");
await p.waitForTimeout(300);
ok("Take theirs applies the server value", (await p.inputValue(ta)) === "THEIRS" && (await p.evaluate(() => window.aliphEdit.read("hero1", "ar"))) === "THEIRS");
const n409 = puts.length;
await p.waitForTimeout(1200);
ok("Take theirs sends nothing more", puts.length === n409);

await p.fill(ta, "mine two");
await p.waitForSelector(".ed-dialog", { timeout: 4000 });
await p.unroute("**/api/admin/text");
await p.route("**/api/admin/text", (route) => {
  if (route.request().method() !== "PUT") return route.continue();
  return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ key: "hero1", locale: "ar", value: "mine two", rev: 100 }) });
});
puts.length = 0;
await p.click(".ed-dialog button:has-text('Keep mine')");
await p.waitForTimeout(1500);
ok("Keep mine re-PUTs with the current rev", puts.length === 1 && puts[0].value === "mine two" && puts[0].baseRev === 99, JSON.stringify(puts));
ok("dialog closed", (await p.locator(".ed-dialog").count()) === 0);

// 4. offline, then online flushes the backup (fresh page: the stubbed revs above are not the server's)
await p.unroute("**/api/admin/text");
await p.click(".ed-pop button:has-text('Done')");
await p.evaluate(() => localStorage.removeItem("aliph-editor-backup"));
await load();
await openHero();
await ctx.setOffline(true);
puts.length = 0;
await p.fill(ta, "offline text");
await p.waitForTimeout(1800);
ok("offline chip", (await chip()) === "offline");
const backup = await p.evaluate(() => localStorage.getItem("aliph-editor-backup"));
ok("backup in localStorage", !!backup && backup.includes("offline text"));
await ctx.setOffline(false);
await p.evaluate(() => window.dispatchEvent(new Event("online")));
await p.waitForTimeout(1500);
ok("online flushes", (await chip()) === "saved", await chip());
ok("backup cleared", (await p.evaluate(() => localStorage.getItem("aliph-editor-backup"))) === null);

// cleanup: reset the draft through the same API
await p.keyboard.press("Escape");
const res = await p.evaluate(async () => {
  const c = await (await fetch("/api/admin/content")).json();
  const rev = ((c.locks.text.hero1 || {}).ar) || 0;
  const r = await fetch("/api/admin/text", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "hero1", locale: "ar", baseRev: rev }) });
  return r.status;
});
ok("cleanup reset", res === 200, String(res));
ok("no page errors", errs.length === 0, errs.join("|"));
void t0; void rev1;
await b.close();
process.exit(fails ? 1 : 0);
