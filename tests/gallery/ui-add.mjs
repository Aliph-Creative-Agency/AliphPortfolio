// G-04: add items through /admin/gallery/ in headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-add.mjs
// Adds 3 JPEG + 1 mp4 (+ one bad file) to the LOCAL dev store and publishes it
// (dev-publish); harmless, the dev DB accumulates.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const AR = JSON.parse(fs.readFileSync(path.join(ROOT, "worker/src/generated/defaults.json"), "utf8")).AR_DIGITS;
const run = Date.now().toString(36);

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-tile");

/** The served /library: the archive region and the rest, plus the photo headline count. */
async function library() {
  const html = await (await ctx.request.get(ORIGIN + "/library")).text();
  const a = html.indexOf("<!-- @static:archive -->"), b = html.indexOf("<!-- @/static:archive -->");
  const arch = html.slice(a, b);
  const m = arch.match(/data-cat="photo">\s*<h2>[^<]*<span class="acc-static-count">([^<]+)<\/span>/);
  return { rest: (html.slice(0, a) + html.slice(b)).replace(/<script type="application\/json" id="aliph-content">[\s\S]*?<\/script>/, ""), photo: Number(m[1].replace(/./g, (d) => String(AR.indexOf(d)))) };
}
await ctx.request.post(ORIGIN + "/api/admin/gallery/dev-publish", { headers: { origin: ORIGIN } });
const before = await library();

const jpg = fs.readFileSync(path.join(FIX, "photo-plain.jpg"));
const files = [
  { name: `add-a-${run}.jpg`, mimeType: "image/jpeg", buffer: jpg },
  { name: `add-b-${run}.jpg`, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(FIX, "photo-exif.jpg")) },
  { name: `add-c-${run}.jpg`, mimeType: "image/jpeg", buffer: jpg },
  { name: `add-d-${run}.mp4`, mimeType: "video/mp4", buffer: fs.readFileSync(path.join(FIX, "clip.mp4")) },
  { name: `broken-${run}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from("this is not an image at all") },
];
await page.selectOption("#add-cat", "photo");
await page.setInputFiles("#add-file", files);
check("5 rows staged", (await page.locator(".adm-row").count()) === 5);
check("upload button counts the files", /5/.test(await page.locator("#add-go").textContent()));
await page.screenshot({ path: path.join(OUT, "add-staged-1440.png") });
await page.click("#add-go");
await page.waitForFunction(() => !document.querySelector('.adm-row[data-status="uploading"], .adm-row[data-status="ready"]'), null, { timeout: 60000 });
const status = await page.$$eval(".adm-row", (r) => r.map((x) => [x.querySelector(".adm-rname").textContent, x.dataset.status]));
check("4 done, 1 error (batch not stopped)", status.filter((s) => s[1] === "done").length === 4 && status.filter((s) => s[1] === "error").length === 1, JSON.stringify(status.map((s) => s[1])));
check("the broken file explains itself", /could not be read/.test(await page.locator('.adm-row[data-status="error"] .adm-rmsg').textContent()));

// The API: 4 new upload items, marked changed; WebP images, mp4 + poster.
await page.waitForTimeout(300);
const items = (await page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()).items)).filter((i) => i.kind === "upload" && i.id.includes(`add-`) && i.id.match(new RegExp(`-add-[abcd]-${run}`)));
check("4 draft upload items, changed", items.length === 4 && items.every((i) => i.changed), `${items.length}`);
const vid = items.find((i) => i.video);
check("one video with a poster", items.filter((i) => i.video).length === 1 && !!vid.film && vid.thumb.endsWith(".poster.webp"), vid && vid.thumb);
const types = [];
for (const i of items) {
  const u = i.video ? vid.film : i.full;
  const key = /(admin\/.+)$/.exec(u)[1];
  const r = await ctx.request.get(`${ORIGIN}/api/admin/media/${key}`);
  types.push(r.headers()["content-type"]);
}
check("3 WebP images + 1 mp4 in R2", types.filter((t) => t === "image/webp").length === 3 && types.filter((t) => t === "video/mp4").length === 1, types.join());
const pk = /(admin\/.+)$/.exec(vid.thumb)[1];
check("poster is WebP in R2", (await ctx.request.get(`${ORIGIN}/api/admin/media/${pk}`)).headers()["content-type"] === "image/webp");
check("all 4 photo, ratio + date set", items.every((i) => i.cat === "photo" && i.ratio > 0 && i.date));
await page.click('.adm-tab[data-cat="photo"]');
check("grid shows the 4 tiles marked changed", (await page.locator('.adm-tile[data-changed="1"]').evaluateAll((e, ids) => e.filter((x) => ids.includes(x.dataset.id)).length, items.map((i) => i.id))) === 4);
await page.screenshot({ path: path.join(OUT, "add-done-1440.png") });

// Publish, then the served /library (before JS) changes only in the archive region.
await ctx.request.post(ORIGIN + "/api/admin/gallery/dev-publish", { headers: { origin: ORIGIN } });
const after = await library();
check("/library: counts include the 4", after.photo === before.photo + 4, `${before.photo} -> ${after.photo}`);
check("/library: only the archive region (and the #aliph-content payload) differs", after.rest === before.rest);
if (after.rest !== before.rest) { let i = 0; while (after.rest[i] === before.rest[i]) i++; console.log("  first diff:", JSON.stringify(before.rest.slice(i - 60, i + 80)), "=>", JSON.stringify(after.rest.slice(i - 60, i + 80))); }

// After JS the tiles render with the upload URLs (media.aliphcreative.com -> admin media route).
const pub = await ctx.newPage();
await pub.route("https://media.aliphcreative.com/admin/**", async (route) => route.fulfill({ response: await ctx.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }));
await pub.goto(ORIGIN + "/library");
await pub.waitForTimeout(2500);
const urls = await pub.evaluate(() => [...document.querySelectorAll("img, video")].map((e) => e.currentSrc || e.src || e.poster || ""));
const hit = items.filter((i) => urls.some((u) => u.includes(/(admin\/.+)$/.exec(i.thumb)[1])));
check("public page renders the 4 upload tiles", hit.length === 4, `${hit.length}/4`);

await browser.close();
done();
