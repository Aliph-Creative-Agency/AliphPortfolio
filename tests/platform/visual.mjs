// Visual parity: headless Edge screenshots of /, /about, /library (390x844 and 1440x900, ar + en) from the
// assets-only build (today's deployment shape) and from the Worker build with an empty store, pixel-diffed.
// Also records the order of media requests (the hero's own pictures must come first; MEDIA HOLD).
//   node tests/platform/visual.mjs                run both builds, compare, exit 1 over 0.1% on any shot
//   node tests/platform/visual.mjs --keep         reuse .wrangler/visual/baseline when it exists
//   node tests/platform/visual.mjs --only=worker  just (re)shoot the Worker build into .wrangler/visual/current
// Needs the Edge at EDGE below (no Chrome on this machine). Never touches a remote anything.
import { spawn, execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 8831, INSPECTOR = 9231;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, ".wrangler", "visual");
const THRESHOLD = 0.001;               // 0.1% of the pixels
const PAGES = [["home", "/"], ["about", "/about"], ["library", "/library"]];
const SIZES = [["phone", 390, 844], ["desktop", 1440, 900]];
const LANGS = ["ar", "en"];

// Everything that moves on its own is frozen, so two runs of the same build give the same pixels.
const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
video{visibility:hidden!important}
/* masked: the headline's ransom scrap swaps on a wall-clock timer and the film strip scrolls on its own */
.ransom img,.film-scroll{visibility:hidden!important}`;

// ---- servers (same shape as parity-live.mjs) ----
function assetsOnlyConfig() {
  let t = readFileSync(path.join(ROOT, "wrangler.toml"), "utf8");
  t = t.replace(/^main\s*=.*$/m, "").replace(/^binding\s*=.*$/m, "").replace(/^run_worker_first\s*=.*$/m, "");
  t = t.replace(/^directory\s*=.*$/m, `directory = ${JSON.stringify(path.join(ROOT, "prototype"))}`);
  mkdirSync(path.join(ROOT, ".wrangler"), { recursive: true });
  const p = path.join(ROOT, ".wrangler", "visual-assets-only.toml");
  writeFileSync(p, t);
  return p;
}
function start(config) {
  const bin = path.join(ROOT, "node_modules/wrangler/bin/wrangler.js");
  const child = spawn(process.execPath, [bin, "dev", "--local", "--config", config, "--port", String(PORT),
    "--inspector-port", String(INSPECTOR), "--ip", "127.0.0.1"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  return child;
}
function stop(child) { try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" }); } catch {} }
async function waitUp() {
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(BASE + "/style.css", { redirect: "manual" }); if (r.status) return; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev server did not come up");
}

// ---- one shooting pass: every page x size x language ----
// `setup(context, lang)` is the hook P-07b's override scenario uses; `base` is where to point.
export async function shoot(outDir, { base = BASE, setup } = {}) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const requests = {};
  try {
    for (const [sizeName, width, height] of SIZES) {
      for (const lang of LANGS) {
        for (const [pageName, url] of PAGES) {
          const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
          await ctx.addInitScript((l) => { try { localStorage.setItem("aliph-lang", l); } catch {} }, lang);
          // the headline's ransom letters and their timings use Math.random: a fixed seed (mulberry32)
          await ctx.addInitScript(() => {
            let s = 0x9e3779b9;
            Math.random = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
              t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
          });
          if (setup) await setup(ctx, lang);
          const page = await ctx.newPage();
          const media = [];
          page.on("request", (r) => {
            const t = r.resourceType();
            if (t === "image" || t === "media") media.push(new URL(r.url()).pathname);
          });
          await page.goto(base + url, { waitUntil: "load" });
          // the curtain lifts (display:none) and MEDIA HOLD is released
          await page.waitForFunction(() => {
            const c = document.getElementById("curtain");
            return (!c || getComputedStyle(c).display === "none") && !document.documentElement.classList.contains("media-hold");
          }, null, { timeout: 20000 });
          await page.waitForLoadState("networkidle").catch(() => {});
          await page.addStyleTag({ content: FREEZE });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(600);
          const name = `${pageName}-${sizeName}-${lang}`;
          await page.screenshot({ path: path.join(outDir, name + ".png"), animations: "disabled" });
          requests[name] = media;
          await ctx.close();
        }
      }
    }
  } finally { await browser.close(); }
  writeFileSync(path.join(outDir, "requests.json"), JSON.stringify(requests, null, 1));
  return requests;
}

// ---- pixel diff, done in the browser's own canvas (no image dependency) ----
export async function diffDirs(aDir, bDir) {
  const names = LANGS.flatMap((l) => SIZES.flatMap(([s]) => PAGES.map(([p]) => `${p}-${s}-${l}`)));
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage();
  const rows = [];
  try {
    for (const n of names) {
      const a = readFileSync(path.join(aDir, n + ".png")).toString("base64");
      const b = readFileSync(path.join(bDir, n + ".png")).toString("base64");
      const r = await page.evaluate(async ([a, b]) => {
        const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + s; });
        const [ia, ib] = await Promise.all([load(a), load(b)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return { size: true };
        const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
          const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
        const da = px(ia), db = px(ib);
        let bad = 0;
        for (let i = 0; i < da.length; i += 4) {
          if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) bad++;
        }
        return { bad, total: da.length / 4 };
      }, [a, b]);
      rows.push({ name: n, ...r, ratio: r.size ? 1 : r.bad / r.total });
    }
  } finally { await browser.close(); }
  return rows;
}

// The media requests must be the same sequence of paths in both builds (the hero's pictures first, nothing
// below the fold before the hold lifts).
export function compareRequests(a, b) {
  const bad = [];
  for (const n of Object.keys(a)) {
    if (JSON.stringify(a[n]) !== JSON.stringify(b[n] || [])) bad.push(n);
  }
  return bad;
}

async function runBuild(config, outDir) {
  const child = start(config);
  try { await waitUp(); return await shoot(outDir); }
  finally { stop(child); await new Promise((r) => setTimeout(r, 1500)); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const baseDir = path.join(OUT, "baseline"), curDir = path.join(OUT, "current");
  const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7);
  let baseReq;
  if (only === "worker" || (args.includes("--keep") && existsSync(path.join(baseDir, "requests.json")))) {
    baseReq = JSON.parse(readFileSync(path.join(baseDir, "requests.json"), "utf8"));
  } else baseReq = await runBuild(assetsOnlyConfig(), baseDir);
  const curReq = await runBuild(path.join(ROOT, "wrangler.toml"), curDir);
  const rows = await diffDirs(baseDir, curDir);
  let fail = 0;
  for (const r of rows) {
    const ok = r.ratio <= THRESHOLD; if (!ok) fail++;
    console.log((ok ? "ok   " : "FAIL ") + r.name.padEnd(22) + (r.size ? "size differs" : `${(r.ratio * 100).toFixed(4)}% (${r.bad}/${r.total})`));
  }
  for (const n of compareRequests(baseReq, curReq)) { fail++; console.log("FAIL request order differs: " + n); }
  console.log("home-phone-ar first media request: " + (curReq["home-phone-ar"]?.[0] || "-"));
  if (fail) { console.log(`VISUAL FAILED (${fail})`); process.exit(1); }
  console.log(`VISUAL OK (${rows.length} shots <= ${THRESHOLD * 100}%, request order identical)`);
}
