// Regenerates the fixtures next to this file (both are committed, each < 200 KB):
//   photo-plain.jpg  3000x2000 gradient JPEG, no EXIF (Edge canvas)
//   photo-exif.jpg   the same bytes with an EXIF APP1 spliced in:
//                    DateTimeOriginal 2019:07:04 10:11:12
//   clip.mp4         2 s 160x90 H.264 (ffmpeg)
// Run: node tests/gallery/fixtures/make.mjs   (needs Edge and ffmpeg on PATH)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const dir = path.dirname(fileURLToPath(import.meta.url));
export const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
const b64 = await page.evaluate(async () => {
  const c = document.createElement("canvas");
  c.width = 3000;
  c.height = 2000;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 3000, 2000);
  grad.addColorStop(0, "#c8553d");
  grad.addColorStop(0.5, "#f3e9dc");
  grad.addColorStop(1, "#2a4d69");
  g.fillStyle = grad;
  g.fillRect(0, 0, 3000, 2000);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.4));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
});
await browser.close();
const plain = Buffer.from(b64, "base64");
fs.writeFileSync(path.join(dir, "photo-plain.jpg"), plain);

// APP1: "Exif\0\0" + big-endian TIFF with IFD0 -> ExifIFD -> DateTimeOriginal.
const date = Buffer.from("2019:07:04 10:11:12\0", "latin1"); // 20 bytes
const tiff = Buffer.alloc(64);
tiff.write("MM", 0, "latin1");
tiff.writeUInt16BE(42, 2);
tiff.writeUInt32BE(8, 4); // IFD0
tiff.writeUInt16BE(1, 8); // one entry
tiff.writeUInt16BE(0x8769, 10); // ExifIFD pointer
tiff.writeUInt16BE(4, 12); // LONG
tiff.writeUInt32BE(1, 14);
tiff.writeUInt32BE(26, 18); // ExifIFD offset
tiff.writeUInt32BE(0, 22); // no next IFD
tiff.writeUInt16BE(1, 26); // ExifIFD: one entry
tiff.writeUInt16BE(0x9003, 28); // DateTimeOriginal
tiff.writeUInt16BE(2, 30); // ASCII
tiff.writeUInt32BE(20, 32);
tiff.writeUInt32BE(44, 36); // string offset
tiff.writeUInt32BE(0, 40);
date.copy(tiff, 44);
const body = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([(body.length + 2) >> 8, (body.length + 2) & 0xff]), body]);
fs.writeFileSync(path.join(dir, "photo-exif.jpg"), Buffer.concat([plain.subarray(0, 2), app1, plain.subarray(2)]));

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "lavfi", "-i", "testsrc=size=160x90:rate=15:duration=2",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  path.join(dir, "clip.mp4"),
]);
for (const f of ["photo-plain.jpg", "photo-exif.jpg", "clip.mp4"]) console.log(f, fs.statSync(path.join(dir, f)).size);
