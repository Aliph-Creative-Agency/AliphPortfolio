// C-02: validateClient for the 0003 details. Table-driven: each row is an
// input on top of a valid client and either the stored result it must give
// or the 400 field it must name.
import { describe, expect, it } from "vitest";
import { MARKUP_ERROR, validateClient } from "../../worker/src/validate";

const NAME = { ar: "عميل", en: "Client" };
const base = (extra: Record<string, unknown>) => ({ id: "c1", name: NAME, ...extra });

type Ok = [label: string, extra: Record<string, unknown>, stored: Record<string, unknown>];
type Bad = [label: string, extra: Record<string, unknown>, field: string, error?: string];

const L120 = "a".repeat(120);

const OK: Ok[] = [
  ["nothing extra → {id, name}", {}, {}],
  ["all blank strings → absent", { line: { ar: "", en: "" }, year: "", url: "" }, {}],
  ["null everywhere → absent", { line: null, year: null, url: null }, {}],
  ["whitespace-only → absent", { line: { ar: "  ", en: " " }, year: " ", url: "  " }, {}],
  ["line both", { line: { ar: "سطر", en: "A line" } }, { line: { ar: "سطر", en: "A line" } }],
  ["line en only", { line: { en: "A line" } }, { line: { en: "A line" } }],
  ["line ar only, en blank", { line: { ar: "سطر", en: "" } }, { line: { ar: "سطر" } }],
  ["line 120 chars", { line: { en: L120 } }, { line: { en: L120 } }],
  ["line with & and '", { line: { en: "Tom & Jerry's" } }, { line: { en: "Tom & Jerry's" } }],
  ["line with “ ”", { line: { en: "the “best”" } }, { line: { en: "the “best”" } }],
  ["year number", { year: 2024 }, { year: 2024 }],
  ["year string → number", { year: "2024" }, { year: 2024 }],
  ["year padded string", { year: " 1999 " }, { year: 1999 }],
  ["year 1000", { year: 1000 }, { year: 1000 }],
  ["year 9999", { year: 9999 }, { year: 9999 }],
  ["url normalised (host case, trailing slash)", { url: "https://Example.COM" }, { url: "https://example.com/" }],
  ["url with path and query", { url: "https://a.example/x?y=1#z" }, { url: "https://a.example/x?y=1#z" }],
  ["url trimmed", { url: "  https://a.example/  " }, { url: "https://a.example/" }],
  ["url quotes get percent-encoded", { url: 'https://a.example/"x"<y>' }, { url: "https://a.example/%22x%22%3Cy%3E" }],
  ["unknown keys ignored", { rev: 3, state: "active" }, {}],
  [
    "everything, key order id/name/line/year/url",
    { url: "https://a.example/", year: "2001", line: { en: "L" } },
    { line: { en: "L" }, year: 2001, url: "https://a.example/" },
  ],
];

const BAD: Bad[] = [
  ["line not an object", { line: "a line" }, "line"],
  ["line an array", { line: ["a"] }, "line"],
  ["line value a number", { line: { en: 5 } }, "line.en"],
  ["line 121 chars", { line: { en: L120 + "b" } }, "line.en", "longer than 120 characters"],
  ["line newline", { line: { ar: "a\nb" } }, "line.ar"],
  ["line tab", { line: { en: "a\tb" } }, "line.en"],
  ["line control", { line: { en: "a\u0007b" } }, "line.en"],
  ["line <", { line: { en: "a<b" } }, "line.en", MARKUP_ERROR],
  ["line >", { line: { ar: "a>b" } }, "line.ar", MARKUP_ERROR],
  ['line "', { line: { en: 'say "hi"' } }, "line.en", MARKUP_ERROR],
  ["year 999", { year: 999 }, "year"],
  ["year 10000", { year: 10000 }, "year"],
  ["year 2024.5", { year: 2024.5 }, "year"],
  ["year '24'", { year: "24" }, "year"],
  ["year '2024a'", { year: "2024a" }, "year"],
  ["year '0999'", { year: "0999" }, "year"],
  ["year NaN", { year: Number.NaN }, "year"],
  ["year boolean", { year: true }, "year"],
  ["year object", { year: { y: 2024 } }, "year"],
  ["url http", { url: "http://a.example/" }, "url", "the address must start with https://"],
  ["url javascript", { url: "javascript:alert(1)" }, "url"],
  ["url data", { url: "data:text/html,x" }, "url"],
  ["url garbage", { url: "not a url" }, "url"],
  ["url no scheme", { url: "example.com" }, "url"],
  ["url protocol-relative", { url: "//example.com" }, "url"],
  ["url credentials", { url: "https://u:p@a.example/" }, "url"],
  ["url with a newline", { url: "https://a.ex\nample/" }, "url"],
  ["url a number", { url: 5 }, "url"],
  ["url too long", { url: "https://a.example/" + "x".repeat(2040) }, "url"],
];

describe("validateClient: line / year / url (C-02)", () => {
  for (const [label, extra, stored] of OK) {
    it(`ok: ${label}`, () => {
      const r = validateClient(base(extra));
      expect(r).toEqual({ ok: true, value: { id: "c1", name: NAME, ...stored } });
      if (r.ok) expect(Object.keys(r.value)).toEqual(["id", "name", ...["line", "year", "url"].filter((k) => k in stored)]);
    });
  }
  for (const [label, extra, field, error] of BAD) {
    it(`400: ${label} → ${field}`, () => {
      const r = validateClient(base(extra));
      expect(r).toMatchObject({ ok: false, field });
      if (error && !r.ok) expect(r.error).toBe(error);
    });
  }

  it("names keep their rules (required, ≤ 80, no markup)", () => {
    expect(validateClient({ id: "c1", name: { ar: "", en: "C" } })).toMatchObject({ ok: false, field: "name.ar" });
    expect(validateClient({ id: "c1", name: { ar: "ع", en: "x".repeat(81) } })).toMatchObject({ ok: false, field: "name.en" });
    expect(validateClient({ id: "c1", name: { ar: "ع", en: "a<b" } })).toMatchObject({ ok: false, field: "name.en" });
    expect(validateClient({ id: "bad id!", name: NAME })).toMatchObject({ ok: false, field: "id" });
    expect(validateClient([])).toMatchObject({ ok: false, field: "client" });
  });
});
