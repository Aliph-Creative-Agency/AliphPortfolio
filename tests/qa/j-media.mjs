// Q-11: media holders. Replace an about photo, a home video (+poster), an about video and a home film frame through
// the picture drawer, publish, the visitor pages show the new media at 390 and 1440.
//   node tests/qa/j-media.mjs      (local wrangler dev on 8881, Edge 1440 + WebKit 390; ONLY=edge|webkit for one)
// Writes to the LOCAL D1/R2 only; the slots it touches are reset and re-published at the end.
import path from "node:path";
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ROOT, shot, watch, check, done } from "./lib/harness.mjs";

const FIX = path.join(ROOT, "tests/gallery/fixtures");
const SLOTS = ["about.media.1", "about.media.4", "home.media.2", "home.film.1"];
const MEDIA = "https://media.aliphcreative.com/admin/**";

// uploads come back as https://media.aliphcreative.com/admin/...: serve them from the local admin media route
const serveMedia = (context) => context.route(MEDIA, async (route) => {
  try { await route.fulfill({ response: await context.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }); }
  catch { await route.abort().catch(() => {}); }
});
const ready = async (page, p) => {
  await page.goto(ORIGIN + p, { waitUntil: "load" });
  await page.waitForFunction(() => window.aliphEdit && window.aliphEditorMedia && document.querySelector(".ed-bar"), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
};
const draft = (page) => page.evaluate(async () => (await fetch("/api/admin/content")).json());
const resetSlot = (page, slot) => page.evaluate(async (slot) => {
  const c = await (await fetch("/api/admin/content")).json();
  const rev = (c.locks.slots || {})[slot];
  if (rev === undefined) return 0;
  return (await fetch(`/api/admin/slot?slot=${slot}&baseRev=${rev}`, { method: "DELETE" })).status;
}, slot);
const publish = (page) => page.evaluate(async () => {
  const c = await (await fetch("/api/admin/changes")).json();
  if (!c.changes.length) return { status: 204 };
  const r = await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) });
  return { status: r.status };
});
const isUp = (u, ends) => typeof u === "string" && u.startsWith("https://media.aliphcreative.com/admin/") && ends.some((e) => u.endsWith("." + e));

async function run(label, launch, vp, touch) {
  const { browser, page, context } = await launch(vp);
  await serveMedia(context);
  const w = watch(page);
  try {
    await ready(page, "/admin/edit/about");
    for (const s of SLOTS) await resetSlot(page, s);
    await publish(page);

    // open a holder by tap/click; F-08 is the text popover, check whether holders are affected too
    const openHolder = async (slot) => {
      const h = page.locator(`[data-es="${slot}"]`).first();
      await h.scrollIntoViewIfNeeded();
      if (slot.includes(".film.")) { // the film strip scrolls sideways: the frame is never in the viewport, open it as e2e-media does
        await h.evaluate((el) => el.click());
        await page.waitForSelector("#ed-media:not([hidden])", { timeout: 5000 });
        check(`${label} ${slot} holder opens the drawer (script click, strip moves)`, true);
        return;
      }
      if (touch) await h.tap({ force: true }); else await h.click({ force: true });
      const ok = await page.waitForSelector("#ed-media:not([hidden])", { timeout: 2500 }).then(() => true, () => false);
      if (!ok && touch) {
        console.log(`KNOWN F-08 ${label} tap on [data-es=${slot}] gave no drawer (same missing click as texts)`);
        await h.evaluate((el) => el.click());
        await page.waitForSelector("#ed-media:not([hidden])", { timeout: 5000 });
      } else check(`${label} ${slot} holder opens the drawer`, ok);
    };
    const upload = async (slot, file) => {
      await openHolder(slot);
      await page.setInputFiles("#ed-media .ed-media-file-input", path.join(FIX, file));
      await page.waitForFunction(() => document.querySelector("#ed-media .ed-media-status").textContent.startsWith("Uploaded") || document.querySelector("#ed-media .ed-media-uperr").textContent, null, { timeout: 40000 });
      const err = await page.textContent("#ed-media .ed-media-uperr");
      if (touch && file.endsWith(".mp4")) {
        // Playwright's WebKit build has no H.264 decoder, so the drawer cannot read the clip for its poster. Real Safari can.
        console.log(`KNOWN ENV ${label} ${slot}: Playwright WebKit cannot decode clip.mp4 (drawer says "${err.slice(0, 60)}")`);
        check(`${label} ${slot} unreadable video: readable message, no crash`, /could not be read/.test(err), err);
        await page.keyboard.press("Escape");
        return;
      }
      check(`${label} ${slot} upload of ${file}: no error`, err === "", err);
      if (slot === "about.media.1") await shot(page, `Q11-${label}-drawer`);
      await page.keyboard.press("Escape");
    };

    // 1. photo into an about holder, video into two preview holders, photo into a film frame
    await upload("about.media.1", "photo-plain.jpg");
    await upload("about.media.4", "clip.mp4");
    await ready(page, "/admin/edit/");
    await upload("home.media.2", "clip.mp4");
    await page.waitForSelector('[data-es="home.film.1"]');
    await upload("home.film.1", "photo-plain.jpg");

    const S = (await draft(page)).slots;
    check(`${label} draft about.media.1 is a photo upload`, isUp(S["about.media.1"]?.src, ["webp", "jpg"]), JSON.stringify(S["about.media.1"]));
    const hasVideo = !touch;
    if (hasVideo) check(`${label} draft about.media.4 is a video upload + poster`, isUp(S["about.media.4"]?.preview, ["mp4"]) && isUp(S["about.media.4"]?.poster, ["poster.webp", "poster.jpg"]), JSON.stringify(S["about.media.4"]));
    if (hasVideo) check(`${label} draft home.media.2 is a video upload + poster`, isUp(S["home.media.2"]?.preview, ["mp4"]) && isUp(S["home.media.2"]?.poster, ["poster.webp", "poster.jpg"]), JSON.stringify(S["home.media.2"]));
    check(`${label} draft home.film.1 is a photo upload`, isUp(S["home.film.1"]?.src, ["webp", "jpg"]), JSON.stringify(S["home.film.1"]));
    const before = await (await fetch(ORIGIN + "/about")).text();
    check(`${label} before publish the visitor page does NOT show the draft photo`, !before.includes(S["about.media.1"].src));

    const pub = await publish(page);
    check(`${label} published`, pub.status === 200, String(pub.status));

    // 2. visitor pages: at the browser's own viewport and, from Edge, at the phone size too
    const visitor = async (p2, size, own) => {
      const wv = watch(p2);
      const servedAbout = await (await fetch(ORIGIN + "/about")).text();
      check(`${label}@${size} served /about carries the new photo and video preview before JS`, servedAbout.includes('src="' + S["about.media.1"].src + '"') && (!hasVideo || servedAbout.includes(S["about.media.4"].preview)));
      const servedHome = await (await fetch(ORIGIN + "/")).text();
      check(`${label}@${size} served / carries the new video preview + poster before JS`, (!hasVideo || (servedHome.includes(S["home.media.2"].preview) && servedHome.includes(S["home.media.2"].poster))));
      await p2.goto(ORIGIN + "/about", { waitUntil: "load" });
      await p2.waitForTimeout(2500);
      await p2.evaluate(() => document.querySelectorAll("img").forEach((i) => i.scrollIntoView()));
      await p2.waitForTimeout(1200);
      const aboutImg = p2.locator('img[src="' + S["about.media.1"].src + '"]');
      check(`${label}@${size} /about shows the new photo`, (await aboutImg.count()) === 1);
      const dims = await aboutImg.first().evaluate((i) => ({ ok: i.complete && i.naturalWidth > 0, w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) }));
      check(`${label}@${size} /about photo decoded and visible`, dims.ok && dims.w > 20 && dims.h > 20, JSON.stringify(dims));
      const figImg = (pv) => p2.evaluate((pv) => { const f = document.querySelector(`figure[data-preview="${pv}"]`); return f ? (f.querySelector("img") || {}).src || "" : "no figure"; }, pv);
      const vp4 = hasVideo ? await figImg(S["about.media.4"].preview) : null;
      if (hasVideo) check(`${label}@${size} /about video figure carries the new preview and poster`, vp4 === S["about.media.4"].poster, vp4);
      check(`${label}@${size} /about no horizontal scroll`, await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      if (own) await shot(p2, `Q11-${label}-visitor-about`);
      await p2.goto(ORIGIN + "/", { waitUntil: "load" });
      await p2.waitForTimeout(3500);
      const film = await p2.evaluate(() => (document.querySelector('.film-frame[data-frame="0"] img') || {}).src || "");
      check(`${label}@${size} / film frame 1 shows the new photo`, film === S["home.film.1"].src, film);
      const vp2 = hasVideo ? await figImg(S["home.media.2"].preview) : null;
      if (hasVideo) check(`${label}@${size} / video figure carries the new preview and poster`, vp2 === S["home.media.2"].poster, vp2);
      check(`${label}@${size} / no horizontal scroll`, await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      if (own) await shot(p2, `Q11-${label}-visitor-home`);
      const bad = wv.errors.filter((e) => e.startsWith("pageerror"));
      check(`${label}@${size} visitor pages no page errors`, bad.length === 0, bad.join(" | ").slice(0, 200));
      const net = wv.errors.filter((e) => !e.startsWith("pageerror"));
      if (net.length) console.log(`     console errors (${label}@${size}): ${net.join(" | ").slice(0, 300)}`);
    };
    const p2 = await context.newPage();
    await visitor(p2, vp.width, true);
    await p2.close();
    if (label.startsWith("edge")) {
      const other = await edge(VIEWPORTS.phone);
      await serveMedia(other.context);
      await visitor(other.page, VIEWPORTS.phone.width, false);
      await other.browser.close();
    }
    check(`${label} editor: no page errors`, !w.errors.some((e) => e.startsWith("pageerror")), w.errors.join(" | ").slice(0, 200));

    // 3. cleanup: slots back to defaults, publish again, the default media is back
    await ready(page, "/admin/edit/");
    for (const s of SLOTS) await resetSlot(page, s);
    const back = await publish(page);
    check(`${label} cleanup published`, back.status === 200, String(back.status));
    check(`${label} served /about back to the default photo`, (await (await fetch(ORIGIN + "/about")).text()).includes("assets/media/bts-01.webp"));
  } catch (e) { check(`${label} journey ran`, false, String(e).slice(0, 300)); await shot(page, `Q11-${label}-failure`).catch(() => {}); }
  finally { await browser.close(); }
}

let dev;
try {
  dev = await startDev();
  const only = process.env.ONLY || "";
  if (!only || only === "edge") await run("edge-1440", edge, VIEWPORTS.desktop, false);
  if (!only || only === "webkit") await run("webkit-390", webkit, VIEWPORTS.phone, true);
} catch (e) { check("q11 ran", false, String(e)); }
finally { stopDev(dev); }
done();
