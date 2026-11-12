#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   build_static.mjs — put the site's words INTO the HTML.

   Run from the repo root, before every deploy that touched main.js:

       node resources/build_static.mjs          # write
       node resources/build_static.mjs --check  # exit 1 if anything is stale

   WHY. Everything that says what the agency does — the nine service lines
   under the ring, the archive's categories and the three software projects,
   the four testimonials — lives in tables in prototype/main.js and is written
   into the page by JavaScript. Googlebot runs that JavaScript, late and on a
   budget. The AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bingbot's
   fetcher for ChatGPT) mostly do not: they read the HTML as served, and until
   2026-09-17 the served /library carried 59 words, none of them about the
   work. Asked "a creative agency in Jerusalem", a model fetching this site
   learned a title and a headline.

   WHAT. This script reads the SAME tables main.js renders from — I18N, CATS,
   SUBCATS, MEDIA, PROJECTS, TESTIMONIALS — and writes their Arabic into
   marked regions of the three pages:

     <!-- @static:NAME -->  …generated…  <!-- @/static:NAME -->

   Each region is content the page's JavaScript already replaces or removes
   when it builds the interactive version (accRoot.innerHTML = "",
   rebuildBand's track.innerHTML = "", writeWho's textContent, and one
   `#svcStatic` removal added to serviceRings for this). So the document has
   its words before a script runs, and the same words — moving — after. No
   hidden copy, no second source of truth: edit main.js, run this, deploy.

   It also appends a second JSON-LD block per page (the reviews on the home
   page, the project list on the archive), and rewrites sitemap.xml with each
   page's lastmod from git.

   ⚠️ Arabic ONLY, deliberately. The served page is `lang="ar"`; the English
   is a localStorage toggle with no URL of its own, so an English block here
   would be hidden duplicate copy on an Arabic page. Everything below takes
   a `lang` so an /en/ build is a second call, not a rewrite — that is the
   open item, not this one.

   ⚠️ The tables are EXTRACTED from main.js by bracket-matching `const NAME =`
   to its `;`, then evaluated. They are literals — strings, arrays, objects,
   comments — and must stay that way: a table that references a function or
   another binding fails loudly here rather than rendering wrong.

   ⚠️ SERVICES[].what/why/does is NOT rendered. The comment above
   renderServiceSections says that copy is prototype-invented and was never
   approved; the nine SUBCATS lines are what the ring shows and what the
   agency shortened by hand on 2026-08-31, so they are the service copy.
   ══════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
/* The extractor and the renderers live in worker/src/shared/ so the Worker
   renders the same regions from the published store (admin build). */
import { evalTables } from "../worker/src/shared/tables.mjs";
import { ORIGIN, fill, pageRegions } from "../worker/src/shared/regions.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "prototype");
const CHECK = process.argv.includes("--check");

/* ══════════ 1–5. the tables and the regions (worker/src/shared/) ══════════ */

const mainSrc = fs.readFileSync(path.join(SITE, "main.js"), "utf8");
const T = evalTables(mainSrc);
const PAGES = pageRegions(T);

let stale = [];
for (const [file, regions] of Object.entries(PAGES)) {
  const p = path.join(SITE, file);
  const before = fs.readFileSync(p, "utf8");
  let after = before;
  for (const [name, body] of Object.entries(regions)) after = fill(after, name, body, file);
  if (after !== before) {
    stale.push(file);
    if (!CHECK) fs.writeFileSync(p, after);
  }
}

/* ══════════ 6. the sitemap, lastmod from git ══════════ */

const today = new Date().toISOString().slice(0, 10);
function lastmod(file) {
  const rel = `prototype/${file}`;
  try {
    const dirty = execSync(`git status --porcelain -- "${rel}"`, { cwd: ROOT }).toString().trim();
    if (dirty || stale.includes(file)) return today;
    const d = execSync(`git log -1 --format=%cs -- "${rel}"`, { cwd: ROOT }).toString().trim();
    return d || today;
  } catch { return today; }
}
const URLS = [
  ["index.html", "/", "1.0"],
  ["library.html", "/library", "0.8"],
  ["about.html", "/about", "0.8"],
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(([f, u, pr]) => `  <url>
    <loc>${ORIGIN}${u}</loc>
    <lastmod>${lastmod(f)}</lastmod>
    <priority>${pr}</priority>
  </url>`).join("\n")}
</urlset>
`;
{
  const p = path.join(SITE, "sitemap.xml");
  const before = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  /* lastmod moves with every commit; only a changed <loc> set counts as stale
     for --check, otherwise the check fails on every clean tree */
  const locs = (s) => (s.match(/<loc>[^<]+<\/loc>/g) || []).join();
  if (locs(before) !== locs(sitemap)) stale.push("sitemap.xml");
  if (!CHECK && before !== sitemap) fs.writeFileSync(p, sitemap);
}

/* ══════════ 7. report ══════════ */

if (CHECK) {
  if (stale.length) {
    console.error(`stale: ${stale.join(", ")} — run node resources/build_static.mjs`);
    process.exit(1);
  }
  console.log("static regions current");
} else {
  console.log(stale.length ? `wrote: ${stale.join(", ")}` : "nothing changed");
  console.log(`  ${T.SUBCATS.design.length + T.SUBCATS.photo.length + T.SUBCATS.tech.length} service lines, ` +
    `${T.PROJECTS.length} projects, ${T.TESTIMONIALS.length} testimonials, ${T.MEDIA.length} media rows`);
}
