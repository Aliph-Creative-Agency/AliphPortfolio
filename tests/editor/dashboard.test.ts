// E-00b: the dashboard page at /admin/.
import { createExecutionContext, env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import worker, { type Env } from "../../worker/src/index";

const call = (e: Env) => worker.fetch(new Request("http://localhost/admin/"), e, createExecutionContext());

describe("GET /admin/", () => {
  it("with Access: 200 html with the four links", async () => {
    const r = await call({ ...env, ADMIN_DEV_BYPASS: "1" });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/html");
    const html = await r.text();
    for (const href of ["/admin/edit/", "/admin/edit/about", "/admin/edit/library", "/admin/gallery/"]) {
      expect(html, href).toContain(`href="${href}"`);
    }
  });
  it("says where Publish is (U-01)", async () => {
    const html = await (await call({ ...env, ADMIN_DEV_BYPASS: "1" })).text();
    const p = /<p[^>]*id="where-publish"[^>]*>([\s\S]*?)<\/p>/.exec(html);
    expect(p, "the where-publish sentence").not.toBeNull();
    expect(p![1]).toMatch(/<b>Publish<\/b>/);
    expect(p![1]).toMatch(/bar at the bottom of every edit page/);
    expect(p![1]).toMatch(/Gallery/);
  });
  it("without Access: 403", async () => {
    expect((await call({ ...env, ADMIN_DEV_BYPASS: undefined } as Env)).status).toBe(403);
  });
});
