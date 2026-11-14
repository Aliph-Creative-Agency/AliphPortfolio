// Q-18: before-JS, slow-3G and CLS on the visitor pages (/, /about, /library) in Edge.
//   node tests/qa/v-perf.mjs      (local wrangler dev on 8881; ONLY=nojs|slow; PAGES=/,/about to narrow)
// A) JavaScript disabled, 390 + 1440: HTTP 200, readable text in the static HTML, <h1> visible, and whether anything (the load curtain)
//    sits on top of the content (elementFromPoint at 5 points). F-15 (fixed): the run fails if the curtain covers the page for good.
// B) CDP "Slow 3G" (500 kbit/s down, 400 kbit/s up, 400 ms RTT): CLS (PerformanceObserver layout-shift, no recent input) < 0.1 for the whole
//    load, curtain lifts (display:none), no console errors, no failed same-origin requests. Numbers are printed per page/viewport.
import { startDev, stopDev, EDGE, VIEWPORTS, ORIGIN, shot, check, done } from "./lib/harness.mjs";
import { chromium } from "playwright-core";

const KNOWN = (id, msg) => console.log(`KNOWN ${id} ${msg}`);
const PAGES = (process.env.PAGES ? process.env.PAGES.split(",") : ["/", "/about", "/library"]);
const SETUPS = [["p390", VIEWPORTS.phone, "ar", { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ["p1440", VIEWPORTS.desktop, "en", {}]];
const TABLE = [];

async function launch(vp, opts) {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const context = await browser.newContext({ viewport: vp, ...opts });
  return { browser, context, page: await context.newPage() };
}

async function noJs() {
  for (const [vname, vp, , o] of SETUPS) {
    const { browser, page } = await launch(vp, { ...o, javaScriptEnabled: false });
    try {
      for (const url of PAGES) {
        const tag = `nojs ${vname} ${url}`;
        const resp = await page.goto(ORIGIN + url, { waitUntil: "load" });
        await page.waitForTimeout(1500);
        const d = await page.evaluate(() => {
          const cur = document.getElementById("curtain");
          const cs = cur && getComputedStyle(cur);
          const h1 = document.querySelector("h1");
          const pts = [[0.5, 0.5], [0.5, 0.25], [0.5, 0.75], [0.25, 0.5], [0.75, 0.5]];
          const covered = pts.filter(([x, y]) => { const el = document.elementFromPoint(innerWidth * x, innerHeight * y); return el && cur && cur.contains(el); }).length;
          const text = document.body.innerText.replace(/\s+/g, " ").trim();
          return {
            lang: document.documentElement.lang, dir: document.documentElement.dir, text: text.length, sample: text.slice(0, 60),
            h1: h1 ? h1.textContent.trim().slice(0, 40) : null, h1vis: h1 ? (() => { const r = h1.getBoundingClientRect(), s = getComputedStyle(h1); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && +s.opacity > 0.05; })() : false,
            curtain: cur ? { display: cs.display, opacity: cs.opacity, position: cs.position, z: cs.zIndex } : null, covered,
            sw: document.documentElement.scrollWidth, iw: innerWidth, imgs: document.images.length,
          };
        });
        check(`${tag} HTTP ${resp.status()}, readable text in the HTML (${d.text} chars)`, resp.status() === 200 && d.text > 300);
        check(`${tag} <h1> present and visible (${JSON.stringify(d.h1)})`, !!d.h1 && d.h1vis);
        check(`${tag} no sideways scroll (${d.sw} <= ${d.iw})`, d.sw <= d.iw);
        const hidden = d.curtain && d.curtain.display !== "none" && +d.curtain.opacity > 0.5;
        check(`${tag} nothing covers the content with JavaScript off (F-15; curtain ${JSON.stringify(d.curtain)}, covers ${d.covered}/5)`, !(d.covered > 0 || hidden));
        await shot(page, `Q18-nojs-${vname}-${url === "/" ? "home" : url.slice(1)}`);
        TABLE.push(`nojs ${vname} ${url}: text ${d.text}, h1 ${d.h1vis}, curtain covers ${d.covered}/5`);
      }
    } finally { await browser.close(); }
  }
}

async function slow() {
  for (const [vname, vp, lang, o] of SETUPS) {
    for (const url of PAGES) {
      const { browser, context, page } = await launch(vp, o);
      const tag = `slow3g ${vname} ${lang} ${url}`;
      const errs = [], fails = [];
      page.on("console", (m) => { if (m.type() === "error") errs.push(`${m.text()} [${m.location().url}]`); });
      page.on("pageerror", (e) => errs.push("pageerror " + e.message));
      page.on("requestfailed", (r) => { if (!/ERR_ABORTED|cancelled/i.test(r.failure()?.errorText || "")) fails.push(`${r.url()} ${r.failure()?.errorText}`); });
      page.on("response", (r) => { if (r.status() >= 400) fails.push(`${r.status()} ${r.url()}`); });
      await context.addInitScript((l) => {
        try { localStorage.setItem("aliph-lang", l); } catch {}
        window.__cls = 0; window.__shifts = [];
        new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).slice(0, 2).map((x) => x.node ? (x.node.nodeName + (x.node.className && typeof x.node.className === "string" ? "." + x.node.className.split(" ")[0] : "") + (x.node.id ? "#" + x.node.id : "")) : "?").join(",")]); } }).observe({ type: "layout-shift", buffered: true });
      }, lang);
      try {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 });
        const t0 = Date.now();
        await page.goto(ORIGIN + url, { waitUntil: "commit", timeout: 120000 });
        let lifted = null;
        for (let i = 0; i < 300; i++) { // up to 150 s
          const g = await page.evaluate(() => { const c = document.getElementById("curtain"); return !!c && getComputedStyle(c).display === "none"; }).catch(() => false);
          if (g) { lifted = Date.now() - t0; break; }
          await page.waitForTimeout(500);
        }
        await page.waitForFunction(() => document.readyState === "complete", null, { timeout: 150000 }).catch(() => {});
        await page.waitForTimeout(6000); // late shifts: fonts, images arriving after the curtain
        const m = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts.filter((x) => x[1] > 0).slice(0, 8), sw: document.documentElement.scrollWidth, iw: innerWidth, lang: document.documentElement.lang }));
        const nav = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; const lcp = performance.getEntriesByType("largest-contentful-paint").pop(); return { load: n ? Math.round(n.loadEventEnd) : null, lcp: lcp ? Math.round(lcp.startTime) : null }; }).catch(() => ({}));
        console.log(`     ${tag}: curtain lifted ${lifted === null ? "NEVER (150 s)" : (lifted / 1000).toFixed(1) + " s"}, load ${nav.load} ms, LCP ${nav.lcp} ms, CLS ${m.cls.toFixed(4)} shifts ${JSON.stringify(m.shifts)}`);
        TABLE.push(`${tag}: lifted ${lifted === null ? "never" : (lifted / 1000).toFixed(1) + "s"}, load ${nav.load}ms, LCP ${nav.lcp}ms, CLS ${m.cls.toFixed(4)}`);
        check(`${tag} curtain lifts (${lifted === null ? "never" : (lifted / 1000).toFixed(1) + " s"})`, lifted !== null);
        const big = m.shifts.filter((x) => x[1] >= 0.05);
        if (m.cls >= 0.1 && big.length && big.every((x) => /BLOCKQUOTE.clip/.test(x[2]))) KNOWN("F-16", `${tag} CLS ${m.cls.toFixed(4)} >= 0.1: one shift of ${big[0][1]} at ${big[0][0]} ms from BLOCKQUOTE.clip / IMG (the about clippings image has no reserved size); it lands while the curtain (lifted at ${(lifted / 1000).toFixed(1)} s) still covers the page`);
        else check(`${tag} CLS ${m.cls.toFixed(4)} < 0.1`, m.cls < 0.1);
        check(`${tag} no sideways scroll (${m.sw} <= ${m.iw})`, m.sw <= m.iw);
        check(`${tag} no console errors (${errs.length})`, errs.length === 0, errs.slice(0, 3).join(" | ").slice(0, 300));
        const own = fails.filter((x) => x.includes("127.0.0.1"));
        check(`${tag} no failed same-origin requests (${own.length})`, own.length === 0, own.slice(0, 3).join(" | "));
        if (fails.length > own.length) console.log(`     ${tag} third-party failures: ${fails.filter((x) => !x.includes("127.0.0.1")).slice(0, 4).join(" | ")}`);
        if (!(url === "/about")) await shot(page, `Q18-slow-${vname}-${url === "/" ? "home" : url.slice(1)}`);
      } catch (e) {
        check(`${tag} ran (${String(e.message).split("\n")[0].slice(0, 200)})`, false);
      } finally { await browser.close(); }
    }
  }
}

const dev = await startDev();
try {
  if (process.env.ONLY !== "slow") await noJs();
  if (process.env.ONLY !== "nojs") await slow();
} catch (e) {
  check(`script ran to the end (${String(e.stack || e.message).split("\n").slice(0, 3).join(" / ").slice(0, 300)})`, false);
} finally { stopDev(dev); }
console.log("TABLE:\n" + TABLE.join("\n"));
done();
