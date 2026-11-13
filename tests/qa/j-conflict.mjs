// Q-10: two tabs edit the same thing (text, gallery item, client): the second save must get a clear 409
// message, never overwrite silently, and the stale tab must be able to recover.
//   node tests/qa/j-conflict.mjs        (local wrangler dev on 8881; Edge 1440 + WebKit 390; ONLY=edge|webkit)
// Seeds + removes its own gallery item and client in the LOCAL store; the text key is reset at the end.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ROOT, shot, watch, check, done } from "./lib/harness.mjs";

const PHOTO = path.join(ROOT, "tests/gallery/fixtures/photo-plain.jpg");
const H = { origin: ORIGIN };
const KEY = "aboutBanner"; // max 18 chars

const draftText = (page, loc) =>
  page.evaluate(async ({ key, loc }) => {
    const c = await (await fetch("/api/admin/content")).json();
    return (c.text && c.text[key] && c.text[key][loc]) ?? null;
  }, { key: KEY, loc });
const state = (page) => page.locator(".ed-chip").getAttribute("data-state");

async function editReady(page) {
  await page.goto(ORIGIN + "/admin/edit/about", { waitUntil: "load" });
  await page.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"), null, { timeout: 30000 });
  await page.waitForTimeout(1200);
}
// A synthetic click: the real tap is F-08 in WebKit-mobile (see j-edit.mjs), not what this journey tests.
async function openPop(page) {
  await page.evaluate((k) => { const e = document.querySelector(`[data-ek="${k}"]`); e.scrollIntoView({ block: "center" }); e.click(); }, KEY);
  await page.waitForSelector(".ed-pop:not([hidden])", { timeout: 5000 });
}
const typeEn = async (page, v) => { await page.fill('.ed-pop textarea[data-loc="en"]', v); };
const savedChip = (page) => page.waitForFunction(() => document.querySelector(".ed-chip").getAttribute("data-state") === "saved", null, { timeout: 8000 }).then(() => true, () => false);

async function textConflict(label, ctx, a, b) {
  const n = Math.floor(Math.random() * 900 + 100);
  const [b0, a1, b1, a2, b2] = ["B0", "A1", "B1", "A2", "B2"].map((x) => `${x} ${n}`);
  await editReady(a); await editReady(b);
  await openPop(b); await typeEn(b, b0);
  check(`${label} text: tab B first save`, await savedChip(b) && (await draftText(b, "en")) === b0);
  await openPop(a); await typeEn(a, a1);
  check(`${label} text: tab A saves over B's value (A fetched the fresh rev)`, await savedChip(a) && (await draftText(a, "en")) === a1);

  // B is stale (holds rev of b0): its next save must 409
  await typeEn(b, b1);
  await b.waitForSelector('.ed-dialog[role="alertdialog"]', { timeout: 8000 }).catch(() => {});
  const dlg = b.locator('.ed-dialog[role="alertdialog"]');
  check(`${label} text: stale tab B gets the conflict dialog`, (await dlg.count()) === 1);
  const dtxt = (await dlg.textContent().catch(() => "")) || "";
  check(`${label} text: dialog names the key and shows both versions`, dtxt.includes(KEY) && dtxt.includes(a1) && dtxt.includes(b1), dtxt.slice(0, 140));
  check(`${label} text: chip says Conflict`, (await state(b)) === "conflict", await b.locator(".ed-chip").textContent());
  check(`${label} text: NO silent overwrite (draft is still A's)`, (await draftText(a, "en")) === a1);
  await shot(b, `Q10-${label}-text-conflict`);
  // recovery 1: Take theirs
  await b.click('.ed-dialog button:has-text("Take theirs")');
  await b.waitForTimeout(600);
  check(`${label} text: Take theirs closes the dialog and shows A's text in the popover`, (await dlg.count()) === 0 && (await b.inputValue('.ed-pop textarea[data-loc="en"]')) === a1, await b.inputValue('.ed-pop textarea[data-loc="en"]'));
  check(`${label} text: draft unchanged after Take theirs`, (await draftText(a, "en")) === a1);

  // recovery 2: A saves again, B types again from its (now refreshed) rev, then A saves, B conflicts, Keep mine
  await openPop(a); await typeEn(a, a2); await savedChip(a);
  await typeEn(b, b2);
  await b.waitForSelector('.ed-dialog[role="alertdialog"]', { timeout: 8000 }).catch(() => {});
  check(`${label} text: second conflict dialog`, (await b.locator('.ed-dialog[role="alertdialog"]').count()) === 1);
  check(`${label} text: still A's text in the draft while the dialog is open`, (await draftText(a, "en")) === a2);
  await b.click('.ed-dialog button:has-text("Keep mine")');
  await savedChip(b);
  await b.waitForTimeout(500);
  check(`${label} text: Keep mine saves B's text deliberately`, (await draftText(a, "en")) === b2, String(await draftText(a, "en")));
}

async function galleryConflict(label, a, b, item) {
  const open = async (p) => {
    await p.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
    await p.waitForSelector(".adm-tile", { timeout: 20000 });
    await p.click('.adm-tab[data-cat="photo"]');
    await p.locator(`.adm-tile[data-id="${item.id}"]`).click();
    await p.waitForSelector("#drawer[open]");
  };
  await open(a); await open(b);
  const n = Math.floor(Math.random() * 900 + 100);
  await a.fill("#d-alt-en", `A alt ${n}`);
  await a.click("#d-save");
  await a.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 });
  const cur = async () => (await (await a.context().request.get(ORIGIN + "/api/admin/gallery")).json()).items.find((i) => i.id === item.id);
  check(`${label} gallery: A saved`, (await cur()).alt.en === `A alt ${n}`);
  await b.fill("#d-alt-en", `B alt ${n}`);
  await b.click("#d-save");
  await b.waitForFunction(() => /changed elsewhere/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 }).catch(() => {});
  const msg = await b.locator("#drawer-msg").textContent();
  check(`${label} gallery: stale tab B gets a clear 409 message`, /changed elsewhere/.test(msg), msg);
  check(`${label} gallery: NO silent overwrite`, (await cur()).alt.en === `A alt ${n}`);
  check(`${label} gallery: form refilled with A's current value`, (await b.inputValue("#d-alt-en")) === `A alt ${n}`, await b.inputValue("#d-alt-en"));
  await shot(b, `Q10-${label}-gallery-conflict`);
  await b.fill("#d-alt-en", `B2 alt ${n}`);
  await b.click("#d-save");
  await b.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 8000 }).catch(() => {});
  check(`${label} gallery: retry after the refill saves`, (await cur()).alt.en === `B2 alt ${n}`, (await cur()).alt.en);
}

async function clientConflict(label, a, b, client) {
  const open = async (p) => {
    await p.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
    await p.locator(".adm-client", { hasText: client.name.en }).waitFor({ timeout: 20000 });
    await p.locator(".adm-client", { hasText: client.name.en }).locator('button:has-text("Edit")').click();
    await p.waitForSelector(".adm-cform");
  };
  await open(a); await open(b);
  const n = Math.floor(Math.random() * 900 + 100);
  await a.fill('.adm-cform input[name="name.en"]', `${client.name.en} A${n}`);
  await a.click('.adm-cform button[type="submit"]');
  await a.waitForFunction(() => /Saved/.test(document.getElementById("clients-note").textContent), null, { timeout: 8000 });
  const cur = async () => (await (await a.context().request.get(ORIGIN + "/api/admin/clients")).json()).clients.find((c) => c.id === client.id);
  check(`${label} client: A saved`, (await cur()).name.en.endsWith(`A${n}`));
  await b.fill('.adm-cform input[name="name.en"]', `${client.name.en} B${n}`);
  await b.click('.adm-cform button[type="submit"]');
  await b.waitForFunction(() => /changed elsewhere/.test(document.getElementById("clients-note").textContent), null, { timeout: 8000 }).catch(() => {});
  const msg = await b.locator("#clients-note").textContent();
  check(`${label} client: stale tab B gets a clear 409 message`, /changed elsewhere/.test(msg), msg);
  check(`${label} client: NO silent overwrite`, (await cur()).name.en.endsWith(`A${n}`), (await cur()).name.en);
  await shot(b, `Q10-${label}-client-conflict`);
  // recover: B opens Edit again (the list was refreshed with A's name), changes and saves
  await b.locator(".adm-client", { hasText: `A${n}` }).locator('button:has-text("Edit")').click();
  await b.fill('.adm-cform input[name="name.en"]', `${client.name.en} B${n}`);
  await b.click('.adm-cform button[type="submit"]');
  await b.waitForFunction(() => /Saved/.test(document.getElementById("clients-note").textContent), null, { timeout: 8000 }).catch(() => {});
  check(`${label} client: retry from the refreshed list saves`, (await cur()).name.en.endsWith(`B${n}`), (await cur()).name.en);
}

async function run(label, launch, vp) {
  const { browser, context, page: a } = await launch(vp);
  const b = await context.newPage();
  const wa = watch(a), wb = watch(b);
  const tag = Date.now().toString(36);
  let item, client;
  try {
    await a.goto(ORIGIN + "/admin/", { waitUntil: "load" }); // same-origin context for fetch()
    await textConflict(label, context, a, b);

    const up = await (await context.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `qa10-${tag}.jpg` }, data: fs.readFileSync(PHOTO) })).json();
    const put = await context.request.put(`${ORIGIN}/api/admin/gallery/${up.id}`, { headers: H, data: { src: up.url, cat: "photo", ratio: 1.5, date: "2026-01", baseRev: 0 } });
    item = (await put.json()).item; item.id = item.id || up.id;
    client = (await (await context.request.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "كيو", en: `QA10 ${tag}` } } })).json()).client;
    await galleryConflict(label, a, b, item);
    await clientConflict(label, a, b, client);
    for (const [n, w] of [["A", wa], ["B", wb]]) check(`${label} tab ${n}: no page errors`, !w.errors.some((e) => e.startsWith("pageerror")), w.errors.join(" | ").slice(0, 200));
    const noise = [...wa.errors, ...wb.errors].filter((e) => !e.startsWith("pageerror"));
    if (noise.length) console.log(`     console errors (${label}, expected 409s): ${[...new Set(noise)].join(" | ").slice(0, 300)}`);
  } catch (e) { check(`${label} journey ran`, false, String(e).slice(0, 300)); await shot(a, `Q10-${label}-failure`).catch(() => {}); }
  finally {
    try { // cleanup, local store only
      const items = (await (await context.request.get(ORIGIN + "/api/admin/gallery")).json()).items;
      const it = item && items.find((i) => i.id === item.id);
      if (it) await context.request.delete(`${ORIGIN}/api/admin/gallery/${it.id}?baseRev=${it.rev}`, { headers: H });
      const cl = (await (await context.request.get(ORIGIN + "/api/admin/clients")).json()).clients.find((c) => client && c.id === client.id);
      if (cl) await context.request.delete(`${ORIGIN}/api/admin/clients/${cl.id}?rev=${cl.rev}`, { headers: H });
      for (const loc of ["ar", "en"]) {
        const locks = (await (await context.request.get(ORIGIN + "/api/admin/content")).json()).locks.text;
        const rev = ((locks[KEY] || {})[loc]) || 0;
        if (rev) await context.request.delete(ORIGIN + "/api/admin/text", { headers: H, data: { key: KEY, locale: loc, baseRev: rev } });
      }
    } catch (e) { console.log("cleanup problem: " + e); }
    await browser.close();
  }
}

let dev;
try {
  dev = await startDev();
  const only = process.env.ONLY || "";
  if (!only || only === "edge") await run("edge-1440", edge, VIEWPORTS.desktop);
  if (!only || only === "webkit") await run("webkit-390", webkit, VIEWPORTS.phone);
} catch (e) { check("q10 ran", false, String(e)); }
finally { stopDev(dev); }
done();
