// Types for merge.mjs (plain ESM, mirrored into main.js by the boot merge).
import type { Tables } from "./regions.mjs";
/** A gallery item (store.ts GalleryItem). */
export interface MergeGalleryItem {
  id: string;
  src?: string;
  poster?: string;
  cat?: string;
  sub?: string;
  ratio?: number;
  date?: string;
  alt?: { ar?: string; en?: string };
  client?: string;
  hidden?: boolean;
  sort?: number;
}
/** The published snapshot fields the merge reads (store.ts Snapshot). */
export interface MergeSnapshot {
  text?: Record<string, { ar?: string; en?: string }>;
  gallery?: readonly MergeGalleryItem[];
}
export function fieldPath(T: Tables, key: string): (string | number)[] | null;
export function mergeContent<T extends Tables>(T: T, s: MergeSnapshot | null | undefined): T;
