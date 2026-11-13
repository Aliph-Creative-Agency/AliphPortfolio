// The @static:* SEO regions re-rendered from the published store (P-08), so
// the words a crawler reads before any script runs are the published ones:
// the service lines and the band, the first testimonial and the reviews
// JSON-LD on the home page, the archive and the project list on /library.
//
// The tables are defaults.json + the published snapshot, merged by the ONE
// merge main.js also runs at boot (shared/merge.mjs), and rendered by the same
// renderers build_static writes the regions with (shared/regions.mjs). So the
// markup never changes, only the words and counts inside it, and a region
// whose output is the default's is left alone, byte for byte.
//
// Streaming only, in the same HTMLRewriter pass as text and slots: the open
// marker comment gets the new inner HTML right after it (the exact bytes
// fill() writes: regionInner), and every comment, text chunk and element up
// to the close marker is removed. Both markers stay.
// ⚠️ A region is consumed until its close marker. check:site (fill() throws on
// a missing or doubled marker) and regions-shared.test.ts keep the markers
// sound; a page whose region never closes would lose its tail here.

import defaults from "../generated/defaults.json";
import { mergeContent } from "../shared/merge.mjs";
import { pageRegions, regionInner, type Tables } from "../shared/regions.mjs";
import type { Snapshot } from "../store";
import type { Page } from "./text";

const FILE: Partial<Record<Page, string>> = { home: "index.html", library: "library.html" };

/* The tables the renderers read (TABLE_NAMES) plus META, copied per merge. */
const NAMES = ["I18N", "CATS", "SUBCATS", "MEDIA", "PROJECTS", "TESTIMONIALS", "AR_DIGITS", "META"] as const;
const D = defaults as unknown as Tables;

/** Does the snapshot touch anything a region reads? Text that only an
 *  element or the head shows (P-06) and slots never do. Clients alone never
 *  do either: a client is listed only with a piece, and a piece names its
 *  client through a gallery row (defaults carry no `client`). */
export function touchesRegions(s: Snapshot): boolean {
  if (s.gallery.length) return true;
  return Object.keys(s.text).some((k) => k === "pfVisit" || /^(subcat|project|testimonial)\./.test(k));
}

/** defaults.json + the published snapshot, as the renderers' tables, plus
 *  T.CLIENTS = the published clients, for the archive's client list (C-15).
 *  The shared merge has no CLIENTS table: main.js builds its own from the blob. */
export function mergedTables(s: Snapshot): Tables {
  const T: Tables = {};
  for (const n of NAMES) T[n] = structuredClone(D[n]);
  mergeContent(T, s);
  T.CLIENTS = structuredClone(s.clients);
  return T;
}

let defaultRegions: Record<string, Record<string, string>> | undefined;

/** The regions of `file` whose published output differs from the default. */
export function changedRegions(s: Snapshot, file: string): Map<string, string> {
  const out = new Map<string, string>();
  if (!touchesRegions(s)) return out;
  defaultRegions ??= pageRegions(D);
  const now = pageRegions(mergedTables(s))[file] ?? {};
  for (const [name, body] of Object.entries(now)) {
    if (body !== defaultRegions[file]?.[name]) out.set(name, body);
  }
  return out;
}

const MARKER = /^ @(\/?)static:([A-Za-z]+) $/;

/** Add the region handlers for `page` to a rewriter; no-op when nothing a
 *  region reads is published (or the page has no regions). */
export function onRegions(rw: HTMLRewriter, s: Snapshot, page: Page): void {
  const file = FILE[page];
  if (!file) return;
  const want = changedRegions(s, file);
  if (!want.size) return;

  let inside: string | null = null;
  rw.onDocument({
    comments(c) {
      const m = MARKER.exec(c.text);
      if (inside) {
        if (m && m[1] === "/" && m[2] === inside) inside = null;
        else c.remove();
        return;
      }
      if (m && m[1] === "" && want.has(m[2])) {
        inside = m[2];
        c.after(regionInner(want.get(m[2])!), { html: true });
      }
    },
    text(t) {
      if (inside) t.remove();
    },
  });
  rw.on("*", {
    element(el) {
      if (inside) el.remove();
    },
  });
}
