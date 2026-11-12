// Published media SLOTS rendered into the served HTML (P-06b), so the
// browser's preload scanner asks for the published picture from the first
// byte instead of the default one main.js would swap out later (MEDIA HOLD:
// a late swap costs the hero a second download).
//
// A slot `<page>.media.N` is the Nth <img src="assets/media/…"> of that page
// in document order — the same count gen-defaults.mjs makes. Only attribute
// VALUES change; loading="lazy", decoding and every other byte stay, so the
// hold keeps working exactly as before.
//   img src           ← `poster` on a slot with a preview (its img IS the
//                       poster), otherwise `src`
//   img alt           ← alt.ar (the served language)
//   figure data-preview ← `preview`, on the <figure data-preview> holding it
// Every touch first checks that the element still carries the default the
// registry was generated from. If the markup has moved on (a picture added
// above, a file renamed) the slot is skipped and a warning logged: painting
// the wrong holder is worse than painting the default.
// home.film.N slots are built by main.js (no markup): the boot merge does them.

import registry from "../generated/registry.json";
import type { Snapshot } from "../store";
import { escapeAttr, type Page } from "./text";

interface SlotDef {
  id: string;
  page: string;
  kind: string;
  src: string;
  preview?: string;
}

const MEDIA = new Map(
  (registry.slots as SlotDef[]).filter((d) => d.kind === "media").map((d) => [d.id, d]),
);

export type Warn = (msg: string) => void;

/** Add the slot handlers for `page` to a rewriter; no-op without overrides. */
export function onSlots(rw: HTMLRewriter, s: Snapshot, page: Page, warn: Warn = (m) => console.warn(m)): void {
  const prefix = `${page}.media.`;
  if (!Object.keys(s.slots).some((id) => id.startsWith(prefix))) return;

  let n = 0; // media <img>s seen so far
  const idOf = (ordinal: number) => prefix + ordinal;

  /* A figure opens before its img: the img it holds is the next one. */
  rw.on("figure[data-preview]", {
    element(el) {
      const id = idOf(n + 1);
      const v = s.slots[id];
      const def = MEDIA.get(id);
      if (v?.preview === undefined || !def?.preview) return;
      if (el.getAttribute("data-preview") !== def.preview) return warn(`slot ${id}: preview markup changed, skipped`);
      el.setAttribute("data-preview", escapeAttr(v.preview));
    },
  });

  rw.on('img[src^="assets/media/"]', {
    element(el) {
      const id = idOf(++n);
      const v = s.slots[id];
      if (!v) return;
      const def = MEDIA.get(id);
      if (!def || el.getAttribute("src") !== def.src) return warn(`slot ${id}: markup no longer matches the registry, skipped`);
      const src = (def.preview ? v.poster : undefined) ?? v.src;
      if (src !== undefined) el.setAttribute("src", escapeAttr(src));
      if (v.alt?.ar !== undefined) el.setAttribute("alt", escapeAttr(v.alt.ar));
    },
  });
}
