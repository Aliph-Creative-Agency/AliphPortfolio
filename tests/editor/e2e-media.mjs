// E-15 e2e: the picture drawer on the edit pages, against `wrangler dev --local` on :8841 (ADMIN_DEV_BYPASS=1),
// headless Edge.   node tests/editor/e2e-media.mjs   [EDITOR_WIDTH=390 for the phone run]
// Writes slot drafts to the LOCAL dev D1 only and resets them at the end. Never run against anything remote.
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "gallery", "fixtures");

const BASE = process.env.EDITOR_BASE || "http://127.0.0.1:8841";
const W = Number(process.env.EDITOR_WIDTH || 1440);
const b = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: W < 768 ? 844 : 900 } });
/* uploads come back as https://media.aliphcreative.com/admin/... : serve them from the local admin media route */
await ctx.route("https://media.aliphcreative.com/admin/**", async (route) => route.fulfill({ response: await ctx.request.get(BASE + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }));
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(cond ? "ok  " : "FAIL", name, extra); if (!cond) fails++; };

const ready = async (path) => {
  await p.goto(BASE + path);
  await p.waitForFunction(() => window.aliphEdit && window.aliphEditorMedia && document.querySelector(".ed-bar"));
  await p.waitForTimeout(2000);
};
const up = (u, ends) => typeof u === "string" && u.startsWith("https://media.aliphcreative.com/admin/") && ends.some((e) => u.endsWith("." + e));
const draft = () => p.evaluate(async () => (await fetch("/api/admin/content")).json());
const resetSlot = (slot) => p.evaluate(async (slot) => {
  const c = await (await fetch("/api/admin/content")).json();
  const rev = (c.locks.slots || {})[slot];
  if (rev === undefined) return 0;
  return (await fetch(`/api/admin/slot?slot=${slot}&baseRev=${rev}`, { method: "DELETE" })).status;
}, slot);
const noHScroll = async (name) => ok(name, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

// clean slate
await ready("/admin/edit/about");
await resetSlot("about.media.1");

// 1. open the drawer on about.media.1 by click; the page's own handlers do not run
const holder = p.locator('[data-es="about.media.1"]');
await holder.scrollIntoViewIfNeeded();
const urlBefore = p.url();
await holder.click({ force: true });
await p.waitForSelector("#ed-media:not([hidden])");
ok("drawer open", true);
ok("no lightbox opened", (await p.locator(".lightbox:visible, .lb:visible, [role=dialog][data-lightbox]").count()) === 0);
ok("still on the edit page", p.url() === urlBefore);
ok("drawer names the slot", (await p.textContent("#ed-media .ed-panel-page")) === "about.media.1");
await p.waitForFunction(() => !document.querySelector("#ed-media .ed-media-status")?.textContent.startsWith("Loading"));
ok("thumbnail shows the default", (await p.getAttribute("#ed-media .ed-media-thumb", "src")).includes("bts-01"));
await noHScroll("no horizontal scroll with the drawer open");
const box0 = await holder.boundingBox();

// 2. alt en -> autosaved (one PUT), the draft snapshot shows it, the box did not move
let puts = 0;
p.on("request", (r) => { if (r.method() === "PUT" && r.url().endsWith("/api/admin/slot")) puts++; });
await p.fill("#ed-alt-en", "Behind the scenes");
await p.waitForTimeout(1500);
let d = await draft();
ok("draft has the English alt", d.slots["about.media.1"]?.alt?.en === "Behind the scenes", JSON.stringify(d.slots["about.media.1"]));
ok("Arabic alt not written unless typed", d.slots["about.media.1"]?.alt?.ar === undefined);
ok("exactly one PUT", puts === 1, String(puts));
ok("lock bumped", (d.locks.slots["about.media.1"] || 0) >= 1);
await p.waitForFunction(() => /Publish \(\d+\)/.test(document.querySelector(".ed-publish")?.textContent || ""), null, { timeout: 5000 });
ok("Publish button counts the change", true);

// alt ar (rtl) too
await p.fill("#ed-alt-ar", "خلف الكواليس");
await p.waitForTimeout(1500);
d = await draft();
ok("draft has the Arabic alt", d.slots["about.media.1"]?.alt?.ar === "خلف الكواليس");
ok("img alt previewed in place", (await holder.getAttribute("alt")) === "خلف الكواليس");
const box1 = await holder.boundingBox();
ok("holder box unchanged", box0.width === box1.width && box0.height === box1.height, JSON.stringify([box0, box1]));
ok("Arabic field is rtl", (await p.getAttribute("#ed-alt-ar", "dir")) === "rtl");

// 3. reload: the field shows the draft
await ready("/admin/edit/about");
await p.locator('[data-es="about.media.1"]').click({ force: true });
await p.waitForSelector("#ed-media:not([hidden])");
await p.waitForFunction(() => document.querySelector("#ed-alt-en").value !== "");
ok("reload shows the saved English alt", (await p.inputValue("#ed-alt-en")) === "Behind the scenes");

// 4. Back to default -> the slot is gone from the draft
await p.click("#ed-media .ed-media-actions .ed-reset");
await p.waitForFunction(() => document.querySelector("#ed-media .ed-media-status").textContent.startsWith("Back to the default"));
d = await draft();
ok("slot gone from the draft", d.slots["about.media.1"] === undefined);
ok("alt en cleared", (await p.inputValue("#ed-alt-en")) === "");

// 5. Esc closes, focus returns to the holder
await p.keyboard.press("Escape");
ok("Esc closes", await p.locator("#ed-media").isHidden());
ok("focus back on the holder", await p.evaluate(() => document.activeElement?.getAttribute("data-es") === "about.media.1"));
// keyboard: Enter on the holder opens it, the close button closes it and returns focus
await p.keyboard.press("Enter");
ok("Enter opens", await p.locator("#ed-media").isVisible());
await p.click("#ed-media .ed-close");
ok("close button closes", await p.locator("#ed-media").isHidden());
ok("focus back after the button", await p.evaluate(() => document.activeElement?.getAttribute("data-es") === "about.media.1"));
await noHScroll("no horizontal scroll after closing");

// 6. a preview slot on the home page (video): the figure keeps its data-preview
await ready("/admin/edit/");
const hv = p.locator('[data-es="home.media.2"]').first();
await hv.scrollIntoViewIfNeeded();
await hv.click({ force: true });
await p.waitForSelector("#ed-media:not([hidden])");
ok("video slot titled Video", (await p.textContent("#ed-media .ed-panel-head strong")) === "Video");
await p.keyboard.press("Escape");

// 7. E-15c: Upload new. An image into about.media.1 (image slot)
await ready("/admin/edit/about");
await resetSlot("about.media.1");
await ready("/admin/edit/about");
const h1 = p.locator('[data-es="about.media.1"]');
await h1.scrollIntoViewIfNeeded();
const before1 = await h1.boundingBox();
await h1.click({ force: true });
await p.waitForSelector("#ed-media:not([hidden])");
await p.setInputFiles("#ed-media .ed-media-file-input", path.join(FIX, "photo-plain.jpg"));
await p.waitForFunction(() => document.querySelector("#ed-media .ed-media-status").textContent.startsWith("Uploaded"), null, { timeout: 20000 });
ok("progress bar reached 100", (await p.getAttribute("#ed-media .ed-media-progress", "aria-valuenow")) === "100");
d = await draft();
const v1 = d.slots["about.media.1"];
ok("draft src is a media.aliphcreative.com upload", up(v1?.src, ["webp", "jpg"]), JSON.stringify(v1));
ok("the img shows it", (await h1.getAttribute("src")) === v1.src);
await p.waitForFunction((el) => document.querySelector('[data-es="about.media.1"]').complete, null);
const after1 = await h1.boundingBox();
ok("holder box unchanged after upload", before1.width === after1.width && before1.height === after1.height, JSON.stringify([before1, after1]));
ok("thumbnail shows the upload", (await p.getAttribute("#ed-media .ed-media-thumb", "src")) === v1.src);

// a video into a home preview slot: preview + poster
await ready("/admin/edit/");
await resetSlot("home.media.2");
await ready("/admin/edit/");
const h2 = p.locator('[data-es="home.media.2"]').first();
await h2.scrollIntoViewIfNeeded();
const before2 = await h2.boundingBox();
await h2.click({ force: true });
await p.waitForSelector("#ed-media:not([hidden])");
await p.setInputFiles("#ed-media .ed-media-file-input", path.join(FIX, "clip.mp4"));
await p.waitForFunction(() => document.querySelector("#ed-media .ed-media-status").textContent.startsWith("Uploaded") || document.querySelector("#ed-media .ed-media-uperr").textContent, null, { timeout: 30000 });
ok("no upload error", (await p.textContent("#ed-media .ed-media-uperr")) === "", await p.textContent("#ed-media .ed-media-uperr"));
d = await draft();
const v2 = d.slots["home.media.2"];
ok("draft preview is an mp4 upload", up(v2?.preview, ["mp4"]), JSON.stringify(v2));
ok("draft poster is an upload", up(v2?.poster, ["poster.webp", "poster.jpg"]), JSON.stringify(v2));
ok("progress 100", (await p.getAttribute("#ed-media .ed-media-progress", "aria-valuenow")) === "100");
ok("figure data-preview updated", (await p.evaluate(() => document.querySelector('[data-es="home.media.2"]').closest("figure[data-preview]")?.getAttribute("data-preview"))) === v2.preview);
const after2 = await h2.boundingBox();
ok("video holder box unchanged", Math.abs(before2.width - after2.width) < 1 && Math.abs(before2.height - after2.height) < 1 /* the reel strip is moving: x changes, the size does not */, JSON.stringify([before2, after2]));

// an image picked for the video slot replaces the poster only
await p.setInputFiles("#ed-media .ed-media-file-input", path.join(FIX, "photo-plain.jpg"));
await p.waitForFunction((old) => !document.querySelector("#ed-media .ed-media-status").textContent.startsWith("Uploading") && document.querySelector("#ed-media .ed-media-url").textContent.split(String.fromCharCode(10))[0] !== old, v2.poster, { timeout: 20000 });
d = await draft();
ok("image replaced the poster only", d.slots["home.media.2"].preview === v2.preview && d.slots["home.media.2"].poster !== v2.poster, JSON.stringify(d.slots["home.media.2"]));

// a video for an image slot is refused with a message, nothing written
await ready("/admin/edit/about");
await resetSlot("about.media.1");
await ready("/admin/edit/about");
await p.locator('[data-es="about.media.1"]').click({ force: true });
await p.waitForSelector("#ed-media:not([hidden])");
await p.setInputFiles("#ed-media .ed-media-file-input", path.join(FIX, "clip.mp4"));
await p.waitForFunction(() => document.querySelector("#ed-media .ed-media-uperr").textContent !== "");
d = await draft();
ok("video into an image slot: message, no row", d.slots["about.media.1"] === undefined, await p.textContent("#ed-media .ed-media-uperr"));
// a file that is not media: unreadable message
await p.setInputFiles("#ed-media .ed-media-file-input", { name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
await p.waitForFunction(() => /could not be read/.test(document.querySelector("#ed-media .ed-media-uperr").textContent));
ok("non-media file: readable error shown", true);

// Cancel: abort an upload midway (slow the route so the bar is still running)
await p.route("**/api/admin/upload", async (route) => { await new Promise((r) => setTimeout(r, 3000)); route.continue().catch(() => {}); });
await p.setInputFiles("#ed-media .ed-media-file-input", path.join(FIX, "photo-plain.jpg"));
await p.waitForSelector("#ed-media .ed-media-actions button:has-text('Cancel'):visible");
await p.click("#ed-media .ed-media-actions button:has-text('Cancel')");
await p.waitForFunction(() => document.querySelector("#ed-media .ed-media-uperr").textContent === "Cancelled.");
d = await draft();
ok("cancel writes nothing", d.slots["about.media.1"] === undefined);
await p.unroute("**/api/admin/upload");

await resetSlot("about.media.1");
await resetSlot("home.media.2");
ok("no page errors", errs.length === 0, errs.join("|"));
await b.close();
console.log(fails ? `${fails} FAILED` : "ALL OK");
process.exit(fails ? 1 : 0);
