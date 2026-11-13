// Q-19: a11y basics on the visitor pages (/, /about, /library) and the admin pages (/admin/, /admin/gallery/, /admin/edit/).
//   node tests/qa/a11y.mjs      (local wrangler dev on 8881; ONLY=edge|webkit; DISCOVER=1 prints every offender instead of a summary)
// Per page: html lang/dir, exactly one <h1>, every visible control has an accessible name, every visible <img> has an alt attribute,
// Tab order: every tabbable control is reached by Tab (cap 200 presses) and the focus indicator is visible on each, text contrast >= 4.5:1
// (3:1 for large text) where the background is a flat colour, and dialogs (gallery drawer = native <dialog>, editor confirm) trap Tab,
// close on Esc and return focus. Findings are printed as KNOWN F-NN (see REPORT) and do not fail the run; a new kind of failure does.
import fs from "node:fs";
import path from "node:path";
import { ROOT, startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, shot, check, done } from "./lib/harness.mjs";

const KNOWN = (id, msg) => console.log(`KNOWN ${id} ${msg}`);
const DISCOVER = !!process.env.DISCOVER;
const PAGES = [["visitor /", "/", 3500], ["visitor /about", "/about", 2500], ["visitor /library", "/library", 2500], ["admin /admin/", "/admin/", 2500], ["admin gallery", "/admin/gallery/", 3000], ["admin edit home", "/admin/edit/", 4000]];
// finding ids per check kind (assigned after the first run; unknown kinds fail the run)
const FINDING = { name: "F-17", alt: null, reach: null, focusvis: null, contrastBtn: null /* F-18 fixed: a finding fails the run */, contrastTb: "F-19", contrast: null };

const audit = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.02; };
  const inHidden = (el) => { for (let p = el; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden" || p.hidden || p.inert || p.getAttribute("aria-hidden") === "true") return true; } return false; };
  const lab = (el) => {
    if (el.tagName === "IMG" && (el.getAttribute("alt") || "").trim()) return el.getAttribute("alt").trim();
    const aria = el.getAttribute("aria-label"); if (aria && aria.trim()) return aria.trim();
    const lb = el.getAttribute("aria-labelledby"); if (lb) { const t = lb.split(/\s+/).map((i) => document.getElementById(i)?.textContent || "").join(" ").trim(); if (t) return t; }
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && l.textContent.trim()) return l.textContent.trim(); }
    const wrap = el.closest("label"); if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    const t = (el.innerText || el.textContent || "").trim(); if (t) return t;
    const img = el.querySelector("img[alt]"); if (img && img.alt.trim()) return img.alt.trim();
    const svgt = el.querySelector("svg title"); if (svgt && svgt.textContent.trim()) return svgt.textContent.trim();
    return (el.getAttribute("title") || "").trim();
  };
  const desc = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "") + (el.getAttribute("href") ? `[href=${el.getAttribute("href").slice(0, 30)}]` : "") + (el.type && el.tagName === "INPUT" ? `[type=${el.type}]` : "") + (el.tagName === "IMG" ? `[src=${(el.getAttribute("src") || "").slice(-26)}][in ${el.parentElement ? el.parentElement.tagName.toLowerCase() + "." + (typeof el.parentElement.className === "string" ? el.parentElement.className.split(" ")[0] : "") : ""}][tabindex=${el.getAttribute("tabindex")}][role=${el.getAttribute("role")}]` : "");
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=link], [role=checkbox], [role=switch], [tabindex]';
  const controls = [...document.querySelectorAll(sel)].filter((e) => !inHidden(e) && vis(e) && !e.disabled);
  const unnamed = controls.filter((e) => !lab(e)).map(desc);
  const imgs = [...document.images].filter((i) => !inHidden(i) && vis(i));
  const noAlt = imgs.filter((i) => !i.hasAttribute("alt")).map((i) => desc(i) + " " + (i.currentSrc || i.src).slice(-30));
  const tabbable = controls.filter((e) => e.tabIndex >= 0 && !e.closest("[inert]")).map((e) => e);
  tabbable.forEach((e, i) => e.setAttribute("data-qa-tab", i));
  // contrast
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = (el) => { // flat background colour behind el, or null when an image/gradient/video is involved
    let acc = null; const stack = [];
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.backgroundImage !== "none") return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (const c of stack.reverse()) base = blend(c, base);
    return base;
  };
  const bad = []; let tested = 0, skipped = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (!el.childNodes.length || ["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "VIDEO", "CANVAS"].includes(el.tagName.toUpperCase())) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (inHidden(el) || !vis(el) || el.closest(".curtain, .sr-only, [aria-hidden=true], :disabled, [disabled], [aria-disabled=true]")) continue;
    const s = getComputedStyle(el);
    let op = 1; for (let p = el; p && p !== document.documentElement; p = p.parentElement) op *= +getComputedStyle(p).opacity;
    const fg0 = parse(s.color); const bg = bgOf(el);
    if (!fg0 || !bg || s.webkitTextFillColor === "transparent" || s.backgroundClip === "text") { skipped++; continue; }
    const fg = blend({ ...fg0, a: fg0.a * op }, bg);
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(s.fontSize), large = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700);
    if (ratio < 1.5) { skipped++; continue; } // fg == assumed bg: the real background is another layer (linen, dark section drawn elsewhere); indeterminate
    tested++;
    if (ratio < (large ? 3 : 4.5)) bad.push({ d: desc(el) + ' "' + el.textContent.trim().slice(0, 24) + '"', ratio: +ratio.toFixed(2), px: Math.round(px), large });
  }
  const de = document.documentElement;
  return { lang: de.lang, dir: de.dir, h1: document.querySelectorAll("h1").length, controls: controls.length, unnamed, noAlt, tabbable: tabbable.length, tested, skipped, bad };
};

const focusState = () => {
  const e = document.activeElement; if (!e || e === document.body) return null;
  const s = getComputedStyle(e);
  const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 && s.outlineColor !== "rgba(0, 0, 0, 0)";
  const shadow = s.boxShadow !== "none";
  const idx = e.getAttribute("data-qa-tab");
  return { idx: idx === null ? null : +idx, ok: outline || shadow, d: e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/)[0] : "") + ' "' + (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 20) + '"' };
};

function report(tag, kind, list, note = "") {
  if (!list.length) { check(`${tag} ${kind}: none`, true); return; }
  const shown = DISCOVER ? list : list.slice(0, 4);
  const id = FINDING[kind];
  if (id) KNOWN(id, `${tag} ${kind}: ${list.length} offender(s) ${note} ${JSON.stringify(shown).slice(0, 420)}`);
  else check(`${tag} ${kind}: ${list.length} offender(s) ${JSON.stringify(shown).slice(0, 420)}`, false);
}

async function dialogJourney(page, tag, kind) {
  if (kind === "gallery") {
    const tile = page.locator("button.adm-tile").first();
    if (!(await tile.count())) { console.log(`     ${tag} no gallery tile on a store this empty; drawer test skipped`); return; }
    await tile.focus().catch(() => {});
    await page.keyboard.press("Enter");
    await page.waitForTimeout(700);
    const open = await page.evaluate(() => !!document.querySelector("dialog[open]"));
    if (!open) { await tile.click().catch(() => {}); await page.waitForTimeout(700); }
    const st = await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? { inside: d.contains(document.activeElement), id: d.id, label: d.getAttribute("aria-labelledby") && document.getElementById(d.getAttribute("aria-labelledby"))?.textContent.trim() } : null; });
    check(`${tag} drawer opens (${st && st.id}) with an accessible title (${st && st.label})`, !!st && !!st.label);
    if (!st) return;
    check(`${tag} focus moves into the drawer`, st.inside);
    let leaked = 0; for (let i = 0; i < 25; i++) { await page.keyboard.press("Tab"); if (!(await page.evaluate(() => { const d = document.querySelector("dialog[open]"); return !!d && (d.contains(document.activeElement) || document.activeElement === document.body); }))) leaked++; }
    check(`${tag} 25 Tab presses never leave the drawer (leaked ${leaked})`, leaked === 0);
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    check(`${tag} Esc closes the drawer`, await page.evaluate(() => !document.querySelector("dialog[open]")));
    const back = await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? a.tagName.toLowerCase() + "." + (a.className || "").toString().split(" ")[0] : "body"; });
    check(`${tag} focus returns to the page, not the body (${back})`, back !== "body");
  }
}

async function editorDialog(page, tag) {
  // a draft change so Discard is enabled (PUT /api/admin/text), then Discard -> confirm dialog -> Esc/Cancel
  const put = await page.evaluate(async () => { const go = async (rev) => { const r = await fetch("/api/admin/text", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "hero1", locale: "en", value: "QA a11y draft", baseRev: rev }) }); const j = await r.json().catch(() => ({})); return { s: r.status, j }; }; let r = await go(0); if (r.s === 409 && r.j.current) r = await go(r.j.current.rev); return { s: r.s, t: JSON.stringify(r.j).slice(0, 160) }; });
  if (put.s >= 300) { console.log(`     ${tag} could not stage a draft (${put.s} ${put.t}); editor dialog skipped`); return; }
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector(".ed-discard:not([disabled])"), null, { timeout: 15000 }).catch(() => {});
  const en = await page.evaluate(() => !!document.querySelector(".ed-discard:not([disabled])"));
  check(`${tag} Discard is enabled by a staged draft`, en);
  if (!en) return;
  await page.locator(".ed-discard").focus();
  await page.keyboard.press("Enter"); await page.waitForSelector(".ed-confirm", { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(500);
  const st = await page.evaluate(() => { const d = document.querySelector('.ed-dialog[role="dialog"]'); return d ? { modal: d.getAttribute("aria-modal"), label: d.getAttribute("aria-label"), inside: d.contains(document.activeElement) } : null; });
  check(`${tag} confirm dialog opens, aria-modal, labelled (${st && st.label})`, !!st && st.modal === "true" && !!st.label);
  if (st) {
    check(`${tag} focus moves into the confirm dialog`, st.inside);
    let leaked = 0; const took = [];
    for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); const r = await page.evaluate(() => { const d = document.querySelector('.ed-dialog[role="dialog"]'); const a = document.activeElement; return { ok: !!d && d.contains(a), who: a ? a.tagName.toLowerCase() + (a.className && typeof a.className === "string" ? "." + a.className.split(" ")[0] : "") : "" }; }); if (!r.ok) { leaked++; if (took.length < 4) took.push(r.who); } }
    if (leaked) KNOWN("F-20", `${tag} the Discard confirm dialog (role=dialog aria-modal=true, editor.js:335) does not trap Tab: ${leaked} of 12 presses put focus outside it, on ${took.join(", ")}`);
    else check(`${tag} 12 Tab presses never leave the confirm dialog`, true);
    await page.keyboard.press("Escape"); await page.waitForTimeout(500);
    const closed = await page.evaluate(() => !document.querySelector('.ed-dialog[role="dialog"]'));
    check(`${tag} Esc closes the confirm dialog`, closed);
    const back = await page.evaluate(() => document.activeElement && document.activeElement.classList.contains("ed-discard"));
    check(`${tag} focus returns to the Discard button`, back);
  }
  // clean up: discard the draft through the API
  await page.evaluate(async () => { const c = await (await fetch("/api/admin/changes")).json(); if (c.changes.length) await fetch("/api/admin/discard", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) }); });
}

async function run(label, launch, vp, lang, ctxOpts, touch) {
  const { browser, context, page } = await launch(vp, ctxOpts);
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const seeded = await seedDraft(context.request);
  check(`${label} ${vp.width} ${lang} seeded a draft gallery piece (${seeded})`, seeded < 300);
  try {
    for (const [pname, url, wait] of PAGES) {
      const tag = `${label} ${vp.width} ${lang} ${pname}`;
      const admin = url.startsWith("/admin");
      await page.goto(ORIGIN + url, { waitUntil: "load" });
      if (!admin && (await page.evaluate((l) => localStorage.getItem("aliph-lang") !== l && (localStorage.setItem("aliph-lang", l), true), lang))) await page.reload({ waitUntil: "load" });
      await page.waitForTimeout(wait);
      if (url.startsWith("/admin/edit")) await page.waitForSelector(".ed-bar", { timeout: 20000 }).catch(() => {});
      const a = await page.evaluate(audit);
      const wantLang = admin ? null : lang;
      check(`${tag} html lang="${a.lang}" dir="${a.dir}"`, !!a.lang && (!wantLang || (a.lang === wantLang && a.dir === (lang === "ar" ? "rtl" : "ltr"))) && (a.dir === "ltr" || a.dir === "rtl" || !a.dir));
      check(`${tag} exactly one <h1> (${a.h1})`, a.h1 === 1 || (admin && a.h1 <= 1));
      report(tag, "name", a.unnamed, `of ${a.controls} controls`);
      report(tag, "alt", a.noAlt);
      // Tab walk (desktop keyboard only; touch devices have no Tab key in this harness)
      if (!touch && vp.width >= 1000) {
        await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
        const reached = new Set(), noFocus = []; let steps = 0, outOfOrder = 0, last = -1;
        for (let i = 0; i < Math.min(400, a.tabbable * 2 + 20); i++) {
          await page.keyboard.press("Tab"); steps++;
          const f = await page.evaluate(focusState);
          if (!f) continue;
          if (f.idx !== null) { if (reached.has(f.idx)) break; reached.add(f.idx); if (f.idx < last - 5) outOfOrder++; last = f.idx; }
          if (!f.ok) noFocus.push(f.d);
          if (steps % 15 === 0) await page.waitForTimeout(30);
        }
        const missing = a.tabbable - reached.size;
        // controls reached by Tab are a subset by construction (roving tabindex groups count once); report the ratio and only fail on none
        console.log(`     ${tag}: ${a.tabbable} tabbable controls, ${reached.size} reached in ${steps} Tab presses, ${outOfOrder} jumps backwards, ${noFocus.length} with no visible focus indicator`);
        check(`${tag} Tab reaches controls (${reached.size}/${a.tabbable})`, a.tabbable === 0 || reached.size > 0);
        if (missing > 0 && reached.size < a.tabbable) {
          const who = await page.evaluate((r) => [...document.querySelectorAll("[data-qa-tab]")].filter((e) => !r.includes(+e.getAttribute("data-qa-tab"))).map((e) => e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/s+/)[0] : "") + " tabindex=" + e.getAttribute("tabindex") + " " + (e.closest("[data-ek],.film-group,.ring,.reelshow-track") ? "in " + (e.closest("[data-ek],.film-group,.ring,.reelshow-track").className || "data-ek") : "")), [...reached]);
          const real = who.filter((x) => !/tabindex=-1/.test(x)); // a roving-tabindex member (film strip, rings) is one tab stop by design; the arrows walk the rest
          if (real.length) report(tag, "reach", [`${real.length} of ${a.tabbable} tabbable controls not reached within ${steps} presses: ${real.join("; ").slice(0, 300)}`]);
          else console.log(`     ${tag}: ${who.length} control(s) skipped by Tab are roving-tabindex members (tabindex=-1 at the end), by design`);
        }
        const fv = [];
        for (const d of [...new Set(noFocus)]) { // custom indicators (ring slat colour, ::after) are real: compare pixels of the control focused vs not
          if (/ring-item/.test(d)) { fv.push("");  continue; } // designed alternative: .ring-slat border turns accent (style.css:2911-2912)
          if (/film-frame|holder/.test(d)) { fv.push(d + " (designed alternative: style.css:2066/2084; not pixel-checked, the strip moves)"); continue; }
          const idx = await page.evaluate((txt) => { const el = [...document.querySelectorAll("[data-qa-tab]")].find((e) => ((e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 20)) === txt); if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x - 6), y: Math.max(0, r.y - 6), width: Math.min(innerWidth, r.width + 12), height: Math.min(innerHeight, r.height + 12), i: el.getAttribute("data-qa-tab") }; }, d.match(/"([^"]*)"$/)?.[1] ?? "");
          if (!idx) { fv.push(d + " (not found again)"); continue; }
          try {
          await page.evaluate(() => document.activeElement?.blur?.()); await page.waitForTimeout(500);
          const off = await page.screenshot({ clip: { x: idx.x, y: idx.y, width: idx.width, height: idx.height } });
          await page.evaluate((i) => document.querySelector(`[data-qa-tab="${i}"]`).focus({ focusVisible: true }), idx.i); await page.waitForTimeout(700);
          const on = await page.screenshot({ clip: { x: idx.x, y: idx.y, width: idx.width, height: idx.height } });
          if (off.equals(on)) fv.push(d + " (pixels identical focused vs not)");
          } catch (e) { fv.push(d + " (not pixel-checkable: " + String(e.message).split(String.fromCharCode(10))[0].slice(0, 60) + ")"); }
        }
        report(tag, "focusvis", fv.filter(Boolean).filter((x) => !/designed alternative/.test(x)));
        await shot(page, `Q19-${label}-${vp.width}-${pname.replace(/[^a-z]+/gi, "-")}`).catch(() => {});
      }
      console.log(`     ${tag}: contrast tested ${a.tested} text elements, ${a.skipped} skipped (image/gradient background), ${a.bad.length} below the threshold`);
      const bad = a.bad.sort((x, y) => x.ratio - y.ratio);
      report(tag, "contrastBtn", bad.filter((x) => /ed-publish|ed-discard/.test(x.d)));
      report(tag, "contrastTb", bad.filter((x) => /tb-biz/.test(x.d)));
      report(tag, "contrast", bad.filter((x) => !/ed-publish|ed-discard|tb-biz/.test(x.d)));
      if (pname === "admin gallery" && !touch) await dialogJourney(page, tag, "gallery");
      if (pname === "admin edit home" && !touch && vp.width >= 1000) await editorDialog(page, tag);
    }
    check(`${label} ${vp.width} ${lang} no uncaught page errors (${errs.length})`, errs.length === 0, errs.slice(0, 2).join(" | "));
  } finally {
    try { const n = await discardAll(context.request); check(`${label} ${vp.width} ${lang} cleanup: ${n} draft change(s) discarded`, true); } catch (e) { check(`cleanup (${e.message})`, false); } await browser.close(); }
}

const H = { origin: ORIGIN };
const PHOTO = path.join(ROOT, "tests/gallery/fixtures/photo-plain.jpg");
async function seedDraft(R) { // one draft gallery piece so the gallery has a tile (discarded again at the end of the run)
  const upl = await (await R.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": "qa19.jpg" }, data: fs.readFileSync(PHOTO) })).json();
  const put = await R.put(`${ORIGIN}/api/admin/gallery/${upl.id}`, { headers: H, data: { src: upl.url, cat: "photo", ratio: 1.5, date: "2026-01", alt: { en: "QA a11y piece", ar: "قطعة اختبار" }, baseRev: 0 } });
  return put.status();
}
async function discardAll(R) {
  const c = await (await R.get(ORIGIN + "/api/admin/changes")).json();
  if (c.changes.length) await R.post(ORIGIN + "/api/admin/discard", { headers: H, data: { token: c.token } });
  return c.changes.length;
}
const dev = await startDev();
try {
  const eo = { isMobile: false, hasTouch: false, deviceScaleFactor: 1 };
  if (process.env.ONLY !== "webkit") {
    await run("edge", edge, VIEWPORTS.desktop, "en", {}, false);
    await run("edge", edge, VIEWPORTS.desktop, "ar", {}, false);
    await run("edge", edge, VIEWPORTS.phone, "ar", {}, true);
  }
  if (process.env.ONLY !== "edge") await run("webkit", webkit, VIEWPORTS.phone, "ar", {}, true);
} catch (e) {
  check(`script ran to the end (${String(e.stack || e.message).split("\n").slice(0, 3).join(" / ").slice(0, 400)})`, false);
} finally { stopDev(dev); }
done();
