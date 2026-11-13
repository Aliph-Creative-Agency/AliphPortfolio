// Q-16: visitor layout matrix. /, /about, /library and /library?client=<seeded id> x ar/en x 390/1440 x Edge/WebKit = 32 combos,
// after a publish with a long-named client and a long alt text. Per combo: html lang/dir, no horizontal scroll (exact numbers printed),
// no text outside the viewport, no clipped text, no console errors, and every HTTP 404 named by URL (the "Failed to load resource" noise).
//   node tests/qa/v-matrix.mjs      (local wrangler dev on 8881; ONLY=edge|webkit)
// LOCAL D1/R2 only. Seeds one client + one piece through the admin API, publishes, tests, deletes both and publishes the store back.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ROOT, shot, check, done } from "./lib/harness.mjs";

const PHOTO = path.join(ROOT, "tests/gallery/fixtures/photo-plain.jpg");
const H = { origin: ORIGIN };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tag = Date.now().toString(36).slice(-4);
const NAME_AR = "مؤسسة الأفق الذهبي للتطوير العقاري والاستثمارات التجارية والخدمات المتكاملة";
const NAME_EN = "Golden Horizon Real Estate Development and Commercial Investment";
const LINE_AR = "شريك موثوق في بناء المشاريع الكبرى منذ أكثر من عشرين عاماً في المنطقة";
const LINE_EN = "A trusted partner in building large projects across the region";
const ALT_EN = "A very long descriptive caption for the seeded piece that keeps going to test how the grid and the lightbox cope with it " + tag;
const ALT_AR = "وصف طويل جداً للقطعة المضافة يستمر لاختبار كيف تتعامل الشبكة والعرض الكبير مع النص الطويل " + tag;

const PAGES = [["home", "/"], ["about", "/about"], ["library", "/library"], ["client", null]];
const NINE = []; // 404s per combo, for the report

const probe = () => {
  const iw = innerWidth, de = document.documentElement;
  const out = { lang: de.lang, dir: de.dir, sw: de.scrollWidth, bsw: document.body.scrollWidth, iw, outside: [], clipped: [] };
  const clippedBy = (el) => { // an ancestor that clips this element away on purpose (collapsed panel, scroller)
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") { const a = p.getBoundingClientRect(), b = el.getBoundingClientRect(); if (b.right > a.right + 1 || b.left < a.left - 1 || a.width === 0 || a.height === 0) return true; }
      if (cs.display === "none" || cs.visibility === "hidden") return true;
    }
    return false;
  };
  for (const el of document.body.querySelectorAll("*")) {
    if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH"].includes(el.tagName.toUpperCase())) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0 || +cs.opacity === 0) continue;
    const label = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : "") + ' "' + el.textContent.trim().slice(0, 30) + '"';
    if ((r.right > iw + 1 || r.left < -1) && cs.position !== "fixed" && !clippedBy(el)) out.outside.push(`${label} ${Math.round(r.left)}..${Math.round(r.right)}`);
    if (cs.display !== "inline" && el.clientWidth > 1 && (cs.overflowX === "hidden" || cs.overflowX === "clip") && el.scrollWidth > el.clientWidth + 1 && !clippedBy(el)) out.clipped.push(`${label} scrollW ${el.scrollWidth} > clientW ${el.clientWidth}`);
  }
  return out;
};

async function seed(R) {
  const get = async (p) => (await R.get(ORIGIN + p)).json();
  const publishApi = async () => { const c = await get("/api/admin/changes"); if (!c.changes.length) return 204; return (await R.post(ORIGIN + "/api/admin/publish", { headers: H, data: { token: c.token } })).status(); };
  await publishApi();
  const baseClients = (await get("/api/admin/clients")).clients.map((c) => c.id);
  const upl = await (await R.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `qa16-${tag}.jpg` }, data: fs.readFileSync(PHOTO) })).json();
  const put = await R.put(`${ORIGIN}/api/admin/gallery/${upl.id}`, { headers: H, data: { src: upl.url, cat: "photo", ratio: 1.5, date: "2026-01", alt: { en: ALT_EN, ar: ALT_AR }, baseRev: 0 } });
  const item = ((await put.json()).item || {}).id || upl.id;
  const client = (await (await R.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: NAME_AR, en: NAME_EN }, line: { ar: LINE_AR, en: LINE_EN }, year: "2019" } })).json()).client;
  const it = (await get("/api/admin/gallery")).items.find((i) => i.id === item);
  const r2 = await R.put(`${ORIGIN}/api/admin/gallery/${encodeURIComponent(item)}`, { headers: H, data: { ...it.own, client: client.id, baseRev: it.rev } });
  const st = await publishApi();
  return { item, client, baseClients, st, putStatus: put.status(), assign: r2.status() };
}

async function cleanup(R, s) {
  const get = async (p) => (await R.get(ORIGIN + p)).json();
  const it = s.item && (await get("/api/admin/gallery")).items.find((i) => i.id === s.item);
  if (it) await R.delete(`${ORIGIN}/api/admin/gallery/${encodeURIComponent(it.id)}?baseRev=${it.rev}`, { headers: H });
  const c = s.client && (await get("/api/admin/clients")).clients.find((k) => k.id === s.client.id);
  if (c) await R.delete(`${ORIGIN}/api/admin/clients/${c.id}?rev=${c.rev}`, { headers: H });
  const ch = await get("/api/admin/changes");
  return ch.changes.length ? (await R.post(ORIGIN + "/api/admin/publish", { headers: H, data: { token: ch.token } })).status() : 204;
}

async function matrix(label, launch, vname, vp, ctxOpts) {
  const { browser, context, page } = await launch(vp, ctxOpts);
  const errs = [], f404 = [], pe = [];
  let cur = "";
  page.on("console", (m) => { if (m.type() === "error") errs.push(`${cur}: ${m.text()} [${m.location().url}]`); });
  page.on("pageerror", (e) => pe.push(`${cur}: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) f404.push(`${r.status()} ${r.url()} (on ${cur})`); });
  page.on("requestfailed", (r) => { if (!/ERR_ABORTED|NS_BINDING_ABORTED|cancelled/i.test(r.failure()?.errorText || "")) f404.push(`FAILED ${r.url()} ${r.failure()?.errorText} (on ${cur})`); });
  const R = context.request;
  await context.route("https://media.aliphcreative.com/admin/**", async (route) => {
    try { await route.fulfill({ response: await R.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }); } catch { await route.abort().catch(() => {}); }
  });
  try {
    for (const lang of ["ar", "en"]) {
      for (const [pname, purl] of PAGES) {
        const url = purl ?? `/library?client=${encodeURIComponent(S.client.id)}`;
        const tagc = `${label} ${vname} ${lang} ${pname}`;
        cur = tagc;
        const before = errs.length + pe.length;
        let hdrOk = pname !== "client", d = null;
        for (let k = 0; k < 8; k++) { // poll for the publish cache on the client page
          await page.goto(ORIGIN + url, { waitUntil: "load" });
          if (await page.evaluate((l) => localStorage.getItem("aliph-lang") !== l && (localStorage.setItem("aliph-lang", l), true), lang)) await page.reload({ waitUntil: "load" });
          await page.waitForTimeout(pname === "home" ? 3500 : 1800); // curtain + first paint
          if (pname === "client") { hdrOk = (await page.locator(".lib-client .ch-name").count()) > 0; if (!hdrOk) { await sleep(1000); continue; } }
          break;
        }
        if (pname === "library") { await page.waitForSelector(".lib-clients .lc-name", { state: "attached", timeout: 15000 }).catch(() => {}); }
        if (pname === "client") {
          await page.evaluate(() => document.querySelector('.acc-panel[data-cat="photo"] .spine')?.click());
          await page.waitForTimeout(800);
        }
        d = await page.evaluate(probe);
        check(`${tagc} lang/dir ${d.lang}/${d.dir}`, d.lang === lang && d.dir === (lang === "ar" ? "rtl" : "ltr"));
        check(`${tagc} no horizontal scroll: scrollWidth ${d.sw}, body ${d.bsw}, innerWidth ${d.iw}`, d.sw <= d.iw && d.bsw <= d.iw);
        check(`${tagc} no text outside the viewport (${d.outside.length})`, d.outside.length === 0, d.outside.slice(0, 3).join(" | "));
        check(`${tagc} no clipped text (${d.clipped.length})`, d.clipped.length === 0, d.clipped.slice(0, 3).join(" | "));
        if (pname === "client") {
          check(`${tagc} client header present`, hdrOk);
          const ex = await page.evaluate(() => ({ name: document.querySelector(".ch-name")?.textContent, since: document.querySelector(".ch-meta span:nth-child(1)")?.textContent.trim(), meta: document.querySelector(".ch-meta span:nth-child(2)")?.textContent.trim(), tiles: document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-grid img[data-full]').length }));
          check(`${tagc} name is exactly the ${lang} name`, ex.name === (lang === "ar" ? NAME_AR : NAME_EN), ex.name);
          check(`${tagc} exactly 1 piece in the photo panel`, ex.tiles === 1, String(ex.tiles));
          check(`${tagc} meta is exactly "${lang === "en" ? "Since 2019" : "منذ ٢٠١٩"}" + "${lang === "en" ? "1 piece" : "قطعة واحدة"}" (${ex.since} / ${ex.meta})`, ex.since === (lang === "en" ? "Since 2019" : "منذ ٢٠١٩") && ex.meta === (lang === "en" ? "1 piece" : "قطعة واحدة"));
        }
        if (pname === "library") {
          const ex = await page.evaluate((id) => { const a = document.querySelector(`.lib-clients a[href="/library?client=${encodeURIComponent(id)}"]`); return a ? { year: a.querySelector(".lc-meta span:nth-child(1)")?.textContent.trim(), meta: a.querySelector(".lc-meta span:nth-child(2)")?.textContent.trim(), name: a.querySelector(".lc-name")?.textContent, n: document.querySelectorAll(".lib-clients a").length } : null; }, S.client.id);
          check(`${tagc} Clients index lists the client; ${ex && ex.n} card(s) in all`, !!ex && ex.n === 1);
          if (ex) check(`${tagc} index card is exactly "${lang === "en" ? "2019" : "٢٠١٩"}" + "${lang === "en" ? "1 piece" : "قطعة واحدة"}" (${ex.year} / ${ex.meta})`, ex.year === (lang === "en" ? "2019" : "٢٠١٩") && ex.meta === (lang === "en" ? "1 piece" : "قطعة واحدة"));
        }
        const fresh = errs.length + pe.length - before;
        check(`${tagc} no console errors / page errors (${fresh})`, fresh === 0, [...errs, ...pe].slice(before).slice(0, 3).join(" | ").slice(0, 300));
        if ((vname === "p390" || lang === "ar") && label !== "webkit") await shot(page, `Q16-${label}-${vname}-${lang}-${pname}`);
      }
    }
  } finally {
    const seen = [...new Set(f404)];
    for (const x of seen) console.log(`     HTTP>=400 ${label} ${vname}: ${x}`);
    NINE.push(...seen.map((x) => `${label} ${vname}: ${x}`));
    await browser.close();
  }
}

// the smoke run's one console 404 on "/" (Edge 1440): a cold visitor (no stored language), every response >= 400 and every console error with its URL
async function coldHome() {
  const { browser, page } = await edge(VIEWPORTS.desktop);
  const bad = [], con = [];
  page.on("response", (r) => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });
  page.on("console", (m) => { if (m.type() === "error") con.push(m.text() + " [" + m.location().url + "]"); });
  await page.goto(ORIGIN + "/", { waitUntil: "load" }); await page.waitForTimeout(4000);
  console.log("     COLD / Edge 1440 responses>=400: " + (bad.join(" | ") || "none") + "; console errors: " + (con.join(" | ") || "none"));
  // the smoke run also opened /admin/ in the same page: that is where the 404 comes from (GET /favicon.ico; no icon link on the admin shell)
  const n0 = bad.length, c0 = con.length;
  await page.goto(ORIGIN + "/admin/", { waitUntil: "load" }); await page.waitForTimeout(2500);
  const adminBad = [...bad.slice(n0), ...con.slice(c0)]; // the favicon fetch shows up only as a console error, not as a page response
  console.log("     COLD /admin/ Edge 1440 failures: " + (adminBad.join(" | ") || "none"));
  const onlyFav = adminBad.length > 0 && adminBad.every((x) => /404/.test(x) && x.includes("/favicon.ico"));
  if (onlyFav) { console.log("KNOWN F-12 /admin/ has no favicon: the browser asks GET /favicon.ico and gets 404 (console error in Edge); / is clean"); bad.length = n0; con.length = c0; }
  await browser.close();
  return { bad, con };
}
const dev = await startDev();
let S = null, R0 = null;
try {
  const { browser, context } = await edge(VIEWPORTS.desktop);
  R0 = context.request;
  S = await seed(R0);
  check(`seed: piece put ${S.putStatus}, assigned ${S.assign}, publish ${S.st}, client ${S.client && S.client.id}`, S.putStatus < 300 && S.assign < 300 && S.st === 200 && !!S.client);
  await browser.close();
  const cold = await coldHome();
  check(`cold / in Edge 1440: no response >= 400 (${cold.bad.length}) and no console error (${cold.con.length})`, cold.bad.length === 0 && cold.con.length === 0, [...cold.bad, ...cold.con].join(" | ").slice(0, 300));
  const eo = { isMobile: false, hasTouch: false, deviceScaleFactor: 1 };
  if (process.env.ONLY !== "webkit") { await matrix("edge", edge, "p390", VIEWPORTS.phone); await matrix("edge", edge, "p1440", VIEWPORTS.desktop); }
  if (process.env.ONLY !== "edge") { await matrix("webkit", webkit, "p390", VIEWPORTS.phone); await matrix("webkit", webkit, "p1440", VIEWPORTS.desktop, eo); }
} catch (e) {
  check(`matrix ran to the end (${String(e.stack || e.message).split("\n").slice(0, 3).join(" / ").slice(0, 300)})`, false);
} finally {
  try { const { browser, context } = await edge(VIEWPORTS.desktop); const st = await cleanup(context.request, S || {}); check(`cleanup: piece + client deleted, republished (${st})`, st === 200 || st === 204); await browser.close(); } catch (e) { check(`cleanup ran (${e.message})`, false); }
  stopDev(dev);
}
console.log("ALL HTTP>=400 / failed requests:\n" + (NINE.join("\n") || "none"));
done();
