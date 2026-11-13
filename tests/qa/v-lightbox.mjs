// Q-17: lightbox + deep links + odd ids on the visitor /library (the static archive, no seeding needed).
//   node tests/qa/v-lightbox.mjs      (local wrangler dev on 8881; ONLY=edge|webkit)
// Per browser/language: open by keyboard (Enter) and by click, count "n / N", next/prev, wrap, RTL arrow flip, Tab trap, Esc, focus returns
// to the tile; WebKit 390: tap open, tap steppers, a real touch swipe (synthetic pointer sequence) -> KNOWN F-13 when the lightbox has no swipe.
// Deep links: ?open=<real file> opens, unknown/odd ?open= = no overlay + no error; ?client= constructor / __proto__ / %00 / 2000 chars /
// <script> / toString = the normal archive (no client header, no console error, no new <script>, no sideways scroll).
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, shot, check, done } from "./lib/harness.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KNOWN = (id, msg) => console.log(`KNOWN ${id} ${msg}`);

function track(page) {
  const t = { errs: [], cur: "" };
  page.on("console", (m) => { if (m.type() === "error") t.errs.push(`${t.cur}: ${m.text()} [${m.location().url}]`); });
  page.on("pageerror", (e) => t.errs.push(`${t.cur}: pageerror ${e.message}`));
  return t;
}

async function load(page, url, lang, wait = 1800) {
  await page.goto(ORIGIN + url, { waitUntil: "load" });
  if (await page.evaluate((l) => localStorage.getItem("aliph-lang") !== l && (localStorage.setItem("aliph-lang", l), true), lang)) await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(wait);
}

const lbState = (page) => page.evaluate(() => {
  const r = document.querySelector(".lb");
  const shown = !!r && !r.hidden && getComputedStyle(r).display !== "none";
  const ae = document.activeElement;
  return {
    shown,
    count: shown ? document.querySelector(".lb-count")?.textContent.trim() : null,
    img: shown ? document.querySelector(".lb-stage img, .lb-stage video")?.getAttribute("src") : null,
    inside: !!(r && ae && r.contains(ae)),
    ae: ae ? (ae.className && typeof ae.className === "string" ? ae.tagName.toLowerCase() + "." + ae.className.split(" ")[0] : ae.tagName.toLowerCase()) : "",
    steps: shown && getComputedStyle(document.querySelector(".lb-next")).display !== "none",
  };
});
const nums = (s) => { // "٣ / ٩" or "3 / 9" -> [3, 9]
  const m = String(s || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).match(/(\d+)\s*\/\s*(\d+)/);
  return m ? [+m[1], +m[2]] : null;
};

// open the photo panel and return a handle to its first tile
async function firstTile(page) {
  await page.evaluate(() => document.querySelector('.acc-panel[data-cat="photo"] .spine, .acc-panel[data-cat="all"] .spine')?.click());
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const p = document.querySelector('.acc-panel.open .lib-grid');
    const t = p && p.querySelector(".tile:not([data-project])");
    if (!t) return null;
    t.setAttribute("data-qa-first", "1");
    return { n: p.querySelectorAll(".tile:not([data-project])").length, cat: t.closest(".acc-panel").dataset.cat };
  });
}

async function keyboardJourney(label, launch, vp, lang, ctxOpts, touch) {
  const { browser, context, page } = await launch(vp, ctxOpts);
  const t = track(page);
  const tag = `${label} ${vp.width} ${lang}`;
  const rtl = lang === "ar";
  try {
    t.cur = tag;
    await load(page, "/library", lang);
    const info = await firstTile(page);
    check(`${tag} archive has openable tiles (${info && info.n} in ${info && info.cat})`, !!info && info.n > 2);
    if (!info) return;
    // open: keyboard Enter on a focused tile (desktop), tap on touch
    if (!touch) {
      await page.evaluate(() => document.querySelector("[data-qa-first]").focus());
      await page.keyboard.press("Enter");
    } else {
      await page.evaluate(() => document.querySelector("[data-qa-first]").scrollIntoView({ block: "center" }));
      await page.waitForTimeout(300);
      await page.locator("[data-qa-first]").tap().catch(() => {});
      if (!(await lbState(page)).shown) { KNOWN("F-08", `${tag} tap on a tile gave no click; opened with element.click()`); await page.evaluate(() => document.querySelector("[data-qa-first]").click()); }
    }
    await page.waitForTimeout(500);
    let s = await lbState(page);
    check(`${tag} lightbox opens (${s.count})`, s.shown);
    const n0 = nums(s.count);
    check(`${tag} counter reads 1 / ${info.n}-ish: ${JSON.stringify(n0)}`, !!n0 && n0[0] === 1 && n0[1] >= 2);
    check(`${tag} focus moved into the dialog (${s.ae})`, s.inside && /lb-close/.test(s.ae));
    check(`${tag} step arrows shown`, s.steps);
    check(`${tag} the stage shows a picture (${(s.img || "").slice(-30)})`, !!s.img);
    await shot(page, `Q17-${label}-${vp.width}-${lang}-open`);
    const N = n0 ? n0[1] : 0;
    const first = s.img;
    // next / prev by the on-screen buttons (all browsers)
    await page.locator(".lb-next").click();
    s = await lbState(page);
    check(`${tag} Next button -> 2 / ${N} (${s.count})`, JSON.stringify(nums(s.count)) === JSON.stringify([2, N]) && s.img !== first);
    await page.locator(".lb-prev").click();
    s = await lbState(page);
    check(`${tag} Prev button -> 1 / ${N} (${s.count})`, JSON.stringify(nums(s.count)) === JSON.stringify([1, N]) && s.img === first);
    await page.locator(".lb-prev").click();
    s = await lbState(page);
    check(`${tag} Prev from the first wraps to ${N} / ${N} (${s.count})`, JSON.stringify(nums(s.count)) === JSON.stringify([N, N]));
    await page.locator(".lb-next").click();
    s = await lbState(page);
    check(`${tag} Next from the last wraps to 1 / ${N} (${s.count})`, JSON.stringify(nums(s.count)) === JSON.stringify([1, N]));

    if (!touch) {
      // arrow keys follow reading order: ltr Right = next, rtl Left = next
      await page.keyboard.press(rtl ? "ArrowLeft" : "ArrowRight");
      s = await lbState(page);
      check(`${tag} ${rtl ? "ArrowLeft" : "ArrowRight"} = next -> 2 / ${N} (${s.count})`, JSON.stringify(nums(s.count)) === JSON.stringify([2, N]));
      await page.keyboard.press(rtl ? "ArrowRight" : "ArrowLeft");
      s = await lbState(page);
      check(`${tag} ${rtl ? "ArrowRight" : "ArrowLeft"} = prev -> 1 / ${N} (${s.count})`, JSON.stringify(nums(s.count)) === JSON.stringify([1, N]));
      // Tab / Shift+Tab never leave the dialog
      let leaked = 0;
      for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); if (!(await lbState(page)).inside) leaked++; }
      for (let i = 0; i < 6; i++) { await page.keyboard.press("Shift+Tab"); if (!(await lbState(page)).inside) leaked++; }
      check(`${tag} 12 Tab/Shift+Tab presses: focus left the dialog ${leaked} times`, leaked === 0);
      // Escape closes and focus goes back to the tile
      await page.keyboard.press("Escape");
      s = await lbState(page);
      const back = await page.evaluate(() => document.activeElement === document.querySelector("[data-qa-first]"));
      check(`${tag} Esc closes the lightbox`, !s.shown);
      check(`${tag} focus returns to the tile that opened it`, back);
      // mouse open, scrim close
      await page.locator("[data-qa-first]").click();
      await page.waitForTimeout(300);
      s = await lbState(page);
      check(`${tag} mouse click opens it (${s.count})`, s.shown);
      await page.locator(".lb-close").click();
      s = await lbState(page);
      check(`${tag} close button closes`, !s.shown);
      // lightbox open -> scroll lock class removed
      check(`${tag} body.lb-open cleared after close`, await page.evaluate(() => !document.body.classList.contains("lb-open")));
    } else {
      // WebKit touch: a real swipe over the stage (pointer events as a touch would send them)
      const before = (await lbState(page));
      const box = await page.locator(".lb-stage").boundingBox();
      const y = box.y + box.height / 2;
      const x0 = box.x + box.width * (rtl ? 0.25 : 0.75), x1 = box.x + box.width * (rtl ? 0.75 : 0.25); // finger moves toward the "next" side
      await page.evaluate(({ x0, x1, y }) => {
        const el = document.elementFromPoint(x0, y) || document.body;
        const mk = (type, x) => new PointerEvent(type, { pointerId: 7, pointerType: "touch", isPrimary: true, bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, button: 0, buttons: type === "pointerup" ? 0 : 1 });
        el.dispatchEvent(mk("pointerdown", x0));
        for (let i = 1; i <= 8; i++) el.dispatchEvent(mk("pointermove", x0 + ((x1 - x0) * i) / 8));
        el.dispatchEvent(mk("pointerup", x1));
        try {
          const tch = (x) => new Touch({ identifier: 3, target: el, clientX: x, clientY: y });
          el.dispatchEvent(new TouchEvent("touchstart", { touches: [tch(x0)], targetTouches: [tch(x0)], changedTouches: [tch(x0)], bubbles: true, cancelable: true }));
          for (let i = 1; i <= 8; i++) { const xx = x0 + ((x1 - x0) * i) / 8; el.dispatchEvent(new TouchEvent("touchmove", { touches: [tch(xx)], targetTouches: [tch(xx)], changedTouches: [tch(xx)], bubbles: true, cancelable: true })); }
          el.dispatchEvent(new TouchEvent("touchend", { touches: [], targetTouches: [], changedTouches: [tch(x1)], bubbles: true, cancelable: true }));
        } catch {}
      }, { x0, x1, y });
      await page.waitForTimeout(400);
      s = await lbState(page);
      check(`${tag} a swipe never closes the lightbox or breaks the counter (${s.count})`, s.shown && !!nums(s.count));
      if (JSON.stringify(nums(s.count)) === JSON.stringify(nums(before.count))) KNOWN("F-13", `${tag} swiping the lightbox does nothing: no touch/swipe handler in the lightbox (main.js:3478-3750); only the two arrow buttons step`);
      else check(`${tag} swipe stepped to ${s.count}`, true);
      // close by the button, focus returns
      await page.locator(".lb-close").tap().catch(async () => { await page.evaluate(() => document.querySelector(".lb-close").click()); });
      s = await lbState(page);
      if (s.shown) { KNOWN("F-08", `${tag} tap on close gave no click`); await page.evaluate(() => document.querySelector(".lb-close").click()); s = await lbState(page); }
      check(`${tag} close button closes`, !s.shown);
    }
    check(`${tag} no console / page errors (${t.errs.length})`, t.errs.length === 0, t.errs.slice(0, 3).join(" | ").slice(0, 300));
  } finally { await browser.close(); }
}

// ----- deep links and odd ids -----
async function realFile(page) {
  return page.evaluate(() => {
    const i = document.querySelector('.tile img[src]:not([src^="data:"])');
    return i ? decodeURIComponent(new URL(i.src, location.href).pathname.split("/").pop()) : null;
  });
}
async function deepLinks(label, launch, vp, lang, ctxOpts) {
  const { browser, context, page } = await launch(vp, ctxOpts);
  const t = track(page);
  const tag = `${label} ${vp.width} ${lang}`;
  try {
    t.cur = tag;
    await load(page, "/library", lang);
    await firstTile(page);
    const file = await realFile(page);
    const base = await page.evaluate(() => ({ scripts: document.scripts.length, tabs: document.querySelectorAll(".acc-panel").length }));
    check(`${tag} a real archive file name found (${file})`, !!file);
    // valid ?open=
    t.cur = tag + " ?open=real";
    await load(page, "/library?open=" + encodeURIComponent(file), lang, 2600);
    let s = await lbState(page);
    check(`${tag} ?open=${file} opens the lightbox (${s.count})`, s.shown && !!s.img);
    check(`${tag} ?open= lands with focus inside the dialog (${s.ae})`, s.inside);
    await page.keyboard.press("Escape");
    check(`${tag} ?open= Esc closes it`, !(await lbState(page)).shown);
    // odd ?open= values: nothing opens, nothing breaks
    for (const [name, v] of [["unknown", "nope-does-not-exist.jpg"], ["empty-ish", "%20"], ["selector breaker", `"]'><script>window.__qa=1</script>`], ["__proto__", "__proto__"], ["constructor", "constructor"], ["%00", "%00"], ["2000 chars", "a".repeat(2000)], ["path", "../../etc/passwd"]]) {
      t.cur = `${tag} ?open=${name}`;
      const e0 = t.errs.length;
      const raw = v === "%00" || v === "%20" ? v : encodeURIComponent(v);
      const resp = await page.goto(ORIGIN + "/library?open=" + raw, { waitUntil: "load" });
      await page.waitForTimeout(1800);
      s = await lbState(page);
      const d = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, qa: window.__qa || 0, panels: document.querySelectorAll(".acc-panel").length, scripts: document.scripts.length }));
      const newErrs = t.errs.slice(e0);
      if (newErrs.length && newErrs.every((x) => /not a valid selector/.test(x))) { KNOWN("F-14", `${tag} ?open=${name}: openFromQuery() builds img[src$=\"/" + wantOpen + "\"] without CSS.escape (main.js:5129) and throws on a quote: ${newErrs[0].slice(0, 160)}`); t.errs.length = e0; }
      check(`${tag} ?open=${name}: HTTP ${resp.status()}, no overlay, no error, no injected script, no sideways scroll`, resp.status() === 200 && !s.shown && t.errs.length === e0 && d.qa === 0 && d.sw <= d.iw && d.panels > 0 && d.scripts === base.scripts, `${t.errs.slice(e0).join(" | ").slice(0, 200)} sw=${d.sw}/${d.iw} shown=${s.shown}`);
    }
    // odd ?client= ids = normal archive
    const ODD = [["constructor", "constructor"], ["__proto__", "__proto__"], ["toString", "toString"], ["hasOwnProperty", "hasOwnProperty"], ["%00", "%00"], ["2000 chars", "x".repeat(2000)], ["<script>", encodeURIComponent("<script>window.__qa=1</script>")], ["quote breaker", encodeURIComponent(`"><img src=x onerror=window.__qa=1>`)], ["unicode", encodeURIComponent("عميل-غير-موجود")], ["empty", ""]];
    for (const [name, raw] of ODD) {
      t.cur = `${tag} ?client=${name}`;
      const e0 = t.errs.length;
      const resp = await page.goto(ORIGIN + "/library?client=" + raw, { waitUntil: "load" });
      await page.waitForTimeout(2000);
      const d = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth, iw: innerWidth, qa: window.__qa || 0,
        header: !!document.querySelector(".lib-client .ch-name"), panels: document.querySelectorAll(".acc-panel").length,
        scripts: document.scripts.length, injected: document.querySelectorAll("img[onerror]").length, lang: document.documentElement.lang,
        clientsIdx: document.querySelectorAll(".lib-clients a").length,
      }));
      check(`${tag} ?client=${name}: HTTP ${resp.status()}, normal archive (${d.panels} panels, no client header), no error, nothing injected, no sideways scroll`,
        resp.status() === 200 && !d.header && d.panels === base.tabs && t.errs.length === e0 && d.qa === 0 && d.injected === 0 && d.scripts === base.scripts && d.sw <= d.iw,
        `${t.errs.slice(e0).join(" | ").slice(0, 200)} header=${d.header} panels=${d.panels}/${base.tabs} scripts=${d.scripts}/${base.scripts} sw=${d.sw}/${d.iw}`);
    }
    await shot(page, `Q17-${label}-${vp.width}-${lang}-odd-client`);
  } finally { await browser.close(); }
}

const dev = await startDev();
try {
  const eo = { isMobile: false, hasTouch: false, deviceScaleFactor: 1 };
  if (process.env.ONLY !== "webkit") {
    for (const lang of ["en", "ar"]) await keyboardJourney("edge", edge, VIEWPORTS.desktop, lang, {}, false);
    await keyboardJourney("edge", edge, VIEWPORTS.phone, "ar", {}, false);
    await deepLinks("edge", edge, VIEWPORTS.desktop, "en", {});
    await deepLinks("edge", edge, VIEWPORTS.phone, "ar", {});
  }
  if (process.env.ONLY !== "edge") {
    for (const lang of ["ar", "en"]) await keyboardJourney("webkit", webkit, VIEWPORTS.phone, lang, {}, true);
    await keyboardJourney("webkit", webkit, VIEWPORTS.desktop, "en", eo, false);
    await deepLinks("webkit", webkit, VIEWPORTS.phone, "ar", {});
  }
} catch (e) {
  check(`script ran to the end (${String(e.stack || e.message).split("\n").slice(0, 3).join(" / ").slice(0, 400)})`, false);
} finally { stopDev(dev); }
done();
