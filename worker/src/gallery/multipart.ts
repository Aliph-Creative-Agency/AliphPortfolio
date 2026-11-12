// Multipart upload for videos over the single-PUT limit (the Workers request
// body limit is 100 MB, so a single POST stops at 90 MB). Stateless: the
// browser holds uploadId + key and sends part numbers and etags back.
//
//   POST   /api/admin/upload/mpu           {name, type, size}        → {uploadId, key, id}
//   PUT    /api/admin/upload/mpu/part      ?key&uploadId&n, raw body → {partNumber, etag}
//   POST   /api/admin/upload/mpu/complete  {key, uploadId, parts}    → {id, key, url, type, size}
//   DELETE /api/admin/upload/mpu           ?key&uploadId             → {ok}
//
// R2 wants every part except the last >= 5 MiB and all parts equal-sized;
// it enforces that at complete (a 400 here). Keys are only ever admin/ ones.

import type { AdminCtx, Env } from "../index";
import { json } from "./routes";
import { sniff, SNIFF_BYTES } from "./sniff";
import { audit, CACHE, MEDIA_ORIGIN, newKeyBase, VIDEO_KEY_RE, VIDEO_MAX } from "./upload";

const TYPES: Record<string, "mp4" | "webm"> = { "video/mp4": "mp4", "video/webm": "webm" };
/** A part is buffered in memory; the browser sends 10 MiB parts. */
const PART_MAX = 32 * 1024 * 1024;
/** 300 MB / the 5 MiB R2 minimum. */
const MAX_PARTS = 60;

const extOf = (key: string) => key.slice(key.lastIndexOf(".") + 1) as "mp4" | "webm";

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await request.json();
    return b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function keyAndId(url: URL, input?: Record<string, unknown> | null) {
  const key = input ? input.key : url.searchParams.get("key");
  const uploadId = input ? input.uploadId : url.searchParams.get("uploadId");
  if (typeof key !== "string" || !VIDEO_KEY_RE.test(key)) return null;
  if (typeof uploadId !== "string" || !uploadId || uploadId.length > 512) return null;
  return { key, uploadId };
}

const BAD_KEY = () => json({ error: "bad key or uploadId (an admin/ video key)" }, 400);

export async function mpuCreate(request: Request, env: Env): Promise<Response> {
  const b = await body(request);
  if (!b) return json({ error: "bad json" }, 400);
  const ext = typeof b.type === "string" ? TYPES[b.type] : undefined;
  if (!ext) return json({ error: "type must be video/mp4 or video/webm" }, 400);
  if (typeof b.size !== "number" || !Number.isInteger(b.size) || b.size <= 0) return json({ error: "bad size" }, 400);
  if (b.size > VIDEO_MAX) return json({ error: "video over 300 MB" }, 413);
  const { id, base } = newKeyBase(typeof b.name === "string" ? b.name : "");
  const key = `${base}.${ext}`;
  const mpu = await env.MEDIA_BUCKET.createMultipartUpload(key, {
    httpMetadata: { contentType: b.type as string, cacheControl: CACHE },
  });
  return json({ uploadId: mpu.uploadId, key, id }, 201);
}

export async function mpuPart(request: Request, env: Env, url: URL): Promise<Response> {
  const ku = keyAndId(url);
  if (!ku) return BAD_KEY();
  const n = Number(url.searchParams.get("n"));
  if (!Number.isInteger(n) || n < 1 || n > MAX_PARTS) {
    return n > MAX_PARTS ? json({ error: "too many parts for 300 MB" }, 413) : json({ error: "bad part number" }, 400);
  }
  const len = Number(request.headers.get("content-length"));
  if (Number.isFinite(len) && len > PART_MAX) {
    await request.body?.cancel();
    return json({ error: "part over 32 MiB" }, 413);
  }
  const buf = new Uint8Array(await request.arrayBuffer());
  if (buf.length === 0) return json({ error: "empty part" }, 400);
  if (buf.length > PART_MAX) return json({ error: "part over 32 MiB" }, 413);

  const mpu = env.MEDIA_BUCKET.resumeMultipartUpload(ku.key, ku.uploadId);
  if (n === 1) {
    // The first bytes decide: only the declared kind (mp4/webm) goes on.
    const s = buf.length >= SNIFF_BYTES ? sniff(buf) : null;
    if (!s || s.kind !== "video" || s.ext !== extOf(ku.key)) {
      await mpu.abort().catch(() => {});
      return json({ error: "not an mp4/webm of the declared type; upload aborted" }, 415);
    }
  }
  try {
    const p = await mpu.uploadPart(n, buf);
    return json({ partNumber: p.partNumber, etag: p.etag });
  } catch {
    return json({ error: "unknown or finished upload" }, 404);
  }
}

export async function mpuComplete(request: Request, env: Env, url: URL, ctx: AdminCtx): Promise<Response> {
  const b = await body(request);
  const ku = b && keyAndId(url, b);
  if (!b || !ku) return BAD_KEY();
  const parts = b.parts;
  if (!Array.isArray(parts) || parts.length < 1 || parts.length > MAX_PARTS) return json({ error: "bad parts" }, 400);
  const list: R2UploadedPart[] = [];
  for (const p of parts as Record<string, unknown>[]) {
    if (!p || !Number.isInteger(p.partNumber) || typeof p.etag !== "string") return json({ error: "bad parts" }, 400);
    list.push({ partNumber: p.partNumber as number, etag: p.etag });
  }
  const mpu = env.MEDIA_BUCKET.resumeMultipartUpload(ku.key, ku.uploadId);
  let obj: R2Object;
  try {
    obj = await mpu.complete(list);
  } catch (err) {
    // R2 refuses unequal or too-small parts and unknown etags here.
    await mpu.abort().catch(() => {});
    return json({ error: "could not assemble the parts: " + (err instanceof Error ? err.message : "unknown") }, 400);
  }
  // The parts were counted by R2, not trusted from the client: over the
  // cap the assembled object goes again.
  if (obj.size > VIDEO_MAX) {
    await env.MEDIA_BUCKET.delete(ku.key);
    return json({ error: "video over 300 MB" }, 413);
  }
  await audit(env, ctx.adminEmail, "upload.mpu", ku.key, { size: obj.size, parts: list.length });
  const id = ku.key.split("/").pop()!.replace(/\.[a-z0-9]+$/, "");
  return json({ id, key: ku.key, url: `${MEDIA_ORIGIN}/${ku.key}`, type: obj.httpMetadata?.contentType, size: obj.size }, 201);
}

export async function mpuAbort(env: Env, url: URL): Promise<Response> {
  const ku = keyAndId(url);
  if (!ku) return BAD_KEY();
  try {
    await env.MEDIA_BUCKET.resumeMultipartUpload(ku.key, ku.uploadId).abort();
  } catch {
    /* already gone: the goal (no object, no open upload) holds */
  }
  return json({ ok: true });
}
