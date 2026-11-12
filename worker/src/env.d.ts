// Tells `cloudflare:test`'s `env` the shape of the Worker's bindings, plus
// the test-only TEST_MIGRATIONS / TEST_TABLES (worker/vitest.config.ts).
import type { D1Migration } from "cloudflare:test";
import type { Env as WorkerEnv } from "./index";

declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {
      TEST_MIGRATIONS: D1Migration[];
      TEST_TABLES: Record<string, any>;
      TEST_GENERATED: { defaults: Record<string, any>; registry: Record<string, any> };
    }
  }
}
