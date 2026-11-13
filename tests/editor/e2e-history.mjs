// E-07c e2e: the History panel in the edit bar (and the dashboard link to it), against `wrangler dev --local` on
// :8841 (ADMIN_DEV_BYPASS=1), headless Edge.   node tests/editor/e2e-history.mjs   [EDITOR_WIDTH=390 for the phone run]
// PUBLISHES to the LOCAL dev D1 only: two revisions, a restore of the first, a publish of it; then resets hero1 and
// publishes again (live = defaults). Never run against anything remote.
import { chromium } from "playwright-core";

const BASE = process.env.EDITOR_BASE || "http://127.0.0.1:8841";
const W = Number(process.env.EDITOR_WIDTH || 1440);
const b = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: W < 768 ? 844 : 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(cond ? "ok  " : "FAIL", name, extra); if (!cond) fails++; };

const R1 = { ar: "النسخة الأولى", en: "First version" };
const R2 = { ar: "النسخة الثانية", en: "Second version" };

const ready = async (path) => {
  await p.goto(BASE + path);
  await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
  await p.waitForTimeout(2500);
};
/* PUT / DELETE hero1 through the API from the page (same origin), with the current lock */
const write = (locale, value) =>
  p.evaluate(async ({ locale, value }) => {
    const c = await (await fetch("/api/admin/content")).json();
    const baseRev = ((c.locks.text.hero1 || {})[locale]) || 0;
    const r = await fetch("/api/admin/text", {
      method: value === null ? "DELETE" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value === null ? { key: "hero1", locale, baseRev } : { key: "hero1", locale, value, baseRev }),
    });
    return r.status;
  }, { locale, value });
const publish = () =>
  p.evaluate(async () => {
    const c = await (await fetch("/api/admin/changes")).json();
    if (!c.changes.length) return { status: 204 };
    const r = await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) });
    return { status: r.status, rev: (await r.json()).rev };
  });
const servedHas = async (v) => (await (await fetch(BASE + "/")).text()).includes(`data-i18n="hero1">${v}<`);

// 1. two revisions: R1 then R2
await ready("/admin/edit/");
for (const [loc, v] of Object.entries(R1)) ok(`saved R1 ${loc}`, (await write(loc, v)) === 200);
const r1 = (await publish()).rev;
for (const [loc, v] of Object.entries(R2)) ok(`saved R2 ${loc}`, (await write(loc, v)) === 200);
const r2 = (await publish()).rev;
ok("two publishes", r1 > 0 && r2 === r1 + 1, `${r1} ${r2}`);
ok("served / has R2", await servedHas(R2.ar));

// 2. the dashboard links to the panel; the panel lists both, newest (live) first
await p.goto(BASE + "/admin/");
const href = await p.getAttribute('a[href*="history"]', "href");
ok("dashboard has a History link", href === "/admin/edit/?history", String(href));
await ready(href);
await p.waitForSelector(`#ed-history:not([hidden]) .ed-rev[data-rev="${r1}"]`, { timeout: 5000 });
const revs = await p.$$eval("#ed-history .ed-rev", (xs) => xs.map((x) => Number(x.dataset.rev)));
ok("panel lists newest first", revs[0] === r2 && revs[1] === r1, revs.slice(0, 3).join(","));
ok("newest marked live", (await p.textContent(`.ed-rev[data-rev="${r2}"]`)).includes("live"));
ok("each lists what it changed", (await p.textContent(`.ed-rev[data-rev="${r2}"] .ed-rev-changes`)).includes("hero1 (AR + EN)"));
ok("History button expanded", (await p.getAttribute('[aria-controls="ed-history"]', "aria-expanded")) === "true");
const sw = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
ok("no horizontal scroll", sw);
await p.screenshot({ path: `.wrangler/e07c-panel-${W}.png` });

// 3. Restore the first: confirm dialog, reload, the edit page shows R1; live still R2
await p.click(`.ed-rev[data-rev="${r1}"] button`);
await p.waitForSelector(".ed-confirm");
const dlg = await p.textContent(".ed-confirm");
ok("confirm says draft only", dlg.includes(`copies revision ${r1} into the draft`) && /until you publish/.test(dlg), dlg.slice(0, 160));
await p.screenshot({ path: `.wrangler/e07c-confirm-${W}.png` });
await Promise.all([p.waitForNavigation(), p.click(".ed-confirm .is-primary")]);
await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
await p.waitForTimeout(2000);
ok("toast after restore", /is in the draft/.test((await p.textContent(".ed-toast")) || ""));
ok("query cleaned", !(await p.evaluate(() => location.search)));
ok("edit page shows R1 (ar)", (await p.textContent('[data-ek="hero1"]')).includes(R1.ar));
ok("draft has R1 (en)", (await p.evaluate(() => window.aliphEdit.read("hero1", "en"))) === R1.en);
ok("served / still R2 before Publish", await servedHas(R2.ar));

// 4. Publish through the bar: live = R1
await p.waitForFunction(() => !document.querySelector(".ed-publish").disabled, null, { timeout: 5000 });
await p.click(".ed-publish");
await p.waitForSelector(".ed-confirm");
await p.click(".ed-confirm .is-primary");
await p.waitForSelector(".ed-toast:not([hidden])");
await p.waitForFunction(() => document.querySelector(".ed-publish").disabled, null, { timeout: 5000 });
ok("served / has R1 after Publish", await servedHas(R1.ar));
const pub = await ctx.newPage();
await pub.goto(BASE + "/");
await pub.waitForTimeout(2500);
await pub.evaluate(() => document.querySelector(".js-lang").click());
await pub.waitForTimeout(800);
ok("public page shows R1 in English", (await pub.textContent('[data-i18n="hero1"]')).includes(R1.en));
await pub.evaluate(() => document.querySelector(".js-lang").click()); /* remembered per origin: back to AR */
await pub.waitForTimeout(500);
await pub.close();

// cleanup: hero1 back to the default, publish (live = defaults again)
for (const loc of ["ar", "en"]) await write(loc, null);
ok("cleanup publish", [200, 204].includes((await publish()).status));
ok("served / back to the default title", await servedHas("نبدأ من حيث"));
ok("no page errors", errs.length === 0, errs.join(" | "));

await b.close();
console.log(fails ? `${fails} FAILED` : "ALL OK");
process.exit(fails ? 1 : 0);
