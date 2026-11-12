// Tells `cloudflare:test`'s `env` the shape of the Worker's bindings.
import type { Env as WorkerEnv } from "./index";

declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}
