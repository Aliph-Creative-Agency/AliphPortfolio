// Q-08 (QA): upload + R2 key safety (worker/src/gallery/{upload,multipart,sniff}.ts).
// What is attacked, and what must hold:
//  - CONTENT: the bytes alone decide kind, extension and stored content-type.
//    HTML, SVG (with or without <?xml / BOM / leading blanks), MZ/ELF/PDF/GIF/
//    ZIP, QuickTime and short bodies are 415 with nothing stored and no audit
//    row, whatever the file name or Content-Type header claims. Polyglots that
//    START with a media signature (JPEG/PNG/WEBP/AVIF/WEBM/MP4 head + HTML/SVG
//    tail) are accepted, but stored and served as that media type with
//    nosniff, so the HTML tail never renders.
//  - KEYS: x-file-name (../, %2e%2e, %252e, backslash, %00, CR/LF, 300 chars,
//    malformed %, absolute paths) only ever contributes a [a-z0-9-]{1,40}
//    slug; every stored key matches ADMIN_KEY_RE and nothing appears outside
//    admin/. x-poster-for that is not an admin/ video key is a 400.
//  - COLLISIONS: same-named uploads get distinct keys; a forced RNG collision
//    is F-05 (silent overwrite, no onlyIf guard).
//  - SIZE: a declared Content-Length that disagrees with the body is a 400
//    with nothing stored; a streamed body over the image cap is a 413;
//    multipart reports the size R2 counted, never the claimed one, and an
//    assembled object over 300 MB is deleted.
//  - MULTIPART: part numbers outside 1..60, re-sent part 1 that is not video,
//    complete lists with gaps/dupes/bad types, and a key that does not belong
//    to the uploadId never store anything nor touch another object.
//  - SERVING: GET /api/admin/media/<key> sends the stored media type with
//    nosniff for everything the Worker can store; odd paths are 404, never
//    500, never a non-admin/ object. It trusts the stored content-type
//    blindly (F-06: an out-of-band text/html object would render inline on
//    the admin origin).
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { call, del, installAccess, post, uninstallAccess } from "../gallery/helpers";
import { ADMIN_KEY_RE, VIDEO_MAX } from "../../worker/src/gallery/upload";

beforeEach(installAccess);
afterEach(() => {
  vi.restoreAllMocks();
  uninstallAccess();
});

// ── bytes ────────────────────────────────────────────────────────────
const te = new TextEncoder();
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const cat = (...p: (readonly number[] | string | Uint8Array)[]) => {
  const parts = p.map((x) => (typeof x === "string" ? te.encode(x) : x instanceof Uint8Array ? x : Uint8Array.from(x)));
  const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of parts) {
    out.set(x, o);
    o += x.length;
  }
  return out;
};
const HTML = "<html><body><script>fetch('/api/admin/whoami').then(r=>r.text()).then(alert)</script></body></html>";
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(document.domain)</script></svg>';
const HEAD = {
  jpg: [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, ...ascii("JFIF"), 0, 1],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d],
  webp: [...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")],
  avif: [0, 0, 0, 0x1c, ...ascii("ftyp"), ...ascii("avif")],
  mp4: [0, 0, 0, 0x18, ...ascii("ftyp"), ...ascii("isom")],
  webm: [0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 1, 0x42, 0xf7, 0x81],
} as const;
const TYPE = {
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", mp4: "video/mp4", webm: "video/webm",
} as const;
const MEDIA_TYPES = new Set(Object.values(TYPE));
const JPEG = cat(HEAD.jpg, new Uint8Array(52));

// ── store snapshots ──────────────────────────────────────────────────
async function keys(): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  for (;;) {
    const l = await env.MEDIA_BUCKET.list({ cursor });
    out.push(...l.objects.map((o) => o.key));
    if (!l.truncated) break;
    cursor = l.cursor;
  }
  return out.sort();
}
const uploadAudits = async () =>
  (await env.DB.prepare("SELECT COUNT(*) AS n FROM audit WHERE action LIKE 'upload.%'").first<{ n: number }>())!.n;
const bytesOf = async (key: string) => new Uint8Array(await (await env.MEDIA_BUCKET.get(key))!.arrayBuffer());

type Up = { id: string; key: string; url: string; type: string; size: number };
const up = (body: BodyInit, headers: Record<string, string> = {}) =>
  call("/api/admin/upload", { method: "POST", body, headers: { "x-file-name": "photo.jpg", ...headers } });

/** Asserts the response is a refusal with `status` and the bucket + audit are unchanged. */
async function refused(run: () => Promise<Response>, status: number) {
  const before = await keys();
  const audits = await uploadAudits();
  const r = await run();
  expect(r.status).toBe(status);
  await r.body?.cancel();
  expect(await keys()).toEqual(before);
  expect(await uploadAudits()).toBe(audits);
}

// ── content sniffing ─────────────────────────────────────────────────
describe("single upload: content decides, names and headers never do", () => {
  const NOT_MEDIA: [string, Uint8Array][] = [
    ["HTML", cat(HTML)],
    ["SVG with script", cat(SVG)],
    ["SVG with <?xml prolog", cat('<?xml version="1.0"?>', SVG)],
    ["SVG after a UTF-8 BOM", cat([0xef, 0xbb, 0xbf], SVG)],
    ["HTML after blank lines", cat("\n\n\n\n\n\n\n\n\n\n\n\n", HTML)],
    ["renamed .exe (MZ)", cat([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0], new Uint8Array(64))],
    ["ELF", cat([0x7f, ...ascii("ELF"), 2, 1, 1, 0, 0, 0, 0, 0], new Uint8Array(64))],
    ["PDF", cat("%PDF-1.7\n%âãÏÓ\n1 0 obj <</JS (app.alert(1))>>")],
    ["GIF (not allowed)", cat("GIF89a", new Uint8Array(64))],
    ["ZIP", cat([0x50, 0x4b, 3, 4, 20, 0, 0, 0, 8, 0, 0, 0], new Uint8Array(64))],
    ["QuickTime ftypqt", cat([0, 0, 0, 0x14, ...ascii("ftyp"), ...ascii("qt  ")], new Uint8Array(64))],
    ["HEIC ftypheic", cat([0, 0, 0, 0x18, ...ascii("ftyp"), ...ascii("heic")], new Uint8Array(64))],
    ["ftyp with an HTML brand", cat([0, 0, 0, 0x18, ...ascii("ftyp"), ...ascii("<scr")], HTML)],
    ["JPEG magic shifted by one byte", cat([0], HEAD.jpg, new Uint8Array(64))],
    ["11 bytes of JPEG (shorter than the sniff window)", cat(HEAD.jpg.slice(0, 11))],
  ];
  // every refused body is tried with every lie a client can tell
  const LIES: Record<string, string>[] = [
    { "x-file-name": "photo.jpg", "content-type": "image/jpeg" },
    { "x-file-name": "clip.mp4", "content-type": "video/mp4" },
    { "x-file-name": "page.html", "content-type": "text/html" },
    { "x-file-name": "icon.svg", "content-type": "image/svg+xml" },
  ];
  for (const [label, body] of NOT_MEDIA) {
    it(`${label} → 415 under every name / Content-Type, nothing stored, no audit`, async () => {
      for (const h of LIES) await refused(() => up(body, h), 415);
    });
  }

  it("an empty body → 415 (nothing to sniff); no body at all → 400; nothing stored", async () => {
    await refused(() => up(new Uint8Array(0)), 415);
    await refused(() => call("/api/admin/upload", { method: "POST" }), 400);
  });

  const POLYGLOTS = (Object.keys(HEAD) as (keyof typeof HEAD)[]).flatMap((ext) => [
    [ext, "HTML", cat(HEAD[ext], HTML)] as const,
    [ext, "SVG", cat(HEAD[ext], SVG)] as const,
  ]);
  for (const [ext, tail, body] of POLYGLOTS) {
    it(`${ext} head + ${tail} tail named .${tail.toLowerCase()} with a ${tail} Content-Type → stored and served as ${TYPE[ext]} with nosniff`, async () => {
      const ctype = tail === "HTML" ? "text/html" : "image/svg+xml";
      const r = await up(body, { "x-file-name": `evil.${tail.toLowerCase()}`, "content-type": ctype });
      expect(r.status).toBe(201);
      const j = (await r.json()) as Up;
      expect(j.type).toBe(TYPE[ext]);
      expect(j.key).toMatch(new RegExp(`^admin/\\d{4}/\\d{2}/[a-z0-9]{6}-evil\\.${ext}$`));
      expect(j.key).toMatch(ADMIN_KEY_RE);
      const head = await env.MEDIA_BUCKET.head(j.key);
      expect(head!.httpMetadata?.contentType).toBe(TYPE[ext]);
      const g = await call(`/api/admin/media/${j.key}`);
      expect(g.status).toBe(200);
      expect(g.headers.get("content-type")).toBe(TYPE[ext]);
      expect(g.headers.get("x-content-type-options")).toBe("nosniff");
      expect(new Uint8Array(await g.arrayBuffer())).toEqual(body);
    });
  }
});

// ── x-file-name / x-poster-for ───────────────────────────────────────
describe("keys: x-file-name never steers the key", () => {
  const NAMES: string[] = [
    "../../../etc/passwd",
    "../other/x.jpg",
    "..%2f..%2fother%2fx.jpg",
    "%2e%2e/%2e%2e/other/x.jpg",
    "%2e%2e%2f%2e%2e%2fother%2fx.jpg",
    "%252e%252e%252fother%252fx.jpg",
    "..\\..\\other\\x.jpg",
    "C:\\Windows\\System32\\x.jpg",
    "\\\\server\\share\\x.jpg",
    "/admin/2026/01/victim.jpg",
    "admin/2026/01/abcdef-victim",
    "x.jpg/../../y",
    "x%00.jpg",
    "x%00../../y.jpg",
    "x%0d%0aSet-Cookie: a=b.jpg",
    "%",
    "%E0%A4%A",
    ".jpg",
    "....",
    "/",
    "a".repeat(300),
    "%2e".repeat(100),
    "-".repeat(300) + ".jpg",
    "%D8%B5%D9%88%D8%B1%D8%A9.jpg",
    "CON",
    "photo\u00e9\u00ff.jpg",
    "",
  ];
  it("every hostile name → one new object under admin/ with a [a-z0-9]{6}-<slug ≤ 40> key, nothing else written", async () => {
    for (const name of NAMES) {
      const before = await keys();
      const r = await up(JPEG, { "x-file-name": name });
      expect(r.status, name).toBe(201);
      const j = (await r.json()) as Up;
      expect(j.key, name).toMatch(ADMIN_KEY_RE);
      expect(j.key, name).toMatch(/^admin\/\d{4}\/\d{2}\/[a-z0-9]{6}-[a-z0-9-]{1,40}\.jpg$/);
      expect(j.key.split("/").pop()!.length, name).toBeLessThanOrEqual(6 + 1 + 40 + 4);
      expect(j.id, name).toMatch(/^[a-z0-9]{6}-[a-z0-9-]{1,40}$/);
      expect(j.url, name).toBe(`https://media.aliphcreative.com/${j.key}`);
      const after = await keys();
      expect(after.filter((k) => !before.includes(k)), name).toEqual([j.key]);
      expect(before.filter((k) => !after.includes(k)), name).toEqual([]);
    }
  });
  it("no x-file-name header at all → slug 'file'", async () => {
    const r = await call("/api/admin/upload", { method: "POST", body: JPEG });
    expect(r.status).toBe(201);
    expect(((await r.json()) as Up).key).toMatch(/^admin\/\d{4}\/\d{2}\/[a-z0-9]{6}-file\.jpg$/);
  });
  it("a raw NUL, CR or LF cannot be put in the header (the fetch layer refuses before the Worker)", () => {
    for (const bad of ["a\u0000b.jpg", "a\rb.jpg", "a\nb.jpg"]) expect(() => new Headers({ "x-file-name": bad })).toThrow();
  });

  const POSTER_FOR = [
    "../x.mp4",
    "admin/2026/01/../../other/x.mp4",
    "admin/2026/01/x.mp4/../../y.mp4",
    "admin/2026/01/%2e%2e.mp4",
    "admin/2026/01/..mp4",
    "admin/2026/1/x.mp4",
    "admin\\2026\\01\\x.mp4",
    "other/2026/01/x.mp4",
    "/admin/2026/01/x.mp4",
    "admin/2026/01/X.mp4",
    "admin/2026/01/x.jpg",
    "admin/2026/01/x.poster.mp4",
    "admin/2026/01/x.mp4.html",
    "admin/2026/01/" + "a".repeat(61) + ".mp4",
    "",
  ];
  it("x-poster-for that is not an admin/ video key → 400, nothing stored", async () => {
    for (const p of POSTER_FOR) await refused(() => up(JPEG, { "x-poster-for": p }), 400).catch((e) => {
      throw new Error(`x-poster-for ${JSON.stringify(p)}: ${e}`);
    });
  });
  it("a poster always lands at <video stem>.poster.<image ext>, never on the video itself", async () => {
    const v = (await (await up(cat(HEAD.mp4, new Uint8Array(64)), { "x-file-name": "clip.mp4" })).json()) as Up;
    const videoBytes = await bytesOf(v.key);
    const r = await up(cat(HEAD.png, HTML), { "x-poster-for": v.key, "x-file-name": "../../x.html" });
    expect(r.status).toBe(201);
    const p = (await r.json()) as Up;
    expect(p.key).toBe(v.key.replace(/\.mp4$/, ".poster.png"));
    expect(p.type).toBe("image/png");
    expect(await bytesOf(v.key)).toEqual(videoBytes);
    // a video body as poster is refused
    await refused(() => up(cat(HEAD.webm, new Uint8Array(64)), { "x-poster-for": v.key }), 415);
  });
});

// ── collisions ───────────────────────────────────────────────────────
describe("key collisions", () => {
  it("20 uploads with the same name → 20 distinct keys, each body intact", async () => {
    const got: [string, Uint8Array][] = [];
    for (let i = 0; i < 20; i++) {
      const body = cat(HEAD.jpg, [i], new Uint8Array(40));
      const j = (await (await up(body, { "x-file-name": "Same Name.jpg" })).json()) as Up;
      got.push([j.key, body]);
    }
    expect(new Set(got.map(([k]) => k)).size).toBe(20);
    for (const [k, b] of got) expect(await bytesOf(k)).toEqual(b);
  });

  // randomId() is 6 base36 chars (~31 bits); a collision needs two uploads
  // with the same slug in the same month drawing the same id. Forced here.
  const sameRandom = () =>
    vi.spyOn(crypto, "getRandomValues").mockImplementation(<T extends ArrayBufferView | null>(a: T): T => {
      if (a) new Uint8Array(a.buffer, a.byteOffset, a.byteLength).fill(7);
      return a;
    });
  it.fails("F-05 a random-id collision on single upload silently replaces the earlier object (no onlyIf guard)", async () => {
    sameRandom();
    const first = cat(HEAD.jpg, "FIRST", new Uint8Array(40));
    const a = (await (await up(first, { "x-file-name": "cover.jpg" })).json()) as Up;
    const r = await up(cat(HEAD.jpg, "SECOND", new Uint8Array(40)), { "x-file-name": "cover.jpg" });
    // acceptable: a different key, or a refusal; never the same key over the first bytes
    if (r.status === 201) expect(((await r.json()) as Up).key).not.toBe(a.key);
    expect(await bytesOf(a.key)).toEqual(first);
  });
  it.fails("F-05 a random-id collision on multipart create hands out a key that already holds a video", async () => {
    sameRandom();
    const v = (await (await up(cat(HEAD.mp4, "FIRST", new Uint8Array(40)), { "x-file-name": "reel.mp4" })).json()) as Up;
    const c = (await (await post("/api/admin/upload/mpu", { name: "reel.mp4", type: "video/mp4", size: 100 })).json()) as {
      key: string;
    };
    expect(c.key).not.toBe(v.key);
  });
});

// ── size ─────────────────────────────────────────────────────────────
const stream = (chunks: Uint8Array[]) =>
  new ReadableStream<Uint8Array>({
    pull(ctl) {
      const c = chunks.shift();
      if (c) ctl.enqueue(c);
      else ctl.close();
    },
  });
describe("size: declared vs actual", () => {
  it("Content-Length smaller than the body → 400, nothing stored", async () => {
    await refused(() => up(stream([cat(HEAD.jpg, new Uint8Array(500))]), { "content-length": "100" }), 400);
  });
  it("Content-Length larger than the body → 400, nothing stored", async () => {
    await refused(() => up(stream([cat(HEAD.jpg, new Uint8Array(50))]), { "content-length": "5000" }), 400);
  });
  it("Content-Length 0 with a body → refused, nothing stored", async () => {
    const before = await keys();
    const r = await up(stream([cat(HEAD.jpg, new Uint8Array(50))]), { "content-length": "0" });
    expect([400, 415]).toContain(r.status);
    expect(await keys()).toEqual(before);
  });
  it("a non-numeric or exponent Content-Length is never a 5xx and stores nothing it should not", async () => {
    for (const len of ["abc", "1e3", "0x10"]) {
      const before = await keys();
      const r = await up(stream([cat(HEAD.jpg, new Uint8Array(50))]), { "content-length": len });
      expect(r.status, len).toBeLessThan(500);
      if (r.status !== 201) expect(await keys(), len).toEqual(before);
      await r.body?.cancel();
    }
  });
  // Precondition for F-07: the request itself is constructible, so a throw
  // below comes from the Worker (new FixedLengthStream(-5) at
  // upload.ts:133, sits outside the try).
  const negative = () =>
    new Request("https://aliphcreative.com/api/admin/upload", {
      method: "POST",
      body: stream([cat(HEAD.jpg, new Uint8Array(50))]),
      headers: { "content-length": "-5" },
    });
  it("a request with Content-Length -5 can be built (F-07 precondition)", () => {
    expect(negative).not.toThrow();
  });
  it.fails("F-07 Content-Length -5 on a sniffable body makes the Worker throw (500) instead of a 400", async () => {
    const before = await keys();
    let status = 0;
    try {
      status = (await up(stream([cat(HEAD.jpg, new Uint8Array(50))]), { "content-length": "-5" })).status;
    } catch (e) {
      throw new Error(`content-length -5: the Worker threw ${e}`);
    }
    expect(status).toBe(400);
    expect(await keys()).toEqual(before);
  });
  it("Content-Length over 90 MB → 413 before reading, whatever the body", async () => {
    await refused(() => up(stream([JPEG]), { "content-length": String(2 ** 53) }), 413);
  });
  it("a streamed (no Content-Length) image one byte over 25 MB → 413, nothing stored", async () => {
    const MiB = 1024 * 1024;
    const chunk = new Uint8Array(MiB);
    const chunks = [cat(HEAD.jpg, new Uint8Array(MiB - HEAD.jpg.length))];
    for (let i = 1; i < 25; i++) chunks.push(chunk);
    chunks.push(new Uint8Array(1));
    await refused(() => up(stream(chunks)), 413);
  });
  it("the reported size is the stored size", async () => {
    const body = cat(HEAD.webp, new Uint8Array(1000));
    const j = (await (await up(body, { "x-file-name": "x.webp" })).json()) as Up;
    expect(j.size).toBe(body.length);
    expect((await env.MEDIA_BUCKET.head(j.key))!.size).toBe(body.length);
  });
});

// ── multipart ────────────────────────────────────────────────────────
type Mpu = { uploadId: string; key: string; id: string };
const create = async (over: Record<string, unknown> = {}) =>
  (await (await post("/api/admin/upload/mpu", { name: "Reel.mp4", type: "video/mp4", size: 1000, ...over })).json()) as Mpu;
const partUrl = (key: string, uploadId: string, n: string | number) =>
  `/api/admin/upload/mpu/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&n=${encodeURIComponent(String(n))}`;
const part = (c: { key: string; uploadId: string }, n: string | number, body: Uint8Array) =>
  call(partUrl(c.key, c.uploadId, n), { method: "PUT", body });
const complete = (c: { key: string; uploadId: string }, parts: unknown) =>
  post("/api/admin/upload/mpu/complete", { key: c.key, uploadId: c.uploadId, parts });
const MP4_BODY = cat(HEAD.mp4, "x".repeat(500));

describe("multipart abuse", () => {
  it("part numbers outside 1..60 → 400/413, nothing uploaded", async () => {
    const c = await create();
    for (const n of ["0", "-1", "1.5", "abc", "", "NaN", "Infinity", "-Infinity", "1e9", "61", "9007199254740993"]) {
      const r = await part(c, n, MP4_BODY);
      expect([400, 413], `n=${n}`).toContain(r.status);
      await r.body?.cancel();
    }
    // the upload is still clean: nothing was accepted, so completing with part 1 has no etag to use
    expect((await complete(c, [{ partNumber: 1, etag: "x" }])).status).toBe(400);
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
  });

  it("a re-sent part 1 that is HTML is sniffed again → 415, upload aborted, nothing stored", async () => {
    const c = await create();
    const ok = (await (await part(c, 1, MP4_BODY)).json()) as { partNumber: number; etag: string };
    expect(ok.partNumber).toBe(1);
    expect((await part(c, 1, cat(HTML))).status).toBe(415);
    expect((await complete(c, [ok])).status).toBe(400);
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
  });

  it("part 1 shorter than the sniff window → 415", async () => {
    const c = await create();
    expect((await part(c, 1, cat(HEAD.mp4.slice(0, 11)))).status).toBe(415);
  });

  it("an HTML/SVG tail after a real part 1 is stored as the DECLARED video type and served with nosniff", async () => {
    const c = await create({ type: "video/webm", name: "x.html" });
    expect(c.key).toMatch(/\.webm$/);
    const p1 = (await (await part(c, 1, cat(HEAD.webm, HTML, SVG))).json()) as { partNumber: number; etag: string };
    const r = await complete(c, [p1]);
    expect(r.status).toBe(201);
    const g = await call(`/api/admin/media/${c.key}`);
    expect(g.headers.get("content-type")).toBe("video/webm");
    expect(g.headers.get("x-content-type-options")).toBe("nosniff");
    await g.body?.cancel();
  });

  it("complete with gaps, duplicates, missing part 1 or bad types → 400, nothing stored", async () => {
    const c = await create();
    const p1 = (await (await part(c, 1, MP4_BODY)).json()) as { partNumber: number; etag: string };
    const BAD: unknown[] = [
      [],
      [p1, p1],
      [{ ...p1, partNumber: 2 }],
      [p1, { partNumber: 3, etag: p1.etag }],
      [{ partNumber: "1", etag: p1.etag }],
      [{ partNumber: 1.5, etag: p1.etag }],
      [{ partNumber: -1, etag: p1.etag }, p1],
      [{ partNumber: 1, etag: 1 }],
      [null],
      Array.from({ length: 61 }, (_, i) => ({ partNumber: i + 1, etag: p1.etag })),
      "1",
      { 0: p1, length: 1 },
    ];
    for (const parts of BAD) {
      const r = await complete(c, parts);
      expect(r.status, JSON.stringify(parts).slice(0, 80)).toBe(400);
      await r.body?.cancel();
    }
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
  });

  it("a wrong etag at complete → 400 and the upload is aborted (no object)", async () => {
    const c = await create();
    await (await part(c, 1, MP4_BODY)).arrayBuffer();
    expect((await complete(c, [{ partNumber: 1, etag: "0".repeat(32) }])).status).toBe(400);
    expect(await env.MEDIA_BUCKET.head(c.key)).toBeNull();
  });

  it("claimed size is ignored: the response carries the size R2 counted", async () => {
    const c = await create({ size: 1 });
    const p1 = (await (await part(c, 1, MP4_BODY)).json()) as { partNumber: number; etag: string };
    const j = (await (await complete(c, [p1])).json()) as Up;
    expect(j.size).toBe(MP4_BODY.length);
    expect(j.type).toBe("video/mp4");
  });

  it("an assembled object over 300 MB is deleted again (413)", async () => {
    const c = await create();
    const deleted: string[] = [];
    const bucket = {
      resumeMultipartUpload: () => ({
        complete: async () => ({ size: VIDEO_MAX + 1, httpMetadata: { contentType: "video/mp4" } }),
        abort: async () => {},
      }),
      delete: async (k: string) => void deleted.push(k),
    } as unknown as R2Bucket;
    const r = await call("/api/admin/upload/mpu/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: c.key, uploadId: c.uploadId, parts: [{ partNumber: 1, etag: "e" }] }),
      env: { MEDIA_BUCKET: bucket },
    });
    expect(r.status).toBe(413);
    expect(deleted).toEqual([c.key]);
  });

  it("an uploadId used with ANOTHER video key never writes or replaces that key", async () => {
    // victim: an existing published-looking video
    const victim = (await (await up(cat(HEAD.mp4, "VICTIM", new Uint8Array(40)), { "x-file-name": "victim.mp4" })).json()) as Up;
    const victimBytes = await bytesOf(victim.key);
    const fresh = "admin/2026/01/zzzzzz-not-created.mp4";
    const c = await create();
    const own = (await (await part(c, 1, MP4_BODY)).json()) as { partNumber: number; etag: string };
    for (const target of [victim.key, fresh]) {
      const forged = { key: target, uploadId: c.uploadId };
      const pr = await part(forged, 1, cat(HEAD.mp4, "ATTACK", new Uint8Array(40)));
      await pr.body?.cancel();
      const cr = await complete(forged, [own]);
      expect(cr.status, target).not.toBe(201);
      await cr.body?.cancel();
    }
    expect(await bytesOf(victim.key)).toEqual(victimBytes);
    expect(await env.MEDIA_BUCKET.head(fresh)).toBeNull();
  });

  it("abort with someone else's key + uploadId pair is harmless (the victim object stays)", async () => {
    const victim = (await (await up(cat(HEAD.mp4, new Uint8Array(40)), { "x-file-name": "victim.mp4" })).json()) as Up;
    const c = await create();
    const r = await del(`/api/admin/upload/mpu?key=${encodeURIComponent(victim.key)}&uploadId=${encodeURIComponent(c.uploadId)}`);
    expect(r.status).toBe(200);
    expect(await env.MEDIA_BUCKET.head(victim.key)).not.toBeNull();
  });
});

// ── serving ──────────────────────────────────────────────────────────
describe("GET /api/admin/media/<key>", () => {
  it("everything the Worker can store is served as an allow-listed media type with nosniff and no html/svg", async () => {
    for (const ext of Object.keys(HEAD) as (keyof typeof HEAD)[]) {
      const j = (await (await up(cat(HEAD[ext], HTML), { "x-file-name": `a.${ext}` })).json()) as Up;
      const g = await call(`/api/admin/media/${j.key}`);
      const ct = g.headers.get("content-type")!;
      expect(MEDIA_TYPES.has(ct as never), ct).toBe(true);
      expect(ct).not.toMatch(/html|svg|xml|javascript/);
      expect(g.headers.get("x-content-type-options")).toBe("nosniff");
      expect(g.headers.get("content-disposition")).toBeNull();
      expect(g.headers.get("cache-control")).toBe("private, max-age=300");
      await g.body?.cancel();
    }
  });

  it("odd paths → 404 (never 500), never a non-admin/ object", async () => {
    await env.MEDIA_BUCKET.put("other/secret.jpg", JPEG, { httpMetadata: { contentType: "image/jpeg" } });
    const j = (await (await up(JPEG)).json()) as Up;
    const [, yyyy, mm, file] = j.key.split("/");
    const PATHS = [
      "other/secret.jpg",
      "admin/..%2fother/secret.jpg",
      `admin/${yyyy}/${mm}/..%2f..%2f..%2fother%2fsecret.jpg`,
      `admin/${yyyy}/${mm}/%2e%2e%2f%2e%2e%2f%2e%2e%2fother%2fsecret.jpg`,
      `admin/${yyyy}/${mm}/${file}%00`,
      `admin/${yyyy}/${mm}/${file}%0a`,
      `admin/${yyyy}/${mm}/${file}%2500`,
      `ADMIN/${yyyy}/${mm}/${file}`,
      `admin/${yyyy}/${mm}/%252e%252e`,
      `admin/${yyyy}/${mm}/%E0%A4%A`,
      `admin/${yyyy}/${mm}/${file}/`,
      `admin/${yyyy}/${mm}/${file}%2f..%2f${file}`,
      `admin/${yyyy}/${mm}/${file.replace(/\.jpg$/, ".html")}`,
      "",
    ];
    for (const p of PATHS) {
      const r = await call(`/api/admin/media/${p}`);
      expect(r.status, p).toBe(404);
      expect(r.headers.get("content-type"), p).toMatch(/^application\/json/);
      await r.body?.cancel();
    }
    // the encoded-slash spelling of a REAL key is the same object (decodeURIComponent), fine
    const enc = await call(`/api/admin/media/${j.key.replace(/\//g, "%2F")}`);
    expect(enc.status).toBe(200);
    expect(enc.headers.get("content-type")).toBe("image/jpeg");
    await enc.body?.cancel();
  });

  it("an object with no stored content-type is octet-stream (download), never sniffed", async () => {
    const k = "admin/2026/01/abcdef-plain.jpg";
    await env.MEDIA_BUCKET.put(k, cat(HTML));
    const g = await call(`/api/admin/media/${k}`);
    expect(g.headers.get("content-type")).toBe("application/octet-stream");
    expect(g.headers.get("x-content-type-options")).toBe("nosniff");
    await g.body?.cancel();
  });

  // Only reachable through an out-of-band bucket write (wrangler r2 object
  // put, the dashboard, an R2 token): the Worker itself never stores these.
  for (const [ct, body] of [["text/html", HTML], ["image/svg+xml", SVG]] as const) {
    it.fails(`F-06 a stored ${ct} object under an admin/ key is served inline as ${ct} on the admin origin`, async () => {
      const k = `admin/2026/01/abcdef-planted.${ct === "text/html" ? "jpg" : "png"}`;
      await env.MEDIA_BUCKET.put(k, cat(body), { httpMetadata: { contentType: ct } });
      const g = await call(`/api/admin/media/${k}`);
      const served = g.headers.get("content-type") ?? "";
      const disp = g.headers.get("content-disposition") ?? "";
      const csp = g.headers.get("content-security-policy") ?? "";
      await g.body?.cancel();
      // safe = an allow-listed media type, OR forced download, OR a sandbox CSP
      expect(MEDIA_TYPES.has(served as never) || /attachment/i.test(disp) || /sandbox/i.test(csp)).toBe(true);
    });
  }
});

