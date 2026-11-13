// G-00a: harness + route skeleton.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, installAccess, post, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

// Any non-GET gallery path is guarded before routing; clean-up with an empty
// key list is the cheapest one that answers 400 once past the guard.
const GUARDED = "/api/admin/upload/cleanup";

describe("same-origin guard on gallery writes", () => {
  it("foreign Origin → 403", async () => {
    const r = await post(GUARDED, { keys: [] }, { origin: "https://evil.example" });
    expect(r.status).toBe(403);
  });
  it("no Origin → 403", async () => {
    const r = await post(GUARDED, { keys: [] }, { origin: null });
    expect(r.status).toBe(403);
  });
  it("same origin reaches the handler (empty key list → its 400)", async () => {
    const r = await post(GUARDED, { keys: [] });
    expect(r.status).toBe(400);
    expect(((await r.json()) as { field: string }).field).toBe("keys");
  });
});

describe("unknown admin api", () => {
  it("still 404", async () => {
    expect((await call("/api/admin/x")).status).toBe(404);
  });
});
