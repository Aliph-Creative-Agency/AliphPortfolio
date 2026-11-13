// E-12 e2e: a richline previews the way the PUBLIC element wraps it. heroPara collapses whitespace on the public page,
// so the editor's field takes no line break and the edit-mode element wraps like the published one.
// Against `wrangler dev --local` on :8841 (ADMIN_DEV_BYPASS=1), headless Edge.   node tests/editor/e2e-richline.mjs   [EDITOR_WIDTH=390]
// PUBLISHES to the LOCAL dev D1 only, then resets heroPara and publishes again. Never run against anything remote.
import { chromium } from "playwright-core";
import sharp from "sharp";

const BASE = process.env.EDITOR_BASE || "http://127.0.0.1:8841";
const W = Number(process.env.EDITOR_WIDTH || 1440);
const b = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: W < 768 ? 844 : 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(cond ? "ok  " : "FAIL", name, extra); if (!cond) fails++; };

const AR = "نص تجريبي أطول قليلًا من النص الأصلي ليلتف على أكثر من سطر واحد في الصفحة، وفيه كلمات كافية لاختبار التفاف السطور بين المحرر والصفحة المنشورة تمامًا.";
const ready = async (path, page = p) => {
  await page.goto(BASE + path);
  await page.waitForFunction(() => document.querySelector("[data-i18n=heroPara]"));
  await page.waitForTimeout(3500);
};
const publish = () => p.evaluate(async () => {
  const c = await (await fetch("/api/admin/changes")).json();
  if (!c.changes.length) return 204;
  return (await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) })).status;
});
const reset = () => p.evaluate(async () => {
  const c = await (await fetch("/api/admin/content")).json();
  const baseRev = ((c.locks.text.heroPara || {}).ar) || 0;
  return (await fetch("/api/admin/text", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "heroPara", locale: "ar", baseRev }) })).status;
});
const shot = async (page) => {
  const el = page.locator("[data-i18n=heroPara]").first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  const png = await el.screenshot();
  return { png, box };
};

await ready("/admin/edit/");
await reset();
await publish();
await ready("/admin/edit/");

// 1. the field takes no Enter
await p.click("[data-i18n=heroPara]");
await p.waitForSelector(".ed-pop:not([hidden])");
const area = p.locator('.ed-pop textarea[data-loc="ar"]');
const stock = await area.inputValue();
await p.fill('.ed-pop textarea[data-loc="ar"]', "");
await area.type("سطر");
await area.press("Enter");
await area.type("واحد");
ok("Enter in the heroPara field inserts nothing", (await area.inputValue()) === "سطرواحد", JSON.stringify(await area.inputValue()));
ok("hint says there are no line breaks", /no line breaks/.test(await p.textContent(".ed-pop .ed-hint")));
ok("edit-mode element is not forced to pre-line", (await p.$eval("[data-i18n=heroPara]", (e) => getComputedStyle(e).whiteSpace)) !== "pre-line");
await p.fill('.ed-pop textarea[data-loc="ar"]', AR);
await p.waitForTimeout(1500);
await p.click(".ed-pop .is-primary");
ok("stock value was a plain string to begin with (kept untouched until edited)", typeof stock === "string" && stock.length > 0);
await p.waitForTimeout(500);
const edit = await shot(p);

// 2. publish and compare with the public element
ok("publish 200", (await publish()) === 200);
const pub = await ctx.newPage();
await pub.setViewportSize({ width: W, height: W < 768 ? 844 : 900 });
await ready("/", pub);
const live = await shot(pub);
const lines = (page) => page.$eval("[data-i18n=heroPara]", (e) => { const r = document.createRange(); r.selectNodeContents(e); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; });
const le = await lines(p), lp = await lines(pub);
ok("same number of lines edit vs public", le === lp, le + " vs " + lp);
ok("same box size", Math.abs(edit.box.width - live.box.width) < 1.5 && Math.abs(edit.box.height - live.box.height) < 1.5, JSON.stringify([edit.box, live.box]));
const a = await sharp(edit.png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const c = await sharp(live.png).resize(a.info.width, a.info.height, { fit: "fill" }).ensureAlpha().raw().toBuffer();
/* the ink only: the paper behind the hero text differs by a shade between the pages (grain), the wrapping is the point */
let diff = 0;
const ink = (d, i) => d[i] + d[i + 1] + d[i + 2] < 330;
for (let i = 0; i < a.data.length; i += 4) if (ink(a.data, i) !== ink(c, i)) diff++;
const pct = (diff / (a.info.width * a.info.height)) * 100;
ok("element screenshot diff <= 0.5%", pct <= 0.5, pct.toFixed(3) + "%");
await pub.close();

// 3. clean up: heroPara back to the stock text, live again
await reset();
ok("cleanup publish", (await publish()) === 200);
ok("no page errors", errs.length === 0, errs.join("|"));
await b.close();
console.log(fails ? fails + " FAILED" : "ALL OK");
process.exit(fails ? 1 : 0);
