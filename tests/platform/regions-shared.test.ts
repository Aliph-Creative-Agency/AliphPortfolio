// P-04a: the @static:* renderers shared with resources/build_static.mjs run in
// workerd (no Node APIs) and, fed the main.js tables as JSON, reproduce the
// bytes build_static wrote between the markers of the served pages.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { fill, pageRegions, servicesBlock, STAMP } from "../../worker/src/shared/regions.mjs";

const page = async (file: string) => (await env.ASSETS.fetch(`http://example.com/${file}`)).text();

function between(html: string, name: string): string {
  const open = `<!-- @static:${name} -->`;
  const a = html.indexOf(open);
  const b = html.indexOf(`<!-- @/static:${name} -->`);
  expect(a, name).toBeGreaterThanOrEqual(0);
  expect(b, name).toBeGreaterThan(a);
  return html.slice(a + open.length, b);
}

describe("shared region renderers in workerd", () => {
  it("services renders the exact bytes between its markers in index.html", async () => {
    const html = await page("index.html");
    expect(between(html, "services")).toBe(`\n${STAMP}${servicesBlock(env.TEST_TABLES)}\n`);
  });

  it("every region of index.html and library.html re-renders to the served page", async () => {
    const regions = pageRegions(env.TEST_TABLES);
    expect(Object.keys(regions).sort()).toEqual(["index.html", "library.html"]);
    for (const [file, map] of Object.entries(regions)) {
      const html = await page(file);
      let after = html;
      for (const [name, body] of Object.entries(map)) after = fill(after, name, body, file);
      expect(after === html, file).toBe(true);
    }
  });

  it("a changed table changes the region (the renderer really reads T)", async () => {
    const T = structuredClone(env.TEST_TABLES);
    T.SUBCATS.design[0].ar = "سطر تجريبي";
    expect(servicesBlock(T)).toContain("سطر تجريبي");
    expect(servicesBlock(T)).not.toBe(servicesBlock(env.TEST_TABLES));
  });
});
