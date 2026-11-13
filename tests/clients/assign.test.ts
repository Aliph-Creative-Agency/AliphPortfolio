// C-06: POST /api/admin/gallery/assign — bulk client assignment, all or nothing.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADMIN, call, del, installAccess, post, uninstallAccess } from "../gallery/helpers";
import defaults from "../../worker/src/generated/defaults.json";

const db = () => env.DB;
const run = (sql: string, ...b: unknown[]) => db().prepare(sql).bind(...b).run();
const MEDIA = (defaults.MEDIA as { f: string }[]).map((m) => m.f);
const [D1, D2, D3] = MEDIA;

type Item = { id: string; rev: number; own: { client?: string; sort?: number }; kind: string; deleted: boolean };
const assign = (body: unknown, init = {}) => post("/api/admin/gallery/assign", body, init);
const rowOf = (id: string) =>
  db().prepare("SELECT client_id, rev, state, src, sort FROM gallery_items WHERE id = ?").bind(id).first<{
    client_id: string | null; rev: number; state: string; src: string | null; sort: number | null;
  }>();
const snapshotRows = async () =>
  (await db().prepare("SELECT id, client_id, rev, state FROM gallery_items ORDER BY id").all()).results;
const auditCount = async () =>
  (await db().prepare("SELECT count(*) AS n FROM audit WHERE action = 'gallery.assign'").first<{ n: number }>())!.n;

async function client(id: string, state = "active") {
  await run("INSERT INTO clients (id, name_ar, name_en, state, updated_by) VALUES (?1, 'ع', ?1, ?2, 'a@b.c')", id, state);
}
async function upload(id: string, clientId: string | null = null, state = "active") {
  await run(
    "INSERT INTO gallery_items (id, src, cat, client_id, state, updated_by) VALUES (?1, ?2, 'photo', ?3, ?4, 'a@b.c')",
    id, `https://media.aliphcreative.com/${id}.webp`, clientId, state,
  );
}

beforeEach(async () => {
  await installAccess();
  await client("acme");
  await client("other");
});
afterEach(uninstallAccess);

describe("POST /api/admin/gallery/assign", () => {
  it("200: uploads and a default piece get the client; one audit row; items in the order sent", async () => {
    await upload("u1");
    await upload("u2", "other");
    const before = await auditCount();
    const r = await assign({ client: "acme", items: [{ id: "u2", rev: 1 }, { id: D1, rev: 0 }, { id: "u1", rev: 1 }] });
    expect(r.status).toBe(200);
    const { items } = (await r.json()) as { items: Item[] };
    expect(items.map((i) => [i.id, i.own.client, i.rev])).toEqual([["u2", "acme", 2], [D1, "acme", 1], ["u1", "acme", 2]]);
    // the default got a bare override row: id + client only, MEDIA keeps the rest
    expect(await rowOf(D1)).toEqual({ client_id: "acme", rev: 1, state: "active", src: null, sort: null });
    expect(await auditCount()).toBe(before + 1);
    const a = await db().prepare("SELECT actor, target, detail FROM audit WHERE action = 'gallery.assign' ORDER BY id DESC").first<{ actor: string; target: string; detail: string }>();
    expect(a).toMatchObject({ actor: ADMIN, target: "acme" });
    expect(JSON.parse(a!.detail)).toEqual({ client: "acme", ids: ["u2", D1, "u1"] });
    // the Clients panel counts them
    const list = (await (await call("/api/admin/clients")).json()) as { clients: { id: string; pieces: number }[] };
    expect(list.clients.find((c) => c.id === "acme")?.pieces).toBe(3);
  });

  it("null clears the client; a default with no row is left alone (no empty row)", async () => {
    await upload("u1", "acme");
    const r = await assign({ client: null, items: [{ id: "u1", rev: 1 }, { id: D2, rev: 0 }] });
    expect(r.status).toBe(200);
    expect(await rowOf("u1")).toMatchObject({ client_id: null, rev: 2 });
    expect(await rowOf(D2)).toBeNull();
    const a = await db().prepare("SELECT target FROM audit WHERE action = 'gallery.assign' ORDER BY id DESC").first();
    expect(a).toEqual({ target: null });
  });

  it("a piece that already has the client is rev-checked but not rewritten", async () => {
    await upload("u1", "acme");
    const r = await assign({ client: "acme", items: [{ id: "u1", rev: 1 }] });
    expect(r.status).toBe(200);
    expect(await rowOf("u1")).toMatchObject({ client_id: "acme", rev: 1 });
  });

  it("a default whose revert is staged comes back as a bare override with the client", async () => {
    await run("INSERT INTO gallery_items (id, src, cat, sort, state, updated_by) VALUES (?1, 'https://media.aliphcreative.com/x.webp', 'photo', 5, 'deleted', 'a@b.c')", D3);
    const r = await assign({ client: "acme", items: [{ id: D3, rev: 1 }] });
    expect(r.status).toBe(200);
    expect(await rowOf(D3)).toEqual({ client_id: "acme", rev: 2, state: "active", src: null, sort: null });
  });

  it("stale rev → 409 with the stale ids, and NOTHING written", async () => {
    await upload("u1");
    await upload("u2");
    await run("UPDATE gallery_items SET rev = 3 WHERE id = 'u2'");
    await run("INSERT INTO gallery_items (id, sort, updated_by) VALUES (?1, 10, 'a@b.c')", D1); // the grid read rev 0
    const rows = await snapshotRows();
    const audits = await auditCount();
    const r = await assign({ client: "acme", items: [{ id: "u1", rev: 1 }, { id: "u2", rev: 1 }, { id: D1, rev: 0 }, { id: D2, rev: 0 }] });
    expect(r.status).toBe(409);
    const b = (await r.json()) as { error: string; stale: string[]; current: Item[] };
    expect(b.stale).toEqual(["u2", D1]);
    expect(b.current.map((i) => [i.id, i.rev])).toEqual([["u2", 3], [D1, 1]]);
    expect(await snapshotRows()).toEqual(rows);
    expect(await auditCount()).toBe(audits);
  });

  it("201 items → 400; 0 items → 400; a bad entry → 400 on items.N", async () => {
    const many = Array.from({ length: 201 }, (_, i) => ({ id: MEDIA[i % MEDIA.length] + (i >= MEDIA.length ? "-x" + i : ""), rev: 0 }));
    for (const [body, field] of [
      [{ client: "acme", items: many }, "items"],
      [{ client: "acme", items: [] }, "items"],
      [{ client: "acme" }, "items"],
      [{ client: "acme", items: [{ id: D1 }] }, "items.0"],
      [{ client: "acme", items: [{ id: D1, rev: 0 }, { id: D1, rev: 0 }] }, "items.1"],
      [{ client: "acme", items: [{ id: "no-such-piece", rev: 0 }] }, "items.0"],
      [{ items: [{ id: D1, rev: 0 }] }, "client"],
      [{ client: 5, items: [{ id: D1, rev: 0 }] }, "client"],
      [[], "assign"],
    ] as [unknown, string][]) {
      const r = await assign(body);
      expect(r.status, JSON.stringify(body).slice(0, 80)).toBe(400);
      expect(((await r.json()) as { field: string }).field).toBe(field);
    }
    expect(await rowOf(D1)).toBeNull();
  });

  it("200 items is the limit and works", async () => {
    for (let i = 0; i < 200; i++) await upload(`b${String(i).padStart(3, "0")}`);
    const r = await assign({ client: "acme", items: Array.from({ length: 200 }, (_, i) => ({ id: `b${String(i).padStart(3, "0")}`, rev: 1 })) });
    expect(r.status).toBe(200);
    const n = await db().prepare("SELECT count(*) AS n FROM gallery_items WHERE client_id = 'acme'").first<{ n: number }>();
    expect(n?.n).toBe(200);
  });

  it("unknown or deleted client → 400 on client; an upload staged for deletion is not a piece", async () => {
    await client("gone", "deleted");
    await upload("u1");
    await upload("dead", null, "deleted");
    for (const c of ["nobody", "gone"]) {
      const r = await assign({ client: c, items: [{ id: "u1", rev: 1 }] });
      expect(r.status).toBe(400);
      expect(((await r.json()) as { field: string }).field).toBe("client");
    }
    const r = await assign({ client: "acme", items: [{ id: "dead", rev: 1 }] });
    expect(((await r.json()) as { field: string }).field).toBe("items.0");
    expect(await rowOf("u1")).toMatchObject({ client_id: null, rev: 1 });
  });

  it("after an assignment the client cannot be deleted (in use); cross-origin → 403", async () => {
    await upload("u1");
    expect((await assign({ client: "acme", items: [{ id: "u1", rev: 1 }] }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await assign({ client: "acme", items: [{ id: "u1", rev: 1 }] })).status).toBe(200);
    const d = await del("/api/admin/clients/acme?rev=1");
    expect(d.status).toBe(409);
    expect(await d.json()).toMatchObject({ error: "in use", count: 1 });
  });
});
