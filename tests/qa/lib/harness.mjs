// QA harness: local wrangler dev on 8881/9281, Edge + WebKit launchers, shots, console watcher, check/done.
// Local D1/R2 only. Never --remote.
import { spawn, execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, webkit, devices } from "playwright-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const ORCH = "D:/Personal/Projects/aliph-portfolio/.orchestration/teams/qa";
export const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
export const PORT = 8881, INSPECTOR = 9281;
export const ORIGIN = `http://127.0.0.1:${PORT}`;
export const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
export const WEBKIT = path.join(process.env.LOCALAPPDATA || "", "ms-playwright/webkit-2359/Playwright.exe");
const WRANGLER = path.join(ROOT, "node_modules/wrangler/bin/wrangler.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startDev() {
  // migrations first (local D1 only; --local is explicit)
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

/** Headless Edge, desktop by default. */
export async function edge(viewport = VIEWPORTS.desktop, ctxOpts = {}) {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const context = await browser.newContext({ viewport, ...ctxOpts });
  return { browser, context, page: await context.newPage() };
}

/** WebKit as an iPhone 390x844 (isMobile, hasTouch, dsf 3). Pass a viewport to override the size only. */
export async function webkit_(viewport = VIEWPORTS.phone, ctxOpts = {}) {
  // playwright-core 1.64.1 wants webkit-2370; only webkit-2359 is on disk, so pass its exe explicitly
  const browser = await webkit.launch({ headless: true, executablePath: WEBKIT });
  const ctx = { viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: devices["iPhone 13"].userAgent, ...ctxOpts };
  const context = await browser.newContext(ctx);
  return { browser, context, page: await context.newPage() };
}
export { webkit_ as webkit };

export function shot(page, name) {
  const dir = path.join(ORCH, "shots");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name.endsWith(".png") ? name : name + ".png");
  return page.screenshot({ path: file }).then(() => file);
}

/** Collects console errors + pageerrors; returns { errors }. */
export function watch(page) {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  return { errors };
}

let failed = 0;
export function check(name, ok, extra = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
}
export const done = () => {
  console.log(failed ? `${failed} FAILED` : "all passed");
  process.exit(failed ? 1 : 0);
};
