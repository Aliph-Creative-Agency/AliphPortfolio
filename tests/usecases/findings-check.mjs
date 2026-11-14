// Checks the findings registry against the case scripts.
// node tests/usecases/findings-check.mjs   (exit 1 on any problem)
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { FINDINGS, bucketCounts, nextFreeId } from "./lib/findings.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const problems = [];
const ids = new Set();
for (const x of FINDINGS) {
  if (ids.has(x.id)) problems.push(`duplicate id ${x.id}`);
  ids.add(x.id);
  if (!/^U-\d\d$/.test(x.id)) problems.push(`bad id ${x.id}`);
  if (!["LAUNCH", "SOON", "COSMETIC", "NOT"].includes(x.bucket)) problems.push(`${x.id}: bad bucket ${x.bucket}`);
  if (!x.shot) problems.push(`${x.id}: no shot`);
  if (!x.title) problems.push(`${x.id}: no title`);
}
// known ids used by the scripts: any "U-NN" string literal (known("U-NN"..), known.bind(null, "U-NN"..), smallId args)
for (const file of readdirSync(dir).filter((n) => /^uc-.*\.mjs$/.test(n))) {
  const src = readFileSync(join(dir, file), "utf8");
  for (const m of src.matchAll(/["'`](U-\d+)["'`]/g)) if (!ids.has(m[1])) problems.push(`${file}: ${m[1]} is not in findings.mjs`);
}
const n = bucketCounts();
console.log(`findings: ${FINDINGS.length} entries; LAUNCH ${n.LAUNCH}, SOON ${n.SOON}, COSMETIC ${n.COSMETIC} (NOT excluded: ${FINDINGS.filter((x) => x.bucket === "NOT").length})`);
console.log(`next free id: ${nextFreeId()}`);
if (problems.length) { for (const p of problems) console.log("FAIL " + p); process.exit(1); }
console.log("findings-check ok");
