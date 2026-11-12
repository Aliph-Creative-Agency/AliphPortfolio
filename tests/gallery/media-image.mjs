// G-01a: prepareImage in headless Edge.   node tests/gallery/media-image.mjs
import fs from "node:fs";
import path from "node:path";
import { FIX, check, done, open } from "./browser.mjs";

const { page, close } = await open();
const b64 = (f) => fs.readFileSync(path.join(FIX, f)).toString("base64");
const run = (file, opts, lastModified) =>
  page.evaluate(
    async ({ b64, opts, lastModified }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const file = new File([bytes], "photo.jpg", { type: "image/jpeg", lastModified });
      const r = await window.media.prepareImage(file, opts);
      const bmp = await createImageBitmap(r.blob);
      return { type: r.type, blobType: r.blob.type, width: r.width, height: r.height, ratio: r.ratio, date: r.date, bw: bmp.width, bh: bmp.height };
    },
    { b64: b64(file), opts, lastModified },
  );

const mod = Date.UTC(2023, 2, 15, 12); // 2023-03 whatever the local zone
const a = await run("photo-exif.jpg", {}, mod);
check("exif jpeg -> image/webp", a.type === "image/webp" && a.blobType === "image/webp", a.type);
check("2000x1333 (decoded blob too)", a.width === 2000 && a.height === 1333 && a.bw === 2000 && a.bh === 1333, `${a.width}x${a.height}`);
check("ratio 1.5", a.ratio === 1.5, String(a.ratio));
check("date from EXIF DateTimeOriginal", a.date === "2019-07-04", a.date);

const b = await run("photo-plain.jpg", {}, mod);
check("no EXIF -> YYYY-MM of lastModified", b.date === "2023-03", b.date);

const c = await run("photo-exif.jpg", { webp: false }, mod);
check("forced no-WebP -> image/jpeg", c.type === "image/jpeg" && c.blobType === "image/jpeg", c.type);

const bad = await page.evaluate(async () => {
  try {
    await window.media.prepareImage(new File([new Uint8Array([1, 2, 3, 4])], "x.heic", { type: "image/heic" }));
    return "no throw";
  } catch (e) {
    return e instanceof window.media.MediaError ? e.code : String(e);
  }
});
check("undecodable file -> MediaError(unreadable)", bad === "unreadable", bad);

await close();
done();
