/**
 * media.js — the admin's browser-side media module. UI-free: no DOM except an
 * off-screen canvas / <video>, no globals, no styling. The gallery manager uses
 * it now; the editor's media holders (home / about) reuse it later.
 *
 *   import { prepareImage, preparePoster, kindOf, upload, MediaError } from "/admin/shared/media.js";
 *
 * API
 *   prepareImage(file, opts?) -> { blob, type, width, height, ratio, date }
 *       Decodes (EXIF orientation applied), scales so the longest side is at
 *       most 2000 px (never upscales), encodes WebP q0.82. `type` is what the
 *       blob really is. `ratio` = source width / height, 3 decimals. `date` =
 *       EXIF DateTimeOriginal as "YYYY-MM-DD", else the file's lastModified
 *       month "YYYY-MM". opts.webp === false forces the JPEG path (tests).
 *   (preparePoster, kindOf, upload: later tasks, same file.)
 *   MediaError — code "unreadable" | "unsupported" | "toolarge" | "network" | "aborted".
 *
 * Browser support / fallbacks
 *   - createImageBitmap with imageOrientation "from-image": all current
 *     browsers. A file the browser cannot decode (HEIC on Edge/Chrome, a
 *     corrupt file) throws MediaError("unreadable"); the caller shows it per
 *     file and carries on with the batch.
 *   - canvas.toBlob("image/webp"): Chrome, Edge, Firefox. Safari (before 17)
 *     silently returns a PNG; the module notices blob.type !== "image/webp"
 *     and re-encodes as JPEG q0.85 (the Worker accepts both).
 *   - Nothing here needs a network or a library.
 */

export class MediaError extends Error {
  /** @param {"unreadable"|"unsupported"|"toolarge"|"network"|"aborted"} code */
  constructor(code, message, cause) {
    super(message);
    this.name = "MediaError";
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

export const MAX_SIDE = 2000;
export const WEBP_QUALITY = 0.82;
export const JPEG_QUALITY = 0.85;

const pad = (n) => String(n).padStart(2, "0");

/** The file's lastModified as "YYYY-MM" (local time, what the user sees). */
function monthOf(file) {
  const d = new Date(file.lastModified || Date.now());
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/**
 * EXIF DateTimeOriginal of a JPEG as "YYYY-MM-DD", or null. Reads only the
 * first 256 KB (APP1 sits at the very start) and never throws on bad input.
 * @param {ArrayBuffer} buf
 */
export function exifDate(buf) {
  try {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
    let p = 2;
    while (p + 4 <= v.byteLength) {
      if (v.getUint8(p) !== 0xff) return null;
      const marker = v.getUint8(p + 1);
      if (marker === 0xda || marker === 0xd9) return null; // image data starts
      const len = v.getUint16(p + 2);
      if (marker === 0xe1 && v.getUint32(p + 4) === 0x45786966 && v.getUint16(p + 8) === 0) {
        return tiffDate(v, p + 10, p + 2 + len);
      }
      p += 2 + len;
    }
  } catch {
    /* truncated or malformed: no date */
  }
  return null;
}

/** Walks IFD0 -> ExifIFD for 0x9003 (original), 0x9004 (digitized), IFD0 0x0132. */
function tiffDate(v, t, end) {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (o) => v.getUint16(o, le);
  const u32 = (o) => v.getUint32(o, le);
  if (u16(t + 2) !== 42) return null;
  const read = (ifd) => {
    const found = {};
    if (ifd < 8 || t + ifd + 2 > end) return found;
    const n = u16(t + ifd);
    for (let i = 0; i < n; i++) {
      const e = t + ifd + 2 + i * 12;
      if (e + 12 > end) break;
      found[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 };
    }
    return found;
  };
  const text = (ent) => {
    if (!ent || ent.type !== 2 || ent.count < 10) return null;
    const off = ent.count > 4 ? t + u32(ent.at) : ent.at;
    if (off + 10 > v.byteLength) return null;
    let s = "";
    for (let i = 0; i < 10; i++) s += String.fromCharCode(v.getUint8(off + i));
    const m = /^(\d{4}):(\d{2}):(\d{2})$/.exec(s);
    return m && m[1] !== "0000" ? `${m[1]}-${m[2]}-${m[3]}` : null;
  };
  const ifd0 = read(u32(t + 4));
  const exif = ifd0[0x8769] ? read(u32(ifd0[0x8769].at)) : {};
  return text(exif[0x9003]) || text(exif[0x9004]) || text(ifd0[0x0132]);
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Draws `source` (ImageBitmap / <video>) at w x h and encodes it: WebP, or JPEG
 * when WebP is unavailable or opts.webp === false. Shared with preparePoster.
 * @returns {Promise<Blob>}
 */
export async function encode(source, w, h, opts = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d").drawImage(source, 0, 0, w, h);
  if (opts.webp !== false) {
    const b = await toBlob(c, "image/webp", WEBP_QUALITY);
    if (b && b.type === "image/webp") return b;
  }
  const j = await toBlob(c, "image/jpeg", JPEG_QUALITY);
  if (!j) throw new MediaError("unreadable", "the browser could not encode this picture");
  return j;
}

/** Longest side capped at MAX_SIDE, aspect kept, never enlarged. */
export function fit(w, h, max = MAX_SIDE) {
  const k = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

export const roundRatio = (w, h) => Math.round((w / h) * 1000) / 1000;

/**
 * @param {File} file
 * @param {{webp?: boolean}} [opts]
 * @returns {Promise<{blob: Blob, type: string, width: number, height: number, ratio: number, date: string}>}
 */
export async function prepareImage(file, opts = {}) {
  let bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (err) {
    throw new MediaError("unreadable", `${file.name || "this file"} could not be read as a picture`, err);
  }
  try {
    const { width, height } = fit(bmp.width, bmp.height);
    const blob = await encode(bmp, width, height, opts);
    let date = null;
    if (/jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name || "")) {
      date = exifDate(await file.slice(0, 262144).arrayBuffer());
    }
    return {
      blob,
      type: blob.type,
      width,
      height,
      ratio: roundRatio(bmp.width, bmp.height),
      date: date || monthOf(file),
    };
  } finally {
    bmp.close?.();
  }
}
