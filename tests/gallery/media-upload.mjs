// G-01c: upload() against `wrangler dev --local --port 8851` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/media-upload.mjs
import { chromium } from "playwright-core";
import { EDGE, check, done } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
const parts = [];
page.on("request", (r) => { if (r.method() === "PUT" && r.url().includes("/upload/mpu/part")) parts.push(r.url()); });
await page.goto(ORIGIN + "/");
await page.evaluate(async () => { window.media = await import("/admin/shared/media.js"); });

// A 1 MB WebP-shaped blob in one POST, progress called at least twice.
const one = await page.evaluate(async () => {
  const b = new Uint8Array(1024 * 1024);
  b.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const calls = [];
  const r = await window.media.upload(new Blob([b], { type: "image/webp" }), "Tiny Photo.webp", { onProgress: (p) => calls.push(p.loaded) });
  const back = await fetch("/api/admin/media/" + r.key).then((x) => x.arrayBuffer());
  return { r, calls, back: back.byteLength };
});
check("1 MB: one POST, >= 2 progress calls", one.calls.length >= 2 && one.calls.at(-1) === 1048576, JSON.stringify(one.calls));
check("1 MB: admin/ key, webp, size back equal", /^admin\/\d{4}\/\d{2}\/.+\.webp$/.test(one.r.key) && one.back === 1048576, one.r.key);
check("1 MB: no multipart parts used", parts.length === 0);

// 21 MiB fake mp4 (valid ftyp header) -> multipart, 3 parts.
const SIZE = 21 * 1024 * 1024;
const big = await page.evaluate(async (size) => {
  const b = new Uint8Array(size);
  b.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]); // ....ftypisom
  // Force the multipart path without a 90 MB blob: the module's threshold is exported.
  const m = window.media;
  const r = await m.upload(new Blob([b], { type: "video/mp4" }), "clip.mp4", { threshold: 5 * 1024 * 1024 });
  const back = await fetch("/api/admin/media/" + r.key).then((x) => x.arrayBuffer());
  return { r, back: back.byteLength };
}, SIZE);
check("21 MiB: 3 parts", parts.length === 3, String(parts.length));
check("21 MiB: size-equal via GET media", big.back === SIZE && big.r.size === SIZE && big.r.key.endsWith(".mp4"), `${big.back} ${big.r.key}`);

// Cancel mid-way aborts the multipart upload (no object left).
const cancelled = await page.evaluate(async (size) => {
  const b = new Uint8Array(size);
  b.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
  const ac = new AbortController();
  try {
    await window.media.upload(new Blob([b], { type: "video/mp4" }), "cancel.mp4", { threshold: 5 * 1024 * 1024, signal: ac.signal, onProgress: (p) => { if (p.loaded >= 10 * 1024 * 1024) ac.abort(); } });
    return "no throw";
  } catch (e) { return e.code; }
}, SIZE);
check("cancel -> MediaError(aborted)", cancelled === "aborted", cancelled);

// A non-media blob -> unsupported (415).
const bad = await page.evaluate(async () => {
  try { await window.media.upload(new Blob([new Uint8Array(64)], { type: "image/webp" }), "x.webp"); return "no throw"; } catch (e) { return e.code; }
});
check("bad bytes -> MediaError(unsupported)", bad === "unsupported", bad);

await browser.close();
done();
