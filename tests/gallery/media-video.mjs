// G-01b: preparePoster + kindOf in headless Edge.   node tests/gallery/media-video.mjs
import fs from "node:fs";
import path from "node:path";
import { FIX, check, done, open } from "./browser.mjs";

const { page, close } = await open();
const mp4 = fs.readFileSync(path.join(FIX, "clip.mp4")).toString("base64");
const r = await page.evaluate(async (b64) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const p = await window.media.preparePoster(new File([bytes], "clip.mp4", { type: "video/mp4" }));
  const bmp = await createImageBitmap(p.blob);
  return { type: p.type, width: p.width, height: p.height, ratio: p.ratio, duration: p.duration, bw: bmp.width, bh: bmp.height };
}, mp4);
check("poster is image/webp", r.type === "image/webp", r.type);
check("160x90 (decoded too)", r.width === 160 && r.height === 90 && r.bw === 160 && r.bh === 90, `${r.width}x${r.height}`);
check("ratio 1.778", r.ratio === 1.778, String(r.ratio));
check("duration ~ 2", Math.abs(r.duration - 2) < 0.2, String(r.duration));

const bad = await page.evaluate(async () => {
  try {
    await window.media.preparePoster(new File([new Uint8Array(64)], "broken.mp4", { type: "video/mp4" }));
    return "no throw";
  } catch (e) {
    return e.code;
  }
});
check("broken video -> MediaError(unreadable)", bad === "unreadable", bad);

const kinds = await page.evaluate(() => {
  const k = (n, t) => window.media.kindOf(new File([""], n, { type: t }));
  return [k("a.jpg", "image/jpeg"), k("a.PNG", ""), k("a.mp4", "video/mp4"), k("a.webm", ""), k("a.heic", "image/heic"), k("a.mov", "video/quicktime"), k("a.txt", "text/plain"), k("a.mp4", "application/octet-stream")];
});
check("kindOf", JSON.stringify(kinds) === JSON.stringify(["image", "image", "video", "video", null, null, null, "video"]), JSON.stringify(kinds));

await close();
done();
