// main.js's boot-merge block must hold worker/src/shared/merge.mjs verbatim (minus `export `): the Worker and the
// browser run the same merge. Fails with the first differing line.   node tests/platform/merge-sync.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const mj = read("worker/src/shared/merge.mjs");
const copy = mj.slice(mj.indexOf("const LOCALES")).replace(/^export /gm, "").trimEnd().split("\n");
const js = read("prototype/main.js");
const open = js.indexOf("/* ══ admin content merge ══");
const close = js.indexOf("/* ══ end admin content merge ══ */");
if (open < 0 || close < open) { console.log("MERGE SYNC FAILED: fence not found in main.js"); process.exit(1); }
const block = js.slice(open, close).split("\n");
const at = block.indexOf(copy[0]);
if (at < 0) { console.log("MERGE SYNC FAILED: merge.mjs's first line is not in the block"); process.exit(1); }
for (let i = 0; i < copy.length; i++) {
  if (block[at + i] !== copy[i]) {
    console.log(`MERGE SYNC FAILED at merge.mjs line ${i + 1} of the copy:\n  merge.mjs: ${copy[i]}\n  main.js:   ${block[at + i]}`);
    process.exit(1);
  }
}
if (js.split("/* ══ admin content merge ══").length !== 2) { console.log("MERGE SYNC FAILED: the fence appears more than once"); process.exit(1); }
console.log(`merge in sync (${copy.length} lines)`);
