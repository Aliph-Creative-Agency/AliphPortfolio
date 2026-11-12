// Shared by the headless-Edge media tests (media-*.mjs): a tiny static server
// for prototype/ so the ES module loads over http, and an Edge launcher.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

export const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const FIX = path.join(ROOT, "tests/gallery/fixtures");
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".mp4": "video/mp4", ".jpg": "image/jpeg" };

/** Serves prototype/ and tests/gallery/fixtures/ (at /fixtures/) on a free port. */
export function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") {
      res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><title>t</title>");
      return;
    }
    const file = p.startsWith("/fixtures/")
      ? path.join(FIX, p.slice(10))
      : path.join(ROOT, "prototype", p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

export async function open() {
  const { server, origin } = await serve();
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage();
  await page.goto(origin + "/");
  await page.evaluate(async () => {
    window.media = await import("/admin/shared/media.js");
  });
  return { page, origin, close: async () => { await browser.close(); server.close(); } };
}

let failed = 0;
export function check(name, ok, extra = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
}
export const done = () => {
  console.log(failed ? `${failed} FAILED` : "all passed");
  process.exit(failed ? 1 : 0);
};
