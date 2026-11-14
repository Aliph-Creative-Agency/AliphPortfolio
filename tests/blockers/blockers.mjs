// Blockers: U-04 gallery bar + Publish, U-20 film frame pick. Run: PORT=8891 INSPECTOR=9291 node tests/blockers/blockers.mjs
import { startDev, stopDev, edge, webkit, ORIGIN, VIEWPORTS, check, done, watch } from "../qa/lib/harness.mjs";

const dev = await startDev();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gallery(label, mk, touch) {
  const { browser, page } = await mk();
  const w = watch(page);
  page.on("response", (r) => { if (r.status() === 404) w.errors.push("404 " + r.url()); });
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  const dash = page.locator('.adm-topbar a[href="/admin/"]');
  check(`${label} gallery has Dashboard link`, await dash.isVisible());
  for (const h of ["/admin/edit/", "/admin/edit/about", "/admin/edit/library"]) check(`${label} link ${h}`, await page.locator(`.adm-topbar a[href="${h}"]`).isVisible());
  const bh = await page.locator("#pub-btn").evaluate((e) => e.getBoundingClientRect().height);
  const dh = await dash.evaluate((e) => e.getBoundingClientRect().height);
  check(`${label} touch targets >= 44px`, bh >= 44 && dh >= 44, `${bh}/${dh}`);
  check(`${label} no horizontal scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  // make a draft change, then publish from the gallery
  const val = "B" + (Date.now() % 1e8);
  const put = await page.evaluate(async (value) => {
    const c = await (await fetch("/api/admin/content")).json();
    const reg = await (await fetch("/api/admin/registry")).json();
    const key = reg.text.find((t) => t.page === "home" || (t.pages || []).includes("home")).key;
    const rev = (c.locks && c.locks.text && c.locks.text[key + "|en"]) || (c.locks && c.locks.text && c.locks.text[key]) || 0;
    const send = (b) => fetch("/api/admin/text", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, locale: "en", value, baseRev: b }) });
    let r = await send(typeof rev === "number" ? rev : 0);
    if (r.status === 409) r = await send((await r.json()).current.rev);
    return r.status + " " + key + " " + JSON.stringify(await r.json().catch(() => ({})));
  }, val);
  check(`${label} draft text saved`, String(put).startsWith("200"), String(put));
  await page.waitForFunction(() => /Publish \(\d+\)/.test(document.getElementById("pub-btn").textContent), null, { timeout: 15000 });
  check(`${label} Publish enabled with count`, await page.locator("#pub-btn").isEnabled());
  if (touch) await page.locator("#pub-btn").tap(); else await page.locator("#pub-btn").click();
  await page.waitForSelector("#pub-dlg[open]");
  if (touch) await page.locator("#pub-yes").tap(); else await page.locator("#pub-yes").click();
  await page.waitForFunction(() => /^Published\./.test(document.getElementById("pub-state").textContent), null, { timeout: 15000 });
  const ch = await page.evaluate(async () => (await (await fetch("/api/admin/changes")).json()).changes.length);
  check(`${label} published, no draft changes left`, ch === 0, String(ch));
  check(`${label} no console errors`, w.errors.filter((e) => !/Failed to load resource|^404 https:\/\/media\./.test(e)).length === 0, w.errors.join(" | "));
  await browser.close();
}
async function film(label, mk, touch) {
  const { browser, page } = await mk();
  const w = watch(page);
  await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
  await page.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar") && document.querySelectorAll(".film-frame").length > 8, null, { timeout: 30000 });
  await sleep(1500);
  // which slot do we expect: the frame index + 1; pick a clone (no data-es) in the viewport for 2 and 3, any for 1
  for (const k of [0, 1, 2]) {
    await page.evaluate(() => window.aliphEditorMedia && window.aliphEditorMedia.close());
    await page.evaluate(() => document.querySelector(".filmstrip").scrollIntoView({ block: "center" }));
    let pos = null;
    for (let t = 0; t < 40 && !pos; t++) { pos = await pick(page, k); if (!pos) await sleep(250); }
    const hit = pos && await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); const f = e && e.closest(".film-frame"); return f ? "frame" + f.dataset.frame : (e ? e.tagName + "." + e.className : "none"); }, pos);
    check(`${label} frame ${k + 1} visible`, !!pos, String(hit));
    if (!pos) continue;
    if (touch) await page.touchscreen.tap(pos.x, pos.y); else await page.mouse.click(pos.x, pos.y);
    await page.waitForSelector("#ed-media:not([hidden])", { timeout: 5000 }).catch(() => {});
    const label2 = await page.evaluate(() => { const d = document.getElementById("ed-media"); return d && !d.hidden ? d.textContent : ""; });
    check(`${label} ${pos.clone ? "clone of " : ""}frame ${k + 1} opens home.film.${k + 1}`, label2.includes("home.film." + (k + 1)), `hit=${hit} ` + label2.slice(0, 60));
  }
  check(`${label} no console errors`, w.errors.length === 0, w.errors.join(" | "));
  await browser.close();
}
function pick(page, k) {
  return (async () => {
    const pos = await page.evaluate(({ k }) => {
      const vw = innerWidth, vh = innerHeight;
      const fr = [...document.querySelectorAll('.film-frame[data-frame="' + k + '"]')].map((el) => ({ el, r: el.getBoundingClientRect(), clone: !el.hasAttribute("data-es") }))
        .filter((o) => { const cx = o.r.left + o.r.width / 2, cy = o.r.top + o.r.height / 2; return cx > 10 && cx < vw - 10 && cy > 10 && cy < vh - 10; });
      // a point on the frame that really hits it (hero text can sit over part of it)
      const spot = (o) => {
        for (const fy of [0.5, 0.2, 0.8, 0.35, 0.65]) for (const fx of [0.5, 0.2, 0.8, 0.35, 0.65]) {
          const x = o.r.left + o.r.width * fx, y = o.r.top + o.r.height * fy;
          if (x < 5 || x > vw - 5 || y < 5 || y > vh - 5) continue;
          const e = document.elementFromPoint(x, y);
          if (e && e.closest(".film-frame") === o.el) return { x, y, clone: o.clone };
        }
        return null;
      };
      const order = k === 0 ? fr : fr.filter((x) => x.clone).concat(fr);
      for (const o of order) { const p = spot(o); if (p) return p; }
      return null;
    }, { k });
    return pos;
  })();
}
try {
  await gallery("edge1440", () => edge(VIEWPORTS.desktop), false);
  await gallery("webkit390", () => webkit(VIEWPORTS.phone), true);
  await film("edge1440", () => edge(VIEWPORTS.desktop), false);
  await film("webkit390", () => webkit(VIEWPORTS.phone), true);
} catch (e) { check("run", false, String(e && e.stack || e)); }
stopDev(dev);
done();
