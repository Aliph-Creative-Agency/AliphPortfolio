// Runs `npm test` N times (vitest JSON reporter) into ORCH/runs/census-<n>.json and tables failures.
//   node tests/qa/flaky-census.mjs 10 [--shuffle]
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, ORCH } from "./lib/harness.mjs";

const n = Number(process.argv[2]) || 10;
const shuffle = process.argv.includes("--shuffle");
const tag = shuffle ? "shuf" : "census";
const dir = path.join(ORCH, "runs");
mkdirSync(dir, { recursive: true });
const fails = new Map(); // "file > test" -> { count, first }
let totalFiles = 0;
for (let i = 1; i <= n; i++) {
  const out = path.join(dir, `${tag}-${i}.json`);
  const args = ["vitest", "run", "-c", "worker/vitest.config.ts", "--reporter=json", `--outputFile=${out}`];
  if (shuffle) args.push("--sequence.shuffle");
  const t0 = Date.now();
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", args, { cwd: ROOT, encoding: "utf8", shell: true });
  let bad = 0;
  if (existsSync(out)) {
    const j = JSON.parse(readFileSync(out, "utf8"));
    totalFiles = j.testResults.length;
    for (const f of j.testResults) {
      const file = path.relative(ROOT, f.name).replaceAll("\\", "/");
      if (f.status === "failed" && !f.assertionResults.some((a) => a.status === "failed")) {
        const k = file + " > (suite failed to run)"; bad++;
        const e = fails.get(k) || { count: 0, first: (f.message || "").split("\n")[0] }; e.count++; fails.set(k, e);
      }
      for (const a of f.assertionResults) if (a.status === "failed") {
        bad++;
        const k = `${file} > ${a.fullName}`;
        const e = fails.get(k) || { count: 0, first: (a.failureMessages?.[0] || "").split("\n")[0] }; e.count++; fails.set(k, e);
      }
    }
  }
  console.log(`run ${i}/${n}: exit ${r.status}, ${bad} failing, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
console.log(`\n${n} runs${shuffle ? " (shuffled)" : ""}, ${totalFiles} test files`);
if (!fails.size) console.log("0 failures");
else for (const [k, v] of fails) console.log(`| ${k} | ${v.count}/${n} | ${v.first.slice(0, 160)} |`);
