// UC-03 rewrite the About intro (long Arabic text with line breaks), publish, check phone + desktop (CASES.md).
// node tests/usecases/uc-03-about-intro.mjs [--only edge|webkit]
import { startDev, stopDev, resetState, configs, ORIGIN, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, rect, overlaps, checker } from "./lib/look.mjs";

const UC = "UC-03";
const LEAD = ".ab-lead";
const P3 = [
  "ألِف استوديو صغير في القدس، يعمل على الهويّة والصورة والكلمة.",
  "نبدأ كل مشروع بسؤال واحد: ما الذي تريد هذه العلامة أن تقوله؟ ثم نصغي طويلًا قبل أن نرسم أي خط.",
  "نؤمن أن التصميم الجيد لا يصرخ، بل يُقرأ بهدوء ويبقى في الذاكرة. لهذا نعمل ببطء، ونراجع كل حرف، ونختبر كل صورة على الهاتف قبل الشاشة الكبيرة.",
];
const P3V = P3.join("\n"), P3S = P3.join(" "); // P3S = the same text as one block (the form the site can actually save)
const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

async function look(page, c, cfg, scope, smallId) {
  const m = await lookA(page, { touch: cfg.touch, scope });
  c.ok(m.hScroll <= 0, `A1 page scrolls sideways by ${m.hScroll}px`);
  c.ok(!m.clipped.length, `A1 clipped: ${m.clipped.join(" | ")}`);
  if (cfg.touch) (smallId ? c.known.bind(null, smallId) : c.ok)(!m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
  return m;
}

/** The draft the server holds (GET /api/admin/content): any string containing marker / the longest all-alef string. */
const serverStrings = (page) => page.evaluate(async () => { const out = []; const w = (o) => { if (typeof o === "string") out.push(o); else if (o && typeof o === "object") Object.values(o).forEach(w); }; w(await (await fetch("/api/admin/content", { credentials: "same-origin" })).json()); return out; });
const serverHas = async (page, marker) => (await serverStrings(page)).some((x) => x.includes(marker));
const serverLen = async (page) => { const l = (await serverStrings(page)).filter((x) => /^ا{20}/.test(x)).map((x) => x.length); return l.length ? Math.max(...l) : null; };

/** How the lead shows line breaks: <br> count, white-space, and the number of rendered text lines. */
const measure = (page) => page.evaluate((sel) => {
  const e = document.querySelector(sel), cs = getComputedStyle(e);
  return { ws: cs.whiteSpace, br: e.querySelectorAll("br").length, p: e.querySelectorAll("p").length, nl: (e.textContent.match(/\n/g) || []).length,
    text: e.textContent, sw: e.scrollWidth, cw: e.clientWidth, lines: Math.round(e.getBoundingClientRect().height / parseFloat(cs.lineHeight)) };
}, LEAD);

async function run(cfg) {
  startRun(UC, cfg.name);
  const { browser, page } = await cfg.open();
  const S = (n, slug, expect, fn) => step(page, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const t = () => page.locator(LEAD).first();
  const openPop = async (c) => {
    await t().scrollIntoViewIfNeeded();
    await tapOrClick(page, t(), cfg);
    const shown = () => page.waitForSelector(".ed-pop:not([hidden])", { timeout: 5000 }).then(() => true, () => false);
    let open = await shown();
    if (cfg.touch) c.known("F-08", open, "tap on the paragraph does not open the text popover (F-08); falling back to click()");
    if (!open) { await t().click(); open = await shown(); }
    await page.waitForTimeout(400);
    return open;
  };
  const ta = () => page.locator('.ed-pop textarea[data-loc="ar"]');
  const saved = () => page.waitForFunction(() => document.querySelector(".ed-chip").textContent === "Saved", null, { timeout: 6000 }).catch(() => {});
  const typeP3 = async () => { // select all, then type the three paragraphs with Enter between them (not pasted)
    await ta().click(); await ta().fill("");
    for (let i = 0; i < P3.length; i++) { await page.keyboard.type(P3[i]); if (i < P3.length - 1) await page.keyboard.press("Enter"); }
  };
  let EN0 = null;
  try {
    await S(1, "editor-open", "bar, About current, chip Draft", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/about", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(2500);
      const d = await page.evaluate(() => ({ cur: document.querySelector('.ed-pages [aria-current="page"]')?.textContent, chip: document.querySelector(".ed-chip").textContent }));
      c.ok(d.cur === "About" && d.chip === "Draft", JSON.stringify(d));
      const bar = await rect(page, ".ed-bar"), head = await rect(page, ".ab-lead, h1");
      c.ok(!overlaps(bar, head), "A2 bar covers the top of the page");
      await look(page, c, cfg, ".ed-bar", "U-02");
    });

    await S(2, "open-lead", "popover with the AR text and counter n / 519; hint recorded", async (c) => {
      if (!(await openPop(c))) { c.ok(false, "popover never opened"); return; }
      const d = await page.evaluate(() => {
        const p = document.querySelector(".ed-pop"), a = p.querySelector('textarea[data-loc="ar"]'), r = p.getBoundingClientRect();
        return { v: a.value, count: [...p.querySelectorAll(".ed-count")].map((x) => x.textContent), hint: p.querySelector(".ed-hint")?.textContent, rows: a.rows, h: Math.round(a.getBoundingClientRect().height),
          lh: parseFloat(getComputedStyle(a).lineHeight) || 0, en: p.querySelector('textarea[data-loc="en"]')?.value, inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, head: p.innerText.split("\n").slice(0, 2).join(" | ") };
      });
      EN0 = d.en;
      c.note(JSON.stringify({ ...d, v: d.v.slice(0, 30) + "..." }));
      c.known("U-05", !/\babLead\b/.test(d.head), `popover heading shows the raw key: "${d.head}"`);
      c.ok(/ \/ 519$/.test(d.count[0] || ""), `counter ${d.count}`);
      c.ok(d.inside, "popover outside the viewport");
      c.ok(d.h >= 3 * (d.lh || 20), `AR textarea only ${d.h}px tall for a long paragraph`);
      c.known("U-13", /line break|Enter/i.test(d.hint || ""), `hint "${d.hint}" does not say whether Enter / line breaks are kept`);
      await look(page, c, cfg, ".ed-pop", "U-02");
    });

    await S(3, "type-P3", "Enter accepted, then: either saved with breaks shown, or a clear 'Not saved' message; never silent", async (c) => {
      await typeP3();
      await saved();
      const v = await ta().inputValue();
      c.ok(v === P3V, `textarea holds ${v.split("\n").length} lines, ${v.length} chars (expected 3 lines, ${P3V.length})`);
      const m = await measure(page);
      const chip = await page.locator(".ed-chip").textContent();
      const srv = await serverHas(page, "نبدأ كل مشروع");
      c.note(`chip "${chip}", server has the text: ${srv}, live lead: white-space ${m.ws}, br ${m.br}, ~${m.lines} lines, publish "${await page.locator(".ed-publish").textContent()}"`);
      c.ok(chip === "Saved" || /^Not saved/.test(chip), `chip "${chip}" says nothing clear about the save`);
      const shown = m.br >= 2 || /pre/.test(m.ws) || m.p >= 3;
      c.known("U-14", srv && shown, `the box takes Enter and the page previews the text (as one run-on block), but the save is refused: chip "${chip}", server has it: ${srv}; the hint never warned that this field has no line breaks`);
      const cr = await rect(page, ".ed-chip"), pr = await rect(page, ".ed-pop");
      const lr = await rect(page, LEAD);
      c.known("U-18", !(overlaps(pr, lr) && pr.y > lr.y + 40 && pr.y < lr.bottom - 40), `A2 the popover sits on top of the paragraph being edited (popover y ${Math.round(pr.y)}-${Math.round(pr.bottom)}, paragraph y ${Math.round(lr.y)}-${Math.round(lr.bottom)}): the lower lines of the text cannot be read while typing`);
      c.ok(!overlaps(cr, pr) && cr.y >= 0 && cr.bottom <= (await page.evaluate(() => innerHeight)), "A2 the chip with the error is hidden behind the popover or off screen");
      await look(page, c, cfg, ".ed-pop", "U-02");
    });

    await S(4, "done-unsaved", "Done on an unsaved edit: what does the boss see?", async (c) => {
      await tapOrClick(page, '.ed-pop button:has-text("Done")', cfg);
      await page.waitForTimeout(800);
      const chip = await page.locator(".ed-chip").textContent();
      const m = await measure(page);
      const srv = await serverHas(page, "نبدأ كل مشروع");
      c.note(`after Done: chip "${chip}", page shows typed text ${norm(m.text) === norm(P3V)}, server has it ${srv}, publish "${await page.locator(".ed-publish").textContent()}" disabled=${await page.locator(".ed-publish").isDisabled()}`);
      c.known("U-14", !(norm(m.text) === norm(P3V) && !srv && !/^Not saved/.test(chip)), `after Done the page shows the unsaved text and the chip says "${chip}"`);
    });

    await S(5, "reload-unsaved", "reload after a refused save: is the text shown, saved, publishable?", async (c) => {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(3500);
      const chip = await page.locator(".ed-chip").textContent();
      const m = await measure(page);
      const srv = await serverHas(page, "نبدأ كل مشروع");
      const pubDis = await page.locator(".ed-publish").isDisabled();
      c.note(`after reload: chip "${chip}", page shows typed text ${norm(m.text) === norm(P3V)}, server has it ${srv}, publish disabled=${pubDis}`);
      const lie = norm(m.text) === norm(P3V) && !srv;
      c.known("U-16", !lie || /^Not saved/.test(chip), `after a reload the page shows text that is NOT saved (restored from this browser's backup) and the chip says "${chip}"; Publish disabled=${pubDis}: the boss thinks it is done but it cannot be published`);
    });

    await S(6, "over-max", "typing past 519 warns visibly; the server never gets the overlong text", async (c) => {
      if (!(await openPop(c))) { c.ok(false, "popover never opened"); return; }
      const before = await page.evaluate(() => getComputedStyle(document.querySelector(".ed-pop .ed-count")).color);
      await ta().click(); await ta().fill("ا".repeat(519));
      await page.keyboard.type("اااااا");
      await page.waitForFunction(() => /^Not saved/.test(document.querySelector(".ed-chip").textContent), null, { timeout: 6000 }).catch(() => {});
      const pr = await rect(page, ".ed-pop");
      if (cfg.touch) c.known("U-17", pr && pr.y >= 0 && pr.bottom <= cfg.viewport.height, `phone: after a long unbroken text the edit popover is no longer on screen (popover ${pr ? [pr.y, pr.bottom].map(Math.round) : "gone"} in a ${cfg.viewport.height}px viewport); the boss cannot see the box he is typing in or Done`);
      const d = await page.evaluate(() => { const a = document.querySelector('.ed-pop textarea[data-loc="ar"]'), cn = document.querySelector(".ed-pop .ed-count"); return { len: a.value.length, count: cn.textContent, color: getComputedStyle(cn).color }; });
      const chip = await page.locator(".ed-chip").textContent();
      const srvLen = await serverLen(page);
      c.note(`${JSON.stringify(d)} (normal colour ${before}), chip "${chip}", server abLead length ${srvLen}`);
      c.ok(d.color !== before, "counter does not change colour past the max");
      c.ok(/^Not saved/.test(chip), `chip "${chip}" past the max`);
      c.ok(srvLen === null || srvLen <= 519, `the server holds ${srvLen} chars (over 519)`);
      await look(page, c, cfg, ".ed-pop", "U-02");
    });

    await S(7, "retype-one-block", "the boss drops the line breaks: the paragraph saves", async (c) => {
      await page.keyboard.press("Escape"); await page.waitForTimeout(400); // back to the text from before the over-long typing
      if (!(await openPop(c))) { c.ok(false, "popover never opened"); return; }
      await ta().click(); await ta().fill(P3S);
      await saved();
      const chip = await page.locator(".ed-chip").textContent();
      c.ok(chip === "Saved", `chip "${chip}"`);
      c.ok(await serverHas(page, "نبدأ كل مشروع"), "server does not have the retyped paragraph");
      await tapOrClick(page, '.ed-pop button:has-text("Done")', cfg);
      await page.waitForTimeout(500);
      c.ok(norm(await t().textContent()) === norm(P3S), "lead on the page is not the retyped text");
    });

    await S(8, "reload-draft", "reload: textarea value === the saved paragraph, Publish (1)", async (c) => {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(2500);
      c.ok((await page.locator(".ed-publish").textContent()) === "Publish (1)", "Publish count");
      if (!(await openPop(c))) { c.ok(false, "popover never opened"); return; }
      c.ok((await ta().inputValue()) === P3S, "textarea differs after reload");
      await tapOrClick(page, '.ed-pop button:has-text("Cancel")', cfg);
    });

    await S(9, "publish", "modal lists About text in words; toast with revision", async (c) => {
      await tapOrClick(page, ".ed-publish", cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 5000 });
      const items = await page.evaluate(() => [...document.querySelectorAll(".ed-scrim li")].map((l) => l.textContent));
      c.note(JSON.stringify(items.map((x) => x.slice(0, 50))));
      c.ok(items.length === 1 && /^About · /.test(items[0]) && !/abLead/.test(items[0]), `modal items ${items.map((x) => x.slice(0, 40))}`);
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 10000 }).catch(() => {});
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(await page.locator(".ed-toast").textContent().catch(() => "")), "toast missing");
    });
  } finally { await browser.close(); }

  const pub = await cfg.open();
  const pubStep = (n, slug, lang) => step(pub.page, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB(/about) ${lang}` }, async () => {
    const c = checker(`${cfg.name} ${n}`);
    const p = pub.page;
    await p.goto(ORIGIN + "/about", { waitUntil: "load" });
    await setLang(p, lang);
    await p.waitForTimeout(2500);
    await p.locator(LEAD).first().scrollIntoViewIfNeeded();
    await p.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: "center" }), LEAD);
    await p.waitForTimeout(1500);
    const m = await measure(p);
    const g = await p.evaluate((sel) => {
      const e = document.querySelector(sel), r = e.getBoundingClientRect();
      const near = [...document.querySelectorAll("main *, section *")].filter((x) => x !== e && !e.contains(x) && !x.contains(e) && x.children.length === 0 && x.textContent.trim()).map((x) => ({ n: x.className || x.tagName, r: x.getBoundingClientRect() })).filter((x) => x.r.width && x.r.left < r.right && r.left < x.r.right && x.r.top < r.bottom && r.top < x.r.bottom);
      return { hs: document.documentElement.scrollWidth - innerWidth, bar: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length, over: near.map((x) => x.n).slice(0, 4) };
    }, LEAD);
    c.note(`ws ${m.ws}, br ${m.br}, nl ${m.nl}, ~${m.lines} lines, scroll ${m.sw}/${m.cw}, overlaps ${g.over}`);
    if (lang === "ar") {
      c.ok(norm(m.text) === norm(P3S), `public AR lead "${norm(m.text).slice(0, 40)}..."`);
      c.ok(m.sw <= m.cw, `A1 lead scrollWidth ${m.sw} > clientWidth ${m.cw}`);
      c.ok(!g.over.length, `lead overlaps ${g.over}`);
    } else c.ok(norm(m.text) === norm(EN0), `public EN lead changed: "${norm(m.text).slice(0, 50)}"`);
    c.ok(g.hs <= 0 && g.bar === 0, `h-scroll ${g.hs}, admin artefacts ${g.bar}`);
    return c.pass;
  });
  try {
    await pubStep(10, "pub-ar", "ar");
    await pubStep(11, "pub-en", "en");
    await pubStep(12, "pub-ar-reload", "ar");
  } finally { await pub.browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) { // each config starts from the baseline (server stopped while the state is restored)
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-03 ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
