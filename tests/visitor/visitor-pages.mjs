// Batch 3, visitor pages, on a 390x844 touch phone (and 360 for the client name):
//   F-13 the lightbox follows a swipe (both languages, RTL flipped), U-40 / U-23 the boss's alt texts reach the
//   /library tiles, the lightbox and the home film frame, F-11 a long client name in at most 2 lines, U-48 a tile's
//   client caption never breaks inside a word, U-49 a closed /library section is only its title, F-19 the
//   testimonial business line reads at 4.5:1, F-16 /about (Arabic) does not shift while it loads on a slow line.
//   PORT=8787 node tests/visitor/visitor-pages.mjs                          WebKit (the QA harness's exe)
//   PORT=8787 CHROMIUM=/path/to/chrome node tests/visitor/visitor-pages.mjs Chromium instead (F-16 needs it: CDP throttling)
// Needs a running `npx wrangler dev --local --port $PORT`. Local only, never --remote. Writes nothing: a published
// snapshot (two clients with long names, alt texts, a film-frame alt) is MOCKED into each page's HTML in the browser,
// the way the Worker injects it (<script id="aliph-content"> before main.js); no client or gallery row is created.
// CDN_DIR=<folder with gsap.min.js + ScrollTrigger.min.js> serves gsap when the CDN is blocked.
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium, webkit, devices } from "playwright-core";
import { WEBKIT, check, done } from "../qa/lib/harness.mjs";

const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// the names F-11 was found with (tests/qa/j-clients.mjs), the longest a client is likely to get (the limit is 80)
const LONG = { id: "qa-long", name: { en: "Golden Horizon Real Estate Development and Commercial Investment", ar: "مؤسسة الأفق الذهبي للتطوير العقاري والاستثمارات التجارية والخدمات المتكاملة" },
  line: { en: "Community programmes, photographed over a year.", ar: "برامج مجتمعية، مصوّرة على مدار عام." }, year: 2019 };
const P = ["pics-Agreements-09-dsc05463.webp", "pics-Agreements-10-dsc05514.webp", "pics-Agreements-11-dsc05764.webp", "pics-Agreements-12-dsc05824.webp"];
const ALT = { en: "Two people sign an agreement at a long table", ar: "شخصان يوقّعان اتفاقية على طاولة طويلة" };
const FILM_ALT = { en: "Behind the camera on a design shoot", ar: "خلف الكاميرا في جلسة تصوير تصميم" };
const SNAP = {
  rev: 999, text: {}, rings: {},
  slots: { "home.film.1": { alt: FILM_ALT } },
  gallery: P.map((id) => ({ id, client: LONG.id, alt: ALT })),
  clients: [LONG],
};

try { await fetch(ORIGIN + "/", { redirect: "manual" }); }
catch { console.error(`no dev server on ${ORIGIN}: start \`npx wrangler dev --local --port ${PORT}\` first`); process.exit(2); }

let browser, L;
if (process.env.CHROMIUM) { browser = await chromium.launch({ executablePath: process.env.CHROMIUM }); L = "chromium"; }
else { browser = await webkit.launch({ headless: true, ...(existsSync(WEBKIT) ? { executablePath: WEBKIT } : {}) }); L = "webkit"; }

async function context({ width = 390, mock = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent });
  if (process.env.CDN_DIR) {
    await ctx.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^/]+\/dist\/([^/?]+)/, (r) =>
      r.fulfill({ path: path.join(process.env.CDN_DIR, r.request().url().split("/").pop()), contentType: "text/javascript" }));
  }
  if (mock) {
    // the snapshot goes in exactly where the Worker puts it: once, before <script src="main.js">
    await ctx.route((u) => u.origin === ORIGIN && /^\/(library|about)?$/.test(u.pathname), async (r) => {
      if (r.request().resourceType() !== "document") return r.continue();
      const res = await r.fetch();
      let html = await res.text();
      html = html.replace(/<script type="application\/json" id="aliph-content">[\s\S]*?<\/script>\n?/, "");
      html = html.replace('<script src="main.js"', `<script type="application/json" id="aliph-content">${JSON.stringify(SNAP).replace(/</g, "\\u003c")}</script>\n<script src="main.js"`);
      r.fulfill({ response: res, body: html, headers: { ...res.headers(), "content-length": String(Buffer.byteLength(html)) } });
    });
  }
  return ctx;
}
async function load(page, url, lang) {
  await page.goto(ORIGIN + url, { waitUntil: "load" });
  if (await page.evaluate((l) => localStorage.getItem("aliph-lang") !== l && (localStorage.setItem("aliph-lang", l), true), lang)) await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => { const c = document.getElementById("curtain"); return !c || getComputedStyle(c).display === "none"; }, null, { timeout: 30000 }).catch(() => {});
  await sleep(1200);
}
const nums = (s) => { const m = String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).match(/(\d+)\s*\/\s*(\d+)/); return m ? [+m[1], +m[2]] : null; };
const openPanel = (page, cat) => page.evaluate((cat) => { const p = document.querySelector(`.acc-panel[data-cat="${cat}"]`); if (p && !p.classList.contains("open")) p.querySelector(".spine").click(); }, cat);

/* a finger on the lightbox stage: pointer events as a touch sends them (pointerType touch) */
async function swipe(page, dx, dy = 0) {
  const b = await page.locator(".lb-stage").boundingBox();
  const x0 = b.x + b.width / 2 - dx / 2, y0 = b.y + b.height / 2 - dy / 2;
  await page.evaluate(({ x0, y0, dx, dy }) => {
    const el = document.elementFromPoint(x0, y0) || document.querySelector(".lb-stage");
    const ev = (type, x, y) => new PointerEvent(type, { pointerId: 7, pointerType: "touch", isPrimary: true, bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0, buttons: type === "pointerup" ? 0 : 1 });
    el.dispatchEvent(ev("pointerdown", x0, y0));
    for (let i = 1; i <= 8; i++) el.dispatchEvent(ev("pointermove", x0 + (dx * i) / 8, y0 + (dy * i) / 8));
    el.dispatchEvent(ev("pointerup", x0 + dx, y0 + dy));
  }, { x0, y0, dx, dy });
  await sleep(350);
  return page.evaluate(() => { const r = document.querySelector(".lb"); return { open: !!r && !r.hidden, count: document.querySelector(".lb-count")?.textContent.trim() || "" }; });
}

/* ── F-13 + U-40 on /library ── */
async function library(ctx, lang) {
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await load(page, "/library", lang);
  await openPanel(page, "photo");
  await sleep(900);
  // U-40: the boss's alt text on the tile picture and in the tile's name
  const tile = await page.evaluate((f) => {
    const img = [...document.querySelectorAll(".acc-panel.open .lib-grid .tile img")].find((i) => (i.dataset.full || "").endsWith(f));
    if (!img) return null;
    img.closest(".tile").setAttribute("data-qa-alt", "1");
    return { alt: img.getAttribute("alt"), label: img.closest(".tile").getAttribute("aria-label") };
  }, P[0]);
  check(`${L} ${lang} U-40 a /library tile carries the published alt text`, !!tile && tile.alt === ALT[lang], JSON.stringify(tile));
  check(`${L} ${lang} U-40 the tile's name (aria-label) includes it`, !!tile && (tile.label || "").includes(ALT[lang]), JSON.stringify(tile && tile.label));
  await page.evaluate(() => { const t = document.querySelector("[data-qa-alt]"); t.scrollIntoView({ block: "center" }); });
  await sleep(300);
  await page.evaluate(() => document.querySelector("[data-qa-alt]").click());
  await page.waitForSelector(".lb:not([hidden])", { timeout: 5000 });
  await sleep(500);
  const lbAlt = await page.evaluate(() => document.querySelector(".lb-stage img")?.getAttribute("alt"));
  check(`${L} ${lang} U-40 the lightbox picture carries it too`, lbAlt === ALT[lang], JSON.stringify(lbAlt));

  // F-13: the finger moves toward the "next" side: right-to-left in English, left-to-right in Arabic
  const next = lang === "ar" ? 160 : -160;
  const c0 = nums((await swipe(page, 0, 0)).count); // a tap-sized nothing: reads the count
  let s = await swipe(page, next);
  const c1 = nums(s.count);
  check(`${L} ${lang} F-13 a swipe toward "next" steps forward`, s.open && !!c0 && !!c1 && c1[0] === (c0[0] % c0[1]) + 1, `${JSON.stringify(c0)} -> ${s.count}`);
  s = await swipe(page, -next);
  const c2 = nums(s.count);
  check(`${L} ${lang} F-13 a swipe the other way steps back`, s.open && !!c2 && c2[0] === c0[0], `${s.count}`);
  s = await swipe(page, 20, 220);
  check(`${L} ${lang} F-13 an up/down drag does not step`, s.open && nums(s.count)?.[0] === c0[0], s.count);
  s = await swipe(page, 18);
  check(`${L} ${lang} F-13 a small finger movement does not step`, s.open && nums(s.count)?.[0] === c0[0], s.count);
  await page.evaluate(() => document.querySelector(".lb-close").click());
  check(`${L} ${lang} /library: no page errors`, !errs.length, errs.join(" | "));
  await page.close();
}

/* ── F-11 + U-48 on /library?client= ── */
async function clientView(ctx, lang, width) {
  const page = await ctx.newPage();
  await load(page, "/library?client=" + LONG.id, lang);
  const h = await page.evaluate(() => {
    const el = document.querySelector(".ch-name");
    if (!el) return null;
    const cs = getComputedStyle(el), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
    const r = el.getBoundingClientRect();
    return { lines: Math.round(r.height / lh), fs: parseFloat(cs.fontSize), left: Math.round(r.left), right: Math.round(r.right), over: el.scrollWidth - el.clientWidth, sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  check(`${L} ${lang} ${width} F-11 the long client name is at most 2 lines`, !!h && h.lines <= 2, JSON.stringify(h));
  check(`${L} ${lang} ${width} F-11 the name is not clipped and nothing scrolls sideways`, !!h && h.left >= 0 && h.right <= h.iw && h.over <= 1 && h.sw <= h.iw, JSON.stringify(h));
  // U-48: every client caption on a tile wraps between words, in at most 2 lines
  await openPanel(page, "photo");
  await sleep(900);
  const caps = await page.evaluate(() => [...document.querySelectorAll(".acc-panel.open .t-client")].filter((e) => e.getBoundingClientRect().width).map((e) => {
    const t = e.firstChild, words = [];
    const re = /\S+/g; let m;
    while (t && (m = re.exec(t.textContent))) {
      const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length);
      const lines = new Set([...rg.getClientRects()].map((q) => Math.round(q.top)));
      if (lines.size > 1) words.push(m[0]);
    }
    const cs = getComputedStyle(e), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
    return { split: words, lines: Math.round(e.getBoundingClientRect().height / lh) };
  }));
  check(`${L} ${lang} ${width} U-48 client captions on tiles (${caps.length}) never break inside a word`, caps.length > 0 && caps.every((c) => !c.split.length), JSON.stringify(caps.filter((c) => c.split.length).slice(0, 2)));
  check(`${L} ${lang} ${width} U-48 client captions on tiles are at most 2 lines`, caps.length > 0 && caps.every((c) => c.lines <= 2), JSON.stringify(caps.map((c) => c.lines)));
  // U-49: a closed section is its title, not its title plus the height of what it hides
  const closed = await page.evaluate(() => [...document.querySelectorAll(".acc-panel:not(.open)")].map((p) => ({ cat: p.dataset.cat, h: Math.round(p.getBoundingClientRect().height), spine: Math.round(p.querySelector(".spine").getBoundingClientRect().height) })));
  check(`${L} ${lang} ${width} U-49 every closed /library section is no taller than its title row (+8 px)`, closed.length > 0 && closed.every((c) => c.h <= c.spine + 8), JSON.stringify(closed));
  await page.close();
}

/* ── U-23 home film frame ── */
async function home(ctx, lang) {
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await load(page, "/", lang);
  const f = await page.evaluate(() => {
    const fr = document.querySelector(".film-group:not([aria-hidden]) .film-frame[data-frame='0']") || document.querySelector(".film-frame[data-frame='0']");
    const img = fr && fr.querySelector("img");
    return fr ? { alt: img.getAttribute("alt"), label: fr.getAttribute("aria-label") } : null;
  });
  check(`${L} ${lang} U-23 the first film frame carries the published alt text`, !!f && f.alt === FILM_ALT[lang], JSON.stringify(f));
  check(`${L} ${lang} U-23 and is announced by it (no aria-label over it)`, !!f && (!f.label || f.label.includes(FILM_ALT[lang])), JSON.stringify(f));
  // F-19: the testimonial business line reads at 4.5:1 or better (same computation as tests/qa/a11y.mjs)
  const tb = await page.evaluate(() => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
    const bgOf = (el) => { const st = []; for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.backgroundImage !== "none") return null; const c = parse(s.backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } } let b = { r: 255, g: 255, b: 255, a: 1 }; for (const c of st.reverse()) b = blend(c, b); return b; };
    return [...document.querySelectorAll(".tb-biz")].filter((e) => e.getBoundingClientRect().width && !e.hidden && !e.closest("[aria-hidden=true]")).slice(0, 6).map((el) => {
      let op = 1; for (let p = el; p && p !== document.documentElement; p = p.parentElement) op *= +getComputedStyle(p).opacity;
      const fg0 = parse(getComputedStyle(el).color), bg = bgOf(el);
      if (!fg0 || !bg) return null;
      const fg = blend({ ...fg0, a: fg0.a * op }, bg), L1 = lum(fg), L2 = lum(bg);
      return +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2);
    }).filter((x) => x !== null);
  });
  check(`${L} ${lang} F-19 the testimonial business line is at least 4.5:1`, tb.length > 0 && tb.every((r) => r >= 4.5), JSON.stringify(tb));
  check(`${L} ${lang} home: no page errors`, !errs.length, errs.join(" | "));
  await page.close();
}

/* ── F-16 /about in Arabic on a slow line (Chromium: CDP throttling) ── */
async function aboutSlow() {
  if (L !== "chromium") { console.log("skip F-16 /about slow-line CLS: needs CHROMIUM (CDP network throttling)"); return; }
  const ctx = await context({ mock: false });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("aliph-lang", "ar"); } catch {}
    window.__cls = 0; window.__shifts = [];
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).slice(0, 2).map((x) => x.node ? (x.node.nodeName + "." + (x.node.className || "")) : "?").join(" ")]); } }).observe({ type: "layout-shift", buffered: true });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 });
  await page.goto(ORIGIN + "/about", { waitUntil: "commit", timeout: 120000 });
  await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 180000 }).catch(() => {});
  await sleep(6000);
  const m = await page.evaluate(() => ({ cls: +window.__cls.toFixed(4), big: window.__shifts.filter((x) => x[1] >= 0.02) }));
  check(`${L} ar F-16 /about on a slow line: CLS under 0.1 and no shift from the clippings`, m.cls < 0.1 && !m.big.some((x) => /clip/i.test(x[2])), JSON.stringify(m));
  await ctx.close();
}

try {
  const ctx = await context();
  for (const lang of ["en", "ar"]) {
    await library(ctx, lang);
    await clientView(ctx, lang, 390);
    await home(ctx, lang);
  }
  await ctx.close();
  const narrow = await context({ width: 360 });
  for (const lang of ["en", "ar"]) await clientView(narrow, lang, 360);
  await narrow.close();
  if (!process.env.SKIP_SLOW) await aboutSlow();
} catch (e) { check(`${L} ran`, false, String(e.stack || e)); }
await browser.close();
done();
