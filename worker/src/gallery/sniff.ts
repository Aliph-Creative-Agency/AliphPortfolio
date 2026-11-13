// Magic-byte sniffing for uploads. The file name and the declared
// content-type are never trusted: what the bytes say decides the kind, the
// extension and the stored content-type.

export type Kind = "image" | "video";
export interface Sniffed {
  kind: Kind;
  ext: "jpg" | "png" | "webp" | "avif" | "mp4" | "webm";
  type: string;
}

const MP4_BRANDS = new Set(["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "dash"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
const at = (b: Uint8Array, off: number, sig: number[]) => sig.every((v, i) => b[off + i] === v);

/** Bytes needed to decide (an ftyp box header is 12 bytes). */
export const SNIFF_BYTES = 12;

export function sniff(b: Uint8Array): Sniffed | null {
  if (b.length < SNIFF_BYTES) return null;
  if (at(b, 0, [0xff, 0xd8, 0xff])) return { kind: "image", ext: "jpg", type: "image/jpeg" };
  if (at(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "image", ext: "png", type: "image/png" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return { kind: "image", ext: "webp", type: "image/webp" };
  if (at(b, 0, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: "video", ext: "webm", type: "video/webm" };
  if (ascii(b, 4, 8) === "ftyp") {
    const brand = ascii(b, 8, 12);
    if (AVIF_BRANDS.has(brand)) return { kind: "image", ext: "avif", type: "image/avif" };
    if (MP4_BRANDS.has(brand)) return { kind: "video", ext: "mp4", type: "video/mp4" };
  }
  return null; // incl. QuickTime "qt  ", MZ executables, text
}
