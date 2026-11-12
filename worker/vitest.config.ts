import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { evalTables } from "./src/shared/tables.mjs";

// Runs the tests inside workerd with the ROOT wrangler.toml's bindings
// (ASSETS, DB, MEDIA_BUCKET). Everything is local miniflare state.
// migrations/ is read here in Node and handed to the tests as the
// TEST_MIGRATIONS binding; tests/platform/setup.ts applies it to DB.
// TEST_TABLES = main.js tables evaluated here (workerd forbids new Function),
// as JSON, for the shared renderers under test.
const root = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: root + "wrangler.toml" },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(path.join(root, "migrations")),
          TEST_TABLES: evalTables(fs.readFileSync(path.join(root, "prototype", "main.js"), "utf8")),
        },
      },
    })),
  ],
  test: {
    root,
    include: ["tests/platform/**/*.test.ts"],
    setupFiles: ["tests/platform/setup.ts"],
  },
});
