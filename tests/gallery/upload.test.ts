// G-00b: single upload + sniffing + admin media read.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, installAccess, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

const bytes = (head: number[], total = 64) => {
  const b = new Uint8Array(total);
  b.set(head);
  return b;
};
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = bytes([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")]);
const MP4 = bytes([0, 0, 0, 0x18, ...ascii("ftyp"), ...ascii("isom")]);
const MOV = bytes([0, 0, 0, 0x14, ...ascii("ftyp"), ...ascii("qt  ")]);
const EXE = bytes([0x4d, 0x5a, 0x90, 0]);

const up = (body: Uint8Array, name = "My Photo (1).JPG", extra: Record<string, string> = {}, opts: { origin?: string | null } = {}) =>
  call("/api/admin/upload", { method: "POST", body, headers: { "x-file-name": name, ...extra }, ...opts });

describe("POST /api/admin/upload", () => {
  it("jpeg, webp and mp4 are stored with the sniffed content-type and read back", async () => {
    for (const [b, type, ext] of [
      [JPEG, "image/jpeg", "jpg"],
      [WEBP, "image/webp", "webp"],
      [MP4, "video/mp4", "mp4"],
    ] as const) {
      const r = await up(b, "renamed.exe");
      expect(r.status).toBe(201);
      const j = (await r.json()) as { id: string; key: string; url: string; type: string; size: number };
      expect(j.type).toBe(type);
      expect(j.size).toBe(b.length);
      expect(j.key).toMatch(new RegExp(`^admin/\\d{4}/\\d{2}/[a-z0-9]{6}-renamed\\.${ext}$`));
      expect(j.url).toBe(`https://media.aliphcreative.com/${j.key}`);
      const o = await env.MEDIA_BUCKET.get(j.key);
      expect(o!.httpMetadata!.contentType).toBe(type);
      expect(o!.httpMetadata!.cacheControl).toBe("public, max-age=31536000, immutable");
      expect(new Uint8Array(await o!.arrayBuffer())).toEqual(b);
    }
  });

  it("slug: ASCII, 40 chars max, fallback file", async () => {
    const a = (await (await up(JPEG, encodeURIComponent("ÅÄÖ.jpg"))).json()) as { id: string };
    expect(a.id).toMatch(/^[a-z0-9]{6}-file$/);
    const b = (await (await up(JPEG, "x".repeat(80) + ".jpg")).json()) as { id: string };
    expect(b.id.length).toBe(6 + 1 + 40);
  });

  it("a renamed exe (MZ) → 415; QuickTime ftypqt → 415; text → 415", async () => {
    expect((await up(EXE, "photo.jpg")).status).toBe(415);
    expect((await up(MOV, "clip.mp4")).status).toBe(415);
    expect((await up(new TextEncoder().encode("hello world, not media"), "a.jpg")).status).toBe(415);
    expect((await env.MEDIA_BUCKET.list({ prefix: "admin/" })).objects.length).toBe(0);
  });

  it("oversize image → 413; body over 90 MB → 413 with the multipart hint", async () => {
    const r = await up(bytes([0xff, 0xd8, 0xff, 0xe0], 26 * 1024 * 1024));
    expect(r.status).toBe(413);
    const big = await call("/api/admin/upload", {
      method: "POST",
      body: bytes([0xff, 0xd8, 0xff], 16),
      headers: { "content-length": String(91 * 1024 * 1024) },
    });
    expect(big.status).toBe(413);
    expect(((await big.json()) as { error: string }).error).toMatch(/multipart/);
  });

  it("foreign or missing Origin → 403, nothing stored", async () => {
    expect((await up(JPEG, "a.jpg", {}, { origin: "https://evil.example" })).status).toBe(403);
    expect((await up(JPEG, "a.jpg", {}, { origin: null })).status).toBe(403);
    expect((await env.MEDIA_BUCKET.list({ prefix: "admin/" })).objects.length).toBe(0);
  });

  it("x-poster-for puts the poster beside the video as <stem>.poster.<ext>", async () => {
    const v = (await (await up(MP4, "clip.mp4")).json()) as { key: string };
    const r = await up(WEBP, "p.webp", { "x-poster-for": v.key });
    expect(r.status).toBe(201);
    const p = (await r.json()) as { key: string };
    expect(p.key).toBe(v.key.replace(/\.mp4$/, ".poster.webp"));
    // a video as poster, or a key outside admin/ → refused
    expect((await up(MP4, "p.mp4", { "x-poster-for": v.key })).status).toBe(415);
    expect((await up(WEBP, "p.webp", { "x-poster-for": "assets/x.mp4" })).status).toBe(400);
  });

  it("writes an upload.put audit row by the admin", async () => {
    const j = (await (await up(JPEG)).json()) as { key: string };
    const row = await env.DB.prepare("SELECT actor, target FROM audit WHERE action = 'upload.put' ORDER BY id DESC LIMIT 1").first<{ actor: string; target: string }>();
    expect(row).toEqual({ actor: "ceo@aliphcreative.com", target: j.key });
  });
});

describe("GET /api/admin/media/<key>", () => {
  it("streams an admin/ object with its content-type", async () => {
    const j = (await (await up(WEBP)).json()) as { key: string };
    const r = await call(`/api/admin/media/${j.key}`);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/webp");
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(WEBP);
  });
  it("a non-admin/ key or a traversal → 404", async () => {
    await env.MEDIA_BUCKET.put("other/x.webp", WEBP);
    expect((await call("/api/admin/media/other/x.webp")).status).toBe(404);
    expect((await call("/api/admin/media/admin/..%2Fother/x.webp")).status).toBe(404);
    expect((await call("/api/admin/media/admin/2026/01/nope.webp")).status).toBe(404);
  });
});
