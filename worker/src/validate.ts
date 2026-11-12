// Server-side validation of everything an admin can write, by the registry
// (worker/src/generated/registry.json) and the defaults it was generated
// from. Every write handler (editor team: text + slots; gallery team:
// gallery, rings, clients) runs its input through these BEFORE touching D1
// and answers a failure with `badRequest(result)` — a 400 the editor can show
// next to the field. worker/CONTENT_API.md "Validation" is the contract.
//
// Values are TEXT. Nothing here strips or escapes markup: the Worker escapes
// on output (P-06) and main.js sets textContent, so "<b>" in a value is shown
// as the five characters it is. What IS refused is what text cannot carry:
// control characters, and line breaks outside a `richline`.

import registry from "./generated/registry.json";
import defaults from "./generated/defaults.json";
import type { SlotValue, Pair, GalleryItem } from "./store";

export type Invalid = { ok: false; error: string; field?: string };
export type Valid<T> = { ok: true; value: T };
export type Result<T> = Valid<T> | Invalid;

const bad = (error: string, field?: string): Invalid => (field ? { ok: false, error, field } : { ok: false, error });
const good = <T>(value: T): Valid<T> => ({ ok: true, value });

export function badRequest(r: Invalid): Response {
  return new Response(JSON.stringify({ error: r.error, ...(r.field ? { field: r.field } : {}) }), {
    status: 400,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/* ── text: I18N keys + fields ─────────────────────────────────────── */

export interface TextEntry {
  key: string;
  kind: "text" | "richline";
  locales: ("ar" | "en")[];
  minLength: number;
  maxLength: number;
}

const TEXT = new Map<string, TextEntry>();
for (const e of registry.text) {
  TEXT.set(e.key, { key: e.key, kind: e.kind as TextEntry["kind"], locales: ["ar", "en"], minLength: 0, maxLength: e.maxLength });
}
for (const e of registry.fields) {
  TEXT.set(e.key, {
    key: e.key,
    kind: e.kind as TextEntry["kind"],
    locales: e.locales as TextEntry["locales"],
    minLength: e.minLength,
    maxLength: e.maxLength,
  });
}

export const textEntry = (key: string): TextEntry | undefined => TEXT.get(key);

/* C0 controls and DEL, except \n (allowed in a richline only) */
const CONTROL = /[\u0000-\u0009\u000B-\u001F\u007F]/;
/* plain text in an attribute or a short label: no \n either */
const CONTROL_OR_NL = /[\u0000-\u001F\u007F]/;

/** A text value for (key, locale). `null` = reset to the default. */
export function validateText(key: unknown, locale: unknown, value: unknown): Result<string | null> {
  if (typeof key !== "string" || !TEXT.has(key)) return bad("unknown key", "key");
  const e = TEXT.get(key)!;
  if (typeof locale !== "string" || !(e.locales as string[]).includes(locale)) return bad("locale not editable", "locale");
  if (value === null) return good(null);
  if (typeof value !== "string") return bad("value must be a string or null", "value");
  if ((e.kind === "richline" ? CONTROL : CONTROL_OR_NL).test(value)) {
    return bad(e.kind === "richline" ? "control characters are not allowed" : "line breaks are not allowed here", "value");
  }
  if (value.length < e.minLength) return bad("value is required", "value");
  if (value.length > e.maxLength) return bad(`longer than ${e.maxLength} characters`, "value");
  return good(value);
}

/* ── media slots ──────────────────────────────────────────────────── */

const SLOTS = new Map(registry.slots.map((s) => [s.id, s as { id: string; preview?: string }]));

/* the site's own bundle, or the media bucket's public host; no `..`, no
   query, no other origin */
const FILE = "[A-Za-z0-9][A-Za-z0-9._-]*";
const IMAGE = new RegExp(
  `^(assets/media/${FILE}|https://media\\.aliphcreative\\.com/(${FILE}/)*${FILE})\\.(webp|jpe?g|png|avif)$`,
);
const VIDEO = new RegExp(`^https://media\\.aliphcreative\\.com/(${FILE}/)*${FILE}\\.(mp4|webm)$`);
const isUrl = (re: RegExp, v: unknown) => typeof v === "string" && v.length <= 512 && !v.includes("..") && re.test(v);

export const ALT_MAX = 300;

function validateAlt(v: unknown, field: string): Result<Pair> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return bad("alt must be {ar?, en?}", field);
  const out: Pair = {};
  for (const [l, s] of Object.entries(v)) {
    if (l !== "ar" && l !== "en") return bad("unknown locale", `${field}.${l}`);
    if (typeof s !== "string" || CONTROL_OR_NL.test(s)) return bad("alt must be plain text", `${field}.${l}`);
    if (s.length > ALT_MAX) return bad(`longer than ${ALT_MAX} characters`, `${field}.${l}`);
    out[l] = s;
  }
  return good(out);
}

/** A slot override. `null` = reset to the markup's default. */
export function validateSlot(id: unknown, value: unknown): Result<SlotValue | null> {
  if (typeof id !== "string" || !SLOTS.has(id)) return bad("unknown slot", "slot");
  if (value === null) return good(null);
  if (typeof value !== "object" || Array.isArray(value)) return bad("value must be an object or null", "value");
  const slot = SLOTS.get(id)!;
  const out: SlotValue = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === "src" || (k === "poster" && slot.preview)) {
      if (!isUrl(IMAGE, v)) return bad("not an image under assets/media/ or media.aliphcreative.com", k);
      out[k] = v as string;
    } else if (k === "preview" && slot.preview) {
      if (!isUrl(VIDEO, v)) return bad("not an mp4/webm on media.aliphcreative.com", k);
      out.preview = v as string;
    } else if (k === "alt") {
      const a = validateAlt(v, "alt");
      if (!a.ok) return a;
      out.alt = a.value;
    } else {
      return bad("field not editable on this slot", k);
    }
  }
  if (Object.keys(out).length === 0) return bad("empty override; send null to reset", "value");
  return good(out);
}

/* ── rings ────────────────────────────────────────────────────────── */

type RingDefault = { f?: string; shot?: string };
const RINGS = defaults.RINGS as Record<string, RingDefault[]>;

/** A ring item's id: its MEDIA file name (`f`), or `shot` for the tech
 *  ring's site screenshots. */
export const ringItemId = (it: RingDefault): string => (it.f ?? it.shot) as string;

export const RING_MAX = 24;
const MEDIA_CAT = new Map((defaults.MEDIA as { f: string; c: string }[]).map((m) => [m.f, m.c]));

/** True for an id the ring may hold without a gallery lookup: one of its
 *  default items, or a MEDIA file of the same category. */
export function isDefaultRingItem(service: string, id: string): boolean {
  return (RINGS[service] || []).some((it) => ringItemId(it) === id) || MEDIA_CAT.get(id) === service;
}

/** A ring's draft list. `null` = reset to main.js's RINGS (staged as
 *  state 'deleted'). `isGalleryItem(id)` answers for uploads (an active
 *  gallery_items row of the same category), which only the caller can look up. */
export function validateRing(
  service: unknown,
  ids: unknown,
  isGalleryItem: (id: string) => boolean = () => false,
): Result<string[] | null> {
  if (typeof service !== "string" || !Object.hasOwn(RINGS, service)) return bad("unknown ring", "service");
  if (ids === null) return good(null);
  if (!Array.isArray(ids) || ids.length === 0) return bad("a ring needs at least one item; send null to reset", "items");
  if (ids.length > RING_MAX) return bad(`at most ${RING_MAX} items`, "items");
  const seen = new Set<string>();
  for (const [i, id] of ids.entries()) {
    if (typeof id !== "string" || seen.has(id)) return bad("ids must be distinct strings", `items.${i}`);
    if (!isDefaultRingItem(service, id) && !isGalleryItem(id)) return bad("unknown item", `items.${i}`);
    seen.add(id);
  }
  return good(ids as string[]);
}

/* ── gallery + clients ────────────────────────────────────────────── */

const CAT_IDS = new Set((defaults.CATS as { id: string }[]).map((c) => c.id).filter((id) => id !== "all"));
const SUBS = defaults.SUBCATS as Record<string, { id: string }[]>;
export const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

/** A gallery item as it would be stored (snapshot shape, CONTENT_API.md
 *  "Gallery"). An id that is not a MEDIA `f` is an upload and needs src + cat. */
export function validateGalleryItem(v: unknown): Result<GalleryItem> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return bad("item must be an object", "item");
  const it = v as Record<string, unknown>;
  if (typeof it.id !== "string" || !ID_RE.test(it.id)) return bad("bad id", "id");
  const isDefault = MEDIA_CAT.has(it.id);
  const out: GalleryItem = { id: it.id };
  for (const [k, x] of Object.entries(it)) {
    switch (k) {
      case "id":
        break;
      case "src":
      case "poster":
        if (!isUrl(IMAGE, x)) return bad("not an image under assets/media/ or media.aliphcreative.com", k);
        out[k] = x as string;
        break;
      case "cat":
        if (typeof x !== "string" || !CAT_IDS.has(x)) return bad("unknown category", k);
        out.cat = x;
        break;
      case "sub":
        if (typeof x !== "string") return bad("unknown subcategory", k);
        out.sub = x;
        break;
      case "ratio":
        if (typeof x !== "number" || !(x > 0 && x <= 10)) return bad("ratio must be width/height in (0, 10]", k);
        out.ratio = x;
        break;
      case "date":
        if (typeof x !== "string" || !DATE_RE.test(x)) return bad("date must be YYYY-MM or YYYY-MM-DD", k);
        out.date = x;
        break;
      case "alt": {
        const a = validateAlt(x, "alt");
        if (!a.ok) return a;
        out.alt = a.value;
        break;
      }
      case "client":
        if (typeof x !== "string" || !ID_RE.test(x)) return bad("bad client id", k);
        out.client = x;
        break;
      case "hidden":
        if (typeof x !== "boolean") return bad("hidden must be a boolean", k);
        if (x) out.hidden = true;
        break;
      case "sort":
        if (typeof x !== "number" || !Number.isFinite(x)) return bad("sort must be a number", k);
        out.sort = x;
        break;
      default:
        return bad("unknown field", k);
    }
  }
  const cat = out.cat ?? (isDefault ? MEDIA_CAT.get(out.id) : undefined);
  if (!isDefault && (!out.src || !out.cat)) return bad("an upload needs src and cat", out.src ? "cat" : "src");
  if (out.sub !== undefined && !(SUBS[cat as string] || []).some((s) => s.id === out.sub)) {
    return bad("unknown subcategory for this category", "sub");
  }
  return good(out);
}

export const CLIENT_NAME_MAX = 80;

export function validateClient(v: unknown): Result<{ id: string; name: { ar: string; en: string } }> {
  if (typeof v !== "object" || v === null) return bad("client must be an object", "client");
  const c = v as { id?: unknown; name?: { ar?: unknown; en?: unknown } };
  if (typeof c.id !== "string" || !ID_RE.test(c.id)) return bad("bad id", "id");
  for (const l of ["ar", "en"] as const) {
    const s = c.name?.[l];
    if (typeof s !== "string" || s.length < 1 || CONTROL_OR_NL.test(s)) return bad("name is required", `name.${l}`);
    if (s.length > CLIENT_NAME_MAX) return bad(`longer than ${CLIENT_NAME_MAX} characters`, `name.${l}`);
  }
  return good({ id: c.id, name: { ar: c.name!.ar as string, en: c.name!.en as string } });
}
