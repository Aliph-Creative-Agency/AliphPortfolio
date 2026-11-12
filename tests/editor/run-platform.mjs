// Runs one of the platform checks (visual | parity-live) on the editor team's
// ports. The originals hardcode 8831/9231; this writes a port-patched copy next
// to them in tests/editor/ (same depth, so their ROOT still resolves), runs it
// and deletes it.
//   node tests/editor/run-platform.mjs visual [args…]
//   node tests/editor/run-platform.mjs parity-live [args…]
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const [name, ...rest] = process.argv.slice(2);
if (!["visual", "parity-live"].includes(name)) {
  console.error("usage: run-platform.mjs <visual|parity-live> [args]");
  process.exit(2);
}
const src = readFileSync(path.join(here, "..", "platform", `${name}.mjs`), "utf8");
const patched = src.replace("PORT = 8831, INSPECTOR = 9231", "PORT = 8841, INSPECTOR = 9241");
if (patched === src) {
  console.error("port line not found in the platform script; update run-platform.mjs");
  process.exit(2);
}
const copy = path.join(here, `_${name}.mjs`);
writeFileSync(copy, patched);
let code = 1;
try {
  code = spawnSync(process.execPath, [copy, ...rest], { stdio: "inherit" }).status ?? 1;
} finally {
  rmSync(copy, { force: true });
}
process.exit(code);
