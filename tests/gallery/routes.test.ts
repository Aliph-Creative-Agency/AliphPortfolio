// G-00a: harness + route skeleton.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, installAccess, post, uninstallAccess } from "./helpers";

beforeEach(installAccess);
afterEach(uninstallAccess);

describe("same-origin guard on gallery writes", () => {
  it("foreign Origin → 403", async () => {
    const r = await post("/api/admin/gallery/dev-publish", {}, { origin: "https://evil.example" });
    expect(r.status).toBe(403);
  });
  it("no Origin → 403", async () => {
    const r = await post("/api/admin/gallery/dev-publish", {}, { origin: null });
    expect(r.status).toBe(403);
  });
  it("same origin reaches the handler (dev-publish is 404 off localhost)", async () => {
    const r = await post("/api/admin/gallery/dev-publish", {});
    expect(r.status).toBe(404);
    expect(((await r.json()) as { error: string }).error).toBe("not found");
  });
});

describe("dev-publish", () => {
  it("404 on the real hostname even with the bypass flag set", async () => {
    const r = await post("/api/admin/gallery/dev-publish", {}, { env: { ADMIN_DEV_BYPASS: "1" } });
    expect(r.status).toBe(404);
  });
  it("publishes on localhost with the bypass", async () => {
    const r = await call("/api/admin/gallery/dev-publish", {
      method: "POST",
      base: "http://localhost:8851",
      env: { ADMIN_DEV_BYPASS: "1" },
    });
    expect(r.status).toBe(200);
    expect(typeof ((await r.json()) as { rev: number }).rev).toBe("number");
  });
});

describe("unknown admin api", () => {
  it("still 404", async () => {
    expect((await call("/api/admin/x")).status).toBe(404);
  });
});
