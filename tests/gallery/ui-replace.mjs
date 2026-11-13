// G-05b: "Replace file…" in the drawer, headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-replace.mjs
// Replaces an upload's photo, an upload's video and a default photo in the LOCAL
// dev store, publishes (dev-publish), then reverts the default piece.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const run = Date.now().toString(36);
const H = { origin: ORIGIN };
const keyOf = (u) => /(admin\/.+)$/.exec(u)[1];

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const items = async () => (await (await ctx.request.get(ORIGIN + "/api/admin/gallery")).json()).items;
const item = async (id) => (await items()).find((i) => i.id === id);
const publish = () => ctx.request.post(ORIGIN + "/api/admin/gallery/dev-publish", { headers: H });
const inR2 = async (u) => (await ctx.request.get(`${ORIGIN}/api/admin/media/${keyOf(u)}`)).status();
const upload = async (name, file, extra = {}) => (await ctx.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": name, ...extra }, data: fs.readFileSync(path.join(FIX, file)) })).json();

// Seeds: a photo upload and a video upload (film + poster).
const ph = await upload(`rep-${run}.jpg`, "photo-plain.jpg");
await ctx.request.put(`${ORIGIN}/api/admin/gallery/${ph.id}`, { headers: H, data: { src: ph.url, cat: "photo", ratio: 1.5, date: "2026-01", baseRev: 0 } });
const film = await upload(`rep-film-${run}.mp4`, "clip.mp4");
const pst = await upload("poster", "photo-plain.jpg", { "x-poster-for": film.key });
const vr = await ctx.request.put(`${ORIGIN}/api/admin/gallery/${film.id}`, { headers: H, data: { src: film.url, poster: pst.url, cat: "photo", ratio: 1.778, date: "2026-01", baseRev: 0 } });
check("seeds created", vr.ok() && (await item(ph.id)) && (await item(film.id)).video);

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-tile");
const open = async (id, cat) => {
  await page.click(`.adm-tab[data-cat="${cat}"]`);
  await page.locator(`.adm-tile[data-id="${id}"]`).click();
  await page.waitForSelector("#drawer[open]");
};
const replaced = () => page.waitForFunction(() => /File replaced/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 60000 });

// 1. An upload's photo.
const old1 = await item(ph.id);
await open(ph.id, "photo");
await page.setInputFiles("#d-file", path.join(FIX, "photo-exif.jpg"));
await replaced();
const new1 = await item(ph.id);
check("upload photo: src changed to a new key", new1.own.src && new1.own.src !== old1.own.src && keyOf(new1.own.src) !== keyOf(old1.own.src));
check("upload photo: new file is WebP in R2, old key still there", (await (await ctx.request.get(`${ORIGIN}/api/admin/media/${keyOf(new1.own.src)}`)).headers())["content-type"] === "image/webp" && (await inR2(old1.own.src)) === 200);
check("upload photo: date kept, item changed", new1.date === "2026-01" && new1.changed);

// 2. The wrong kind is refused without touching the item.
await page.setInputFiles("#d-file", path.join(FIX, "clip.mp4"));
await page.waitForFunction(() => /is a picture/.test(document.getElementById("drawer-msg").textContent));
check("a film cannot replace a photo", (await item(ph.id)).rev === new1.rev);
await page.keyboard.press("Escape");

// 3. An upload's video: new film AND a new poster.
const oldV = await item(film.id);
await open(film.id, "photo");
await page.setInputFiles("#d-file", path.join(FIX, "clip.mp4"));
await replaced();
const newV = await item(film.id);
check("video: film and poster both new, still a video", newV.video && newV.own.src !== oldV.own.src && newV.own.poster !== oldV.own.poster && keyOf(newV.own.poster).endsWith(".poster.webp"), `${keyOf(newV.own.src)}`);
check("video: new poster is named after the NEW film", keyOf(newV.own.poster).startsWith(keyOf(newV.own.src).replace(/\.mp4$/, "")));
check("video: old film and old poster still in R2", (await inR2(oldV.own.src)) === 200 && (await inR2(oldV.own.poster)) === 200);
await page.keyboard.press("Escape");

// 4. A default photo becomes an override with the new src; after publish the public tile uses it.
const def = (await items()).find((i) => i.kind === "default" && !i.video && i.cat === "photo" && !i.hidden);
await open(def.id, "photo");
await page.setInputFiles("#d-file", path.join(FIX, "photo-plain.jpg"));
await replaced();
const ov = await item(def.id);
check("default: override row with the new src", ov.kind === "override" && /media\.aliphcreative\.com\/admin\//.test(ov.own.src) && ov.thumb === ov.own.src, ov.kind);
await page.screenshot({ path: path.join(OUT, "replace-1440.png") });
await publish();
const pub = await ctx.newPage();
await pub.route("https://media.aliphcreative.com/admin/**", async (route) => route.fulfill({ response: await ctx.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }));
await pub.goto(ORIGIN + "/library");
await pub.waitForTimeout(2500);
const urls = await pub.evaluate(() => [...document.querySelectorAll("img")].map((e) => e.currentSrc || e.src));
check("public /library tile uses the replacement", urls.some((u) => u.includes(keyOf(ov.own.src))));

// 5. Put the default piece back.
await page.click("#d-revert");
await page.click("#confirm-yes");
await page.waitForFunction(() => /Reverted/.test(document.getElementById("drawer-msg").textContent));
await publish();
check("default reverted", (await item(def.id)).kind === "default");

await browser.close();
done();
