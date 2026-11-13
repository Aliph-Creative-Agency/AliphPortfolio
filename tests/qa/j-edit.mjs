// Q-09: edit texts in place (/admin/edit/ home, about, library), EN + AR, autosave chip, reload mid-autosave,
// Publish, visitor shows both.   node tests/qa/j-edit.mjs      (local wrangler dev on 8881, Edge 1440 + WebKit 390)
// Writes to the LOCAL D1 only; the keys it touches are reset and re-published at the end.
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, shot, watch, check, done } from "./lib/harness.mjs";

// page -> [edit path, public path, key, AR default marker is not needed]
const PAGES = [
  { name: "home", edit: "/admin/edit/", pub: "/", key: "hero1" },
  { name: "about", edit: "/admin/edit/about", pub: "/about", key: "aboutBanner" },
  { name: "library", edit: "/admin/edit/library", pub: "/library", key: "libTitle" },
];

const api = (page, method, body, path = "/api/admin/text") =>
  page.evaluate(async ({ method, body, path }) => {
    const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  }, { method, body, path });
const draftText = (page, key, loc) =>
  page.evaluate(async ({ key, loc }) => {
    const c = await (await fetch("/api/admin/content")).json();
    const t = c.text && c.text[key];
    return t ? t[loc] ?? null : null;
  }, { key, loc });

const ready = async (page, path) => {
  await page.goto(ORIGIN + path, { waitUntil: "load" });
  await page.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"), null, { timeout: 30000 });
  await page.waitForTimeout(1500); // the curtain/tagger settle (preview pane has no rAF; headless Edge does)
};
const click = (page, sel, touch) => (touch ? page.locator(sel).first().tap({ force: true }) : page.locator(sel).first().click({ force: true }));

async function openPop(page, key, touch) {
  await page.evaluate((k) => { const e = document.querySelector(`[data-ek="${k}"]`); if (e) e.scrollIntoView({ block: "center" }); }, key);
  await click(page, `[data-ek="${key}"]`, touch);
  if (touch) {
    // F-08: in WebKit-mobile a tap on a [data-ek] text fires touch events but no click (the editor listens on
    // document only), so the popover never opens. Record it, then open it with a synthetic click to go on.
    const opened = await page.waitForSelector(".ed-pop:not([hidden])", { timeout: 1500 }).then(() => true, () => false);
    if (opened) check(`${touch} tap on [data-ek=${key}] opens the popover`, true);
    else console.log(`KNOWN F-08 ${touch} tap on [data-ek=${key}] gave no click, popover not opened`);
    if (!opened) await page.evaluate((k) => document.querySelector(`[data-ek="${k}"]`).click(), key);
  }
  await page.waitForSelector(".ed-pop:not([hidden])", { timeout: 5000 });
}

async function run(label, launch, vp, touch) {
  const { browser, page, context } = await launch(vp);
  const w = watch(page);
  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push(d.type()); d.accept().catch(() => {}); });
  const tag = label[0] + Math.floor(Math.random() * 90 + 10); // short: libTitle allows only 12 chars
  const texts = {}; // key -> {ar,en}
  try {
    // 1. edit AR + EN on all three pages through the popover, watch the chip
    for (const p of PAGES) {
      texts[p.key] = { ar: `ن ${tag}${p.name[0]}`, en: `Q ${tag}${p.name[0]}` };
      await ready(page, p.edit);
      check(`${label} ${p.name} edit page ready, Publish starts as-is`, (await page.locator(".ed-chip").count()) === 1);
      const ek = await page.locator(`[data-ek="${p.key}"]`).count();
      check(`${label} ${p.name} [data-ek=${p.key}] exists`, ek > 0);
      if (!ek) continue;
      await openPop(page, p.key, touch && label);
      await page.fill('.ed-pop textarea[data-loc="ar"]', texts[p.key].ar);
      const chipSaving = await page.locator(".ed-chip").getAttribute("data-state");
      check(`${label} ${p.name} chip leaves "saved" while typing`, chipSaving === "saving", chipSaving);
      await page.fill('.ed-pop textarea[data-loc="en"]', texts[p.key].en);
      await page.waitForFunction(() => document.querySelector(".ed-chip").getAttribute("data-state") === "saved", null, { timeout: 8000 }).catch(() => {});
      check(`${label} ${p.name} autosave reaches "Saved"`, (await page.locator(".ed-chip").getAttribute("data-state")) === "saved", await page.locator(".ed-chip").textContent());
      check(`${label} ${p.name} draft holds AR`, (await draftText(page, p.key, "ar")) === texts[p.key].ar);
      check(`${label} ${p.name} draft holds EN`, (await draftText(page, p.key, "en")) === texts[p.key].en);
      if (p.name === "home") await shot(page, `Q09-${label}-popover`);
      await page.click(".ed-pop button:has-text('Done')");
    }

    // 2. reload mid-autosave: type, reload within 300 ms. Nothing lost, or a clear warning (beforeunload / restore)
    const mid = { ar: `م ${tag}`, en: `M ${tag}` };
    await ready(page, "/admin/edit/about");
    await openPop(page, "aboutBanner", touch && label);
    dialogs.length = 0;
    await page.fill('.ed-pop textarea[data-loc="en"]', mid.en);
    const t0 = Date.now();
    await page.reload({ waitUntil: "load" });
    const reloadMs = Date.now() - t0;
    await page.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"), null, { timeout: 30000 });
    // the backup restore re-queues the value; give autosave its 800 ms + the PUT
    await page.waitForFunction(() => document.querySelector(".ed-chip").getAttribute("data-state") === "saved", null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const warned = dialogs.includes("beforeunload");
    const afterDraft = await draftText(page, "aboutBanner", "en");
    const onScreen = await page.evaluate(() => (document.querySelector('[data-ek="aboutBanner"]') || {}).textContent);
    const kept = afterDraft === mid.en;
    console.log(`     mid-autosave reload: ${reloadMs} ms after typing, beforeunload warning=${warned}, draft after=${JSON.stringify(afterDraft)}, on screen=${JSON.stringify(onScreen && onScreen.slice(0, 60))}`);
    check(`${label} reload mid-autosave: value kept in the draft or a warning shown`, kept || warned, `kept=${kept} warned=${warned}`);
    if (!kept && warned) console.log(`KNOWN mid-autosave: only the beforeunload warning protected the text (${label})`);
    if (kept) texts.aboutBanner.en = mid.en;
    await shot(page, `Q09-${label}-after-reload`);

    // 3. Publish through the dialog
    await ready(page, "/admin/edit/");
    await page.waitForFunction(() => !document.querySelector(".ed-publish").disabled, null, { timeout: 8000 });
    const label3 = await page.locator(".ed-publish").textContent();
    check(`${label} Publish shows the count`, /Publish \(\d+\)/.test(label3), label3);
    await click(page, ".ed-publish", touch);
    await page.waitForSelector(".ed-confirm", { timeout: 8000 });
    const list = await page.locator(".ed-confirm").textContent();
    check(`${label} publish dialog lists Home, About and Library`, /Home/.test(list) && /About/.test(list) && /Library/.test(list), list.slice(0, 160));
    await shot(page, `Q09-${label}-publish-dialog`);
    await click(page, ".ed-confirm .is-primary", touch);
    await page.waitForSelector(".ed-toast:not([hidden])", { timeout: 10000 });
    check(`${label} success toast`, /revision \d+/.test(await page.locator(".ed-toast").textContent()), await page.locator(".ed-toast").textContent());

    // 4. visitor pages show both languages (served AR before JS, EN after the toggle)
    const pub = await context.newPage();
    const wp = watch(pub);
    for (const p of PAGES) {
      const html = await (await fetch(ORIGIN + p.pub)).text();
      check(`${label} served ${p.pub} has the AR text`, html.includes(texts[p.key].ar));
      await pub.goto(ORIGIN + p.pub, { waitUntil: "load" });
      await pub.waitForTimeout(2500);
      const sel = `[data-i18n="${p.key}"]`;
      const arNow = (await pub.locator(sel).first().textContent()) || "";
      check(`${label} visitor ${p.pub} shows AR`, arNow.includes(texts[p.key].ar), arNow.slice(0, 60));
      await pub.evaluate(() => document.querySelector(".js-lang").click());
      await pub.waitForTimeout(900);
      const enNow = (await pub.locator(sel).first().textContent()) || "";
      check(`${label} visitor ${p.pub} shows EN`, enNow.includes(texts[p.key].en), enNow.slice(0, 60));
      check(`${label} visitor ${p.pub} no editor marks`, (await pub.locator("[data-ek]").count()) === 0);
      if (p.name === "home") await shot(pub, `Q09-${label}-visitor-home-en`);
      await pub.evaluate(() => document.querySelector(".js-lang").click()); // back to AR
      await pub.waitForTimeout(300);
    }
    check(`${label} visitor pages: no page errors`, !wp.errors.some((e) => e.startsWith("pageerror")), wp.errors.join(" | ").slice(0, 200));
    await pub.close();
    check(`${label} editor: no page errors`, !w.errors.some((e) => e.startsWith("pageerror")), w.errors.join(" | ").slice(0, 200));
    const net = w.errors.filter((e) => !e.startsWith("pageerror"));
    if (net.length) console.log(`     console errors (${label}): ${net.join(" | ").slice(0, 300)}`);

    // 5. cleanup: reset the three keys (both locales) and publish, so the next run starts from defaults
    await ready(page, "/admin/edit/");
    for (const p of PAGES) for (const loc of ["ar", "en"]) {
      const c = await page.evaluate(async () => (await (await fetch("/api/admin/content")).json()).locks.text);
      const rev = ((c[p.key] || {})[loc]) || 0;
      if (rev) await api(page, "DELETE", { key: p.key, locale: loc, baseRev: rev });
    }
    const chg = await page.evaluate(async () => (await (await fetch("/api/admin/changes")).json()));
    if (chg.changes && chg.changes.length) await api(page, "POST", { token: chg.token }, "/api/admin/publish");
  } catch (e) { check(`${label} journey ran`, false, String(e).slice(0, 300)); await shot(page, `Q09-${label}-failure`).catch(() => {}); }
  finally { await browser.close(); }
}

let dev;
try {
  dev = await startDev();
  const only = process.env.ONLY || "";
  if (!only || only === "edge") await run("edge-1440", edge, VIEWPORTS.desktop, false);
  if (!only || only === "webkit") await run("webkit-390", webkit, VIEWPORTS.phone, true);
} catch (e) { check("q09 ran", false, String(e)); }
finally { stopDev(dev); }
done();
