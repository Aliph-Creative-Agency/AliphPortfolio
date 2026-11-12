// G-02a: the admin gallery read model, GET /api/admin/gallery.
//
// Every MEDIA default (worker/src/generated/defaults.json) merged with the
// draft rows of gallery_items, plus every upload, in ONE D1 batch. The admin
// grid and the ring panel are drawn from this and nothing else.

import type { Env } from "../index";
import defaults from "../generated/defaults.json";
import { galleryItemFromRow, readPublishRev, type GalleryRow } from "../store";
import { ringItemId } from "../validate";
import { json } from "./routes";

const R2 = "https://media.aliphcreative.com";

type Media = { f: string; c: string; r: number; d: string | null; v?: number; p?: string };
const MEDIA = defaults.MEDIA as Media[];
const RINGS = defaults.RINGS as Record<string, { f?: string; shot?: string }[]>;

export interface AdminItem {
  id: string;
  kind: "default" | "override" | "upload";
  cat: string;
  sub: string | null;
  ratio: number;
  date: string | null;
  video: boolean;
  /** the picture the grid draws */
  thumb: string;
  /** the picture the lightbox opens */
  full: string;
  /** a video's film (absent on an image) */
  film?: string;
  alt: { ar?: string; en?: string };
  hidden: boolean;
  deleted: boolean;
  /** the draft differs from what is published */
  changed: boolean;
  /** optimistic lock: 0 = no row yet (send baseRev 0 to create) */
  rev: number;
}

export interface AdminRing {
  ids: string[];
  isDefault: boolean;
  rev: number;
  changed: boolean;
}

export type Row = GalleryRow & { state: string; published_json: string | null; rev: number };

/** The columns every gallery read selects (the row shape above). */
export const ROW_COLS = "id, src, poster, cat, sub, ratio, date, alt_ar, alt_en, client_id, hidden, sort, state, published_json, rev";

/** Draft ≠ published for one gallery row. publish() writes
 *  JSON.stringify(galleryItemFromRow(row)) for an active row and NULL for a
 *  deleted one, so a string compare is exact. */
function rowChanged(r: Row): boolean {
  if (r.state === "deleted") return r.published_json !== null;
  return r.published_json !== JSON.stringify(galleryItemFromRow(r));
}

const altOf = (r: Row | undefined) => {
  const a: { ar?: string; en?: string } = {};
  if (r?.alt_ar != null) a.ar = r.alt_ar;
  if (r?.alt_en != null) a.en = r.alt_en;
  return a;
};

function defaultItem(m: Media, r: Row | undefined): AdminItem {
  const video = !!m.v;
  /* the same fallbacks main.js builds: a video tile shows poster || thumb/<p>,
     an image tile src || thumb/<f>; the lightbox poster || poster/<p> / src || img/<f> */
  const poster = r?.poster ?? undefined;
  const src = r?.src ?? undefined;
  const item: AdminItem = {
    id: m.f,
    kind: r ? "override" : "default",
    cat: r?.cat ?? m.c,
    sub: r?.sub ?? null,
    ratio: r?.ratio ?? m.r,
    date: r?.date ?? m.d ?? null,
    video,
    thumb: video ? (poster ?? `${R2}/thumb/${m.p}`) : (src ?? `${R2}/thumb/${m.f}`),
    full: video ? (poster ?? `${R2}/poster/${m.p}`) : (src ?? `${R2}/img/${m.f}`),
    alt: altOf(r),
    hidden: r?.hidden === 1,
    deleted: r?.state === "deleted",
    changed: r ? rowChanged(r) : false,
    rev: r?.rev ?? 0,
  };
  if (video) item.film = src ?? `${R2}/video/${m.f}`;
  return item;
}

function uploadItem(r: Row): AdminItem {
  const video = r.poster != null;
  const pic = (video ? r.poster : r.src) ?? "";
  const item: AdminItem = {
    id: r.id,
    kind: "upload",
    cat: r.cat ?? "",
    sub: r.sub ?? null,
    ratio: r.ratio ?? 1,
    date: r.date ?? null,
    video,
    thumb: pic,
    full: pic,
    alt: altOf(r),
    hidden: r.hidden === 1,
    deleted: r.state === "deleted",
    changed: rowChanged(r),
    rev: r.rev,
  };
  if (video && r.src) item.film = r.src;
  return item;
}

const MEDIA_BY_F = new Map(MEDIA.map((m) => [m.f, m]));

/** One item as the grid shows it: a MEDIA f (with or without its row) or an
 *  upload row. null = an id with neither (an upload row publish removed). */
export function adminItem(id: string, r: Row | undefined): AdminItem | null {
  const m = MEDIA_BY_F.get(id);
  if (m) return defaultItem(m, r);
  return r ? uploadItem(r) : null;
}

export async function galleryRead(env: Env): Promise<Response> {
  const [rows, rings] = await env.DB.batch([
    env.DB.prepare(`SELECT ${ROW_COLS} FROM gallery_items`),
    env.DB.prepare("SELECT service, item_ids_json, state, published_json, rev FROM ring_picks"),
  ]);
  const byId = new Map((rows.results as Row[]).map((r) => [r.id, r]));
  const media = new Set(MEDIA.map((m) => m.f));

  const items: AdminItem[] = MEDIA.map((m) => defaultItem(m, byId.get(m.f)));
  const uploads = (rows.results as Row[]).filter((r) => !media.has(r.id)).sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const r of uploads) items.push(uploadItem(r));

  const ringRows = new Map(
    (rings.results as { service: string; item_ids_json: string; state: string; published_json: string | null; rev: number }[]).map(
      (r) => [r.service, r],
    ),
  );
  const out: Record<string, AdminRing> = {};
  for (const [service, list] of Object.entries(RINGS)) {
    const r = ringRows.get(service);
    const active = r?.state === "active";
    out[service] = {
      ids: active ? (JSON.parse(r!.item_ids_json) as string[]) : list.map(ringItemId),
      isDefault: !active,
      rev: r?.rev ?? 0,
      changed: !r ? false : active ? r.published_json !== r.item_ids_json : r.published_json !== null,
    };
  }

  return json({
    items,
    subcats: defaults.SUBCATS,
    rings: out,
    publishRev: await readPublishRev(env.DB),
  });
}
