// Brings the test D1 up to the current schema before every test file.
// applyD1Migrations records what it ran in d1_migrations, so a second call on
// the same storage is a no-op.
import { applyD1Migrations, env } from "cloudflare:test";

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
