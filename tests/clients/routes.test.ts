// C-04: GET /api/admin/clients + POST /api/admin/clients.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADMIN, call, installAccess, post, uninstallAccess } from "../gallery/helpers";
import { slugOf } from "../../worker/src/clients/write";

const db = () => env.DB;
const run = (sql: string, ...b: unknown[]) => db().prepare(sql).bind(...b).run();
const ID_RE = /^[a-z0-9-]{1,40}$/;

type AdminClient = {
  id: string;
  name: { ar: string; en: string };
  line?: { ar?: string; en?: string };
  year?: number;
  url?: string;
  rev: number;
  published: boolean;
  changed: boolean;
  pieces: number;
};
const list = async () => {
  const r = await call("/api/admin/clients");
  expect(r.status).toBe(200);
  return ((await r.json()) as { clients: AdminClient[] }).clients;
};
const create = async (body: unknown) => post("/api/admin/clients", body);

beforeEach(installAccess);
afterEach(uninstallAccess);

describe("GET /api/admin/clients", () => {
  it("empty store → no clients", async () => {
    expect(await list()).toEqual([]);
  });

  it("active rows only, by English name, with rev / published / changed / pieces", async () => {
    await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('b', 'ب', 'beta', 'a@b.c')");
    await run(
      "INSERT INTO clients (id, name_ar, name_en, line_en, year, published_json, updated_by) VALUES ('a', 'أ', 'Alpha', 'L', 2020, ?, 'a@b.c')",
      JSON.stringify({ id: "a", name: { ar: "أ", en: "Alpha" }, line: { en: "L" }, year: 2020 }),
    );
    await run(
      "INSERT INTO clients (id, name_ar, name_en, published_json, updated_by) VALUES ('c', 'ج', 'Gamma', ?, 'a@b.c')",
      JSON.stringify({ id: "c", name: { ar: "ج", en: "Gamma (old)" } }),
    );
    await run("INSERT INTO clients (id, name_ar, name_en, state, updated_by) VALUES ('d', 'د', 'Deleted', 'deleted', 'a@b.c')");
    // pieces: active items only (hidden counts, deleted does not)
    await run("INSERT INTO gallery_items (id, src, cat, client_id, updated_by) VALUES ('u1', 'https://media.aliphcreative.com/1.webp', 'photo', 'a', 'a@b.c')");
    await run("INSERT INTO gallery_items (id, src, cat, client_id, hidden, updated_by) VALUES ('u2', 'https://media.aliphcreative.com/2.webp', 'photo', 'a', 1, 'a@b.c')");
    await run("INSERT INTO gallery_items (id, src, cat, client_id, state, updated_by) VALUES ('u3', 'https://media.aliphcreative.com/3.webp', 'photo', 'a', 'deleted', 'a@b.c')");
    await run("INSERT INTO gallery_items (id, src, cat, client_id, updated_by) VALUES ('u4', 'https://media.aliphcreative.com/4.webp', 'photo', 'd', 'a@b.c')");

    expect(await list()).toEqual([
      { id: "a", name: { ar: "أ", en: "Alpha" }, line: { en: "L" }, year: 2020, rev: 1, published: true, changed: false, pieces: 2 },
      { id: "b", name: { ar: "ب", en: "beta" }, rev: 1, published: false, changed: true, pieces: 0 },
      { id: "c", name: { ar: "ج", en: "Gamma" }, rev: 1, published: true, changed: true, pieces: 0 },
    ]);
  });
});

describe("POST /api/admin/clients", () => {
  it("creates a draft client with a server-made id, 201 {client}, audit client.create", async () => {
    const r = await create({
      name: { ar: "البيدر", en: "Al Baydar" },
      line: { ar: "مطاعم", en: "Restaurants" },
      year: "2021",
      url: "https://Baydar.example",
    });
    expect(r.status).toBe(201);
    const { client } = (await r.json()) as { client: AdminClient };
    expect(client.id).toMatch(/^al-baydar-[a-z0-9]{4}$/);
    expect(client).toEqual({
      id: client.id,
      name: { ar: "البيدر", en: "Al Baydar" },
      line: { ar: "مطاعم", en: "Restaurants" },
      year: 2021,
      url: "https://baydar.example/",
      rev: 1,
      published: false,
      changed: true,
      pieces: 0,
    });
    expect(await list()).toEqual([client]);
    const row = await db().prepare("SELECT updated_by, state, published_json FROM clients WHERE id = ?").bind(client.id).first();
    expect(row).toEqual({ updated_by: ADMIN, state: "active", published_json: null });
    const a = await db().prepare("SELECT actor, action, target FROM audit WHERE action = 'client.create' ORDER BY id DESC").first();
    expect(a).toEqual({ actor: ADMIN, action: "client.create", target: client.id });
  });

  it("a bare client has no line / year / url keys; blanks count as absent", async () => {
    const r = await create({ name: { ar: "ع", en: "Bare" }, line: { ar: "", en: "" }, year: "", url: "" });
    expect(r.status).toBe(201);
    const { client } = (await r.json()) as { client: AdminClient };
    expect(Object.keys(client)).toEqual(["id", "name", "rev", "published", "changed", "pieces"]);
  });

  it("id shape: [a-z0-9-], ≤ 40, from name_en; non-Latin or long names still fit", async () => {
    const names = ["Café Déjà-Vu & Co.", "عميل", "!!!", "x".repeat(80), "A  B--C", "  Lead space"];
    const ids: string[] = [];
    for (const en of names) {
      const r = await create({ name: { ar: "ع", en } });
      expect(r.status, en).toBe(201);
      ids.push(((await r.json()) as { client: AdminClient }).client.id);
    }
    for (const id of ids) expect(id).toMatch(ID_RE);
    expect(ids[0]).toMatch(/^cafe-deja-vu-co-[a-z0-9]{4}$/);
    expect(ids[1]).toMatch(/^client-[a-z0-9]{4}$/);
    expect(ids[2]).toMatch(/^client-[a-z0-9]{4}$/);
    expect(ids[3]).toMatch(/^x{35}-[a-z0-9]{4}$/);
    expect(ids[4]).toMatch(/^a-b-c-[a-z0-9]{4}$/);
    expect(ids[5]).toMatch(/^lead-space-[a-z0-9]{4}$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("slugOf never ends in a dash after the cut", () => {
    expect(slugOf("a".repeat(34) + " b")).toBe("a".repeat(34));
    expect(slugOf("—Hello—")).toBe("hello");
  });

  it("bad input → 400 with the field, nothing written", async () => {
    const cases: [unknown, string][] = [
      [{ name: { ar: "", en: "X" } }, "name.ar"],
      [{ name: { ar: "ع" } }, "name.en"],
      [{ name: { ar: "ع", en: "a<b" } }, "name.en"],
      [{ name: { ar: "ع", en: "X" }, url: "http://x.example/" }, "url"],
      [{ name: { ar: "ع", en: "X" }, year: 99 }, "year"],
      [{ name: { ar: "ع", en: "X" }, line: { en: "a\nb" } }, "line.en"],
      [{ name: { ar: "ع", en: "X" }, id: "mine" }, "id"],
      [[1], "client"],
    ];
    for (const [body, field] of cases) {
      const r = await create(body);
      expect(r.status, JSON.stringify(body)).toBe(400);
      expect(((await r.json()) as { field: string }).field).toBe(field);
    }
    const notJson = await call("/api/admin/clients", { method: "POST", body: "{nope", headers: { "content-type": "application/json" } });
    expect(notJson.status).toBe(400);
    expect(await list()).toEqual([]);
  });

  it("cross-origin or no Origin → 403, nothing written", async () => {
    const body = { name: { ar: "ع", en: "X" } };
    expect((await post("/api/admin/clients", body, { origin: "https://evil.example" })).status).toBe(403);
    expect((await post("/api/admin/clients", body, { origin: null })).status).toBe(403);
    expect(await list()).toEqual([]);
  });

  it("other methods on the collection → 405", async () => {
    expect((await call("/api/admin/clients", { method: "PATCH", headers: { origin: "https://aliphcreative.com" } })).status).toBe(405);
  });
});
