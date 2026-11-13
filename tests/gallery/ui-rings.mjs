// G-07: the ring picks panel on /admin/gallery/, headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-rings.mjs
// Sets the LOCAL dev store's photo ring to 3 picks (one an upload), reorders
// with the keyboard, publishes (dev-publish), checks the home page ring, then
// resets the ring to its default. Harmless, the dev DB accumulates.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const run = Date.now().toString(36);
const H = { origin: ORIGIN };
const keyOf = (u) => /(admin\/.+)$/.exec(u)[1];
const DEFAULTS = JSON.parse(fs.readFileSync(path.join(ROOT, "worker/src/generated/defaults.json"), "utf8"));
const DEFAULT_PHOTO_RING = DEFAULTS.RINGS.photo.map((x) => x.f);

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const read = async () => (await (await ctx.request.get(ORIGIN + "/api/admin/gallery")).json());
const publish = () => ctx.request.post(ORIGIN + "/api/admin/gallery/dev-publish", { headers: H });

// Start from the default ring, and one fresh upload to pick.
let m = await read();
if (!m.rings.photo.isDefault) await ctx.request.delete(`${ORIGIN}/api/admin/rings/photo?baseRev=${m.rings.photo.rev}`, { headers: H });
const up = await (await ctx.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `ring-${run}.jpg`, }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
await ctx.request.put(`${ORIGIN}/api/admin/gallery/${up.id}`, { headers: H, data: { src: up.url, cat: "photo", ratio: 1.5, date: "2026-02", baseRev: 0 } });
m = await read();
const A = m.items.find((i) => i.kind === "default" && i.cat === "photo" && !i.video && !DEFAULT_PHOTO_RING.includes(i.id)).id;
const C = DEFAULT_PHOTO_RING.find((f) => m.items.find((i) => i.id === f && !i.video));
const B = up.id;

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-ring-box");
const box = page.locator('.adm-ring-box[data-service="photo"]');
const ids = () => box.locator(".adm-pick").evaluateAll((e) => e.map((x) => x.dataset.id));
check("panel shows the default photo ring in order", JSON.stringify(await ids()) === JSON.stringify(DEFAULT_PHOTO_RING), String((await ids()).length));
check("marked as default picks, Reset disabled", /default picks/.test(await box.locator(".adm-ring-sub").textContent()) && (await box.locator("[data-act=reset]").isDisabled()));
await page.screenshot({ path: path.join(OUT, "rings-1440.png") });

// Empty the ring: Save is off and the panel says why.
for (let i = 0; i < DEFAULT_PHOTO_RING.length; i++) await box.locator(".adm-pick").first().getByRole("button", { name: /^Remove/ }).click();
check("0 picks: Save disabled + message", (await box.locator("[data-act=save]").isDisabled()) && /at least one/.test(await box.locator(".adm-ring-note").textContent()));

// Add three from the picker: A, B (the upload), C.
const add = async (id) => {
  await box.locator("[data-act=add]").click();
  await page.fill("#picker-q", id.replace(/^.*\//, "").slice(0, 24));
  await page.locator(`#picker-list .adm-tile[data-id="${id}"]`).click();
  await page.click("#picker-close");
};
await add(A); await add(B); await add(C);
check("3 picks in the order added", JSON.stringify(await ids()) === JSON.stringify([A, B, C]));

// Keyboard: last to first (Alt+Home), then one step down (Alt+ArrowDown) -> [A, C, B]? no: [C, A, B] -> [A, C, B].
await box.locator(`.adm-pick[data-id="${C}"]`).focus();
await page.keyboard.press("Alt+Home");
check("Alt+Home moves the last pick to first, focus stays on it", JSON.stringify(await ids()) === JSON.stringify([C, A, B]) && (await page.evaluate(() => document.activeElement.dataset.id)) === C);
await page.keyboard.press("Alt+ArrowDown");
await page.keyboard.press("Alt+ArrowUp");
check("Alt+ArrowDown then Alt+ArrowUp round-trips", JSON.stringify(await ids()) === JSON.stringify([C, A, B]));
check("unsaved edits are flagged, API still has the default", /unsaved/.test(await box.locator(".adm-ring-sub").textContent()) && (await read()).rings.photo.isDefault);

// Pointer drag on one more move (A over C) and back with the buttons.
await box.locator(`.adm-pick[data-id="${A}"]`).dragTo(box.locator(`.adm-pick[data-id="${C}"]`));
check("drag A onto C puts A first", JSON.stringify(await ids()) === JSON.stringify([A, C, B]), JSON.stringify(await ids()));
await box.locator(`.adm-pick[data-id="${C}"]`).getByRole("button", { name: /^Move earlier/ }).click();
check("Earlier button puts C first", JSON.stringify(await ids()) === JSON.stringify([C, A, B]));

await box.locator("[data-act=save]").click();
await page.waitForFunction(() => /Saved/.test(document.querySelector('.adm-ring-box[data-service="photo"] .adm-ring-note').textContent));
m = await read();
check("Save: API ring is [C, A, B], custom, changed", JSON.stringify(m.rings.photo.ids) === JSON.stringify([C, A, B]) && !m.rings.photo.isDefault && m.rings.photo.changed);

// Publish: the home page's photo ring (after JS) shows exactly those 3, in that order.
await publish();
const ringOf = async () => {
  const pub = await ctx.newPage();
  await pub.route("https://media.aliphcreative.com/admin/**", async (route) => route.fulfill({ response: await ctx.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }));
  await pub.goto(ORIGIN + "/");
  await pub.waitForSelector('.ring-stage[data-service="photo"] .ring-item', { state: "attached", timeout: 15000 });
  await pub.waitForTimeout(500);
  const full = await pub.$$eval('.ring-stage[data-service="photo"] .ring-item', (e) => e.map((x) => x.dataset.full));
  await pub.close();
  return full;
};
const pubRing = await ringOf();
check("home photo ring: exactly 3, in order C, A, B", pubRing.length === 3 && pubRing[0].includes(C) && pubRing[1].includes(A) && pubRing[2].includes(keyOf(up.url)), pubRing.join(" | "));

// Hide the upload AFTER the ring was saved (leader, relay #7): the saved ring still names it, but the public ring
// must drop it (a hidden upload never enters MEDIA, so main.js cannot resolve the id).
const rowB = (await read()).items.find((i) => i.id === B);
const hid = await ctx.request.put(`${ORIGIN}/api/admin/gallery/${B}`, { headers: H, data: { src: up.url, cat: "photo", ratio: 1.5, date: "2026-02", hidden: true, baseRev: rowB.rev } });
check("upload hidden after the ring save", hid.status() === 200, String(hid.status()));
await publish();
const afterHide = await ringOf();
check("home photo ring drops the hidden upload: C, A", afterHide.length === 2 && afterHide[0].includes(C) && afterHide[1].includes(A) && !afterHide.some((u) => u.includes(keyOf(up.url))), afterHide.join(" | "));
// Reset to default (confirm), publish, the default ring is back.
await box.locator("[data-act=reset]").click();
await page.click("#confirm-no");
check("cancel keeps the custom ring", (await read()).rings.photo.isDefault === false);
await box.locator("[data-act=reset]").click();
await page.click("#confirm-yes");
await page.waitForFunction(() => /Reset to the default/.test(document.querySelector('.adm-ring-box[data-service="photo"] .adm-ring-note').textContent));
check("Reset: draft is the default again", (await read()).rings.photo.isDefault && JSON.stringify(await ids()) === JSON.stringify(DEFAULT_PHOTO_RING));
await publish();
check("home photo ring is the default 8 again", (await ringOf()).length === DEFAULT_PHOTO_RING.length);

// The 24 cap: fill the ring from the picker, Add turns off at 24.
for (let i = 0; i < 24 - DEFAULT_PHOTO_RING.length; i++) {
  await box.locator("[data-act=add]").click();
  await page.locator("#picker-list .adm-tile:not([disabled])").first().click();
  await page.click("#picker-close");
}
check("24 picks: Add disabled, Save enabled", (await ids()).length === 24 && (await box.locator("[data-act=add]").isDisabled()) && !(await box.locator("[data-act=save]").isDisabled()));
await box.locator("[data-act=discard]").click();
check("Discard drops the edits", (await ids()).length === DEFAULT_PHOTO_RING.length);

// 390: no horizontal scroll with the panel.
await page.setViewportSize({ width: 390, height: 800 });
const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
check("390: no horizontal scroll", sw[0] <= sw[1], sw.join());
await page.screenshot({ path: path.join(OUT, "rings-390.png") });

await browser.close();
done();
