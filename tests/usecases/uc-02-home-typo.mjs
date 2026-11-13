// UC-02 fix an Arabic heading typo on Home, publish, check AR + EN on the public page (CASES.md).
// node tests/usecases/uc-02-home-typo.mjs [--only edge|webkit]
import { startDev, stopDev, resetState, configs, ORIGIN, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, rect, overlaps, checker } from "./lib/look.mjs";

const UC = "UC-02";
const HERO1 = '.hero-title [data-i18n="hero1"]';
const FIXED = "نبدأ من حيثُ";

async function look(page, c, cfg, scope, smallId) {
  const m = await lookA(page, { touch: cfg.touch, scope });
  c.ok(m.hScroll <= 0, `A1 page scrolls sideways by ${m.hScroll}px`);
  c.ok(!m.clipped.length, `A1 clipped: ${m.clipped.join(" | ")}`);
  if (cfg.touch) (smallId ? c.known.bind(null, smallId) : c.ok)(!m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
  return m;
}

async function run(cfg) {
  startRun(UC, cfg.name);
  const { browser, page } = await cfg.open();
  const S = (n, slug, expect, fn) => step(page, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const t = () => page.locator(HERO1).first();
  const openPop = async (c) => {
    await tapOrClick(page, t(), cfg);
    const shown = () => page.waitForSelector(".ed-pop:not([hidden])", { timeout: 5000 }).then(() => true, () => false);
    let open = await shown();
    if (cfg.touch) c.known("F-08", open, "tap on the heading does not open the text popover (F-08); falling back to click()");
    if (!open) { await t().click(); open = await shown(); }
    await page.waitForTimeout(400);
    return open;
  };
  const state = () => page.evaluate((s) => ({
    ar: document.querySelector(s)?.textContent, chip: document.querySelector(".ed-chip")?.textContent,
    pub: document.querySelector(".ed-publish")?.textContent, pubDis: document.querySelector(".ed-publish")?.disabled,
    disDis: document.querySelector(".ed-discard")?.disabled,
    fit: (() => { const h = document.querySelector(".hero-title"); return h.scrollWidth - h.clientWidth; })(),
  }), HERO1);
  let EN0 = null, AR0 = null, FIT0 = 0; // FIT0 = the hero title's own scrollWidth-clientWidth before the edit (ransom letters stick out a few px on the reset site)
  try {
    await S(1, "editor-open", "bar loaded, chip Draft, Publish disabled, dir=rtl", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(2500);
      const d = await page.evaluate(() => ({ dir: document.documentElement.dir, bar: document.querySelector(".ed-bar").innerText.replace(/\s+/g, " ") }));
      c.note(JSON.stringify(d));
      const s = await state();
      c.ok(s.chip === "Draft" && s.pubDis, `chip ${s.chip}, publish disabled ${s.pubDis}`);
      c.ok(d.dir === "rtl", `dir ${d.dir}`);
      FIT0 = s.fit; c.note(`baseline hero-title overflow ${FIT0}px`);
      await look(page, c, cfg, ".ed-bar", "U-02");
    });

    await S(2, "record-values", "AR = default, EN recorded", async (c) => {
      if (!(await openPop(c))) { c.ok(false, "popover never opened"); return; }
      const v = await page.evaluate(() => [...document.querySelectorAll(".ed-pop textarea")].map((a) => [a.dataset.loc, a.value]));
      AR0 = v.find((x) => x[0] === "ar")?.[1]; EN0 = v.find((x) => x[0] === "en")?.[1];
      c.note(`AR0="${AR0}" EN0="${EN0}"`);
      c.ok(AR0 === "نبدأ من حيث", `AR0 is "${AR0}"`);
      c.ok(!!EN0, "EN0 empty");
      await page.locator(".ed-pop button", { hasText: "Cancel" }).first().click();
    });

    await S(3, "popover", "popover with AR (rtl) + EN, counter, inside viewport, not covering line 1", async (c) => {
      if (!(await openPop(c))) { c.ok(false, "popover never opened"); return; }
      const d = await page.evaluate(() => {
        const p = document.querySelector(".ed-pop"), r = p.getBoundingClientRect();
        return { areas: [...p.querySelectorAll("textarea")].map((a) => ({ loc: a.dataset.loc, dir: a.dir, v: a.value })), count: [...p.querySelectorAll(".ed-count")].map((x) => x.textContent),
          head: p.innerText.split("\n").slice(0, 2).join(" | "), inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, r: [r.left, r.top, r.right, r.bottom].map(Math.round) };
      });
      c.note(JSON.stringify(d));
      c.known("U-05", !/\bhero1\b/.test(d.head), `popover heading shows the raw key: "${d.head}"`);
      c.ok(d.areas[0].dir === "rtl" && d.areas[0].v === AR0 && d.areas[1].v === EN0, "textarea values/dir");
      c.ok(d.inside, `popover outside viewport ${d.r}`);
      c.ok(!overlaps(await rect(page, ".ed-pop"), await rect(page, HERO1)), "A2 popover covers the line being edited");
      await look(page, c, cfg, ".ed-pop", "U-02");
    });

    await S(4, "type-fix", "heading updates live; Saving -> Saved; Publish (1); damma drawn; heading fits", async (c) => {
      const ta = page.locator('.ed-pop textarea[data-loc="ar"]');
      await ta.click(); await ta.fill(FIXED);
      await page.waitForTimeout(300);
      c.ok((await t().textContent()) === FIXED, `live heading is "${await t().textContent()}"`);
      await page.waitForFunction(() => document.querySelector(".ed-chip").textContent === "Saved", null, { timeout: 6000 }).catch(() => {});
      const t0 = Date.now();
      await page.waitForFunction(() => document.querySelector(".ed-publish").textContent === "Publish (1)", null, { timeout: 8000 }).catch(() => {});
      c.note(`Publish (1) appeared ${Date.now() - t0} ms after the chip said Saved`);
      const s = await state();
      c.note(JSON.stringify(s));
      c.ok(s.chip === "Saved", `chip "${s.chip}" 6 s after typing`);
      c.ok(s.pub === "Publish (1)" && !s.pubDis, `publish button "${s.pub}" disabled=${s.pubDis}`);
      c.ok(!s.disDis, "Discard still disabled");
      const bh = (await rect(page, ".ed-bar")).h;
      c.note(`bar height ${Math.round(bh)}px`);
      if (cfg.touch) c.known("U-12", bh <= 90, `bar wraps to ${Math.round(bh)}px (3 rows) once the chip says Saved and Publish reads Publish (1); it was 2 rows at the start`);
      c.ok(s.fit <= FIT0 + 2, `A1 hero-title overflows by ${s.fit}px (baseline ${FIT0})`);
      const m = await lookA(page, { touch: cfg.touch, scope: ".hero-title" }); // clipped list minus the 1px screen-reader copies
      c.ok(m.hScroll <= 0 && !m.clipped.filter((x) => !/ransom-sr/.test(x)).length, `A1 ${m.clipped}`);
    });

    await S(5, "done", "popover closes, heading keeps the new text", async (c) => {
      await tapOrClick(page, '.ed-pop button:has-text("Done")', cfg);
      await page.waitForTimeout(500);
      c.ok(await page.locator(".ed-pop[hidden]").count() === 1, "popover still open");
      c.ok((await t().textContent()) === FIXED, "heading lost the fix");
    });

    await S(6, "reload-draft", "reload: draft heading kept, Publish (1)", async (c) => {
      await page.reload({ waitUntil: "load" });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(2500);
      const s = await state();
      c.ok(s.ar === FIXED, `after reload heading "${s.ar}"`);
      c.ok(s.pub === "Publish (1)", `publish button "${s.pub}"`);
    });

    await S(7, "publish-modal", "modal lists the change in words, Cancel/Publish, fits the screen", async (c) => {
      const t0 = Date.now();
      await tapOrClick(page, ".ed-publish", cfg);
      const shownModal = await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }).then(() => true, () => false);
      const delay = Date.now() - t0;
      c.note(`click -> publish modal ${shownModal ? delay + " ms" : "never (15 s)"}`);
      c.ok(shownModal, "publish modal missing 15 s after the click");
      if (!shownModal) return;
      c.known("U-19", delay <= 2000, `Publish gave no feedback for ${delay} ms before the modal opened`);
      await page.waitForTimeout(400);
      const d = await page.evaluate(() => {
        const dl = document.querySelector(".ed-scrim .ed-dialog"), r = dl.getBoundingClientRect();
        return { title: dl.querySelector(".ed-dialog-title")?.textContent, items: [...dl.querySelectorAll("li")].map((l) => l.textContent), btns: [...dl.querySelectorAll("button")].map((b) => b.textContent + " " + Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)),
          inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, text: dl.innerText.replace(/\s+/g, " ") };
      });
      c.note(JSON.stringify(d));
      c.ok(/^Publish 1 change to the live site\?$/.test(d.title), `title "${d.title}"`);
      c.ok(d.items.length === 1, `${d.items.length} items listed`);
      c.ok(!/\bhero1\b/.test(d.text), `modal shows the raw key: "${d.items.join(" | ")}"`);
      c.ok(d.inside, "modal outside viewport");
      if (cfg.touch) c.known("U-02", d.btns.every((b) => parseInt(b.split("x").at(-1)) >= 44), `modal buttons ${d.btns}`);
    });

    await S(8, "publish", "toast with revision; Publish back to disabled; chip not stuck", async (c) => {
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 10000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => null);
      c.note(`toast "${toast}"`);
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(toast || ""), `toast "${toast}"`);
      const t0 = Date.now();
      await page.waitForFunction(() => document.querySelector(".ed-publish").textContent === "Publish", null, { timeout: 6000 }).catch(() => {});
      c.note(`Publish button reset ${Date.now() - t0} ms after the toast`);
      const s = await state();
      c.ok(s.pub === "Publish" && s.pubDis, `publish "${s.pub}" disabled=${s.pubDis}`);
      c.ok(s.chip !== "Saving…", `chip "${s.chip}"`);
      const tb = await rect(page, ".ed-toast"), bar = await rect(page, ".ed-bar");
      const dir = await page.evaluate(() => getComputedStyle(document.querySelector(".ed-toast")).direction);
      c.known("U-10", dir !== "rtl", `English toast is laid out dir=${dir} on the Arabic page: its full stop lands at the wrong end (".Published ... revision 1")`);
      (cfg.touch ? c.known.bind(null, "U-11") : c.ok)(!overlaps(tb, bar), `A2 toast overlaps the bar (toast y ${tb && [tb.y, tb.bottom].map(Math.round)}, bar top ${bar && Math.round(bar.y)})`);
    });
  } finally { await browser.close(); }

  const pub = await cfg.open();
  const pubStep = (n, slug, lang) => step(pub.page, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB(/) ${lang}` }, async () => {
    const c = checker(`${cfg.name} ${n}`);
    await pub.page.goto(ORIGIN + "/", { waitUntil: "load" });
    await setLang(pub.page, lang);
    await pub.page.waitForTimeout(3000); // the hero letter drops in after the curtain: shoot after it settled
    const d = await pub.page.evaluate(() => {
      const g = (k) => document.querySelector(`.hero-title [data-i18n="${k}"]`)?.textContent;
      const h = document.querySelector(".hero-title");
      return { h1: g("hero1"), h2: g("hero2"), fit: h.scrollWidth - h.clientWidth, hs: document.documentElement.scrollWidth - innerWidth, bar: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length };
    });
    c.note(JSON.stringify(d));
    if (lang === "ar") c.ok(d.h1 === FIXED, `public AR hero1 "${d.h1}"`);
    else c.ok(d.h1 === EN0, `public EN hero1 "${d.h1}" vs EN0 "${EN0}"`);
    c.ok(d.fit <= FIT0 + 2, `A1 hero title overflows by ${d.fit}px (baseline ${FIT0})`);
    c.ok(d.hs <= 0 && d.bar === 0, `h-scroll ${d.hs}, admin artefacts ${d.bar}`);
    return c.pass;
  });
  try {
    await pubStep(9, "pub-ar", "ar");
    await pubStep(10, "pub-en", "en");
    const adm = await cfg.open();
    try {
      await step(adm.page, { uc: UC, cfg: cfg.name, n: 11, slug: "reload-dashboard", expect: "Draft changes 0" }, async () => {
        const c = checker(`${cfg.name} 11`);
        await adm.page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
        await adm.page.waitForFunction(() => document.getElementById("changes-n").textContent.trim() !== "–", null, { timeout: 3000 }).catch(() => {});
        c.ok((await adm.page.locator("#changes-n").textContent()).trim() === "0", "draft count not 0 after publish");
        return c.pass;
      });
    } finally { await adm.browser.close(); }
    await pubStep(12, "pub-ar-reload", "ar");
    await pubStep(13, "pub-en-reload", "en");
  } finally { await pub.browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) { // each config starts from the baseline (server stopped while the state is restored)
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-02 ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
