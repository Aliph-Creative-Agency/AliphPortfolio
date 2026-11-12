// P-05: the content store read path (store.ts + api/content.ts) and the
// server-side validators (validate.ts) the write handlers must use.
import { createExecutionContext, env } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../../worker/src/index";
import { resetJwksCache } from "../../worker/src/auth";
import { galleryItemFromRow, isEmpty, type Snapshot } from "../../worker/src/store";
import {
  badRequest,
  validateClient,
  validateGalleryItem,
  validateRing,
  validateSlot,
  validateText,
} from "../../worker/src/validate";
import registry from "../../worker/src/generated/registry.json";

/* ── Access stand-in (same scheme as auth.test.ts) ── */
const TEAM = "aliph-test.cloudflareaccess.com";
const AUD = "aud-content";
const ISS = `https://${TEAM}`;
const RSA = { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" };
let key: CryptoKeyPair;
let fetchSpy: ReturnType<typeof vi.spyOn>;
const b64url = (b: Uint8Array | ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
async function token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const input = `${enc({ alg: "RS256", kid: "K", typ: "JWT" })}.${enc({ iss: ISS, aud: [AUD], email: "ceo@aliphcreative.com", iat: now, nbf: now, exp: now + 600 })}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key.privateKey, new TextEncoder().encode(input));
  return `${input}.${b64url(sig)}`;
}

const E = (): Env => ({ ...env, ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD });
const call = (path: string, init: RequestInit = {}) => worker.fetch(new Request("https://aliphcreative.com" + path, init), E(), createExecutionContext());
const db = () => env.DB;
const run = (sql: string, ...args: unknown[]) => db().prepare(sql).bind(...args).run();

beforeAll(async () => {
  key = (await crypto.subtle.generateKey(RSA, true, ["sign", "verify"])) as CryptoKeyPair;
});

beforeEach(async () => {
  resetJwksCache();
  const jwk = { ...((await crypto.subtle.exportKey("jwk", key.publicKey)) as JsonWebKey), kid: "K", alg: "RS256" };
  const real = globalThis.fetch;
  fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === `${ISS}/cdn-cgi/access/certs`) return Response.json({ keys: [jwk] });
    return real(input, init);
  });
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  await run("UPDATE meta SET v = '0' WHERE k = 'publish_rev'");
});

afterEach(() => fetchSpy.mockRestore());

const EMPTY = { rev: 0, text: {}, slots: {}, gallery: [], rings: {}, clients: [] };

describe("GET /api/content (published)", () => {
  it("empty store → {rev:0,…empty}, ETag \"0\", short public cache", async () => {
    const r = await call("/api/content");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/^application\/json/);
    expect(r.headers.get("etag")).toBe('"0"');
    expect(r.headers.get("cache-control")).toBe("public, max-age=60");
    const body = (await r.json()) as Snapshot;
    expect(body).toEqual(EMPTY);
    expect(isEmpty(body)).toBe(true);
    expect(await (await call("/api/content?state=published")).json()).toEqual(EMPTY);
  });

  it("If-None-Match with the publish rev → 304 (also weak / listed / *); a stale tag → 200", async () => {
    await run("UPDATE meta SET v = '7' WHERE k = 'publish_rev'");
    for (const inm of ['"7"', 'W/"7"', '"3", "7"', "*"]) {
      const r = await call("/api/content", { headers: { "If-None-Match": inm } });
      expect(r.status, inm).toBe(304);
      expect(r.headers.get("etag")).toBe('"7"');
      expect(await r.text()).toBe("");
    }
    const r = await call("/api/content", { headers: { "If-None-Match": '"6"' } });
    expect(r.status).toBe(200);
    expect(r.headers.get("etag")).toBe('"7"');
    expect(((await r.json()) as Snapshot).rev).toBe(7);
  });

  it("unknown state → 400; a write method → 405", async () => {
    for (const q of ["?state=live", "?state=", "?state=DRAFT"]) {
      const r = await call("/api/content" + q);
      expect(r.status, q).toBe(400);
      expect(r.headers.get("cache-control")).toBe("no-store");
    }
    expect((await call("/api/content", { method: "POST", body: "{}" })).status).toBe(405);
  });
});

describe("draft reads need Access", () => {
  it("no token → 403 on /api/content?state=draft AND /api/admin/content", async () => {
    for (const p of ["/api/content?state=draft", "/api/admin/content"]) {
      const r = await call(p);
      expect(r.status, p).toBe(403);
      expect(await r.text()).not.toContain("{");
    }
    const r = await call("/api/content?state=draft", { headers: { "Cf-Access-Jwt-Assertion": "x.y.z" } });
    expect(r.status).toBe(403);
  });

  it("missing Access env → 403 even with a well-formed token (fail closed)", async () => {
    const t = await token();
    const r = await worker.fetch(
      new Request("https://aliphcreative.com/api/content?state=draft", { headers: { "Cf-Access-Jwt-Assertion": t } }),
      { ...env, ACCESS_TEAM_DOMAIN: "", ACCESS_AUD: "" },
      createExecutionContext(),
    );
    expect(r.status).toBe(403);
  });

  it("good token → 200, private no-store, same shape plus locks, on both routes", async () => {
    const h = { headers: { "Cf-Access-Jwt-Assertion": await token() } };
    for (const p of ["/api/content?state=draft", "/api/admin/content"]) {
      const r = await call(p, h);
      expect(r.status, p).toBe(200);
      expect(r.headers.get("cache-control")).toBe("private, no-store");
      expect(r.headers.get("etag")).toBeNull();
      expect(await r.json()).toEqual({ ...EMPTY, locks: { text: {}, slots: {}, gallery: {}, rings: {}, clients: {} } });
    }
  });
});

describe("seeded rows appear in the right state only", () => {
  const by = "info@aliphcreative.com";
  async function seed() {
    await run("UPDATE meta SET v = '3' WHERE k = 'publish_rev'");
    // draft only (never published)
    await run("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('hero1', 'en', 'Draft hero', ?)", by);
    // published, then reset in the draft (draft NULL = default)
    await run("INSERT INTO text_values (key, locale, draft, published, rev, updated_by) VALUES ('hero2', 'ar', NULL, 'منشور', 4, ?)", by);
    // both, different
    await run("INSERT INTO text_values (key, locale, draft, published, updated_by) VALUES ('meta.home.title', 'ar', 'مسودة', 'منشور', ?)", by);
    await run(
      "INSERT INTO slot_values (slot, draft_json, published_json, updated_by) VALUES ('home.media.1', ?, ?, ?)",
      JSON.stringify({ src: "assets/media/new.webp" }),
      JSON.stringify({ src: "assets/media/old.webp" }),
      by,
    );
    await run("INSERT INTO clients (id, name_ar, name_en, published_json, updated_by) VALUES ('c1', 'عميل', 'Client', ?, ?)",
      JSON.stringify({ id: "c1", name: { ar: "عميل قديم", en: "Old client" } }), by);
    // an upload: in the draft, not yet live
    await run(
      "INSERT INTO gallery_items (id, src, cat, sub, ratio, alt_en, client_id, sort, updated_by) VALUES ('up-1', 'https://media.aliphcreative.com/img/up-1.webp', 'design', 'logos', 1.5, 'A logo', 'c1', 2, ?)",
      by,
    );
    // a hidden default piece, live; removal staged in the draft
    const live = galleryItemFromRow({
      id: "design-haqqak-1.webp", src: null, poster: null, cat: null, sub: null, ratio: null, date: null,
      alt_ar: null, alt_en: null, client_id: null, hidden: 1, sort: 1,
    });
    await run(
      "INSERT INTO gallery_items (id, hidden, sort, state, published_json, updated_by) VALUES ('design-haqqak-1.webp', 1, 1, 'deleted', ?, ?)",
      JSON.stringify(live),
      by,
    );
    // ring: live list, reset staged in the draft
    await run(
      "INSERT INTO ring_picks (service, item_ids_json, state, published_json, rev, updated_by) VALUES ('design', ?, 'deleted', ?, 2, ?)",
      JSON.stringify(["design-grillit-1.webp"]), JSON.stringify(["design-grillit-1.webp"]), by,
    );
    // ring: drafted, not yet live
    await run("INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('photo', ?, ?)", JSON.stringify(["reels-alif-tuktuk.webp", "up-1"]), by);
  }

  it("published snapshot = the published columns / published_json only", async () => {
    await seed();
    const r = await call("/api/content");
    expect(r.headers.get("etag")).toBe('"3"');
    expect(await r.json()).toEqual({
      rev: 3,
      text: { hero2: { ar: "منشور" }, "meta.home.title": { ar: "منشور" } },
      slots: { "home.media.1": { src: "assets/media/old.webp" } },
      gallery: [{ id: "design-haqqak-1.webp", hidden: true, sort: 1 }],
      rings: { design: ["design-grillit-1.webp"] },
      clients: [{ id: "c1", name: { ar: "عميل قديم", en: "Old client" } }],
    });
  });

  it("draft snapshot = the draft columns minus staged removals, with every row's lock rev", async () => {
    await seed();
    const r = await call("/api/admin/content", { headers: { "Cf-Access-Jwt-Assertion": await token() } });
    expect(await r.json()).toEqual({
      rev: 3,
      text: { hero1: { en: "Draft hero" }, "meta.home.title": { ar: "مسودة" } },
      slots: { "home.media.1": { src: "assets/media/new.webp" } },
      gallery: [
        {
          id: "up-1", src: "https://media.aliphcreative.com/img/up-1.webp", cat: "design", sub: "logos",
          ratio: 1.5, alt: { en: "A logo" }, client: "c1", sort: 2,
        },
      ],
      rings: { photo: ["reels-alif-tuktuk.webp", "up-1"] },
      clients: [{ id: "c1", name: { ar: "عميل", en: "Client" } }],
      locks: {
        text: { hero1: { en: 1 }, hero2: { ar: 4 }, "meta.home.title": { ar: 1 } },
        slots: { "home.media.1": 1 },
        gallery: { "up-1": 1, "design-haqqak-1.webp": 1 },
        rings: { design: 2, photo: 1 },
        clients: { c1: 1 },
      },
    });
  });

  it("gallery order is sort ascending, unsorted last, then id", async () => {
    for (const [id, sort] of [["b", null], ["a", null], ["z", 1], ["m", 0.5]] as const) {
      await run("INSERT INTO gallery_items (id, src, cat, sort, updated_by) VALUES (?, 'assets/media/x.webp', 'photo', ?, ?)", id, sort, by);
    }
    const r = await call("/api/admin/content", { headers: { "Cf-Access-Jwt-Assertion": await token() } });
    expect(((await r.json()) as Snapshot).gallery.map((g) => g.id)).toEqual(["m", "z", "a", "b"]);
  });
});

describe("validation by registry (write handlers answer a failure with badRequest → 400)", () => {
  it("text: unknown key / locale → 400; null resets; kinds and lengths enforced", async () => {
    const r = validateText("noSuchKey", "ar", "x");
    expect(r).toEqual({ ok: false, error: "unknown key", field: "key" });
    if (r.ok) throw new Error("unreachable");
    const res = badRequest(r);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "unknown key", field: "key" });

    expect(validateText("hero1", "fr", "x")).toMatchObject({ ok: false, field: "locale" });
    expect(validateText("meta.home.title", "en", "Title")).toMatchObject({ ok: false, field: "locale" });
    expect(validateText("meta.home.title", "ar", "")).toMatchObject({ ok: false, error: "value is required" });
    expect(validateText("hero1", "ar", null)).toEqual({ ok: true, value: null });
    expect(validateText("hero1", "ar", 5)).toMatchObject({ ok: false });
    expect(validateText("hero1", "en", "two\nlines")).toMatchObject({ ok: false, field: "value" });
    expect(validateText("heroPara", "en", "two\nlines")).toEqual({ ok: true, value: "two\nlines" });
    expect(validateText("heroPara", "en", "bell\u0007")).toMatchObject({ ok: false });
    expect(validateText("heroPara", "en", "cr\r\n")).toMatchObject({ ok: false });
    const max = registry.text.find((e) => e.key === "hero1")!.maxLength;
    expect(validateText("hero1", "en", "x".repeat(max)).ok).toBe(true);
    expect(validateText("hero1", "en", "x".repeat(max + 1))).toMatchObject({ ok: false, field: "value" });
    expect(validateText("subcat.photo.reels.desc", "en", "A ring line").ok).toBe(true);
    expect(validateText("testimonial.2.name", "ar", "اسم").ok).toBe(true);
    expect(validateText("subcat.photo.nope.desc", "en", "x")).toMatchObject({ ok: false, field: "key" });
  });

  it("slots: unknown slot → 400; fields by slot kind; URLs only from the bundle or the media host", () => {
    const plain = registry.slots.find((s) => s.kind === "media" && !("preview" in s))!.id;
    const reel = registry.slots.find((s) => "preview" in s)!.id;
    expect(validateSlot("home.media.999", { src: "assets/media/a.webp" })).toMatchObject({ ok: false, field: "slot" });
    expect(validateSlot(plain, null)).toEqual({ ok: true, value: null });
    expect(validateSlot(plain, {})).toMatchObject({ ok: false });
    expect(validateSlot(plain, { src: "assets/media/a.webp", alt: { ar: "وصف" } })).toEqual({
      ok: true, value: { src: "assets/media/a.webp", alt: { ar: "وصف" } },
    });
    expect(validateSlot(plain, { poster: "assets/media/a.webp" })).toMatchObject({ ok: false, field: "poster" });
    expect(validateSlot(plain, { srcset: "a 1x" })).toMatchObject({ ok: false, field: "srcset" });
    for (const bad of [
      "https://evil.example/a.webp", "http://media.aliphcreative.com/a.webp", "assets/media/../x.webp",
      "javascript:alert(1)", "assets/media/a.webp?x=1", "assets/media/a.svg", "/assets/media/a.webp",
    ]) {
      expect(validateSlot(plain, { src: bad }), bad).toMatchObject({ ok: false, field: "src" });
    }
    expect(validateSlot(reel, {
      src: "https://media.aliphcreative.com/img/r.webp", poster: "https://media.aliphcreative.com/img/r.webp",
      preview: "https://media.aliphcreative.com/video/r.mp4",
    }).ok).toBe(true);
    expect(validateSlot(reel, { preview: "https://media.aliphcreative.com/video/r.webp" })).toMatchObject({ ok: false, field: "preview" });
  });

  it("rings: unknown ring / item → 400; null stages a reset; uploads need the caller's lookup", () => {
    expect(validateRing("video", ["x"])).toMatchObject({ ok: false, field: "service" });
    expect(validateRing("design", null)).toEqual({ ok: true, value: null });
    expect(validateRing("design", [])).toMatchObject({ ok: false });
    expect(validateRing("design", ["design-grillit-2.webp", "design-grillit-1.webp"]).ok).toBe(true);
    expect(validateRing("tech", ["queens-retreat-cover"]).ok).toBe(true);
    expect(validateRing("design", ["reels-alif-tuktuk.webp"])).toMatchObject({ ok: false, field: "items.0" });
    expect(validateRing("design", ["design-grillit-1.webp", "design-grillit-1.webp"])).toMatchObject({ ok: false, field: "items.1" });
    expect(validateRing("photo", ["up-1"])).toMatchObject({ ok: false });
    expect(validateRing("photo", ["up-1"], (id) => id === "up-1").ok).toBe(true);
  });

  it("gallery items and clients", () => {
    expect(validateGalleryItem({ id: "up-2", src: "https://media.aliphcreative.com/img/u.webp", cat: "photo", sub: "stills", ratio: 1.5, date: "2026-11" }).ok).toBe(true);
    expect(validateGalleryItem({ id: "up-2", cat: "photo" })).toMatchObject({ ok: false, field: "src" });
    expect(validateGalleryItem({ id: "design-haqqak-1.webp", hidden: true })).toEqual({ ok: true, value: { id: "design-haqqak-1.webp", hidden: true } });
    expect(validateGalleryItem({ id: "design-haqqak-1.webp", sub: "reels" })).toMatchObject({ ok: false, field: "sub" });
    expect(validateGalleryItem({ id: "design-haqqak-1.webp", cat: "all" })).toMatchObject({ ok: false, field: "cat" });
    expect(validateGalleryItem({ id: "design-haqqak-1.webp", extra: 1 })).toMatchObject({ ok: false, field: "extra" });
    expect(validateGalleryItem({ id: "../x" })).toMatchObject({ ok: false, field: "id" });
    expect(validateClient({ id: "c1", name: { ar: "عميل", en: "Client" } }).ok).toBe(true);
    expect(validateClient({ id: "c1", name: { ar: "", en: "Client" } })).toMatchObject({ ok: false, field: "name.ar" });
  });

  // P-10b: a video's src is the film (main.js plays it: data-film, ring
  // preview) and its poster the picture; an image has no poster.
  it("gallery: src is a video exactly when the item is a video; poster only on a video", () => {
    const H = "https://media.aliphcreative.com";
    const vid = "horizontal-maqasid.mp4"; /* a default MEDIA video row */
    const img = "design-haqqak-1.webp"; /* a default MEDIA image row */
    /* uploads */
    expect(validateGalleryItem({ id: "up-v", src: `${H}/video/u.mp4`, poster: `${H}/poster/u.webp`, cat: "photo" }).ok).toBe(true);
    expect(validateGalleryItem({ id: "up-v", src: `${H}/img/u.webp`, poster: `${H}/poster/u.webp`, cat: "photo" })).toMatchObject({ ok: false, field: "src" });
    expect(validateGalleryItem({ id: "up-v", src: `${H}/video/u.mp4`, cat: "photo" })).toMatchObject({ ok: false, field: "poster" });
    expect(validateGalleryItem({ id: "up-v", src: `${H}/video/u.mp4`, poster: `${H}/video/u.mp4`, cat: "photo" })).toMatchObject({ ok: false, field: "poster" });
    /* override of a default video */
    expect(validateGalleryItem({ id: vid, src: `${H}/video/new.mp4` }).ok).toBe(true);
    expect(validateGalleryItem({ id: vid, poster: `${H}/poster/new.webp` }).ok).toBe(true);
    expect(validateGalleryItem({ id: vid, src: `${H}/img/new.webp` })).toMatchObject({ ok: false, field: "src" });
    /* override of a default image */
    expect(validateGalleryItem({ id: img, src: `${H}/img/new.webp` }).ok).toBe(true);
    expect(validateGalleryItem({ id: img, src: `${H}/video/new.mp4` })).toMatchObject({ ok: false, field: "src" });
    expect(validateGalleryItem({ id: img, poster: `${H}/poster/new.webp` })).toMatchObject({ ok: false, field: "poster" });
  });

  // P-10a: main.js puts table text into innerHTML (renderLibrary fill(): the
  // SUBCATS name) and into double-quoted attributes (aria-label from I18N), so
  // < > and " would let a published value become markup. Refused at the door.
  describe("markup characters < > \" are refused (main.js innerHTML / attribute sinks)", () => {
    const MSG = "use “ ” instead of \"; no < or >";
    for (const ch of ["<", ">", "\""]) {
      it(`text refuses ${ch}`, async () => {
        for (const [key, locale] of [["hero1", "en"], ["heroPara", "ar"], ["subcat.photo.reels.name", "en"], ["meta.home.title", "ar"]]) {
          const r = validateText(key, locale, `a${ch}b`);
          expect(r, key).toEqual({ ok: false, error: MSG, field: "value" });
          if (r.ok) throw new Error("unreachable");
          const res = badRequest(r);
          expect(res.status).toBe(400);
          expect(await res.json()).toEqual({ error: MSG, field: "value" });
        }
      });
      it(`alt refuses ${ch} (slots and gallery)`, () => {
        const plain = registry.slots.find((s) => s.kind === "media" && !("preview" in s))!.id;
        expect(validateSlot(plain, { alt: { en: `a${ch}b` } })).toEqual({ ok: false, error: MSG, field: "alt.en" });
        expect(validateGalleryItem({ id: "design-haqqak-1.webp", alt: { ar: `a${ch}b` } })).toEqual({ ok: false, error: MSG, field: "alt.ar" });
      });
      it(`client name refuses ${ch}`, () => {
        expect(validateClient({ id: "c1", name: { ar: "عميل", en: `a${ch}b` } })).toEqual({ ok: false, error: MSG, field: "name.en" });
        expect(validateClient({ id: "c1", name: { ar: `a${ch}b`, en: "Client" } })).toEqual({ ok: false, error: MSG, field: "name.ar" });
      });
    }
    it("curly quotes, apostrophes and & stay allowed", () => {
      expect(validateText("hero1", "en", "“quoted” it's A & B").ok).toBe(true);
      expect(validateClient({ id: "c1", name: { ar: "عميل", en: "A & B's" } }).ok).toBe(true);
    });
  });
});
