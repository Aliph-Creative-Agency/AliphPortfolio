// Q-07 (QA): stored XSS through every admin-writable text field.
// Two classes of vector:
//  - REFUSED: anything carrying < > " , control characters, a line break in a
//    one-line field, or over the field's max length must be a 400 from
//    validate.ts before any write (P-10a: main.js has innerHTML and
//    double-quoted attribute sinks, so these never reach the store).
//  - ACCEPTED (no < > "): entities, fullwidth brackets, U+2028/2029, U+202E,
//    backticks, {{ }}, single-quote breakouts, scheme-looking text. These are
//    written to every field they fit, published, and the four public views
//    (/, /about, /library, /library?client=) are rendered by the real Worker.
//    Each view must be structurally identical to the same view published with
//    benign values (same element / <script> / on*= counts), carry no
//    javascript:/data:/vbscript: url, keep the JSON island parseable with the
//    vector inside it verbatim, and never emit the vector unescaped outside it.
// URL fields (slot src/poster/preview, gallery src, client url) get their own
// scheme table. Browser side: main.js's innerHTML sinks (renderLibrary fill,
// client header/index, lightbox, about services) each parse a value ONCE, so an
// entity decodes to text and `&quot;` stays inside its quoted attribute; no
// textContent -> innerHTML round trip exists (main.js:1712 rebuilds from text
// nodes). The visitor browser runs (Q-16/Q-17) publish one entity vector too.
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, installAccess, post, put, uninstallAccess } from "../gallery/helpers";
import registry from "../../worker/src/generated/registry.json";
import defaults from "../../worker/src/generated/defaults.json";

// ── fields under test ────────────────────────────────────────────────
type TextField = { key: string; locales: ("ar" | "en")[]; max: number };
const entry = (key: string): TextField => {
  const e = [...registry.text, ...registry.fields].find((x) => x.key === key) as
    | { key: string; maxLength: number; locales?: string[] }
    | undefined;
  if (!e) throw new Error("registry lost " + key);
  return { key, locales: (e.locales ?? ["ar", "en"]) as ("ar" | "en")[], max: e.maxLength };
};
// one per sink kind: element text, richline, aria-label, <title>, meta content,
// main.js innerHTML (SUBCATS name), @static region html (projects,
// testimonials), JSON-LD (projects, testimonials)
const TEXT_KEYS = [
  "abLead", "heroPara", "testiLabelNext", "meta.home.description", "meta.library.title", "meta.library.description",
  "subcat.design.posters.name", "subcat.tech.apps.desc", "project.1.body", "project.2.name", "project.2.tagline",
  "testimonial.0.name", "testimonial.0.business", "testimonial.0.quote",
].map(entry);
const SLOT = "home.media.1";
const MEDIA_ID = (defaults.MEDIA as { f: string }[])[0].f;
const ALT_MAX = 300, NAME_MAX = 80, LINE_MAX = 120;

// ── vectors ──────────────────────────────────────────────────────────
const ACCEPTED: [string, string][] = [
  ["hex entity img", "&#x3C;img src=x onerror=alert(1)&#x3E;"],
  ["named entity script", "&lt;script&gt;alert(1)&lt;/script&gt;"],
  ["entity quote breakout", "&quot; onfocus=alert(1) autofocus x=&quot;"],
  ["fullwidth brackets", "＜script＞alert(1)＜/script＞"],
  ["U+2028 / U+2029", "a b c"],
  ["RTL override U+202E", "‮gnp.exe"],
  ["backticks", "`${alert(1)}`"],
  ["template braces", "{{constructor.constructor('alert(1)')()}}"],
  ["single-quote breakout", "' onmouseover='alert(1)' x='"],
  ["scheme as text", "javascript:alert(1)"],
  ["ampersand plain", "Tom & Jerry"],
];
const REFUSED: [string, string][] = [
  ["script tag", "<script>alert(1)</script>"],
  ["attribute breakout", "\"><img src=x onerror=alert(1)>"],
  ["closes the JSON island", "</script><script>alert(1)</script>"],
  ["lone double quote", "a\"b"],
  ["comment open", "<!--"],
  ["NUL", "x\u0000y"],
  ["escape char", "x\u001by"],
];

// ── API helpers (all signed in, same-origin) ─────────────────────────
const revs = new Map<string, number>();
async function setText(key: string, locale: string, value: string) {
  const k = `${key}:${locale}`;
  const r = await put("/api/admin/text", { key, locale, value, baseRev: revs.get(k) ?? 0 });
  if (r.status === 200) revs.set(k, ((await r.json()) as { rev: number }).rev);
  return r;
}
async function setSlotAlt(ar: string, en: string) {
  const r = await put("/api/admin/slot", { slot: SLOT, value: { alt: { ar, en } }, baseRev: revs.get("slot") ?? 0 });
  if (r.status === 200) revs.set("slot", ((await r.json()) as { rev: number }).rev);
  return r;
}
async function setItem(fields: Record<string, unknown>) {
  const r = await put(`/api/admin/gallery/${MEDIA_ID}`, { ...fields, baseRev: revs.get("item") ?? 0 });
  if (r.status === 200) revs.set("item", ((await r.json()) as { item: { rev: number } }).item.rev);
  return r;
}
let clientId = "";
async function setClient(body: Record<string, unknown>) {
  if (!clientId) {
    const r = await post("/api/admin/clients", body);
    if (r.status === 201) {
      const c = ((await r.json()) as { client: { id: string; rev: number } }).client;
      clientId = c.id;
      revs.set("client", c.rev);
    }
    return r;
  }
  const r = await put(`/api/admin/clients/${clientId}`, { ...body, rev: revs.get("client") });
  if (r.status === 200) revs.set("client", ((await r.json()) as { client: { rev: number } }).client.rev);
  return r;
}
async function publish() {
  const c = await call("/api/admin/changes");
  const { token } = (await c.json()) as { token: string };
  const r = await post("/api/admin/publish", { token });
  expect(r.status, "publish").toBe(200);
}

/** Write `v` into every field (its own length permitting); returns how many took. */
async function writeEverywhere(v: string): Promise<number> {
  let n = 0;
  for (const f of TEXT_KEYS) {
    for (const l of f.locales) {
      const r = await setText(f.key, l, v);
      if (v.length <= f.max) expect(r.status, `${f.key}:${l}`).toBe(200);
      else expect(r.status, `${f.key}:${l} over max`).toBe(400);
      if (r.status === 200) n++;
    }
  }
  if (v.length <= ALT_MAX) {
    expect((await setSlotAlt(v, v)).status, "slot alt").toBe(200);
    n++;
  }
  // client first, so the gallery item can point at it (the ?client= view)
  const name = v.slice(0, NAME_MAX);
  const r = await setClient({ name: { ar: name, en: name }, line: { ar: v.slice(0, LINE_MAX), en: v.slice(0, LINE_MAX) }, year: 2024 });
  expect(r.status, "client").toBeLessThan(300);
  n++;
  expect((await setItem({ alt: { ar: v, en: v }, client: clientId })).status, "gallery item").toBe(200);
  return n + 1;
}

// ── rendering + structural checks ────────────────────────────────────
const ISLAND = /<script type="application\/json" id="aliph-content">([\s\S]*?)<\/script>/;
const views = () => ["/", "/about", "/library", `/library?client=${encodeURIComponent(clientId)}`];

type Shape = { tags: number; attrs: number; scripts: number; onAttrs: number; badUrls: string[]; amp2: number; ld: number };
/* one start tag's attributes, the way an HTML tokenizer splits them (values
   quoted with " or ', or bare): text inside a quoted value is not an attribute */
const ATTR = /\s([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const URL_ATTRS = new Set(["href", "src", "action", "formaction", "poster", "srcset", "data-film", "data-preview", "xlink:href"]);
const SCRIPT_BODY = /(<script\b[^>]*>)([\s\S]*?)<\/script>/gi;
/** Markup with every <script> body emptied: script text is raw (JSON-LD and
 *  the island legitimately carry the value unescaped), checked separately. */
const markupOf = (html: string) => html.replace(SCRIPT_BODY, "$1</script>");
function shapeOf(html: string): Shape {
  const outside = markupOf(html);
  const tags = outside.match(/<[a-zA-Z][^\s/>]*(?:\s(?:"[^"]*"|'[^']*'|[^'">])*)?\/?>/g) ?? [];
  const attrs = tags.flatMap((t) =>
    [...t.replace(/^<[^\s/>]+/, "").matchAll(ATTR)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? ""]),
  );
  // every JSON script body must still parse (no breakout of the JSON string)
  let ld = 0;
  for (const m of html.matchAll(SCRIPT_BODY)) {
    if (/type="application\/(ld\+)?json"/.test(m[1])) {
      JSON.parse(m[2]);
      ld++;
    }
  }
  return {
    tags: tags.length,
    attrs: attrs.length,
    scripts: (html.match(/<script\b/gi) ?? []).length,
    onAttrs: attrs.filter(([n]) => n.startsWith("on")).length,
    badUrls: attrs
      .filter(([n]) => URL_ATTRS.has(n))
      .map(([, v]) => v)
      .filter((u) => /^(?:javascript|data|vbscript):/i.test(u.replace(/[\s\u0000-\u001f]/g, ""))),
    amp2: (outside.match(/&amp;amp;/g) ?? []).length,
    ld,
  };
}
async function render(path: string): Promise<string> {
  const r = await call(path, { origin: null });
  expect(r.status, path).toBe(200);
  return r.text();
}
function deepHas(o: unknown, v: string): boolean {
  if (typeof o === "string") return o === v || o.includes(v);
  if (o && typeof o === "object") return Object.values(o).some((x) => deepHas(x, v));
  return false;
}

beforeEach(async () => {
  await installAccess();
  // installAccess resets publish_rev to 0 but revisions are append-only
  // (trigger): continue numbering after the last one so publish can insert.
  await env.DB.prepare("UPDATE meta SET v = (SELECT CAST(COALESCE(MAX(id), 0) AS TEXT) FROM revisions) WHERE k = 'publish_rev'").run();
  revs.clear();
  clientId = "";
});
afterEach(uninstallAccess);

describe("Q-07 refused at the API (400, store unchanged)", () => {
  for (const [name, v] of REFUSED) {
    it(name, async () => {
      const before = await env.DB.prepare("SELECT COALESCE(MAX(id),0) AS n FROM audit").first<{ n: number }>();
      for (const f of TEXT_KEYS) for (const l of f.locales) expect((await setText(f.key, l, v)).status, `${f.key}:${l}`).toBe(400);
      expect((await setSlotAlt(v, "ok")).status, "slot alt ar").toBe(400);
      expect((await setSlotAlt("ok", v)).status, "slot alt en").toBe(400);
      expect((await setItem({ alt: { ar: v } })).status, "gallery alt").toBe(400);
      expect((await setClient({ name: { ar: v, en: "ok" } })).status, "client name.ar").toBe(400);
      expect((await setClient({ name: { ar: "ok", en: v } })).status, "client name.en").toBe(400);
      expect((await setClient({ name: { ar: "ok", en: "ok" }, line: { ar: v } })).status, "client line.ar").toBe(400);
      const after = await env.DB.prepare("SELECT COALESCE(MAX(id),0) AS n FROM audit").first<{ n: number }>();
      expect(after?.n, "no audit row = no write").toBe(before?.n);
      expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM text_values").first<{ n: number }>())?.n).toBe(0);
    });
  }

  it("line break in a one-line field refused; in the richline accepted", async () => {
    expect((await setText("abLead", "en", "a\nb")).status).toBe(400);
    expect((await setClient({ name: { ar: "a\nb", en: "x" } })).status).toBe(400);
    expect((await setText("heroPara", "en", "a\nb")).status).toBe(200);
  });

  it("one over the max length refused, at the max accepted (long strings)", async () => {
    for (const f of TEXT_KEYS) {
      expect((await setText(f.key, f.locales[0], "ا".repeat(f.max + 1))).status, f.key).toBe(400);
    }
    expect((await setText("project.1.body", "en", "x".repeat(entry("project.1.body").max))).status).toBe(200);
    expect((await setSlotAlt("x".repeat(ALT_MAX + 1), "")).status).toBe(400);
    expect((await setClient({ name: { ar: "x".repeat(NAME_MAX + 1), en: "x" } })).status).toBe(400);
    expect((await setClient({ name: { ar: "x", en: "x" }, line: { en: "x".repeat(LINE_MAX + 1) } })).status).toBe(400);
    expect((await setText("abLead", "en", "x".repeat(100_000))).status).toBe(400);
  });
});

describe("Q-07 url fields: scheme allow-list", () => {
  const BAD_MEDIA = [
    "javascript:alert(1)//x.webp", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "java\tscript:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1)>", "data:text/html;base64,PHNjcmlwdD4=", "vbscript:msgbox(1)",
    "//evil.example/x.webp", "https://evil.example/x.webp", "https://media.aliphcreative.com.evil.example/x.webp",
    "https://media.aliphcreative.com@evil.example/x.webp", "https://media.aliphcreative.com/../x.webp",
    "https://media.aliphcreative.com/x.webp?y=1", "https://media.aliphcreative.com/x.webp#\"onerror", "https://media.aliphcreative.com\\x.webp",
    "http://media.aliphcreative.com/x.webp", "assets/media/../../admin/x.webp", "assets/media/x.svg", "/assets/media/x.webp",
  ];
  it("slot src / poster / preview refuse every bad url", async () => {
    for (const u of BAD_MEDIA) {
      expect((await put("/api/admin/slot", { slot: SLOT, value: { src: u }, baseRev: 0 })).status, `src ${u}`).toBe(400);
      expect((await put("/api/admin/slot", { slot: "home.media.2", value: { poster: u }, baseRev: 0 })).status, `poster ${u}`).toBe(400);
      expect((await put("/api/admin/slot", { slot: "home.media.2", value: { preview: u.replace(/\.webp/, ".mp4") }, baseRev: 0 })).status, `preview ${u}`).toBe(400);
    }
  });
  it("gallery upload src refuses every bad url", async () => {
    for (const u of BAD_MEDIA) {
      const r = await put("/api/admin/gallery/qa-up-1", { src: u, cat: "design", baseRev: 0 });
      expect(r.status, u).toBe(400);
    }
  });
  it("client url: https only, no credentials, < > \" percent-encoded", async () => {
    for (const u of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", "  javascript:alert(1)", "java\nscript:alert(1)",
      "data:text/html,<script>alert(1)</script>", "vbscript:x", "http://evil.example", "//evil.example", "ftp://x",
      "https://user:pw@evil.example", "https:evil", "https://" + "a".repeat(2100) + ".com"]) {
      const r = await post("/api/admin/clients", { name: { ar: "ع", en: "c" }, url: u });
      // "https:evil" parses to https://evil/ — allowed by the URL parser; anything accepted must be https
      if (r.status === 201) {
        const c = ((await r.json()) as { client: { url?: string } }).client;
        expect(c.url ?? "", u).toMatch(/^https:\/\/[^@]*$/);
      } else expect(r.status, u).toBe(400);
    }
    const r = await post("/api/admin/clients", { name: { ar: "ع", en: "c" }, url: "https://x.example/a\"b<c>d" });
    expect(r.status).toBe(201);
    expect(((await r.json()) as { client: { url: string } }).client.url).toBe("https://x.example/a%22b%3Cc%3Ed");
  });
});

describe("Q-07 accepted vectors render inert on every public view", () => {
  for (const [name, v] of ACCEPTED) {
    it(name, async () => {
      // baseline: same fields, benign values of the same length class
      await writeEverywhere("QA benign");
      await publish();
      const base = new Map<string, Shape>();
      for (const p of views()) base.set(p, shapeOf(await render(p)));

      const n = await writeEverywhere(v);
      expect(n).toBeGreaterThan(10);
      await publish();
      let shown = 0;
      for (const p of views()) {
        const html = await render(p);
        // the value really is rendered into markup, in its escaped text form
        if (markupOf(html).includes(v.replace(/&/g, "&amp;").replace(/'/g, "'"))) shown++;
        const s = shapeOf(html);
        const b = base.get(p)!;
        // library.html ships two inline data:image/svg+xml placeholders; nothing beyond those
        expect(s.badUrls, `${p}: javascript/data/vbscript url`).toEqual(b.badUrls);
        expect(s.badUrls.every((u) => u.startsWith("data:image/svg+xml,")), p).toBe(true);
        expect(s.scripts, `${p}: <script> count`).toBe(b.scripts);
        expect(s.onAttrs, `${p}: on*= attributes`).toBe(b.onAttrs);
        expect(s.tags, `${p}: element count (no new element)`).toBe(b.tags);
        expect(s.attrs, `${p}: attribute count (no new attribute)`).toBe(b.attrs);
        expect(s.ld, `${p}: JSON script blocks`).toBe(b.ld);
        expect(s.attrs, `${p}: attribute count (no new attribute)`).toBe(b.attrs);
        expect(s.amp2, `${p}: double-escaped &amp;amp;`).toBe(b.amp2);
        // the boot-merge island survives and carries the value verbatim
        const m = ISLAND.exec(html);
        expect(m, `${p}: island`).not.toBeNull();
        const blob = JSON.parse(m![1]);
        expect(deepHas(blob, v), `${p}: vector in the island`).toBe(true);
        // in markup (script bodies aside) an & is always escaped: the raw vector never appears
        if (/[&]/.test(v)) expect(markupOf(html).includes(v), `${p}: raw vector outside the island`).toBe(false);
      }
      expect(shown, "rendered into markup on at least one view").toBeGreaterThan(0);
    });
  }
});
