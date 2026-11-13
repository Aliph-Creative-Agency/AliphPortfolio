// C-11..C-13: the public /library client features in headless Edge against
//   wrangler dev --local --port 8871 --inspector-port 9271 (ADMIN_DEV_BYPASS=1)
//   node tests/clients/public.mjs
// Makes its own client and uploads in the LOCAL dev store, PUBLISHES them, and in
// the finally removes them and publishes again, so the published store ends as it began.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done, publish } from "../gallery/browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8871";
const OUT = path.join(ROOT, "tests/clients/out");
fs.mkdirSync(OUT, { recursive: true });
const run = Date.now().toString(36);
const H = { origin: ORIGIN };

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const errors = [];
const api = ctx.request;
const clients = async () => (await (await api.get(ORIGIN + "/api/admin/clients")).json()).clients;
const items = async () => (await (await api.get(ORIGIN + "/api/admin/gallery")).json()).items;

/* A fresh page per look: language in localStorage, the library, tiles painted. */
async function look(lang, query = "", opts = {}) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.addInitScript((l) => { try { localStorage.setItem("aliph-lang", l); } catch {} }, lang);
  if (opts.route) await page.route("**/library" + (query || ""), opts.route);
  await page.goto(ORIGIN + "/library" + query);
  await page.waitForSelector(".acc-panel.open .tile, .acc-panel.open .lib-run", { state: "attached" });
  return page;
}
/* the tile a given upload paints (its picture's src carries the upload's id) */
const tileOf = (page, u) => page.locator(`.acc-panel.open .tile:has(img[src*="${u.id}"])`).first();
const captionOf = async (page, u) => {
  const t = tileOf(page, u);
  return (await t.count()) ? (await t.locator(".t-client").allTextContents()).join("|") : null;
};

const ups = [];
const made = [];
const clean = async () => {
  for (const u of ups) {
    try {
      const it = (await items()).find((i) => i.id === u.id);
      if (it) await api.delete(`${ORIGIN}/api/admin/gallery/${u.id}?baseRev=${it.rev}`, { headers: H });
    } catch {}
  }
  try {
    for (const c of await clients()) if (c.name.en.endsWith(run)) await api.delete(`${ORIGIN}/api/admin/clients/${c.id}?rev=${c.rev}`, { headers: H });
  } catch {}
  try { await publish(api, ORIGIN); } catch {}
  await browser.close();
};
try {
  const upload = async (n, extra = {}) => {
    const u = await (await api.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `pub-${run}-${n}.jpg` }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
    ups.push(u);
    const r = await api.put(`${ORIGIN}/api/admin/gallery/${u.id}`, { headers: H, data: { src: u.url, cat: "photo", ratio: 1.5, date: "2026-02", baseRev: 0, ...extra } });
    if (r.status() !== 200) throw new Error("item put " + r.status() + " " + (await r.text()));
    return u;
  };

  /* --- C-11 baseline: empty published store -> archive DOM --- */
  let p = await look("en");
  const empty = await p.locator(".acc").evaluate((e) => e.outerHTML);
  check("no client captions with no published clients", (await p.locator(".t-client").count()) === 0);
  await p.close();

  /* a published client with no pieces leaves the archive's DOM identical */
  const lone = (await (await api.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "وحيد", en: `Lone ${run}` } } })).json()).client;
  await publish(api, ORIGIN);
  p = await look("en");
  const withLone = await p.locator(".acc").evaluate((e) => e.outerHTML);
  check("archive DOM identical with a published client that has no pieces", withLone === empty, `${empty.length} vs ${withLone.length}`);
  await p.close();

  /* --- C-11 captions --- */
  const A = (await (await api.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: `ألفا ${run}`, en: `Alpha ${run}` } } })).json()).client;
  const withC = await upload("a", { client: A.id });
  const without = await upload("b");
  await publish(api, ORIGIN);

  p = await look("en");
  check("en caption shows the client name", (await captionOf(p, withC)) === `Alpha ${run}`, String(await captionOf(p, withC)));
  const bare = await tileOf(p, without).evaluate((e) => e.outerHTML);
  check("a piece with no client keeps today's markup (date-only figcaption)", !bare.includes("t-client") && /<figcaption><span class="t-date">/.test(bare));
  await p.addStyleTag({ content: ".curtain{display:none!important}" });
  await tileOf(p, withC).scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(OUT, "captions-en-1440.png") });
  await p.close();

  p = await look("ar");
  check("ar caption shows the Arabic name", (await captionOf(p, withC)) === `ألفا ${run}`, String(await captionOf(p, withC)));
  await p.close();

  /* language toggle swaps the name without a reload */
  p = await look("en");
  const toggle = p.locator(".js-lang:visible").first();
  if (await toggle.count()) {
    await toggle.click();
    await p.waitForFunction(() => document.documentElement.lang === "ar");
    check("lang toggle swaps the caption", (await captionOf(p, withC)) === `ألفا ${run}`, String(await captionOf(p, withC)));
  } else check("lang toggle present", false, "no toggle selector matched");
  await p.close();

  /* a piece naming a client the published snapshot does not know: no caption, today's markup */
  p = await look("en", "", {
    route: async (route) => {
      const res = await route.fetch();
      let body = await res.text();
      body = body.replace(/(<script[^>]*id="aliph-content"[^>]*>)([\s\S]*?)(<\/script>)/, (_m, a, json, z) => {
        const s = JSON.parse(json);
        s.clients = (s.clients || []).filter((c) => c.id !== A.id);
        return a + JSON.stringify(s) + z;
      });
      await route.fulfill({ response: res, body });
    },
  });
  const ghost = await tileOf(p, withC).evaluate((e) => e.outerHTML);
  check("unknown (draft-only/deleted) client id gives no caption, markup as today's", !ghost.includes("t-client") && /<figcaption><span class="t-date">/.test(ghost));
  await p.close();
  void lone; void made;
} finally {
  await clean();
}
check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
done();
