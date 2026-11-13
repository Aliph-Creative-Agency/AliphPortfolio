// The gallery team's shim (CR-G1): the root vitest include only sees
// tests/platform. This merges worker/vitest.config.ts (same bindings, same
// setup file) and adds tests/gallery, so one run covers both.
//   npx vitest run -c tests/gallery/vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../worker/vitest.config";

export default mergeConfig(
  base,
  defineConfig({
    test: { include: ["tests/gallery/**/*.test.ts"] },
  }),
);
