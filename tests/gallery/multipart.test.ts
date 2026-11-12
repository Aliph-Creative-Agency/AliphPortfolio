// G-00c: multipart uploads for big videos.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, del, installAccess, post, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

const MiB = 1024 * 1024;
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
function video(total: number): Uint8Array {
  const b = new Uint8Array(total);
  for (let i = 0; i < total; i++) b[i] = (i * 31 + 7) & 0xff;
  b.set([0, 0, 0, 0x18, ...ascii("ftyp"), ...ascii("isom")]);
  return b;
}
const create = async (over: Record<string, unknown> = {}) => {
  const r = await post("/api/admin/upload/mpu", { name: "Big Reel.mp4", type: "video/mp4", size: 11 * MiB, ...over });
  return r;
};
const part = (c: { key: string; uploadId: string }, n: number, data: Uint8Array) =>
  call(`/api/admin/upload/mpu/part?key=${encodeURIComponent(c.key)}&uploadId=${encodeURIComponent(c.uploadId)}&n=${n}`, {
    method: "PUT",
    body: data,
  });

describe("multipart", () => {
  it("3 parts (5 MiB, 5 MiB, 1 KiB) reassemble byte-equal", async () => {
    const whole = video(10 * MiB + 1024);
    const r = await create();
    expect(r.status).toBe(201);
    const c = (await r.json()) as { uploadId: string; key: string; id: string };
    expect(c.key).toMatch(/^admin\/\d{4}\/\d{2}\/[a-z0-9]{6}-big-reel\.mp4$/);
    const cuts = [0, 5 * MiB, 10 * MiB, whole.length];
    const parts = [];
    for (let i = 0; i < 3; i++) {
      const pr = await part(c, i + 1, whole.subarray(cuts[i], cuts[i + 1]));
      expect(pr.status).toBe(200);
      parts.push(await pr.json());
    }
    const done = await post("/api/admin/upload/mpu/complete", { key: c.key, uploadId: c.uploadId, parts });
    expect(done.status).toBe(201);
    const j = (await done.json()) as { key: string; size: number; type: string; url: string };
    expect(j.size).toBe(whole.length);
    expect(j.type).toBe("video/mp4");
    expect(j.url).toBe(`https://media.aliphcreative.com/${c.key}`);
    const o = await env.MEDIA_BUCKET.get(c.key);
    expect(o!.httpMetadata!.contentType).toBe("video/mp4");
    // a loop, not toEqual: vitest diffing 10M-element arrays runs out of memory
    const got = new Uint8Array(await o!.arrayBuffer());
    expect(got.length).toBe(whole.length);
    let diff = -1;
    for (let i = 0; i < got.length; i++) if (got[i] !== whole[i]) { diff = i; break; }
    expect(diff).toBe(-1);
    const a = await env.DB.prepare("SELECT target FROM audit WHERE action = 'upload.mpu' ORDER BY id DESC LIMIT 1").first<{ target: string }>();
    expect(a!.target).toBe(c.key);
  });

  it("part 1 that is a JPEG → 415 and the upload is aborted", async () => {
    const c = (await (await create()).json()) as { uploadId: string; key: string };
    const jpeg = new Uint8Array(5 * MiB);
    jpeg.set([0xff, 0xd8, 0xff, 0xe0]);
    expect((await part(c, 1, jpeg)).status).toBe(415);
    // the upload is gone: another part or a complete cannot go through
    expect((await part(c, 2, video(5 * MiB))).status).toBe(404);
    const done = await post("/api/admin/upload/mpu/complete", { key: c.key, uploadId: c.uploadId, parts: [{ partNumber: 1, etag: "x" }] });
    expect(done.status).toBe(400);
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
  });

  it("a webm body for a declared mp4 is refused too", async () => {
    const c = (await (await create()).json()) as { uploadId: string; key: string };
    const webm = new Uint8Array(5 * MiB);
    webm.set([0x1a, 0x45, 0xdf, 0xa3]);
    expect((await part(c, 1, webm)).status).toBe(415);
  });

  it("abort leaves no object", async () => {
    const c = (await (await create()).json()) as { uploadId: string; key: string };
    expect((await part(c, 1, video(5 * MiB))).status).toBe(200);
    const r = await del(`/api/admin/upload/mpu?key=${encodeURIComponent(c.key)}&uploadId=${encodeURIComponent(c.uploadId)}`);
    expect(r.status).toBe(200);
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
    expect((await env.MEDIA_BUCKET.list({ prefix: "admin/" })).objects.length).toBe(0);
    expect((await part(c, 2, video(5 * MiB))).status).toBe(404);
  });

  it("keys outside admin/ → 400 on every route", async () => {
    const bad = { key: "assets/x.mp4", uploadId: "u" };
    expect((await part(bad, 1, video(100))).status).toBe(400);
    expect((await post("/api/admin/upload/mpu/complete", { ...bad, parts: [] })).status).toBe(400);
    expect((await del("/api/admin/upload/mpu?key=other/x.mp4&uploadId=u")).status).toBe(400);
  });

  it("create: size over 300 MB → 413; image type → 400; foreign Origin → 403", async () => {
    expect((await create({ size: 301 * MiB })).status).toBe(413);
    expect((await create({ type: "image/jpeg" })).status).toBe(400);
    expect((await post("/api/admin/upload/mpu", { name: "a.mp4", type: "video/mp4", size: 1 }, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("complete without part 1 (the only sniffed part) → 400, nothing stored", async () => {
    const c = (await (await create()).json()) as { uploadId: string; key: string };
    const junk = new Uint8Array(1024).fill(0x3c); // "<<<<": not a video
    const p2 = (await (await part(c, 2, junk)).json()) as { partNumber: number; etag: string };
    const done = await post("/api/admin/upload/mpu/complete", { key: c.key, uploadId: c.uploadId, parts: [p2] });
    expect(done.status).toBe(400);
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
  });

  it("part numbers past 60 → 413", async () => {
    const c = (await (await create()).json()) as { uploadId: string; key: string };
    expect((await part(c, 61, video(100))).status).toBe(413);
  });
});
