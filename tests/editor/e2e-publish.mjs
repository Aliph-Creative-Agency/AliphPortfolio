// E-06b e2e: Publish / Discard in the edit bar and the dashboard count, against `wrangler dev --local` on :8841
// (ADMIN_DEV_BYPASS=1), headless Edge.   node tests/editor/e2e-publish.mjs   [EDITOR_WIDTH=390 for the phone run]
// PUBLISHES to the LOCAL dev D1 only, then resets every key it touched and publishes again (live = defaults).
// Never run against anything remote.
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

const T = {
  hero1: { ar: "عنوان منشور", en: "Published title" },
  "subcat.design.logos.desc": { ar: "سطر حلقة منشور", en: "Published ring line" },
  "testimonial.0.quote": { ar: "شهادة منشورة", en: "Published quote" },
  "meta.home.title": { ar: "عنوان الصفحة المنشور" },
};
const KEYS = Object.keys(T);

const ready = async (path) => {
  await p.goto(BASE + path);
  await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
  await p.waitForTimeout(2500);
};
/* PUT / DELETE through the API from the page (same origin), with the current lock */
const write = (key, locale, value) =>
  p.evaluate(async ({ key, locale, value }) => {
    const c = await (await fetch("/api/admin/content")).json();
    const baseRev = ((c.locks.text[key] || {})[locale]) || 0;
    const r = await fetch("/api/admin/text", {
      method: value === null ? "DELETE" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value === null ? { key, locale, baseRev } : { key, locale, value, baseRev }),
    });
    return r.status;
  }, { key, locale, value });
const served = async () => (await (await fetch(BASE + "/")).text());

// 1. the hero title through the popover (ar + en), the rest through the API
await ready("/admin/edit/");
ok("Publish disabled with no changes", await p.isDisabled(".ed-publish"));
await p.click('[data-ek="hero1"]');
await p.waitForSelector(".ed-pop:not([hidden])");
await p.fill('.ed-pop textarea[data-loc="ar"]', T.hero1.ar);
await p.fill('.ed-pop textarea[data-loc="en"]', T.hero1.en);
await p.waitForTimeout(1500);
await p.click(".ed-pop .is-primary");
for (const k of KEYS.slice(1)) for (const [loc, v] of Object.entries(T[k])) ok(`saved ${k}:${loc}`, (await write(k, loc, v)) === 200);
await ready("/admin/edit/");
await p.waitForFunction(() => !document.querySelector(".ed-publish").disabled, null, { timeout: 5000 });
ok("Publish shows the count", /Publish \(4\)/.test(await p.textContent(".ed-publish")), await p.textContent(".ed-publish"));

// 2. dashboard count
const dash = await ctx.newPage();
await dash.goto(BASE + "/admin/");
await dash.waitForFunction(() => document.getElementById("changes").dataset.count !== "");
ok("dashboard shows the draft-changes count", (await dash.getAttribute("#changes", "data-count")) === "4");
await dash.close();

// 3. publish through the dialog
await p.click(".ed-publish");
await p.waitForSelector(".ed-confirm");
const listText = await p.textContent(".ed-confirm");
ok("dialog lists the changes per page", /Home: 4 changes/.test(listText) && KEYS.every((k) => listText.includes(k)), listText.slice(0, 200));
await p.screenshot({ path: `.wrangler/e06b-dialog-${W}.png` });
await p.click(".ed-confirm .is-primary");
await p.waitForSelector(".ed-toast:not([hidden])");
const toastText = await p.textContent(".ed-toast");
ok("success toast with the rev", /revision \d+/.test(toastText), toastText);
await p.waitForFunction(() => document.querySelector(".ed-publish").disabled, null, { timeout: 5000 });
ok("Publish disabled again after publishing", true);

// 4. the public page: Arabic before JS, English after the toggle, <title> from meta.home.title
const html = await served();
ok("served / has the new Arabic title", html.includes(`data-i18n="hero1">${T.hero1.ar}<`));
ok("served <title> is meta.home.title", html.includes(`<title>${T["meta.home.title"].ar}</title>`));
const pub = await ctx.newPage();
await pub.goto(BASE + "/");
await pub.waitForTimeout(2500);
ok("public page shows the Arabic title", (await pub.textContent('[data-i18n="hero1"]')).includes(T.hero1.ar));
await pub.evaluate(() => document.querySelector(".js-lang").click());
await pub.waitForTimeout(800);
ok("public page shows the English title after the toggle", (await pub.textContent('[data-i18n="hero1"]')).includes(T.hero1.en));
ok("public page has no editor marks", (await pub.locator("[data-ek]").count()) === 0);
await pub.evaluate(() => document.querySelector(".js-lang").click()); /* the choice is remembered per origin: back to AR */
await pub.waitForTimeout(500);
await pub.close();

// 5. a further edit, then Discard restores the published text (live unchanged)
ok("draft edit after publish", (await write("hero1", "ar", "مسودة لا تنشر")) === 200);
await ready("/admin/edit/");
await p.waitForFunction(() => !document.querySelector(".ed-discard").disabled, null, { timeout: 5000 });
await p.click(".ed-discard");
await p.waitForSelector(".ed-confirm");
await Promise.all([p.waitForNavigation(), p.click(".ed-confirm .is-primary")]);
await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
await p.waitForTimeout(2000);
ok("edit page shows the published text again", (await p.textContent('[data-ek="hero1"]')).includes(T.hero1.ar));
ok("Discard disabled again", await p.isDisabled(".ed-discard"));
ok("live page unchanged by discard", (await served()).includes(`data-i18n="hero1">${T.hero1.ar}<`));
await p.screenshot({ path: `.wrangler/e06b-after-${W}.png` });

// cleanup: every touched draft back to the default, publish (live = defaults again)
for (const k of KEYS) for (const loc of Object.keys(T[k])) await write(k, loc, null);
const clean = await p.evaluate(async () => {
  const c = await (await fetch("/api/admin/changes")).json();
  if (!c.changes.length) return 200;
  return (await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) })).status;
});
ok("cleanup publish", clean === 200, String(clean));
ok("served / back to the default title", (await served()).includes('data-i18n="hero1">نبدأ من حيث<'));
ok("no page errors", errs.length === 0, errs.join(" | "));

await b.close();
console.log(fails ? `${fails} FAILED` : "ALL OK");
process.exit(fails ? 1 : 0);
