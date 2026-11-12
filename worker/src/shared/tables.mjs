/* ══════════════════════════════════════════════════════════════════
   The tables, out of main.js — shared by resources/build_static.mjs and the
   Worker's generators (worker/scripts/). Plain ESM, no fs: callers read the
   file and pass its source in.

   ⚠️ evalTables() uses `new Function`, which workerd forbids. It runs in
   NODE only (the build script, the generators, the vitest config). The
   Worker gets the tables as JSON (worker/src/generated/) and only ever runs
   the renderers in ./regions.mjs.
   ══════════════════════════════════════════════════════════════════ */

/* Find `const NAME = ` at line start and return the source of its initialiser
   up to the `;` that closes it at bracket depth 0. Skips strings, template
   literals and both comment kinds so a `;` or bracket inside them does not
   count. */
export function sliceConst(mainSrc, name) {
  const re = new RegExp(`^const ${name} = `, "m");
  const m = re.exec(mainSrc);
  if (!m) throw new Error(`main.js: no \`const ${name} =\``);
  let i = m.index + m[0].length;
  const start = i;
  let depth = 0;
  while (i < mainSrc.length) {
    const c = mainSrc[i];
    const two = mainSrc.slice(i, i + 2);
    if (two === "/*") { i = mainSrc.indexOf("*/", i + 2) + 2; continue; }
    if (two === "//") { i = mainSrc.indexOf("\n", i); continue; }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < mainSrc.length && mainSrc[i] !== q) { if (mainSrc[i] === "\\") i++; i++; }
      i++;
      continue;
    }
    if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === ";" && depth === 0) return mainSrc.slice(start, i);
    i++;
  }
  throw new Error(`main.js: \`const ${name}\` never closes`);
}

/* The tables build_static renders from. */
export const TABLE_NAMES = ["I18N", "CATS", "SUBCATS", "MEDIA", "PROJECTS", "TESTIMONIALS", "AR_DIGITS"];

/* Evaluate the named `const` initialisers of main.js and return them as one
   object. They are literals and must stay that way: a table that references
   a function or another binding fails loudly here. */
export function evalTables(mainSrc, names = TABLE_NAMES) {
  return new Function(
    names.map((n) => `const ${n} = ${sliceConst(mainSrc, n)};`).join("\n") +
    `\nreturn { ${names.join(", ")} };`
  )();
}
