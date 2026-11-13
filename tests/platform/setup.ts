// Brings the test D1 up to the current schema before every test file.
// applyD1Migrations records what it ran in d1_migrations, so a second call on
// the same storage is a no-op.
import { applyD1Migrations, env } from "cloudflare:test";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// Under load (several suites at once, a loaded CI box) the Workers pool needs more
// than vitest's 5 s test / 10 s hook defaults: QA F-03 saw 137 test + 30 hook timeouts.
// Set here because worker/vitest.config.ts is not an owned path; setupFiles runs per file.
import { vi } from "vitest";
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
