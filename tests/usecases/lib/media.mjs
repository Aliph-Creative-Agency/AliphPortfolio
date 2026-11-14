// Test media generator (ffmpeg on PATH). Output goes to ORCH/media, never into the repo.
//   node tests/usecases/lib/media.mjs          -> generate + list (size, ffprobe dims/duration)
// Import { MEDIA, bigVideo } from a case script.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync, statSync, openSync, ftruncateSync, closeSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MEDIA = "D:/Personal/Projects/aliph-portfolio/.orchestration/teams/usecases/media";
const FONT = "C\\:/Windows/Fonts/arial.ttf"; // escaped colon for the drawtext filter
const COLORS = ["0xE63946", "0x2A9D8F", "0xF4A261", "0x264653", "0x8338EC", "0xFFB703", "0x06D6A0", "0x118AB2"];
const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });

/** n = 1..8. Odd = landscape 2400x1600, even = portrait 1600x2400 (mixed on purpose). Number big in the centre, colour marker top-left. */
export function photo(n, file = path.join(MEDIA, `photo-${n}.jpg`)) {
  const land = n % 2 === 1, w = land ? 2400 : 1600, h = land ? 1600 : 2400, c = COLORS[n - 1];
  const vf = [`drawbox=x=0:y=0:w=${Math.round(w / 5)}:h=${Math.round(w / 5)}:color=${c}:t=fill`,
    `drawbox=x=${Math.round(w / 5)}:y=0:w=${w}:h=60:color=white:t=fill`, // white bar: shows crop at the top
    `drawtext=fontfile='${FONT}':text='${n}':fontsize=${Math.round(h / 2)}:fontcolor=white:borderw=14:bordercolor=black:x=(w-tw)/2:y=(h-th)/2`,
    `drawtext=fontfile='${FONT}':text='PHOTO ${n} ${land ? "LANDSCAPE" : "PORTRAIT"}':fontsize=${Math.round(w / 18)}:fontcolor=white:borderw=6:bordercolor=black:x=(w-tw)/2:y=h-th-80`].join(",");
  ff(["-f", "lavfi", "-i", `color=c=0x3a3a3a:s=${w}x${h}:d=1`, "-vf", vf.replace(/^/, "format=rgb24,"), "-frames:v", "1", "-q:v", "3", file]);
}
export function hero(file = path.join(MEDIA, "hero-photo.jpg")) {
  const vf = `drawbox=x=0:y=0:w=600:h=600:color=0xFF006E:t=fill,drawbox=x=2400:y=1400:w=600:h=600:color=0x3A86FF:t=fill,` +
    `drawtext=fontfile='${FONT}':text='HERO-PHOTO':fontsize=330:fontcolor=white:borderw=14:bordercolor=black:x=(w-tw)/2:y=(h-th)/2`;
  ff(["-f", "lavfi", "-i", "color=c=0x1D3557:s=3000x2000:d=1", "-vf", vf, "-frames:v", "1", "-q:v", "3", file]);
}
/** 1080p h264 yuv420p, 6 s, with a moving box (proves it plays) and a label. */
export function video(label, file, bg = "0x6A0572") {
  const vf = `drawbox=x='mod(t*300,1700)':y=900:w=220:h=120:color=white:t=fill,` +
    `drawtext=fontfile='${FONT}':text='${label}':fontsize=220:fontcolor=white:borderw=10:bordercolor=black:x=(w-tw)/2:y=(h-th)/2-80,` +
    `drawtext=fontfile='${FONT}':text='%{eif\\:t\\:d}s':fontsize=120:fontcolor=white:x=60:y=40`;
  ff(["-f", "lavfi", "-i", `color=c=${bg}:s=1920x1080:r=30:d=6`, "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", file]);
}
export function junk() {
  writeFileSync(path.join(MEDIA, "fake.jpg"), "This is plain text pretending to be a photo.\n".repeat(40));
  writeFileSync(path.join(MEDIA, "doc.pdf"), "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
  writeFileSync(path.join(MEDIA, "photo.heic"), Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypheic"), Buffer.alloc(200)]));
}
/** Writes a >300 MB .mp4 (valid small clip, zero-padded to mb MB) into the OS temp dir. Returns its path; caller deletes it with rmBig. */
export function bigVideo(file = path.join(tmpdir(), "uc-big-video.mp4"), mb = 310) {
  const small = path.join(MEDIA, "video.mp4");
  if (!existsSync(small)) video("VIDEO", small);
  copyFileSync(small, file);
  const fd = openSync(file, "r+"); ftruncateSync(fd, mb * 1024 * 1024); closeSync(fd);
  return file;
}
export const rmBig = (file = path.join(tmpdir(), "uc-big-video.mp4")) => rmSync(file, { force: true });

export function generate() {
  mkdirSync(MEDIA, { recursive: true });
  for (let n = 1; n <= 8; n++) photo(n);
  hero();
  video("VIDEO", path.join(MEDIA, "video.mp4"), "0x6A0572");
  video("HERO-VIDEO", path.join(MEDIA, "hero-video.mp4"), "0x00695C");
  junk();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate();
  for (const f of readdirSync(MEDIA).sort()) {
    const p = path.join(MEDIA, f), kb = Math.round(statSync(p).size / 1024);
    let info = "";
    if (/\.(jpg|mp4)$/.test(f) && f !== "fake.jpg") {
      try {
        info = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height:format=duration",
          "-of", "csv=p=0", p], { encoding: "utf8" }).trim().replace(/\s+/g, " ");
      } catch { info = "ffprobe failed"; }
    }
    console.log(`${f.padEnd(16)} ${String(kb).padStart(7)} KB  ${info}`);
  }
}
