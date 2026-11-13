// Q-03: reproduces the order-dependent tests found by the Q-02 shuffle census.
// Runs each suspect file alone with vitest's shuffle at fixed seeds 1..S, so a
// failing seed is a one-line repro command:
//   npx vitest run -c worker/vitest.config.ts <file> --sequence.shuffle --sequence.seed=<s>
//   node tests/qa/flaky-repro.mjs [S=10] [file ...]
// Prints per test: failing seeds, rate, first error line. JSON in ORCH/runs/repro-*.json.
// Exit 0 always (it measures, it does not gate).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { ROOT, ORCH } from "./lib/harness.mjs";

const S = Number(process.argv[2]) || 10;
const picked = process.argv.slice(3);
const FILES = picked.length
  ? picked
  : [
      "tests/gallery/rings.test.ts",
      "tests/gallery/items.test.ts",
      "tests/clients/routes.test.ts",
      "tests/platform/publish-cache.test.ts",
    ];
const dir = path.join(ORCH, "runs");
mkdirSync(dir, { recursive: true });

for (const file of FILES) {
  const fails = new Map(); // test -> { seeds: [], first }
  for (let s = 1; s <= S; s++) {
    const out = path.join(dir, `repro-${path.basename(file, ".test.ts")}-${s}.json`);
    rmSync(out, { force: true });
    const args = ["vitest", "run", "-c", "worker/vitest.config.ts", file, "--sequence.shuffle", `--sequence.seed=${s}`,
      "--reporter=json", `--outputFile=${out}`];
    spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", args, { cwd: ROOT, encoding: "utf8", shell: true });
    if (!existsSync(out)) { console.log(`${file} seed ${s}: no report`); continue; }
    for (const f of JSON.parse(readFileSync(out, "utf8")).testResults)
      for (const a of f.assertionResults) if (a.status === "failed") {
        const e = fails.get(a.fullName) || { seeds: [], first: (a.failureMessages?.[0] || "").split("\n")[0] };
        e.seeds.push(s); fails.set(a.fullName, e);
      }
  }
  console.log(`\n${file} (${S} seeds)`);
  if (!fails.size) console.log("  0 failures");
  for (const [t, v] of fails)
    console.log(`  | ${t} | ${v.seeds.length}/${S} seeds [${v.seeds.join(",")}] | ${v.first.slice(0, 140)} |`);
}
