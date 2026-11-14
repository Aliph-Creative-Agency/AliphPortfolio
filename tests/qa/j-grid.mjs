// Q-13: the gallery grid on /admin/gallery/: hide / unhide, delete / restore, reorder a section, ring picks.
// Desktop (Edge 1440: mouse drag + keyboard) and phone (WebKit 390: touch taps, Earlier / Later buttons), each followed by a
// publish and a look at the visitor pages: /library (the Photos sub order, hidden and deleted pieces gone) and / (the photo ring).
//   node tests/qa/j-grid.mjs      (local wrangler dev on 8881; ONLY=edge|webkit for one browser)
// Writes to the LOCAL D1/R2 only. It uploads 3 photos, edits them and one default piece, and at the end removes the
// uploads, reverts the default piece and the order / ring overrides and publishes again, so the store ends as it began.
import path from "node:path";
import fs from "node:fs";
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ROOT, shot, watch, check, done } from "./lib/harness.mjs";

const FIX = path.join(ROOT, "tests/gallery/fixtures");
const MEDIA = "https://media.aliphcreative.com/admin/**";
const serveMedia = (context) => context.route(MEDIA, async (route) => {
  try { await route.fulfill({ response: await context.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }); }
  catch { await route.abort().catch(() => {}); }
});

const api = (page) => page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()));
const gallery = async (page) => {
  await page.waitForTimeout(800);
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#summary") && !/Loading/.test(document.querySelector("#summary").textContent) && document.querySelector("#grid .adm-tile"), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  // style.css has `scroll-behavior: smooth`: a drag whose target is off screen scrolls while the pointer is down and drops on the
  // wrong tile (grown local DB = a long grid). A person's drag auto-scrolls instantly under the pointer, so scroll instantly here.
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  // U-08: on the phone the ring panels load folded; this journey is about the picks, not the fold
  await page.evaluate(() => document.querySelectorAll("details.adm-ring-box:not([open])").forEach((d) => { d.open = true; }));
};
const publish = (page) => page.evaluate(async () => {
  const c = await (await fetch("/api/admin/changes")).json();
  if (!c.changes.length) return { status: 204 };
  const r = await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) });
  return { status: r.status };
});
const base = (u) => String(u || "").split("?")[0].split("/").pop();
const tileSel = (id) => `#grid .adm-tile[data-id="${id}"]`;
// style.css has `scroll-behavior: smooth`: a drag started before the scroll settles drops on the wrong spot
const mid = async (page, sel) => { await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), sel); await page.waitForTimeout(900); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(label, launch, vp, touch) {
  const { browser, page, context } = await launch(vp);
  await serveMedia(context);
  const w = watch(page);
  page.on("pageerror", (e) => console.log(`     PAGEERROR ${label} at ${page.url().replace(ORIGIN, "")}: ${String(e.stack || e.message).split(/\r?\n/).slice(0, 3).join(" / ").slice(0, 250)}`));
  const visitor = await context.newPage();
  const vw = watch(visitor);

  // a tap must turn into a click (F-08, fixed): a miss fails the run, then a script click lets the journey go on.
  // Tap where a person would: a fixed bar can cover a tile scrolled just into view, so scroll it to the middle first.
  // Saves take ~1 s on a grown local DB (one took 9 s), so the outcome gets 10 s.
  const covered = (l) => l.evaluate((e) => { const r = e.getBoundingClientRect(); return !e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); });
  const press = async (loc, ok, what, arg = null) => {
    if (touch && (await covered(loc))) {
      await loc.evaluate((e) => e.scrollIntoView({ block: "center" }));
      let still = true; // the page scrolls smoothly: wait for it to settle
      for (let i = 0; i < 20 && still; i++) { await page.waitForTimeout(150); still = await covered(loc); }
      check(`${label} ${what} is not covered where it is tapped`, !still);
    }
    if (touch) await loc.tap({ force: true, timeout: 5000 }).catch(() => {}); else await loc.click({ force: true, timeout: 5000 });
    if (await page.waitForFunction(ok, arg, { timeout: 10000 }).then(() => true, () => false)) return;
    if (!touch) throw new Error("click had no effect: " + what);
    check(`${label} tap on ${what} gives a click (F-08)`, false, "fell back to a script click");
    await loc.evaluate((e) => e.click());
    await page.waitForFunction(ok, arg, { timeout: 5000 });
  };
  const openDrawer = async (id) => {
    await page.locator(tileSel(id)).scrollIntoViewIfNeeded();
    await press(page.locator(tileSel(id)), () => document.querySelector("#drawer").open, `tile ${id}`);
    await page.waitForFunction((id) => document.querySelector("#drawer-title").textContent === id.split("/").pop(), id, { timeout: 5000 });
  };
  const drawerAct = async (btn) => {
    await press(page.locator("#" + btn), (t) => new RegExp(t).test(document.querySelector("#drawer-msg").textContent), "#" + btn, "^(Hidden|Unhidden|Saved|Deleted|Reverted)[^.]* .not published yet.");
    return page.textContent("#drawer-msg");
  };
  const closeDrawer = () => page.evaluate(() => document.querySelector("#drawer").close());
  const item = async (id) => (await api(page)).items.find((i) => i.id === id);
  const order = (ids) => page.evaluate((ids) => { const all = [...document.querySelectorAll('.adm-run[data-run="photos"] .adm-tile')].map((t) => t.dataset.id); return ids.map((i) => all.indexOf(i)); }, ids);
  const photosOrder = (ids) => page.evaluate((ids) => { const all = [...document.querySelectorAll('.adm-run[data-run="photos"] .adm-tile')].map((t) => t.dataset.id); return all.filter((i) => ids.includes(i)); }, ids);

  const visitorLib = async (items, fn) => { // poll /library until fn(basenames in the photo panel, in DOM order) holds
    let last = [];
    for (let k = 0; k < 8; k++) {
      await visitor.goto(ORIGIN + "/library", { waitUntil: "load" });
      await visitor.waitForSelector('.acc-panel[data-cat="photo"] .spine', { state: "attached", timeout: 20000 });
      await visitor.evaluate(() => document.querySelector('.acc-panel[data-cat="photo"] .spine').click());
      await visitor.waitForSelector('.acc-panel[data-cat="photo"] .lib-grid img[data-full]', { state: "attached", timeout: 20000 });
      last = await visitor.evaluate(() => [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-grid img[data-full]')].map((i) => i.dataset.full.split("?")[0].split("/").pop()));
      if (fn(last)) return { ok: true, last };
      await sleep(1000);
    }
    return { ok: false, last };
  };
  const visitorRing = async (fn) => {
    let last = [];
    for (let k = 0; k < 8; k++) {
      await visitor.goto(ORIGIN + "/", { waitUntil: "load" });
      await visitor.waitForSelector('.ring-stage[data-service="photo"] .ring-item', { state: "attached", timeout: 20000 });
      last = await visitor.evaluate(() => [...document.querySelectorAll('.ring-stage[data-service="photo"] .ring-item')].map((b) => (b.dataset.full || "").split("?")[0].split("/").pop()));
      if (fn(last)) return { ok: true, last };
      await sleep(1000);
    }
    return { ok: false, last };
  };

  let before, mine = [], d = null;
  try {
    await gallery(page);
    await publish(page); // start from a published store: what follows is only this script's changes
    before = await api(page);
    const baseKind = new Map(before.items.map((i) => [i.id, i.kind]));
    const baseIds = new Set(before.items.map((i) => i.id));

    // ---- 0. three uploads to work on
    const jpg = (n, f) => ({ name: n, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(FIX, f)) });
    await page.selectOption("#add-cat", "photo");
    await page.setInputFiles("#add-file", [jpg("one.jpg", "photo-plain.jpg"), jpg("two.jpg", "photo-plain.jpg"), jpg("three.jpg", "photo-plain.jpg")]);
    await page.click("#add-go");
    await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows li")]; return r.length === 3 && r.every((li) => li.dataset.status === "done" || li.dataset.status === "error"); }, null, { timeout: 90000 });
    await gallery(page);
    mine = (await api(page)).items.filter((i) => !baseIds.has(i.id)).map((i) => i.id);
    check(`${label} three new draft uploads`, mine.length === 3, mine.join(","));
    const it0 = await item(mine[0]);
    check(`${label} uploads land in the Photo tab, non-video (cat ${it0.cat})`, it0.cat === "photo" && !it0.video);
    // a default photo to hide as well (never a video, never in the photo ring by default)
    const ring0 = before.rings.photo.ids;
    d = before.items.find((i) => i.cat === "photo" && i.kind === "default" && !i.video && !i.hidden && !i.deleted && !ring0.includes(i.id)).id;
    await page.click('.adm-tab[data-cat="photo"]');
    await page.waitForSelector(tileSel(mine[0]), { timeout: 10000 });
    const [a, b, c] = mine;

    // ---- 1. hide, delete (drawer), then publish and look at /library
    await openDrawer(b);
    let m = await drawerAct("d-hide");
    check(`${label} Hide says it is not published yet ("${m}")`, /Hidden \(not published yet\)/.test(m));
    check(`${label} hidden tile is badged and the API agrees`, (await page.getAttribute(tileSel(b), "data-hidden")) === "1" && (await item(b)).hidden === true);
    await closeDrawer();

    await openDrawer(c);
    if (!touch) { // keyboard path: Delete button by Enter, the confirm dialog by Enter
      await page.focus("#d-delete"); await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.querySelector("#confirm").open, null, { timeout: 4000 });
      check(`${label} Delete asks first (confirm dialog, keyboard)`, /Delete .* It leaves the site when you publish/.test(await page.textContent("#confirm-text")));
      await page.focus("#confirm-yes"); await page.keyboard.press("Enter");
    } else {
      await press(page.locator("#d-delete"), () => document.querySelector("#confirm").open, "#d-delete");
      check(`${label} Delete asks first (confirm dialog, touch)`, /Delete .* It leaves the site when you publish/.test(await page.textContent("#confirm-text")));
      await press(page.locator("#confirm-yes"), () => /Deleted \(not published yet\)/.test(document.querySelector("#drawer-msg").textContent), "#confirm-yes");
    }
    await page.waitForFunction(() => /Deleted \(not published yet\)/.test(document.querySelector("#drawer-msg").textContent), null, { timeout: 8000 });
    check(`${label} deleted upload is struck in the grid and the API agrees`, (await page.getAttribute(tileSel(c), "data-removed")) === "1" && (await item(c)).deleted === true);
    await closeDrawer();

    await openDrawer(d);
    m = await drawerAct("d-hide");
    check(`${label} default piece ${d} hidden`, /Hidden \(not published yet\)/.test(m) && (await item(d)).hidden === true && (await item(d)).kind === "override");
    await closeDrawer();
    await shot(page, `Q13-${label}-grid-hidden-deleted`);

    const names = (ids) => ids.map(base);
    const fullOf = async (id) => base((await item(id)).full);
    const [fa, fb, fc, fd] = [await fullOf(a), await fullOf(b), await fullOf(c), await fullOf(d)];
    let before1 = await visitorLib(null, (l) => l.includes(fd));
    check(`${label} before publish the visitor still shows the default piece and none of the drafts`, before1.ok && !before1.last.includes(fa) && !before1.last.includes(fb) && !before1.last.includes(fc));
    check(`${label} publish`, (await publish(page)).status === 200);
    let v = await visitorLib(null, (l) => l.includes(fa) && !l.includes(fb) && !l.includes(fc) && !l.includes(fd));
    check(`${label} /library after publish: a is shown; hidden b, deleted c and hidden default piece are gone`, v.ok, JSON.stringify({ fa, fb, fc, fd, n: v.last.length }));

    // ---- 2. unhide, restore: back on /library
    await gallery(page);
    await page.click('.adm-tab[data-cat="photo"]');
    await openDrawer(b);
    m = await drawerAct("d-hide");
    check(`${label} Unhide says so ("${m}")`, /Unhidden \(not published yet\)/.test(m) && (await item(b)).hidden === false);
    await closeDrawer();
    await openDrawer(c);
    m = await drawerAct("d-restore");
    check(`${label} Restore brings the deleted upload back`, (await item(c)).deleted === false && (await page.getAttribute(tileSel(c), "data-removed")) === "0", m);
    await closeDrawer();
    await openDrawer(d);
    await press(page.locator("#d-revert"), () => document.querySelector("#confirm").open, "#d-revert");
    await press(page.locator("#confirm-yes"), () => /Reverted/.test(document.querySelector("#drawer-msg").textContent), "#confirm-yes");
    check(`${label} Revert to default on the hidden default piece: back to kind default, visible`, (await item(d)).kind === "default" && (await item(d)).hidden === false);
    await closeDrawer();
    check(`${label} publish`, (await publish(page)).status === 200);
    v = await visitorLib(null, (l) => l.includes(fa) && l.includes(fb) && l.includes(fc) && l.includes(fd));
    check(`${label} /library after unhide + restore + revert: a, b, c and the default piece are back`, v.ok, JSON.stringify(v.last.length));

    // ---- 3. reorder the Photos section
    await gallery(page);
    await page.click('.adm-tab[data-cat="photo"]');
    await page.waitForSelector('.adm-run[data-run="photos"] [data-act="reorder"]', { timeout: 8000 });
    const [x, y, z] = await photosOrder(mine); // their order in the grid now; the goal is z, x, y
    await press(page.locator('.adm-run[data-run="photos"] [data-act="reorder"]'), () => !!document.querySelector('.adm-run[data-reorder="1"]'), "Reorder");
    check(`${label} Reorder mode on: Save disabled until something moves, tiles open no drawer`, await page.isDisabled('[data-act="save-order"]'));
    await mid(page, tileSel(x));
    await page.click(tileSel(x), { force: true }).catch(() => {});
    check(`${label} in Reorder mode a tile click opens no drawer`, !(await page.evaluate(() => document.querySelector("#drawer").open)));
    if (!touch) {
      await mid(page, tileSel(x));
      await page.locator(tileSel(z)).dragTo(page.locator(tileSel(x)));
      let o = await photosOrder(mine);
      check(`${label} mouse drag z onto x: order ${names(o).map((s) => s.slice(0, 6)).join(" ")} (z first)`, o[0] === z && o[1] === x && o[2] === y, JSON.stringify(o));
      // keyboard: pick x up, move it right, Escape puts it back; then pick up, right, left, Enter drops it
      await mid(page, tileSel(x));
      await page.focus(tileSel(x)); await page.keyboard.press("Enter"); await page.keyboard.press("ArrowRight");
      o = await photosOrder(mine);
      check(`${label} keyboard: Enter picks x up, ArrowRight moves it after y`, o[1] === y && o[2] === x, JSON.stringify(o));
      await page.keyboard.press("Escape");
      o = await photosOrder(mine);
      check(`${label} keyboard: Escape puts it back`, o[0] === z && o[1] === x && o[2] === y && /Move cancelled/.test(await page.textContent('.adm-run[data-reorder="1"] .adm-run-note')), JSON.stringify(o));
      await page.keyboard.press("Enter"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("Enter");
      o = await photosOrder(mine);
      check(`${label} keyboard: Enter, Right, Left, Enter drop leaves z x y`, o[0] === z && o[1] === x && o[2] === y && /Dropped at position/.test(await page.textContent('.adm-run[data-reorder="1"] .adm-run-note')), JSON.stringify(o));
    } else {
      for (let k = 0; k < 8; k++) {
        const o = await photosOrder(mine);
        if (o.indexOf(z) < o.indexOf(x)) break;
        await press(page.locator(`${tileSel(z)}`).locator("xpath=..").locator("button", { hasText: "Earlier" }), (n) => true, `Earlier of ${z}`);
        await page.waitForTimeout(150);
      }
      const o = await photosOrder(mine);
      check(`${label} touch: Earlier on z until it precedes x (z x y)`, o[0] === z && o[1] === x && o[2] === y, JSON.stringify(o));
    }
    await shot(page, `Q13-${label}-reorder`);
    check(`${label} Save order is enabled after the move`, !(await page.isDisabled('[data-act="save-order"]')));
    await press(page.locator('[data-act="save-order"]'), () => /Order saved/.test((document.querySelector(".adm-run-note") || {}).textContent || ""), "Save order");
    check(`${label} "Order saved (not published yet)." and reorder mode left`, !(await page.$('.adm-run[data-reorder="1"]')));
    const its = await Promise.all([z, x, y].map(item));
    check(`${label} API: z, x, y carry ascending sort values`, its.every((i) => Number.isFinite(i.own.sort)) && its[0].own.sort < its[1].own.sort && its[1].own.sort < its[2].own.sort, JSON.stringify(its.map((i) => i.own.sort)));
    await gallery(page);
    await page.click('.adm-tab[data-cat="photo"]');
    const o2 = await photosOrder(mine);
    check(`${label} reload: the saved order holds (z x y)`, o2[0] === z && o2[1] === x && o2[2] === y, JSON.stringify(o2));
    check(`${label} publish`, (await publish(page)).status === 200);
    const [fz, fx, fy] = await Promise.all([z, x, y].map(fullOf));
    v = await visitorLib(null, (l) => l.indexOf(fz) >= 0 && l.indexOf(fz) < l.indexOf(fx) && l.indexOf(fx) < l.indexOf(fy));
    check(`${label} /library: z, x, y in the saved order`, v.ok, JSON.stringify([fz, fx, fy].map((f) => v.last.indexOf(f))));

    // ---- 4. ring picks: photo ring = x, y, z, then reorder to z, x, y
    await gallery(page);
    const box = '.adm-ring-box[data-service="photo"]';
    let guard = 0;
    while ((await page.locator(`${box} .adm-pick`).count()) > 0 && guard++ < 30) {
      await page.locator(`${box} .adm-pick`).first().locator("button", { hasText: "Remove" }).click({ force: true });
    }
    check(`${label} ring emptied by Remove: Save disabled, "needs at least one item"`, (await page.isDisabled(`${box} [data-act=save]`)) && /at least one/.test(await page.textContent(`${box} .adm-ring-note`)));
    for (const id of [x, y, z]) {
      await page.click(`${box} [data-act=add]`);
      await page.waitForSelector("#picker[open]", { timeout: 4000 });
      await press(page.locator(`#picker-list button[data-id="${id}"]`), () => true, `picker ${id}`);
      await page.waitForFunction((id) => !document.querySelector(`#picker-list button[data-id="${id}"]`), id, { timeout: 4000 }).catch(() => {});
      await page.evaluate(() => document.querySelector("#picker").close());
    }
    const pickIds = () => page.evaluate((s) => [...document.querySelectorAll(`${s} .adm-pick`)].map((p) => p.dataset.id), box);
    check(`${label} ring now x, y, z from the picker`, JSON.stringify(await pickIds()) === JSON.stringify([x, y, z]), JSON.stringify(await pickIds()));
    if (!touch) {
      await page.locator(`${box} .adm-pick[data-id="${z}"]`).dragTo(page.locator(`${box} .adm-pick[data-id="${x}"]`));
      check(`${label} ring mouse drag z onto x: z x y`, JSON.stringify(await pickIds()) === JSON.stringify([z, x, y]), JSON.stringify(await pickIds()));
      await page.focus(`${box} .adm-pick[data-id="${x}"]`); await page.keyboard.press("Alt+End");
      check(`${label} ring keyboard Alt+End on x: z y x`, JSON.stringify(await pickIds()) === JSON.stringify([z, y, x]), JSON.stringify(await pickIds()));
      await page.keyboard.press("Alt+ArrowLeft");
      check(`${label} ring keyboard Alt+ArrowLeft on x: z x y`, JSON.stringify(await pickIds()) === JSON.stringify([z, x, y]), JSON.stringify(await pickIds()));
    } else {
      for (let k = 0; k < 2; k++) await press(page.locator(`${box} .adm-pick[data-id="${z}"] button`, { hasText: "Earlier" }), () => true, `ring Earlier of ${z}`);
      check(`${label} ring touch: Earlier twice on z: z x y`, JSON.stringify(await pickIds()) === JSON.stringify([z, x, y]), JSON.stringify(await pickIds()));
    }
    check(`${label} ring shows "unsaved edits"`, /unsaved edits/.test(await page.textContent(`${box} .adm-ring-sub`)));
    await shot(page, `Q13-${label}-ring`);
    await press(page.locator(`${box} [data-act=save]`), () => /Saved \(not published yet\)/.test(document.querySelector('.adm-ring-box[data-service="photo"] .adm-ring-note').textContent), "Save ring");
    check(`${label} API ring photo = [z, x, y], custom picks`, JSON.stringify((await api(page)).rings.photo.ids) === JSON.stringify([z, x, y]) && !(await api(page)).rings.photo.isDefault);
    await gallery(page);
    check(`${label} reload: ring panel still z x y, "changed, not published"`, JSON.stringify(await pickIds()) === JSON.stringify([z, x, y]) && /changed, not published/.test(await page.textContent(`${box} .adm-ring-sub`)));
    check(`${label} publish`, (await publish(page)).status === 200);
    const r = await visitorRing((l) => l.length === 3 && l[0] === fz && l[1] === fx && l[2] === fy);
    check(`${label} / photo ring is z, x, y (3 pieces)`, r.ok, JSON.stringify(r.last));
    await shot(visitor, `Q13-${label}-visitor-home`);
  } catch (e) {
    check(`${label} journey ran to the end (${String(e.message).split("\n")[0].slice(0, 200)})`, false);
  } finally {
    // ---- cleanup: uploads removed, default piece and the overrides reverted, ring reset, published
    try {
      await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
      const res = await page.evaluate(async ({ baseKind, baseRing }) => {
        const out = { del: 0, bad: 0 };
        const cur = await (await fetch("/api/admin/gallery")).json();
        for (const it of cur.items) {
          const was = baseKind[it.id];
          const drop = was === undefined ? !(it.kind === "upload" && it.deleted) : (was === "default" && it.kind === "override") || (was === "override" && false);
          if (!drop) continue;
          const r = await fetch(`/api/admin/gallery/${encodeURIComponent(it.id)}?baseRev=${it.rev}`, { method: "DELETE" });
          r.ok ? out.del++ : out.bad++;
        }
        const ring = cur.rings.photo;
        if (baseRing && !ring.isDefault) { const r = await fetch(`/api/admin/rings/photo?baseRev=${ring.rev}`, { method: "DELETE" }); r.ok ? out.del++ : out.bad++; }
        return out;
      }, { baseKind: before ? Object.fromEntries(before.items.map((i) => [i.id, i.kind])) : {}, baseRing: before ? before.rings.photo.isDefault : false });
      const pub = await publish(page);
      check(`${label} cleanup: ${res.del} reverted/deleted, ${res.bad} refused, republished (${pub.status})`, res.bad === 0 && (pub.status === 200 || pub.status === 204));
      const after = await api(page);
      const left = after.items.filter((i) => !i.deleted && !(before?.items || []).some((b) => b.id === i.id) );
      check(`${label} cleanup: no stray upload left visible`, left.length === 0, left.map((i) => i.id).join(","));
    } catch (e) { check(`${label} cleanup ran (${e.message})`, false); }
    for (const [what, wch] of [["admin", w], ["visitor", vw]]) {
      const errs = wch.errors.filter((e) => !/Failed to load resource/.test(e));
      check(`${label} ${what} pages: no script errors${wch.errors.length - errs.length ? ` (${wch.errors.length - errs.length} failed resource loads ignored)` : ""}`, errs.length === 0, errs.slice(0, 3).join(" | ").slice(0, 300));
    }
    await browser.close();
  }
}

const dev = await startDev();
try {
  if (process.env.ONLY !== "webkit") await run("edge1440", edge, VIEWPORTS.desktop, false);
  if (process.env.ONLY !== "edge") await run("webkit390", webkit, VIEWPORTS.phone, true);
} finally { stopDev(dev); }
done();
