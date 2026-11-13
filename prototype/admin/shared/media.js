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
 *   preparePoster(videoFile, opts?) -> { blob, type, width, height, ratio, duration }
 *       Grabs a frame at min(1 s, duration/2) from an off-screen muted <video>
 *       and encodes it like prepareImage (WebP, JPEG fallback). Poster size is
 *       the video's own, capped at 1280 px on the long side. Gives up after
 *       15 s with MediaError("unreadable") (a codec the browser cannot play
 *       never fires an event; the timeout is what ends the wait).
 *   kindOf(file) -> "image" | "video" | null  (by MIME type, else extension;
 *       HEIC and anything else is null).
 *   upload(blob, name, {onProgress, posterFor, signal, base, threshold}) -> {id, key, url, type, size}
 *       <= 90 MB: one XHR POST /api/admin/upload (XHR for upload progress).
 *       Bigger video: multipart, 10 MiB parts, 3 retries per part (network/5xx),
 *       DELETE-abort on failure or cancel. onProgress gets {loaded, total}, always
 *       called at 0 and at total. Errors: MediaError unsupported (415), toolarge
 *       (413), network, aborted. `base` = origin prefix (default same-origin);
 *       `threshold` = single-POST limit (default 90 MB; tests lower it).
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

export const POSTER_MAX_SIDE = 1280;
const POSTER_TIMEOUT_MS = 15000;

/**
 * @param {File} file
 * @returns {"image"|"video"|null}
 */
export function kindOf(file) {
  const t = (file.type || "").toLowerCase();
  const ext = ((file.name || "").match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || "";
  if (/^image\/(jpeg|png|webp|avif)$/.test(t) || (!t && /^(jpe?g|png|webp|avif)$/.test(ext))) return "image";
  if (/^video\/(mp4|webm)$/.test(t) || (!t && /^(mp4|m4v|webm)$/.test(ext))) return "video";
  // A wrong or generic type: trust the extension.
  if (/^(jpe?g|png|webp|avif)$/.test(ext) && !t.startsWith("video/")) return "image";
  if (/^(mp4|m4v|webm)$/.test(ext) && !t.startsWith("image/")) return "video";
  return null;
}

/**
 * @param {File} file a video
 * @param {{webp?: boolean}} [opts]
 * @returns {Promise<{blob: Blob, type: string, width: number, height: number, ratio: number, duration: number}>}
 */
export async function preparePoster(file, opts = {}) {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  const unreadable = (cause) =>
    new MediaError("unreadable", `${file.name || "this video"} could not be read as a video`, cause);
  let timer;
  try {
    const when = (type) =>
      new Promise((resolve, reject) => {
        v.addEventListener(type, resolve, { once: true });
        v.addEventListener("error", () => reject(unreadable(v.error)), { once: true });
      });
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(unreadable(new Error("timeout"))), POSTER_TIMEOUT_MS);
    });
    const work = (async () => {
      v.src = url;
      await when("loadedmetadata");
      const duration = Number.isFinite(v.duration) ? v.duration : 0;
      const seeked = when("seeked");
      v.currentTime = duration ? Math.min(1, duration / 2) : 0;
      await seeked;
      if (!v.videoWidth || !v.videoHeight) throw unreadable(new Error("no picture"));
      const { width, height } = fit(v.videoWidth, v.videoHeight, POSTER_MAX_SIDE);
      const blob = await encode(v, width, height, opts);
      return { blob, type: blob.type, width, height, ratio: roundRatio(v.videoWidth, v.videoHeight), duration: Math.round(duration * 100) / 100 };
    })();
    work.catch(() => {}); // a late failure after the timeout is not unhandled
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(url);
  }
}

export const SINGLE_MAX = 90 * 1024 * 1024; // the Worker takes one POST up to 90 MB
export const PART_SIZE = 10 * 1024 * 1024; // multipart parts (R2 wants >= 5 MiB, equal sizes)
const PART_RETRIES = 3;

/** One XHR (fetch has no upload progress). Resolves {status, body}; rejects MediaError network/aborted. */
function xhr(method, url, body, headers, onUpload, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new MediaError("aborted", "upload cancelled"));
    const x = new XMLHttpRequest();
    x.open(method, url);
    for (const [k, v] of Object.entries(headers || {})) x.setRequestHeader(k, v);
    if (onUpload) x.upload.onprogress = (e) => onUpload(e.loaded);
    const onAbort = () => x.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const end = () => signal?.removeEventListener("abort", onAbort);
    x.onload = () => {
      end();
      let parsed = null;
      try { parsed = JSON.parse(x.responseText); } catch { /* not JSON */ }
      resolve({ status: x.status, body: parsed });
    };
    x.onerror = () => { end(); reject(new MediaError("network", "network error during upload")); };
    x.onabort = () => { end(); reject(new MediaError("aborted", "upload cancelled")); };
    x.send(body);
  });
}

/** Turns a non-2xx Worker answer into a MediaError (415 unsupported, 413 toolarge). */
function failure(res, what) {
  const msg = res.body?.error || `${what} failed (${res.status})`;
  const code = res.status === 415 ? "unsupported" : res.status === 413 ? "toolarge" : "network";
  return new MediaError(code, msg);
}

/**
 * @param {Blob} blob  prepared image/poster blob, or a video File
 * @param {string} name  original file name (only used to build the slug)
 * @param {{onProgress?: (p: {loaded: number, total: number}) => void, posterFor?: string, signal?: AbortSignal, base?: string}} [opts]
 * @returns {Promise<{id: string, key: string, url: string, type: string, size: number}>}
 */
export async function upload(blob, name, opts = {}) {
  const { onProgress, posterFor, signal, base = "", threshold = SINGLE_MAX } = opts;
  const total = blob.size;
  const progress = (loaded) => onProgress?.({ loaded: Math.min(loaded, total), total });
  progress(0);
  const videoType = blob.type === "video/mp4" || blob.type === "video/webm";
  if (total <= threshold || !videoType || posterFor) {
    const headers = { "x-file-name": name };
    if (posterFor) headers["x-poster-for"] = posterFor;
    const res = await xhr("POST", `${base}/api/admin/upload`, blob, headers, progress, signal);
    if (res.status !== 201 && res.status !== 200) throw failure(res, "upload");
    progress(total);
    return res.body;
  }
  // Multipart (videos over 90 MB).
  const json = { "content-type": "application/json" };
  const made = await xhr("POST", `${base}/api/admin/upload/mpu`, JSON.stringify({ name, type: blob.type, size: total }), json, null, signal);
  if (made.status !== 201 && made.status !== 200) throw failure(made, "upload");
  const { uploadId, key } = made.body;
  const q = `key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}`;
  const abort = () => xhr("DELETE", `${base}/api/admin/upload/mpu?${q}`, null, null, null, null).catch(() => {});
  try {
    const parts = [];
    let done = 0;
    for (let n = 1, off = 0; off < total; n++, off += PART_SIZE) {
      const chunk = blob.slice(off, Math.min(off + PART_SIZE, total));
      let res;
      for (let attempt = 0; ; attempt++) {
        try {
          res = await xhr("PUT", `${base}/api/admin/upload/mpu/part?${q}&n=${n}`, chunk, null, (l) => progress(done + l), signal);
        } catch (e) {
          if (e.code === "network" && attempt < PART_RETRIES) continue;
          throw e;
        }
        if (res.status >= 500 && attempt < PART_RETRIES) continue;
        break;
      }
      if (res.status !== 200) throw failure(res, "upload");
      parts.push({ partNumber: res.body.partNumber, etag: res.body.etag });
      done += chunk.size;
      progress(done);
    }
    const fin = await xhr("POST", `${base}/api/admin/upload/mpu/complete`, JSON.stringify({ key, uploadId, parts }), json, null, signal);
    if (fin.status !== 201 && fin.status !== 200) throw failure(fin, "upload");
    return fin.body;
  } catch (e) {
    await abort();
    throw e;
  }
}
