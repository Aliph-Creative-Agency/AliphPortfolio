// UC-09a upload mistakes: wrong file types, a 310 MB film, the network dropping mid-upload (CASES.md UC-09a).
// node tests/usecases/uc-09a-upload-mistakes.mjs [--only edge|webkit]
// Every message the boss is shown is quoted into runs/UC-09a-<cfg>-messages.json (and printed as "note MSG").
// ENV LIMIT (webkit): the Playwright WebKit build here cannot decode a blob: video, so the 310 MB film ends "could not be read"
// at once in WebKit; the size/multipart behaviour is judged from Edge only. Real iPhone Safari: verify by hand.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, checker } from "./lib/look.mjs";
import { bigVideo, rmBig } from "./lib/media.mjs";

const UC = "UC-09a";
const MEDIA = path.join(ORCH, "media");
const M = (f) => path.join(MEDIA, f);

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
  const msgs = {};
  const quote = (k, v) => { msgs[k] = v; console.log(`   note MSG ${cfg.name} ${k}: ${JSON.stringify(v)}`); fs.writeFileSync(path.join(ORCH, "runs", `${UC}-${cfg.name}-messages.json`), JSON.stringify(msgs, null, 1)); };
  const S = (n, slug, expect, fn) => step(page, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const api = () => page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()));
  const open = async () => { await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" }); await page.waitForFunction(() => /items,/.test(document.getElementById("summary").textContent), null, { timeout: 15000 }); await page.waitForTimeout(800); };
  const rowsNow = () => page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].map((r) => ({ name: r.querySelector(".adm-rname").textContent, status: r.dataset.status, msg: r.querySelector(".adm-rmsg").textContent, btns: [...r.querySelectorAll("button")].map((b) => b.textContent.trim()), cs: getComputedStyle(r.querySelector(".adm-rmsg")).color, bg: getComputedStyle(r).backgroundColor, bl: getComputedStyle(r).borderLeftWidth + " " + getComputedStyle(r).borderLeftColor })));
  const stage = async (files) => {
    const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, "#add-zone", cfg)]);
    await fc.setFiles(files); await page.waitForTimeout(700);
  };
  const settled = (n, ms = 90000) => page.waitForFunction((n) => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length >= n && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, n, { timeout: ms });
  const closeDrawer = async () => { if ((await page.locator("#drawer[open]").count()) === 0) return; await tapOrClick(page, "#drawer-close", cfg); await page.waitForTimeout(500); };
  const HERO1 = '.hero-title [data-i18n="hero1"]';
  const draft = () => page.evaluate(async () => JSON.stringify(await (await fetch("/api/content?state=draft")).json()));
  let ids0 = new Set(), keepId = null, AR0 = null, big = null, nBeforeOffline = 0;

  const pubCtx = await cfg.open(); await mapMedia(pubCtx.context);
  const pubCount = async (lang) => { const p = pubCtx.page; await p.goto(ORIGIN + "/library", { waitUntil: "load" }); await setLang(p, lang); await p.waitForTimeout(1500); return p.evaluate(() => ({ n: document.querySelectorAll(".lib-grid > *").length, mine: [...document.querySelectorAll(".lib-grid img, .lib-grid video")].filter((i) => /photo-[1-8]|\/admin\//.test(i.getAttribute("src") || i.getAttribute("data-preview") || "")).length, hs: document.documentElement.scrollWidth - innerWidth })); };
  const pubBase = { ar: await pubCount("ar"), en: await pubCount("en") };

  try {
    await S(1, "upload-photo-1", "photo-1 uploaded as Photo, alt EN 'keep me' saved with Save details", async (c) => {
      await open();
      ids0 = new Set((await api()).items.map((x) => x.id));
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      await stage(M("photo-1.jpg"));
      await tapOrClick(page, "#add-go", cfg);
      await settled(1);
      const r = await rowsNow();
      c.ok(r[0].status === "done", `row ${JSON.stringify(r)}`);
      await page.waitForTimeout(1200);
      keepId = (await api()).items.find((x) => !ids0.has(x.id))?.id;
      c.ok(!!keepId, "no new item");
      await tapOrClick(page, '#tabs button[data-cat="photo"]', cfg); await page.waitForTimeout(600);
      await page.locator(`.adm-tile[data-id="${keepId}"]`).first().scrollIntoViewIfNeeded().catch(() => {});
      await tapOrClick(page, `.adm-tile[data-id="${keepId}"]`, cfg);
      await page.waitForSelector("#drawer[open] #d-save", { timeout: 6000 }); await page.waitForTimeout(400);
      await page.locator("#d-alt-en").fill("keep me");
      await tapOrClick(page, "#d-save", cfg);
      await page.waitForFunction(() => /Saved|refused|failed|Not saved/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 }).catch(() => {});
      const m = (await page.locator("#drawer-msg").textContent() || "").trim();
      c.note(`save message "${m}"`);
      c.ok(/Saved/.test(m), `message "${m}"`);
      await closeDrawer();
    });

    await S(2, "bad-batch", "fake.jpg + doc.pdf + photo.heic + photo-2.jpg in one batch: photo-2 added, 3 bad rows each with a reason; batch does not stop", async (c) => {
      await stage([M("fake.jpg"), M("doc.pdf"), M("photo.heic"), M("photo-2.jpg")]);
      const staged = await rowsNow();
      c.note("staged rows " + JSON.stringify(staged.map((r) => [r.name, r.status, r.msg])));
      const preBad = staged.filter((r) => r.status === "error").map((r) => r.name);
      quote("pdf+heic refused when chosen (before Upload)", staged.filter((r) => r.status === "error").map((r) => `${r.name}: ${r.msg}`));
      const goDis = await page.evaluate(() => [document.getElementById("add-go").disabled, document.getElementById("add-go").textContent]);
      c.note("Upload button " + JSON.stringify(goDis));
      const rdy = staged.filter((r) => r.status === "ready").length;
      c.ok(rdy >= 1 && !goDis[0], `ready ${rdy}, button ${JSON.stringify(goDis)}`);
      await tapOrClick(page, "#add-go", cfg);
      await settled(staged.length);
      const end = await rowsNow();
      quote("batch end rows", end.map((r) => `${r.name} [${r.status}] ${r.msg}`));
      c.ok(end.find((r) => /photo-2/.test(r.name))?.status === "done", `photo-2 row ${JSON.stringify(end)}`);
      const bad = end.filter((r) => r.status === "error");
      c.ok(bad.length === 3, `${bad.length} bad rows, expected 3: ${JSON.stringify(end.map((r) => [r.name, r.status]))}`);
      c.ok(bad.every((r) => r.msg && r.msg.length > 8), "a bad row has no reason");
      const nonVisual = bad.filter((r) => r.bl.startsWith("0px") && r.bg === end.find((x) => x.status === "done").bg);
      c.known("U-60", nonVisual.length === 0, `failed rows differ from good rows only by an empty progress bar and red-brown message text: no icon, no border, no background (border ${bad[0].bl}, bg ${bad[0].bg} = good row bg ${end.find((x) => x.status === "done").bg}, text ${bad[0].cs})`);
      c.known("U-61", bad.some((r) => /Remove|Retry|Try/i.test(r.btns.join())), `a failed row offers no Remove or Retry button (buttons ${JSON.stringify(bad.map((r) => r.btns))}); the boss must reload the page to clear it`);
      const wording = bad.map((r) => r.msg);
      c.known("U-62", !wording.some((m) => /could not be read \(is it a format/.test(m)) , `jargon "is it a format the browser decodes?" in "${wording.find((m) => /decodes/.test(m)) || ""}": a text file renamed .jpg is told about a browser, not that the file is not really a picture; the .pdf and .heic say only "That file type is not accepted." without listing what IS accepted`);
      await lookA(page, { touch: cfg.touch, scope: "#add-rows" });
    });

    await S(3, "editor-pdf", "editor hero frame drawer -> Upload new -> doc.pdf: a clear message", async (c) => {
      await closeDrawer();
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(3500);
      await page.evaluate(() => document.querySelector('[data-es="home.film.1"]').click());
      await page.waitForSelector("#ed-media:not([hidden])", { timeout: 6000 });
      await page.waitForTimeout(500);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, '#ed-media button:has-text("Upload new")', cfg)]);
      await fc.setFiles(M("doc.pdf"));
      await page.waitForFunction(() => (document.querySelector("#ed-media .ed-media-uperr")?.textContent || "").trim() || /Saved/.test(document.querySelector("#ed-media .ed-media-status")?.textContent || ""), null, { timeout: 12000 }).catch(() => {});
      const d = await page.evaluate(() => ({ err: document.querySelector("#ed-media .ed-media-uperr")?.textContent.trim(), status: document.querySelector("#ed-media .ed-media-status")?.textContent.trim(), up: [...document.querySelectorAll("#ed-media button")].find((b) => b.textContent.trim() === "Upload new")?.disabled }));
      quote("editor Upload new + doc.pdf", d);
      c.ok(!!d.err && /not supported|not accepted|could not be read/i.test(d.err), `message ${JSON.stringify(d)}`);
      c.ok(d.up === false, "Upload new stays locked after the refusal");
      c.known("U-63", /^That file type is not accepted\. Use a JPEG/.test(d.err || ""), `the editor says "${d.err}" while the gallery says "That file type is not accepted." for the same file: two wordings, only one lists the accepted formats`);
      await lookA(page, { touch: cfg.touch, scope: "#ed-media" });
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "03a-pdf-message.png"), scale: "css" }).catch(() => {});
      await tapOrClick(page, "#ed-media .ed-close", cfg); await page.waitForTimeout(500);
    });

    await S(4, "big-video", "gallery: 310 MB film -> Upload: accepted with moving progress and finishes, or refused at once naming the limit", async (c) => {
      await open();
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      big = bigVideo();
      c.note(`big file ${big} ${Math.round(fs.statSync(big).size / 1048576)} MB`);
      const t0 = Date.now();
      await stage(big);
      const staged = await rowsNow();
      c.note("staged " + JSON.stringify(staged.map((r) => [r.name, r.status, r.msg])));
      await tapOrClick(page, "#add-go", cfg);
      const seen = [];
      let firstEnd = null;
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(2000);
        const s = await page.evaluate(() => { const r = document.querySelector("#add-rows .adm-row"); return r && { st: r.dataset.status, msg: r.querySelector(".adm-rmsg").textContent, pct: r.querySelector("progress")?.value }; });
        if (s) { if (!seen.length || JSON.stringify(seen[seen.length - 1][1]) !== JSON.stringify(s)) seen.push([Math.round((Date.now() - t0) / 1000), s]); }
        if (s && (s.st === "done" || s.st === "error")) { firstEnd = Math.round((Date.now() - t0) / 1000); break; }
        if (i === 4 && s && s.st === "uploading") { fs.mkdirSync(path.join(ORCH, "shots", UC, cfg.name), { recursive: true }); await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "04a-mid-big-upload.png"), scale: "css" }); }
      }
      c.note("progress timeline (s, state) " + JSON.stringify(seen.slice(0, 14)));
      const end = (await rowsNow())[0];
      quote(`310 MB film (${firstEnd}s after choosing)`, { status: end && end.status, msg: end && end.msg, timeline: seen.slice(0, 14) });
      c.ok(!!end && (end.status === "done" || end.status === "error"), `never settled after 240 s: ${JSON.stringify(end)}`);
      const pcts = seen.map((x) => x[1].pct).filter((p) => typeof p === "number");
      const moving = new Set(pcts).size > 2;
      if (end && end.status === "done") {
        c.known("U-64", moving, `a 310 MB upload shows a bar that does not move: progress values seen ${JSON.stringify([...new Set(pcts)].slice(0, 8))}`);
        quote("310 MB result", "accepted and finished; the app states no size limit anywhere before the upload");
      } else if (end) {
        c.note(`refused/failed after ${firstEnd}s with "${end.msg}"`);
        if (cfg.name === "webkit") c.note("ENV LIMIT: WebKit here cannot decode video, the row fails on the poster before any bytes are sent");
        else c.known("U-65", firstEnd <= 15 && /\d+ ?MB/i.test(end.msg), `the 310 MB film was refused after ${firstEnd}s (server 413 "video over 300 MB" on POST /api/admin/upload/mpu) but the boss reads "${end.msg}": the 300 MB limit is not named and nothing on the page states it beforehand`);
      }
      await lookA(page, { touch: cfg.touch, scope: "#add-rows" });
      if (big) rmBig(big);
      c.ok(!fs.existsSync(big), "temp big file not deleted");
    });

    await S(5, "offline-mid-upload", "photo-2 again, network drops at ~1 s: a network message within 10 s (not a spinner forever); no half-made tile", async (c) => {
      await open();
      const before = (await api()).items.length; nBeforeOffline = before;
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      await stage(M("photo-2.jpg"));
      const perr = []; const onPe = (e) => perr.push(e.message); page.on("pageerror", onPe);
      await page.route("**/api/admin/upload", async (r) => { await new Promise((ok) => setTimeout(ok, 3000)); try { await r.continue(); } catch { await r.abort("internetdisconnected").catch(() => {}); } });
      await tapOrClick(page, "#add-go", cfg);
      await page.waitForFunction(() => document.querySelector('#add-rows .adm-row[data-status="uploading"]'), null, { timeout: 10000 });
      await page.waitForTimeout(900);
      await context.setOffline(true);
      const t0 = Date.now();
      const got = await page.waitForFunction(() => document.querySelector('#add-rows .adm-row[data-status="error"]'), null, { timeout: 20000 }).then(() => true, () => false);
      const dt = Date.now() - t0;
      const r = (await rowsNow())[0];
      quote("network dropped mid-upload (gallery)", { afterMs: dt, row: r });
      c.ok(got, `no error row 20 s after the network dropped; row ${JSON.stringify(r)}`);
      c.ok(got && dt <= 10000, `message took ${dt} ms`);
      if (got) c.known("U-66", /offline|connection|internet/i.test(r.msg), `network drop is told as "${r.msg}" (does not say you are offline / check the Wi-Fi, and offers no button: ${JSON.stringify(r.btns)})`);
      await page.waitForTimeout(1500); page.off("pageerror", onPe);
      c.known("U-68", perr.length === 0, `after the failed upload the page throws an uncaught "${perr[0]}" (gallery refresh after the batch is not guarded when offline), and the row's progress bar is left at ${await page.evaluate(() => document.querySelector("#add-rows progress")?.value)}% beside the error`);
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "05a-network-error.png"), scale: "css" }).catch(() => {});
      await context.setOffline(false);
      await page.unroute("**/api/admin/upload");
      await page.waitForTimeout(500);
      await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1200);
      const after = (await api()).items.length;
      c.ok(after === before, `a failed upload left ${after - before} item(s) behind (half-made piece)`);
    });

    await S(6, "retry-online", "back online, retry as the UI says (choose the file again): finishes, exactly one new tile, no duplicate", async (c) => {
      await open();
      const before = (await api()).items.length;
      c.note(`items before retry ${before}; the failed row is gone after the reload, there is no Retry button to press`);
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      await stage(M("photo-2.jpg"));
      await tapOrClick(page, "#add-go", cfg);
      await settled(1);
      const r = (await rowsNow())[0];
      quote("retry after network back", r);
      c.ok(r.status === "done", `retry row ${JSON.stringify(r)}`);
      await page.waitForTimeout(1200);
      const after = (await api()).items.length;
      c.ok(after === before + 1, `items ${before} -> ${after}`);
      const s = await page.locator("#summary").textContent();
      c.note(`summary "${s}"`);
    });

    await S(7, "editor-offline-typing", "editor offline while typing: chip 'Offline', after online 'Saved', text kept", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(3500);
      const pop = () => page.waitForSelector(".ed-pop:not([hidden])", { timeout: 4000 }).then(() => true, () => false);
      await tapOrClick(page, HERO1, cfg).catch(() => {});
      let ok = await pop();
      if (!ok) { c.known("F-08", false, "tap does not open the popover; click() fallback"); await page.evaluate((s) => document.querySelector(s).click(), HERO1); ok = await pop(); }
      c.ok(ok, "popover never opened");
      const ta = page.locator('.ed-pop textarea[data-loc="ar"]');
      AR0 = await ta.inputValue();
      const typed = AR0 + " تجربة";
      await context.setOffline(true);
      await ta.fill(typed);
      await page.waitForTimeout(3000);
      const off = await page.evaluate(() => ({ chip: document.querySelector(".ed-chip")?.textContent, col: getComputedStyle(document.querySelector(".ed-chip")).color, bg: getComputedStyle(document.querySelector(".ed-chip")).backgroundColor, pubDis: document.querySelector(".ed-publish")?.disabled }));
      quote("editor chip while offline (3 s)", off);
      c.ok(/Offline|Retrying/.test(off.chip), `chip "${off.chip}"`);
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "07a-offline.png"), scale: "css" }).catch(() => {});
      await context.setOffline(false);
      await page.waitForFunction(() => document.querySelector(".ed-chip")?.textContent === "Saved", null, { timeout: 25000 }).catch(() => {});
      const on = await page.evaluate(() => document.querySelector(".ed-chip")?.textContent);
      quote("editor chip after back online", on);
      c.ok(on === "Saved", `chip "${on}" after going back online`);
      c.ok((await ta.inputValue()) === typed, "textarea lost the typed text");
      c.known("U-67", !/Retrying/.test(off.chip) && /Offline/.test(off.chip) && /kept|saved/i.test(off.chip), `chip reads "${off.chip}" for a typed-but-unsaved edit while offline: it does not say the typed text is only kept in this page until the network is back (close the tab now and it is lost)`);
      const dj = await draft();
      c.ok(dj.includes(typed.replace(/"/g, '\\"')) , "typed text not in the draft after going online");
    });

    await S(8, "reload-readback", "reload gallery + editor: photo-1 with alt 'keep me' present, no empty tiles, hero1 draft = typed text; public /library unchanged AR+EN", async (c) => {
      await open();
      await page.locator('#tabs button[data-cat="photo"]').first().click(); await page.waitForTimeout(600);
      const j = await api();
      const p1 = j.items.find((x) => x.id === keepId);
      c.ok(!!p1 && p1.alt.en === "keep me", `photo-1 ${JSON.stringify(p1 && p1.alt)}`);
      const fresh = j.items.filter((x) => !ids0.has(x.id));
      c.note(`new items ${JSON.stringify(fresh.map((x) => [x.id, x.video, x.src && x.src.slice(-20)]))}`);
      for (const x of fresh) { await page.locator(`.adm-tile[data-id="${x.id}"]`).scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(150); }
      await page.waitForTimeout(1500);
      const t = await page.evaluate((ids) => ids.map((id) => { const b = document.querySelector(`.adm-tile[data-id="${id}"]`); const i = b && b.querySelector("img"); return { id, tile: !!b, nat: i ? i.naturalWidth : -1 }; }), fresh.map((x) => x.id));
      c.ok(t.every((x) => x.tile && x.nat > 0), `empty tiles ${JSON.stringify(t.filter((x) => !(x.tile && x.nat > 0)))}`);
      c.ok(fresh.length === 3, `${fresh.length} new items, expected photo-1, photo-2 (batch) and photo-2 (retry) = 3`);
      c.note(`items before step 5 ${nBeforeOffline}`);
      const dj = await draft();
      c.ok(dj.includes((AR0 + " تجربة")), "hero1 draft lost the typed text after reload");
      for (const lang of ["ar", "en"]) {
        const d = await pubCount(lang);
        c.note(`public /library ${lang} ${JSON.stringify(d)} baseline ${JSON.stringify(pubBase[lang])}`);
        c.ok(d.n === pubBase[lang].n && d.mine === 0 && d.hs <= 0, `public ${lang} changed: ${JSON.stringify(d)} vs ${JSON.stringify(pubBase[lang])}`);
      }
      await lookA(page, { touch: cfg.touch, scope: "#grid" });
      await page.locator(`.adm-tile[data-id="${keepId}"]`).scrollIntoViewIfNeeded().catch(() => {});
    });
  } finally { if (big) rmBig(big); await pubCtx.browser.close(); await browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-09a ran", false, String(e.stack || e)); }
finally { stopDev(dev); rmBig(); }
done();
