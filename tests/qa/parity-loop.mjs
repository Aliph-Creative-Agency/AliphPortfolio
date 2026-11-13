// Q-04: empty-store parity. Runs tests/platform/parity-live.mjs once and tests/platform/visual.mjs N times on the
// QA ports, keeps each run's shots, records per-shot diff % into ORCH/runs/visual-<n>.json, and for every shot that
// differs at all locates the differing pixels (bounding box, rows/cols, how many separate blobs) and writes a
// red-overlay diff image of the first library-desktop difference into ORCH/shots/Q-04-*.png.
//   node tests/qa/parity-loop.mjs [N=5] [--no-parity]
// Exit 1 if parity-live fails or any visual run fails for a reason other than the known flake F-04.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { ROOT, ORCH, EDGE } from "./lib/harness.mjs";

const N = Number(process.argv[2]) || 5;
const RUNS = path.join(ORCH, "runs"), SHOTS = path.join(ORCH, "shots");
mkdirSync(RUNS, { recursive: true }); mkdirSync(SHOTS, { recursive: true });
const env = { ...process.env, PORT: "8881", INSPECTOR: "9281" };
const sh = (script) => spawnSync(process.execPath, [script], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 1 << 26 });
let failed = 0;

if (!process.argv.includes("--no-parity")) {
  const p = sh("tests/platform/parity-live.mjs");
  writeFileSync(path.join(RUNS, "parity-live.log"), p.stdout + p.stderr);
  const last = (p.stdout.trim().split("\n").pop() || "");
  console.log(`parity-live: exit ${p.status} — ${last}`);
  if (p.status !== 0) failed++;
}

// Where do two PNGs differ? Same metric as visual.mjs (sum |dR|+|dG|+|dB| > 24), plus geometry and an overlay.
async function locate(page, a, b, overlayPath) {
  return page.evaluate(async ([a, b, wantOverlay]) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const W = ia.width, H = ia.height;
    const px = (img) => { const c = document.createElement("canvas"); c.width = W; c.height = H;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data; };
    const da = px(ia), db = px(ib);
    let bad = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
    const mask = new Uint8Array(W * H);
    for (let i = 0, p = 0; i < da.length; i += 4, p++) {
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) {
        bad++; mask[p] = 1; const x = p % W, y = (p / W) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    // blobs: 8-connected components on a 4px grid (cheap, enough to tell "one tile" from "scattered text AA")
    const G = 4, gw = Math.ceil(W / G), gh = Math.ceil(H / G), cell = new Uint8Array(gw * gh);
    for (let p = 0; p < mask.length; p++) if (mask[p]) cell[((p / W / G) | 0) * gw + (((p % W) / G) | 0)] = 1;
    let blobs = 0; const boxes = [];
    for (let c = 0; c < cell.length; c++) if (cell[c] === 1) {
      blobs++; let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1; const st = [c]; cell[c] = 2;
      while (st.length) { const q = st.pop(), qx = q % gw, qy = (q / gw) | 0;
        bx0 = Math.min(bx0, qx); by0 = Math.min(by0, qy); bx1 = Math.max(bx1, qx); by1 = Math.max(by1, qy);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const n = ny * gw + nx; if (cell[n] === 1) { cell[n] = 2; st.push(n); } } }
      if (boxes.length < 6) boxes.push([bx0 * G, by0 * G, (bx1 + 1) * G, (by1 + 1) * G]);
    }
    let overlay = null;
    if (wantOverlay && bad) {
      const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
      x.globalAlpha = 0.35; x.drawImage(ib, 0, 0); x.globalAlpha = 1;
      const im = x.getImageData(0, 0, W, H);
      for (let p = 0; p < mask.length; p++) if (mask[p]) { im.data[p * 4] = 255; im.data[p * 4 + 1] = 0; im.data[p * 4 + 2] = 0; im.data[p * 4 + 3] = 255; }
      x.putImageData(im, 0, 0); x.strokeStyle = "#f0f"; x.lineWidth = 3;
      x.strokeRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
      overlay = c.toDataURL("image/png").split(",")[1];
    }
    return { bad, total: W * H, box: bad ? [x0, y0, x1, y1] : null, blobs, boxes, overlay };
  }, [a, b, !!overlayPath]);
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
const table = [];
let overlayDone = false;
try {
  for (let n = 1; n <= N; n++) {
    const t0 = Date.now();
    const v = sh("tests/platform/visual.mjs");
    const lines = v.stdout.split("\n");
    const rows = [];
    const dir = path.join(RUNS, `visual-${n}`);
    rmSync(dir, { recursive: true, force: true });
    for (const k of ["baseline", "current"]) cpSync(path.join(ROOT, ".wrangler", "visual", k), path.join(dir, k), { recursive: true });
    for (const l of lines) {
      const m = l.match(/^(ok|FAIL)\s+(\S+)\s+([\d.]+)% \((\d+)\/(\d+)\)/);
      if (!m) continue;
      const row = { shot: m[2], ok: m[1] === "ok", pct: Number(m[3]), bad: Number(m[4]) };
      if (row.bad > 0) {
        const want = !overlayDone && row.shot.startsWith("library-desktop");
        const out = want ? path.join(SHOTS, `Q-04-${row.shot}-diff-run${n}.png`) : null;
        const loc = await locate(page, readFileSync(path.join(dir, "baseline", row.shot + ".png")).toString("base64"),
          readFileSync(path.join(dir, "current", row.shot + ".png")).toString("base64"), out);
        if (loc.overlay) { writeFileSync(out, Buffer.from(loc.overlay, "base64")); overlayDone = true; row.overlay = out; }
        Object.assign(row, { box: loc.box, blobs: loc.blobs, boxes: loc.boxes });
      }
      rows.push(row);
    }
    const reqFail = lines.filter((l) => l.startsWith("FAIL request order"));
    const verdict = lines.find((l) => /^VISUAL (OK|FAILED)/.test(l)) || `exit ${v.status} (no verdict)`;
    writeFileSync(path.join(RUNS, `visual-${n}.json`), JSON.stringify({ run: n, exit: v.status, verdict, reqFail, rows,
      seconds: Math.round((Date.now() - t0) / 1000), stderrTail: v.stderr.slice(-800) }, null, 1));
    table.push({ n, verdict, rows, reqFail });
    console.log(`visual run ${n}: ${verdict} (${Math.round((Date.now() - t0) / 1000)}s)`);
    for (const r of rows) if (r.bad) console.log(`   ${r.ok ? "ok  " : "FAIL"} ${r.shot} ${r.pct}% (${r.bad}px) box=${JSON.stringify(r.box)} blobs=${r.blobs} ${JSON.stringify(r.boxes)}`);
    for (const l of reqFail) console.log("   " + l);
    // F-04: library-desktop-ar alone over the gate = one R2 tile painted in another decode state (both builds do it)
    const bad = rows.filter((r) => !r.ok).map((r) => r.shot);
    if (v.status !== 0 && !reqFail.length && bad.length === 1 && bad[0] === "library-desktop-ar") console.log("   KNOWN F-04");
    else if (v.status !== 0) failed++;
  }
} finally { await browser.close(); }

// shot x run matrix of diff %
const shots = [...new Set(table.flatMap((t) => t.rows.map((r) => r.shot)))];
console.log("\n| shot | " + table.map((t) => "run " + t.n).join(" | ") + " |");
console.log("|---|" + table.map(() => "---").join("|") + "|");
for (const s of shots) console.log(`| ${s} | ` + table.map((t) => { const r = t.rows.find((x) => x.shot === s); return r ? r.pct.toFixed(4) + (r.ok ? "" : " FAIL") : "-"; }).join(" | ") + " |");
process.exit(failed ? 1 : 0);
