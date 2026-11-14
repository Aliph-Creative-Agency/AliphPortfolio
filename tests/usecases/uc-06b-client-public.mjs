// UC-06b public client views, AR + EN, phone + desktop (CASES.md UC-06b).
// node tests/usecases/uc-06b-client-public.mjs [--only edge|webkit]
// Start state = end of UC-06a: steps 0-3 replay it (upload photo-1..3 + video, create C1, assign, publish) with no reset,
// then the public checks. WebKit ENV LIMIT: blob: video cannot be decoded, the video row is seeded via the app's upload + API.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, checker } from "./lib/look.mjs";

const UC = "UC-06b";
const MEDIA = path.join(ORCH, "media");
const FILES = [1, 2, 3].map((i) => path.join(MEDIA, `photo-${i}.jpg`)).concat(path.join(MEDIA, "video.mp4"));
const PIECES = ["photo-1", "photo-2", "photo-3", "video"];
const C1 = {
  en: "Jabal al-Mukabbir Social Affairs Office", ar: "مكتب الشؤون الاجتماعية في جبل المكبر للتنمية المجتمعية",
  lineEn: "Community programmes", lineAr: "برامج مجتمعية", year: "2025", url: "https://example.org/c1",
};

// LOCAL-ONLY ARTEFACT: uploads get https://media.aliphcreative.com/admin/... URLs the real host does not have locally
async function mapMedia(context) {
  await context.route("https://media.aliphcreative.com/admin/**", async (r) => {
    try { await r.fulfill({ response: await r.fetch({ url: ORIGIN + "/api/admin/media/" + new URL(r.request().url()).pathname.slice(1) }) }); } catch { await r.abort().catch(() => {}); }
  });
}

async function run(cfg) {
  startRun(UC, cfg.name);
  const { browser, page, context } = await cfg.open();
  await mapMedia(context);
  const S = (n, slug, expect, fn) => step(page, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const api = (p = "gallery") => page.evaluate(async (p) => (await (await fetch("/api/admin/" + p)).json()), p);
  const adminOpen = async () => { await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" }); await page.waitForFunction(() => /items,/.test(document.getElementById("summary").textContent), null, { timeout: 15000 }); await page.waitForTimeout(900); };
  const key = (id) => id.replace(/^[a-z0-9]+-/, "");
  const newIds = {};
  let c1 = null;

  // ---- public helpers -------------------------------------------------------------------------------------------
  const url = (q = "") => ORIGIN + "/library" + q;
  const pubGo = async (q, lang) => {
    await page.goto(url(q), { waitUntil: "load" }); await setLang(page, lang); await page.waitForTimeout(1200);
    await page.waitForSelector(".acc-panel", { timeout: 10000 });
    // open the Photo panel so the tiles are laid out and loaded (collapsed panels are 0-width spines)
    if ((await page.locator('.acc-panel[data-cat="photo"].open').count()) === 0) { await tapOrClick(page, '.acc-panel[data-cat="photo"] .spine', cfg); await page.waitForTimeout(900); }
    const n = await page.locator(".acc-panel .tile").count();
    for (let i = 0; i < n; i++) { await page.locator(".acc-panel .tile").nth(i).scrollIntoViewIfNeeded().catch(() => {}); if (i % 4 === 0) await page.waitForTimeout(50); }
    await page.waitForFunction(() => [...document.querySelectorAll(".acc-panel.open .tile img")].every((m) => m.complete && m.naturalWidth > 0), null, { timeout: 8000 }).catch(() => {});
  };
  const tiles = (panel = "photo") => page.evaluate(({ ids, panel }) => [...document.querySelectorAll(`.acc-panel[data-cat="${panel}"] .tile`)].map((t) => {
    const img = t.querySelector("img"), cap = t.querySelector(".t-client");
    const mine = Object.keys(ids).find((k) => (t.dataset.film || "").includes(ids[k]) || (img?.getAttribute("src") || "").includes(ids[k]));
    const tr = t.getBoundingClientRect(), cr = cap?.getBoundingClientRect();
    return { k: mine || null, cap: cap ? cap.textContent : null, capClip: cap ? cap.scrollWidth > cap.clientWidth + 1 : false, capOut: cap ? cr.right > tr.right + 1 || cr.left < tr.left - 1 : false, capLines: cap ? Math.round(cr.height / parseFloat(getComputedStyle(cap).lineHeight || 1)) : 0, capFont: cap ? getComputedStyle(cap).fontSize : null, w: Math.round(tr.width), shown: tr.width > 0 && tr.height > 0 };
  }), { ids: newIds, panel });
  const idx = () => page.evaluate(() => {
    const s = document.querySelector(".lib-clients"); if (!s) return null;
    const li = [...s.querySelectorAll(".lc-list li")];
    const nameEl = s.querySelector(".lc-name"), a = s.querySelector(".lc-list a");
    return { n: li.length, head: s.querySelector(".lc-head")?.innerText.replace(/\s+/g, " ").trim(), mono: s.querySelector(".lc-mono")?.textContent, name: nameEl?.textContent, nameDir: getComputedStyle(nameEl).direction, line: s.querySelector(".lc-line")?.textContent, meta: s.querySelector(".lc-meta")?.innerText.replace(/\s+/g, " ").trim(), href: a?.getAttribute("href"), lines: Math.round(nameEl.getBoundingClientRect().height / parseFloat(getComputedStyle(nameEl).lineHeight)), font: getComputedStyle(nameEl).fontSize, top: Math.round(s.getBoundingClientRect().top + scrollY), hs: document.documentElement.scrollWidth - innerWidth, label: s.getAttribute("aria-label") };
  });
  const header = () => page.evaluate(() => {
    const s = document.querySelector(".lib-client"); if (!s) return null;
    const nm = s.querySelector(".ch-name"), v = s.querySelector(".ch-meta a"), back = s.querySelector(".ch-back"), sp = s.querySelector(".ch-meta span");
    const cs = (e) => e && { color: getComputedStyle(e).color, deco: getComputedStyle(e).textDecorationLine, size: getComputedStyle(e).fontSize };
    return { name: nm.textContent, dir: getComputedStyle(nm).direction, line: s.querySelector(".ch-line")?.textContent, meta: s.querySelector(".ch-meta").innerText.replace(/\s+/g, " ").trim(), href: v?.getAttribute("href"), target: v?.getAttribute("target"), rel: v?.getAttribute("rel"), back: back?.textContent, backHref: back?.getAttribute("href"), empty: !!s.querySelector(".ch-empty"), mono: s.querySelector(".lc-mono")?.textContent, lines: Math.round(nm.getBoundingClientRect().height / parseFloat(getComputedStyle(nm).lineHeight)), nmFont: getComputedStyle(nm).fontSize, linkCss: cs(v), metaCss: cs(sp), backCss: cs(back), linkRect: v && (({ width, height }) => [Math.round(width), Math.round(height)])(v.getBoundingClientRect()), backRect: (({ width, height }) => [Math.round(width), Math.round(height)])(back.getBoundingClientRect()), hs: document.documentElement.scrollWidth - innerWidth };
  });
  const lookPub = async (c, scope) => { const m = await lookA(page, { touch: false, scope }); c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 ${scope}: hScroll ${m.hScroll} clipped ${m.clipped}`); };
  const L = (l) => (l === "ar" ? { name: C1.ar, line: C1.lineAr } : { name: C1.en, line: C1.lineEn });

  try {
    await S(0, "setup-c1-published", "Setup = UC-06a replayed: 4 pieces uploaded, C1 created, assigned, published (not under test)", async (c) => {
      await adminOpen();
      const j0 = await api(); const ids0 = new Set(j0.items.map((x) => x.id));
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      const sub = (await page.evaluate(() => [...document.querySelectorAll("#add-sub option")].map((o) => o.value))).find(Boolean);
      await page.locator("#add-sub").selectOption(sub); await page.waitForTimeout(300);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, "#add-zone", cfg)]);
      await fc.setFiles(FILES); await page.waitForTimeout(800);
      await tapOrClick(page, "#add-go", cfg);
      await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length === 4 && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, null, { timeout: 120000 });
      const bad = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].filter((r) => r.dataset.status !== "done").map((r) => [r.querySelector(".adm-rname").textContent, r.querySelector(".adm-rmsg").textContent]));
      if (cfg.name === "webkit" && bad.length === 1 && /video/.test(bad[0][0]) && /could not be read/.test(bad[0][1])) {
        const r = await page.evaluate(async ({ bytes, posterB, sub }) => {
          const M = await import("/admin/shared/media.js");
          const film = await M.upload(new File([Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))], "video.mp4", { type: "video/mp4" }), "video.mp4", {});
          const pb = await (await fetch("data:image/jpeg;base64," + posterB)).blob();
          const poster = await M.upload(pb, "poster", { posterFor: film.key });
          const put = await fetch("/api/admin/gallery/" + encodeURIComponent(film.id), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: film.url, poster: poster.url, ratio: 1.778, date: "2026-11", cat: "photo", sub, baseRev: 0 }) });
          return { status: put.status, id: film.id };
        }, { bytes: fs.readFileSync(path.join(MEDIA, "video.mp4")).toString("base64"), posterB: fs.readFileSync(path.join(MEDIA, "photo-1.jpg")).toString("base64"), sub });
        c.note("ENV LIMIT: webkit cannot decode video; seeded through app upload + API " + JSON.stringify(r)); c.ok(r.status === 200, "seeding failed");
      } else c.ok(bad.length === 0, `rows failed ${JSON.stringify(bad)}`);
      await page.waitForTimeout(1200);
      await adminOpen();
      const fresh = (await api()).items.filter((x) => !ids0.has(x.id));
      fresh.forEach((x) => { newIds[key(x.id)] = x.id; });
      c.ok(fresh.length === 4 && PIECES.every((k) => newIds[k]), `new keys ${Object.keys(newIds)}`);
    });

    await S(1, "setup-client-assign", "Setup: C1 added and its 4 pieces assigned through the Clients panel and Select pieces", async (c) => {
      await tapOrClick(page, '#tabs button[data-cat="photo"]', cfg); await page.waitForTimeout(600);
      await page.locator("#clients").scrollIntoViewIfNeeded();
      await tapOrClick(page, "#clients-new", cfg); await page.waitForSelector(".adm-cform", { timeout: 4000 });
      const f = (n) => page.locator(`#clients-form input[name="${n}"]`);
      await f("name.en").fill(C1.en); await f("name.ar").fill(C1.ar); await f("line.en").fill(C1.lineEn); await f("line.ar").fill(C1.lineAr); await f("year").fill(C1.year); await f("url").fill(C1.url);
      await tapOrClick(page, '.adm-cform button[type="submit"]', cfg);
      await page.waitForFunction(() => /Added/.test(document.getElementById("clients-note").textContent), null, { timeout: 8000 });
      c1 = (await api("clients")).clients[0];
      c.ok(!!c1, "client not created");
      await page.locator("#select-toggle").scrollIntoViewIfNeeded(); await tapOrClick(page, "#select-toggle", cfg); await page.waitForTimeout(500);
      for (const k of PIECES) { const t = `.adm-tile[data-id="${newIds[k]}"]`; await page.locator(t).first().scrollIntoViewIfNeeded(); await tapOrClick(page, t, cfg); await page.waitForTimeout(250); }
      await page.locator("#assign-client").selectOption(c1.id); await page.waitForTimeout(300);
      await tapOrClick(page, "#assign-go", cfg);
      await page.waitForFunction(() => /Assigned/.test(document.getElementById("assign-note").textContent), null, { timeout: 8000 });
      const j = await api();
      c.ok(PIECES.every((k) => { const it = j.items.find((x) => x.id === newIds[k]); return (it.own?.client ?? it.client) === c1.id; }), "assignment not on all 4");
      c.note(`C1 id ${c1.id}`);
    });

    await S(2, "setup-publish", "Setup: editor Publish -> toast", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-publish", { timeout: 15000 });
      await page.waitForFunction(() => /Publish \(\d+\)/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 15000 }).catch(() => {});
      await tapOrClick(page, ".ed-publish", cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }); await page.waitForTimeout(500);
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 20000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => "");
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(toast || ""), `toast "${toast}"`);
    });

    // 1 + 2: tile captions in /library
    for (const [n, lang] of [[3, "ar"], [4, "en"]]) {
      await S(n, `pub-library-${lang}`, `PUB ${lang}: /library tiles of photo-1/2/3/video carry the caption = C1 name in ${lang}; no other tile has one; caption fits its tile`, async (c) => {
        await pubGo("", lang);
        const t = await tiles();
        const caps = t.filter((x) => x.cap !== null);
        c.note(`${t.length} tiles, ${caps.length} with a caption: ${JSON.stringify(caps.map((x) => [x.k, x.cap, x.capLines, x.capFont, x.w]))}`);
        c.ok(caps.length === 4 && PIECES.every((k) => caps.some((x) => x.k === k)), `captioned tiles: ${JSON.stringify(caps.map((x) => x.k))}`);
        c.ok(caps.every((x) => x.cap === L(lang).name), `caption text ${JSON.stringify(caps.map((x) => x.cap))}`);
        c.ok(!t.some((x) => x.cap !== null && !x.k), "a tile that is not assigned carries a caption");
        c.ok(caps.every((x) => !x.capClip && !x.capOut), `caption clipped/outside tile ${JSON.stringify(caps.filter((x) => x.capClip || x.capOut).map((x) => x.k))}`);
        const maxLines = Math.max(...caps.map((x) => x.capLines));
        c.note(`max caption lines ${maxLines}, tile width ${caps[0].w}`);
        c.known("U-48", maxLines <= 3, `the caption wraps to ${maxLines} lines under a ${caps[0].w}px tile (name shares the line with the date)`);
        const first = page.locator(`.acc-panel[data-cat="photo"] .tile:has(.t-client)`).first();
        await first.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
        await lookPub(c, ".acc-panel.open");
      });
    }

    // 3 + 4: Clients index
    for (const [n, lang] of [[5, "ar"], [6, "en"]]) {
      await S(n, `pub-index-${lang}`, `PUB ${lang}: Clients index lists C1 once: monogram, name, line, year, count 4; name at most 2 lines, nothing clipped`, async (c) => {
        await pubGo("", lang);
        const d = await idx();
        c.note(JSON.stringify(d));
        c.ok(d && d.n === 1, `index rows ${d && d.n}`);
        if (!d) return;
        c.ok(d.name === L(lang).name && d.line === L(lang).line, `name/line ${d.name} / ${d.line}`);
        c.ok(d.mono === Array.from(L(lang).name)[0], `monogram "${d.mono}"`);
        c.ok(/2025|٢٠٢٥/.test(d.meta) && /4|٤/.test(d.meta), `meta "${d.meta}"`);
        c.ok(d.lines <= 2, `name wraps to ${d.lines} lines`);
        c.ok(d.href === "/library?client=" + encodeURIComponent(c1.id), `href ${d.href}`);
        c.ok(d.hs <= 0, `hScroll ${d.hs}`);
        const pn = await page.evaluate(() => ({ open: [...document.querySelectorAll(".acc-panel.open")].map((p) => p.dataset.cat), blank: [...document.querySelectorAll(".acc-panel.open")].map((p) => { const r = p.getBoundingClientRect(), t = p.querySelector(".tile"); const tr = t && t.getBoundingClientRect(); return [p.dataset.cat, Math.round(r.top + scrollY), Math.round(r.height), t ? Math.round(tr.top + scrollY) : null]; }) }));
        c.note(`open panels ${JSON.stringify(pn)}`);
        const closed = await page.evaluate(() => [...document.querySelectorAll(".acc-panel:not(.open)")].map((p) => Math.round(p.getBoundingClientRect().height)));
        c.note(`closed panel heights ${JSON.stringify(closed)}`);
        if (cfg.touch) c.known("U-49", closed.every((h) => h <= 140), `closed library sections are ${closed} px tall: a title and then blank space`);
        await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
        await lookPub(c, ".lib-clients");
      });
    }

    // 5 + 6: the client view AR (click through from the index)
    await S(7, "pub-client-view-ar", "PUB ar: click C1 in the index -> /library?client=<id>, header with name, line, year, website, back link; exactly the 4 pieces", async (c) => {
      await pubGo("", "ar");
      await page.locator(".lib-clients .lc-list a").first().scrollIntoViewIfNeeded();
      await tapOrClick(page, ".lib-clients .lc-list a", cfg);
      await page.waitForSelector(".lib-client", { timeout: 8000 }); await page.waitForTimeout(1500);
      c.ok(new URL(page.url()).search === "?client=" + c1.id, `url ${page.url()}`);
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "07a-landing.png"), scale: "css" });
      const h = await header();
      c.note(JSON.stringify(h));
      c.ok(h && h.name === C1.ar && h.line === C1.lineAr, `header ${h && h.name}`);
      c.ok(h && /2025|٢٠٢٥/.test(h.meta) && /4|٤/.test(h.meta), `meta "${h && h.meta}"`);
      c.ok(h && h.href === C1.url, `website href ${h && h.href}`);
      c.note(`website link target=${h && h.target} rel=${h && h.rel}; looks like a link: colour ${JSON.stringify(h && h.linkCss)} vs plain meta ${JSON.stringify(h && h.metaCss)}`);
      c.ok(h && h.backHref === "/library" && /^→/.test(h.back), `back link "${h && h.back}" -> ${h && h.backHref}`);
      c.ok(h && h.lines <= 2 && h.hs <= 0, `name lines ${h && h.lines}, hScroll ${h && h.hs}`);
      await pubGo("?client=" + encodeURIComponent(c1.id), "ar"); // reload-safe: fresh load of the same URL
      const t = await tiles(); const tAll = await tiles("all");
      c.note(`All panel in the client view: ${tAll.length} tiles ${JSON.stringify(tAll.map((x) => x.k))}`);
      c.ok(tAll.length === 4, `All panel shows ${tAll.length} tiles`);
      const mine = t.filter((x) => x.k);
      c.note(`client view: ${t.length} tiles in DOM: ${JSON.stringify(t.map((x) => x.k))}`);
      c.ok(t.length === 4 && PIECES.every((k) => mine.some((x) => x.k === k)), `tiles ${JSON.stringify(t.map((x) => x.k))}`);
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
      await lookPub(c, ".lib-client");
      if (cfg.touch) { const hh = await header(); c.note(`touch target sizes (css px): website ${hh.linkRect}, back ${hh.backRect}`); c.known("U-02", hh.linkRect[1] >= 44 && hh.backRect[1] >= 44, `public client header links under 44 px high: website ${hh.linkRect}, back ${hh.backRect}`); }
    });

    // 7: back to the archive
    await S(8, "pub-back-ar", "PUB ar: Back to the archive -> /library without ?client, full archive, Clients index back", async (c) => {
      await page.evaluate(() => scrollTo(0, 0));
      await tapOrClick(page, ".lib-client .ch-back", cfg);
      await page.waitForFunction(() => !location.search.includes("client="), null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1800);
      const q = new URL(page.url()).search;
      const n = await page.locator(".tile").count();
      const hasIdx = await page.locator(".lib-clients").count();
      c.note(`url ${page.url()} tiles ${n} index ${hasIdx} header ${await page.locator(".lib-client").count()}`);
      c.ok(q === "" && n > 4 && hasIdx === 1 && (await page.locator(".lib-client").count()) === 0, `back ended with ?${q}, ${n} tiles, index ${hasIdx}`);
    });

    // 8: unknown client ids
    for (const [n, lang] of [[9, "ar"], [10, "en"]]) {
      await S(n, `pub-unknown-${lang}`, `PUB ${lang}: ?client=does-not-exist and ?client=constructor show the normal archive, no header, no error`, async (c) => {
        for (const q of ["does-not-exist", "constructor"]) {
          await pubGo("?client=" + q, lang);
          const d = await page.evaluate(() => ({ header: document.querySelectorAll(".lib-client").length, idx: document.querySelectorAll(".lib-clients").length, tiles: document.querySelectorAll(".tile").length, hs: document.documentElement.scrollWidth - innerWidth }));
          c.note(`?client=${q}: ${JSON.stringify(d)}`);
          c.ok(d.header === 0 && d.idx === 1 && d.tiles > 4 && d.hs <= 0, `${q}: ${JSON.stringify(d)}`);
        }
      });
    }

    // 9: client view in EN after a reload
    await S(11, "pub-client-view-en", "PUB en: reload /library?client=<id> in EN -> header EN name/line/year/website/back, exactly the 4 pieces with EN captions", async (c) => {
      await pubGo("?client=" + encodeURIComponent(c1.id), "en");
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
      const h = await header();
      c.note(JSON.stringify(h));
      c.ok(h && h.name === C1.en && h.line === C1.lineEn, `header ${h && h.name}`);
      c.ok(h && /Since 2025/.test(h.meta) && /4 pieces/.test(h.meta), `meta "${h && h.meta}"`);
      c.ok(h && h.href === C1.url && /^←/.test(h.back), `href ${h && h.href} back "${h && h.back}"`);
      c.ok(h && h.lines <= 2 && h.hs <= 0, `name lines ${h && h.lines}, hScroll ${h && h.hs}`);
      const t = await tiles();
      c.ok(t.length === 4 && PIECES.every((k) => t.some((x) => x.k === k)), `tiles ${JSON.stringify(t.map((x) => x.k))}`);
      c.ok(t.every((x) => x.cap === C1.en), `captions ${JSON.stringify(t.map((x) => x.cap))}`);
      await lookPub(c, ".lib-client");
    });
  } finally { await browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-06b ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
