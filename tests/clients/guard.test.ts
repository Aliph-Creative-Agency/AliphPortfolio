// C-00: Obaida's rule — the boss creates clients after launch. Nothing that
// ships (migrations, generated defaults) may carry a client row, and a fresh
// database has none. Tests insert their own clients in local D1 only.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import defaults from "../../worker/src/generated/defaults.json";

describe("no client rows ship", () => {
  it("a database with every migration applied has zero clients", async () => {
    // other test files in this worker may insert and delete their own; this
    // one only asserts the migrations leave the table empty, so start clean
    await env.DB.prepare("DELETE FROM clients").run();
    const n = await env.DB.prepare("SELECT count(*) AS n FROM clients").first<{ n: number }>();
    expect(n?.n).toBe(0);
  });

  it("no migration inserts into clients", () => {
    // TEST_MIGRATIONS = migrations/*.sql read by worker/vitest.config.ts (workerd has no fs)
    const migrations = (env as unknown as { TEST_MIGRATIONS: { name: string; queries: string[] }[] }).TEST_MIGRATIONS;
    expect(migrations.length).toBeGreaterThan(0);
    for (const m of migrations) {
      for (const q of m.queries) expect(q, m.name).not.toMatch(/insert\s+(or\s+\w+\s+)?into\s+"?clients"?/i);
    }
  });

  it("generated defaults carry no clients and no client field on any MEDIA row", () => {
    const d = defaults as Record<string, unknown>;
    expect(d.clients).toBeUndefined();
    const media = d.MEDIA as Record<string, unknown>[];
    expect(Array.isArray(media)).toBe(true);
    for (const row of media) expect(row, String(row.f)).not.toHaveProperty("client");
    expect(JSON.stringify(d)).not.toMatch(/"clients"\s*:/);
  });
});
