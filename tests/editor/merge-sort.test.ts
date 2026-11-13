// E-10 (CR-G2): `sort` rides the merged MEDIA row and renderLibrary's byNewest honours it.
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM, no types
import { mergeContent } from "../../worker/src/shared/merge.mjs";
import mainJs from "../../prototype/main.js?raw";

// byNewest lives inside renderLibrary; lift its source out of main.js so the test runs the real comparator.
const open = mainJs.indexOf("const byNewest = (a, b) => {");
const close = mainJs.indexOf("\n  };", open);
const byNewest = new Function(`${mainJs.slice(open, close + 5)}\n return byNewest;`)() as (a: any, b: any) => number;
const toRows = (M: any[]) => M.map((m) => ({ d: m.d, key: m.f, sort: m.sort, m }));

describe("library order by sort", () => {
  const tables = () => ({
    MEDIA: [
      { f: "a.jpg", c: "photo", r: 1, d: "2026-03-01" },
      { f: "b.jpg", c: "photo", r: 1, d: "2026-02-01" },
      { f: "c.jpg", c: "photo", r: 1, d: "2026-01-01" },
    ],
  });

  it("carries sort onto an overridden row and an appended upload", () => {
    const T = tables();
    mergeContent(T, {
      gallery: [
        { id: "b.jpg", sort: 0 },
        { id: "up-1", src: "https://media.aliphcreative.com/x.webp", cat: "photo", sort: 1 },
      ],
    });
    expect(T.MEDIA.find((m: any) => m.f === "b.jpg").sort).toBe(0);
    expect(T.MEDIA.find((m: any) => m.f === "up-1").sort).toBe(1);
    expect(T.MEDIA.find((m: any) => m.f === "a.jpg").sort).toBeUndefined();
  });

  it("sorts finite sorts first ascending, the rest by date", () => {
    const T = tables();
    mergeContent(T, { gallery: [{ id: "c.jpg", sort: 1 }, { id: "b.jpg", sort: 0 }] });
    const keys = toRows(T.MEDIA).sort(byNewest).map((r) => r.key);
    expect(keys).toEqual(["b.jpg", "c.jpg", "a.jpg"]);
  });

  it("with no sort anywhere the order is today's date order", () => {
    const keys = toRows(tables().MEDIA).sort(byNewest).map((r) => r.key);
    expect(keys).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });
});
