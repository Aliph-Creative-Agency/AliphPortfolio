/* ══════════════════════════════════════════════════════════════════
   The @static:* region renderers — the Arabic that resources/build_static.mjs
   writes into the pages, and that the Worker re-renders when the published
   store changes a table they read. Plain ESM with no Node or Worker APIs:
   every renderer takes the tables (T) as an argument, so build_static passes
   the ones evaluated from main.js and the Worker passes defaults + overrides.
   Output must stay byte-identical to what build_static has always written —
   `node resources/build_static.mjs --check` is the test.
   ══════════════════════════════════════════════════════════════════ */

export const ORIGIN = "https://aliphcreative.com";
export const LANG = "ar";

/* ══════════ 2. helpers, the page's own rules ══════════ */

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Arabic-Indic digits, the way main.js's num() writes every count and date. */
const num = (T, s) => String(s).replace(/\d/g, (d) => T.AR_DIGITS[d]);

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
export function servicesBlock(T) {
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
export function bandBlock(T) {
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
export function archiveBlock(T) {
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
          ${run.sub ? `<h3>${esc(run.sub[LANG])} <span class="acc-static-count">${num(T, n)}</span></h3>` : ""}${projs}
        </section>`;
    }).join("");

    return `
    <section class="acc-panel acc-static" data-cat="${cat.id}">
      <h2>${esc(cat[LANG])} <span class="acc-static-count">${num(T, items.length)}</span></h2>${runHTML}
    </section>`;
  }).join("");
}

/* ══════════ 4. the second JSON-LD block per page ══════════ */

const ORG_ID = `${ORIGIN}/#org`;

export function reviewsLD(T) {
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

export function projectsLD(T) {
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

export const ldScript = (obj) =>
  `<script type="application/ld+json">\n${JSON.stringify(obj, null, 1)}\n</script>`;

/* ══════════ 5. write the regions ══════════ */

export const STAMP = "<!-- generated by resources/build_static.mjs from main.js — edit the tables there, then run it -->";

/* What goes between a region's markers: a block body gets the stamp and its
   own lines, an inline one (a name inside a <p>) goes in as it is. The
   Worker's streaming replacement (render/regions.ts) writes the same bytes. */
export const regionInner = (body) => (body.includes("\n") ? `\n${STAMP}${body}\n` : body);

export function fill(html, name, body, file) {
  const open = `<!-- @static:${name} -->`;
  const close = `<!-- @/static:${name} -->`;
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  if (a < 0 || b < 0 || b < a) throw new Error(`${file}: region @static:${name} missing or malformed`);
  if (html.indexOf(open, a + 1) >= 0) throw new Error(`${file}: region @static:${name} appears twice`);
  return html.slice(0, a + open.length) + regionInner(body) + html.slice(b);
}

/* Every region of every page, as { file: { region: html } } — what
   build_static writes and what the Worker re-renders when the published
   store touches a table. */
export function pageRegions(T) {
  const first = T.TESTIMONIALS[0];
  const w0 = who(first);

  return {
    "index.html": {
      services: servicesBlock(T),
      /* the cutting's three regions went with the section itself on
         2026-09-22 — see HANDOFF, _Session 2026-09-22_ */
      trName: esc(w0.big),
      trBiz: esc(w0.small),
      trQuote: esc(t(first, "quote")),
      band: bandBlock(T),
      ld: ldScript(reviewsLD(T)),
    },
    "library.html": {
      archive: archiveBlock(T),
      ld: ldScript(projectsLD(T)),
    },
  };
}
