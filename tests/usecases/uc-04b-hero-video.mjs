// UC-04b put a video on Home: hero picture slot first (refuses), then the reel holder; publish; it plays (CASES.md).
// node tests/usecases/uc-04b-hero-video.mjs [--only edge|webkit]
// Site autoplay rule (prototype/main.js:3960-4240): the reel that carries .reel-slide.is-current plays (a muted looping
// <video class="preview"> is built inside the figure) once the figure is >= 35% in view and the track has settled for
// 120 ms; nothing plays with reduced motion or a slow / save-data connection.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, rect, checker } from "./lib/look.mjs";

const UC = "UC-04b";
const VIDEO = path.join(ORCH, "media", "hero-video.mp4");
const FILM = '[data-es="home.film.1"]';

// LOCAL-ONLY ARTEFACT (as uc-04a): uploads get https://media.aliphcreative.com/admin/... URLs the real host does not have
// locally; serve them from the local Worker so the poster and the film can be seen. src assertions use the real URL.
async function mapMedia(context) {
  await context.route("https://media.aliphcreative.com/admin/**", async (r) => {
    try { await r.fulfill({ response: await r.fetch({ url: ORIGIN + "/api/admin/media/" + new URL(r.request().url()).pathname.slice(1) }) }); } catch { await r.abort().catch(() => {}); }
  });
}

async function run(cfg) {
  startRun(UC, cfg.name);
  const { browser, context, page } = await cfg.open();
  await mapMedia(context);
  const S = (n, slug, expect, fn) => step(page, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const drawerOpen = () => page.locator("#ed-media:not([hidden])").count().then((n) => n === 1);
  const dState = () => page.evaluate(() => ({ title: document.querySelector("#ed-media .ed-panel-head strong")?.textContent, slot: document.querySelector("#ed-media .ed-panel-page")?.textContent }));
  const state = () => page.evaluate(() => ({ pub: document.querySelector(".ed-publish")?.textContent, pubDis: document.querySelector(".ed-publish")?.disabled }));
  const closeDrawer = async () => {
    await tapOrClick(page, "#ed-media .ed-close", cfg); await page.waitForTimeout(500);
    const lb = await page.evaluate(() => { const x = document.querySelector(".lb"); return !!x && !x.hidden; });
    if (lb) { await page.keyboard.press("Escape"); await page.waitForTimeout(500); }
    return lb;
  };
  let seeded = false, SLOT = null, FILM_URL = null, POSTER0 = null, POSTER = null, PREV0 = null, BOX0 = null;

  try {
    await S(1, "editor-open", "editor loads; hero frame home.film.1 reachable; drawer title Picture", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(4000);
      // the visible hero frames are not editable (U-20, proven in UC-04a): reach the tagged frame from code
      await page.evaluate((s) => document.querySelector(s).click(), FILM);
      await page.waitForTimeout(900);
      const d = await dState();
      c.note(JSON.stringify(d));
      c.ok(await drawerOpen() && d.title === "Picture" && d.slot === "home.film.1", `drawer ${JSON.stringify(d)}`);
      await lookA(page, { touch: false, scope: ".ed-bar" });
    });

    await S(2, "video-in-picture-slot", "Upload new -> hero-video.mp4 in the hero (picture) slot: refused, nothing changes, message says where a video can go", async (c) => {
      const before = await page.evaluate((s) => [...document.querySelectorAll(s + " img")].map((i) => i.getAttribute("src")), FILM);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, '#ed-media button:has-text("Upload new")', cfg)]);
      await fc.setFiles(VIDEO);
      await page.waitForFunction(() => (document.querySelector("#ed-media .ed-media-uperr")?.textContent || "").length > 0, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(600);
      const msg = (await page.locator("#ed-media .ed-media-uperr").textContent() || "").trim();
      const after = await page.evaluate((s) => [...document.querySelectorAll(s + " img")].map((i) => i.getAttribute("src")), FILM);
      const row = await page.evaluate(async () => (await (await fetch("/api/admin/content")).json()).slots?.["home.film.1"] || null);
      const vis = await page.evaluate(() => { const e = document.querySelector("#ed-media .ed-media-uperr"), r = e.getBoundingClientRect(); return { w: r.width, h: r.height, clipped: e.scrollWidth > e.clientWidth + 1, inside: r.left >= 0 && r.right <= innerWidth }; });
      c.note(`message: "${msg}"; box ${JSON.stringify(vis)}; draft row ${JSON.stringify(row)}`);
      c.ok(msg.length > 0 && JSON.stringify(before) === JSON.stringify(after) && !row, `message "${msg}", srcs changed ${JSON.stringify(before)} -> ${JSON.stringify(after)}, row ${JSON.stringify(row)}`);
      c.ok(vis.inside && !vis.clipped && vis.h > 0, `message box ${JSON.stringify(vis)}`);
      c.known("U-27", /reel|video holder|film|Home/i.test(msg), `a boss who drops a video on the hero is told only "${msg}", not WHERE a video can go (the reel carousel further down Home)`);
      await lookA(page, { touch: cfg.touch, scope: "#ed-media" });
    });

    await S(3, "open-reel", "close; scroll to the reel carousel; click/tap the centred reel -> drawer titled Video with its poster", async (c) => {
      await closeDrawer();
      await page.evaluate(() => document.getElementById("reelShow").scrollIntoView({ block: "center" }));
      await page.waitForTimeout(1500);
      const t = await page.evaluate(() => {
        const cur = document.querySelector(".reel-slide.is-current .holder img[data-es]") || document.querySelector(".reel-slide.is-current img");
        const r = cur.getBoundingClientRect();
        return { slot: cur.dataset.es, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
      });
      c.note(`centred reel ${JSON.stringify(t)}`);
      if (cfg.touch) await page.touchscreen.tap(t.x, t.y); else await page.mouse.click(t.x, t.y);
      await page.waitForTimeout(1200);
      const d = await dState();
      c.note(`drawer ${JSON.stringify(d)}`);
      c.ok(await drawerOpen(), "no drawer opened by the click on the centred reel");
      c.ok(d.title === "Video", `drawer title "${d.title}" (expected Video)`);
      c.ok(d.slot === t.slot, `drawer is for ${d.slot} but the centred reel is ${t.slot}`);
      SLOT = d.slot || t.slot;
      const lb = await page.evaluate(() => { const x = document.querySelector(".lb"); return !!x && !x.hidden; });
      c.known("U-25", !lb, "the site's own lightbox also opened with the reel drawer");
      const th = await page.evaluate(() => { const i = document.querySelector("#ed-media .ed-media-thumb"); return i && { src: i.getAttribute("src"), nat: [i.naturalWidth, i.naturalHeight] }; });
      c.note(`thumb ${JSON.stringify(th)}`);
      c.ok(!!th && th.nat[0] > 0, "drawer shows no poster");
      POSTER0 = th && th.src;
      PREV0 = await page.evaluate((s) => document.querySelector(`[data-es="${s}"]`).closest("figure").getAttribute("data-preview"), SLOT);
      BOX0 = await page.evaluate((s) => { const r = document.querySelector(`[data-es="${s}"]`).getBoundingClientRect(); return [r.width, r.height]; }, SLOT);
      const m = await lookA(page, { touch: cfg.touch, scope: "#ed-media" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
      if (cfg.touch) c.known("U-02", !m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
    });

    await S(4, "upload-progress", "Upload new -> hero-video.mp4 on the reel: progress mid-upload (film phase, then poster phase), buttons locked", async (c) => {
      if (!(await drawerOpen())) { c.ok(false, "drawer not open"); return; }
      await page.route("**/api/admin/upload", async (r) => { await new Promise((ok) => setTimeout(ok, 2500)); await r.continue(); });
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, '#ed-media button:has-text("Upload new")', cfg)]);
      await fc.setFiles(VIDEO);
      const bar = await page.waitForSelector("#ed-media .ed-media-progress:not([hidden])", { timeout: 8000 }).then(() => true, () => false);
      await page.waitForTimeout(500);
      const d = await page.evaluate(() => ({ status: document.querySelector("#ed-media .ed-media-status")?.textContent, now: document.querySelector("#ed-media .ed-media-progress")?.getAttribute("aria-valuenow"),
        up: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Upload new")?.disabled, cancel: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Cancel")?.hidden }));
      c.note(JSON.stringify(d));
      c.ok(bar, "no progress bar");
      c.ok(/Uploading/.test(d.status || "") && d.up === true && d.cancel === false, `states ${JSON.stringify(d)}`);
      // sample the bar until the end to see whether it restarts between the film and the poster
      const seq = [];
      for (let i = 0; i < 40; i++) {
        const v = await page.evaluate(() => ({ n: +document.querySelector("#ed-media .ed-media-progress").getAttribute("aria-valuenow"), s: document.querySelector("#ed-media .ed-media-status")?.textContent }));
        seq.push(v.n);
        if (/Saved to the draft/.test(v.s || "")) break;
        await page.waitForTimeout(400);
      }
      c.note(`progress samples ${seq.join(",")}`);
      c.ok(!seq.some((v, i) => i > 0 && v < seq[i - 1] - 5), `progress bar went backwards: ${seq.join(",")}`);
    });

    await S(5, "upload-done", "ends 'Uploaded. Saved to the draft.'; holders show the new poster; figure data-preview = new film; box unchanged", async (c) => {
      await page.waitForFunction(() => /Saved to the draft/.test(document.querySelector("#ed-media .ed-media-status")?.textContent || ""), null, { timeout: 30000 }).catch(() => {});
      await page.unroute("**/api/admin/upload");
      // ENV LIMIT: the Playwright WebKit build on this Windows box cannot decode a blob: video (a blob mp4 or webm ends in
      // MEDIA_ERR_SRC_NOT_SUPPORTED although canPlayType says "probably"; the same build plays https mp4 fine), so poster extraction fails here and the film
      // cannot be saved through the drawer. Not an app finding. The case then seeds the same draft row the drawer would
      // have written (film + poster uploaded through the app's own upload module, row PUT through the app's own API) and
      // goes on, so the public WebKit side is still seen. Real iPhone Safari: verify by hand.
      const errNow = (await page.locator("#ed-media .ed-media-uperr").textContent() || "");
      if (cfg.name === "webkit" && /could not be read/.test(errNow)) {
        seeded = true;
        c.note("ENV LIMIT: this WebKit build cannot decode video (MEDIA_ERR_SRC_NOT_SUPPORTED); drawer upload cannot finish here, seeding the draft row through the app's own upload module + slot API");
        const seedRes = await page.evaluate(async ({ slot, name, bytes, posterPng }) => {
          const M = await import("/admin/shared/media.js");
          const film = await M.upload(new File([Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))], name, { type: "video/mp4" }), name, {});
          const pb = await (await fetch("data:image/jpeg;base64," + posterPng)).blob();
          const poster = await M.upload(pb, name.replace(/.mp4$/, ".poster.jpg"), { posterFor: film.key });
          const cur = (await (await fetch("/api/admin/content")).json()).slots?.[slot];
          const r = await fetch("/api/admin/slot", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ slot, value: { preview: film.url, poster: poster.url }, baseRev: (cur && cur.rev) || 0 }) });
          return { status: r.status, film: film.url, poster: poster.url };
        }, { slot: SLOT, name: "hero-video.mp4", bytes: fs.readFileSync(VIDEO).toString("base64"), posterPng: fs.readFileSync(path.join(ORCH, "media", "hero-photo.jpg")).toString("base64") });
        c.note("seeded " + JSON.stringify(seedRes));
        c.ok(seedRes.status === 200, "seeding the draft row failed " + JSON.stringify(seedRes));
        await page.reload({ waitUntil: "load" }); await page.waitForSelector(".ed-bar"); await page.waitForTimeout(4000);
        await page.evaluate(() => document.getElementById("reelShow").scrollIntoView({ block: "center" })); await page.waitForTimeout(1500);
        await page.evaluate((s) => document.querySelector("[data-es=\"" + s + "\"]").click(), SLOT); await page.waitForTimeout(1000);
      }
      const st = await page.locator("#ed-media .ed-media-status").textContent();
      const err = await page.locator("#ed-media .ed-media-uperr").textContent();
      if (!seeded) c.ok(/Uploaded\. Saved to the draft\./.test(st || ""), `status "${st}" error "${err}"`);
      const h = await page.evaluate((s) => [...document.querySelectorAll(`[data-es="${s}"]`)].map((i) => ({ src: i.getAttribute("src"), prev: i.closest("figure").getAttribute("data-preview") })), SLOT);
      POSTER = h[0].src; FILM_URL = h[0].prev;
      c.note(`holders ${h.length}: poster ${POSTER}; film ${FILM_URL}`);
      c.ok(h.length > 0 && POSTER !== POSTER0 && h.every((x) => x.src === POSTER && x.prev === FILM_URL && x.prev !== PREV0), `holders ${JSON.stringify(h.slice(0, 3))}`);
      c.ok(/^https:\/\/media\.aliphcreative\.com\/admin\/.+\.(mp4|webm)$/.test(FILM_URL || ""), `film url ${FILM_URL}`);
      const box = await page.evaluate((s) => { const r = document.querySelector(`[data-es="${s}"]`).getBoundingClientRect(); return [r.width, r.height]; }, SLOT);
      c.ok(Math.abs(box[0] - BOX0[0]) <= 1 && Math.abs(box[1] - BOX0[1]) <= 1, `reel box ${BOX0} -> ${box}`);
      await page.waitForFunction((s) => document.querySelector(`[data-es="${s}"]`).naturalWidth > 0, SLOT, { timeout: 6000 }).catch(() => {});
      const geo = await page.evaluate((s) => { const i = document.querySelector(`[data-es="${s}"]`); const cs = getComputedStyle(i); const r = i.getBoundingClientRect(); return { fit: cs.objectFit, nat: [i.naturalWidth, i.naturalHeight], box: [Math.round(r.width), Math.round(r.height)] }; }, SLOT);
      const shown = geo.nat[0] > 0 ? Math.round(100 * (geo.box[0] / geo.box[1]) / (geo.nat[0] / geo.nat[1])) : 100; // 100 = not measurable (lazy image not loaded yet)
      c.note(`poster ${JSON.stringify(geo)}: cover shows ${shown}% of the poster width (16:9 film in a 9:16 box)`);
      c.known("U-29", shown >= 50, `a 16:9 film in the 9:16 reel keeps only ${shown}% of its width (the HERO-VIDEO label loses both ends); neither the drawer nor the upload message says so`);
      c.ok(geo.fit === "cover" && (geo.nat[0] > 0 || cfg.name === "webkit"), `fit ${geo.fit} natural ${geo.nat}`);
      const th = await page.evaluate(() => { const i = document.querySelector("#ed-media .ed-media-thumb"); return { src: i.getAttribute("src"), nat: [i.naturalWidth, i.naturalHeight] }; });
      c.note(`drawer preview ${JSON.stringify(th)}`);
      c.ok(th.src === POSTER && th.nat[0] > 0, `drawer preview ${th.src} not the new poster`);
      const raw = await page.evaluate(() => { const d = document.getElementById("ed-media"); return { urls: d.textContent.includes("https://"), key: d.querySelector(".ed-panel-page")?.textContent, thumb: (() => { const i = d.querySelector(".ed-media-thumb"), r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })() }; });
      c.known("U-28", !raw.urls && !/[.]/.test(raw.key || ""), `the Video drawer shows the internal slot name "${raw.key}" and the full file addresses of the film and poster in monospace; its preview is a ${raw.thumb} px square crop of a 16:9 poster (label cut to ERO-VIDE)`);
      // the preview video the page builds in edit mode: does hovering/centring play the NEW film?
      await page.waitForTimeout(1500);
      const pv = await page.evaluate((s) => { const f = document.querySelector(`[data-es="${s}"]`).closest("figure"); const v = f.querySelector("video.preview"); return v ? { src: v.getAttribute("src"), paused: v.paused } : null; }, SLOT);
      c.note(`edit-mode preview video in the holder: ${JSON.stringify(pv)}`);
      if (pv) c.ok(pv.src === FILM_URL, `edit-mode preview plays ${pv.src}, not the new film`);
    });

    await S(6, "close-publish-count", "drawer closes; Publish shows a count >= 1", async (c) => {
      const lb = await closeDrawer();
      c.known("U-25", !lb, "the lightbox was still open after the reel drawer closed");
      c.ok(!(await drawerOpen()), "drawer still open");
      await page.waitForFunction(() => /^Publish \(\d+\)$/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 8000 }).catch(() => {});
      const s = await state();
      c.ok(/^Publish \(\d+\)$/.test(s.pub || "") && !s.pubDis, `publish "${s.pub}" disabled ${s.pubDis}`);
      const bh = (await rect(page, ".ed-bar")).h;
      if (cfg.touch) c.known("U-12", bh <= 90, `bar wraps to ${Math.round(bh)}px`);
    });

    await S(7, "api-readback", "server draft row holds preview (film) + poster; the film is a stored object that streams", async (c) => {
      const row = await page.evaluate(async (s) => (await (await fetch("/api/admin/content")).json()).slots?.[s] || null, SLOT);
      c.note(JSON.stringify(row));
      c.ok(!!row && row.preview === FILM_URL && row.poster === POSTER, `server row ${JSON.stringify(row)}`);
      const key = FILM_URL.replace("https://media.aliphcreative.com/", "");
      const head = await page.evaluate(async (k) => { const r = await fetch("/api/admin/media/" + k, { headers: { Range: "bytes=0-99" } }); return { status: r.status, type: r.headers.get("content-type"), len: (await r.arrayBuffer()).byteLength }; }, key);
      c.note(`film fetch with Range ${JSON.stringify(head)}`);
      c.ok(head.status === 200 || head.status === 206, `film fetch status ${head.status}`);
      c.ok(/video\/mp4/.test(head.type || ""), `film content-type ${head.type}`);
    });

    await S(8, "reload-reopen", "reload editor, reopen the reel: title Video, new poster kept, Back to default enabled", async (c) => {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(4000);
      await page.evaluate(() => document.getElementById("reelShow").scrollIntoView({ block: "center" }));
      await page.waitForTimeout(1500);
      await page.evaluate((s) => document.querySelector(`.reel-slide.is-current [data-es="${s}"]`)?.click() || document.querySelector(`[data-es="${s}"]`).click(), SLOT);
      await page.waitForTimeout(1000);
      const d = await dState();
      c.ok(await drawerOpen() && d.title === "Video" && d.slot === SLOT, `drawer ${JSON.stringify(d)}`);
      const v = await page.evaluate(() => ({ src: document.querySelector("#ed-media .ed-media-thumb")?.getAttribute("src"), reset: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Back to default")?.disabled }));
      c.note(JSON.stringify(v));
      c.ok(v.src === POSTER, `thumb ${v.src}`);
      c.ok(v.reset === false, "Back to default disabled");
      const h = await page.evaluate((s) => [...document.querySelectorAll(`[data-es="${s}"]`)].map((i) => [i.getAttribute("src"), i.closest("figure").getAttribute("data-preview")]), SLOT);
      c.ok(h.length > 0 && h.every((x) => x[0] === POSTER && x[1] === FILM_URL), `holders after reload ${JSON.stringify(h.slice(0, 2))}`);
      await closeDrawer();
    });

    await S(9, "publish", "modal names the video in words; toast revision N", async (c) => {
      const t0 = Date.now();
      await tapOrClick(page, ".ed-publish", cfg);
      const shown = await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }).then(() => true, () => false);
      c.note(`click -> modal ${shown ? Date.now() - t0 + " ms" : "never"}`);
      c.ok(shown, "publish modal missing 15 s after the click");
      if (!shown) return;
      c.known("U-19", Date.now() - t0 <= 2000, "Publish gave no feedback for more than 2 s");
      await page.waitForTimeout(400);
      const d = await page.evaluate(() => [...document.querySelectorAll(".ed-scrim .ed-dialog li")].map((l) => l.textContent));
      c.note(JSON.stringify(d));
      c.ok(d.length >= 1 && !d.some((x) => /home\.media|home\./.test(x)), `modal lines ${JSON.stringify(d)}`);
      c.ok(d.some((x) => /reel|video|media|picture/i.test(x)), `modal line does not say which video changed: ${JSON.stringify(d)}`);
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 10000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => null);
      c.note(`toast "${toast}"`);
      c.ok(/Published\. The live site is now revision \d+\./.test(toast || ""), `toast "${toast}"`);
    });
  } finally { await browser.close(); }

  const pub = await cfg.open();
  await mapMedia(pub.context);
  const pubStep = (n, slug, lang) => step(pub.page, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB(/) ${lang}: reel ${SLOT || "home.media.N"} carries the new film + poster, plays when centred (readyState>=2, not paused)` }, async () => {
    const c = checker(`${cfg.name} ${n}`);
    const p = pub.page;
    await p.goto(ORIGIN + "/", { waitUntil: "load" });
    await setLang(p, lang);
    await p.waitForTimeout(2500);
    await p.evaluate(() => document.getElementById("reelShow").scrollIntoView({ block: "center" }));
    const slotIdx = (+SLOT.split(".").pop()) - 2; // home.media.2 is the first reel
    // make the slide of our slot the centred one (it is slide 0 for home.media.2: normally already so)
    // the carousel moves on by itself every 4.2 s: the visitor sees our reel whenever it comes round, so wait for the moment
    // it is the centred one AND its video plays (a full lap of the 8 reels is about 34 s)
    const t0 = Date.now();
    const played = await p.waitForFunction(({ i, f, soft }) => { const c = document.querySelector(".reel-slide.is-current"); const v = c && c.querySelector("video.preview"); return !!c && c.dataset.slide === String(i) && !!v && (soft ? v.getAttribute("src") === f : v.readyState >= 2 && !v.paused && v.currentSrc === f); }, { i: slotIdx, f: FILM_URL, soft: cfg.name === "webkit" }, { timeout: 45000, polling: 100 }).then(() => true, (e) => { c.note("wait error: " + String(e.message).slice(0, 200)); return false; });
    const d = await p.evaluate(({ s, f, p0, o }) => {
      const imgs = [...document.querySelectorAll(".reel-slide .holder img")].filter((i) => i.closest(".reel-slide").dataset.slide === String(+s.split(".").pop() - 2));
      const figs = imgs.map((i) => i.closest("figure"));
      const v = document.querySelector(".reel-slide.is-current video.preview");
      const cur = document.querySelector(".reel-slide.is-current");
      const r = cur.querySelector("img").getBoundingClientRect();
      return { n: figs.length, prevs: [...new Set(figs.map((x) => x.getAttribute("data-preview")))], posters: [...new Set(imgs.map((i) => i.getAttribute("src")))], curSlide: cur.dataset.slide,
        v: v && { src: v.getAttribute("src"), cur: v.currentSrc, ready: v.readyState, paused: v.paused, muted: v.muted, t: Math.round(v.currentTime * 10) / 10, w: v.videoWidth, h: v.videoHeight, rect: v.getBoundingClientRect().toJSON() },
        oldPreview: [...document.querySelectorAll("figure[data-preview]")].filter((x) => x.getAttribute("data-preview") === o).length,
        others: [...new Set([...document.querySelectorAll("figure.holder[data-kind=reel]")].map((x) => x.getAttribute("data-preview")))].length,
        hs: document.documentElement.scrollWidth - innerWidth, bar: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length, conn: navigator.connection ? navigator.connection.effectiveType + "/" + navigator.connection.saveData : "n/a",
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches, inView: r.left >= 0 && r.right <= innerWidth };
    }, { s: SLOT, f: FILM_URL, p0: POSTER0, o: PREV0 });
    c.note(`${JSON.stringify(d)}; play wait ${Date.now() - t0} ms`);
    c.ok(d.n > 0 && d.prevs.length === 1 && d.prevs[0] === FILM_URL, `data-preview ${JSON.stringify(d.prevs)} (n=${d.n}) expected ${FILM_URL}`);
    c.ok(d.posters.length === 1 && d.posters[0] === POSTER, `poster srcs ${JSON.stringify(d.posters)} expected ${POSTER}`);
    c.ok(d.oldPreview === 0, `old film still used by ${d.oldPreview} figures`);
    c.note(`our reel became the centred, playing one after ${Date.now() - t0} ms`);
    // ENV LIMIT (webkit): the Playwright WebKit media loader does not go through context.route, so the local-only film at
    // media.aliphcreative.com/admin/... cannot be fetched by the <video> here (the real https reels play fine in the same run).
    // In WebKit the check is that the site built the <video> for our reel with the new src when it came to the centre;
    // "it plays" is proven in Edge and has to be checked on a real iPhone.
    if (cfg.name === "webkit") c.note(`ENV LIMIT: playback of the local-only film not provable in this WebKit; video element state ${JSON.stringify(d.v)}`);
    c.ok(played, `the centred <video> never reached readyState>=2 + playing with currentSrc = the new film: ${JSON.stringify(d.v)}`);
    c.ok(d.hs <= 0 && d.bar === 0, `h-scroll ${d.hs}, admin artefacts ${d.bar}`);
    await p.waitForTimeout(800);
    return c.pass;
  });
  try {
    await pubStep(10, "pub-ar", "ar");
    await pubStep(11, "pub-en", "en");
    await pubStep(12, "pub-ar-reload", "ar");
  } finally { await pub.browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-04b ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
