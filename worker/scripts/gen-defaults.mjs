#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   gen-defaults.mjs — what the site says TODAY, as JSON the Worker can read.

       npm run gen:defaults

   Writes worker/src/generated/{defaults,registry}.json from prototype/main.js
   and the three pages. Run it after touching a table in main.js or the media
   markup of index/about; worker/tests (tests/platform/registry.test.ts)
   fails when the committed files are stale.

   defaults.json  the tables the published store overrides, plus the media
                  slots as the HTML has them. The Worker never evaluates
                  main.js (workerd forbids `new Function`), it reads this.
   registry.json  the editable surface: every text key (I18N) with the pages
                  and section it appears in, its kind and its length ceiling;
                  every media slot with the default it was generated from.

   Kinds. text      one string per locale, set with textContent.
          richline  a string that carries intentional line breaks (\n) and
                    nothing else; never markup. Anything the Worker injects is
                    escaped text either way.

   maxLength = ceil(longest locale length × 1.6). It is what the editor may
   accept before FIT THE TYPE (shrinkToFit) would have to do something
   unreasonable, not a design limit.

   Slot ids are <page>.<kind>.<ordinal>, ordinal 1-based in document order:
     home.media.3   the third <img src="assets/media/…"> in index.html
     about.media.2  likewise in about.html
     home.film.1    FILM_FRAMES[0] (built by JS, no markup)
   Every slot carries the default src it was found with (and `preview`, the
   reel/film URL, when its figure has data-preview). Serve-time rewriting
   (P-06b) compares that against the element it is about to touch and skips
   a slot whose markup has moved on, so inserting an image above an existing
   one can never repaint the wrong picture.

   ⚠️ Output is deterministic (no dates, stable key order, LF): running it
   twice leaves no diff.
   ══════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evalTables } from "../src/shared/tables.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../..");
const PROTO = path.join(ROOT, "prototype");
const OUT = path.join(ROOT, "worker/src/generated");

/* file → page name used in ids and the registry */
export const PAGES = { "index.html": "home", "about.html": "about", "library.html": "library" };
/* the pages that have media slots */
const SLOT_PAGES = ["home", "about"];

const NAMES = [
  "I18N", "CATS", "SUBCATS", "MEDIA", "PROJECTS", "TESTIMONIALS", "AR_DIGITS",
  "RINGS", "FILM_FRAMES",
];

const read = (p) => fs.readFileSync(p, "utf8");

/* The nearest enclosing landmark's id (or first class) before `at`. Cheap and
   good enough to tell an editor where a string lives. */
function sectionAt(html, at) {
  const re = /<(section|header|footer|nav|article|aside|main)\b([^>]*)>/g;
  let m, last = null;
  while ((m = re.exec(html)) && m.index < at) last = m;
  if (!last) return "page";
  const id = /\bid="([^"]+)"/.exec(last[2]);
  const cls = /\bclass="([^"\s]+)/.exec(last[2]);
  return id ? id[1] : cls ? cls[1] : last[1];
}

function scanText(pages) {
  const uses = new Map(); // key → { pages:Set, section, text, label }
  for (const [file, page] of Object.entries(pages)) {
    const html = read(path.join(PROTO, file));
    const re = /\bdata-i18n(-label)?="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) {
      const key = m[2];
      const u = uses.get(key) || { pages: [], section: sectionAt(html, m.index), text: false, label: false };
      if (!u.pages.includes(page)) u.pages.push(page);
      if (m[1]) u.label = true; else u.text = true;
      uses.set(key, u);
    }
  }
  return uses;
}

function buildText(I18N, uses) {
  const entries = [];
  for (const key of Object.keys(I18N)) {
    const v = I18N[key];
    const lens = [v.ar, v.en].filter((s) => typeof s === "string").map((s) => s.length);
    const u = uses.get(key);
    const rich = [v.ar, v.en].some((s) => typeof s === "string" && s.includes("\n"));
    entries.push({
      key,
      page: u ? u.pages[0] : "js",
      pages: u ? u.pages : [],
      section: u ? u.section : "script",
      kind: rich ? "richline" : "text",
      uses: u ? [u.text && "text", u.label && "label"].filter(Boolean) : [],
      maxLength: Math.ceil(Math.max(...lens) * 1.6),
    });
  }
  return entries;
}

/* Every photograph in the markup: <img src="assets/media/…">. The logos and
   marks under assets/img are artwork, not content, so they get no slot. */
function scanMedia(html, page) {
  const slots = [];
  const re = /<img\b[^>]*?\bsrc="(assets\/media\/[^"]+)"[^>]*>/g;
  let m, n = 0;
  while ((m = re.exec(html))) {
    n++;
    const slot = { id: `${page}.media.${n}`, page, kind: "media", src: m[1] };
    /* the enclosing <figure>, when it is still open at the img */
    const fig = html.lastIndexOf("<figure", m.index);
    if (fig !== -1 && html.indexOf("</figure>", fig) > m.index) {
      const tag = html.slice(fig, html.indexOf(">", fig));
      const prev = /\bdata-preview="([^"]+)"/.exec(tag);
      if (prev) { slot.preview = prev[1]; slot.poster = m[1]; }
    }
    slots.push(slot);
  }
  return slots;
}

function buildSlots(T) {
  const slots = [];
  for (const file of Object.keys(PAGES)) {
    const page = PAGES[file];
    if (!SLOT_PAGES.includes(page)) continue;
    slots.push(...scanMedia(read(path.join(PROTO, file)), page));
  }
  T.FILM_FRAMES.forEach((fr, i) =>
    slots.push({ id: `home.film.${i + 1}`, page: "home", kind: "film", src: fr.src, svc: fr.svc })
  );
  return slots;
}

export function generate() {
  const T = evalTables(read(path.join(PROTO, "main.js")), NAMES);
  const uses = scanText(PAGES);
  const slots = buildSlots(T);
  const defaults = { ...T, slots };
  const registry = { text: buildText(T.I18N, uses), slots };
  return { defaults, registry };
}

const json = (o) => JSON.stringify(o, null, 2) + "\n";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { defaults, registry } = generate();
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "defaults.json"), json(defaults));
  fs.writeFileSync(path.join(OUT, "registry.json"), json(registry));
  console.log(
    `gen-defaults: ${registry.text.length} text keys, ${registry.slots.length} slots → worker/src/generated/`
  );
}
