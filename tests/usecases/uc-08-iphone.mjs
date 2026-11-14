// UC-08 iPhone end to end (UC-02 fix + UC-05 upload/alt/order/ring + publish), WebKit 390x844, taps only (CASES.md UC-08).
// node tests/usecases/uc-08-iphone.mjs        (webkit only; --only is ignored)
// Every button/link/tile is reached with locator.tap(); text goes in with keyboard.type after a tap on the field.
// <select> pickers are native iOS wheels that Playwright cannot tap: selectOption is used for them and said so.
// ENV LIMIT: this Playwright WebKit cannot decode a blob: video, so the video row is seeded through the app's own
// upload module + gallery API (see uc-05a). Real iPhone Safari: verify by hand.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, setLang, check, done } from "./lib/uc.mjs";
import { lookA, rect, checker } from "./lib/look.mjs";

const UC = "UC-08";
const MEDIA = path.join(ORCH, "media");
const FILES = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => path.join(MEDIA, `photo-${i}.jpg`)).concat(path.join(MEDIA, "video.mp4"));
const FIXED = "نبدأ من حيثُ";
const HERO1 = '.hero-title [data-i18n="hero1"]';
const ALT1 = { ar: "صورة رقم ١", en: "Photo number 1" };
const KB = 336; // iPhone portrait keyboard incl. suggestion bar, css px: the visible page above it is 844 - 336
const PHOTOS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `photo-${i}`);
const TARGETS = new Map(); // control label -> "WxH" of every control the case tapped (printed + written to runs/)

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
  // the ONLY way this script presses anything: measure the control, then tap() it (never click())
  const tap = async (sel, label) => {
    const loc = typeof sel === "string" ? page.locator(sel).first() : sel.first();
    await loc.scrollIntoViewIfNeeded();
    const r = await loc.boundingBox();
    if (r) TARGETS.set(label, `${Math.round(r.width)}x${Math.round(r.height)}`);
    await loc.tap();
    return r;
  };
  const api = () => page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()));
  const waitGallery = async () => { await page.waitForFunction(() => /items,/.test(document.getElementById("summary")?.textContent || ""), null, { timeout: 15000 }); await page.waitForTimeout(800); };
  const key = (id) => id.replace(/^[a-z0-9]+-/, "");
  const newIds = {};
  const tile = (k) => `.adm-tile[data-id="${newIds[k]}"]`;
  const runIds = () => page.evaluate(() => [...document.querySelectorAll('.adm-run[data-run="photos"] .adm-tile')].map((t) => t.dataset.id));
  const keyList = (ids) => ids.map((id) => (Object.entries(newIds).find(([, v]) => v === id) || [id])[0]);
  const small = async (c, scope, id = "U-02") => {
    const m = await lookA(page, { touch: true, scope });
    c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
    c.known(id, !m.small.length, `A3 <44px in ${scope}: ${m.small.join(" | ")}`);
    return m;
  };
  const ringBox = '.adm-ring-box[data-service="photo"]';
  const ringNames = () => page.evaluate((b) => [...document.querySelectorAll(`${b} .adm-pick .adm-pick-name`)].map((x) => x.textContent), ringBox);
  let ids0 = new Set(), EXP = [], EN0 = null, seeded = false, pathToEditor = "", MOVER = "photo-8";

  const pubCtx = await cfg.open(); await mapMedia(pubCtx.context);
  const pub = pubCtx.page;
  const pubStep = (n, slug, expect, fn) => step(pub, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const homeHero = async (c, lang) => {
    await pub.goto(ORIGIN + "/", { waitUntil: "load" }); await setLang(pub, lang); await pub.waitForTimeout(3000);
    const d = await pub.evaluate(() => ({ h1: document.querySelector('.hero-title [data-i18n="hero1"]')?.textContent, hs: document.documentElement.scrollWidth - innerWidth, bar: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length }));
    c.note(JSON.stringify(d));
    if (lang === "ar") c.ok(d.h1 === FIXED, `public AR hero1 "${d.h1}"`); else c.ok(d.h1 === EN0, `public EN hero1 "${d.h1}" vs EN0 "${EN0}"`);
    c.ok(d.hs <= 0 && d.bar === 0, `h-scroll ${d.hs}, admin artefacts ${d.bar}`);
  };
  const libOpen = async (lang) => {
    await pub.goto(ORIGIN + "/library", { waitUntil: "load" }); await setLang(pub, lang); await pub.waitForTimeout(2000);
    await pub.waitForSelector('.acc-panel[data-cat="photo"]', { timeout: 10000 });
    if ((await pub.locator('.acc-panel[data-cat="photo"].open').count()) === 0) { await pub.locator('.acc-panel[data-cat="photo"] .spine').first().tap(); await pub.waitForTimeout(800); }
    await pub.waitForSelector('.acc-panel[data-cat="photo"] .lib-sub .tile', { timeout: 10000 });
    const n = await pub.locator('.acc-panel[data-cat="photo"] .tile').count();
    for (let i = 0; i < n; i++) { await pub.locator('.acc-panel[data-cat="photo"] .tile').nth(i).scrollIntoViewIfNeeded(); if (i % 3 === 0) await pub.waitForTimeout(60); }
    await pub.waitForFunction(() => [...document.querySelectorAll('.acc-panel[data-cat="photo"] .tile img')].every((m) => m.complete && m.naturalWidth > 0), null, { timeout: 8000 }).catch(() => {});
  };
  const libRead = () => pub.evaluate((ids) => {
    const tiles = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-grid > .tile')].map((t) => {
      const img = t.querySelector("img");
      const k = Object.keys(ids).find((q) => (t.dataset.film || "").includes(ids[q]) || (img.getAttribute("src") || "").includes(ids[q]));
      return { k: k || null };
    });
    return { tiles, hs: document.documentElement.scrollWidth - innerWidth, admin: document.querySelectorAll(".ed-bar,[data-editor-ui]").length };
  }, newIds);
  const checkLib = (c, st) => {
    const photos = st.tiles.filter((t) => t.k && t.k !== "video").map((t) => t.k);
    c.note(`public order of the 8 new photos ${photos.join(",")}`);
    c.ok(JSON.stringify(photos) === JSON.stringify(EXP), `public order ${photos.join(",")} vs admin order ${EXP.join(",")}`);
    c.ok(st.tiles.some((t) => t.k === "video"), "the video is not on the public /library");
    c.ok(st.hs <= 0 && st.admin === 0, `h-scroll ${st.hs}, admin artefacts ${st.admin}`);
  };
  const toTile = () => pub.evaluate(() => { const t = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-sub')].find((s) => s.querySelector(".tile:not([data-film]) img[src*='admin']")); if (t) t.scrollIntoView({ block: "start" }); });

  try {
    await S(1, "dashboard-home", "Dashboard: tap Home; the editor loads with its bar usable at 390", async (c) => {
      await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
      await page.waitForFunction(() => document.getElementById("changes-n")?.textContent.trim() !== "–", null, { timeout: 5000 }).catch(() => {});
      const r = await tap('a[href="/admin/edit/"]', "Dashboard card: Home");
      c.note(`Home card ${JSON.stringify(r)}`);
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(2500);
      c.ok(page.url().endsWith("/admin/edit/"), `url ${page.url()}`);
      const d = await page.evaluate(() => ({ btns: [...document.querySelectorAll(".ed-bar button, .ed-bar a")].map((b) => b.textContent.trim().replace(/\s+/g, " ") + " " + Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)), h: Math.round(document.querySelector(".ed-bar").getBoundingClientRect().height) }));
      c.note(`bar ${d.h}px tall: ${d.btns.join(" | ")}`);
      await small(c, ".ed-bar", "U-02");
    });

    await S(2, "tap-hero", "ONE tap on hero line 1 opens the text popover; AR/EN textareas, Cancel/Done; popover vs the keyboard line", async (c) => {
      let taps = 0, open = false;
      while (taps < 3 && !open) {
        taps++; await tap(HERO1, "Hero heading line 1");
        open = await page.waitForSelector(".ed-pop:not([hidden])", { timeout: 2500 }).then(() => true, () => false);
      }
      c.note(`taps needed to open the popover: ${taps}`);
      c.known("F-08", taps === 1 && open, `popover opened after ${taps} tap(s), open=${open}`);
      if (!open) { // workaround so the case can go on (a boss on a real phone is stuck here): a synthetic mouse click, as uc-02 does
        c.known("U-55", false, "3 taps on hero line 1 never opened the text popover on iPhone-sized WebKit (touch); only a mouse-style click() did");
        await page.locator(HERO1).first().click();
        open = await page.waitForSelector(".ed-pop:not([hidden])", { timeout: 4000 }).then(() => true, () => false);
        c.ok(open, "popover not opened even by click()");
        if (!open) return;
      }
      await page.waitForTimeout(500);
      const d = await page.evaluate((KB) => {
        const p = document.querySelector(".ed-pop"), r = p.getBoundingClientRect(), a = p.querySelector('textarea[data-loc="ar"]').getBoundingClientRect();
        const bs = [...p.querySelectorAll("button")].map((b) => [b.textContent.trim(), Math.round(b.getBoundingClientRect().top), Math.round(b.getBoundingClientRect().bottom)]);
        const h = document.querySelector('.hero-title [data-i18n="hero1"]').getBoundingClientRect();
        return { pop: [r.left, r.top, r.right, r.bottom].map(Math.round), arBottom: Math.round(a.bottom), buttons: bs, line: [Math.round(h.top), Math.round(h.bottom)], vis: innerHeight - KB, scrollY: Math.round(scrollY) };
      }, KB);
      c.note(`popover ${JSON.stringify(d)}`);
      c.ok(d.pop[0] >= 0 && d.pop[2] <= 390.5, `popover outside viewport ${d.pop}`);
      const dn = d.buttons.find((b) => b[0] === "Done");
      c.known("U-56", !!dn && dn[2] <= d.vis, `with the on-screen keyboard up (~${KB}px) only y<${d.vis} stays visible: the popover's Done button sits at y ${dn && dn[1]}-${dn && dn[2]}, the AR textarea ends at y ${d.arBottom}`);
      await small(c, ".ed-pop", "U-02");
    });

    await S(3, "type-done", "tap the AR textarea, type the fix, tap Done: heading = fix, chip Saved, Publish (1)", async (c) => {
      EN0 = await page.evaluate(() => document.querySelector('.ed-pop textarea[data-loc="en"]').value);
      await tap('.ed-pop textarea[data-loc="ar"]', "Popover Arabic textarea");
      await page.keyboard.press("Control+A");
      await page.keyboard.type(FIXED, { delay: 30 });
      await page.waitForTimeout(400);
      c.ok((await page.locator(HERO1).first().textContent()) === FIXED, `live heading "${await page.locator(HERO1).first().textContent()}"`);
      await page.waitForFunction(() => document.querySelector(".ed-publish").textContent === "Publish (1)", null, { timeout: 9000 }).catch(() => {});
      await tap('.ed-pop button:has-text("Done")', "Popover Done");
      await page.waitForTimeout(500);
      const s = await page.evaluate(() => ({ pop: document.querySelector(".ed-pop").hidden, chip: document.querySelector(".ed-chip").textContent, pub: document.querySelector(".ed-publish").textContent, h: document.querySelector('.hero-title [data-i18n="hero1"]').textContent }));
      c.note(JSON.stringify(s));
      c.ok(s.pop && s.h === FIXED, `popover hidden ${s.pop}, heading "${s.h}"`);
      c.ok(s.chip === "Saved" && s.pub === "Publish (1)", `chip "${s.chip}", button "${s.pub}"`);
      const bh = (await rect(page, ".ed-bar")).h;
      c.known("U-12", bh <= 90, `bar is ${Math.round(bh)}px tall (3 rows) once it reads Saved / Publish (1)`);
    });

    await S(4, "publish-modal", "tap Publish (1): modal lists the change in words, buttons >= 44 px, inside the screen", async (c) => {
      await tap(".ed-publish", "Bar: Publish (1)");
      const shown = await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }).then(() => true, () => false);
      c.ok(shown, "publish modal never appeared");
      if (!shown) return;
      await page.waitForTimeout(400);
      const d = await page.evaluate(() => { const dl = document.querySelector(".ed-scrim .ed-dialog"), r = dl.getBoundingClientRect(); return { title: dl.querySelector(".ed-dialog-title")?.textContent, items: [...dl.querySelectorAll("li")].map((l) => l.textContent), btns: [...dl.querySelectorAll("button")].map((b) => b.textContent + " " + Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
      c.note(JSON.stringify(d));
      c.ok(/^Publish 1 change to the live site\?$/.test(d.title) && d.items.length === 1, `title "${d.title}", ${d.items.length} items`);
      c.ok(d.inside, "modal outside the viewport");
      c.known("U-02", d.btns.every((b) => parseInt(b.split("x").at(-1)) >= 44), `modal buttons ${d.btns}`);
    });

    await S(5, "publish", "tap Publish in the modal: toast 'Published. The live site is now revision N.'", async (c) => {
      await tap('.ed-scrim button:has-text("Publish")', "Modal: Publish");
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 12000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => null);
      c.note(`toast "${toast}"`);
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(toast || ""), `toast "${toast}"`);
      const tb = await rect(page, ".ed-toast"), bar = await rect(page, ".ed-bar");
      c.known("U-11", !(tb && bar && tb.y < bar.bottom && tb.bottom > bar.y), "toast overlaps the bar");
    });

    await pubStep(6, "pub-ar", "PUB(/) AR: hero1 = the fix", (c) => homeHero(c, "ar"));
    await pubStep(7, "pub-en", "PUB(/) EN: hero1 unchanged", (c) => homeHero(c, "en"));

    await S(8, "dashboard-gallery", "from the editor: tap Dashboard, tap Gallery: summary 'N items, 0 changed and not published'", async (c) => {
      await tap('.ed-bar a:has-text("Dashboard")', "Bar: Dashboard");
      await page.waitForURL("**/admin/", { timeout: 8000 }).catch(() => {});
      c.ok(/\/admin\/$/.test(page.url()), `after the Dashboard tap: ${page.url()}`);
      await tap('a[href="/admin/gallery/"]', "Dashboard card: Gallery");
      await waitGallery();
      const s = (await page.locator("#summary").textContent()).trim();
      const j = await api(); ids0 = new Set(j.items.map((x) => x.id));
      c.note(`summary "${s}"; photo ring ${j.rings.photo.ids.length} picks`);
      c.ok(new RegExp(`^${j.items.length} items, 0 changed and not published$`).test(s), `summary "${s}"`);
      await small(c, "body", "U-02");
    });

    await S(9, "choose-files", "tap the drop zone, choose the 9 files: 9 rows, Upload counts them", async (c) => {
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tap("#add-zone", "Gallery: drop zone")]);
      await fc.setFiles(FILES); await page.waitForTimeout(800);
      const d = await page.evaluate(() => ({ n: document.querySelectorAll("#add-rows .adm-row").length, go: [document.getElementById("add-go").disabled, document.getElementById("add-go").textContent] }));
      c.note(JSON.stringify(d));
      c.ok(d.n === 9 && !d.go[0] && /9/.test(d.go[1]), `rows ${d.n}, upload button ${d.go}`);
      await small(c, "#add-rows", "U-02");
    });

    await S(10, "batch-upload", "batch Category Photo + first sub, tap Upload: all 9 added (not published yet), 9 changed", async (c) => {
      await page.locator("#add-cat").scrollIntoViewIfNeeded();
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(400);
      const sub = (await page.evaluate(() => [...document.querySelectorAll("#add-sub option")].map((o) => o.value))).find(Boolean);
      await page.locator("#add-sub").selectOption(sub); await page.waitForTimeout(400);
      c.note("ENV: native <select> wheels cannot be tapped by Playwright, selectOption used for Category / Sub-category");
      const rows = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].map((r) => r.querySelectorAll("select")[0].value + "/" + r.querySelectorAll("select")[1].value));
      const follow = rows.every((x) => x === `photo/${sub}`);
      c.known("U-31", follow, `the batch selects changed after the 9 files were chosen changed no row: rows ${JSON.stringify([...new Set(rows)])}`);
      if (!follow) for (let i = 0; i < 9; i++) { const r = page.locator("#add-rows .adm-row").nth(i); await r.locator("select").nth(0).selectOption("photo"); await r.locator("select").nth(1).selectOption(sub); }
      await tap("#add-go", "Gallery: Upload");
      await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length === 9 && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, null, { timeout: 150000 });
      const end = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].map((r) => [r.querySelector(".adm-rname").textContent, r.dataset.status, r.querySelector(".adm-rmsg").textContent]));
      const bad = end.filter((e) => e[1] !== "done");
      if (bad.length === 1 && /video/.test(bad[0][0]) && /could not be read/.test(bad[0][2])) {
        seeded = true;
        const r = await page.evaluate(async ({ bytes, posterB, sub }) => {
          const M = await import("/admin/shared/media.js");
          const film = await M.upload(new File([Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))], "video.mp4", { type: "video/mp4" }), "video.mp4", {});
          const pb = await (await fetch("data:image/jpeg;base64," + posterB)).blob();
          const poster = await M.upload(pb, "poster", { posterFor: film.key });
          const put = await fetch("/api/admin/gallery/" + encodeURIComponent(film.id), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: film.url, poster: poster.url, ratio: 1.778, date: "2026-11", cat: "photo", sub, baseRev: 0 }) });
          return { status: put.status, id: film.id };
        }, { bytes: fs.readFileSync(path.join(MEDIA, "video.mp4")).toString("base64"), posterB: fs.readFileSync(path.join(MEDIA, "photo-1.jpg")).toString("base64"), sub });
        c.note("ENV LIMIT: video row 'could not be read' in this WebKit; seeded through the app's upload + API " + JSON.stringify(r)); c.ok(r.status === 200, "seeding failed");
      } else c.ok(bad.length === 0, `rows failed ${JSON.stringify(bad)}`);
      c.ok(end.filter((e) => e[1] === "done").every((e) => e[2] === "Added (not published yet)"), `done messages ${JSON.stringify(end.map((e) => e[2]))}`);
      await page.waitForTimeout(1200);
      await page.reload({ waitUntil: "load" }); await waitGallery();
      const s = (await page.locator("#summary").textContent()).trim();
      c.note(`summary after reload "${s}"`);
      c.ok(/, 9 changed and not published$/.test(s), `summary "${s}"`);
      const j = await api();
      j.items.filter((x) => !ids0.has(x.id)).forEach((x) => { newIds[key(x.id)] = x.id; });
      c.ok(Object.keys(newIds).length === 9, `new ids ${Object.keys(newIds)}`);
    });

    await S(11, "alt-photo-1", "Photo tab, tap photo-1, tap the alt fields and type AR/EN, tap Save details, tap Close; Save details above the keyboard line", async (c) => {
      await tap('#tabs button[data-cat="photo"]', "Gallery tab: Photo"); await page.waitForTimeout(600);
      await tap(tile("photo-1"), "Gallery tile: photo-1");
      await page.waitForSelector("#drawer[open] #d-save", { timeout: 6000 }); await page.waitForTimeout(500);
      await tap("#d-alt-ar", "Drawer: Alt text (Arabic)"); await page.keyboard.type(ALT1.ar, { delay: 25 });
      await tap("#d-alt-en", "Drawer: Alt text (English)"); await page.keyboard.type(ALT1.en, { delay: 25 });
      const g = await page.evaluate((KB) => { const s = document.getElementById("d-save").getBoundingClientRect(), f = document.getElementById("d-alt-en").getBoundingClientRect(); return { saveTop: Math.round(s.top), saveBottom: Math.round(s.bottom), enBottom: Math.round(f.bottom), vis: innerHeight - KB }; }, KB);
      c.note(`drawer geometry ${JSON.stringify(g)}`);
      c.known("U-57", g.saveBottom <= g.vis, `with the keyboard up (~${KB}px) only y<${g.vis} is visible; Save details sits at y ${g.saveTop}-${g.saveBottom}`);
      await tap("#d-save", "Drawer: Save details");
      await page.waitForFunction(() => /Saved|refused|failed|Not saved/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 }).catch(() => {});
      const msg = (await page.locator("#drawer-msg").textContent()).trim();
      c.note(`message "${msg}"`);
      c.ok(/Saved \(not published yet\)/.test(msg), `message "${msg}"`);
      await small(c, "#drawer", "U-02");
      await tap("#drawer-close", "Drawer: Close"); await page.waitForTimeout(500);
      c.ok((await page.locator("#drawer[open]").count()) === 0, "drawer still open after Close");
      const alt = (await api()).items.find((x) => x.id === newIds["photo-1"]).alt;
      c.ok(alt.ar === ALT1.ar && alt.en === ALT1.en, `alt read back ${JSON.stringify(alt)}`);
    });

    await S(12, "reorder-photo-8", "tap Reorder, tap Earlier on the mover (photo-8, or the last of the 8 if photo-8 is already first) until it is first, tap Save order: 'Order saved'; Earlier/Later >= 44 px, not overlapping", async (c) => {
      await tap('.adm-run[data-run="photos"] [data-act="reorder"]', "Photos run: Reorder");
      await page.waitForSelector('.adm-run[data-reorder="1"]', { timeout: 5000 });
      const geo = await page.evaluate((id) => { const t = document.querySelector(`.adm-run[data-reorder="1"] .adm-tile[data-id="${id}"]`).parentElement, bs = [...t.querySelectorAll(".adm-move button")].map((b) => b.getBoundingClientRect()); return { sizes: bs.map((r) => Math.round(r.width) + "x" + Math.round(r.height)), overlap: bs.length > 1 && bs[0].left < bs[1].right && bs[1].left < bs[0].right && bs[0].top < bs[1].bottom && bs[1].top < bs[0].bottom }; }, newIds["photo-8"]);
      c.note(`Earlier/Later ${JSON.stringify(geo)}`);
      c.ok(!geo.overlap, "Earlier and Later overlap");
      c.known("U-02", geo.sizes.every((s) => s.split("x").every((v) => +v >= 44)), `Earlier/Later sizes ${geo.sizes}`);
      { // the 8 uploads tie on date and land in a random order (U-34): photo-8 is the mover unless it happens to be first already, then the last of the 8
        const ks = keyList(await runIds()).filter((k) => PHOTOS.includes(k));
        MOVER = ks[0] === "photo-8" ? ks.at(-1) : "photo-8";
        c.note(`run order of the 8 photos before the moves: ${ks.join(",")}; mover ${MOVER}`);
      }
      let taps = 0;
      for (; taps < 60; taps++) {
        const ids = await runIds();
        if (ids.indexOf(newIds[MOVER]) === 0) break;
        const b = page.locator(`.adm-run[data-reorder="1"] .adm-tile[data-id="${newIds[MOVER]}"]`).locator("xpath=..").locator(".adm-move button", { hasText: "Earlier" });
        await tap(b, "Tile: Earlier"); await page.waitForTimeout(150);
      }
      c.note(`Earlier taps used: ${taps}`);
      c.ok(taps < 60, `${MOVER} never reached first`);
      await tap('.adm-run[data-reorder="1"] [data-act="save-order"]', "Photos run: Save order");
      await page.waitForFunction(() => /Order saved|refused|changed elsewhere/.test(document.querySelector(".adm-run-note")?.textContent || ""), null, { timeout: 8000 }).catch(() => {});
      const note = ((await page.locator(".adm-run-note").first().textContent()) || "").trim();
      c.note(`after Save: "${note}"`);
      c.ok(/Order saved \(not published yet\)/.test(note), `note "${note}"`);
      EXP = keyList(await runIds()).filter((k) => PHOTOS.includes(k));
      c.note(`order of the 8 photos on screen: ${EXP.join(",")}`);
      c.ok(EXP[0] === MOVER, `first is ${EXP[0]}, expected ${MOVER}`);
      const j = await api();
      const sorted = EXP.map((k) => j.items.find((x) => x.id === newIds[k]).own.sort);
      c.ok(sorted.every((s, i) => Number.isFinite(s) && (i === 0 || s > sorted[i - 1])), `saved sort values ${JSON.stringify(sorted)} not ascending in screen order`);
    });

    await S(13, "ring-photo-5", "Photo ring: tap Add from gallery, tap the search, type photo-5, tap the tile, tap Done, tap Save: photo-5 in the ring", async (c) => {
      await page.waitForTimeout(300);
      await tap(`${ringBox} [data-act="add"]`, "Photo ring: Add from gallery");
      await page.waitForSelector("#picker[open]", { timeout: 4000 });
      await tap("#picker-q", "Picker: search"); await page.keyboard.type("photo-5", { delay: 25 }); await page.waitForTimeout(500);
      const p = await page.evaluate(() => { const d = document.getElementById("picker"), r = d.getBoundingClientRect(); return { n: d.querySelectorAll("#picker-list .adm-tile").length, box: [r.left, r.top, r.right, r.bottom].map(Math.round) }; });
      c.note(JSON.stringify(p));
      c.ok(p.n === 1 && p.box[0] >= 0 && p.box[2] <= 390.5 && p.box[3] <= 845, `picker ${JSON.stringify(p)}`);
      await tap("#picker-list .adm-tile", "Picker: piece tile"); await page.waitForTimeout(400);
      await tap("#picker-close", "Picker: Done"); await page.waitForTimeout(400);
      const names = await ringNames();
      c.ok(names.at(-1) === newIds["photo-5"], `ring last ${names.at(-1)}`);
      await tap(`${ringBox} [data-act="save"]`, "Photo ring: Save");
      await page.waitForFunction((b) => /Saved|refused|changed elsewhere/.test(document.querySelector(`${b} .adm-ring-note`).textContent), ringBox, { timeout: 8000 }).catch(() => {});
      const note = (await page.locator(`${ringBox} .adm-ring-note`).textContent()).trim();
      c.note(`ring note "${note}"`);
      c.ok(/Saved \(not published yet\)/.test(note), `ring note "${note}"`);
      const ring = (await api()).rings.photo;
      c.ok(ring.ids.some((x) => x.includes(key(newIds["photo-5"])) || x.includes(newIds["photo-5"])), `API ring ${JSON.stringify(ring.ids.slice(-3))}`);
      await small(c, ringBox, "U-02");
    });

    await S(14, "to-editor", "get to the editor by taps only (record the path), tap Publish (n): modal lists the pieces and the ring", async (c) => {
      const steps = [];
      c.note(`links on the gallery page: ${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))))}`);
      await page.goBack({ waitUntil: "load" }); steps.push("Gallery > browser Back (the page has no link)");
      await page.waitForURL("**/admin/", { timeout: 8000 }).catch(() => {});
      await tap('a[href="/admin/edit/"]', "Dashboard card: Home"); steps.push("Dashboard > Home card");
      await page.waitForSelector(".ed-publish", { timeout: 15000 });
      await page.waitForFunction(() => /Publish \(\d+\)/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 15000 }).catch(() => {});
      pathToEditor = steps.join(" > ") + " > Publish";
      c.note(`path gallery -> publish: ${steps.length + 1} taps (${pathToEditor})`);
      const lab = await page.locator(".ed-publish").textContent();
      c.ok(/Publish \(\d+\)/.test(lab || ""), `button "${lab}"`);
      c.known("U-04", false, "the gallery page itself has no Publish and no link to the editor: Dashboard first, then Home, then Publish (browser Back, Home card, Publish)");
      await tap(".ed-publish", "Bar: Publish (n)");
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }); await page.waitForTimeout(500);
      const d = await page.evaluate(() => { const dl = document.querySelector(".ed-scrim .ed-dialog"), r = dl.getBoundingClientRect(); return { title: dl.querySelector(".ed-dialog-title")?.textContent, items: [...dl.querySelectorAll("li")].map((l) => l.textContent), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, btns: [...dl.querySelectorAll("button")].map((b) => { const q = b.getBoundingClientRect(); return [b.textContent, Math.round(q.height), q.bottom <= innerHeight]; }) }; });
      c.note(`modal "${d.title}": ${d.items.join(" | ").slice(0, 500)}`);
      c.ok(/^Publish \d+ changes? to the live site\?$/.test(d.title || ""), `title "${d.title}"`);
      c.ok(d.inside && d.btns.every((b) => b[2]), `modal inside ${d.inside}; buttons visible ${JSON.stringify(d.btns)}`);
      c.known("U-39", false, `modal title "${d.title}": the Gallery line is a bare count`);
      c.ok(d.items.some((x) => /ring/i.test(x)), `ring not listed: ${d.items}`);
    });

    await S(15, "publish-all", "tap Publish in the modal: toast with the revision", async (c) => {
      await tap('.ed-scrim button:has-text("Publish")', "Modal: Publish");
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 25000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => "");
      c.note(`toast "${toast}"`);
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(toast || ""), `toast "${toast}"`);
    });
  } catch (e) { check("UC-08 admin part", false, String(e.stack || e)); }

  try {
    await pubStep(16, "pub-library-ar", "PUB(/library) AR: Photo panel shows the 8 photos in the admin order", async (c) => {
      await libOpen("ar"); checkLib(c, await libRead()); await toTile(); await pub.waitForTimeout(500);
    });

    await pubStep(17, "lightbox-photo-8", "tap the first-placed photo: ONE tap opens the lightbox on it, picture inside the screen, Close >= 44 px", async (c) => {
      const sel = `.acc-panel[data-cat="photo"] .lib-grid > .tile:has(img[src*="${newIds[MOVER]}"])`;
      await pub.locator(sel).first().scrollIntoViewIfNeeded();
      const want = await pub.locator(sel + " img").first().getAttribute("data-full");
      await pub.locator(sel).first().tap();
      const open = await pub.waitForSelector(".lb:not([hidden]) .lb-stage img", { timeout: 6000 }).then(() => true, () => false);
      c.ok(open, "one tap did not open the lightbox");
      if (!open) return;
      await pub.waitForTimeout(600);
      const d = await pub.evaluate(() => { const r = document.querySelector(".lb"), cl = r.querySelector(".lb-close").getBoundingClientRect(), im = r.querySelector(".lb-stage img").getBoundingClientRect(); return { src: r.querySelector(".lb-stage img").getAttribute("src"), nat: r.querySelector(".lb-stage img").naturalWidth, count: r.querySelector(".lb-count").textContent, close: [Math.round(cl.width), Math.round(cl.height)], fit: im.left >= 0 && im.right <= innerWidth + 1 && im.bottom <= innerHeight + 1, hs: document.documentElement.scrollWidth - innerWidth }; });
      c.note(JSON.stringify(d) + ` want ${want}`);
      c.ok(d.src === want && d.nat > 0, `lightbox shows ${d.src} vs ${want}`);
      c.ok(/^[\d٠-٩]+ \/ [\d٠-٩]+$/.test(d.count.trim()), `counter "${d.count}"`);
      c.ok(d.fit && d.hs <= 0, `fit ${d.fit} h-scroll ${d.hs}`);
      c.known("U-02", d.close[0] >= 44 && d.close[1] >= 44, `lightbox close ${d.close}`);
      TARGETS.set("Public lightbox: Close", d.close.join("x"));
    });

    await pubStep(18, "pub-library-en", "PUB(/library) EN: same order", async (c) => {
      await libOpen("en"); checkLib(c, await libRead()); await toTile(); await pub.waitForTimeout(500);
    });

    await S(19, "reload-admin", "reload the gallery: summary '0 changed', the saved order and alt are still there", async (c) => {
      await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" }); await waitGallery();
      await tap('#tabs button[data-cat="photo"]', "Gallery tab: Photo"); await page.waitForTimeout(600);
      const s = (await page.locator("#summary").textContent()).trim();
      c.note(`summary "${s}"`);
      c.ok(/, 0 changed and not published$/.test(s), `summary "${s}"`);
      const got = keyList(await runIds()).filter((k) => PHOTOS.includes(k));
      c.ok(JSON.stringify(got) === JSON.stringify(EXP), `admin order ${got.join(",")} vs ${EXP.join(",")}`);
      c.ok((await api()).items.find((x) => x.id === newIds["photo-1"]).alt.en === ALT1.en, "alt of photo-1 lost");
    });

    await pubStep(20, "pub-library-reload", "reload the public /library AR: same order", async (c) => {
      await libOpen("ar"); checkLib(c, await libRead());
    });
    await pubStep(21, "pub-home-reload", "reload the public home AR: hero1 = the fix", (c) => homeHero(c, "ar"));
  } finally { await pubCtx.browser.close(); await browser.close(); }
  const rows = [...TARGETS];
  fs.writeFileSync(path.join(ORCH, "runs", "UC-08-targets.json"), JSON.stringify({ seeded, pathToEditor, targets: Object.fromEntries(rows) }, null, 1));
  console.log("TARGETS (controls tapped, css px): " + rows.map(([k, v]) => `${k} ${v}`).join("; "));
  console.log("SMALL (< 44 on a side): " + rows.filter(([, v]) => v.split("x").some((n) => +n < 44)).map(([k, v]) => `${k} ${v}`).join("; "));
}

let dev;
try {
  const cfg = configs(["node", "x", "--only", "webkit"])[0];
  resetState(); dev = await startDev();
  try { await run(cfg); } finally { stopDev(dev); dev = null; }
} catch (e) { check("UC-08 ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
