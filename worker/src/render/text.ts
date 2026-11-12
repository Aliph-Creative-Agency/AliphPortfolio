// Published TEXT rendered into the served HTML (P-06), so a crawler and the
// first paint before main.js runs both see the edited copy.
//
// Streaming only (HTMLRewriter): no page is ever parsed whole. What changes,
// and only when the published snapshot is non-empty (index.ts decides; an
// empty store serves the assets response untouched, byte for byte):
//   [data-i18n="k"]          its content becomes the Arabic override of k
//                            (the served language is Arabic). Like main.js's
//                            applyI18n it replaces EVERYTHING inside, chips
//                            included — main.js rebuilds those at boot.
//   [data-i18n-label="k"]    aria-label, the same way.
//   <title>, meta description, og:/twitter: title + description
//                            from meta.<page>.* (CONTENT_API.md "Keys").
//   <script id="aliph-content" type="application/json">
//                            the whole published snapshot, placed right
//                            BEFORE <script src="main.js"> for the boot merge.
// Values are text, always: element content goes in as text (HTMLRewriter
// escapes it), attributes are escaped here, and the JSON can never close its
// own <script>. A `richline` value's \n stays a newline in the text, which is
// what main.js's textContent produces too.
//
// Conditional requests: a rewritten page is a different body from the asset,
// so it gets its own validator, W/"<asset etag>-r<publish rev>". A publish
// changes it; the asset's own 304 is never passed through for a rewritten
// page (the browser would keep the old copy).

import registry from "../generated/registry.json";
import type { Snapshot } from "../store";

export type Page = "home" | "about" | "library";

/** Which page a public URL is. null = not one of the three (never rewritten). */
export function pageOf(pathname: string): Page | null {
  const p = pathname.toLowerCase().replace(/\/+$/, "").replace(/\.html$/, "");
  if (p === "" || p === "/index") return "home";
  if (p === "/about") return "about";
  if (p === "/library") return "library";
  return null;
}

/** I18N keys only: meta.* and table fields never reach a data-i18n element. */
const I18N_KEYS = new Set((registry.text as { key: string }[]).map((t) => t.key));

/* Elements with no content to replace; a data-i18n on one is left alone. */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/** For attribute values. HTMLRewriter's setAttribute escapes only `"`, so
 *  `&` must be escaped here or `&lt;` in a value would reach the page as `<`. */
export const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** JSON that is safe inside <script>: no `<` (so no `</script` or `<!--`),
 *  no `>`/`&`, and no U+2028/2029. Still the same JSON once parsed. */
export const scriptJson = (v: unknown) =>
  JSON.stringify(v).replace(/[<>&\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

/** The snapshot main.js merges: what /api/content serves, without draft locks. */
function blob(s: Snapshot): string {
  const { locks: _locks, ...pub } = s;
  return scriptJson(pub);
}

/** The Arabic head values for a page; og/twitter follow the plain title and
 *  description unless they are overridden themselves (defaults are equal). */
function headOf(s: Snapshot, page: Page) {
  const ar = (f: string) => s.text[`meta.${page}.${f}`]?.ar;
  const title = ar("title");
  const description = ar("description");
  return { title, description, ogTitle: ar("ogTitle") ?? title, ogDescription: ar("ogDescription") ?? description };
}

const stripWeak = (etag: string) => etag.replace(/^W\//, "").replace(/^"|"$/g, "");

/** The rewritten page's validator: tied to both the asset and the publish. */
export function pageEtag(assetEtag: string | null, rev: number): string {
  return `W/"${assetEtag ? stripWeak(assetEtag) : "page"}-r${rev}"`;
}

/** RFC 9110 weak comparison against one of our validators. */
export function etagMatches(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  const want = stripWeak(etag);
  return ifNoneMatch.split(",").some((t) => {
    const tag = t.trim();
    return tag === "*" || stripWeak(tag) === want;
  });
}

/** Rewrite a 200 text/html asset response with the published snapshot. The
 *  caller has checked that the snapshot is non-empty. */
export function renderText(res: Response, s: Snapshot, page: Page): Response {
  const arOf = (key: string | null) => (key && I18N_KEYS.has(key) ? s.text[key]?.ar : undefined);
  const head = headOf(s, page);
  const rw = new HTMLRewriter();

  /* element text / aria-label, only for keys that have an Arabic override */
  const hasAr = Object.keys(s.text).some((k) => I18N_KEYS.has(k) && s.text[k].ar !== undefined);
  if (hasAr) {
    rw.on("[data-i18n]", {
      element(el) {
        const v = arOf(el.getAttribute("data-i18n"));
        if (v !== undefined && !VOID.has(el.tagName)) el.setInnerContent(v);
      },
    });
    rw.on("[data-i18n-label]", {
      element(el) {
        const v = arOf(el.getAttribute("data-i18n-label"));
        if (v !== undefined) el.setAttribute("aria-label", escapeAttr(v));
      },
    });
  }

  if (head.title !== undefined) {
    const t = head.title;
    rw.on("head > title", { element: (el) => void el.setInnerContent(t) });
  }
  const meta = (sel: string, v: string | undefined) => {
    if (v !== undefined) rw.on(sel, { element: (el) => void el.setAttribute("content", escapeAttr(v)) });
  };
  meta('meta[name="description"]', head.description);
  meta('meta[property="og:title"]', head.ogTitle);
  meta('meta[name="twitter:title"]', head.ogTitle);
  meta('meta[property="og:description"]', head.ogDescription);
  meta('meta[name="twitter:description"]', head.ogDescription);

  /* the boot-merge blob, once, before the first main.js script */
  const json = `<script type="application/json" id="aliph-content">${blob(s)}</script>\n`;
  let placed = false;
  rw.on('script[src="main.js"]', {
    element(el) {
      if (placed) return;
      placed = true;
      el.before(json, { html: true });
    },
  });

  return rw.transform(res);
}
