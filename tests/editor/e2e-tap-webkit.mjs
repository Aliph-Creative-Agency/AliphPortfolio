// F-08: a TAP on editable text, a richline and a picture holder opens the editor on a phone.
// WebKit as an iPhone (390x844, isMobile, hasTouch, iPhone UA) with a real locator.tap() -- never click() -- and
// headless Edge 1440 with click() as the control, on /admin/edit/, /admin/edit/about, /admin/edit/library.
//   PORT=8891 INSPECTOR=9291 node tests/editor/e2e-tap-webkit.mjs      [ONLY=webkit|edge]
// Uses a running `wrangler dev --local` on PORT if one answers, else starts one through the QA harness and stops it.
// Read-only: opens and cancels the popover / drawer, writes nothing.
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, check, done } from "../qa/lib/harness.mjs";

/* the only visible richline is heroPara (rateAskPhone sits in the closed contact form); /library has no [data-es] */
const POP = ".ed-pop:not([hidden])", DRAWER = "#ed-media:not([hidden])";
const CASES = [
  { path: "/admin/edit/", kinds: [["text", '[data-ek="hero1"]', POP], ["richline", '[data-ek="heroPara"]', POP], ["holder", '[data-es="home.media.1"]', DRAWER]] },
  { path: "/admin/edit/about", kinds: [["text", '[data-ek="aboutBanner"]', POP], ["text", '[data-ek="aboutP"]', POP], ["holder", '[data-es="about.media.1"]', DRAWER]] },
  { path: "/admin/edit/library", kinds: [["text", '[data-ek="libTitle"]', POP], ["text", '[data-ek="libStats"]', POP]] },
];

const ready = async (page, path) => {
  await page.goto(ORIGIN + path, { waitUntil: "load" });
  await page.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"), null, { timeout: 30000 });
  await page.waitForTimeout(1500); // curtain + taggers settle
};

/* press the first visible match the way the device would, then wait up to 3 s for `opened` */
async function press(page, sel, touch, opened) {
  const loc = page.locator(sel).locator("visible=true").first();
  if (!(await loc.count())) return "no visible " + sel;
  await loc.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  try {
    if (touch) await loc.tap({ timeout: 5000 });
    else await loc.click({ timeout: 5000 });
  } catch (e) { return "press failed: " + e.message.split("\n")[0]; }
  return page.waitForSelector(opened, { timeout: 3000 }).then(() => "", () => "nothing opened within 3 s");
}

async function run(label, launch, vp, touch) {
  const { browser, page } = await launch(vp);
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  try {
    for (const c of CASES) {
      for (const [kind, sel, opened] of c.kinds) {
        await ready(page, c.path); // fresh page per case: nothing left open from the last one
        const why = await press(page, sel, touch, opened);
        check(`${label} ${c.path} ${touch ? "tap" : "click"} ${kind} ${sel} opens the editor`, !why, why);
      }
    }
    // a node re-rendered or tagged after load (richline re-render, apply(), main.js tagger) answers a tap too:
    // a clone carries no listeners, and a plain span that only later gets data-ek
    await ready(page, "/admin/edit/");
    await page.evaluate(() => {
      const el = document.querySelector('[data-ek="heroPara"]'); el.replaceWith(el.cloneNode(true));
    });
    await page.waitForTimeout(300);
    let why = await press(page, '[data-ek="heroPara"]', touch, POP);
    check(`${label} re-rendered [data-ek="heroPara"] opens the editor`, !why, why);
    await ready(page, "/admin/edit/");
    await page.evaluate(() => { const h = document.querySelector('[data-ek="hero2"]'); const k = h.getAttribute("data-ek"); h.removeAttribute("data-ek"); setTimeout(() => h.setAttribute("data-ek", k), 50); });
    await page.waitForTimeout(300);
    why = await press(page, '[data-ek="hero2"]', touch, POP);
    check(`${label} late-tagged [data-ek="hero2"] opens the editor`, !why, why);
    check(`${label} no page errors`, !errs.length, errs.slice(0, 3).join(" | "));
  } finally { await browser.close(); }
}

let dev = null;
const up = await fetch(ORIGIN + "/", { redirect: "manual" }).then((r) => r.status === 200, () => false);
if (!up) dev = await startDev();
try {
  const only = process.env.ONLY;
  if (!only || only === "webkit") await run("webkit390", webkit, VIEWPORTS.phone, true);
  if (!only || only === "edge") await run("edge1440", edge, VIEWPORTS.desktop, false);
} finally { stopDev(dev); }
done();
