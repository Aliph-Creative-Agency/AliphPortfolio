// Q-12: uploads on /admin/gallery/. Photo, video (poster grabbed), the wrong types (.txt .heic .mov), an unreadable
// picture, a file over the 300 MB video cap (sparse, made in ORCH/runs and deleted afterwards), a network failure
// mid-upload, a failure of the poster request only, a 500 from the Worker, and a retry after each.
// Also the media drawer on /admin/edit/ with an unreadable clip (message wording).
//   node tests/qa/j-upload.mjs      (local wrangler dev on 8881, Edge 1440 + WebKit 390; ONLY=edge|webkit for one)
// Every message the UI shows is printed as `MSG <label> <case>: "<text>"` so the REPORT can quote it.
// Writes to the LOCAL D1/R2 only; items it created are deleted again at the end of each run.
import path from "node:path";
import fs from "node:fs";
// the app's own network sentence (shared/media.js), so the check never depends on a browser's failed-fetch wording
const networkSentence = (page) => page.evaluate(async () => (await import("/admin/shared/media.js")).NETWORK_FAILURE);
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ORCH, ROOT, shot, watch, check, done } from "./lib/harness.mjs";

const FIX = path.join(ROOT, "tests/gallery/fixtures");
const RUNS = path.join(ORCH, "runs");
const BIG = path.join(RUNS, "q12-big.mp4");
const CAP = 300 * 1024 * 1024; // VIDEO_MAX in worker/src/gallery/upload.ts
const MEDIA = "https://media.aliphcreative.com/admin/**";
const serveMedia = (context) => context.route(MEDIA, async (route) => {
  try { await route.fulfill({ response: await context.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }); }
  catch { await route.abort().catch(() => {}); }
});

const api = (page) => page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()).items);
// go() ends with a gallery reload (add.js load()); navigating away while it is in flight makes WebKit log "Load failed", which is the test's doing
const gallery = async (page) => {
  await page.waitForTimeout(800);
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#summary") && !/Loading/.test(document.querySelector("#summary").textContent) && document.querySelector("#grid"), null, { timeout: 30000 });
  await page.waitForTimeout(600);
};
const tiles = (page) => page.locator("#grid .adm-tile").count();
const rowsOf = (page) => page.evaluate(() => [...document.querySelectorAll("#add-rows li")].map((li) => ({ status: li.dataset.status, msg: (li.querySelector(".adm-rmsg") || {}).textContent, name: (li.querySelector(".adm-rname") || {}).textContent, buttons: li.querySelectorAll("button").length })));
const stage = (page, files) => page.setInputFiles("#add-file", files);
const waitRow = (page, i, ms = 60000) => page.waitForFunction((i) => { const li = document.querySelectorAll("#add-rows li")[i]; return li && (li.dataset.status === "done" || li.dataset.status === "error"); }, i, { timeout: ms });
const go = (page) => page.click("#add-go");
const junk = (name, mimeType, n = 4096) => ({ name, mimeType, buffer: Buffer.alloc(n, 0x41) });

async function run(label, launch, vp, touch) {
  const { browser, page, context } = await launch(vp);
  await serveMedia(context);
  const w = watch(page);
  page.on("pageerror", (e) => console.log(`     PAGEERROR ${label} at ${page.url().replace(ORIGIN, "")}: ${String(e.stack || e.message).split(/\r?\n/).slice(0, 3).join(" / ").slice(0, 250)}`));
  const msg = (what, text) => console.log(`MSG ${label} ${what}: "${text}"`);
  const made = new Set((await (async () => { await gallery(page); return (await api(page)).map((i) => i.id); })()));
  const newItems = async () => (await api(page)).filter((i) => !made.has(i.id));
  const uploads = []; // requests to /api/admin/upload seen by the browser, to prove a rejected file never goes out
  page.on("request", (r) => { if (r.url().includes("/api/admin/upload") && r.method() === "POST") uploads.push(r.url()); });
  try {
    // 1. photo
    await gallery(page);
    const t0 = await tiles(page);
    await stage(page, path.join(FIX, "photo-plain.jpg"));
    let rows = await rowsOf(page);
    check(`${label} photo staged as a ready image row`, rows.length === 1 && rows[0].status === "ready" && rows[0].msg === "image", JSON.stringify(rows));
    check(`${label} Upload button enabled and counts the file`, (await page.textContent("#add-go")).trim() === "Upload 1 file(s)" && !(await page.isDisabled("#add-go")));
    await go(page);
    await waitRow(page, 0);
    rows = await rowsOf(page);
    check(`${label} photo uploaded`, rows[0].status === "done" && rows[0].msg === "Added (not published yet)", JSON.stringify(rows[0]));
    await page.waitForFunction((n) => document.querySelectorAll("#grid .adm-tile").length > n, t0, { timeout: 10000 }).catch(() => {});
    const photoItem = (await newItems())[0];
    check(`${label} photo is a new draft gallery item (kind upload, not hidden)`, !!photoItem && photoItem.kind === "upload" && !photoItem.hidden, JSON.stringify(photoItem || {}).slice(0, 200));
    check(`${label} photo tile appeared (${t0} -> ${await tiles(page)})`, (await tiles(page)) === t0 + 1);
    await page.locator(`#grid .adm-tile[data-id="${photoItem?.id}"]`).scrollIntoViewIfNeeded().catch(() => {});
    const pimg = await page.evaluate(async (id) => { const i = document.querySelector(`#grid .adm-tile[data-id="${id}"] img`); if (!i) return null; await new Promise((r) => setTimeout(r, 1200)); return { ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.slice(0, 80) }; }, photoItem?.id);
    check(`${label} photo tile image decoded`, !!pimg && pimg.ok, JSON.stringify(pimg));
    await shot(page, `Q12-${label}-photo`);

    // 2. video: Edge grabs a poster; Playwright's WebKit has no H.264, so there the message is the check
    await gallery(page);
    const before = new Set((await api(page)).map((i) => i.id));
    await stage(page, path.join(FIX, "clip.mp4"));
    await go(page);
    await waitRow(page, 0);
    rows = await rowsOf(page);
    if (!touch) {
      check(`${label} video uploaded`, rows[0].status === "done", JSON.stringify(rows[0]));
      const vid = (await api(page)).find((i) => !before.has(i.id));
      check(`${label} video item has a poster and the film`, !!vid && vid.video === true && /\.mp4$/.test(vid.film || "") && /poster\.(webp|jpg)$/.test(vid.thumb || ""), JSON.stringify(vid || {}).slice(0, 900));
      const pr = vid ? await context.request.get(ORIGIN + "/api/admin/media/" + new URL(vid.thumb).pathname.slice(1)) : null;
      check(`${label} poster file is stored and is an image`, !!pr && pr.status() === 200 && /^image\//.test(pr.headers()["content-type"] || ""), pr ? pr.status() + " " + pr.headers()["content-type"] : "none");
      await page.waitForSelector(`#grid .adm-tile[data-id="${vid?.id}"] .adm-vid`, { timeout: 8000 }).then(() => check(`${label} video tile carries the video badge`, true), () => check(`${label} video tile carries the video badge`, false));
      await shot(page, `Q12-${label}-video`);
    } else {
      check(`${label} unreadable video (no H.264 in Playwright WebKit): error row, nothing written`, rows[0].status === "error" && !(await api(page)).some((i) => !before.has(i.id)), JSON.stringify(rows[0]));
      msg("video undecodable in gallery add", rows[0].msg);
      console.log(`KNOWN ENV ${label}: Playwright WebKit cannot decode clip.mp4; check a real iPhone`);
    }

    // 3. wrong types: refused at staging, never uploaded, no tile, no write
    await gallery(page);
    const base = await tiles(page), baseItems = (await api(page)).length;
    uploads.length = 0;
    const wrong = [
      ["notes.txt", "text/plain"], ["IMG_0001.heic", "image/heic"], ["IMG_0002.HEIC", ""], ["movie.mov", "video/quicktime"], ["movie2.mov", ""],
      ["doc.pdf", "application/pdf"], ["pic.svg", "image/svg+xml"], ["pic.gif", "image/gif"],
    ];
    await stage(page, wrong.map(([n, t]) => junk(n, t)));
    rows = await rowsOf(page);
    for (let i = 0; i < wrong.length; i++) {
      check(`${label} wrong type ${wrong[i][0]} (${wrong[i][1] || "no type"}) refused at staging`, rows[i].status === "error", JSON.stringify(rows[i]));
      msg(`wrong type ${wrong[i][0]}`, rows[i].msg);
    }
    check(`${label} all wrong-type messages say the same clear sentence`, rows.every((r) => r.msg === "That file type is not accepted."), [...new Set(rows.map((r) => r.msg))].join(" | "));
    check(`${label} Upload stays disabled (nothing ready)`, await page.isDisabled("#add-go"));
    check(`${label} wrong types: no request to /api/admin/upload, no tile, no item`, uploads.length === 0 && (await tiles(page)) === base && (await api(page)).length === baseItems);
    // the same name but a lying extension: an image extension on non-image bytes passes staging, the browser cannot decode it
    await page.reload({ waitUntil: "load" });
    await gallery(page);
    await stage(page, junk("fake.jpg", "image/jpeg"));
    rows = await rowsOf(page);
    check(`${label} fake.jpg staged as ready (type/extension only)`, rows[0].status === "ready");
    await go(page);
    await waitRow(page, 0);
    rows = await rowsOf(page);
    check(`${label} fake.jpg (not a picture) ends as an error row`, rows[0].status === "error", JSON.stringify(rows[0]));
    msg("fake.jpg, bytes are not a picture", rows[0].msg);
    check(`${label} fake.jpg: message is the unreadable sentence`, /could not be read/.test(rows[0].msg));
    check(`${label} fake.jpg wrote nothing`, (await api(page)).length === baseItems && (await tiles(page)) === base);
    // F-09 (fixed): a failed row offers Retry and Remove (a finding fails the run)
    check(`${label} an error row has Retry + Remove (F-09)`, rows[0].buttons === 2, `buttons=${rows[0].buttons}`);
    // a failed row does not block a later good file in the same batch list
    await stage(page, path.join(FIX, "photo-plain.jpg"));
    await go(page);
    await waitRow(page, 1);
    rows = await rowsOf(page);
    check(`${label} a good file after a failed one still uploads (rows: ${rows.map((r) => r.status).join(",")})`, rows[1].status === "done");

    // 4. over the cap: a real mp4 (moov first) padded with zeros to 301 MiB, so it decodes and reaches the Worker
    if (!touch) {
      await gallery(page);
      const baseBig = (await api(page)).length;
      uploads.length = 0;
      const t = Date.now();
      await stage(page, BIG);
      rows = await rowsOf(page);
      check(`${label} 301 MiB file staged as a ready video row`, rows[0].status === "ready" && rows[0].msg === "video", JSON.stringify(rows[0]));
      await go(page);
      await waitRow(page, 0, 120000);
      rows = await rowsOf(page);
      msg("301 MiB video", rows[0].msg);
      console.log(`     301 MiB attempt took ${Date.now() - t} ms, requests: ${uploads.length}`);
      check(`${label} 301 MiB video refused with the too-large sentence`, rows[0].status === "error" && rows[0].msg === "That file is too large.", JSON.stringify(rows[0]));
      check(`${label} 301 MiB: no item written, no tile`, (await api(page)).length === baseBig);
      const un = await page.evaluate(async () => (await (await fetch("/api/admin/upload/unused")).json()));
      check(`${label} 301 MiB: nothing left half-uploaded in storage (no multipart object)`, !JSON.stringify(un).includes("q12-big"), JSON.stringify(un).slice(0, 160));
      check(`${label} page still responsive after the big file`, (await page.evaluate(() => document.querySelector("#add-zone") !== null)) === true);
      await shot(page, `Q12-${label}-toolarge`);
    }

    // 5. network failure mid-upload (request starts, then the connection drops): clear message, no orphan tile, retry works
    await gallery(page);
    const baseA = await tiles(page), baseAI = (await api(page)).length;
    let hits = 0;
    const flaky = async (route) => { hits++; await new Promise((r) => setTimeout(r, 400)); await route.abort("connectionreset"); };
    await page.route("**/api/admin/upload", flaky);
    await stage(page, path.join(FIX, "photo-plain.jpg"));
    await go(page);
    await waitRow(page, 0);
    rows = await rowsOf(page);
    msg("connection dropped during the upload", rows[0].msg);
    check(`${label} dropped upload: error row with a clear network message`, rows[0].status === "error" && rows[0].msg === (await networkSentence(page)), JSON.stringify(rows[0]));
    check(`${label} dropped upload: busy state ended (Upload shows its idle label, nothing ready)`, (await page.textContent("#add-go")).trim() === "Upload" && (await page.isDisabled("#add-go")));
    check(`${label} dropped upload: no orphan tile, no item row`, (await tiles(page)) === baseA && (await api(page)).length === baseAI, `${await tiles(page)} tiles, ${(await api(page)).length} items`);
    check(`${label} dropped upload: the request was really attempted (${hits})`, hits >= 1);
    await page.unroute("**/api/admin/upload", flaky);
    await stage(page, path.join(FIX, "photo-plain.jpg")); // retry = pick the file again
    await go(page);
    await waitRow(page, 1);
    rows = await rowsOf(page);
    check(`${label} retry after the drop works`, rows[1].status === "done", JSON.stringify(rows.map((r) => r.status)));
    await page.waitForFunction((n) => document.querySelectorAll("#grid .adm-tile").length > n, baseA, { timeout: 10000 }).catch(() => {});
    check(`${label} retry: exactly one tile and one item added (the dead row made none)`, (await tiles(page)) === baseA + 1 && (await api(page)).length === baseAI + 1);
    await shot(page, `Q12-${label}-retry`);

    // 6. Worker answers 500 with a reason: what does the user see?
    await gallery(page);
    const baseB = (await api(page)).length;
    const boom = (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "disk on fire" }) });
    await page.route("**/api/admin/upload", boom);
    await stage(page, path.join(FIX, "photo-plain.jpg"));
    await go(page);
    await waitRow(page, 0);
    rows = await rowsOf(page);
    msg("Worker answered 500 {error:'disk on fire'}", rows[0].msg);
    check(`${label} a 500 gives an error row, nothing written`, rows[0].status === "error" && (await api(page)).length === baseB, JSON.stringify(rows[0]));
    check(`${label} a 500 message tells the user to try again`, /try again/i.test(rows[0].msg));
    await page.unroute("**/api/admin/upload", boom);

    // 7. video where only the POSTER request fails (Edge): the film is already stored, no item, no tile
    if (!touch) {
      await gallery(page);
      const baseC = await tiles(page), baseCI = (await api(page)).length;
      const nopost = async (route) => { if (route.request().headers()["x-poster-for"]) return route.abort("connectionreset"); return route.continue(); };
      await page.route("**/api/admin/upload", nopost);
      await stage(page, path.join(FIX, "clip.mp4"));
      await go(page);
      await waitRow(page, 0);
      rows = await rowsOf(page);
      msg("video: film stored, poster request dropped", rows[0].msg);
      check(`${label} failed poster: error row with the network message`, rows[0].status === "error" && rows[0].msg === (await networkSentence(page)), JSON.stringify(rows[0]));
      check(`${label} failed poster: no orphan tile, no item`, (await tiles(page)) === baseC && (await api(page)).length === baseCI);
      const un = await page.evaluate(async () => (await (await fetch("/api/admin/upload/unused")).json()));
      // the Unused-files list only shows files older than 24 h (cleanup.ts MIN_AGE_MS), so the fresh orphan film is not listed yet
      console.log(`     after a failed poster the film sits in storage with no item; Unused files lists nothing yet (24 h grace): ${JSON.stringify(un).slice(0, 120)}`);
      check(`${label} failed poster: the Unused files list still answers`, Array.isArray(un.files));
      await page.unroute("**/api/admin/upload", nopost);
      await stage(page, path.join(FIX, "clip.mp4"));
      await go(page);
      await waitRow(page, 1);
      rows = await rowsOf(page);
      check(`${label} retry of the video works`, rows[1].status === "done", JSON.stringify(rows.map((r) => r.status)));
    }

    // 8. media drawer on /admin/edit/: a clip that cannot be read. Wording check.
    await page.waitForTimeout(800);
    await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
    await page.waitForFunction(() => window.aliphEdit && window.aliphEditorMedia && document.querySelector(".ed-bar"), null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const holder = page.locator('[data-es="home.media.2"]').first();
    await holder.scrollIntoViewIfNeeded();
    await holder.evaluate((el) => el.click());
    await page.waitForSelector("#ed-media:not([hidden])", { timeout: 5000 });
    // (a) bytes that are not a video at all: the Worker's sniff refuses them
    await page.setInputFiles("#ed-media .ed-media-file-input", junk("broken.mp4", "video/mp4"));
    await page.waitForFunction(() => document.querySelector("#ed-media .ed-media-uperr").textContent, null, { timeout: 40000 });
    msg("editor drawer: garbage bytes named broken.mp4", await page.textContent("#ed-media .ed-media-uperr"));
    // (b) a real MP4 header with nothing playable behind it: sniff passes, the poster cannot be grabbed
    const hollow = Buffer.concat([fs.readFileSync(path.join(FIX, "clip.mp4")).subarray(0, 36), Buffer.alloc(4096)]);
    await page.setInputFiles("#ed-media .ed-media-file-input", { name: "hollow.mp4", mimeType: "video/mp4", buffer: hollow });
    await page.waitForFunction(() => { const e = document.querySelector("#ed-media .ed-media-uperr").textContent; return e && !/not supported/.test(e); }, null, { timeout: 40000 });
    const dm = await page.textContent("#ed-media .ed-media-uperr");
    msg("editor drawer: unreadable video hollow.mp4 (real ftyp header)", dm);
    check(`${label} editor drawer: unreadable video gives a message`, dm.length > 0);
    // F-10 (fixed): a video that cannot be read is told so as a video, never "Use a JPEG, PNG or WebP picture"
    check(`${label} editor drawer: a video is not told to use a picture`, !/picture/i.test(dm) && /video/i.test(dm), dm);
    await shot(page, `Q12-${label}-editor-unreadable-video`);
    await page.keyboard.press("Escape");
    await page.setViewportSize(vp).catch(() => {});

    check(`${label} no page errors`, !w.errors.some((e) => e.startsWith("pageerror")), w.errors.join(" | ").slice(0, 300));
    const net = w.errors.filter((e) => !e.startsWith("pageerror"));
    if (net.length) console.log(`     console errors (${label}): ${[...new Set(net)].join(" | ").slice(0, 400)}`);
  } catch (e) { check(`${label} journey ran`, false, String(e).slice(0, 400)); await shot(page, `Q12-${label}-failure`).catch(() => {}); }
  finally {
    // cleanup: delete every item this run created
    try {
      await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
      const gone = await page.evaluate(async (keep) => {
        const items = (await (await fetch("/api/admin/gallery")).json()).items.filter((i) => !keep.includes(i.id) && i.kind === "upload" && !i.deleted);
        let n = 0;
        for (const i of items) { const r = await fetch(`/api/admin/gallery/${encodeURIComponent(i.id)}?baseRev=${i.rev}`, { method: "DELETE" }); if (r.ok) n++; }
        return `${n}/${items.length}`;
      }, [...made]);
      console.log(`     cleanup ${label}: deleted ${gone} created items`);
    } catch (e) { console.log("     cleanup failed: " + String(e).slice(0, 120)); }
    await browser.close();
  }
}

let dev;
try {
  fs.mkdirSync(RUNS, { recursive: true });
  // 301 MiB sparse-ish file: the real clip first (moov at the start, so the browser can still grab a poster), zeros after it
  const clip = fs.readFileSync(path.join(FIX, "clip.mp4"));
  fs.writeFileSync(BIG, clip);
  fs.truncateSync(BIG, CAP + 1024 * 1024);
  check("301 MiB fixture made", fs.statSync(BIG).size === CAP + 1024 * 1024, String(fs.statSync(BIG).size));
  dev = await startDev();
  const only = process.env.ONLY || "";
  if (!only || only === "edge") await run("edge-1440", edge, VIEWPORTS.desktop, false);
  if (!only || only === "webkit") await run("webkit-390", webkit, VIEWPORTS.phone, true);
} catch (e) { check("q12 ran", false, String(e)); }
finally {
  stopDev(dev);
  try { fs.rmSync(BIG, { force: true }); } catch { /* ignore */ }
  check("301 MiB fixture deleted", !fs.existsSync(BIG));
}
done();
