// P-02: the D1 schema in migrations/ is exactly what the content store, the
// editor and the gallery teams were promised — every table, column, primary
// key and index — and the history tables cannot be rewritten.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

type Col = [name: string, type: string, notnull: 0 | 1, pk: number];

// [name, declared type, NOT NULL, position in the primary key (0 = not in it)]
const TABLES: Record<string, Col[]> = {
  text_values: [
    ["key", "TEXT", 1, 1],
    ["locale", "TEXT", 1, 2],
    ["draft", "TEXT", 0, 0],
    ["published", "TEXT", 0, 0],
    ["rev", "INTEGER", 1, 0],
    ["updated_at", "TEXT", 1, 0],
    ["updated_by", "TEXT", 1, 0],
  ],
  slot_values: [
    ["slot", "TEXT", 1, 1],
    ["draft_json", "TEXT", 0, 0],
    ["published_json", "TEXT", 0, 0],
    ["rev", "INTEGER", 1, 0],
    ["updated_at", "TEXT", 1, 0],
    ["updated_by", "TEXT", 1, 0],
  ],
  clients: [
    ["id", "TEXT", 1, 1],
    ["name_ar", "TEXT", 1, 0],
    ["name_en", "TEXT", 1, 0],
    ["state", "TEXT", 1, 0],
    ["published_json", "TEXT", 0, 0],
    ["rev", "INTEGER", 1, 0],
    ["created_at", "TEXT", 1, 0],
    ["updated_at", "TEXT", 1, 0],
    ["updated_by", "TEXT", 1, 0],
    ["line_ar", "TEXT", 0, 0], // 0003
    ["line_en", "TEXT", 0, 0], // 0003
    ["year", "INTEGER", 0, 0], // 0003
    ["url", "TEXT", 0, 0], // 0003
  ],
  gallery_items: [
    ["id", "TEXT", 1, 1],
    ["src", "TEXT", 0, 0],
    ["poster", "TEXT", 0, 0],
    ["cat", "TEXT", 0, 0],
    ["sub", "TEXT", 0, 0],
    ["ratio", "REAL", 0, 0],
    ["date", "TEXT", 0, 0],
    ["alt_ar", "TEXT", 0, 0],
    ["alt_en", "TEXT", 0, 0],
    ["client_id", "TEXT", 0, 0],
    ["hidden", "INTEGER", 1, 0],
    ["sort", "REAL", 0, 0],
    ["state", "TEXT", 1, 0],
    ["published_json", "TEXT", 0, 0],
    ["rev", "INTEGER", 1, 0],
    ["created_at", "TEXT", 1, 0],
    ["updated_at", "TEXT", 1, 0],
    ["updated_by", "TEXT", 1, 0],
  ],
  ring_picks: [
    ["service", "TEXT", 1, 1],
    ["item_ids_json", "TEXT", 1, 0],
    ["published_json", "TEXT", 0, 0],
    ["rev", "INTEGER", 1, 0],
    ["updated_at", "TEXT", 1, 0],
    ["updated_by", "TEXT", 1, 0],
    ["state", "TEXT", 1, 0], // 0002
  ],
  revisions: [
    ["id", "INTEGER", 1, 1],
    ["published_at", "TEXT", 1, 0],
    ["published_by", "TEXT", 1, 0],
    ["snapshot_json", "TEXT", 1, 0],
  ],
  audit: [
    ["id", "INTEGER", 0, 1],
    ["at", "TEXT", 1, 0],
    ["actor", "TEXT", 1, 0],
    ["action", "TEXT", 1, 0],
    ["target", "TEXT", 0, 0],
    ["detail", "TEXT", 0, 0],
  ],
  meta: [
    ["k", "TEXT", 1, 1],
    ["v", "TEXT", 1, 0],
  ],
};

// Named indexes (the automatic PK ones are covered by the pk column above).
const INDEXES: Record<string, [table: string, cols: string[]]> = {
  gallery_items_cat_sort: ["gallery_items", ["cat", "sub", "sort"]],
  gallery_items_client: ["gallery_items", ["client_id"]],
  audit_at: ["audit", ["at"]],
};

const db = () => env.DB;

describe("schema", () => {
  it("has exactly the content tables", async () => {
    const { results } = await db()
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations' ORDER BY name",
      )
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(Object.keys(TABLES).sort());
  });

  for (const [table, cols] of Object.entries(TABLES)) {
    it(`${table}: columns, types, NOT NULL and primary key`, async () => {
      const { results } = await db()
        .prepare(`SELECT name, type, "notnull", pk FROM pragma_table_info(?) ORDER BY cid`)
        .bind(table)
        .all<{ name: string; type: string; notnull: number; pk: number }>();
      expect(results.map((r) => [r.name, r.type, r.notnull, r.pk])).toEqual(cols);
    });
  }

  it("has the named indexes on the right columns", async () => {
    const { results } = await db()
      .prepare("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY name")
      .all<{ name: string; tbl_name: string }>();
    expect(results.map((r) => r.name)).toEqual(Object.keys(INDEXES).sort());
    for (const [name, [table, cols]] of Object.entries(INDEXES)) {
      expect(results.find((r) => r.name === name)?.tbl_name).toBe(table);
      const info = await db()
        .prepare("SELECT name FROM pragma_index_info(?) ORDER BY seqno")
        .bind(name)
        .all<{ name: string }>();
      expect(info.results.map((r) => r.name)).toEqual(cols);
    }
  });

  it("gallery_items.client_id references clients(id)", async () => {
    const { results } = await db()
      .prepare(`SELECT "table", "from", "to", on_delete FROM pragma_foreign_key_list('gallery_items')`)
      .all();
    expect(results).toEqual([{ table: "clients", from: "client_id", to: "id", on_delete: "SET NULL" }]);
  });

  it("starts with publish_rev 0 (nothing published = parity)", async () => {
    const row = await db().prepare("SELECT v FROM meta WHERE k = 'publish_rev'").first<{ v: string }>();
    expect(row?.v).toBe("0");
  });
});

describe("constraints", () => {
  it("text_values: only ar/en, one row per key+locale, rev and updated_at default", async () => {
    await db().prepare("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('t.k', 'ar', 'س', 'a@x')").run();
    const row = await db()
      .prepare("SELECT rev, updated_at FROM text_values WHERE key = 't.k' AND locale = 'ar'")
      .first<{ rev: number; updated_at: string }>();
    expect(row?.rev).toBe(1);
    expect(row?.updated_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    await expect(
      db().prepare("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('t.k', 'ar', 'x', 'a@x')").run(),
    ).rejects.toThrow(/UNIQUE|PRIMARY/i);
    await expect(
      db().prepare("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('t.k', 'fr', 'x', 'a@x')").run(),
    ).rejects.toThrow(/CHECK/i);
  });

  it("JSON columns refuse invalid JSON; ring picks must be an array", async () => {
    await expect(
      db().prepare("INSERT INTO slot_values (slot, draft_json, updated_by) VALUES ('s', '{bad', 'a@x')").run(),
    ).rejects.toThrow(/CHECK/i);
    await expect(
      db().prepare(`INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('design', '{"a":1}', 'a@x')`).run(),
    ).rejects.toThrow(/CHECK/i);
    await db()
      .prepare(`INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('design', '["a.webp"]', 'a@x')`)
      .run();
  });

  it("ring_picks: state defaults to active and is active/deleted (0002)", async () => {
    await db().prepare(`INSERT INTO ring_picks (service, item_ids_json, updated_by) VALUES ('photo', '[]', 'a@x')`).run();
    const row = await db().prepare("SELECT state FROM ring_picks WHERE service = 'photo'").first<{ state: string }>();
    expect(row?.state).toBe("active");
    await db().prepare("UPDATE ring_picks SET state = 'deleted' WHERE service = 'photo'").run();
    await expect(
      db().prepare("UPDATE ring_picks SET state = 'reset' WHERE service = 'photo'").run(),
    ).rejects.toThrow(/CHECK/i);
  });

  it("clients: year is NULL or 4 digits (0003)", async () => {
    await db().prepare("INSERT INTO clients (id, name_ar, name_en, year, updated_by) VALUES ('cy', 'ع', 'C', 2024, 'a@x')").run();
    await db().prepare("UPDATE clients SET year = NULL WHERE id = 'cy'").run();
    for (const bad of [999, 10000]) {
      await expect(db().prepare("UPDATE clients SET year = ? WHERE id = 'cy'").bind(bad).run()).rejects.toThrow(/CHECK/i);
    }
  });

  it("gallery_items: hidden is 0/1, state active/deleted, client must exist", async () => {
    await expect(
      db().prepare("INSERT INTO gallery_items (id, hidden, updated_by) VALUES ('g1', 2, 'a@x')").run(),
    ).rejects.toThrow(/CHECK/i);
    await expect(
      db().prepare("INSERT INTO gallery_items (id, state, updated_by) VALUES ('g1', 'published', 'a@x')").run(),
    ).rejects.toThrow(/CHECK/i);
    await expect(
      db().prepare("INSERT INTO gallery_items (id, client_id, updated_by) VALUES ('g1', 'nobody', 'a@x')").run(),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });
});

describe("history is append-only", () => {
  it("revisions: INSERT works, UPDATE and DELETE fail; a reused rev collides", async () => {
    await db().prepare("INSERT INTO revisions (id, published_by, snapshot_json) VALUES (1, 'a@x', '{}')").run();
    await expect(db().prepare("UPDATE revisions SET snapshot_json = '[]' WHERE id = 1").run()).rejects.toThrow(
      /append-only/,
    );
    await expect(db().prepare("DELETE FROM revisions WHERE id = 1").run()).rejects.toThrow(/append-only/);
    await expect(
      db().prepare("INSERT INTO revisions (id, published_by, snapshot_json) VALUES (1, 'b@x', '{}')").run(),
    ).rejects.toThrow(/UNIQUE|PRIMARY/i);
    const row = await db().prepare("SELECT published_by, snapshot_json FROM revisions WHERE id = 1").first();
    expect(row).toEqual({ published_by: "a@x", snapshot_json: "{}" });
  });

  it("audit: INSERT works, UPDATE and DELETE fail", async () => {
    await db().prepare("INSERT INTO audit (actor, action, target) VALUES ('a@x', 'text.save', 't.k')").run();
    await expect(db().prepare("UPDATE audit SET actor = 'b@x'").run()).rejects.toThrow(/append-only/);
    await expect(db().prepare("DELETE FROM audit").run()).rejects.toThrow(/append-only/);
    const n = await db().prepare("SELECT count(*) AS n FROM audit").first<{ n: number }>();
    expect(n?.n).toBe(1);
  });
});
