// C-01: migration 0003 gives clients line_ar / line_en / year / url. The draft
// and published snapshots carry them as `line` / `year` / `url`, left out when
// NULL, so a client with none of them publishes exactly the JSON it did
// before 0003 (no churn in revisions, no false "changed" rows).
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { publish } from "../../worker/src/publish";
import { clientFromRow, readSnapshot } from "../../worker/src/store";

const BY = "ceo@aliphcreative.com";
const db = () => env.DB;
const run = (sql: string, ...b: unknown[]) => db().prepare(sql).bind(...b).run();
const pubJson = async (id: string) =>
  (await db().prepare("SELECT published_json AS v FROM clients WHERE id = ?").bind(id).first<{ v: string | null }>())!.v;

beforeEach(async () => {
  await db().batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => db().prepare(`DELETE FROM ${t}`)),
  );
  const base = (await db().prepare("SELECT coalesce(max(id), 0) AS m FROM revisions").first<{ m: number }>())!.m;
  await run("UPDATE meta SET v = ? WHERE k = 'publish_rev'", String(base));
});

const FULL = {
  id: "c-full",
  name: { ar: "عميل كامل", en: "Full client" },
  line: { ar: "سطر عن العميل", en: "One line about them" },
  year: 2024,
  url: "https://example.com/",
};
const BARE = { id: "c-bare", name: { ar: "عميل", en: "Bare client" } };

async function insertBoth() {
  await run(
    `INSERT INTO clients (id, name_ar, name_en, line_ar, line_en, year, url, updated_by)
     VALUES ('c-full', 'عميل كامل', 'Full client', 'سطر عن العميل', 'One line about them', 2024, 'https://example.com/', ?)`,
    BY,
  );
  await run("INSERT INTO clients (id, name_ar, name_en, updated_by) VALUES ('c-bare', 'عميل', 'Bare client', ?)", BY);
}

describe("clients carry line / year / url (0003)", () => {
  it("draft snapshot: all fields for a full client, only {id, name} for a bare one", async () => {
    await insertBoth();
    const d = await readSnapshot(db(), "draft");
    expect(d.clients).toEqual([BARE, FULL]);
    expect(Object.keys(d.clients[0])).toEqual(["id", "name"]);
    expect(Object.keys(d.clients[1])).toEqual(["id", "name", "line", "year", "url"]);
  });

  it("publish round-trips both; a bare client's published_json is byte-equal to the pre-0003 shape", async () => {
    await insertBoth();
    const draft = await readSnapshot(db(), "draft");
    const r = await publish(db(), BY);
    const live = await readSnapshot(db(), "published");
    const { locks: _l, ...expected } = draft;
    expect(live).toEqual({ ...expected, rev: r.rev });
    expect(live.clients).toEqual([BARE, FULL]);
    // exactly what publish wrote before 0003 for a client with only names
    expect(await pubJson("c-bare")).toBe(JSON.stringify({ id: "c-bare", name: { ar: "عميل", en: "Bare client" } }));
    expect(await pubJson("c-full")).toBe(JSON.stringify(FULL));
    // and the revision holds the same objects
    const rev = await db().prepare("SELECT snapshot_json AS s FROM revisions WHERE id = ?").bind(r.rev).first<{ s: string }>();
    expect(JSON.parse(rev!.s).clients).toEqual([BARE, FULL]);
  });

  it("an old-shape published client is not rewritten by a later publish (no churn)", async () => {
    const old = JSON.stringify({ id: "c-old", name: { ar: "قديم", en: "Old" } });
    await run(
      "INSERT INTO clients (id, name_ar, name_en, published_json, updated_by) VALUES ('c-old', 'قديم', 'Old', ?, ?)",
      old,
      BY,
    );
    const before = await db().prepare("SELECT rev, updated_at FROM clients WHERE id = 'c-old'").first();
    await publish(db(), BY);
    expect(await pubJson("c-old")).toBe(old);
    expect(await db().prepare("SELECT rev, updated_at FROM clients WHERE id = 'c-old'").first()).toEqual(before);
  });

  it("a line in one language only gives line with that language; partial details stay partial", async () => {
    await run(
      "INSERT INTO clients (id, name_ar, name_en, line_en, url, updated_by) VALUES ('c-part', 'ع', 'Part', 'EN only', 'https://a.example/', ?)",
      BY,
    );
    const d = await readSnapshot(db(), "draft");
    expect(d.clients).toEqual([{ id: "c-part", name: { ar: "ع", en: "Part" }, line: { en: "EN only" }, url: "https://a.example/" }]);
  });

  it("clientFromRow: key order id, name, line, year, url; NULLs left out", () => {
    const row = { id: "x", name_ar: "ع", name_en: "X", line_ar: null, line_en: null, year: null, url: null };
    expect(JSON.stringify(clientFromRow(row))).toBe('{"id":"x","name":{"ar":"ع","en":"X"}}');
    expect(JSON.stringify(clientFromRow({ ...row, url: "https://u.example/", year: 1999, line_ar: "س" }))).toBe(
      '{"id":"x","name":{"ar":"ع","en":"X"},"line":{"ar":"س"},"year":1999,"url":"https://u.example/"}',
    );
  });
});
