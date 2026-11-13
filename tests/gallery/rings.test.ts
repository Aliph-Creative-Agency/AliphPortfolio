// G-02c: PUT / DELETE /api/admin/rings/:service, and the published ring in the served home page.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import defaults from "../../worker/src/generated/defaults.json";
import { publish } from "../../worker/src/publish";
import { ADMIN, call, del, installAccess, put, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

type Media = { f: string; c: string };
const PHOTO = (defaults.MEDIA as Media[]).filter((m) => m.c === "photo").map((m) => m.f);
const DEFAULT_PHOTO = (defaults.RINGS.photo as { f?: string; shot?: string }[]).map((x) => x.f ?? x.shot);
const R2 = "https://media.aliphcreative.com/admin/2026/11";

interface Ring { ids: string[]; isDefault: boolean; rev: number; changed: boolean }
const body = async (r: Response) => (await r.json()) as { ring: Ring; current: Ring; error: string; field?: string };
const upload = (id: string, extra: Record<string, unknown> = {}) =>
  put(`/api/admin/gallery/${id}`, { src: `${R2}/${id}.webp`, cat: "photo", baseRev: 0, ...extra });
const draftRing = async () =>
  ((await (await call("/api/admin/gallery")).json()) as { rings: Record<string, Ring> }).rings.photo;
/** The boot-merge blob the served page carries before main.js. */
async function servedRings(): Promise<Record<string, string[]>> {
  const html = await (await call("/")).text();
  const m = html.match(/<script type="application\/json" id="aliph-content">([\s\S]*?)<\/script>/);
  return m ? (JSON.parse(m[1]) as { rings: Record<string, string[]> }).rings : {};
}

describe("PUT /api/admin/rings/:service", () => {
  it("saves 3 ids (one an upload), audited; a stale rev is a 409 with the current ring", async () => {
    await upload("up-ring");
    const ids = [PHOTO[3], "up-ring", PHOTO[0]];
    const r = await put("/api/admin/rings/photo", { ids, baseRev: 0 });
    expect(r.status).toBe(200);
    expect((await body(r)).ring).toEqual({ ids, isDefault: false, rev: 1, changed: true });
    expect(await draftRing()).toMatchObject({ ids, rev: 1 });
    const a = await env.DB.prepare("SELECT actor, target FROM audit WHERE action = 'ring.save'").all();
    expect(a.results).toEqual([{ actor: ADMIN, target: "photo" }]);

    const stale = await put("/api/admin/rings/photo", { ids: [PHOTO[1]], baseRev: 0 });
    expect(stale.status).toBe(409);
    expect((await body(stale)).current).toMatchObject({ ids, rev: 1 });
    const ok = await body(await put("/api/admin/rings/photo", { ids: [PHOTO[1]], baseRev: 1 }));
    expect(ok.ring).toMatchObject({ ids: [PHOTO[1]], rev: 2 });
  });

  it("a stale rev with no row never creates one", async () => {
    expect((await put("/api/admin/rings/photo", { ids: [PHOTO[0]], baseRev: 4 })).status).toBe(409);
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM ring_picks").first("n")).toBe(0);
  });

  it("400s: unknown id, hidden / deleted / other-category upload, unknown ring, empty, duplicate, no baseRev", async () => {
    await upload("up-hidden", { hidden: true });
    await upload("up-gone");
    await del("/api/admin/gallery/up-gone?baseRev=1");
    await put("/api/admin/gallery/up-design", { src: `${R2}/up-design.webp`, cat: "design", baseRev: 0 });
    const cases: [string, Record<string, unknown>, string][] = [
      ["photo", { ids: [PHOTO[0], "nope"], baseRev: 0 }, "items.1"],
      ["photo", { ids: ["up-hidden"], baseRev: 0 }, "items.0"],
      ["photo", { ids: ["up-gone"], baseRev: 0 }, "items.0"],
      ["photo", { ids: ["up-design"], baseRev: 0 }, "items.0"],
      ["nope", { ids: [PHOTO[0]], baseRev: 0 }, "service"],
      ["photo", { ids: [], baseRev: 0 }, "items"],
      ["photo", { ids: [PHOTO[0], PHOTO[0]], baseRev: 0 }, "items.1"],
      ["photo", { ids: [PHOTO[0]] }, "baseRev"],
    ];
    for (const [svc, b, field] of cases) {
      const r = await put(`/api/admin/rings/${svc}`, b);
      expect(r.status, JSON.stringify(b)).toBe(400);
      expect((await body(r)).field, JSON.stringify(b)).toBe(field);
    }
    expect(await env.DB.prepare("SELECT COUNT(*) AS n FROM ring_picks").first("n")).toBe(0);
  });

  it("refuses a foreign Origin", async () => {
    expect((await put("/api/admin/rings/photo", { ids: [PHOTO[0]], baseRev: 0 }, { origin: "https://evil.example" })).status).toBe(403);
  });
});

describe("DELETE /api/admin/rings/:service (reset to default)", () => {
  it("stages the reset: the draft shows the default ring; stale rev 409", async () => {
    await put("/api/admin/rings/photo", { ids: [PHOTO[2]], baseRev: 0 });
    expect((await del("/api/admin/rings/photo?baseRev=9")).status).toBe(409);
    expect((await del("/api/admin/rings/photo")).status).toBe(400);
    const r = await body(await del("/api/admin/rings/photo?baseRev=1"));
    expect(r.ring).toEqual({ ids: DEFAULT_PHOTO, isDefault: true, rev: 2, changed: false });
    expect(await draftRing()).toMatchObject({ ids: DEFAULT_PHOTO, isDefault: true });
    const a = await env.DB.prepare("SELECT target FROM audit WHERE action = 'ring.reset'").all();
    expect(a.results).toEqual([{ target: "photo" }]);
  });
});

describe("after publish()", () => {
  it("the served / carries the ring; after a reset and a publish it is gone (default)", async () => {
    await upload("up-ring");
    const ids = [PHOTO[5], PHOTO[1], "up-ring"];
    await put("/api/admin/rings/photo", { ids, baseRev: 0 });
    await publish(env.DB, ADMIN);
    expect((await servedRings()).photo).toEqual(ids);
    expect(await draftRing()).toMatchObject({ changed: false });

    await del("/api/admin/rings/photo?baseRev=1");
    expect(await draftRing()).toMatchObject({ changed: true, isDefault: true });
    await publish(env.DB, ADMIN);
    expect((await servedRings()).photo).toBeUndefined();
  });
});
