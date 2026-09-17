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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "prototype");
const ORIGIN = "https://aliphcreative.com";
const CHECK = process.argv.includes("--check");
const LANG = "ar";

/* ══════════ 1. the tables, out of main.js ══════════ */

const mainSrc = fs.readFileSync(path.join(SITE, "main.js"), "utf8");

/* Find `const NAME = ` at line start and return the source of its initialiser
   up to the `;` that closes it at bracket depth 0. Skips strings, template
   literals and both comment kinds so a `;` or bracket inside them does not
   count. */
function sliceConst(name) {
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

const NAMES = ["I18N", "CATS", "SUBCATS", "MEDIA", "PROJECTS", "TESTIMONIALS", "AR_DIGITS"];
const T = new Function(
  NAMES.map((n) => `const ${n} = ${sliceConst(n)};`).join("\n") +
  `\nreturn { ${NAMES.join(", ")} };`
)();

/* ══════════ 2. helpers, the page's own rules ══════════ */

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Arabic-Indic digits, the way main.js's num() writes every count and date. */
const num = (s) => String(s).replace(/\d/g, (d) => T.AR_DIGITS[d]);

/* The title rule, copied from testimonials.who(): the name is the big line
   and the business the small one; with no name the business is the big line
   and there is no small one. Never the service. */
const who = (e) => e.name
  ? { big: e.name[LANG], small: e.business[LANG] }
  : { big: e.business[LANG], small: "" };

const t = (e, k) => (e[k] ? e[k][LANG] : "");

/* ══════════ 3. the blocks ══════════ */

/* home — the nine service lines, filed under their three services, and the
   three projects under the service they belong to. Removed by serviceRings
   the moment the rings are built. */
function servicesBlock() {
  const svc = T.CATS.filter((c) => c.id !== "all");
  return svc.map((cat) => {
    const subs = (T.SUBCATS[cat.id] || []).map((s) => `
      <li>
        <h4>${esc(s[LANG])}</h4>
        <p>${esc(s.desc[LANG])}</p>
      </li>`).join("");
    const projects = T.PROJECTS.filter((p) => p.cat === cat.id).map((p) => `
      <li><a href="library.html">${esc(p[LANG])}</a> — ${esc(p.desc[LANG])}</li>`).join("");
    return `
    <section class="svc-static-item">
      <h3>${esc(cat[LANG])}</h3>
      <ul class="svc-static-subs">${subs}
      </ul>${projects ? `
      <ul class="svc-static-projects">${projects}
      </ul>` : ""}
    </section>`;
  }).join("");
}

/* home — the band's cards, the same markup card() builds minus the scrap
   variables it sets on each. rebuildBand() empties the track at load. */
function bandBlock() {
  return T.TESTIMONIALS.map((e) => {
    const w = who(e);
    return `
      <figure class="tb-card">
        <figcaption class="tb-who"><span class="tb-name">${esc(w.big)}</span>${w.small ? `<span class="tb-biz">${esc(w.small)}</span>` : ""}</figcaption>
        <blockquote class="tb-quote">${esc(t(e, "quote"))}</blockquote>
      </figure>`;
  }).join("");
}

/* archive — one panel per service with its runs and counts, and the software
   projects in full: name, tagline, line, body, and the live site. This is the
   library's LIBSUBS filing, not the SUBCATS taxonomy — see renderLibrary. */
function archiveBlock() {
  const byNewest = (a, b) =>
    (b.d || "").localeCompare(a.d || "") || (a.key || "").localeCompare(b.key || "");
  const runsOf = {
    design: [{ ar: "إعلانات رقمية", of: () => true }],
    photo: [
      { ar: "فيديوهات", of: (r) => !!(r.m && r.m.v) },
      { ar: "صور", of: (r) => !!(r.m && !r.m.v) },
    ],
    tech: [
      { ar: "مواقع", of: (r) => !!(r.p && r.p.profile.kind === "site") },
      { ar: "تطبيقات", of: (r) => !!(r.p && r.p.profile.kind === "app") },
    ],
  };
  const svc = T.CATS.filter((c) => c.id !== "all");
  return svc.map((cat) => {
    const media = T.MEDIA.filter((m) => m.c === cat.id).map((m) => ({ d: m.d, key: m.f, m }));
    const projects = cat.id === "tech"
      ? T.PROJECTS.filter((p) => p.cat === "tech" && p.profile).map((p) => ({ d: p.date, key: p.en, p }))
      : [];
    const items = [...media, ...projects].sort(byNewest);
    if (!items.length) return "";
    const claimed = new Set();
    const runs = [];
    (runsOf[cat.id] || []).forEach((sub) => {
      const list = items.filter((r) => !claimed.has(r) && sub.of(r));
      list.forEach((r) => claimed.add(r));
      if (list.length) runs.push({ sub, list });
    });
    const rest = items.filter((r) => !claimed.has(r));
    if (rest.length) runs.push({ sub: null, list: rest });

    const runHTML = runs.map((run) => {
      const projs = run.list.filter((r) => r.p).map(({ p }) => `
          <article class="acc-static-project">
            <h4>${esc(p[LANG])}</h4>
            <p class="acc-static-tag">${esc(p.profile.tagline[LANG])}</p>
            <p>${esc(p.desc[LANG])}</p>
            <p>${esc(p.profile.body[LANG])}</p>
            ${p.profile.url ? `<p><a href="${esc(p.profile.url)}" rel="noopener">${esc(T.I18N.pfVisit ? T.I18N.pfVisit[LANG] : "زيارة الموقع")}</a></p>` : ""}
          </article>`).join("");
      const n = run.list.length;
      return `
        <section class="acc-static-run">
          ${run.sub ? `<h3>${esc(run.sub[LANG])} <span class="acc-static-count">${num(n)}</span></h3>` : ""}${projs}
        </section>`;
    }).join("");

    return `
    <section class="acc-panel acc-static" data-cat="${cat.id}">
      <h2>${esc(cat[LANG])} <span class="acc-static-count">${num(items.length)}</span></h2>${runHTML}
    </section>`;
  }).join("");
}

/* ══════════ 4. the second JSON-LD block per page ══════════ */

const ORG_ID = `${ORIGIN}/#org`;

function reviewsLD() {
  return {
    "@context": "https://schema.org",
    "@id": ORG_ID,
    "@type": "ProfessionalService",
    "review": T.TESTIMONIALS.map((e) => ({
      "@type": "Review",
      "inLanguage": LANG,
      "reviewBody": t(e, "quote"),
      "author": e.name
        ? { "@type": "Person", "name": e.name[LANG], "worksFor": { "@type": "Organization", "name": e.business[LANG] } }
        : { "@type": "Organization", "name": e.business[LANG] },
      "itemReviewed": { "@id": ORG_ID },
    })),
  };
}

function projectsLD() {
  const projects = T.PROJECTS.filter((p) => p.profile);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${ORIGIN}/library#projects`,
    "name": T.CATS.find((c) => c.id === "tech")[LANG],
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": projects.length,
    "itemListElement": projects
      .slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": p.profile.kind === "app" ? "SoftwareApplication" : "WebSite",
          "name": p[LANG],
          "alternateName": p.en,
          "description": p.desc[LANG],
          "url": p.profile.url,
          "dateCreated": p.date,
          "inLanguage": LANG,
          "creator": { "@id": ORG_ID },
        },
      })),
  };
}

const ldScript = (obj) =>
  `<script type="application/ld+json">\n${JSON.stringify(obj, null, 1)}\n</script>`;

/* ══════════ 5. write the regions ══════════ */

const STAMP = "<!-- generated by resources/build_static.mjs from main.js — edit the tables there, then run it -->";

function fill(html, name, body, file) {
  const open = `<!-- @static:${name} -->`;
  const close = `<!-- @/static:${name} -->`;
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  if (a < 0 || b < 0 || b < a) throw new Error(`${file}: region @static:${name} missing or malformed`);
  if (html.indexOf(open, a + 1) >= 0) throw new Error(`${file}: region @static:${name} appears twice`);
  const inner = body.includes("\n") ? `\n${STAMP}${body}\n` : body;
  return html.slice(0, a + open.length) + inner + html.slice(b);
}

const first = T.TESTIMONIALS[0];
const w0 = who(first);

const PAGES = {
  "index.html": {
    services: servicesBlock(),
    tcName: esc(w0.big),
    tcBiz: esc(w0.small),
    tcQuote: esc(t(first, "quote")),
    trName: esc(w0.big),
    trBiz: esc(w0.small),
    trQuote: esc(t(first, "quote")),
    band: bandBlock(),
    ld: ldScript(reviewsLD()),
  },
  "library.html": {
    archive: archiveBlock(),
    ld: ldScript(projectsLD()),
  },
};

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
