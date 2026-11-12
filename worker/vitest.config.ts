import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

// Runs the tests inside workerd with the ROOT wrangler.toml's bindings
// (ASSETS, later DB / MEDIA_BUCKET). Everything is local miniflare state.
const root = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: root + "wrangler.toml" } })],
  test: {
    root,
    include: ["tests/platform/**/*.test.ts"],
  },
});
