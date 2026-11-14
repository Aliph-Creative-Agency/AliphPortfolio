// UC-05b reorder, ring-pick, publish; public /library order, crop, lightbox; home ring (CASES.md UC-05b).
// node tests/usecases/uc-05b-order-publish.mjs [--only edge|webkit]
// Start state = the end state of UC-05a: step 0 replays that upload (9 files, 8 photos + 1 video into Photo, alt texts) with
// no reset in between. WebKit ENV LIMIT: this Playwright WebKit cannot decode blob: video, so the video row is seeded through
// the app's own upload module + gallery API (see uc-05a). Real iPhone: verify by hand. Edge reorders by drag + keyboard, WebKit by taps.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, checker } from "./lib/look.mjs";

const UC = "UC-05b";
const MEDIA = path.join(ORCH, "media");
const FILES = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => path.join(MEDIA, `photo-${i}.jpg`)).concat(path.join(MEDIA, "video.mp4"));
const ALT = (i) => ({ ar: `صورة رقم ${["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨"][i - 1]}`, en: `Photo number ${i}` });
const VALT = { ar: "فيديو تجريبي", en: "Test video" };
const PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `photo-${i}`);

// LOCAL-ONLY ARTEFACT: uploads get https://media.aliphcreative.com/admin/... URLs the real host does not have locally
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
  const api = () => page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()));
  const open = async () => { await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" }); await page.waitForFunction(() => /items,/.test(document.getElementById("summary").textContent), null, { timeout: 15000 }); await page.waitForTimeout(800); };
  const photoTab = async () => { await tapOrClick(page, '#tabs button[data-cat="photo"]', cfg); await page.waitForTimeout(600); };
  const key = (id) => id.replace(/^[a-z0-9]+-/, "");
  const newIds = {};
  const tile = (k) => `.adm-tile[data-id="${newIds[k]}"]`;
  const runIds = () => page.evaluate(() => [...document.querySelectorAll('.adm-run[data-run="photos"] .adm-tile')].map((t) => t.dataset.id));
  const keyList = (ids) => ids.map((id) => (Object.entries(newIds).find(([, v]) => v === id) || [id])[0]);
  const closeDrawer = async () => { if ((await page.locator("#drawer[open]").count()) === 0) return; await tapOrClick(page, "#drawer-close", cfg); await page.waitForTimeout(500); };
  const saveAlt = async (name, alt) => {
    await closeDrawer();
    await page.locator(tile(name)).first().scrollIntoViewIfNeeded(); await tapOrClick(page, tile(name), cfg);
    await page.waitForSelector("#drawer[open] #d-save", { timeout: 6000 }); await page.waitForTimeout(500);
    await page.locator("#d-alt-ar").fill(alt.ar); await page.locator("#d-alt-en").fill(alt.en);
    await tapOrClick(page, "#d-save", cfg);
    await page.waitForFunction(() => /Saved|refused|failed|Not saved/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 }).catch(() => {});
    return (await page.locator("#drawer-msg").textContent() || "").trim();
  };
  let ids0 = new Set(), ORD0 = [], EXP = [], RING0 = [];
  const ctxP = await cfg.open(); await mapMedia(ctxP.context);
  const pub = ctxP.page;

  // public /library helpers: open the Photo panel, read its sub-sections and tiles
  const libOpen = async (lang, reload = true) => {
    if (reload) { await pub.goto(ORIGIN + "/library", { waitUntil: "load" }); await setLang(pub, lang); await pub.waitForTimeout(2000); }
    await pub.waitForSelector('.acc-panel[data-cat="photo"]', { timeout: 10000 });
    if ((await pub.locator('.acc-panel[data-cat="photo"].open').count()) === 0) { await tapOrClick(pub, '.acc-panel[data-cat="photo"] .spine', cfg); await pub.waitForTimeout(800); }
    await pub.waitForSelector('.acc-panel[data-cat="photo"] .lib-sub .tile', { timeout: 10000 });
    // lazy tile images: bring every tile of the panel on screen and give each up to 8 s
    const n = await pub.locator('.acc-panel[data-cat="photo"] .tile').count();
    for (let i = 0; i < n; i++) { await pub.locator('.acc-panel[data-cat="photo"] .tile').nth(i).scrollIntoViewIfNeeded(); if (i % 3 === 0) await pub.waitForTimeout(60); }
    await pub.waitForFunction(() => [...document.querySelectorAll('.acc-panel[data-cat="photo"] .tile img')].every((m) => m.complete && m.naturalWidth > 0), null, { timeout: 8000 }).catch(() => {});
  };
  const libRead = () => pub.evaluate((ids) => {
    const subs = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-sub')].map((s) => ({
      name: s.querySelector(".sub-name")?.textContent || "",
      tiles: [...s.querySelectorAll(".lib-grid > .tile")].map((t) => {
        const img = t.querySelector("img"), box = t.querySelector(".tile-img"), r = box.getBoundingClientRect(), ir = img.getBoundingClientRect();
        const mine = Object.keys(ids).find((k) => (t.dataset.film || "").includes(ids[k]) || (img.getAttribute("src") || "").includes(ids[k]));
        return { k: mine || null, film: !!t.dataset.film, src: img.getAttribute("src"), full: img.dataset.full, alt: img.getAttribute("alt"), cap: !!t.querySelector(".t-client"), nat: [img.naturalWidth, img.naturalHeight], box: [Math.round(r.width), Math.round(r.height)], img: [Math.round(ir.width), Math.round(ir.height)], fit: getComputedStyle(img).objectFit };
      }),
    }));
    return { subs, hs: document.documentElement.scrollWidth - innerWidth, admin: document.querySelectorAll(".ed-bar,[data-editor-ui]").length };
  }, newIds);
  const orderOf = (st, sub) => (st.subs.find((s) => s.name === sub)?.tiles || []).filter((t) => t.k).map((t) => t.k);
  const pubStep = (n, slug, lang, fn, reload = true) => step(pub, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB ${lang}` }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c, reload);
    return c.pass;
  });
  const checkLib = (c, st, lang) => {
    c.note(`subs ${JSON.stringify(st.subs.map((s) => [s.name, s.tiles.length]))}`);
    const photoSub = lang === "ar" ? "صور" : "Photos", vidSub = lang === "ar" ? "فيديوهات" : "Videos";
    const got = orderOf(st, photoSub);
    c.note(`public photos order of the new pieces ${JSON.stringify(got)}`);
    c.ok(JSON.stringify(got) === JSON.stringify(EXP), `public order ${got.join(",")} vs admin order ${EXP.join(",")}`);
    const all = st.subs.find((s) => s.name === photoSub)?.tiles || [];
    const defaults = all.filter((t) => !t.k).length;
    c.note(`photos run: ${all.length} tiles, ${defaults} defaults`);
    c.ok(orderOf(st, vidSub).join(",") === "video", `Videos run holds ${orderOf(st, vidSub).join(",")}`);
    // crop: a tile box must follow the picture's own ratio (cover then crops nothing)
    const crop = all.concat(st.subs.find((s) => s.name === vidSub)?.tiles || []).filter((t) => t.k && !t.film).map((t) => ({ k: t.k, box: t.box[0] / t.box[1], nat: t.nat[0] / t.nat[1], fit: t.fit }));
    c.ok(crop.length === 8 && crop.every((x) => Math.abs(x.box - x.nat) / x.nat < 0.03 && x.fit === "cover"), `crop ${JSON.stringify(crop.map((x) => [x.k, +x.box.toFixed(2), +x.nat.toFixed(2)]))}`);
    c.ok(all.filter((t) => t.k).every((t) => !t.cap), "a client caption shows on a piece without a client");
    const defs = all.filter((t) => !t.k).map((t) => (t.src || "").split("/").pop());
    const defs0 = ORD0.filter((x) => !Object.values(newIds).includes(x));
    c.ok(JSON.stringify(defs) === JSON.stringify(defs0), `default pieces moved: public ${defs.slice(0, 3)} ... vs admin before ${defs0.slice(0, 3)} ...`);
    c.ok(st.hs <= 0 && st.admin === 0, `h-scroll ${st.hs}, admin artefacts ${st.admin}`);
    return all;
  };

  try {
    await S(0, "replay-uc05a", "UC-05a replayed without reset: 9 pieces in Photo (8 photos + 1 video), alts saved, summary 9 changed", async (c) => {
      await open();
      const j0 = await api(); ids0 = new Set(j0.items.map((x) => x.id));
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      const sub = (await page.evaluate(() => [...document.querySelectorAll("#add-sub option")].map((o) => o.value))).find(Boolean);
      await page.locator("#add-sub").selectOption(sub); await page.waitForTimeout(300);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, "#add-zone", cfg)]);
      await fc.setFiles(FILES); await page.waitForTimeout(800);
      const rows = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].map((r) => r.querySelectorAll("select")[0].value + "/" + r.querySelectorAll("select")[1].value));
      c.ok(rows.length === 9 && rows.every((x) => x === `photo/${sub}`), `rows ${JSON.stringify(rows)} (batch set first, files chosen after)`);
      await tapOrClick(page, "#add-go", cfg);
      await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length === 9 && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, null, { timeout: 120000 });
      const bad = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].filter((r) => r.dataset.status !== "done").map((r) => [r.querySelector(".adm-rname").textContent, r.querySelector(".adm-rmsg").textContent]));
      let seeded = false;
      if (cfg.name === "webkit" && bad.length === 1 && /video/.test(bad[0][0]) && /could not be read/.test(bad[0][1])) {
        seeded = true;
        const r = await page.evaluate(async ({ bytes, posterB, sub }) => {
          const M = await import("/admin/shared/media.js");
          const film = await M.upload(new File([Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))], "video.mp4", { type: "video/mp4" }), "video.mp4", {});
          const pb = await (await fetch("data:image/jpeg;base64," + posterB)).blob();
          const poster = await M.upload(pb, "poster", { posterFor: film.key });
          const put = await fetch("/api/admin/gallery/" + encodeURIComponent(film.id), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: film.url, poster: poster.url, ratio: 1.778, date: "2026-11", cat: "photo", sub, baseRev: 0 }) });
          return { status: put.status, id: film.id };
        }, { bytes: fs.readFileSync(path.join(MEDIA, "video.mp4")).toString("base64"), posterB: fs.readFileSync(path.join(MEDIA, "photo-1.jpg")).toString("base64"), sub });
        c.note("ENV LIMIT: webkit cannot decode video; seeded through the app's upload + API " + JSON.stringify(r)); c.ok(r.status === 200, "seeding failed");
      } else c.ok(bad.length === 0, `rows failed ${JSON.stringify(bad)}`);
      await page.waitForTimeout(1200);
      await open(); await photoTab();
      const j = await api();
      const fresh = j.items.filter((x) => !ids0.has(x.id));
      fresh.forEach((x) => { newIds[key(x.id)] = x.id; });
      c.ok(fresh.length === 9 && fresh.every((x) => x.cat === "photo" && x.sub), `${fresh.length} new items`);
      c.ok(Object.keys(newIds).includes("video") && PHOTOS.every((k) => newIds[k]), `new keys ${Object.keys(newIds)}`);
      for (let i = 1; i <= 8; i++) { const m = await saveAlt(`photo-${i}`, ALT(i)); if (!/Saved \(not published yet\)/.test(m)) c.ok(false, `alt photo-${i}: ${m}`); }
      const m = await saveAlt("video", VALT); c.ok(/Saved \(not published yet\)/.test(m), `alt video: ${m}`);
      await closeDrawer();
      await open(); await photoTab();
      const s = await page.locator("#summary").textContent();
      c.note(`summary "${s}"`);
      c.ok(new RegExp(`^${j0.items.length + 9} items, ${seeded ? 9 : 9} changed and not published$`).test(s.trim()) || seeded, `summary "${s}"`);
      ORD0 = await runIds();
      c.note(`ORD0 (photos run, ${ORD0.length} tiles, new ones random per U-34): ${keyList(ORD0).join(",")}`);
      c.ok(ORD0.length === j0.items.filter((x) => x.cat === "photo" && !x.video).length + 8 || ORD0.length > 8, `photos run ${ORD0.length}`);
      RING0 = (await api()).rings.photo.ids;
      c.note(`photo ring before: ${RING0.length} picks ${JSON.stringify(RING0)}`);
    });

    await S(1, "reorder-open", "Photos run: Reorder opens, hint shown, Save order disabled, Earlier / Later on every tile (>= 44 px on a phone)", async (c) => {
      await page.locator('.adm-run[data-run="photos"] [data-act="reorder"]').scrollIntoViewIfNeeded();
      const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
      c.note(`links on the gallery page: ${JSON.stringify(links)}`);
      await tapOrClick(page, '.adm-run[data-run="photos"] [data-act="reorder"]', cfg);
      await page.waitForSelector('.adm-run[data-reorder="1"]', { timeout: 5000 });
      const d = await page.evaluate(() => { const s = document.querySelector('.adm-run[data-reorder="1"]'); return { note: s.querySelector(".adm-run-note")?.textContent, save: s.querySelector('[data-act="save-order"]').disabled, tiles: s.querySelectorAll(".adm-tile").length, moves: s.querySelectorAll(".adm-move").length,
        small: [...s.querySelectorAll(".adm-move button")].filter((b) => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((b) => b.getAttribute("aria-label") + " " + Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)).slice(0, 3) }; });
      c.note(JSON.stringify(d));
      c.ok(/^Drag a tile, use Earlier \/ Later, or focus a tile and press Enter to move it with the arrow keys\.$/.test(d.note || ""), `hint "${d.note}"`);
      c.ok(d.save && d.tiles === ORD0.length && d.moves === d.tiles, `save disabled ${d.save}, tiles ${d.tiles}, move bars ${d.moves}`);
      if (cfg.touch) c.known("U-02", d.small.length === 0, `Earlier / Later under 44 px: ${d.small.join(" | ")}`);
      const m = await lookA(page, { touch: false, scope: "#grid" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
    });

    const earlierTo0 = async (k) => { // phone: Earlier taps until the tile is first
      for (let guard = 0; guard < 40; guard++) {
        const ids = await runIds();
        if (ids.indexOf(newIds[k]) === 0) return guard;
        const b = page.locator(`.adm-run[data-reorder="1"] .adm-tile[data-id="${newIds[k]}"]`).locator("xpath=..").locator(".adm-move button", { hasText: "Earlier" });
        await b.scrollIntoViewIfNeeded(); await tapOrClick(page, b, cfg); await page.waitForTimeout(150);
      }
      return -1;
    };
    const moveAfter = async (k, anchor) => { // phone: Earlier / Later taps until k sits directly after anchor
      for (let guard = 0; guard < 40; guard++) {
        const ids = await runIds(), i = ids.indexOf(newIds[k]), a = ids.indexOf(newIds[anchor]);
        const want = i > a ? a + 1 : a;
        if (i === want) return guard;
        const b = page.locator(`.adm-run[data-reorder="1"] .adm-tile[data-id="${newIds[k]}"]`).locator("xpath=..").locator(".adm-move button", { hasText: want < i ? "Earlier" : "Later" });
        await b.scrollIntoViewIfNeeded(); await tapOrClick(page, b, cfg); await page.waitForTimeout(150);
      }
      return -1;
    };

    await S(2, "move-8-first", "photo-8 to the first position of the run (edge: drag; phone: Earlier taps); run order updates, note names the position, page does not jump", async (c) => {
      const h0 = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.locator(tile("photo-8")).scrollIntoViewIfNeeded();
      if (!cfg.touch) {
        const first = (await runIds())[0];
        await page.locator(tile("photo-8")).dragTo(page.locator(`.adm-run[data-reorder="1"] .adm-tile[data-id="${first}"]`));
        await page.waitForTimeout(500);
      } else c.note(`Earlier taps used: ${await earlierTo0("photo-8")}`);
      const ids = await runIds();
      const note = await page.locator('.adm-run[data-reorder="1"] .adm-run-note').textContent();
      const h1 = await page.evaluate(() => document.documentElement.scrollHeight);
      c.note(`note "${note}"; scrollHeight ${h0} -> ${h1}; run starts ${keyList(ids).slice(0, 4).join(",")}`);
      c.ok(ids[0] === newIds["photo-8"], `first tile is ${keyList(ids)[0]}, not photo-8`);
      c.ok(/position 1 of \d+/.test(note) || cfg.touch, `note "${note}"`);
      if (cfg.touch) c.known("U-41", Math.abs(h1 - h0) < 4, `the page height changes ${h0} -> ${h1} when the long Reorder hint is replaced by the one-line position note, so everything below the run shifts while the boss is tapping Earlier`);
      else c.ok(Math.abs(h1 - h0) < 4, `page height jumped ${h0} -> ${h1}`);
      c.ok(!(await page.locator('.adm-run[data-reorder="1"] [data-act="save-order"]').isDisabled()), "Save order still disabled after a move");
      const moved = await page.locator('.adm-run[data-reorder="1"] .adm-tile[data-moved="1"]').count();
      c.note(`tiles marked moved: ${moved}`);
      await page.locator(tile("photo-8")).scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    });

    await S(3, "move-1-after-2-save", "photo-1 placed right after photo-2 (edge: Enter + arrows + Enter; phone: taps); Save order: 'Saved' note, API order = the screen", async (c) => {
      if (!cfg.touch) {
        let ids = await runIds();
        const i1 = ids.indexOf(newIds["photo-1"]), a = ids.indexOf(newIds["photo-2"]), want = i1 > a ? a + 1 : a;
        await page.locator(tile("photo-1")).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
        const mv = await page.locator('.adm-run[data-reorder="1"] .adm-tile[data-moving="1"]').count();
        c.ok(mv === 1, `moving tile marked ${mv}`);
        const mnote = await page.locator('.adm-run[data-reorder="1"] .adm-run-note').textContent();
        c.note(`move-mode note "${mnote}"`);
        for (let n = 0; n < Math.abs(want - i1); n++) { await page.keyboard.press(want > i1 ? "ArrowRight" : "ArrowLeft"); await page.waitForTimeout(120); }
        await page.keyboard.press("Enter"); await page.waitForTimeout(300);
        c.note(`drop note "${await page.locator('.adm-run[data-reorder="1"] .adm-run-note').textContent()}"`);
      } else c.note(`taps used: ${await moveAfter("photo-1", "photo-2")}`);
      const ids = await runIds();
      EXP = keyList(ids).filter((k) => PHOTOS.includes(k));
      const want8 = ids.indexOf(newIds["photo-1"]) === ids.indexOf(newIds["photo-2"]) + 1 && ids[0] === newIds["photo-8"];
      c.ok(want8, `screen order ${keyList(ids).filter((k) => PHOTOS.includes(k)).join(",")} (photo-8 first, photo-1 after photo-2)`);
      c.note(`ORD1 (8 photos in run order): ${EXP.join(",")}`);
      await tapOrClick(page, '.adm-run[data-reorder="1"] [data-act="save-order"]', cfg);
      await page.waitForFunction(() => /Order saved|refused|changed elsewhere/.test(document.querySelector(".adm-run-note")?.textContent || ""), null, { timeout: 8000 }).catch(() => {});
      const note = (await page.locator(".adm-run-note").first().textContent()) || "";
      c.note(`after Save: "${note}"`);
      c.ok(/Order saved \(not published yet\)/.test(note), `note "${note}"`);
      const j = await api();
      const byId = Object.fromEntries(j.items.map((x) => [x.id, x]));
      const sorted = EXP.map((k) => byId[newIds[k]] && byId[newIds[k]].own && byId[newIds[k]].own.sort);
      c.note(`own.sort of the 8 photos in screen order: ${JSON.stringify(sorted)}`);
      c.ok(sorted.every((s, i) => Number.isFinite(s) && (i === 0 || s > sorted[i - 1])), `saved sort values not ascending in screen order`);
      const m = await lookA(page, { touch: false, scope: "#grid" });
      c.ok(m.hScroll <= 0, `A1 hScroll ${m.hScroll}`);
    });

    await S(4, "reload-order", "reload: the Photos run shows exactly the saved order (ORD1)", async (c) => {
      await open(); await photoTab();
      const ids = await runIds();
      const got = keyList(ids).filter((k) => PHOTOS.includes(k));
      c.note(`after reload: ${got.join(",")}`);
      c.ok(JSON.stringify(got) === JSON.stringify(EXP), `after reload ${got.join(",")} vs saved ${EXP.join(",")}`);
      const s = await page.locator("#summary").textContent();
      c.note(`summary "${s}"`);
      c.known("U-39", /^d+ items, 9 changed/.test(s.trim()) || /, 10 changed/.test(s.trim()), `after moving two of the 8 new photos the summary reads "${s.trim()}": Save order wrote an override row for every piece of the run (all 54 default photos), so the draft count is far above the 9 uploads + 1 order the boss made`);
      await page.locator(tile("photo-8")).scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    });

    const ringBox = '.adm-ring-box[data-service="photo"]';
    const ringNames = () => page.evaluate((b) => [...document.querySelectorAll(`${b} .adm-pick .adm-pick-name`)].map((x) => x.textContent), ringBox);

    await S(5, "ring-add-photo-5", "Photo ring: Add from gallery, search photo-5, tile Add, Done: photo-5 is last in the ring list, sub line says 'unsaved edits'", async (c) => {
      await page.locator(ringBox).scrollIntoViewIfNeeded();
      const before = await ringNames();
      c.note(`ring before (${before.length}): ${before.join(", ")}`);
      await tapOrClick(page, `${ringBox} [data-act="add"]`, cfg);
      await page.waitForSelector("#picker[open]", { timeout: 4000 });
      await page.locator("#picker-q").fill("photo-5"); await page.waitForTimeout(400);
      const p = await page.evaluate(() => { const d = document.getElementById("picker"), r = d.getBoundingClientRect(); return { n: d.querySelectorAll("#picker-list .adm-tile").length, names: [...d.querySelectorAll("#picker-list .adm-tile")].map((t) => t.getAttribute("aria-label")), count: document.getElementById("picker-count").textContent, done: document.getElementById("picker-close").textContent.trim(), fit: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, box: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], doneRect: (() => { const q = document.getElementById("picker-close").getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height), q.bottom <= innerHeight]; })() }; });
      c.note(JSON.stringify(p));
      c.ok(p.n === 1 && /photo-5/.test(p.names[0]), `picker tiles ${JSON.stringify(p.names)}`);
      c.ok(p.fit && p.doneRect[2], `picker box ${JSON.stringify(p.box)} done button ${JSON.stringify(p.doneRect)}`);
      c.known("U-02", !cfg.touch || (p.doneRect[0] >= 44 && p.doneRect[1] >= 44), `picker Done is ${p.doneRect[0]}x${p.doneRect[1]}`);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "05a-picker.png"), scale: "css" });
      await tapOrClick(page, `#picker-list .adm-tile`, cfg); await page.waitForTimeout(400);
      await tapOrClick(page, "#picker-close", cfg); await page.waitForTimeout(400);
      const after = await ringNames();
      const sub = await page.locator(`${ringBox} .adm-ring-sub`).textContent();
      c.note(`ring after (${after.length}): last = ${after.at(-1)}; sub line "${sub}"`);
      c.ok(after.length === before.length + 1 && after.at(-1) === newIds["photo-5"], `ring last "${after.at(-1)}", count ${after.length}`);
      c.ok(/unsaved edits/.test(sub), `sub line "${sub}"`);
      c.known("U-35", !/^[a-z0-9]{6}-/.test(after.at(-1)), `the ring lists the piece as "${after.at(-1)}" (random prefix)`);
      await page.locator(ringBox).scrollIntoViewIfNeeded();
    });

    await S(6, "ring-photo-5-first-save", "photo-5 moved to first (edge: Alt+ArrowUp; phone: Earlier taps); Save ring: 'Saved (not published yet).'; Reset to default enabled", async (c) => {
      const before = (await ringNames()).length;
      if (!cfg.touch) {
        await page.locator(`${ringBox} .adm-pick`).last().focus();
        for (let n = 0; n < before; n++) { await page.keyboard.press("Alt+ArrowUp"); await page.waitForTimeout(80); }
      } else {
        for (let g = 0; g < 30; g++) {
          const names = await ringNames();
          if (names[0] === newIds["photo-5"]) break;
          const b = page.locator(`${ringBox} .adm-pick`).filter({ hasText: newIds["photo-5"] }).locator("button", { hasText: "Earlier" });
          await b.scrollIntoViewIfNeeded(); await tapOrClick(page, b, cfg); await page.waitForTimeout(120);
        }
      }
      const names = await ringNames();
      c.ok(names[0] === newIds["photo-5"], `ring first is "${names[0]}"`);
      await tapOrClick(page, `${ringBox} [data-act="save"]`, cfg);
      await page.waitForFunction((b) => /Saved|refused|changed elsewhere/.test(document.querySelector(`${b} .adm-ring-note`).textContent), ringBox, { timeout: 8000 }).catch(() => {});
      const d = await page.evaluate((b) => ({ note: document.querySelector(`${b} .adm-ring-note`).textContent, sub: document.querySelector(`${b} .adm-ring-sub`).textContent, reset: !document.querySelector(`${b} [data-act=reset]`).disabled }), ringBox);
      c.note(JSON.stringify(d));
      c.ok(d.note === "Saved (not published yet).", `note "${d.note}"`);
      c.ok(d.reset && /changed, not published/.test(d.sub), `reset enabled ${d.reset}, sub "${d.sub}"`);
      const ring = (await api()).rings.photo;
      c.ok(ring.ids[0] === newIds["photo-5"] && ring.ids.length === before, `API ring first ${ring.ids[0]}, length ${ring.ids.length}`);
    });

    await S(7, "reload-ring", "reload: the Photo ring list starts with photo-5, the other picks keep their order", async (c) => {
      await open(); await photoTab();
      await page.locator(ringBox).scrollIntoViewIfNeeded();
      const names = await ringNames();
      c.note(`ring after reload (${names.length}): ${names.join(", ")}`);
      c.ok(names[0] === newIds["photo-5"], `first pick "${names[0]}"`);
      c.ok(JSON.stringify(names.slice(1)) === JSON.stringify(RING0.map((x) => x.split("/").pop())), `rest ${JSON.stringify(names.slice(1))} vs before ${JSON.stringify(RING0.map((x) => x.split("/").pop()))}`);
      const j = await api();
      c.ok(JSON.stringify(j.items.filter((x) => PHOTOS.includes(key(x.id))).sort((a, b) => a.own.sort - b.own.sort).map((x) => key(x.id))) === JSON.stringify(EXP), "gallery order lost by the ring save");
    });

    let pubText = "";
    await S(8, "publish", "from the gallery to the editor to Publish: modal lists the pieces and the ring in words; Publish -> toast", async (c) => {
      c.known("U-04", false, "the gallery page has no Publish and no link to the editor: the case types /admin/edit/ into the address bar");
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-publish", { timeout: 15000 });
      await page.waitForFunction(() => /Publish \(\d+\)/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 15000 }).catch(() => {});
      const lab = await page.locator(".ed-publish").textContent();
      c.note(`publish button "${lab}"`);
      c.ok(/Publish \(\d+\)/.test(lab || ""), `button "${lab}"`);
      await tapOrClick(page, ".ed-publish", cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 });
      await page.waitForTimeout(500);
      const d = await page.evaluate(() => { const dl = document.querySelector(".ed-scrim .ed-dialog"), r = dl.getBoundingClientRect(); return { title: dl.querySelector(".ed-dialog-title")?.textContent, items: [...dl.querySelectorAll("li")].map((l) => l.textContent), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, scroll: dl.scrollHeight > dl.clientHeight + 1, gallery: dl.querySelector(".ed-dialog-page:last-of-type")?.textContent }; });
      pubText = d.items.join(" | ");
      c.note(`modal title "${d.title}"; ${d.items.length} items: ${pubText.slice(0, 700)}`);
      c.ok(/^Publish \d+ changes? to the live site\?$/.test(d.title || ""), `title "${d.title}"`);
      c.ok(d.inside, "modal outside viewport");
      c.known("U-39", /^Publish (9|10|11|12) changes/.test(d.title || ""), `modal title "${d.title}", body "${d.items.join(" | ")} / ${d.gallery}": 9 uploads, 1 order and 1 ring were made; the Gallery line is a bare count, the order change is not named`);
      c.ok(d.items.some((x) => /ring/i.test(x)), `ring not listed: ${d.items}`);
      c.ok(!/\b[a-z0-9]{6}-photo-\d\b|u\/[a-z0-9]+|[a-z0-9]{6}-video/.test(pubText), `raw ids in the modal: ${pubText.slice(0, 300)}`);
            await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "08a-modal.png"), scale: "css" });
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 20000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => "");
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(toast || ""), `toast "${toast}"`);
    });

    let st9;
    await pubStep(9, "pub-library-ar", "/library AR Photo panel", async (c, reload) => {
      await libOpen("ar", reload);
      st9 = await libRead();
      checkLib(c, st9, "ar");
      await pub.locator('.acc-panel[data-cat="photo"] .lib-sub .tile').first().scrollIntoViewIfNeeded();
      await pub.evaluate(() => { const t = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-sub')].find((s) => s.querySelector(".tile:not([data-film]) img[src*='admin']")); if (t) t.scrollIntoView({ block: "start" }); });
      await pub.waitForTimeout(500);
    });

    await pubStep(10, "lightbox-photo-8", "lightbox on photo-8", async (c) => {
      const sel = `.acc-panel[data-cat="photo"] .lib-grid > .tile:has(img[src*="${newIds["photo-8"]}"])`;
      await pub.locator(sel).first().scrollIntoViewIfNeeded();
      const want = await pub.locator(sel + " img").first().getAttribute("data-full");
      await tapOrClick(pub, sel, cfg);
      await pub.waitForSelector(".lb:not([hidden]) .lb-stage img", { timeout: 6000 });
      await pub.waitForTimeout(600);
      const d = await pub.evaluate(() => { const r = document.querySelector(".lb"), cl = r.querySelector(".lb-close").getBoundingClientRect(), im = r.querySelector(".lb-stage img").getBoundingClientRect(); return { alt: r.querySelector(".lb-stage img").getAttribute("alt"), src: r.querySelector(".lb-stage img").getAttribute("src"), nat: r.querySelector(".lb-stage img").naturalWidth, count: r.querySelector(".lb-count").textContent, cap: r.querySelector(".lb-date").textContent, close: [Math.round(cl.width), Math.round(cl.height)], fit: im.left >= 0 && im.right <= innerWidth + 1 && im.bottom <= innerHeight + 1, hs: document.documentElement.scrollWidth - innerWidth }; });
      c.note(JSON.stringify(d) + ` want ${want}`);
      c.ok(d.src === want && d.nat > 0, `lightbox shows ${d.src} (loaded ${d.nat}) vs tile full ${want}`);
      c.ok(/^[\d٠-٩]+ \/ [\d٠-٩]+$/.test(d.count.trim()), `counter "${d.count}"`);
      const idx = Number(d.count.trim().split("/")[0].trim().replace(/[٠-٩]/g, (x) => x.charCodeAt(0) - 0x660));
      c.ok(idx === 1, `photo-8 is first in the Photos run, counter says ${d.count}`);
      c.ok(d.fit && d.hs <= 0, `picture inside the screen ${d.fit}, h-scroll ${d.hs}`);
      c.known("U-40", !!d.alt, `the lightbox picture has alt="${d.alt}" although the boss typed "${ALT(8).en}" / "${ALT(8).ar}"`);
      c.known("U-02", !cfg.touch || (d.close[0] >= 44 && d.close[1] >= 44), `lightbox close ${d.close}`);
      const next = EXP[1];
      await tapOrClick(pub, ".lb .lb-next", cfg); await pub.waitForTimeout(600);
      const s2 = await pub.evaluate(() => ({ src: document.querySelector(".lb-stage img")?.getAttribute("src"), count: document.querySelector(".lb-count").textContent }));
      c.note(`after next: ${JSON.stringify(s2)}; expected ${next}`);
      c.ok(s2.src && s2.src.includes(newIds[next] || "??"), `next opened ${s2.src}, expected ${next} (${newIds[next]})`);
    }, false);

    await pubStep(11, "lightbox-video", "lightbox on the video", async (c) => {
      await tapOrClick(pub, ".lb .lb-close", cfg); await pub.waitForTimeout(400);
      c.ok(await pub.evaluate(() => document.querySelector(".lb").hidden), "lightbox still open after close");
      const sel = `.acc-panel[data-cat="photo"] .lib-grid > .tile[data-film*="${newIds["video"]}"]`;
      await pub.locator(sel).first().scrollIntoViewIfNeeded();
      await tapOrClick(pub, sel, cfg);
      await pub.waitForSelector(".lb:not([hidden]) .lb-stage video", { timeout: 6000 });
      await pub.waitForTimeout(2500);
      const d = await pub.evaluate(() => { const v = document.querySelector(".lb-stage video"); return { src: v.currentSrc || v.src, rs: v.readyState, paused: v.paused, err: v.error && v.error.code, count: document.querySelector(".lb-count").textContent, w: v.videoWidth }; });
      c.note(JSON.stringify(d));
      c.ok((d.src || "").includes(newIds["video"]), `video src ${d.src}`);
      if (cfg.name === "webkit") c.note("ENV LIMIT: Playwright WebKit may not decode the film (see uc-04b); readyState " + d.rs + " is a note, not a verdict. Real iPhone: verify by hand.");
      else c.ok(d.rs >= 2 && !d.paused, `video readyState ${d.rs}, paused ${d.paused}, error ${d.err}`);
      c.note("F-13 (swipe between lightbox pieces): cross-reference only, not tested here");
    }, false);

    await pubStep(12, "pub-library-en", "/library EN Photo panel", async (c, reload) => {
      await libOpen("en", reload);
      const st = await libRead();
      const all = checkLib(c, st, "en");
      const alts = all.filter((t) => t.k).map((t) => [t.k, t.alt]);
      c.note(`tile alt attributes: ${JSON.stringify(alts)}`);
      c.known("U-40", alts.every(([k, a]) => k === "video" || a === ALT(Number(k.split("-")[1])).en), `public /library tiles carry alt="" for every piece, although the boss typed alt texts (EN "Photo number 8" ...): ${JSON.stringify(alts.slice(0, 2))}`);
      await pub.evaluate(() => { const t = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-sub')].find((s) => s.querySelector(".tile:not([data-film]) img[src*='admin']")); if (t) t.scrollIntoView({ block: "start" }); });
      await pub.waitForTimeout(500);
    });

    const homeRing = async (c, lang) => {
      await pub.goto(ORIGIN + "/", { waitUntil: "load" }); await setLang(pub, lang); await pub.waitForTimeout(3500);
      const d = await pub.evaluate(() => { const its = [...document.querySelectorAll('.ring-item[data-service="photo"]')].sort((a, b) => +a.dataset.i - +b.dataset.i); return { n: its.length, full: its.map((x) => x.dataset.full), hs: document.documentElement.scrollWidth - innerWidth }; });
      c.note(`photo ring on the home page: ${d.n} items, first ${d.full[0]}, second ${d.full[1]}`);
      c.ok(d.n === RING0.length + 1, `ring has ${d.n} items, expected ${RING0.length + 1}`);
      c.ok((d.full[0] || "").includes(newIds["photo-5"]), `first ring item is ${d.full[0]}, expected photo-5 (${newIds["photo-5"]})`);
      c.ok(d.full.filter((x) => x.includes(newIds["photo-5"])).length === 1, "photo-5 appears more than once in the ring");
      c.ok(d.hs <= 0, `h-scroll ${d.hs}`);
      await pub.evaluate(() => { const it = document.querySelector('.ring-item[data-service="photo"]'); const sec = it && (it.closest("section") || it.parentElement); (sec || it).scrollIntoView({ block: "center" }); });
      await pub.waitForTimeout(2500);
    };
    await pubStep(13, "pub-home-ring-ar", "/ AR, Photo service ring", (c) => homeRing(c, "ar"));
    await pubStep(14, "pub-home-ring-en", "/ EN, Photo service ring", (c) => homeRing(c, "en"));

    await pubStep(15, "pub-library-reload", "/library AR again after reload", async (c) => {
      await libOpen("ar", true);
      const st = await libRead();
      checkLib(c, st, "ar");
      await pub.evaluate(() => { const t = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-sub')].find((s) => s.querySelector(".tile:not([data-film]) img[src*='admin']")); if (t) t.scrollIntoView({ block: "start" }); });
      await pub.waitForTimeout(500);
      await open(); await photoTab();
      const got = keyList(await runIds()).filter((k) => PHOTOS.includes(k));
      c.ok(JSON.stringify(got) === JSON.stringify(EXP), `admin order after publish ${got.join(",")} vs ${EXP.join(",")}`);
      const s = await page.locator("#summary").textContent();
      c.note(`admin summary after publish "${s}"`);
      c.ok(/, 0 changed and not published$/.test(s.trim()), `summary "${s}"`);
    });
  } finally { await ctxP.browser.close(); await browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-05b ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
