// E-01: the edit-mode pages /admin/edit/, /admin/edit/about, /admin/edit/library.
import { createExecutionContext, env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import registry from "../../worker/src/generated/registry.json";
import worker, { type Env } from "../../worker/src/index";

const local = (extra: Partial<Env> = {}): Env => ({ ...env, ADMIN_DEV_BYPASS: "1", ...extra });
const call = (path: string, init: RequestInit = {}, e: Env = local()) =>
  worker.fetch(new Request("http://localhost" + path, init), e, createExecutionContext());
const run = (sql: string, ...args: unknown[]) => env.DB.prepare(sql).bind(...args).run();
const BLOB_OPEN = '<script type="application/json" id="aliph-content">';

const PAGES: [string, string][] = [
  ["/admin/edit/", "/"],
  ["/admin/edit/about", "/about"],
  ["/admin/edit/library", "/library"],
];

/** Every opening tag carrying `attr`, with its value. */
const tagsWith = (html: string, attr: string) =>
  [...html.matchAll(new RegExp(`<[a-zA-Z][^>]*\\s${attr}="([^"]*)"[^>]*>`, "g"))].map((m) => ({ tag: m[0], key: m[1] }));

beforeEach(async () => {
  await env.DB.batch(
    ["text_values", "slot_values", "gallery_items", "ring_picks", "clients"].map((t) => env.DB.prepare(`DELETE FROM ${t}`)),
  );
  await run("UPDATE meta SET v = '0' WHERE k = 'publish_rev'");
});

describe("edit pages", () => {
  for (const [edit] of PAGES) {
    it(`${edit}: every data-i18n / data-i18n-label element is tagged, hooks in place`, async () => {
      const r = await call(edit);
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toMatch(/^text\/html/);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(r.headers.get("x-robots-tag")).toBe("noindex");
      expect(r.headers.get("etag")).toBeNull();
      const html = await r.text();

      const text = tagsWith(html, "data-i18n");
      expect(text.length).toBeGreaterThan(0);
      for (const t of text) expect(t.tag, t.key).toContain(`data-ek="${t.key}"`);
      for (const t of tagsWith(html, "data-i18n-label")) expect(t.tag, t.key).toContain(`data-ek-label="${t.key}"`);

      expect(html).toMatch(/<html[^>]*\sdata-edit-mode="1"/);
      expect(html).toMatch(/<head[^>]*>\s*<base href="\/">/);
      expect(html).toMatch(
        /<link rel="stylesheet" href="\/admin\/editor.css">\s*<script src="\/admin\/editor-api.js" defer><\/script>\s*<script src="\/admin\/editor.js" defer><\/script>\s*<\/body>/,
      );
      expect(html.split(BLOB_OPEN).length - 1).toBe(1);
    });
  }

  it("a draft-only value shows on the edit page, not on the public page; the blob has no locks", async () => {
    await run("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('heroPara', 'ar', 'مسودة فقط', 'x')");
    await run("INSERT INTO text_values (key, locale, draft, updated_by) VALUES ('heroPara', 'en', 'Draft only', 'x')");
    const html = await (await call("/admin/edit/")).text();
    expect(html).toMatch(/<p data-i18n="heroPara" data-ek="heroPara">مسودة فقط<\/p>/);
    const blob = JSON.parse(html.split(BLOB_OPEN)[1].split("</script>")[0]);
    expect(blob.text.heroPara).toEqual({ ar: "مسودة فقط", en: "Draft only" });
    expect(blob).not.toHaveProperty("locks");

    const pub = await (await call("/")).text();
    expect(pub).not.toContain("مسودة فقط");
    expect(pub).not.toContain("Draft only");
  });

  it("the public pages carry no editor hooks", async () => {
    await run("INSERT INTO text_values (key, locale, draft, published, updated_by) VALUES ('heroPara', 'ar', 'نص', 'نص', 'x')");
    await run("UPDATE meta SET v = '1' WHERE k = 'publish_rev'");
    for (const [, pub] of PAGES) {
      const html = await (await call(pub)).text();
      expect(html, pub).not.toContain("data-ek");
      expect(html, pub).not.toContain("editor.js");
      expect(html, pub).not.toContain("data-edit-mode");
    }
  });

  it("without Access: 403", async () => {
    for (const [edit] of PAGES) {
      expect((await call(edit, {}, { ...env, ADMIN_DEV_BYPASS: undefined } as Env)).status).toBe(403);
    }
  });

  it("other /admin paths are not edit pages; non-GET is 405", async () => {
    expect((await call("/admin/edit/nope")).status).toBe(404);
    expect((await call("/admin/edit/", { method: "POST", headers: { origin: "http://localhost" } })).status).toBe(405);
  });
});

describe("media holders (E-15a)", () => {
  const slots = (registry.slots as { id: string; page: string; kind: string; src: string; preview?: string }[]).filter(
    (d) => d.kind === "media",
  );
  for (const [edit, pub, page] of [
    ["/admin/edit/", "/", "home"],
    ["/admin/edit/about", "/about", "about"],
  ] as const) {
    it(`${edit}: data-es ids = the registry's media slots in order, each img at its default src`, async () => {
      const html = await (await call(edit)).text();
      const want = slots.filter((d) => d.page === page);
      const got = [...html.matchAll(/<img\b[^>]*>/g)]
        .map((m) => m[0])
        .filter((t) => /\sdata-es="/.test(t))
        .map((t) => ({ id: /data-es="([^"]*)"/.exec(t)![1], src: /\ssrc="([^"]*)"/.exec(t)![1] }));
      expect(got.map((g) => g.id)).toEqual(want.map((d) => d.id));
      expect(got.map((g) => g.src)).toEqual(want.map((d) => d.src));
      const previews = [...html.matchAll(/<figure\b[^>]*data-es-preview="([^"]*)"/g)].map((m) => m[1]);
      expect(previews).toEqual(want.filter((d) => d.preview).map((d) => d.id));
      const pubHtml = await (await call(pub)).text();
      expect(pubHtml).not.toContain("data-es");
    });
  }

  it("a draft override still tags the right holder", async () => {
    await run(
      "INSERT INTO slot_values (slot, draft_json, updated_by) VALUES ('about.media.1', ?1, 'a@b.c')",
      JSON.stringify({ src: "https://media.aliphcreative.com/img/x.webp" }),
    );
    const html = await (await call("/admin/edit/about")).text();
    expect(html).toMatch(/<img\b[^>]*data-es="about\.media\.1"[^>]*>/);
    expect(html).toContain("https://media.aliphcreative.com/img/x.webp");
  });
});
