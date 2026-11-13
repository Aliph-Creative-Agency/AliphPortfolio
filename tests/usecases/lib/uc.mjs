// Use-case harness: local wrangler dev on 8901/9301, configs (Edge 1440 / WebKit 390 touch), step recorder, state reset.
// Local D1/R2 only. Never --remote. Imports nothing from tests/qa (pinned to 8881).
import { spawn, execSync } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync, existsSync, rmSync, cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const ORCH = "D:/Personal/Projects/aliph-portfolio/.orchestration/teams/usecases";
export const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
export const WEBKIT = path.join(process.env.LOCALAPPDATA || "", "ms-playwright/webkit-2359/Playwright.exe");
export const PORT = 8901, INSPECTOR = 9301;
export const ORIGIN = `http://127.0.0.1:${PORT}`;
const WRANGLER = path.join(ROOT, "node_modules/wrangler/bin/wrangler.js");
const STATE = path.join(ROOT, ".wrangler/state");
const BASELINE = path.join(ORCH, "state-baseline");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Start wrangler dev (local migrations first). Returns the child; pass it to stopDev. */
export async function startDev() {
  execSync(`"${process.execPath}" "${WRANGLER}" d1 migrations apply aliph-admin --local`, { cwd: ROOT, stdio: "ignore" });
  const child = spawn(process.execPath, [WRANGLER, "dev", "--local", "--port", String(PORT),
    "--inspector-port", String(INSPECTOR), "--ip", "127.0.0.1"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(ORIGIN + "/", { redirect: "manual" }); if (r.status === 200) return child; } catch {}
    await sleep(1000);
  }
  stopDev(child);
  throw new Error("dev server did not return 200 on /");
}
export function stopDev(child) {
  if (!child) return;
  try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" }); } catch {}
}

/** Run with the server STOPPED. Saves the current local state as the baseline (use on a fresh, migrated state). */
export function snapshotState() {
  rmSync(BASELINE, { recursive: true, force: true });
  mkdirSync(BASELINE, { recursive: true });
  cpSync(STATE, BASELINE, { recursive: true });
}
/** Run with the server STOPPED. Restores the baseline (creates it from the current state the first time). */
export function resetState() {
  if (!existsSync(BASELINE)) { snapshotState(); return; }
  rmSync(STATE, { recursive: true, force: true });
  cpSync(BASELINE, STATE, { recursive: true });
}

/** [{name, viewport, touch, open()}] honouring --only edge|webkit. open() -> {browser, context, page}. */
export function configs(argv = process.argv) {
  const i = argv.indexOf("--only"), only = i > -1 ? argv[i + 1] : null;
  const all = [
    { name: "edge", viewport: { width: 1440, height: 900 }, touch: false, async open() {
      const browser = await chromium.launch({ executablePath: EDGE, headless: true });
      const context = await browser.newContext({ viewport: this.viewport });
      return { browser, context, page: await context.newPage() };
    } },
    { name: "webkit", viewport: { width: 390, height: 844 }, touch: true, async open() {
      // playwright-core 1.64.1 wants webkit-2370; only 2359 is on disk, so pass its exe explicitly
      const browser = await webkit.launch({ headless: true, executablePath: WEBKIT });
      const context = await browser.newContext({ viewport: this.viewport, isMobile: true, hasTouch: true,
        deviceScaleFactor: 3, userAgent: devices["iPhone 13"].userAgent });
      return { browser, context, page: await context.newPage() };
    } },
  ];
  return only ? all.filter((c) => c.name === only) : all;
}

const pad = (n) => String(n).padStart(2, "0");
let failed = 0;
/**
 * Runs fn, takes a css-scale shot, records console errors / pageerrors / failed or 4xx-5xx requests made during the step.
 * s = {uc, cfg, n, slug, expect}. fn returning false marks the step failed. Appends to runs/UC-NN-<cfg>.jsonl.
 */
export async function step(page, s, fn) {
  const errors = [], requests = [];
  const onC = (m) => { if (m.type() === "error") errors.push("console: " + m.text()); };
  const onE = (e) => errors.push("pageerror: " + e.message);
  const onF = (r) => requests.push(`FAILED ${r.method()} ${r.url()} ${r.failure()?.errorText || ""}`);
  const onR = (r) => { if (r.status() >= 400) requests.push(`${r.status()} ${r.request().method()} ${r.url()}`); };
  page.on("console", onC); page.on("pageerror", onE); page.on("requestfailed", onF); page.on("response", onR);
  let ok = true, result;
  try { result = await fn(); if (result === false) ok = false; }
  catch (e) { ok = false; errors.push("step threw: " + (e.message || e)); }
  page.off("console", onC); page.off("pageerror", onE); page.off("requestfailed", onF); page.off("response", onR);
  const dir = path.join(ORCH, "shots", s.uc, s.cfg);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${pad(s.n)}-${s.slug}.png`);
  try { await page.screenshot({ path: file, scale: "css" }); } catch (e) { errors.push("shot failed: " + e.message); }
  const rec = { uc: s.uc, cfg: s.cfg, n: s.n, slug: s.slug, expect: s.expect, ok, errors, requests, shot: file };
  mkdirSync(path.join(ORCH, "runs"), { recursive: true });
  appendFileSync(path.join(ORCH, "runs", `${s.uc}-${s.cfg}.jsonl`), JSON.stringify(rec) + "\n");
  console.log(`${ok ? "ok  " : "FAIL"} ${s.uc}/${s.cfg} ${pad(s.n)} ${s.slug}${errors.length ? "  [" + errors.length + " err]" : ""}`);
  if (!ok) failed++;
  return { ok, errors, requests, shot: file, result };
}
/** Truncate this run's jsonl (call at the start of a case script per config). */
export function startRun(uc, cfg) {
  mkdirSync(path.join(ORCH, "runs"), { recursive: true });
  writeFileSync(path.join(ORCH, "runs", `${uc}-${cfg}.jsonl`), "");
}

/** Tap on touch configs, click otherwise. sel = selector string or locator; cfg = a configs() entry or its name. */
export async function tapOrClick(page, sel, cfg, opts = {}) {
  const loc = typeof sel === "string" ? page.locator(sel).first() : sel;
  const touch = cfg === "webkit" || (cfg && cfg.touch);
  return touch ? loc.tap(opts) : loc.click(opts);
}

/** Public pages: language lives in localStorage "aliph-lang" ("ar" default, "en"); main.js reads it at load. */
export async function setLang(page, lang) {
  await page.evaluate((l) => localStorage.setItem("aliph-lang", l), lang);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1500); // curtain
}

export function check(name, ok, extra = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
}
export const done = () => { console.log(failed ? `${failed} FAILED` : "all passed"); process.exit(failed ? 1 : 0); };
