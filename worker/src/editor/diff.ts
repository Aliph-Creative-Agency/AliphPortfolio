// What differs between two snapshots (E-06): the draft against what is live,
// for the Publish dialog and the dashboard count, and one revision against
// the one before it, for History (E-07).
//
// One entry per thing that changed, never per field:
//   text     one per key (`locales` = the locales that differ)
//   slots    one per slot id
//   gallery  one per item id (an override, an upload, a staged removal)
//   rings    one per service
//   clients  one per client id
// `page` is where the admin finds it (registry `page`; slots carry it in their
// id; the rings live on home). `rev` and `locks` never count as a change.
// Pure: no D1, so tests and history can call it on any two snapshots.

import registry from "../generated/registry.json";
import type { Snapshot } from "../store";

export type Section = "text" | "slots" | "gallery" | "rings" | "clients";

export interface Change {
  section: Section;
  id: string;
  page?: string;
  locales?: ("ar" | "en")[];
}

const SECTIONS: Section[] = ["text", "slots", "gallery", "rings", "clients"];

/* key / slot id → page, from the registry the editor writes against */
const PAGE = new Map<string, string>();
for (const t of registry.text) PAGE.set(t.key, t.page);
for (const f of registry.fields) PAGE.set(f.key, f.page);
const SLOT_PAGE = new Map<string, string>();
for (const s of registry.slots) SLOT_PAGE.set(s.id, s.page);

/** JSON with object keys sorted, so two equal values always compare equal
 *  whatever order their fields were written in. Arrays keep their order. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v ?? null);
}

/* the ids of a map-like section, both sides, sorted */
const unionKeys = (a: object, b: object) => [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));

/** Everything `next` changes relative to `prev`, ordered by section then id. */
export function diff(next: Snapshot, prev: Snapshot): Change[] {
  const out: Change[] = [];

  for (const key of unionKeys(next.text, prev.text)) {
    const a = next.text[key] ?? {};
    const b = prev.text[key] ?? {};
    const locales = (["ar", "en"] as const).filter((l) => a[l] !== b[l]);
    if (!locales.length) continue;
    const c: Change = { section: "text", id: key, locales };
    const page = PAGE.get(key);
    if (page) c.page = page;
    out.push(c);
  }

  for (const id of unionKeys(next.slots, prev.slots)) {
    if (canonical(next.slots[id]) === canonical(prev.slots[id])) continue;
    out.push({ section: "slots", id, page: SLOT_PAGE.get(id) ?? id.split(".")[0] });
  }

  const ga = byId(next.gallery);
  const gb = byId(prev.gallery);
  for (const id of unionKeys(Object.fromEntries(ga), Object.fromEntries(gb))) {
    if (canonical(ga.get(id)) !== canonical(gb.get(id))) out.push({ section: "gallery", id });
  }

  for (const id of unionKeys(next.rings, prev.rings)) {
    if (canonical(next.rings[id]) !== canonical(prev.rings[id])) out.push({ section: "rings", id, page: "home" });
  }

  const ca = byId(next.clients);
  const cb = byId(prev.clients);
  for (const id of unionKeys(Object.fromEntries(ca), Object.fromEntries(cb))) {
    if (canonical(ca.get(id)) !== canonical(cb.get(id))) out.push({ section: "clients", id });
  }

  return out.sort((x, y) => SECTIONS.indexOf(x.section) - SECTIONS.indexOf(y.section));
}
