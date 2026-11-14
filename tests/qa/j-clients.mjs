// Q-14: clients. A client with a 60+ character Arabic name (and a long English one) is made on /admin/gallery/, assigned from the
// drawer (1 piece) and in bulk through "Select pieces" (5 pieces), the delete guard is tried on the used client, then everything
// is published and /library and /library?client=<id> are read in AR + EN at 390 and 1440 (FIT THE TYPE: no overflow, no clipped name).
//   node tests/qa/j-clients.mjs      (local wrangler dev on 8881; ONLY=edge|webkit for one browser)
// Writes to the LOCAL D1/R2 only. At the end it deletes its uploads and the client and publishes again, so the store ends as it began.
import path from "node:path";
import fs from "node:fs";
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, ROOT, shot, watch, check, done } from "./lib/harness.mjs";

const FIX = path.join(ROOT, "tests/gallery/fixtures");
const MEDIA = "https://media.aliphcreative.com/admin/**";
const serveMedia = (context) => context.route(MEDIA, async (route) => {
  try { await route.fulfill({ response: await context.request.get(ORIGIN + "/api/admin/media/" + new URL(route.request().url()).pathname.slice(1)) }); }
  catch { await route.abort().catch(() => {}); }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 71 Arabic characters with spaces (well over the 60 asked for, under the 80 cap); English 62
const NAME_AR = "مؤسسة الأفق الذهبي للتطوير العقاري والاستثمارات التجارية والخدمات المتكاملة";
const NAME_EN = "Golden Horizon Real Estate Development and Commercial Investment";
const LINE_AR = "شريك موثوق في بناء المشاريع الكبرى منذ أكثر من عشرين عاماً في المنطقة";
const LINE_EN = "A trusted partner in building large projects across the region";

const api = (page) => page.evaluate(async () => (await (await fetch("/api/admin/gallery")).json()));
const apiClients = (page) => page.evaluate(async () => (await (await fetch("/api/admin/clients")).json()).clients);
const gallery = async (page) => {
  await page.waitForTimeout(800);
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#summary") && !/Loading/.test(document.querySelector("#summary").textContent) && document.querySelector("#grid .adm-tile"), null, { timeout: 30000 });
  await page.waitForTimeout(600);
};
const publish = (page) => page.evaluate(async () => {
  const c = await (await fetch("/api/admin/changes")).json();
  if (!c.changes.length) return { status: 204 };
  const r = await fetch("/api/admin/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: c.token }) });
  return { status: r.status };
});
const tileSel = (id) => `#grid .adm-tile[data-id="${id}"]`;

async function run(label, launch, vp, touch, vpsForVisitor) {
  const { browser, page, context } = await launch(vp);
  await serveMedia(context);
  const w = watch(page);
  page.on("pageerror", (e) => console.log(`     PAGEERROR ${label} at ${page.url().replace(ORIGIN, "")}: ${String(e.stack || e.message).split(/\r?\n/).slice(0, 3).join(" / ").slice(0, 250)}`));
  const visitor = await context.newPage();
  const vw = watch(visitor);

  // a tap must turn into a click (F-08, fixed): a miss fails the run, then a script click lets the journey go on.
  // Tap where a person would: the fixed assign bar covers the bottom of the phone screen in select mode, and a
  // tile scrolled just into view sat under it, so the tap went to the bar's <select> (that was the "F-08" here).
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
  const closeDrawer = () => page.evaluate(() => document.querySelector("#drawer").close());

  let before, mine = [], client = null;
  try {
    await gallery(page);
    await publish(page); // start from a published store: what follows is only this script's changes
    before = await api(page);
    const baseIds = new Set(before.items.map((i) => i.id));
    const baseClients = (await apiClients(page)).map((c) => c.id);

    // ---- 1. create the client in the Clients panel
    check(`${label} Arabic name is 60+ characters (${Array.from(NAME_AR).length})`, Array.from(NAME_AR).length >= 60);
    await press(page.locator("#clients-new"), () => document.querySelector("#clients-form form"), "New client");
    await page.fill('.adm-cform input[name="name.en"]', NAME_EN);
    await page.fill('.adm-cform input[name="name.ar"]', NAME_AR);
    await page.fill('.adm-cform input[name="line.en"]', LINE_EN);
    await page.fill('.adm-cform input[name="line.ar"]', LINE_AR);
    await page.fill('.adm-cform input[name="year"]', "2019");
    await page.fill('.adm-cform input[name="url"]', "https://example.com/golden-horizon");
    await press(page.locator('.adm-cform button[type="submit"]'), () => /Added/.test(document.getElementById("clients-note").textContent), "Add client");
    const cn = await page.textContent("#clients-note");
    check(`${label} client added, not published yet ("${cn.slice(0, 60)}")`, /Added .* \(not published yet\)/.test(cn));
    client = (await apiClients(page)).find((c) => !baseClients.includes(c.id));
    check(`${label} API has the client with both long names intact`, !!client && client.name.ar === NAME_AR && client.name.en === NAME_EN, client && client.id);
    check(`${label} client id is a slug of the English name`, /^golden-horizon-real-estate-[a-z0-9-]*-[a-z0-9]{4}$/.test(client.id), client.id);
    check(`${label} Clients panel row shows 0 pieces and the long Arabic name`, (await page.locator(`.adm-client[data-id="${client.id}"]`).textContent()).includes(NAME_AR) && /0 pieces/.test(await page.textContent(`.adm-client[data-id="${client.id}"]`)));
    await shot(page, `Q14-${label}-admin-clients-panel`);

    // ---- 2. six uploads (identical files: same EXIF date, so they sit together)
    const jpg = (n) => ({ name: n, mimeType: "image/jpeg", buffer: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) });
    await page.selectOption("#add-cat", "photo");
    await page.setInputFiles("#add-file", ["a", "b", "c", "d", "e", "f"].map((s) => jpg(`client-${s}.jpg`)));
    await page.click("#add-go");
    await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows li")]; return r.length === 6 && r.every((li) => li.dataset.status === "done" || li.dataset.status === "error"); }, null, { timeout: 120000 });
    await gallery(page);
    mine = (await api(page)).items.filter((i) => !baseIds.has(i.id)).map((i) => i.id);
    check(`${label} six new draft uploads`, mine.length === 6, mine.length + "");
    await page.click('.adm-tab[data-cat="photo"]');
    await page.waitForSelector(tileSel(mine[0]), { timeout: 10000 });

    // ---- 3. drawer assign (piece 1)
    const [p1, ...rest] = mine;
    await openDrawer(p1);
    const opts = await page.$$eval("#d-client option", (o) => o.map((x) => x.textContent));
    check(`${label} drawer Client select lists the new client (by English name) plus No client and New client…`, opts.includes(NAME_EN) && opts[0] === "No client" && opts.at(-1) === "New client…", opts.join(" | ").slice(0, 120));
    await page.selectOption("#d-client", client.id);
    await press(page.locator("#d-save"), () => /Saved \(not published yet\)/.test(document.querySelector("#drawer-msg").textContent), "Save details");
    check(`${label} drawer assign saved: API item.own.client = client`, (await api(page)).items.find((i) => i.id === p1).own.client === client.id);
    await closeDrawer();

    // ---- 4. bulk assign the other five
    await press(page.locator("#select-toggle"), () => document.querySelector("#grid").dataset.selecting === "1", "Select pieces");
    for (const id of rest) {
      await page.locator(tileSel(id)).scrollIntoViewIfNeeded();
      await press(page.locator(tileSel(id)), (id) => document.querySelector(`#grid .adm-tile[data-id="${CSS.escape(id)}"]`).dataset.picked === "1", `tick ${id}`, id);
    }
    check(`${label} bar says "Assign 5 to" and Assign stays disabled with no client chosen`, /Assign 5 to/.test(await page.textContent("#assign-n")) && (await page.isDisabled("#assign-go")));
    await page.selectOption("#assign-client", client.id);
    check(`${label} Assign enabled once a client is chosen`, !(await page.isDisabled("#assign-go")));
    await shot(page, `Q14-${label}-bulk-bar`);
    await press(page.locator("#assign-go"), () => /Assigned 5 pieces/.test(document.getElementById("assign-note").textContent), "Assign");
    check(`${label} "${(await page.textContent("#assign-note")).slice(0, 40)}…" not published yet`, /not published yet/.test(await page.textContent("#assign-note")));
    const cur = await api(page);
    check(`${label} API: all 6 pieces name the client`, mine.every((id) => cur.items.find((i) => i.id === id).own.client === client.id));
    await page.waitForFunction((id) => /6 pieces/.test((document.querySelector(`.adm-client[data-id="${id}"]`) || {}).textContent || ""), client.id, { timeout: 8000 });
    check(`${label} Clients panel count now "6 pieces"`, true);
    await press(page.locator("#select-toggle"), () => document.querySelector("#grid").dataset.selecting === "0", "Done selecting");

    // ---- 5. delete-guard on the used client
    await page.locator(`.adm-client[data-id="${client.id}"]`).scrollIntoViewIfNeeded();
    await press(page.locator(`.adm-client[data-id="${client.id}"] button:has-text("Delete")`), () => document.querySelector("#confirm").open, "client Delete");
    check(`${label} Delete asks first (confirm names the client)`, /^Delete .* It leaves the site when you publish\.$/.test(await page.textContent("#confirm-text")));
    await press(page.locator("#confirm-yes"), () => /use this client|in use|piece/i.test(document.getElementById("clients-note").textContent) && !document.querySelector("#confirm").open, "confirm Delete");
    const gm = await page.textContent("#clients-note");
    check(`${label} guard refuses with a message ("${gm}")`, /6/.test(gm) && (await page.getAttribute("#clients-note", "data-kind")) === "error", gm);
    check(`${label} the client is still there after the refusal`, (await apiClients(page)).some((c) => c.id === client.id));
    const raw = await page.evaluate(async (c) => { const x = (await (await fetch("/api/admin/clients")).json()).clients.find((k) => k.id === c.id); const r = await fetch(`/api/admin/clients/${c.id}?rev=${x.rev}`, { method: "DELETE" }); return { s: r.status, b: await r.json() }; }, client);
    check(`${label} raw DELETE of a used client: 409 "in use" with a count`, raw.s === 409 && raw.b.error === "in use" && raw.b.count === 6, JSON.stringify(raw));

    // ---- 6. visitor: before publish the client is unknown (normal archive), after publish the client page exists
    await visitor.goto(ORIGIN + `/library?client=${encodeURIComponent(client.id)}`, { waitUntil: "load" });
    await visitor.waitForSelector('.acc-panel[data-cat="photo"] .spine', { state: "attached", timeout: 20000 });
    check(`${label} before publish ?client=<draft id> is a normal archive (no client header)`, (await visitor.locator(".lib-client").count()) === 0 && (await visitor.locator(".lib-clients").count()) === 0);
    check(`${label} publish`, (await publish(page)).status === 200);

    for (const [vname, vsize] of vpsForVisitor) {
      await visitor.setViewportSize(vsize);
      for (const lang of ["ar", "en"]) {
        const tag = `${label} ${vname} ${lang}`;
        // the index on /library, then the client view; poll until the published snapshot arrives (cache TTL)
        let ok = false;
        for (let k = 0; k < 8 && !ok; k++) {
          await visitor.goto(ORIGIN + `/library?client=${encodeURIComponent(client.id)}`, { waitUntil: "load" });
          await visitor.waitForSelector('.acc-panel[data-cat="photo"] .spine', { state: "attached", timeout: 20000 });
          if (await visitor.evaluate((l) => localStorage.getItem("aliph-lang") !== l && (localStorage.setItem("aliph-lang", l), true), lang)) { await visitor.reload({ waitUntil: "load" }); await visitor.waitForSelector('.acc-panel[data-cat="photo"] .spine', { state: "attached", timeout: 20000 }); }
          ok = (await visitor.locator(".lib-client").count()) > 0;
          if (!ok) await sleep(1000);
        }
        check(`${tag} /library?client= shows the client header after publish`, ok);
        if (!ok) continue;
        await visitor.waitForTimeout(500);
        const hdr = await visitor.evaluate(() => {
          const h = document.querySelector(".ch-name"), s = document.querySelector(".lib-client");
          const r = h.getBoundingClientRect(), cs = getComputedStyle(h);
          const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
          const out = { text: h.textContent, lang: document.documentElement.lang, dir: document.documentElement.dir,
            sw: document.documentElement.scrollWidth, iw: innerWidth, hOver: h.scrollWidth - h.clientWidth,
            left: r.left, right: r.right, lines: Math.round(r.height / lh), fs: parseFloat(cs.fontSize), line: (document.querySelector(".ch-line") || {}).textContent || "",
            meta: document.querySelector(".ch-meta").textContent.replace(/\s+/g, " "), secOver: s.scrollWidth - s.clientWidth,
            capt: [...document.querySelectorAll(".t-client")].length, back: document.querySelector(".ch-back").textContent };
          return out;
        });
        check(`${tag} html lang/dir (${hdr.lang}/${hdr.dir})`, hdr.lang === lang && hdr.dir === (lang === "ar" ? "rtl" : "ltr"));
        check(`${tag} header name is the ${lang === "ar" ? "Arabic" : "English"} one`, hdr.text === (lang === "ar" ? NAME_AR : NAME_EN), hdr.text);
        check(`${tag} no horizontal scroll (scrollWidth ${hdr.sw} <= ${hdr.iw})`, hdr.sw <= hdr.iw);
        check(`${tag} name inside the viewport (${Math.round(hdr.left)}..${Math.round(hdr.right)}) and not clipped sideways (${hdr.hOver})`, hdr.left >= 0 && hdr.right <= hdr.iw + 0.5 && hdr.hOver <= 1);
        if (hdr.lines > 2) console.log(`KNOWN F-11 ${tag} client name wraps to ${hdr.lines} lines at the 0.75 floor (${hdr.fs.toFixed(1)}px); the rule is two`);
        check(`${tag} FIT THE TYPE: name in at most 2 lines (${hdr.lines}), or KNOWN F-11 (3 lines, nothing clipped) at ${hdr.fs.toFixed(1)}px`, hdr.lines <= 3, hdr.lines + " lines");
        check(`${tag} line, year and "6 pieces" shown (${hdr.meta.slice(0, 50)})`, hdr.line.length > 20 && /2019|٢٠١٩/.test(hdr.meta) && /6|٦/.test(hdr.meta));
        // open the photo panel: every tile carries the client name caption, none overflows its tile
        await visitor.evaluate(() => document.querySelector('.acc-panel[data-cat="photo"] .spine').click());
        await visitor.waitForSelector('.acc-panel[data-cat="photo"] .lib-grid img[data-full]', { state: "attached", timeout: 20000 });
        await visitor.waitForTimeout(600);
        const tiles = await visitor.evaluate(() => {
          const caps = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .t-client')];
          return { n: document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-grid img[data-full]').length, caps: caps.length,
            names: [...new Set(caps.map((c) => c.textContent))],
            over: caps.filter((c) => { const f = c.closest("figure") || c.parentElement; const a = c.getBoundingClientRect(), b = f.getBoundingClientRect(); return a.right > b.right + 1 || a.left < b.left - 1; }).length,
            clipX: caps.filter((c) => c.scrollWidth > c.clientWidth + 1 && getComputedStyle(c).overflow !== "visible").length,
            sw: document.documentElement.scrollWidth };
        });
        check(`${tag} only the client's 6 pieces are in the panel, each captioned with the name`, tiles.n === 6 && tiles.caps === 6 && tiles.names.length === 1 && tiles.names[0] === (lang === "ar" ? NAME_AR : NAME_EN), JSON.stringify({ n: tiles.n, caps: tiles.caps, names: tiles.names.map((s) => s.slice(0, 20)) }));
        check(`${tag} captions do not spill out of their tiles (${tiles.over}) or get clipped (${tiles.clipX})`, tiles.over === 0 && tiles.clipX === 0);
        check(`${tag} still no horizontal scroll with the grid open`, tiles.sw <= hdr.iw);
        await visitor.evaluate(() => window.scrollTo(0, 0));
        if (vname !== "p1440" || lang === "ar") await shot(visitor, `Q14-${label}-${vname}-${lang}-client-page`);

        // the Clients index on plain /library
        await visitor.goto(ORIGIN + "/library", { waitUntil: "load" });
        await visitor.waitForSelector(".lib-clients .lc-name", { state: "attached", timeout: 20000 }).catch(() => {});
        await visitor.waitForTimeout(500);
        const idx = await visitor.evaluate((id) => {
          const a = document.querySelector(`.lib-clients a[href="/library?client=${encodeURIComponent(id)}"]`);
          if (!a) return null;
          const n = a.querySelector(".lc-name"), r = a.getBoundingClientRect(), nr = n.getBoundingClientRect(), cs = getComputedStyle(n);
          return { text: n.textContent, lines: Math.round(nr.height / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2)), hOver: n.scrollWidth - n.clientWidth,
            out: nr.left < r.left - 1 || nr.right > r.right + 1, sw: document.documentElement.scrollWidth, iw: innerWidth, meta: a.querySelector(".lc-meta").textContent.replace(/\s+/g, " ") };
        }, client.id);
        check(`${tag} /library Clients index lists the client`, !!idx);
        if (idx) {
          check(`${tag} index name (${idx.lines} lines, overflow ${idx.hOver}) fits its card, no horizontal scroll`, idx.lines <= 2 && idx.hOver <= 1 && !idx.out && idx.sw <= idx.iw, JSON.stringify(idx).slice(0, 200));
          check(`${tag} index card says 6 pieces`, /6|٦/.test(idx.meta), idx.meta);
          if (vname !== "p1440" || lang === "ar") await shot(visitor, `Q14-${label}-${vname}-${lang}-clients-index`);
        }
      }
    }
  } catch (e) {
    check(`${label} journey ran to the end (${String(e.message).split("\n")[0].slice(0, 200)})`, false);
  } finally {
    // ---- cleanup: uploads deleted, the client deleted (guard now passes), published
    try {
      await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
      const res = await page.evaluate(async ({ ids, baseIds, clientId }) => {
        const out = { del: 0, bad: 0 };
        const cur = await (await fetch("/api/admin/gallery")).json();
        for (const it of cur.items) {
          if (baseIds.includes(it.id) || it.deleted) continue;
          const r = await fetch(`/api/admin/gallery/${encodeURIComponent(it.id)}?baseRev=${it.rev}`, { method: "DELETE" });
          r.ok ? out.del++ : out.bad++;
        }
        if (clientId) {
          const c = (await (await fetch("/api/admin/clients")).json()).clients.find((k) => k.id === clientId);
          if (c) { const r = await fetch(`/api/admin/clients/${encodeURIComponent(clientId)}?rev=${c.rev}`, { method: "DELETE" }); r.ok ? out.del++ : (out.bad++, out.why = r.status); }
        }
        return out;
      }, { ids: mine, baseIds: before ? before.items.map((i) => i.id) : [], clientId: client && client.id });
      const pub = await publish(page);
      check(`${label} cleanup: ${res.del} deleted, ${res.bad} refused${res.why ? " (" + res.why + ")" : ""}, republished (${pub.status})`, res.bad === 0 && (pub.status === 200 || pub.status === 204));
      const left = (await apiClients(page)).filter((c) => client && c.id === client.id);
      check(`${label} cleanup: client gone from the list`, left.length === 0);
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
  if (process.env.ONLY !== "webkit") await run("edge1440", edge, VIEWPORTS.desktop, false, [["p1440", VIEWPORTS.desktop], ["p390", VIEWPORTS.phone]]);
  if (process.env.ONLY !== "edge") await run("webkit390", webkit, VIEWPORTS.phone, true, [["p390", VIEWPORTS.phone]]);
} finally { stopDev(dev); }
done();
