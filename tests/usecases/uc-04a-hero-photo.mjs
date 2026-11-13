// UC-04a replace the Home hero film-strip picture with a new photo, publish, check AR + EN on the public page (CASES.md).
// node tests/usecases/uc-04a-hero-photo.mjs [--only edge|webkit]
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, rect, overlaps, checker } from "./lib/look.mjs";

const UC = "UC-04a";
const PHOTO = path.join(ORCH, "media", "hero-photo.jpg");
const SLOT = '[data-es="home.film.1"]';
const ALT_AR = "صورة الغلاف التجريبية", ALT_EN = "Test hero photo";

// LOCAL-ONLY ARTEFACT: the Worker hands out https://media.aliphcreative.com/admin/... URLs, a host that has no copy of a
// file uploaded to the LOCAL R2. Serve those from the local Worker (GET /api/admin/media/<key>, made for exactly this)
// so the pictures can be seen in the shots; every src assertion below still checks the real media.aliphcreative.com URL.
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
  const srcs = () => page.evaluate((s) => [...document.querySelectorAll(s + " img")].map((i) => i.getAttribute("src")), SLOT);
  const film = () => page.evaluate(() => {
    const fr = [...document.querySelectorAll(".film-frame")];
    const vis = fr.map((e) => ({ e, r: e.getBoundingClientRect() })).filter((x) => x.r.right > 0 && x.r.left < innerWidth && x.r.width > 0);
    return { total: fr.length, tagged: fr.filter((e) => e.dataset.es).length, visible: vis.length,
      visibleTagged: vis.filter((x) => x.e.dataset.es).length, firstVis: vis[0] ? { x: Math.round(vis[0].r.x), y: Math.round(vis[0].r.y), w: Math.round(vis[0].r.width), h: Math.round(vis[0].r.height), es: vis[0].e.dataset.es || null, tab: vis[0].e.getAttribute("tabindex") } : null };
  });
  const state = () => page.evaluate(() => ({ chip: document.querySelector(".ed-chip")?.textContent, pub: document.querySelector(".ed-publish")?.textContent, pubDis: document.querySelector(".ed-publish")?.disabled }));
  let SRC0 = null, NEW = null, BOX0 = null, reached = "";
  // open the drawer for home.film.1: the way a boss does (click/tap a visible frame), else the programmatic fallback
  const openSlot = async (c) => {
    const f = await film();
    if (f.firstVis) {
      const x = Math.round(f.firstVis.x + f.firstVis.w / 2), y = Math.round(f.firstVis.y + f.firstVis.h / 2);
      if (cfg.touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
      await page.waitForTimeout(1000);
    }
    const slotNow = async () => (await drawerOpen()) ? await page.locator("#ed-media .ed-panel-page").textContent() : null;
    let got = await slotNow();
    if (got === "home.film.1") { reached = "visible frame"; return true; }
    c.known("U-20", false, `the first visible hero film frame ${got ? "opened the drawer of " + got + ", not of frame 1 (the boss cannot tell which is which)" : "opens nothing"}: ${f.visibleTagged} of ${f.visible} visible frames are editable; ${f.tagged} of ${f.total} frames carry data-es, all in the first group`);
    if (got) { await page.locator("#ed-media .ed-close").click(); await page.waitForTimeout(500); const l = await page.evaluate(() => { const x = document.querySelector(".lb"); return !!x && !x.hidden; }); if (l) { await page.keyboard.press("Escape"); await page.waitForTimeout(500); } }
    await page.evaluate((s) => document.querySelector(s).click(), SLOT); // the editable frame is off screen: reach it from code so the rest of the flow is still proven
    await page.waitForTimeout(800);
    reached = "programmatic click on the off-screen home.film.1";
    return await drawerOpen();
  };
  try {
    await S(1, "editor-open", "hero strip loaded; home.film.1 holder has tabindex 0 + aria-haspopup=dialog; record SRC0", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(4000);
      const h = await page.evaluate((s) => { const e = document.querySelector(s); return e && { tab: e.getAttribute("tabindex"), pop: e.getAttribute("aria-haspopup"), n: document.querySelectorAll(s).length }; }, SLOT);
      c.ok(!!h && h.tab === "0" && h.pop === "dialog", `holder ${JSON.stringify(h)}`);
      SRC0 = (await srcs())[0];
      BOX0 = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.width, r.height]; }, SLOT);
      const f = await film();
      c.note(`SRC0 ${SRC0}; film ${JSON.stringify(f)}`);
      c.ok(!!SRC0, "no src on home.film.1");
      await lookA(page, { touch: false, scope: ".ed-bar" });
    });

    await S(2, "click-frame", "click/tap the first visible film frame -> drawer Picture opens", async (c) => {
      const ok = await openSlot(c);
      c.note(`drawer reached by: ${reached}`);
      c.ok(ok, "drawer #ed-media never opened, even from code");
    });

    await S(3, "drawer", "drawer: title Picture, thumb, alt AR (rtl) + EN, Upload new, Pick from gallery, Back to default disabled; fits the screen", async (c) => {
      if (!(await drawerOpen())) { c.ok(false, "drawer not open"); return; }
      const d = await page.evaluate(() => {
        const dr = document.getElementById("ed-media"), r = dr.getBoundingClientRect();
        const b = (t) => [...dr.querySelectorAll("button")].find((x) => x.textContent.trim() === t);
        return { title: dr.querySelector(".ed-panel-head strong")?.textContent, slot: dr.querySelector(".ed-panel-page")?.textContent,
          arDir: dr.querySelector("#ed-alt-ar")?.dir, upload: !!b("Upload new"), pick: !!b("Pick from gallery"), reset: b("Back to default")?.disabled,
          r: [r.left, r.top, r.right, r.bottom].map(Math.round), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, thumbOk: dr.querySelector(".ed-media-thumb")?.naturalWidth > 0 };
      });
      c.note(JSON.stringify(d));
      c.ok(d.title === "Picture" && d.upload && d.pick && d.reset === true && d.arDir === "rtl", `drawer ${JSON.stringify(d)}`);
      c.ok(d.inside, `drawer outside viewport ${d.r}`);
      c.ok(d.thumbOk, "drawer preview picture not loaded");
      await page.locator("#ed-media .ed-media-thumb").screenshot({ path: "C:/Users/Obaida/AppData/Local/Temp/thumb0-" + cfg.name + ".png" }).catch(() => {});
      const lb = await page.evaluate(() => { const l = document.querySelector(".lb"); return !!l && !l.hidden; });
      c.known("U-25", !lb, "the site's own lightbox opened on top of the page together with the drawer (a click on a hero frame is also a lightbox click): the page, and the change, are hidden behind it");
      const m = await lookA(page, { touch: cfg.touch, scope: "#ed-media" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 hScroll ${m.hScroll} clipped ${m.clipped}`);
      if (cfg.touch) c.known("U-02", !m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
    });

    await S(4, "upload-progress", "Upload new -> hero-photo.jpg: progress bar visible mid-upload, 'Uploading…', buttons locked", async (c) => {
      await page.route("**/api/admin/upload", async (r) => { await new Promise((ok) => setTimeout(ok, 3000)); await r.continue(); }); // keep the upload on screen long enough to look at
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, '#ed-media button:has-text("Upload new")', cfg)]);
      await fc.setFiles(PHOTO);
      const bar = await page.waitForSelector('#ed-media .ed-media-progress:not([hidden])', { timeout: 8000 }).then(() => true, () => false);
      await page.waitForTimeout(500);
      const d = await page.evaluate(() => ({ status: document.querySelector("#ed-media .ed-media-status")?.textContent, now: document.querySelector("#ed-media .ed-media-progress")?.getAttribute("aria-valuenow"),
        up: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Upload new")?.disabled, cancel: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Cancel")?.hidden }));
      c.note(JSON.stringify(d));
      c.ok(bar, "no progress bar");
      c.ok(/Uploading/.test(d.status || "") && d.up === true && d.cancel === false, `states ${JSON.stringify(d)}`);
    });

    await S(5, "upload-done", "ends with 'Uploaded. Saved to the draft.'; holder shows the new picture; box size unchanged; thumb = HERO-PHOTO", async (c) => {
      await page.waitForFunction(() => /Saved to the draft/.test(document.querySelector("#ed-media .ed-media-status")?.textContent || ""), null, { timeout: 25000 }).catch(() => {});
      await page.unroute("**/api/admin/upload");
      const st = await page.locator("#ed-media .ed-media-status").textContent();
      const err = await page.locator("#ed-media .ed-media-uperr").textContent();
      c.ok(/Uploaded\. Saved to the draft\./.test(st || ""), `status "${st}" error "${err}"`);
      const s = await srcs(); NEW = s[0];
      c.note(`NEW ${NEW}; holders ${s.length}`);
      c.ok(!!NEW && NEW !== SRC0 && s.every((x) => x === NEW), `holder srcs ${JSON.stringify(s)}`);
      const box = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.width, r.height]; }, SLOT);
      c.ok(Math.abs(box[0] - BOX0[0]) <= 1 && Math.abs(box[1] - BOX0[1]) <= 1, `frame box ${BOX0} -> ${box}`);
      await page.waitForFunction(() => document.querySelector("#ed-media .ed-media-thumb").naturalWidth > 0, null, { timeout: 5000 }).catch(() => {});
      const th = await page.evaluate(() => { const i = document.querySelector("#ed-media .ed-media-thumb"); return { src: i.getAttribute("src"), nat: [i.naturalWidth, i.naturalHeight] }; });
      c.note(`drawer preview ${JSON.stringify(th)}`);
      c.ok(th.src === NEW && th.nat[0] > 0, `drawer preview picture is ${th.src} (natural ${th.nat}), not the uploaded photo ${NEW}`);
      await page.locator("#ed-media .ed-media-thumb").screenshot({ path: "C:/Users/Obaida/AppData/Local/Temp/thumb-" + cfg.name + ".png" }).catch(() => {});
      const cover = await page.evaluate((s) => getComputedStyle(document.querySelector(s + " img")).objectFit, SLOT);
      c.note(`object-fit ${cover}`);
      c.ok(cover === "cover", `object-fit "${cover}"`);
      // what the boss SEES: the frames on screen are clones of the tagged group; do they show the new picture?
      const seen = await page.evaluate((n) => { const out = []; for (const fr of document.querySelectorAll(".film-frame")) { const r = fr.getBoundingClientRect(); if (r.right > 0 && r.left < innerWidth && fr.dataset.frame === "0") out.push(fr.querySelector("img").getAttribute("src") === n); } return out; }, NEW);
      c.note(`visible clones of frame 1 showing the new photo: ${JSON.stringify(seen)}`);
      c.known("U-21", !seen.length || seen.every(Boolean), "after the upload the on-screen copies of this frame still show the old picture; the page only changes after publish");
    });

    await S(6, "alt-text", "alt AR + EN typed, autosave Saving… -> Saved", async (c) => {
      const ar = page.locator("#ed-alt-ar"), en = page.locator("#ed-alt-en");
      await ar.click(); await ar.fill(ALT_AR); await en.click(); await en.fill(ALT_EN);
      await page.waitForTimeout(300);
      await page.waitForFunction(() => document.querySelector(".ed-chip").textContent === "Saved", null, { timeout: 8000 }).catch(() => {});
      const s = await state();
      c.note(`chip after typing both alts: "${s.chip}"`);
      c.known("U-24", s.chip === "Saved", `chip says "${s.chip}" after the alt texts were typed (they are saved: they survive the reload in step 8); only text edits move it to Saving…/Saved`);
      const dd = await page.evaluate(() => ({ ar: [document.getElementById("ed-alt-ar").dir, getComputedStyle(document.getElementById("ed-alt-ar")).textAlign], en: [document.getElementById("ed-alt-en").dir, getComputedStyle(document.getElementById("ed-alt-en")).textAlign] }));
      c.note(JSON.stringify(dd));
      c.ok(dd.ar[0] === "rtl" && dd.en[0] === "ltr", `A6 dirs ${JSON.stringify(dd)}`);
    });

    await S(7, "close", "drawer closes; Publish shows a count >= 1", async (c) => {
      await tapOrClick(page, '#ed-media .ed-close', cfg);
      await page.waitForTimeout(600);
      c.ok(!(await drawerOpen()), "drawer still open");
      const lb = await page.evaluate(() => { const l = document.querySelector(".lb"); return !!l && !l.hidden; });
      c.known("U-25", !lb, "the lightbox is still open after the drawer closed: the boss must find its own x");
      if (lb) { await page.keyboard.press("Escape"); await page.waitForTimeout(600); }
      await page.waitForFunction(() => /^Publish \(\d+\)$/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 8000 }).catch(() => {});
      const s = await state();
      c.ok(/^Publish \(\d+\)$/.test(s.pub || "") && !s.pubDis, `publish "${s.pub}" disabled ${s.pubDis}`);
      const bh = (await rect(page, ".ed-bar")).h; c.note(`bar ${Math.round(bh)}px`);
      if (cfg.touch) c.known("U-12", bh <= 90, `bar wraps to ${Math.round(bh)}px`);
    });

    await S(8, "api-readback", "server draft row home.film.1 holds the photo and both alt texts", async (c) => {
      const row = await page.evaluate(async () => { const r = await fetch("/api/admin/content"); const d = await r.json(); return (d.slots || {})["home.film.1"] || null; });
      c.note(JSON.stringify(row));
      c.ok(!!row && row.src === NEW, `server src ${row && row.src}`);
      c.ok(!!row && !!row.alt && row.alt.ar === ALT_AR && row.alt.en === ALT_EN, `server alt ${JSON.stringify(row && row.alt)}`);
    });

    await S(9, "reload", "reload editor, reopen: HERO-PHOTO kept, alt fields hold both texts, Back to default enabled", async (c) => {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(4000);
      const s = await srcs();
      c.ok(s[0] === NEW, `after reload src ${s[0]}`);
      if (!(await openSlot(c))) { c.ok(false, "drawer did not reopen"); return; }
      const tAlt = Date.now();
      await page.waitForFunction(() => document.getElementById("ed-alt-ar").value !== "", null, { timeout: 5000 }).catch(() => {});
      c.note(`alt fields filled ${Date.now() - tAlt} ms after the drawer opened`);
      const v = await page.evaluate(() => ({ ar: document.getElementById("ed-alt-ar").value, en: document.getElementById("ed-alt-en").value,
        reset: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Back to default")?.disabled }));
      c.note(JSON.stringify(v));
      c.ok(v.ar === ALT_AR && v.en === ALT_EN, `alt fields ${JSON.stringify(v)}`);
      c.ok(v.reset === false, "Back to default is disabled");
      await tapOrClick(page, '#ed-media .ed-close', cfg);
      await page.waitForTimeout(500);
    });

    await S(10, "publish", "modal names the picture in words; toast revision N", async (c) => {
      const t0 = Date.now();
      await tapOrClick(page, ".ed-publish", cfg);
      const shown = await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }).then(() => true, () => false);
      c.note(`click -> modal ${shown ? Date.now() - t0 + " ms" : "never"}`);
      c.ok(shown, "publish modal missing 15 s after the click");
      if (!shown) return;
      c.known("U-19", Date.now() - t0 <= 2000, "Publish gave no feedback for more than 2 s");
      await page.waitForTimeout(400);
      const d = await page.evaluate(() => { const dl = document.querySelector(".ed-scrim .ed-dialog"); return { items: [...dl.querySelectorAll("li")].map((l) => l.textContent), title: dl.querySelector(".ed-dialog-title")?.textContent }; });
      c.note(JSON.stringify(d));
      c.ok(d.items.length >= 1 && !d.items.some((x) => /home\.film\.1/.test(x)), `modal lines ${JSON.stringify(d.items)} (raw key: ${d.items.some((x) => /home\.film/.test(x))})`);
      c.ok(d.items.some((x) => /hero|film|picture/i.test(x)), `modal line does not say which picture changed: ${JSON.stringify(d.items)}`);
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 10000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => null);
      c.note(`toast "${toast}"`);
      c.ok(/Published\. The live site is now revision \d+\./.test(toast || ""), `toast "${toast}"`);
    });
  } finally { await browser.close(); }

  const pub = await cfg.open();
  await mapMedia(pub.context);
  const pubStep = (n, slug, lang) => step(pub.page, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB(/) ${lang}: every frame-1 clone shows the new photo with the ${lang} alt; SRC0 gone` }, async () => {
    const c = checker(`${cfg.name} ${n}`);
    await pub.page.goto(ORIGIN + "/", { waitUntil: "load" });
    await setLang(pub.page, lang);
    await pub.page.waitForTimeout(3000);
    const d = await pub.page.evaluate(({ old, nu }) => {
      const f0 = [...document.querySelectorAll('.film-frame[data-frame="0"] img')];
      const all = [...document.querySelectorAll(".film-frame img")].map((i) => i.getAttribute("src"));
      return { n0: f0.length, srcs0: [...new Set(f0.map((i) => i.getAttribute("src")))], alts: [...new Set(f0.map((i) => i.getAttribute("alt")))], oldAnywhere: all.filter((s) => s === old).length + [...document.querySelectorAll("img")].filter((i) => i.getAttribute("src") === old).length,
        nuCount: all.filter((s) => s === nu).length, hs: document.documentElement.scrollWidth - innerWidth, bar: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length,
        cover: f0[0] && getComputedStyle(f0[0]).objectFit, nat: f0[0] && [f0[0].naturalWidth, f0[0].naturalHeight] };
    }, { old: SRC0, nu: NEW });
    c.note(JSON.stringify(d));
    c.ok(d.n0 > 0 && d.srcs0.length === 1 && d.srcs0[0] === NEW, `frame-1 srcs ${JSON.stringify(d.srcs0)} (n=${d.n0}) expected ${NEW}`);
    c.ok(d.oldAnywhere === 0, `old picture still used ${d.oldAnywhere}x`);
    c.known("U-23", d.alts.length === 1 && d.alts[0] === (lang === "ar" ? ALT_AR : ALT_EN), `public ${lang} alt of frame 1 is ${JSON.stringify(d.alts)}, not the ${lang} text typed in the drawer`);
    c.ok(d.cover === "cover" && d.nat && d.nat[0] > 0 && d.nat[1] > 0, `object-fit ${d.cover} natural ${d.nat}`);
    c.ok(d.hs <= 0 && d.bar === 0, `h-scroll ${d.hs}, admin artefacts ${d.bar}`);
    // bring a clone of frame 1 into view so the shot shows HERO-PHOTO (the strip travels on its own)
    const seen = await pub.page.waitForFunction(() => [...document.querySelectorAll('.film-frame[data-frame="0"]')].some((f) => { const r = f.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), null, { timeout: 60000 }).then(() => true, () => false);
    c.note(`frame 1 fully in view for the shot: ${seen}`);
    await pub.page.evaluate(() => { const s = document.querySelector("#filmScroll, .film-scroll"); if (s) { const r = s.getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) window.scrollBy(0, r.top + r.height / 2 - innerHeight / 2); } }); // phone: the strip sits at the fold, bring it into the shot
    await pub.page.waitForTimeout(500);
    return c.pass;
  });
  try {
    await pubStep(11, "pub-ar", "ar");
    await pubStep(12, "pub-en", "en");
    const adm = await cfg.open();
    try {
      await step(adm.page, { uc: UC, cfg: cfg.name, n: 13, slug: "reload-dashboard", expect: "Draft changes 0; editor still shows the photo" }, async () => {
        const c = checker(`${cfg.name} 13`);
        await adm.page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
        await adm.page.waitForFunction(() => document.getElementById("changes-n").textContent.trim() !== "–", null, { timeout: 3000 }).catch(() => {});
        c.ok((await adm.page.locator("#changes-n").textContent()).trim() === "0", "draft count not 0 after publish");
        return c.pass;
      });
    } finally { await adm.browser.close(); }
    await pubStep(14, "pub-ar-reload", "ar");
  } finally { await pub.browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-04a ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
