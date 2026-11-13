// C-04: GET /api/admin/clients + POST /api/admin/clients.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ADMIN, call, del, installAccess, post, put, uninstallAccess } from "../gallery/helpers";
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

/* ── C-05: PUT + DELETE ───────────────────────────────────────────── */

const made = async (en = "Client", extra: Record<string, unknown> = {}) => {
  const r = await create({ name: { ar: "ع", en }, ...extra });
  expect(r.status).toBe(201);
  return ((await r.json()) as { client: AdminClient }).client;
};
const items = async (client: string, n: number, state = "active") => {
  for (let i = 0; i < n; i++) {
    await run(
      "INSERT INTO gallery_items (id, src, cat, client_id, state, updated_by) VALUES (?1, ?2, 'photo', ?3, ?4, 'a@b.c')",
      `${client}-${state}-${i}`, `https://media.aliphcreative.com/${i}.webp`, client, state,
    );
  }
};
const auditOf = (action: string) =>
  db().prepare("SELECT actor, target FROM audit WHERE action = ? ORDER BY id DESC").bind(action).first();

describe("PUT /api/admin/clients/:id", () => {
  it("replaces every field on the rev you read, bumps rev, audit client.update", async () => {
    const c = await made("Before", { line: { en: "old" }, year: 2000, url: "https://old.example/" });
    const r = await put(`/api/admin/clients/${c.id}`, {
      rev: c.rev, name: { ar: "بعد", en: "After" }, line: { ar: "جديد" }, year: "2024", url: "https://new.example",
    });
    expect(r.status).toBe(200);
    expect(((await r.json()) as { client: AdminClient }).client).toEqual({
      id: c.id, name: { ar: "بعد", en: "After" }, line: { ar: "جديد" }, year: 2024, url: "https://new.example/",
      rev: 2, published: false, changed: true, pieces: 0,
    });
    expect(await auditOf("client.update")).toEqual({ actor: ADMIN, target: c.id });

    // a field left out is cleared
    const r2 = await put(`/api/admin/clients/${c.id}`, { rev: 2, name: { ar: "بعد", en: "After" } });
    expect(Object.keys(((await r2.json()) as { client: AdminClient }).client)).toEqual(["id", "name", "rev", "published", "changed", "pieces"]);
  });

  it("stale rev → 409 {error, current}, nothing written", async () => {
    const c = await made("Stale");
    await put(`/api/admin/clients/${c.id}`, { rev: 1, name: { ar: "ع", en: "First" } });
    const r = await put(`/api/admin/clients/${c.id}`, { rev: 1, name: { ar: "ع", en: "Second" } });
    expect(r.status).toBe(409);
    const b = (await r.json()) as { error: string; current: AdminClient };
    expect(b.current).toMatchObject({ id: c.id, name: { en: "First" }, rev: 2 });
    expect((await list())[0].name.en).toBe("First");
  });

  it("unknown or deleted client → 409 with current null; bad body → 400", async () => {
    expect(((await (await put("/api/admin/clients/nobody", { rev: 1, name: { ar: "ع", en: "X" } })).json()) as { current: null }).current).toBeNull();
    const c = await made("Gone");
    await run("UPDATE clients SET state = 'deleted' WHERE id = ?", c.id);
    const r = await put(`/api/admin/clients/${c.id}`, { rev: 1, name: { ar: "ع", en: "X" } });
    expect(r.status).toBe(409);
    for (const [body, field] of [
      [{ name: { ar: "ع", en: "X" } }, "rev"],
      [{ rev: 0, name: { ar: "ع", en: "X" } }, "rev"],
      [{ rev: 1, name: { ar: "ع", en: "X" }, id: "other" }, "id"],
      [{ rev: 1, name: { ar: "ع", en: "X" }, url: "javascript:x" }, "url"],
    ] as [unknown, string][]) {
      const b = await put(`/api/admin/clients/${c.id}`, body);
      expect(b.status, JSON.stringify(body)).toBe(400);
      expect(((await b.json()) as { field: string }).field).toBe(field);
    }
  });

  it("cross-origin → 403", async () => {
    const c = await made("Csrf");
    expect((await put(`/api/admin/clients/${c.id}`, { rev: 1, name: { ar: "ع", en: "X" } }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await del(`/api/admin/clients/${c.id}?rev=1`, { origin: "https://evil.example" })).status).toBe(403);
    expect((await list())[0]).toMatchObject({ name: { en: "Csrf" }, rev: 1 });
  });
});

describe("DELETE /api/admin/clients/:id?rev=", () => {
  it("in use by 7 active items → 409 {error: 'in use', count: 7}, nothing deleted", async () => {
    const c = await made("Busy");
    await items(c.id, 7);
    const r = await del(`/api/admin/clients/${c.id}?rev=${c.rev}`);
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: "in use", count: 7, message: "7 pieces use this client" });
    expect(await list()).toMatchObject([{ id: c.id, rev: 1, pieces: 7 }]);
    expect(await auditOf("client.delete")).toBeNull();
  });

  it("used only by deleted items → 200, staged as deleted, audit client.delete", async () => {
    const c = await made("Free");
    await items(c.id, 3, "deleted");
    const r = await del(`/api/admin/clients/${c.id}?rev=${c.rev}`);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ deleted: c.id });
    expect(await list()).toEqual([]);
    expect(await db().prepare("SELECT state, rev FROM clients WHERE id = ?").bind(c.id).first()).toEqual({ state: "deleted", rev: 2 });
    expect(await auditOf("client.delete")).toEqual({ actor: ADMIN, target: c.id });
  });

  it("stale rev → 409 with current; missing / bad rev → 400; deleting twice → 409 current null", async () => {
    const c = await made("Twice");
    await put(`/api/admin/clients/${c.id}`, { rev: 1, name: { ar: "ع", en: "Twice!" } });
    const r = await del(`/api/admin/clients/${c.id}?rev=1`);
    expect(r.status).toBe(409);
    expect(((await r.json()) as { current: AdminClient }).current).toMatchObject({ rev: 2 });
    for (const q of ["", "?rev=", "?rev=0", "?rev=x", "?rev=1.5"]) {
      expect((await del(`/api/admin/clients/${c.id}${q}`)).status, q).toBe(400);
    }
    expect((await del(`/api/admin/clients/${c.id}?rev=2`)).status).toBe(200);
    const again = await del(`/api/admin/clients/${c.id}?rev=3`);
    expect(again.status).toBe(409);
    expect(((await again.json()) as { current: null }).current).toBeNull();
  });

  it("a stale rev on a used client is the stale 409, not the in-use one", async () => {
    const c = await made("Both");
    await items(c.id, 2);
    const r = await del(`/api/admin/clients/${c.id}?rev=9`);
    expect(r.status).toBe(409);
    expect(((await r.json()) as { error: string }).error).toBe("changed elsewhere; reload");
  });

  it("deeper paths → 404", async () => {
    expect((await call("/api/admin/clients/a/b")).status).toBe(404);
  });
});
