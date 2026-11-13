// G-08: "Clean up unused files" on /admin/gallery/, headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-cleanup.mjs
// The server never lists an object under 24 h old and a dev bucket cannot age
// one, so the LIST is routed with a fixed answer (a real fresh upload + two
// missing keys); the DELETE goes to the real server first (it refuses all of
// them: under 24 h / not found, nothing is lost), then a routed success shows
// the done state. The real GET is checked once for its shape.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const run = Date.now().toString(36);
const H = { origin: ORIGIN };
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// A real upload, saved as nothing: an orphan, but a fresh one.
const up = await (await ctx.request.post(ORIGIN + "/api/admin/upload", {
  headers: { ...H, "x-file-name": `clean-${run}.jpg` },
  data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")),
})).json();
const real = await ctx.request.get(ORIGIN + "/api/admin/upload/unused");
const realJ = await real.json();
check("real GET unused answers {files, totalSize}", real.status() === 200 && Array.isArray(realJ.files) && typeof realJ.totalSize === "number");
check("a fresh orphan is not listed by the server", !realJ.files.some((f) => f.key === up.key));
const bad = await ctx.request.post(ORIGIN + "/api/admin/upload/cleanup", { headers: { origin: "https://evil.example" }, data: { keys: [up.key] } });
check("cross-origin cleanup is refused", bad.status() === 403);

const VID = `admin/2026/01/zz${run}-old-film.mp4`;
const GONE = `admin/2026/01/zy${run}-gone.webp`;
const LIST = {
  files: [
    { key: up.key, size: 48213, uploaded: "2026-01-02T10:00:00.000Z", url: up.url },
    { key: VID, size: 31457280, uploaded: "2026-01-03T10:00:00.000Z", url: `https://media.aliphcreative.com/${VID}` },
    { key: GONE, size: 2048, uploaded: "2026-01-04T10:00:00.000Z", url: `https://media.aliphcreative.com/${GONE}`, item: "up-old-gone" },
  ],
  totalSize: 48213 + 31457280 + 2048,
};
let list = LIST;
await page.route("**/api/admin/upload/unused", (r) => r.fulfill({ json: list }));
await page.route("https://media.aliphcreative.com/admin/**", (r) =>
  r.fulfill({ status: 302, headers: { location: ORIGIN + "/api/admin/media/" + new URL(r.request().url()).pathname.slice(1) } }));

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-tile");

// Nothing to clean: a note, no dialog.
list = { files: [], totalSize: 0 };
await page.click("#cleanup-find");
await page.waitForFunction(() => /No unused files/.test(document.getElementById("cleanup-note").textContent));
check("empty list -> note, dialog stays shut", !(await page.locator("#cleanup-dlg").evaluate((d) => d.open)));

// Three files: every row ticked, sizes, the deleted-item warning.
list = LIST;
await page.click("#cleanup-find");
await page.waitForSelector("#cleanup-dlg[open] .adm-crow");
const rows = page.locator("#cleanup-list .adm-crow");
check("3 rows listed", (await rows.count()) === 3);
check("all ticked", (await page.locator("#cleanup-list input:checked").count()) === 3);
const sum = await page.textContent("#cleanup-sum");
check("summary gives count and total size", /3 files, 30\.0 MB/.test(sum), sum);
const t1 = await rows.nth(0).textContent();
check("row shows size and date", /47 KB · uploaded 2026-01-02/.test(t1), t1);
check("row of a deleted item warns about restore", /deleted item up-old-gone/.test(await rows.nth(2).textContent()));
const thumb = await rows.nth(0).locator("img").evaluate((i) => new Promise((ok) => {
  const t = Date.now();
  (function wait() { if (i.complete && i.naturalWidth > 0) ok(true); else if (Date.now() - t > 5000) ok(i.src); else setTimeout(wait, 100); })();
}));
check("image row shows a thumbnail", thumb === true, String(thumb));
check("Delete button names count and size", (await page.textContent("#cleanup-go")) === "Delete 3 files (30.0 MB)", await page.textContent("#cleanup-go"));
await page.screenshot({ path: path.join(OUT, "cleanup-1440.png") });

// Untick the video, delete against the real server: it refuses both left.
await rows.nth(1).locator("input").uncheck();
check("unticking updates the button", (await page.textContent("#cleanup-go")) === "Delete 2 files (49 KB)", await page.textContent("#cleanup-go"));
const [req] = await Promise.all([
  page.waitForRequest((r) => r.url().endsWith("/api/admin/upload/cleanup")),
  page.click("#cleanup-go"),
]);
check("POST sends only the ticked keys", JSON.stringify(req.postDataJSON().keys) === JSON.stringify([up.key, GONE]));
await page.waitForFunction(() => /Kept/.test(document.getElementById("cleanup-msg").textContent));
const msg = await page.textContent("#cleanup-msg");
check("server refusals shown (under 24 h, not found)", /^Nothing deleted./.test(msg) && /under 24 h old/.test(msg) && /not found/.test(msg), msg);
check("refused rows stay listed", (await rows.count()) === 3);
const still = await ctx.request.get(`${ORIGIN}/api/admin/media/${up.key}`);
check("the fresh upload is still in R2", still.status() === 200);

// A routed success: the deleted row leaves, the message and note say so.
await page.route("**/api/admin/upload/cleanup", (r) => r.fulfill({ json: { deleted: [up.key], refused: [] } }));
await rows.nth(2).locator("input").uncheck();
await page.click("#cleanup-go");
await page.waitForFunction(() => /^Deleted 1 file /.test(document.getElementById("cleanup-msg").textContent));
check("deleted row removed, 2 left", (await rows.count()) === 2);
check("main note updated", /Deleted 1 unused file/.test(await page.textContent("#cleanup-note")));
check("nothing ticked -> Delete off", await page.locator("#cleanup-go").isDisabled());
await page.click("#cleanup-close");

// 390: no horizontal scroll with the dialog open.
await page.setViewportSize({ width: 390, height: 844 });
await page.click("#cleanup-find");
await page.waitForSelector("#cleanup-dlg[open] .adm-crow");
const over = await page.evaluate(() => ({
  page: document.documentElement.scrollWidth > innerWidth,
  dlg: (() => { const d = document.getElementById("cleanup-dlg"); return d.scrollWidth > d.clientWidth; })(),
}));
check("390: no horizontal scroll (page, dialog)", !over.page && !over.dlg, JSON.stringify(over));
await page.screenshot({ path: path.join(OUT, "cleanup-390.png") });

await browser.close();
done();
