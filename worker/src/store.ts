// The content store, read as ONE shape (worker/CONTENT_API.md "Snapshot").
//
// A snapshot holds only overrides and additions on top of main.js's tables
// (worker/src/generated/defaults.json); an empty one is today's site. The
// same shape comes out for both states:
//   published  what visitors get: text_values.published, slot_values.
//              published_json, and the published_json copy of every gallery
//              item / ring / client that has one.
//   draft      what the site would be if it were published now: the draft
//              columns, minus rows staged for removal (state 'deleted'),
//              plus `locks` — every row's optimistic-lock rev, so the editor
//              can send the rev it read with each save.
// One D1 batch per read (one round trip), no per-row queries.

export type State = "published" | "draft";

/** One string per locale; a locale is present only when it is overridden. */
export interface Pair {
  ar?: string;
  en?: string;
}

/** A media slot's override (CONTENT_API.md "Slots"). */
export interface SlotValue {
  src?: string;
  poster?: string;
  preview?: string;
  alt?: Pair;
}

/** A gallery piece: an override of a MEDIA entry (id = its `f`) or an upload. */
export interface GalleryItem {
  id: string;
  src?: string;
  poster?: string;
  cat?: string;
  sub?: string;
  ratio?: number;
  date?: string;
  alt?: Pair;
  client?: string;
  hidden?: true;
  sort?: number;
}

export interface Client {
  id: string;
  name: { ar: string; en: string };
}

/** Optimistic-lock revs of every row that exists (draft snapshots only). */
export interface Locks {
  text: Record<string, { ar?: number; en?: number }>;
  slots: Record<string, number>;
  gallery: Record<string, number>;
  rings: Record<string, number>;
  clients: Record<string, number>;
}

export interface Snapshot {
  /** meta.publish_rev: 0 = nothing ever published. */
  rev: number;
  text: Record<string, Pair>;
  slots: Record<string, SlotValue>;
  gallery: GalleryItem[];
  /** service → ring item ids, in ring order (CONTENT_API.md "Rings"). */
  rings: Record<string, string[]>;
  clients: Client[];
  locks?: Locks;
}

export const emptySnapshot = (rev = 0): Snapshot => ({ rev, text: {}, slots: {}, gallery: [], rings: {}, clients: [] });

/** True when the snapshot overrides nothing — serve the assets untouched. */
export function isEmpty(s: Snapshot): boolean {
  return (
    Object.keys(s.text).length === 0 &&
    Object.keys(s.slots).length === 0 &&
    s.gallery.length === 0 &&
    Object.keys(s.rings).length === 0 &&
    s.clients.length === 0
  );
}

/* ── rows ─────────────────────────────────────────────────────────── */

export interface GalleryRow {
  id: string;
  src: string | null;
  poster: string | null;
  cat: string | null;
  sub: string | null;
  ratio: number | null;
  date: string | null;
  alt_ar: string | null;
  alt_en: string | null;
  client_id: string | null;
  hidden: number;
  sort: number | null;
}

/** A gallery row's draft columns as a snapshot item. publish() writes
 *  JSON.stringify(galleryItemFromRow(row)) into published_json, so both
 *  states come out identical for an unchanged row. NULL columns are left out
 *  (= keep the MEDIA default for an override). */
export function galleryItemFromRow(r: GalleryRow): GalleryItem {
  const it: GalleryItem = { id: r.id };
  if (r.src != null) it.src = r.src;
  if (r.poster != null) it.poster = r.poster;
  if (r.cat != null) it.cat = r.cat;
  if (r.sub != null) it.sub = r.sub;
  if (r.ratio != null) it.ratio = r.ratio;
  if (r.date != null) it.date = r.date;
  const alt: Pair = {};
  if (r.alt_ar != null) alt.ar = r.alt_ar;
  if (r.alt_en != null) alt.en = r.alt_en;
  if (alt.ar !== undefined || alt.en !== undefined) it.alt = alt;
  if (r.client_id != null) it.client = r.client_id;
  if (r.hidden === 1) it.hidden = true;
  if (r.sort != null) it.sort = r.sort;
  return it;
}

export interface ClientRow {
  id: string;
  name_ar: string;
  name_en: string;
}

export const clientFromRow = (r: ClientRow): Client => ({ id: r.id, name: { ar: r.name_ar, en: r.name_en } });

/** Gallery order: `sort` ascending (unsorted last), then id. Deterministic,
 *  so the snapshot (and the ETag'd body) is the same for the same rows. */
export function sortGallery(items: GalleryItem[]): GalleryItem[] {
  return items.sort((a, b) => {
    const sa = a.sort ?? Number.POSITIVE_INFINITY;
    const sb = b.sort ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa < sb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

const sortById = <T extends { id: string }>(xs: T[]) => xs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const parse = <T>(s: string): T => JSON.parse(s) as T;

/* ── reads ────────────────────────────────────────────────────────── */

const REV_SQL = "SELECT CAST(v AS INTEGER) AS rev FROM meta WHERE k = 'publish_rev'";

/** The publish rev alone: what an If-None-Match check needs. */
export async function readPublishRev(db: D1Database): Promise<number> {
  const row = await db.prepare(REV_SQL).first<{ rev: number }>();
  return row?.rev ?? 0;
}

export async function readSnapshot(db: D1Database, state: State): Promise<Snapshot> {
  return state === "published" ? readPublished(db) : readDraft(db);
}

async function readPublished(db: D1Database): Promise<Snapshot> {
  const [meta, text, slots, gallery, rings, clients] = await db.batch([
    db.prepare(REV_SQL),
    db.prepare("SELECT key, locale, published AS v FROM text_values WHERE published IS NOT NULL ORDER BY key, locale"),
    db.prepare("SELECT slot, published_json AS v FROM slot_values WHERE published_json IS NOT NULL ORDER BY slot"),
    db.prepare("SELECT id, published_json AS v FROM gallery_items WHERE published_json IS NOT NULL"),
    db.prepare("SELECT service, published_json AS v FROM ring_picks WHERE published_json IS NOT NULL ORDER BY service"),
    db.prepare("SELECT id, published_json AS v FROM clients WHERE published_json IS NOT NULL"),
  ]);
  const s = emptySnapshot((meta.results[0] as { rev: number } | undefined)?.rev ?? 0);
  for (const r of text.results as { key: string; locale: "ar" | "en"; v: string }[]) {
    (s.text[r.key] ??= {})[r.locale] = r.v;
  }
  for (const r of slots.results as { slot: string; v: string }[]) s.slots[r.slot] = parse<SlotValue>(r.v);
  /* the row id wins over whatever id the JSON carries */
  s.gallery = sortGallery(
    (gallery.results as { id: string; v: string }[]).map((r) => ({ ...parse<GalleryItem>(r.v), id: r.id })),
  );
  for (const r of rings.results as { service: string; v: string }[]) s.rings[r.service] = parse<string[]>(r.v);
  s.clients = sortById((clients.results as { id: string; v: string }[]).map((r) => ({ ...parse<Client>(r.v), id: r.id })));
  return s;
}

async function readDraft(db: D1Database): Promise<Snapshot> {
  const [meta, text, slots, gallery, rings, clients] = await db.batch([
    db.prepare(REV_SQL),
    db.prepare("SELECT key, locale, draft AS v, rev FROM text_values ORDER BY key, locale"),
    db.prepare("SELECT slot, draft_json AS v, rev FROM slot_values ORDER BY slot"),
    db.prepare(
      "SELECT id, src, poster, cat, sub, ratio, date, alt_ar, alt_en, client_id, hidden, sort, state, rev FROM gallery_items",
    ),
    db.prepare("SELECT service, item_ids_json AS v, state, rev FROM ring_picks ORDER BY service"),
    db.prepare("SELECT id, name_ar, name_en, state, rev FROM clients"),
  ]);
  const s = emptySnapshot((meta.results[0] as { rev: number } | undefined)?.rev ?? 0);
  const locks: Locks = { text: {}, slots: {}, gallery: {}, rings: {}, clients: {} };

  for (const r of text.results as { key: string; locale: "ar" | "en"; v: string | null; rev: number }[]) {
    (locks.text[r.key] ??= {})[r.locale] = r.rev;
    if (r.v !== null) (s.text[r.key] ??= {})[r.locale] = r.v;
  }
  for (const r of slots.results as { slot: string; v: string | null; rev: number }[]) {
    locks.slots[r.slot] = r.rev;
    if (r.v !== null) s.slots[r.slot] = parse<SlotValue>(r.v);
  }
  for (const r of gallery.results as (GalleryRow & { state: string; rev: number })[]) {
    locks.gallery[r.id] = r.rev;
    if (r.state === "active") s.gallery.push(galleryItemFromRow(r));
  }
  sortGallery(s.gallery);
  for (const r of rings.results as { service: string; v: string; state: string; rev: number }[]) {
    locks.rings[r.service] = r.rev;
    if (r.state === "active") s.rings[r.service] = parse<string[]>(r.v);
  }
  for (const r of clients.results as (ClientRow & { state: string; rev: number })[]) {
    locks.clients[r.id] = r.rev;
    if (r.state === "active") s.clients.push(clientFromRow(r));
  }
  sortById(s.clients);
  s.locks = locks;
  return s;
}
