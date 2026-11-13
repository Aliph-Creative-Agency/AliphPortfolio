// The edit-mode pages (E-01): /admin/edit/ (home), /admin/edit/about and
// /admin/edit/library. Each is the public page's own asset with the DRAFT
// rendered in by the same single streaming pass the public pages use
// (render/text.ts + render/slots.ts + render/regions.ts), plus the hooks the
// editor overlay needs:
//   data-ek="<key>"         on every [data-i18n] element
//   data-ek-label="<key>"   on every [data-i18n-label] element
//   data-edit-mode="1"      on <html> (main.js's EDIT MODE HOOKS key off it)
//   <base href="/">         first in <head>: the page lives under /admin/edit/
//                           but its relative URLs (main.js, style.css,
//                           assets/…) must resolve as on the public page
//   data-es="<slot>"      on each <img src="assets/media/…"> that is a registry <page>.media.N holder (counted the way
//                           render/slots.ts counts), data-es-preview="<slot>" on the figure[data-preview] around a
//                           preview slot; main.js tags the film frames (home.film.N) once it has built them (E-15a)
//   editor.css + editor-api.js + editor.js  before </body>
// The blob main.js merges is the draft minus `locks` (renderText's blob()
// strips them). Never cached: no cache.ts, `no-store`, and `noindex` in case
// a crawler ever gets past Access. A store failure is a 503 — an edit page
// that silently showed the published text would invite editing the wrong copy.

import type { Env } from "../index";
import { pageOf, renderText, type Page } from "../render/text";
import { onSlots } from "../render/slots";
import { onRegions } from "../render/regions";
import { readSnapshot } from "../store";
import registry from "../generated/registry.json";

/** The public asset path behind each page. */
const ASSET: Record<Page, string> = { home: "/", about: "/about", library: "/library" };

const MEDIA_SLOTS = new Set((registry.slots as { id: string; kind: string }[]).filter((d) => d.kind === "media").map((d) => d.id));
const PREVIEW_SLOTS = new Set(
  (registry.slots as { id: string; kind: string; preview?: string }[]).filter((d) => d.kind === "media" && d.preview).map((d) => d.id),
);

/** Which page an /admin/edit… path is; null = not an edit page. */
export function editPageOf(pathname: string): Page | null {
  if (pathname !== "/admin/edit" && !pathname.startsWith("/admin/edit/")) return null;
  return pageOf(pathname.slice("/admin/edit".length));
}

const TAIL = '<link rel="stylesheet" href="/admin/editor.css">\n<script src="/admin/editor-api.js" defer></script>\n<script src="/admin/editor.js" defer></script>\n';

export async function editPage(request: Request, env: Env, url: URL, page: Page): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET", "cache-control": "no-store" } });
  }
  let snap;
  try {
    snap = await readSnapshot(env.DB, "draft");
  } catch (err) {
    console.error("draft snapshot unreadable", err);
    return new Response("content store unavailable", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  // A plain GET for the asset: none of the browser's validators, so the
  // asset layer can never answer 304 for a page whose rewrite changed.
  const res = await env.ASSETS.fetch(new Request(new URL(ASSET[page], url.origin)));
  if (res.status !== 200 || !(res.headers.get("content-type") ?? "").startsWith("text/html")) return res;

  const headers = new Headers(res.headers);
  for (const h of ["etag", "last-modified", "content-length", "cache-control"]) headers.delete(h);
  headers.set("cache-control", "no-store");
  headers.set("x-robots-tag", "noindex");

  return renderText(new Response(res.body, { status: 200, headers }), snap, page, (rw) => {
    rw.on("html", { element: (el) => void el.setAttribute("data-edit-mode", "1") });
    rw.on("head", { element: (el) => void el.prepend('<base href="/">', { html: true }) });
    rw.on("[data-i18n]", {
      element(el) {
        el.setAttribute("data-ek", el.getAttribute("data-i18n") ?? "");
      },
    });
    rw.on("[data-i18n-label]", {
      element(el) {
        el.setAttribute("data-ek-label", el.getAttribute("data-i18n-label") ?? "");
      },
    });
    rw.on("body", { element: (el) => void el.append(TAIL, { html: true }) });
    /* before onSlots, so the img is seen as it was served (its original src); the count is slots.ts's own:
       the Nth <img src="assets/media/…"> of the page, a figure[data-preview] holding the NEXT one */
    let n = 0;
    rw.on("figure[data-preview]", {
      element(el) {
        const id = `${page}.media.${n + 1}`;
        if (PREVIEW_SLOTS.has(id)) el.setAttribute("data-es-preview", id);
      },
    });
    rw.on('img[src^="assets/media/"]', {
      element(el) {
        const id = `${page}.media.${++n}`;
        if (MEDIA_SLOTS.has(id)) el.setAttribute("data-es", id);
      },
    });
    onSlots(rw, snap, page);
    onRegions(rw, snap, page);
  });
}
