// G-03: the /admin/gallery/ grid in headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-grid.mjs
// Publishes the local dev store once and leaves staged draft rows in the LOCAL dev D1 (a hidden override, a deleted upload); harmless.
import { chromium } from "playwright-core";
import { EDGE, ROOT, check, done } from "./browser.mjs";
import path from "node:path";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-tile");

// Stage fixtures through the API (same origin as the page).
const setup = await page.evaluate(async () => {
  const j = async (r) => ({ status: r.status, body: await r.json() });
  const get = async () => (await j(await fetch("/api/admin/gallery"))).body;
  const send = (m, u, b) => fetch(u, { method: m, headers: { "content-type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
  let g = await get();
  const photoImg = g.items.find((i) => i.kind !== "upload" && i.cat === "photo" && !i.video);
  const design = g.items.find((i) => i.kind !== "upload" && i.cat === "design");
  // 2) revert staged: an override on a design piece that was PUBLISHED, then DELETE (a never-published
  //    override has nothing to revert, so the read model shows the plain default)
  let d = (await get()).items.find((i) => i.id === design.id);
  await send("PUT", "/api/admin/gallery/" + encodeURIComponent(d.id), { hidden: false, alt: { en: "grid test" }, baseRev: d.rev });
  // the editor's publish route: changes -> {token} -> publish {token} (the page's own Origin header is the same origin)
  const { token } = await (await fetch("/api/admin/changes")).json();
  const pub = await send("POST", "/api/admin/publish", { token });
  if (pub.status !== 200) throw new Error("publish -> " + pub.status);
  d = (await get()).items.find((i) => i.id === design.id);
  await send("DELETE", `/api/admin/gallery/${encodeURIComponent(d.id)}?baseRev=${d.rev}`);
  // 1) (after the publish, so it stays changed) hidden override on a photo image (reuse its row if an earlier run made one)
  await send("PUT", "/api/admin/gallery/" + encodeURIComponent(photoImg.id), { hidden: true, alt: { en: "grid " + Date.now() }, baseRev: photoImg.rev });
  // 3) an upload (real bytes in local R2), then staged deletion
  const bytes = new Uint8Array(64);
  bytes.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const up = await (await fetch("/api/admin/upload", { method: "POST", headers: { "x-file-name": "Grid Test " + Date.now() + ".webp" }, body: bytes })).json();
  await send("PUT", "/api/admin/gallery/" + up.id, { src: up.url, cat: "photo", ratio: 1.5, date: "2026-11", baseRev: 0 });
  await send("DELETE", `/api/admin/gallery/${up.id}?baseRev=1`);
  g = await get();
  return { hiddenId: photoImg.id, revertId: design.id, uploadId: up.id, total: g.items.length };
});

await page.reload();
await page.waitForSelector(".adm-tile");

// Every item appears exactly once in its category (count across both tabs, compare with the API).
const api = await page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()).items);
const seen = {};
for (const cat of ["design", "photo"]) {
  await page.click(`.adm-tab[data-cat="${cat}"]`);
  const ids = await page.$$eval(".adm-tile", (els) => els.map((e) => e.dataset.id));
  seen[cat] = ids;
  check(`${cat}: no tile twice`, new Set(ids).size === ids.length);
  check(`${cat}: tile count = API items of that cat`, ids.length === api.filter((i) => i.cat === cat).length, `${ids.length}`);
}
check("every item shown exactly once overall", seen.design.length + seen.photo.length === api.length, `${seen.design.length}+${seen.photo.length}=${api.length}`);

const tile = (id) => page.locator(`.adm-tile[data-id="${setup[id]}"]`);
await page.click('.adm-tab[data-cat="photo"]');
const h = tile("hiddenId");
check("hidden override: badge", (await h.locator(".adm-badge").allTextContents()).includes("hidden"));
check("hidden override: dimmed", Number(await h.locator(".adm-pic").evaluate((e) => getComputedStyle(e).opacity)) < 0.5);
check("hidden override: changed dot", (await h.locator(".adm-dot").count()) === 1);
const dummyUp = tile("uploadId");
check("deleted upload: struck + badge", (await dummyUp.getAttribute("data-removed")) === "1"
  && (await dummyUp.locator(".adm-name").evaluate((e) => getComputedStyle(e).textDecorationLine)) === "line-through"
  && (await dummyUp.locator(".adm-badge").allTextContents()).includes("deleted"));
check("upload lives in the photos run", (await page.locator('.adm-run[data-run="photos"] .adm-tile[data-id="' + setup.uploadId + '"]').count()) === 1);
// lazy image: a saved library order (G-06) can file the fresh upload far down the run
await dummyUp.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
check("upload thumb fell back to /api/admin/media/", (await dummyUp.locator(".adm-pic").getAttribute("src")).includes("/api/admin/media/admin/"));
check("video runs before photos", (await page.$$eval(".adm-run", (s) => s.map((x) => x.dataset.run))).join() === "videos,photos");
await page.screenshot({ path: path.join(OUT, "grid-1440.png") });

await page.click('.adm-tab[data-cat="design"]');
const r = tile("revertId");
check("revert staged: badge, not struck", (await r.locator(".adm-badge").allTextContents()).includes("revert staged")
  && (await r.getAttribute("data-removed")) === "0"
  && (await r.locator(".adm-name").evaluate((e) => getComputedStyle(e).textDecorationLine)) === "none");

// search
await page.fill("#search", "zzz-nothing");
check("search: no match message", (await page.locator(".adm-tile").count()) === 0 && (await page.locator(".adm-empty").count()) === 1);
await page.fill("#search", "");

// phone width: no horizontal scroll
await page.setViewportSize({ width: 390, height: 844 });
await page.click('.adm-tab[data-cat="photo"]');
const sw = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
check("390: no horizontal scroll", sw.s <= sw.w, JSON.stringify(sw));
await page.screenshot({ path: path.join(OUT, "grid-390.png") });

await browser.close();
done();
