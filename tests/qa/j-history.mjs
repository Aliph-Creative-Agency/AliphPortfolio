// Q-15: History / Restore / Discard on /admin/edit/. Publish A (text + gallery item + client), publish B (all three changed,
// a second client added): visitor shows B. History -> Restore A -> the DRAFT is A again (text, item alt, client rows; B's extra client
// staged as removed) while the visitor still shows B; Publish -> visitor shows A. Then a draft edit -> Discard -> back to the published A.
//   node tests/qa/j-history.mjs      (local wrangler dev on 8881; ONLY=edge|webkit)
// LOCAL D1/R2 only. Cleans up its text key, item and clients and publishes the store back.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ROOT, shot, watch, check, done } from "./lib/harness.mjs";

const PHOTO = path.join(ROOT, "tests/gallery/fixtures/photo-plain.jpg");
const H = { origin: ORIGIN };
const KEY = "aboutBanner"; // <= 18 chars
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(label, launch, vp, touch) {
  const { browser, context, page } = await launch(vp);
  const w = watch(page);
  const visitor = await context.newPage();
  const vw = watch(visitor);
  const R = context.request;
  const get = async (p) => (await R.get(ORIGIN + p)).json();
  const tag = Date.now().toString(36).slice(-4);
  const [tA, tB, tD] = ["QA A " + tag, "QA B " + tag, "QA D " + tag]; // text values, 9 chars
  let item, ca, cb, revA, revB, base = null;

  const textRev = async (loc) => (((await get("/api/admin/content")).locks.text[KEY] || {})[loc]) || 0;
  const setText = async (v) => { const r = await R.put(ORIGIN + "/api/admin/text", { headers: H, data: { key: KEY, locale: "en", value: v, baseRev: await textRev("en") } }); return r.status(); };
  const draftText = async () => (((await get("/api/admin/content")).text[KEY]) || {}).en ?? null;
  const items = async () => (await get("/api/admin/gallery")).items;
  const clients = async () => (await get("/api/admin/clients")).clients;
  const setItem = async (alt, client) => { const it = (await items()).find((i) => i.id === item); const r = await R.put(`${ORIGIN}/api/admin/gallery/${encodeURIComponent(item)}`, { headers: H, data: { ...it.own, alt: { en: alt }, client, baseRev: it.rev } }); return r.status(); };
  const setClient = async (c, name) => { const cur = (await clients()).find((k) => k.id === c.id); const r = await R.put(`${ORIGIN}/api/admin/clients/${c.id}`, { headers: H, data: { name: { ar: "كيو", en: name }, line: { en: name + " line" }, rev: cur.rev } }); return r.status(); };
  const publishApi = async () => { const c = await get("/api/admin/changes"); if (!c.changes.length) return 204; const r = await R.post(ORIGIN + "/api/admin/publish", { headers: H, data: { token: c.token } }); return r.status(); };
  const nChanges = async () => (await get("/api/admin/changes")).changes.length;
  const revs = async () => (await get("/api/admin/revisions?limit=50"));
  const visitorAbout = async (want) => { // poll until the banner reads `want` (publish cache)
    let last = "";
    for (let k = 0; k < 10; k++) {
      await visitor.goto(ORIGIN + "/about", { waitUntil: "load" });
      if (await visitor.evaluate(() => localStorage.getItem("aliph-lang") !== "en" && (localStorage.setItem("aliph-lang", "en"), true))) await visitor.reload({ waitUntil: "load" });
      await visitor.waitForSelector(`[data-i18n="${KEY}"]`, { state: "attached", timeout: 20000 });
      await visitor.waitForTimeout(700);
      last = (await visitor.locator(`[data-i18n="${KEY}"]`).first().textContent()).trim();
      if (last === want) return { ok: true, last };
      await sleep(1000);
    }
    return { ok: false, last };
  };
  const visitorClient = async (id, want) => { // /library?client=<id>: "pieces" (header + work), "empty" (published client, no visible piece: header + a line saying so), "none" (unknown id: normal archive)
    let st = "";
    for (let k = 0; k < 10; k++) {
      await visitor.goto(ORIGIN + `/library?client=${encodeURIComponent(id)}`, { waitUntil: "load" });
      await visitor.waitForSelector(".lib-client, .lib-clients, .acc-panel", { state: "attached", timeout: 8000 }).catch(() => {});
      await visitor.waitForTimeout(700);
      st = await visitor.evaluate(() => (document.querySelector(".lib-client") ? (document.querySelector(".ch-empty") ? "empty" : "pieces") : "none"));
      if (st === want) return true;
      await sleep(1000);
    }
    console.log("     visitorClient " + id + " wanted " + want + " got " + st);
    return false;
  };
  // a bar/modal click: a real click on desktop, a script click on WebKit-mobile (F-08, not what this journey tests)
  const hit = async (sel, nth = 0) => { const l = page.locator(sel).nth(nth); if (touch) await l.evaluate((e) => e.click()); else await l.click({ timeout: 6000 }); };
  const editor = async (q = "") => {
    await sleep(800);
    await page.goto(ORIGIN + "/admin/edit/about" + q, { waitUntil: "load" });
    await page.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"), null, { timeout: 30000 });
    await page.waitForTimeout(1000);
  };

  try {
    await page.goto(ORIGIN + "/admin/", { waitUntil: "load" });
    await publishApi(); // start from a published store
    base = { text: await draftText() };
    const upl = await (await R.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `qa15-${tag}.jpg` }, data: fs.readFileSync(PHOTO) })).json();
    const put = await R.put(`${ORIGIN}/api/admin/gallery/${upl.id}`, { headers: H, data: { src: upl.url, cat: "photo", ratio: 1.5, date: "2026-01", baseRev: 0 } });
    item = ((await put.json()).item || {}).id || upl.id;
    ca = (await (await R.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "كيو", en: `QA15 A ${tag}` }, line: { en: "line A" } } })).json()).client;

    // ---- publish A
    check(`${label} set A: text, item alt + client`, (await setText(tA)) === 200 && (await setItem("alt A", ca.id)) === 200);
    check(`${label} publish A`, (await publishApi()) === 200);
    revA = (await revs())[0];
    const itA0 = (await items()).find((i) => i.id === item), cA0 = (await clients()).find((c) => c.id === ca.id);
    const snapA = { alt: itA0.alt.en, client: itA0.own.client, cname: cA0.name.en, cline: cA0.line };
    check(`${label} revision A is the newest in /revisions (id ${revA.id}) and lists changes`, !!revA && revA.changed.length > 0);

    // ---- publish B: everything changed, a second client
    cb = (await (await R.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "كيو", en: `QA15 B ${tag}` } } })).json()).client;
    check(`${label} set B: text, item alt + client -> B's client, first client renamed`, (await setText(tB)) === 200 && (await setItem("alt B", cb.id)) === 200 && (await setClient(ca, `QA15 A2 ${tag}`)) === 200);
    check(`${label} publish B`, (await publishApi()) === 200);
    revB = (await revs())[0];
    check(`${label} revision B is newer than A`, revB.id > revA.id, `${revA.id} -> ${revB.id}`);
    let v = await visitorAbout(tB);
    check(`${label} visitor shows B ("${v.last}")`, v.ok);
    check(`${label} visitor: B's client page has the piece, A's client is published with no piece (header + empty line)`, (await visitorClient(cb.id, "pieces")) && (await visitorClient(ca.id, "empty")));

    // ---- History panel, Restore A
    await editor("?history");
    await page.waitForSelector("#ed-history:not([hidden]) .ed-rev", { timeout: 10000 });
    const ids = await page.$$eval("#ed-history .ed-rev", (s) => s.map((x) => ({ id: +x.dataset.rev, live: !!x.querySelector(".ed-rev-live") })));
    check(`${label} History lists revisions newest first, only B is "live" (${ids.slice(0, 3).map((x) => x.id + (x.live ? "*" : "")).join(" ")})`, ids[0].id === revB.id && ids[0].live && ids.filter((x) => x.live).length === 1 && ids.some((x) => x.id === revA.id));
    const metaB = await page.textContent(`#ed-history .ed-rev[data-rev="${revB.id}"] .ed-rev-changes`);
    check(`${label} revision B row names its changes ("${metaB.slice(0, 70)}")`, /change/.test(metaB));
    await shot(page, `Q15-${label}-history`);
    check(`${label} draft is clean before the restore`, (await nChanges()) === 0);
    await hit(`#ed-history .ed-rev[data-rev="${revA.id}"] .ed-reset`);
    await page.waitForSelector('.ed-dialog[aria-label^="Restore revision"]', { timeout: 6000 });
    const dtxt = await page.textContent(".ed-dialog");
    check(`${label} Restore asks first and says nothing goes live until Publish`, dtxt.includes(`revision ${revA.id}`) && /does not change until you publish/.test(dtxt), dtxt.slice(0, 120));
    await hit(".ed-dialog .is-primary");
    await page.waitForSelector(".ed-toast:not([hidden])", { timeout: 15000 });
    const toast = await page.textContent(".ed-toast");
    check(`${label} toast: "${toast.slice(0, 60)}"`, new RegExp(`Revision ${revA.id} is in the draft`).test(toast));
    await shot(page, `Q15-${label}-restored`);
    check(`${label} draft text is A again`, (await draftText()) === tA, String(await draftText()));
    const itA = (await items()).find((i) => i.id === item);
    check(`${label} draft gallery item matches A (alt "${itA.alt.en}", client ${itA.own.client})`, itA.alt.en === snapA.alt && itA.own.client === snapA.client);
    const cs = await clients();
    const caNow = cs.find((c) => c.id === ca.id);
    check(`${label} draft client A matches A (name "${caNow && caNow.name.en}", line ${JSON.stringify(caNow && caNow.line)})`, !!caNow && caNow.name.en === snapA.cname && JSON.stringify(caNow.line) === JSON.stringify(snapA.cline));
    check(`${label} client B (not in A) is staged as removed, not in the list`, !cs.some((c) => c.id === cb.id));
    const nc = await nChanges();
    check(`${label} the draft differs from live B (${nc} changes)`, nc >= 3);
    v = await visitorAbout(tB);
    check(`${label} visitor STILL shows B until Publish ("${v.last}")`, v.ok);
    check(`${label} publish A again`, (await publishApi()) === 200);
    v = await visitorAbout(tA);
    check(`${label} visitor shows A ("${v.last}")`, v.ok);
    check(`${label} visitor: A's client page has the piece, B's client is unknown again (normal archive)`, (await visitorClient(ca.id, "pieces")) && (await visitorClient(cb.id, "none")));
    const rl = await revs();
    check(`${label} History has a newer revision on top (${rl[0].id} > ${revB.id})`, rl[0].id > revB.id);
    const live = (await items()).find((i) => i.id === item);
    check(`${label} gallery row is A's (alt "${live.alt.en}") with no pending change`, live.alt.en === snapA.alt && !live.changed);

    // ---- Discard
    check(`${label} draft edit: text, item alt`, (await setText(tD)) === 200 && (await setItem("alt D", ca.id)) === 200);
    await editor();
    await page.waitForFunction(() => /Publish \(\d+\)/.test(document.querySelector(".ed-bar").textContent), null, { timeout: 10000 });
    check(`${label} Discard enabled with draft changes`, !(await page.isDisabled(".ed-discard")));
    await hit(".ed-discard");
    await page.waitForSelector('.ed-dialog[aria-label^="Discard"]', { timeout: 6000 });
    const dd = await page.textContent(".ed-dialog");
    check(`${label} Discard asks first and lists the changes ("${dd.slice(0, 70)}")`, /Discard \d+ unpublished change/.test(dd) && dd.includes("content comes back"));
    await shot(page, `Q15-${label}-discard-dialog`);
    await hit(".ed-dialog .is-primary");
    await page.waitForFunction(() => !document.querySelector(".ed-dialog"), null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    check(`${label} after Discard the draft text is the published A (${JSON.stringify(await draftText())})`, (await draftText()) === tA);
    check(`${label} after Discard the item alt is A's and no changes remain (${await nChanges()})`, (await items()).find((i) => i.id === item).alt.en === snapA.alt && (await nChanges()) === 0);
    await page.waitForFunction(() => document.querySelector(".ed-bar button.ed-discard").disabled, null, { timeout: 8000 }).catch(() => {});
    check(`${label} Discard is disabled again`, await page.isDisabled(".ed-discard"));
    v = await visitorAbout(tA);
    check(`${label} visitor still shows A`, v.ok);
  } catch (e) {
    check(`${label} journey ran to the end (${String(e.message || e).split("\n")[0].slice(0, 220)})`, false);
    await shot(page, `Q15-${label}-failure`).catch(() => {});
  } finally {
    try { // cleanup: text key reset, item + clients deleted, published
      for (const loc of ["ar", "en"]) { const rev = await textRev(loc); if (rev) await R.delete(ORIGIN + "/api/admin/text", { headers: H, data: { key: KEY, locale: loc, baseRev: rev } }); }
      const it = item && (await items()).find((i) => i.id === item);
      if (it) await R.delete(`${ORIGIN}/api/admin/gallery/${encodeURIComponent(it.id)}?baseRev=${it.rev}`, { headers: H });
      for (const c of [ca, cb]) { const cur = c && (await clients()).find((k) => k.id === c.id); if (cur) await R.delete(`${ORIGIN}/api/admin/clients/${cur.id}?rev=${cur.rev}`, { headers: H }); }
      const p = await publishApi();
      check(`${label} cleanup: store published back (${p}), draft text ${JSON.stringify(await draftText())}`, (p === 200 || p === 204) && (await nChanges()) === 0 && (await draftText()) === (base ? base.text : null));
    } catch (e) { check(`${label} cleanup ran (${e})`, false); }
    for (const [what, wch] of [["admin", w], ["visitor", vw]]) {
      const errs = wch.errors.filter((e) => !/Failed to load resource/.test(e));
      check(`${label} ${what} pages: no script errors`, errs.length === 0, errs.slice(0, 3).join(" | ").slice(0, 300));
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
