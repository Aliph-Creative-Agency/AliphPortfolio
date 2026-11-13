// POST /api/admin/upload: one raw body straight into R2 (up to 90 MB; bigger
// videos use the multipart routes). GET /api/admin/media/<key>: streams an
// admin/ object back, for local previews where media.aliphcreative.com has no
// copy. Keys: admin/<yyyy>/<mm>/<id>.<ext>, id = 6 random base36 + "-" + slug.
// A new key never replaces an object (F-05): the id is re-rolled while the key
// is taken, and the put itself only writes if the key is still free.

import type { AdminCtx, Env } from "../index";
import { json } from "./routes";
import { SNIFF_BYTES, sniff, type Sniffed } from "./sniff";

export const MEDIA_ORIGIN = "https://media.aliphcreative.com";
export const SINGLE_MAX = 90 * 1024 * 1024;
export const IMAGE_MAX = 25 * 1024 * 1024;
export const VIDEO_MAX = 300 * 1024 * 1024;
export const CACHE = "public, max-age=31536000, immutable";

/** admin/yyyy/mm/<id>.<ext>; a poster ends .poster.<ext>. */
export const VIDEO_KEY_RE = /^admin\/\d{4}\/\d{2}\/[a-z0-9-]{1,60}\.(mp4|webm)$/;
export const ADMIN_KEY_RE = /^admin\/\d{4}\/\d{2}\/[a-z0-9-]{1,60}(\.poster)?\.(jpg|png|webp|avif|mp4|webm)$/;

export function slug(name: string): string {
  let n = name;
  try {
    n = decodeURIComponent(name);
  } catch {
    /* keep the raw name */
  }
  n = n.replace(/^.*[\\/]/, "").replace(/\.[A-Za-z0-9]{1,5}$/, "");
  const s = n
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return s || "file";
}

function randomId(): string {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(b, (v) => (v % 36).toString(36)).join("");
}

/** New id + key base (no extension) for today. */
export function newKeyBase(name: string, now = new Date()): { id: string; base: string } {
  const id = `${randomId()}-${slug(name)}`;
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return { id, base: `admin/${yyyy}/${mm}/${id}` };
}

/** Fresh ids tried before giving up. A clash needs the same slug in the same
 *  month AND the same ~31-bit draw, so a second try is already rare. */
export const KEY_TRIES = 5;

/** A key base whose `<base>.<ext>` holds no object yet; null after KEY_TRIES
 *  taken keys. Runs before any body is streamed (a stream cannot be re-sent). */
export async function freeKeyBase(env: Env, name: string, ext: string): Promise<{ id: string; base: string } | null> {
  for (let i = 0; i < KEY_TRIES; i++) {
    const nb = newKeyBase(name);
    if (!(await env.MEDIA_BUCKET.head(`${nb.base}.${ext}`))) return nb;
  }
  return null;
}

/** put() only if the key is still free: R2 checks it as it commits, so two
 *  uploads racing for one key cannot both land (the loser's put is null). */
export const IF_ABSENT = (): R2PutOptions["onlyIf"] => new Headers({ "if-none-match": "*" });

export const KEY_TAKEN = () => json({ error: "storage key already taken; upload the file again" }, 409);

export async function audit(env: Env, actor: string, action: string, target: string | null, detail?: unknown) {
  await env.DB.prepare("INSERT INTO audit (actor, action, target, detail) VALUES (?, ?, ?, ?)")
    .bind(actor, action, target, detail === undefined ? null : JSON.stringify(detail))
    .run();
}

const tooBig = (what: string) => json({ error: what }, 413);

/** Pulls chunks until `n` bytes are in hand (or the stream ends). */
async function readHead(reader: ReadableStreamDefaultReader<Uint8Array>, n: number) {
  const chunks: Uint8Array[] = [];
  let have = 0;
  let done = false;
  while (have < n && !done) {
    const r = await reader.read();
    if (r.done) done = true;
    else {
      chunks.push(r.value);
      have += r.value.length;
    }
  }
  const head = new Uint8Array(have);
  let o = 0;
  for (const c of chunks) {
    head.set(c, o);
    o += c.length;
  }
  return { head, chunks, done };
}

export async function uploadPut(request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  const declared = Number(request.headers.get("content-length"));
  const hasLen = request.headers.has("content-length") && Number.isFinite(declared);
  if (hasLen && declared > SINGLE_MAX) {
    await request.body?.cancel();
    return tooBig("file over 90 MB: use multipart");
  }
  if (!request.body) return json({ error: "empty body" }, 400);

  const name = request.headers.get("x-file-name") ?? "";
  const posterFor = request.headers.get("x-poster-for");
  if (posterFor !== null && !VIDEO_KEY_RE.test(posterFor)) {
    await request.body.cancel();
    return json({ error: "bad x-poster-for (an admin/ video key)" }, 400);
  }

  const reader = request.body.getReader();
  const { head, chunks, done } = await readHead(reader, SNIFF_BYTES);
  const kind: Sniffed | null = sniff(head);
  if (!kind) {
    await reader.cancel();
    return json({ error: "unsupported file type (jpeg, png, webp, avif, mp4, webm)" }, 415);
  }
  if (posterFor !== null && kind.kind !== "image") {
    await reader.cancel();
    return json({ error: "a poster must be an image" }, 415);
  }

  // A poster's key is fixed and a new poster replaces the old one; every
  // other upload must land on a key that was free.
  const opts: R2PutOptions = { httpMetadata: { contentType: kind.type, cacheControl: CACHE } };
  if (posterFor === null) opts.onlyIf = IF_ABSENT();
  const cap = kind.kind === "image" ? IMAGE_MAX : VIDEO_MAX;
  const capMsg = kind.kind === "image" ? "image over 25 MB" : "video over 300 MB";

  let key: string;
  let id: string;
  if (posterFor !== null) {
    // The poster's extension follows its bytes (webp, or jpg on a browser
    // that cannot encode webp).
    key = posterFor.replace(/\.(mp4|webm)$/, `.poster.${kind.ext}`);
    id = key.split("/").pop()!.replace(/\.[a-z0-9]+$/, "");
  } else {
    const nb = await freeKeyBase(env, name, kind.ext);
    if (!nb) {
      await reader.cancel();
      return KEY_TAKEN();
    }
    id = nb.id;
    key = `${nb.base}.${kind.ext}`;
  }

  let size: number;
  if (hasLen) {
    size = declared;
    if (size > cap) {
      await reader.cancel();
      return tooBig(capMsg);
    }
    // Stream through a fixed-length pipe: the sniffed head first, then the rest.
    const fls = new FixedLengthStream(size);
    const w = fls.writable.getWriter();
    const pump = (async () => {
      try {
        for (const c of chunks) await w.write(c);
        if (!done) {
          for (;;) {
            const r = await reader.read();
            if (r.done) break;
            await w.write(r.value);
          }
        }
        await w.close();
      } catch (err) {
        await w.abort(err).catch(() => {});
        throw err;
      }
    })();
    // A refused put (key taken meanwhile) may leave the pump stuck on a
    // full pipe: stop both ends so it ends.
    let taken = false;
    const put = env.MEDIA_BUCKET.put(key, fls.readable, opts).then((obj) => {
      if (!obj) {
        taken = true;
        reader.cancel().catch(() => {});
        w.abort().catch(() => {});
      }
      return obj;
    });
    try {
      await Promise.all([put, pump]);
    } catch {
      if (taken) return KEY_TAKEN();
      return json({ error: "upload failed (size mismatch or storage error)" }, 400);
    }
    if (taken) return KEY_TAKEN();
  } else {
    // No length announced: buffer, counting, never past the single-PUT cap.
    let total = head.length;
    const parts: Uint8Array[] = chunks.slice();
    if (!done) {
      for (;;) {
        const r = await reader.read();
        if (r.done) break;
        total += r.value.length;
        if (total > SINGLE_MAX) {
          await reader.cancel();
          return tooBig("file over 90 MB: use multipart");
        }
        parts.push(r.value);
      }
    }
    size = total;
    if (size > cap) return tooBig(capMsg);
    const buf = new Uint8Array(size);
    let o = 0;
    for (const c of parts) {
      buf.set(c, o);
      o += c.length;
    }
    if (!(await env.MEDIA_BUCKET.put(key, buf, opts))) return KEY_TAKEN();
  }

  await audit(env, ctx.adminEmail, "upload.put", key, { size, type: kind.type });
  return json({ id, key, url: `${MEDIA_ORIGIN}/${key}`, type: kind.type, size }, 201);
}

/** GET /api/admin/media/<key>. Only admin/ keys; anything odd is a 404. */
export async function mediaGet(env: Env, url: URL): Promise<Response> {
  let key: string;
  try {
    key = decodeURIComponent(url.pathname.slice("/api/admin/media/".length));
  } catch {
    return json({ error: "not found" }, 404);
  }
  if (!ADMIN_KEY_RE.test(key)) return json({ error: "not found" }, 404);
  const obj = await env.MEDIA_BUCKET.get(key);
  if (!obj) return json({ error: "not found" }, 404);
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
