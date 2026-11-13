// UC-01 first visit to /admin/ (CASES.md): does the boss understand what to do, where Publish and the draft are?
// node tests/usecases/uc-01-first-visit.mjs [--only edge|webkit]
import { startDev, stopDev, resetState, configs, ORIGIN, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, rect, overlaps, checker } from "./lib/look.mjs";

const UC = "UC-01";
const HERO1 = '.hero-title [data-i18n="hero1"]';

/** A1/A3 into the checker: horizontal scroll + clipped text are failures; small targets are listed as KNOWN id. */
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
  try {
    await S(1, "dashboard", "h1, lede, count 0, five links, signed-in line, no 4xx", async (c) => {
      const r = await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
      c.ok(r.status() === 200, `status ${r.status()}`);
      await page.waitForFunction(() => document.getElementById("changes-n").textContent.trim() !== "–", null, { timeout: 3000 }).catch(() => {});
      const d = await page.evaluate(() => ({
        h1: document.querySelector("h1")?.textContent.trim(),
        lede: document.querySelector(".adm-lede")?.textContent.trim(),
        n: document.getElementById("changes-n").textContent.trim(),
        who: document.getElementById("who").textContent.trim(),
        links: [...document.querySelectorAll(".adm-links a b")].map((b) => b.textContent.trim()),
      }));
      c.note(JSON.stringify(d));
      c.ok(d.h1 === "Edit the site", "h1");
      c.ok(d.n === "0", `draft count "${d.n}" (expected 0 within 3 s)`);
      c.ok(d.links.join() === "Home,About,Library,Gallery,History", `links ${d.links.join()}`);
      c.ok(/^Signed in as \S+@\S+/.test(d.who), `signed-in line is "${d.who}"`);
      const fav = { link: await page.locator("link[rel~=icon]").count(), status: (await page.request.get(ORIGIN + "/favicon.ico")).status() };
      c.known("U-06", fav.link > 0 || fav.status === 200, `no icon link and /favicon.ico is ${fav.status} (console 404 on every admin page)`);
      await look(page, c, cfg, "body");
    });

    await S(2, "where-publish", "a visible Publish control or a sentence saying where publishing happens", async (c) => {
      const d = await page.evaluate(() => {
        const vis = (e) => e.getBoundingClientRect().height > 0;
        const ctl = [...document.querySelectorAll("a,button")].filter((e) => vis(e) && /\bPublish\b(?!ed)/i.test(e.textContent));
        const where = /publish\w*[^.]*\b(bar|top|edit page|each page|button)/i.test(document.body.innerText);
        return { controls: ctl.map((e) => e.textContent.trim()), where };
      });
      c.note(JSON.stringify(d));
      c.known("U-01", d.controls.length > 0 || d.where, "dashboard has no Publish control and does not say where publishing is");
    });

    if (!cfg.touch) await S(3, "tab-order", "Tab visits the five links in order, each with a visible focus ring", async (c) => {
      const seen = [];
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        seen.push(await page.evaluate(() => {
          const e = document.activeElement, cs = getComputedStyle(e);
          return { t: (e.querySelector("b") || e).textContent.trim().slice(0, 20), ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 ? cs.outlineColor : (cs.boxShadow !== "none" ? "shadow" : "none") };
        }));
        if (seen.at(-1).t === "History") break;
      }
      c.note(JSON.stringify(seen));
      const links = seen.filter((s) => ["Home", "About", "Library", "Gallery", "History"].includes(s.t));
      c.ok(links.length === 5, `reached ${links.length}/5 links`);
      c.ok(links.every((s) => s.ring !== "none"), "a link without a focus ring");
    });

    await S(4, "editor-home", "editor bar with every control; bar does not cover nav or hero title", async (c) => {
      await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
      await tapOrClick(page, '.adm-links a[href="/admin/edit/"]', cfg);
      await page.waitForSelector(".ed-bar", { timeout: 15000 });
      await page.waitForTimeout(2500); // curtain + editor boot
      const d = await page.evaluate(() => {
        const bar = document.querySelector(".ed-bar");
        return {
          items: [...bar.children].map((e) => (e.textContent || "").trim()).filter(Boolean),
          cur: bar.querySelector('[aria-current="page"]')?.textContent,
          pubDisabled: bar.querySelector(".ed-publish").disabled, disDisabled: bar.querySelector(".ed-discard").disabled,
          chip: bar.querySelector(".ed-chip").textContent, barScroll: bar.scrollWidth - bar.clientWidth,
        };
      });
      c.note(JSON.stringify(d));
      for (const w of ["Aliph editor", "Page text", "History", "Discard", "Publish", "Dashboard"]) c.ok(d.items.some((t) => t.includes(w)), `bar lacks ${w}`);
      c.ok(d.cur === "Home", `current page mark ${d.cur}`);
      c.ok(d.pubDisabled && d.disDisabled, "Publish/Discard should start disabled");
      c.ok(d.chip === "Draft", `chip "${d.chip}"`);
      const bar = await rect(page, ".ed-bar");
      const nav = await rect(page, "header nav, nav, .site-nav");
      const title = await rect(page, ".hero-title");
      c.note(`bar ${JSON.stringify(bar)} nav ${JSON.stringify(nav)} title ${JSON.stringify(title)}`);
      c.ok(!overlaps(bar, title), "A2 bar covers the hero title");
      c.ok(!overlaps(bar, nav), "A2 bar covers the site nav");
      if (cfg.touch) c.ok(d.barScroll <= 0 || (await page.evaluate(() => getComputedStyle(document.querySelector(".ed-bar")).overflowX)) !== "hidden", `bar clips ${d.barScroll}px of controls`);
      await look(page, c, cfg, ".ed-bar", "U-02");
    });

    await S(5, "popover", "outline on hover; popover with AR + EN textareas, hint, Cancel/Done, inside the viewport", async (c) => {
      const t = page.locator(HERO1).first();
      if (!cfg.touch) { await t.hover(); await page.waitForTimeout(300); c.ok(await page.locator(".ed-outline.is-on").count(), "no hover outline"); }
      await tapOrClick(page, t, cfg);
      const shown = () => page.waitForSelector(".ed-pop:not([hidden])", { timeout: 5000 }).then(() => true, () => false);
      let open = await shown();
      if (cfg.touch) c.known("F-08", open, "tap on the heading does not open the text popover (F-08, being fixed); falling back to click()");
      if (!open) { await t.click(); open = await shown(); }
      if (!c.ok(open, "popover never opened")) return;
      await page.waitForTimeout(400);
      const head = await page.evaluate(() => document.querySelector(".ed-pop").innerText.split("\n").slice(0, 2).join(" | "));
      c.known("U-05", !/\bhero1\b/.test(head), `popover heading shows the raw key: "${head}"`);
      const d = await page.evaluate(() => {
        const p = document.querySelector(".ed-pop"), r = p.getBoundingClientRect();
        return {
          areas: [...p.querySelectorAll("textarea")].map((a) => ({ loc: a.dataset.loc, dir: a.dir, align: getComputedStyle(a).textAlign, v: a.value })),
          btns: [...p.querySelectorAll("button")].map((b) => b.textContent.trim()), hint: p.querySelector(".ed-hint")?.textContent,
          inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, r: [r.left, r.top, r.right, r.bottom].map(Math.round),
        };
      });
      c.note(JSON.stringify(d));
      c.ok(d.areas.length === 2 && d.areas[0].dir === "rtl", "AR + EN textareas, AR first and rtl");
      c.ok(d.btns.includes("Cancel") && d.btns.includes("Done"), `buttons ${d.btns}`);
      c.ok(d.inside, `popover outside the viewport ${d.r}`);
      c.ok(!overlaps(await rect(page, ".ed-pop"), await rect(page, HERO1)), "A2 popover covers the line being edited");
      await look(page, c, cfg, ".ed-pop", "U-02");
    });

    await S(6, "cancel", "popover closes, text unchanged, chip Draft, Publish disabled", async (c) => {
      const before = await page.locator(HERO1).first().textContent();
      await tapOrClick(page, '.ed-pop button:has-text("Cancel")', cfg);
      await page.waitForTimeout(500);
      c.ok(await page.locator(".ed-pop[hidden]").count() === 1, "popover still open");
      c.ok((await page.locator(HERO1).first().textContent()) === before, "text changed");
      const chip = await page.locator(".ed-chip").textContent();
      c.known("U-03", chip === "Draft", `chip says "${chip}" after Cancel with no change`);
      c.ok(await page.locator(".ed-publish").isDisabled(), "Publish enabled");
    });

    await S(7, "editor-library", "Library loads, current mark visible", async (c) => {
      await tapOrClick(page, '.ed-pages a[href="/admin/edit/library"]', cfg);
      await page.waitForURL(/\/admin\/edit\/library/, { timeout: 15000 });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(2500);
      const d = await page.evaluate(() => {
        const a = document.querySelector('.ed-pages [aria-current="page"]'), o = document.querySelector('.ed-pages a:not([aria-current])');
        const st = (e) => { const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.textDecorationLine, s.fontWeight, s.borderBottomWidth].join("/"); };
        return { cur: a?.textContent, curStyle: a && st(a), other: o && st(o) };
      });
      c.note(JSON.stringify(d));
      c.ok(d.cur === "Library", "current mark");
      c.ok(d.curStyle !== d.other, "current page link looks the same as the others");
      await look(page, c, cfg, ".ed-bar", "U-02");
    });

    await S(8, "gallery", "Gallery page: h1, summary with counts, add zone, rings, clients, cleanup, select, tabs, grid", async (c) => {
      await tapOrClick(page, '.ed-bar a[href="/admin/"]', cfg);
      await page.waitForURL(/\/admin\/$/);
      await tapOrClick(page, '.adm-links a[href="/admin/gallery/"]', cfg);
      await page.waitForURL(/\/admin\/gallery\//);
      await page.waitForFunction(() => !/Loading/.test(document.getElementById("summary").textContent), null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const d = await page.evaluate(() => ({
        h1: document.querySelector("h1").textContent, sum: document.getElementById("summary").textContent,
        tiles: document.querySelectorAll("#grid button, #grid li").length, tabs: [...document.querySelectorAll("#tabs [role=tab]")].map((t) => t.textContent.trim()),
        rings: document.querySelectorAll("#rings > *").length, font: getComputedStyle(document.querySelector("h1")).fontFamily,
        dashFont: null,
      }));
      c.note(JSON.stringify(d));
      c.ok(/^\d+ items, 0 changed and not published$/.test(d.sum), `summary "${d.sum}"`);
      c.ok(d.tiles > 0 && d.tabs.length > 0, "grid/tabs empty");
      const g = await page.evaluate(() => ({ grid: Math.round(document.getElementById("grid").getBoundingClientRect().top + scrollY), clients: Math.round(document.getElementById("clients").getBoundingClientRect().top + scrollY), vh: innerHeight }));
      c.note(`grid starts at ${g.grid}px = ${(g.grid / g.vh).toFixed(1)} screens; clients at ${(g.clients / g.vh).toFixed(1)} screens`);
      if (cfg.touch) c.known("U-08", g.grid < 3 * g.vh, `phone: the pictures start ${(g.grid / g.vh).toFixed(1)} screens down, under the ring panels`);
      await look(page, c, cfg, "body", "U-02");
    });

    await S(9, "gallery-way-out", "the gallery has a way back to the dashboard/editor and a Publish (or says where)", async (c) => {
      const d = await page.evaluate(() => ({
        back: [...document.querySelectorAll("a[href]")].filter((a) => /\/admin\/(edit\/)?$/.test(new URL(a.href).pathname)).map((a) => a.textContent.trim()),
        publish: [...document.querySelectorAll("a,button")].filter((e) => /publish/i.test(e.textContent) && e.getBoundingClientRect().height > 0).map((e) => e.textContent.trim()),
        says: /publish\w*[^.]*\b(bar|editor|edit page|dashboard)/i.test(document.body.innerText),
      }));
      c.note(JSON.stringify(d));
      c.known("U-04", d.back.length > 0, "no link back to the dashboard or editor on the gallery page");
      c.known("U-04", d.publish.length > 0 || d.says, "no Publish on the gallery page and no sentence saying where to publish");
    });

    await S(10, "history", "History panel open on the home editor, revisions or a clear empty message", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/?history", { waitUntil: "load" });
      await page.waitForSelector(".ed-bar"); await page.waitForTimeout(3000);
      const d = await page.evaluate(() => {
        const h = document.getElementById("ed-history");
        return { open: !!h && !h.hidden, text: h ? h.innerText.replace(/\s+/g, " ").slice(0, 200) : null, revs: h ? h.querySelectorAll("[data-rev]").length : 0 };
      });
      c.note(JSON.stringify(d));
      c.ok(d.open, "?history did not open the History panel");
      c.ok(d.revs > 0 || /no .*revision|nothing .*published|not .*published/i.test(d.text || ""), `no revisions and no empty message: "${d.text}"`);
      if (d.open) await look(page, c, cfg, "#ed-history", "U-02");
    });

    await S(11, "reload-dashboard", "reload /admin/: draft count still 0", async (c) => {
      await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
      await page.waitForFunction(() => document.getElementById("changes-n").textContent.trim() !== "–", null, { timeout: 3000 }).catch(() => {});
      c.ok((await page.locator("#changes-n").textContent()).trim() === "0", "draft count");
    });
  } finally { await browser.close(); }

  // PUB(/) in a fresh browser: no admin artefacts, AR + EN
  const pub = await cfg.open();
  try {
    const P = (n, slug, lang) => step(pub.page, { uc: UC, cfg: cfg.name, n, slug, expect: `PUB(/) ${lang}: no admin artefact, no h-scroll` }, async () => {
      const c = checker(`${cfg.name} ${n}`);
      if (n === 12) await pub.page.goto(ORIGIN + "/", { waitUntil: "load" });
      await setLang(pub.page, lang);
      await pub.page.waitForTimeout(1500);
      const d = await pub.page.evaluate(() => ({ dir: document.documentElement.dir, bar: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length, hs: document.documentElement.scrollWidth - innerWidth }));
      c.ok(d.dir === (lang === "ar" ? "rtl" : "ltr"), `dir ${d.dir}`);
      c.ok(d.bar === 0, "admin artefact on the public page");
      c.ok(d.hs <= 0, `h-scroll ${d.hs}`);
      return c.pass;
    });
    await P(12, "pub-ar", "ar");
    await P(13, "pub-en", "en");
  } finally { await pub.browser.close(); }
}

let dev;
try {
  resetState();
  dev = await startDev();
  for (const cfg of configs()) await run(cfg);
} catch (e) { check("UC-01 ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
