import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

// With the Worker in front, every response must equal what the assets layer
// alone gives: status, body bytes, content-type, location.
const FONT = "/assets/fonts/29LTIdris-FlatBold.woff2";
const IMG = "/assets/img/Aliph-Icon.svg";
const URLS = ["/", "/about", "/library", "/index.html", "/style.css", "/main.js", FONT, IMG, "/nope"];

async function snap(res: Response) {
  return {
    status: res.status,
    type: res.headers.get("content-type"),
    location: res.headers.get("location"),
    body: new Uint8Array(await res.arrayBuffer()),
  };
}

describe("Worker pass-through parity", () => {
  for (const path of URLS) {
    it(`${path} equals the assets response`, async () => {
      const url = "http://example.com" + path;
      const viaWorker = await snap(await SELF.fetch(url, { redirect: "manual" }));
      const direct = await snap(await env.ASSETS.fetch(url, { redirect: "manual" }));
      expect(viaWorker.status).toBe(direct.status);
      expect(viaWorker.type).toBe(direct.type);
      expect(viaWorker.location).toBe(direct.location);
      expect(viaWorker.body).toEqual(direct.body);
    });
  }

  it("/index.html redirects to / and /nope is 404", async () => {
    const r = await SELF.fetch("http://example.com/index.html", { redirect: "manual" });
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toMatch(/\/$/);
    expect((await SELF.fetch("http://example.com/nope")).status).toBe(404);
  });
});
