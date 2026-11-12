// E-00: the editor route module and its Origin guard.
import { createExecutionContext, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";

const local = (extra: Partial<Env> = {}): Env => ({ ...env, ADMIN_DEV_BYPASS: "1", ...extra });
const call = (path: string, init: RequestInit = {}, e: Env = local()) =>
  worker.fetch(new Request("http://localhost" + path, init), e, createExecutionContext());
const put = (headers: Record<string, string>) =>
  call("/api/admin/text", { method: "PUT", headers: { "content-type": "application/json", ...headers }, body: "{}" });

describe("Origin guard", () => {
  it("foreign Origin on PUT /api/admin/text -> 403", async () => {
    expect((await put({ origin: "https://evil.example" })).status).toBe(403);
  });
  it("no Origin -> 403", async () => {
    expect((await put({})).status).toBe(403);
  });
  it("same origin reaches the handler (501 stub)", async () => {
    expect((await put({ origin: "http://localhost" })).status).toBe(501);
  });
  it("GET routes skip the check", async () => {
    expect((await call("/api/admin/whoami")).status).toBe(200);
  });
});

describe("access", () => {
  it("/admin/ without Access -> 403", async () => {
    const r = await call("/admin/", {}, { ...env, ADMIN_DEV_BYPASS: undefined } as Env);
    expect(r.status).toBe(403);
  });
});
