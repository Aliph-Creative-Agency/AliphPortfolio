// E-14: PUT / DELETE /api/admin/slot — rev-locked slot draft writes + audit.
import { createExecutionContext, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";

const ORIGIN = "http://localhost";
const E: Env = { ...env, ADMIN_DEV_BYPASS: "1" };
const call = (path: string, init: RequestInit = {}) =>
  worker.fetch(new Request(ORIGIN + path, init), E, createExecutionContext());
const put = (slot: string, value: unknown, baseRev: unknown, origin: string | null = ORIGIN) =>
  call("/api/admin/slot", {
    method: "PUT",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify({ slot, value, baseRev }),
  });
const del = (slot: string, baseRev: number, origin: string | null = ORIGIN) =>
  call(`/api/admin/slot?slot=${slot}&baseRev=${baseRev}`, { method: "DELETE", headers: origin ? { origin } : {} });
const draft = async () => (await (await call("/api/admin/content")).json()) as {
  slots: Record<string, Record<string, unknown>>;
  locks: { slots: Record<string, number> };
};
let auditFrom = 0;
const auditRows = async () =>
  (await env.DB.prepare("SELECT action, target FROM audit WHERE id > ? ORDER BY id").bind(auditFrom).all()).results;

const IMG = "https://media.aliphcreative.com/img/new.webp";
const VID = "https://media.aliphcreative.com/video/new.mp4";

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM slot_values").run();
  auditFrom = (await env.DB.prepare("SELECT coalesce(max(id), 0) AS m FROM audit").first<{ m: number }>())!.m;
});

describe("PUT /api/admin/slot", () => {
  it("image slot saves: draft snapshot shows it, locks.slots bumps, audit row", async () => {
    const r = await put("about.media.1", { src: IMG, alt: { en: "A photo" } }, 0);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ slot: "about.media.1", value: { src: IMG, alt: { en: "A photo" } }, rev: 1 });
    const d = await draft();
    expect(d.slots["about.media.1"]).toEqual({ src: IMG, alt: { en: "A photo" } });
    expect(d.locks.slots["about.media.1"]).toBe(1);
    const r2 = await put("about.media.1", { src: IMG }, 1);
    expect(await r2.json()).toMatchObject({ rev: 2 });
    expect(await auditRows()).toEqual([
      { action: "slot.save", target: "about.media.1" },
      { action: "slot.save", target: "about.media.1" },
    ]);
  });

  it("video slot with poster + preview", async () => {
    const value = { preview: VID, poster: IMG };
    expect((await put("home.media.2", value, 0)).status).toBe(200);
    expect((await draft()).slots["home.media.2"]).toEqual(value);
  });

  it("stale baseRev → 409 with the current row, no audit", async () => {
    await put("about.media.1", { src: IMG }, 0);
    const stale = await put("about.media.1", { alt: { en: "x" } }, 0);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ current: { value: { src: IMG }, rev: 1 } });
    const stale2 = await put("about.media.1", { alt: { en: "x" } }, 5);
    expect(stale2.status).toBe(409);
    expect((await draft()).slots["about.media.1"]).toEqual({ src: IMG });
    expect((await auditRows()).length).toBe(1);
  });

  it("400 before any write: other-origin URL, poster on a non-preview slot, unknown slot, bad baseRev", async () => {
    expect((await put("about.media.1", { src: "https://evil.example/x.webp" }, 0)).status).toBe(400);
    expect((await put("about.media.1", { poster: IMG }, 0)).status).toBe(400);
    expect((await put("nope.media.9", { src: IMG }, 0)).status).toBe(400);
    expect((await put("about.media.1", { src: IMG }, -1)).status).toBe(400);
    expect((await put("about.media.1", { src: IMG }, "0")).status).toBe(400);
    expect((await put("about.media.1", {}, 0)).status).toBe(400);
    expect((await draft()).locks.slots["about.media.1"]).toBeUndefined();
    expect((await auditRows()).length).toBe(0);
  });

  it("value null resets (slot.reset audit)", async () => {
    await put("about.media.1", { src: IMG }, 0);
    const r = await put("about.media.1", null, 1);
    expect(r.status).toBe(200);
    const d = await draft();
    expect(d.slots["about.media.1"]).toBeUndefined();
    expect(d.locks.slots["about.media.1"]).toBe(2);
    expect((await auditRows()).map((a: any) => a.action)).toEqual(["slot.save", "slot.reset"]);
  });
});

describe("DELETE /api/admin/slot", () => {
  it("resets the draft: the snapshot drops the slot; stale rev 409", async () => {
    await put("about.media.1", { src: IMG }, 0);
    expect((await del("about.media.1", 9)).status).toBe(409);
    const r = await del("about.media.1", 1);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ slot: "about.media.1", value: null, rev: 2 });
    expect((await draft()).slots["about.media.1"]).toBeUndefined();
    expect((await auditRows()).map((a: any) => a.action)).toEqual(["slot.save", "slot.reset"]);
  });

  it("400 without baseRev or with an unknown slot", async () => {
    expect((await call("/api/admin/slot?slot=about.media.1", { method: "DELETE", headers: { origin: ORIGIN } })).status).toBe(400);
    expect((await del("zzz", 0)).status).toBe(400);
  });
});

describe("Origin guard", () => {
  it("foreign or missing Origin → 403 on PUT and DELETE, nothing written", async () => {
    expect((await put("about.media.1", { src: IMG }, 0, "https://evil.example")).status).toBe(403);
    expect((await put("about.media.1", { src: IMG }, 0, null)).status).toBe(403);
    expect((await del("about.media.1", 0, "https://evil.example")).status).toBe(403);
    expect((await del("about.media.1", 0, null)).status).toBe(403);
    expect((await auditRows()).length).toBe(0);
  });
});
