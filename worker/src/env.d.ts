// Tells `cloudflare:test`'s `env` the shape of the Worker's bindings, plus
// the test-only TEST_MIGRATIONS (worker/vitest.config.ts).
import type { D1Migration } from "cloudflare:test";
import type { Env as WorkerEnv } from "./index";

declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
