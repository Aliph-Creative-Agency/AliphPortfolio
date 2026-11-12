// Live parity: serve the site assets-only (today's deployment shape) on 8831,
// capture a set of URLs, stop it, serve the Worker build on 8831, capture the
// same URLs and compare status / content-type / location / body bytes.
//   node tests/platform/parity-live.mjs
import { spawn, execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = 8831, INSPECTOR = 9231;
const BASE = `http://127.0.0.1:${PORT}`;
const URLS = ["/", "/about", "/about/", "/library", "/index.html", "/about.html", "/style.css", "/main.js",
  "/robots.txt", "/sitemap.xml", "/assets/fonts/29LTIdris-FlatBold.woff2", "/assets/img/Aliph-Icon.svg", "/nope"];

// Today's wrangler.toml without `main` and without run_worker_first.
function assetsOnlyConfig() {
  let t = readFileSync(path.join(ROOT, "wrangler.toml"), "utf8");
  t = t.replace(/^main\s*=.*$/m, "").replace(/^binding\s*=.*$/m, "").replace(/^run_worker_first\s*=.*$/m, "");
  t = t.replace(/^directory\s*=.*$/m, `directory = ${JSON.stringify(path.join(ROOT, "prototype"))}`);
  mkdirSync(path.join(ROOT, ".wrangler"), { recursive: true });
  const p = path.join(ROOT, ".wrangler", "parity-assets-only.toml");
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
function stop(child) {
  try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" }); } catch {}
}
async function waitUp() {
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(BASE + "/style.css", { redirect: "manual" }); if (r.status) return; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev server did not come up");
}
async function capture() {
  const out = {};
  for (const u of URLS) {
    const r = await fetch(BASE + u, { redirect: "manual" });
    const buf = Buffer.from(await r.arrayBuffer());
    out[u] = { status: r.status, type: r.headers.get("content-type"), location: r.headers.get("location"),
      sha: createHash("sha256").update(buf).digest("hex").slice(0, 16), len: buf.length };
  }
  return out;
}
async function run(config) {
  const child = start(config);
  try { await waitUp(); return await capture(); } finally { stop(child); await new Promise((r) => setTimeout(r, 1500)); }
}

const before = await run(assetsOnlyConfig());
const after = await run(path.join(ROOT, "wrangler.toml"));
let bad = 0;
for (const u of URLS) {
  const a = JSON.stringify(before[u]), b = JSON.stringify(after[u]);
  if (a !== b) { bad++; console.log("DIFF", u, "\n  assets-only:", a, "\n  worker:     ", b); }
}
if (bad) { console.log(`PARITY FAILED (${bad}/${URLS.length})`); process.exit(1); }
console.log(`PARITY OK (${URLS.length} urls)`);
