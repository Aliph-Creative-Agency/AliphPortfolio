// UC-05a new project: 8 photos + 1 video into Photo > first sub-category, alt text per piece (CASES.md UC-05a).
// node tests/usecases/uc-05a-upload.mjs [--only edge|webkit]
// ENV LIMIT (webkit): the Playwright WebKit build here cannot decode a blob: video (see uc-04b), so the film's poster cannot
// be made in the browser and the video row ends "could not be read". Not an app finding. The case then seeds the same item
// through the app's own upload module + gallery API so the later steps still run. Real iPhone Safari: verify by hand.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, checker } from "./lib/look.mjs";

const UC = "UC-05a";
const MEDIA = path.join(ORCH, "media");
const FILES = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => path.join(MEDIA, `photo-${i}.jpg`)).concat(path.join(MEDIA, "video.mp4"));
const ALT = (i) => ({ ar: `صورة رقم ${["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨"][i - 1]}`, en: `Photo number ${i}` });
const VALT = { ar: "فيديو تجريبي", en: "Test video" };

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
  const tileSel = (k) => `.adm-tile[data-id="${newIds[k]}"]`;
  const openTile = async (name) => { await page.locator(tileSel(name)).first().scrollIntoViewIfNeeded(); await tapOrClick(page, tileSel(name), cfg); await page.waitForSelector("#drawer[open] #d-save", { timeout: 6000 }); await page.waitForTimeout(500); };
  const closeDrawer = async () => { if ((await page.locator("#drawer[open]").count()) === 0) return; await tapOrClick(page, "#drawer-close", cfg); await page.waitForTimeout(500); };
  let N0 = 0, ids0 = new Set(), seeded = false;
  const newIds = {};

  // public /library, own context (no admin page in it); baseline tile count before anything is uploaded
  const pubCtx = await cfg.open(); await mapMedia(pubCtx.context);
  const pubBase = await (async () => { const p = pubCtx.page; await p.goto(ORIGIN + "/library", { waitUntil: "load" }); await setLang(p, "ar"); await p.waitForTimeout(2000); return p.evaluate(() => document.querySelectorAll(".lib-grid > *").length); })();
  const pubS = (n, slug, lang) => step(pubCtx.page, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB(/library) ${lang} before publish: none of the 9 new pieces shown, tile count = baseline ${pubBase}` }, async () => {
    const c = checker(`${cfg.name} ${n}`);
    const p = pubCtx.page;
    await p.goto(ORIGIN + "/library", { waitUntil: "load" }); await setLang(p, lang); await p.waitForTimeout(2000);
    const d = await p.evaluate(() => ({ n: document.querySelectorAll(".lib-grid > *").length, mine: [...document.querySelectorAll(".lib-grid img, .lib-grid video")].filter((i) => /photo-[1-8]|video\.mp4|\/admin\//.test(i.getAttribute("src") || i.getAttribute("data-preview") || "")).length, hs: document.documentElement.scrollWidth - innerWidth, bar: document.querySelectorAll(".ed-bar,[data-editor-ui]").length }));
    c.note(JSON.stringify(d));
    c.ok(d.n === pubBase && d.mine === 0, `public tiles ${d.n} (baseline ${pubBase}), draft pieces visible ${d.mine}`);
    c.ok(d.hs <= 0 && d.bar === 0, `h-scroll ${d.hs}, admin artefacts ${d.bar}`);
    return c.pass;
  });

  try {
    await S(1, "gallery-open", "gallery loads; #summary 'N items, 0 changed and not published'", async (c) => {
      await open();
      const s = await page.locator("#summary").textContent();
      const j = await api(); N0 = j.items.length; ids0 = new Set(j.items.map((x) => x.id));
      c.note(`summary "${s}"; baseline public /library tiles ${pubBase}`);
      c.ok(new RegExp(`^${N0} items, 0 changed and not published$`).test(s.trim()), `summary "${s}" vs API ${N0}`);
      const m = await lookA(page, { touch: cfg.touch, scope: "body" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
      if (cfg.touch) c.known("U-02", !m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
    });

    await S(2, "choose-files", "drop zone -> 9 files: 9 rows (name, kind, Category, Sub-category), Upload enabled and counts them", async (c) => {
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, "#add-zone", cfg)]);
      await fc.setFiles(FILES);
      await page.waitForTimeout(800);
      const d = await page.evaluate(() => ({ rows: [...document.querySelectorAll("#add-rows .adm-row")].map((r) => ({ name: r.querySelector(".adm-rname").textContent, msg: r.querySelector(".adm-rmsg").textContent, cat: r.querySelectorAll("select")[0].value, sub: r.querySelectorAll("select")[1].value })),
        go: { dis: document.getElementById("add-go").disabled, text: document.getElementById("add-go").textContent }, batch: { cat: document.getElementById("add-cat").value, sub: document.getElementById("add-sub").value } }));
      c.note(JSON.stringify(d));
      c.ok(d.rows.length === 9, `${d.rows.length} rows`);
      c.ok(!d.go.dis && /9/.test(d.go.text), `upload button ${JSON.stringify(d.go)}`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#add-rows" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
      if (cfg.touch) c.known("U-02", !m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
    });

    await S(3, "batch-category", "batch Category = Photo, Sub = first sub: every row follows the batch values", async (c) => {
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(400);
      const first = await page.evaluate(() => [...document.querySelectorAll("#add-sub option")].map((o) => [o.value, o.textContent]));
      c.note(`sub options ${JSON.stringify(first)}`);
      const sub = first.find((o) => o[0]);
      c.ok(!!sub, "no sub-category in the Photo list");
      await page.locator("#add-sub").selectOption(sub[0]); await page.waitForTimeout(400);
      const rowVals = () => page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].map((r) => [r.querySelectorAll("select")[0].value, r.querySelectorAll("select")[1].value]));
      const rows = await rowVals();
      const follow = rows.every((r) => r[0] === "photo" && r[1] === sub[0]);
      c.note(`rows after batch change: ${JSON.stringify(rows)}`);
      c.known("U-31", follow, `changing the Batch selects after the files are chosen changes NO row: rows stay ${JSON.stringify([...new Set(rows.map((r) => r.join("/")))])}; a boss who chooses the files first and then sets Photo uploads all 9 as Design`);
      if (!follow) { // what the boss has to do: set each row by hand
        for (let i = 0; i < 9; i++) {
          const r = page.locator("#add-rows .adm-row").nth(i);
          await r.locator("select").nth(0).selectOption("photo");
          await r.locator("select").nth(1).selectOption(sub[0]);
        }
        c.note("set Category/Sub by hand on all 9 rows");
      }
      const rows2 = await rowVals();
      c.ok(rows2.every((r) => r[0] === "photo" && r[1] === sub[0]), `rows ${JSON.stringify(rows2)}`);
    });

    await S(4, "upload-progress", "Upload: per-row progress mid-upload (shot), rows end 'Added (not published yet)', none failed, 9 changed", async (c) => {
      await page.route("**/api/admin/upload", async (r) => { await new Promise((ok) => setTimeout(ok, 1200)); await r.continue(); });
      await tapOrClick(page, "#add-go", cfg);
      await page.waitForFunction(() => document.querySelector('#add-rows .adm-row[data-status="uploading"]'), null, { timeout: 15000 });
      await page.waitForTimeout(1500);
      const mid = await page.evaluate(() => ({ st: [...document.querySelectorAll("#add-rows .adm-row")].map((r) => r.dataset.status), msgs: [...document.querySelectorAll("#add-rows .adm-rmsg")].map((m) => m.textContent), go: document.getElementById("add-go").textContent, goDis: document.getElementById("add-go").disabled, y: scrollY }));
      c.note(`mid-upload ${JSON.stringify(mid)}`);
      fs.mkdirSync(path.join(ORCH, "shots", UC, cfg.name), { recursive: true });
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "04a-mid-upload.png"), scale: "css" });
      c.ok(mid.st.includes("uploading"), "no row is uploading");
      c.ok(mid.goDis, "Upload button not disabled while uploading");
      const geo = await page.evaluate(() => { const up = document.querySelector('#add-rows .adm-row[data-status="uploading"]'), rd = document.querySelector('#add-rows .adm-row[data-status="ready"]'); const r = up.getBoundingClientRect(); const pr = up.querySelector("progress");
        return { upX: Math.round(up.querySelector("select").getBoundingClientRect().x), readyX: Math.round(rd.querySelector("select").getBoundingClientRect().x), inView: r.top >= 0 && r.bottom <= innerHeight, accent: getComputedStyle(pr).accentColor, appearance: getComputedStyle(pr).appearance }; });
      c.note("geometry " + JSON.stringify(geo));
      c.known("U-36", Math.abs(geo.upX - geo.readyX) <= 2, `the uploading row's Category/Sub selects sit at x=${geo.upX} while the waiting rows' sit at x=${geo.readyX} (the Remove button leaves the row), so the columns jump as each row starts`);
      c.known("U-37", geo.accent !== "auto", `progress bars use the browser's own blue (accent-color ${geo.accent}), not the site's ink / terracotta`);
      c.known("U-38", geo.inView || /d+ of d+/.test(mid.go), `while uploading, the row that moves is ${geo.inView ? "" : "off screen and "}the only progress cue: the grey button still reads "${mid.go}" (no "3 of 9")`);
      await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length === 9 && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, null, { timeout: 120000 });
      await page.unroute("**/api/admin/upload");
      let end = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].map((r) => [r.querySelector(".adm-rname").textContent, r.dataset.status, r.querySelector(".adm-rmsg").textContent]));
      const bad = end.filter((e) => e[1] !== "done");
      if (cfg.name === "webkit" && bad.length === 1 && /video/.test(bad[0][0]) && /could not be read/.test(bad[0][2])) {
        seeded = true;
        c.note("ENV LIMIT: this WebKit build cannot decode video; the video row failed with '" + bad[0][2] + "'. Seeding it through the app's own upload module + gallery API");
        const r = await page.evaluate(async ({ bytes, posterB }) => {
          const M = await import("/admin/shared/media.js");
          const film = await M.upload(new File([Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))], "video.mp4", { type: "video/mp4" }), "video.mp4", {});
          const pb = await (await fetch("data:image/jpeg;base64," + posterB)).blob();
          const poster = await M.upload(pb, "poster", { posterFor: film.key });
          const put = await fetch("/api/admin/gallery/" + encodeURIComponent(film.id), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: film.url, poster: poster.url, ratio: 1.778, date: "2026-11", cat: "photo", sub: document.getElementById("add-sub").value || null, baseRev: 0 }) });
          return { status: put.status, id: film.id };
        }, { bytes: fs.readFileSync(path.join(MEDIA, "video.mp4")).toString("base64"), posterB: fs.readFileSync(path.join(MEDIA, "photo-1.jpg")).toString("base64") });
        c.note("seeded " + JSON.stringify(r)); c.ok(r.status === 200, "seeding failed " + JSON.stringify(r));
      }
      c.note(`row end states ${JSON.stringify(end)}`);
      c.ok(end.filter((e) => e[1] === "done").length === (seeded ? 8 : 9) && (seeded || bad.length === 0), `rows ${JSON.stringify(bad)}`);
      c.ok(end.filter((e) => e[1] === "done").every((e) => e[2] === "Added (not published yet)"), `done messages ${JSON.stringify(end.map((e) => e[2]))}`);
      await page.waitForTimeout(1200);
      const s = await page.locator("#summary").textContent();
      c.note(`summary "${s}"`);
      c.ok(new RegExp(`^${N0 + 9} items, 9 changed and not published$`).test(s.trim()) || seeded, `summary "${s}" (expected ${N0 + 9} items, 9 changed)`);
      await lookA(page, { touch: cfg.touch, scope: "#add-rows" });
    });

    await S(5, "reload-photo-tab", "reload: Photo tab shows 9 new tiles with pictures, video tile marked + poster; order recorded", async (c) => {
      await open(); await photoTab();
      const j = await api();
      const fresh = j.items.filter((x) => !ids0.has(x.id));
      fresh.forEach((x) => { newIds[key(x.id)] = x.id; });
      c.note(`new items ${JSON.stringify(fresh.map((x) => ({ id: x.id, cat: x.cat, sub: x.sub, video: x.video, changed: x.changed })))}`);
      c.ok(fresh.length === 9 && fresh.every((x) => x.cat === "photo" && x.sub), `${fresh.length} new items, cat/sub ${JSON.stringify(fresh.map((x) => [x.cat, x.sub]))}`);
      // tile images are loading="lazy": bring every new tile on screen, then give each up to 8 s to load
      for (const x of fresh) { await page.locator(`.adm-tile[data-id="${x.id}"]`).scrollIntoViewIfNeeded(); await page.waitForTimeout(150); }
      await page.waitForFunction((ids) => ids.every((id) => { const m = document.querySelector(`.adm-tile[data-id="${id}"] img`); return m && m.complete && m.naturalWidth > 0; }), fresh.map((x) => x.id), { timeout: 8000 }).catch(() => {});
      const t = await page.evaluate((ids) => [...document.querySelectorAll(".adm-tile")].map((b, i) => ({ i, id: b.dataset.id, name: b.querySelector(".adm-name")?.textContent, vid: !!b.querySelector(".adm-vid"), nat: (() => { const m = b.querySelector("img"); return m && m.complete ? m.naturalWidth : -1; })(), sec: b.closest("section")?.dataset.run })).filter((x) => ids.includes(x.id)), fresh.map((x) => x.id));
      c.note(`tiles in grid order ${JSON.stringify(t.map((x) => `${x.i}:${x.name}${x.vid ? "(video)" : ""}/${x.sec}`))}`);
      c.ok(t.length === 9, `${t.length} of 9 new tiles in the Photo tab`);
      c.ok(t.every((x) => x.nat > 0), `pictures not loaded on tiles ${JSON.stringify(t.filter((x) => !(x.nat > 0)).map((x) => x.name))}`);
      c.ok(t.filter((x) => x.vid).length === 1, "video tile not marked as video");
      const firstNew = t.length ? Math.min(...t.map((x) => x.i)) : -1;
      c.note(`new pieces start at grid position ${firstNew} (ORD0; 0 = first)`);
      const seq = t.filter((x) => !x.vid).map((x) => key(x.id)).join(",");
      c.known("U-34", seq === "photo-1,photo-2,photo-3,photo-4,photo-5,photo-6,photo-7,photo-8", `the 8 photos sit in the grid as ${seq} (uploaded 1..8): same-month uploads tie on date and fall back to the random id`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#grid" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
      if (fresh[0]) await page.locator(`.adm-tile[data-id="${fresh[0].id}"]`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    });

    await S(6, "open-photo-1", "tile photo-1 opens the drawer: title, status, preview, Alt AR/EN, Save details, Replace file, Hide, Delete, Close", async (c) => {
      await openTile("photo-1");
      const d = await page.evaluate(() => ({ title: document.getElementById("drawer-title").textContent, status: document.getElementById("drawer-status").textContent, pic: (() => { const i = document.querySelector("#drawer .adm-dpic"); return i && i.naturalWidth; })(),
        btns: [...document.querySelectorAll("#drawer-actions button, #drawer-close")].map((b) => b.textContent.trim()), fit: (() => { const r = document.getElementById("drawer").getBoundingClientRect(); return { l: r.left, r: r.right }; })() }));
      c.note(JSON.stringify(d));
      c.known("U-35", d.title === "photo-1.jpg" || d.title === "photo-1", `the drawer and the tile name the file "${d.title}" (random prefix), not the name the boss chose (photo-1.jpg)`);
      c.ok(d.title === newIds["photo-1"] && /changed, not published/.test(d.status), `title "${d.title}" status "${d.status}"`);
      c.ok(d.pic > 0, "no preview picture");
      for (const b of ["Save details", "Replace file…", "Hide", "Delete", "Close"]) c.ok(d.btns.includes(b), `button ${b} missing in ${JSON.stringify(d.btns)}`);
      c.ok(d.fit.l >= 0 && d.fit.r <= cfg.viewport.width + 1, `drawer box ${JSON.stringify(d.fit)}`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#drawer" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
      if (cfg.touch) c.known("U-02", !m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
      c.known("U-32", false, "the gallery drawer needs a separate Save details press (no autosave as in the editor's picture drawer); the words differ (editor 'Upload new', gallery 'Replace file…')");
    });

    const saveAlt = async (name, alt) => {
      if ((await page.locator("#drawer[open]").count()) === 0 || (await page.locator("#drawer-title").textContent()) !== newIds[name]) { await closeDrawer(); await openTile(name); }
      await page.locator("#d-alt-ar").fill(alt.ar); await page.locator("#d-alt-en").fill(alt.en);
      await tapOrClick(page, "#d-save", cfg);
      await page.waitForFunction(() => /Saved|refused|failed|Not saved/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 }).catch(() => {});
      return (await page.locator("#drawer-msg").textContent() || "").trim();
    };

    await S(7, "alt-photo-1", "alt AR/EN for photo-1 + Save details: message 'Saved (not published yet).'", async (c) => {
      const msg = await saveAlt("photo-1", ALT(1));
      c.note(`message "${msg}"`);
      c.ok(/Saved \(not published yet\)/.test(msg), `message "${msg}"`);
      const f = await page.evaluate(() => ({ ar: document.getElementById("d-alt-ar").value, dir: document.getElementById("d-alt-ar").dir }));
      c.ok(f.ar === ALT(1).ar && f.dir === "rtl", `alt ar field ${JSON.stringify(f)}`);
      await lookA(page, { touch: cfg.touch, scope: "#drawer" });
    });

    await S(8, "alt-others", "alt texts for photo-2..8 and the video saved one by one; shot after the last", async (c) => {
      for (let i = 2; i <= 8; i++) {
        const msg = await saveAlt(`photo-${i}`, ALT(i));
        c.ok(/Saved \(not published yet\)/.test(msg), `photo-${i}: "${msg}"`);
      }
      const vname = "video";
      c.ok(!!newIds.video, "video item not found among the new ids " + Object.keys(newIds));
      const msg = await saveAlt(vname, VALT);
      c.note(`video "${vname}": "${msg}"`);
      c.ok(/Saved \(not published yet\)/.test(msg), `video: "${msg}"`);
      await lookA(page, { touch: cfg.touch, scope: "#drawer" });
    });

    await S(9, "close-unsaved", "photo-3: type 'UNSAVED' in EN alt, Close without Save: a warning, or the text is kept; record which", async (c) => {
      await closeDrawer();
      await openTile("photo-3");
      await page.locator("#d-alt-en").fill("UNSAVED");
      await closeDrawer();
      const warned = await page.evaluate(() => { const cf = document.getElementById("confirm"); return !!cf && cf.open; });
      const still = await page.evaluate(() => document.getElementById("drawer").open);
      c.note(`after Close: confirm dialog ${warned}, drawer still open ${still}`);
      if (warned) { await tapOrClick(page, "#confirm-no", cfg); await page.waitForTimeout(300); }
      await closeDrawer();
      await openTile("photo-3");
      const v = await page.locator("#d-alt-en").inputValue();
      c.note(`reopened photo-3 EN alt field = "${v}"`);
      c.known("U-33", warned || still || v === "UNSAVED", `text typed in the alt field is dropped silently when the drawer is closed (no warning; reopened field shows "${v}"): the boss expects autosave as in the editor`);
      c.ok(v === ALT(3).en || v === "UNSAVED", `photo-3 EN alt after reopen "${v}"`);
    });

    await S(10, "reload-readback", "reload: all 9 alts read back (drawer fields AND API) exactly as typed; photo-3 EN stays 'Photo number 3'", async (c) => {
      await open(); await photoTab();
      const j = await api();
      const by = Object.fromEntries(j.items.map((x) => [key(x.id), x]));
      for (let i = 1; i <= 8; i++) { const it = by[`photo-${i}`]; c.ok(!!it && it.alt.ar === ALT(i).ar && it.alt.en === ALT(i).en, `photo-${i} alt ${JSON.stringify(it && it.alt)}`); }
      const vname = "video";
      c.ok(!!by[vname] && by[vname].alt.ar === VALT.ar && by[vname].alt.en === VALT.en, `video alt ${JSON.stringify(by[vname] && by[vname].alt)}`);
      await openTile("photo-2");
      const f = await page.evaluate(() => [document.getElementById("d-alt-ar").value, document.getElementById("d-alt-en").value]);
      c.ok(f[0] === ALT(2).ar && f[1] === ALT(2).en, `drawer fields after reload ${JSON.stringify(f)}`);
      await lookA(page, { touch: cfg.touch, scope: "#drawer" });
    });

    await pubS(11, "pub-ar", "ar");
    await pubS(12, "pub-en", "en");
  } finally { await pubCtx.browser.close(); await browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-05a ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
