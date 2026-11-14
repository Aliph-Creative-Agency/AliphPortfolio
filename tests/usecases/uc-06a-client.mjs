// UC-06a create client C1 (EN + long AR name, line, year, website), bulk-assign 4 pieces, publish (CASES.md UC-06a).
// node tests/usecases/uc-06a-client.mjs [--only edge|webkit]
// Start state = UC-05a's end state: step 0 replays the upload (here only the 4 pieces the case uses: photo-1..3 + video) with no
// reset in between. WebKit ENV LIMIT: this Playwright WebKit cannot decode blob: video, so the video row is seeded through the
// app's own upload module + gallery API (see uc-05a). Real iPhone: verify by hand.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, check, done } from "./lib/uc.mjs";
import { lookA, checker, rect, overlaps } from "./lib/look.mjs";

const UC = "UC-06a";
const MEDIA = path.join(ORCH, "media");
const FILES = [1, 2, 3].map((i) => path.join(MEDIA, `photo-${i}.jpg`)).concat(path.join(MEDIA, "video.mp4"));
const PIECES = ["photo-1", "photo-2", "photo-3", "video"];
const C1 = {
  en: "Jabal al-Mukabbir Social Affairs Office", ar: "مكتب الشؤون الاجتماعية في جبل المكبر للتنمية المجتمعية",
  lineEn: "Community programmes", lineAr: "برامج مجتمعية", year: "2025", url: "https://example.org/c1",
};

// LOCAL-ONLY ARTEFACT: uploads get https://media.aliphcreative.com/admin/... URLs the real host does not have locally
async function mapMedia(context) {
  await context.route("https://media.aliphcreative.com/admin/**", async (r) => {
    try { await r.fulfill({ response: await r.fetch({ url: ORIGIN + "/api/admin/media/" + new URL(r.request().url()).pathname.slice(1) }) }); } catch { await r.abort().catch(() => {}); }
  });
}

async function run(cfg) {
  startRun(UC, cfg.name);
  const { browser, page, context } = await cfg.open();
  await mapMedia(context);
  const S = (n, slug, expect, fn) => step(page, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const api = (p = "gallery") => page.evaluate(async (p) => (await (await fetch("/api/admin/" + p)).json()), p);
  const open = async () => { await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" }); await page.waitForFunction(() => /items,/.test(document.getElementById("summary").textContent), null, { timeout: 15000 }); await page.waitForTimeout(900); };
  const photoTab = async () => { await tapOrClick(page, '#tabs button[data-cat="photo"]', cfg); await page.waitForTimeout(600); };
  const key = (id) => id.replace(/^[a-z0-9]+-/, "");
  const newIds = {};
  const tile = (k) => `.adm-tile[data-id="${newIds[k]}"]`;
  const msg = async (sel) => ((await page.locator(sel).textContent()) || "").trim();
  const fillC1 = async () => {
    const f = (n) => page.locator(`#clients-form input[name="${n}"]`);
    await f("name.en").fill(C1.en); await f("name.ar").fill(C1.ar); await f("line.en").fill(C1.lineEn); await f("line.ar").fill(C1.lineAr);
    await f("year").fill(C1.year); await f("url").fill(C1.url);
  };
  const formRead = () => page.evaluate(() => { const f = document.querySelector(".adm-cform"); if (!f) return null; const o = {}; for (const i of f.querySelectorAll("input")) o[i.name] = i.value; return o; });
  const owners = async () => { const j = await api(); return PIECES.map((k) => { const it = j.items.find((x) => x.id === newIds[k]); return it && (it.own?.client ?? it.client); }); };
  let c1 = null;

  try {
    await S(0, "replay-uc05a", "UC-05a replayed without reset: photo-1..3 + video uploaded into Photo", async (c) => {
      await open();
      const j0 = await api(); const ids0 = new Set(j0.items.map((x) => x.id));
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      const sub = (await page.evaluate(() => [...document.querySelectorAll("#add-sub option")].map((o) => o.value))).find(Boolean);
      await page.locator("#add-sub").selectOption(sub); await page.waitForTimeout(300);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, "#add-zone", cfg)]);
      await fc.setFiles(FILES); await page.waitForTimeout(800);
      await tapOrClick(page, "#add-go", cfg);
      await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length === 4 && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, null, { timeout: 120000 });
      const bad = await page.evaluate(() => [...document.querySelectorAll("#add-rows .adm-row")].filter((r) => r.dataset.status !== "done").map((r) => [r.querySelector(".adm-rname").textContent, r.querySelector(".adm-rmsg").textContent]));
      if (cfg.name === "webkit" && bad.length === 1 && /video/.test(bad[0][0]) && /could not be read/.test(bad[0][1])) {
        const r = await page.evaluate(async ({ bytes, posterB, sub }) => {
          const M = await import("/admin/shared/media.js");
          const film = await M.upload(new File([Uint8Array.from(atob(bytes), (x) => x.charCodeAt(0))], "video.mp4", { type: "video/mp4" }), "video.mp4", {});
          const pb = await (await fetch("data:image/jpeg;base64," + posterB)).blob();
          const poster = await M.upload(pb, "poster", { posterFor: film.key });
          const put = await fetch("/api/admin/gallery/" + encodeURIComponent(film.id), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: film.url, poster: poster.url, ratio: 1.778, date: "2026-11", cat: "photo", sub, baseRev: 0 }) });
          return { status: put.status, id: film.id };
        }, { bytes: fs.readFileSync(path.join(MEDIA, "video.mp4")).toString("base64"), posterB: fs.readFileSync(path.join(MEDIA, "photo-1.jpg")).toString("base64"), sub });
        c.note("ENV LIMIT: webkit cannot decode video; seeded through the app's upload + API " + JSON.stringify(r)); c.ok(r.status === 200, "seeding failed");
      } else c.ok(bad.length === 0, `rows failed ${JSON.stringify(bad)}`);
      await page.waitForTimeout(1200);
      await open(); await photoTab();
      const fresh = (await api()).items.filter((x) => !ids0.has(x.id));
      fresh.forEach((x) => { newIds[key(x.id)] = x.id; });
      c.ok(fresh.length === 4 && PIECES.every((k) => newIds[k]), `new keys ${Object.keys(newIds)}`);
    });

    await S(1, "clients-panel", "Clients panel: header 'Clients' (no count), New client button, text 'No clients yet', no list rows", async (c) => {
      await open(); await photoTab();
      await page.locator("#clients").scrollIntoViewIfNeeded();
      const d = await page.evaluate(() => ({ h: document.getElementById("clients-h").textContent.trim(), btn: document.getElementById("clients-new").textContent, empty: !document.getElementById("clients-empty").hidden, emptyText: document.getElementById("clients-empty").textContent, rows: document.querySelectorAll("#clients-list li").length }));
      c.note(JSON.stringify(d));
      c.ok(d.h === "Clients" && d.btn === "New client" && d.empty && d.emptyText === "No clients yet" && d.rows === 0, `panel ${JSON.stringify(d)}`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#clients" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 ${m.hScroll} ${m.clipped}`);
      if (cfg.touch) c.known("U-02", m.small.length === 0, `under 44 px: ${m.small.join(" | ")}`);
    });

    await S(2, "new-client-form", "New client: inline form in the panel (not a dialog) with 6 labelled fields, Add client + Cancel; Arabic fields rtl", async (c) => {
      await tapOrClick(page, "#clients-new", cfg); await page.waitForSelector(".adm-cform", { timeout: 4000 }); await page.waitForTimeout(300);
      const d = await page.evaluate(() => {
        const f = document.querySelector(".adm-cform");
        return { labels: [...f.querySelectorAll(".adm-flab")].map((l) => l.textContent), dirs: Object.fromEntries([...f.querySelectorAll("input")].map((i) => [i.name, i.dir || "auto"])), btns: [...f.querySelectorAll("button")].map((b) => b.textContent), dialog: !!f.closest("dialog"), expanded: document.getElementById("clients-new").getAttribute("aria-expanded"), focus: document.activeElement?.name, hs: document.documentElement.scrollWidth - innerWidth };
      });
      c.note(JSON.stringify(d));
      c.ok(d.labels.length === 6 && d.btns.join() === "Add client,Cancel", `labels ${d.labels} buttons ${d.btns}`);
      c.ok(d.dirs["name.ar"] === "rtl" && d.dirs["line.ar"] === "rtl" && d.dirs["name.en"] === "ltr", `dirs ${JSON.stringify(d.dirs)}`);
      c.ok(d.focus === "name.en" && d.expanded === "true", `focus ${d.focus}, aria-expanded ${d.expanded}`);
      c.note(`form is ${d.dialog ? "a dialog" : "inline in the Clients panel"} (CASES expected a dialog: design note only)`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#clients" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 ${m.hScroll} ${m.clipped}`);
      if (cfg.touch) c.known("U-02", m.small.length === 0, `under 44 px: ${m.small.join(" | ")}`);
    });

    await S(3, "add-empty", "Add client with everything empty: errors on both name fields, nothing created", async (c) => {
      await tapOrClick(page, '.adm-cform button[type="submit"]', cfg); await page.waitForTimeout(1200);
      const d = await page.evaluate(() => ({ errs: [...document.querySelectorAll(".adm-cform .adm-fld")].map((f) => [f.dataset.field, f.querySelector(".adm-ferr").textContent]).filter((x) => x[1]), note: document.querySelector(".adm-cform-note").textContent, rows: document.querySelectorAll("#clients-list li").length }));
      c.note(`errors ${JSON.stringify(d.errs)}; form note "${d.note}"; rows ${d.rows}`);
      c.ok(d.rows === 0 && (await api("clients")).clients.length === 0, "a client was created from an empty form");
      c.ok(d.errs.length >= 1, "no error shown at all");
      c.known("U-43", d.errs.length >= 2, `only ${d.errs.length} field(s) say what is missing (${JSON.stringify(d.errs)}): the server reports one field at a time`);
    });

    await S(4, "fill-c1", "Fill C1 and Add client: message 'Added <EN name> (not published yet).', C1 row with both names, 0 pieces", async (c) => {
      await fillC1(); await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "04a-filled.png"), scale: "css" });
      const filled = await formRead();
      c.ok(filled["name.ar"] === C1.ar && filled["name.en"] === C1.en, "typed values not kept");
      await tapOrClick(page, '.adm-cform button[type="submit"]', cfg);
      await page.waitForFunction(() => /Added|refused|Not valid/.test(document.getElementById("clients-note").textContent) || document.querySelector(".adm-ferr:not(:empty)"), null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(600);
      const m = await msg("#clients-note");
      c.ok(m === `Added ${C1.en} (not published yet).`, `message "${m}"`);
      const d = await page.evaluate(() => { const li = document.querySelector("#clients-list li"); const ar = li?.querySelector(".adm-cname-ar"), en = li?.querySelector(".adm-cname-en"); return { n: document.querySelectorAll("#clients-list li").length, en: en?.textContent, ar: ar?.textContent, arDir: ar?.dir, count: li?.querySelector(".adm-ccount")?.textContent, mono: li?.querySelector(".adm-mono")?.textContent, heading: document.getElementById("clients-h").textContent, enH: en?.getBoundingClientRect().height, arH: ar?.getBoundingClientRect().height, lineH: parseFloat(getComputedStyle(en).lineHeight) }; });
      c.note(JSON.stringify(d));
      c.ok(d.n === 1 && d.en === C1.en && d.ar === C1.ar && d.arDir === "rtl" && d.count === "0 pieces", `row ${JSON.stringify(d)}`);
      const m2 = await lookA(page, { touch: false, scope: "#clients" });
      c.ok(m2.hScroll <= 0 && !m2.clipped.length, `A1 ${m2.hScroll} ${m2.clipped}`);
      c1 = (await api("clients")).clients[0];
      c.note(`C1 on the server: ${JSON.stringify(c1)}`);
      c.ok(c1 && c1.name.ar === C1.ar && c1.name.en === C1.en && c1.line.ar === C1.lineAr && c1.line.en === C1.lineEn && String(c1.year) === C1.year && c1.url === C1.url, "server copy differs from what was typed");
      c.ok(c1.changed === true && c1.published === false, `changed ${c1.changed} published ${c1.published}`);
    });

    await S(5, "select-mode", "Select pieces: button reads 'Done selecting', tiles become tick boxes, assign bar shown, Assign disabled", async (c) => {
      await page.locator("#select-toggle").scrollIntoViewIfNeeded();
      await tapOrClick(page, "#select-toggle", cfg); await page.waitForTimeout(600);
      const d = await page.evaluate(() => { const bar = document.getElementById("assign-bar"); const t = document.querySelector("#grid .adm-tile .adm-tick"); const tr = t?.getBoundingClientRect(); const br = bar.getBoundingClientRect(); return { btn: document.getElementById("select-toggle").textContent, bar: !bar.hidden, n: document.getElementById("assign-n").textContent, opts: [...document.getElementById("assign-client").options].map((o) => o.text), go: document.getElementById("assign-go").disabled, ticks: document.querySelectorAll("#grid .adm-tile .adm-tick").length, tick: tr && [Math.round(tr.width), Math.round(tr.height)], barRect: { top: Math.round(br.top), h: Math.round(br.height), vh: innerHeight } }; });
      c.note(JSON.stringify(d));
      c.ok(d.btn === "Done selecting" && d.bar && d.go && d.ticks > 0, `state ${JSON.stringify(d)}`);
      c.ok(d.opts.includes(C1.en), `client select lists ${d.opts}`);
      if (cfg.touch) c.known("U-44", d.tick && d.tick[0] >= 44 && d.tick[1] >= 44, `tick box is ${d.tick} css px (case wants >= 44)`);
    });

    await S(6, "tick-four", "Tick photo-1, photo-2, photo-3, video: bar says 'Assign 4 to', Assign still disabled until a client is chosen", async (c) => {
      for (const k of PIECES) { await page.locator(tile(k)).first().scrollIntoViewIfNeeded(); await tapOrClick(page, tile(k), cfg); await page.waitForTimeout(250); }
      const d = await page.evaluate((ids) => ({ n: document.getElementById("assign-n").textContent, picked: ids.map((id) => document.querySelector(`.adm-tile[data-id="${id}"]`)?.dataset.picked), pickedAll: document.querySelectorAll('#grid .adm-tile[data-picked="1"]').length, go: document.getElementById("assign-go").disabled, clear: document.getElementById("assign-clear").disabled }), PIECES.map((k) => newIds[k]));
      c.note(JSON.stringify(d));
      c.ok(d.n === "Assign 4 to" && d.pickedAll === 4 && d.picked.every((x) => x === "1"), `picked ${JSON.stringify(d)}`);
      c.ok(d.go === true && d.clear === false, `go disabled ${d.go}, clear disabled ${d.clear}`);
      const bar = await rect(page, "#assign-bar"), last = await rect(page, tile("video"));
      c.ok(!overlaps(bar, last), `assign bar ${JSON.stringify(bar)} covers the video tile ${JSON.stringify(last)}`);
    });

    await S(7, "assign", "Choose C1, Assign: 'Assigned 4 pieces to <name> (not published yet).', C1 count 4", async (c) => {
      await page.locator("#assign-client").selectOption(c1.id); await page.waitForTimeout(300);
      c.ok(await page.locator("#assign-go").isEnabled(), "Assign is not enabled after choosing the client");
      await tapOrClick(page, "#assign-go", cfg);
      await page.waitForFunction(() => /Assigned|refused|changed elsewhere/.test(document.getElementById("assign-note").textContent), null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(900);
      const m = await msg("#assign-note");
      c.ok(m === `Assigned 4 pieces to ${C1.en} (not published yet).`, `message "${m}"`);
      const cnt = await page.locator("#clients-list .adm-ccount").first().textContent();
      c.ok(cnt === "4 pieces", `C1 count "${cnt}"`);
      const o = await owners();
      c.note(`client on the 4 pieces (API): ${JSON.stringify(o)}`);
      c.ok(o.every((x) => x === c1.id), `API owners ${JSON.stringify(o)}`);
      c.ok(await page.evaluate(() => document.querySelectorAll('#grid .adm-tile[data-picked="1"]').length === 0), "selection not emptied after assign");
    });

    await S(8, "done-and-drawer", "Done selecting; open photo-1: drawer shows Client = C1; the tile itself shows which client it has", async (c) => {
      await page.locator("#select-toggle").scrollIntoViewIfNeeded(); await tapOrClick(page, "#select-toggle", cfg); await page.waitForTimeout(500);
      c.ok((await msg("#select-toggle")) === "Select pieces", "select mode not left");
      const badge = await page.evaluate((id) => { const t = document.querySelector(`.adm-tile[data-id="${id}"]`); return { text: t.textContent.replace(/\s+/g, " ").trim(), title: t.title, aria: t.getAttribute("aria-label") }; }, newIds["photo-1"]);
      c.note(`tile text/aria: ${JSON.stringify(badge)}`);
      c.known("U-45", /Jabal|مكتب/.test(badge.text + badge.title + (badge.aria || "")), "after assigning, the tile of photo-1 does not show its client; the boss must open each drawer to see it");
      await page.locator(tile("photo-1")).first().scrollIntoViewIfNeeded(); await tapOrClick(page, tile("photo-1"), cfg);
      await page.waitForSelector("#drawer[open] #d-client", { timeout: 6000 }); await page.waitForTimeout(700);
      const d = await page.evaluate(() => { const s = document.getElementById("d-client"); return { val: s.value, label: s.selectedOptions[0]?.text }; });
      c.note(`drawer client select: ${JSON.stringify(d)}`);
      c.ok(d.val === c1.id && d.label === C1.en, `drawer client ${JSON.stringify(d)}`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#drawer" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 ${m.hScroll} ${m.clipped}`);
    });

    await S(9, "reload-edit", "Reload, open C1 Edit: all 6 fields read back exactly as typed; count 4 pieces", async (c) => {
      await open(); await page.locator("#clients").scrollIntoViewIfNeeded();
      const cnt = await page.locator("#clients-list .adm-ccount").first().textContent();
      c.ok(cnt === "4 pieces", `count "${cnt}"`);
      await tapOrClick(page, "#clients-list .adm-x >> text=Edit", cfg); await page.waitForSelector("#clients-list .adm-cform", { timeout: 4000 }); await page.waitForTimeout(300);
      const f = await formRead();
      c.note(`fields ${JSON.stringify(f)}`);
      c.ok(f["name.en"] === C1.en && f["name.ar"] === C1.ar && f["line.en"] === C1.lineEn && f["line.ar"] === C1.lineAr && f.year === C1.year && f.url === C1.url, `fields differ: ${JSON.stringify(f)}`);
      const m = await lookA(page, { touch: cfg.touch, scope: "#clients" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 ${m.hScroll} ${m.clipped}`);
      await tapOrClick(page, "#clients-list .adm-cform button >> text=Cancel", cfg); await page.waitForTimeout(400);
    });

    await S(10, "publish", "Editor Publish: the modal names the client in words and the assignments; Publish -> toast", async (c) => {
      await page.goto(ORIGIN + "/admin/edit/", { waitUntil: "load" });
      await page.waitForSelector(".ed-publish", { timeout: 15000 });
      await page.waitForFunction(() => /Publish \(\d+\)/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 15000 }).catch(() => {});
      c.note(`publish button "${await page.locator(".ed-publish").textContent()}"`);
      await tapOrClick(page, ".ed-publish", cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }); await page.waitForTimeout(500);
      const d = await page.evaluate(() => { const dl = document.querySelector(".ed-scrim .ed-dialog"), r = dl.getBoundingClientRect(); return { title: dl.querySelector(".ed-dialog-title")?.textContent, items: [dl.innerText.split(/[\s]+/).join(" ").trim()], inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
      const t = d.items.join(" | ");
      c.note(`modal "${d.title}": ${t.slice(0, 500)}`);
      c.ok(d.inside, "modal outside viewport");
      c.known("U-46", /Jabal al-Mukabbir/.test(t), `the modal does not name the new client: it only says "Gallery: N changes" (${t.slice(0, 200)})`);
      c.known("U-46", /\b4\b/.test(t.replace(/Clients[^|]*/, "")) || /assign/i.test(t), `the modal does not say that 4 pieces were assigned to the client: "${t.slice(0, 300)}"`);
      c.ok(!/c-[a-z0-9]{4,}|[a-z0-9]{6}-photo-\d|u\/[a-z0-9]+/.test(t), `raw ids in the modal: ${t.slice(0, 200)}`);
      await page.screenshot({ path: path.join(ORCH, "shots", UC, cfg.name, "10a-modal.png"), scale: "css" });
      await tapOrClick(page, '.ed-scrim button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 20000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => "");
      c.ok(/^Published\. The live site is now revision \d+\.$/.test(toast || ""), `toast "${toast}"`);
    });

    await S(11, "reload-gallery", "Reload gallery: C1 no longer 'changed', published, pieces still assigned; summary 0 changed", async (c) => {
      await open(); await page.locator("#clients").scrollIntoViewIfNeeded();
      const cl = (await api("clients")).clients[0];
      c.note(`C1 after publish: changed ${cl.changed}, published ${cl.published}, pieces ${cl.pieces}`);
      c.ok(cl.changed === false && cl.published === true && cl.pieces === 4, `C1 ${JSON.stringify({ changed: cl.changed, published: cl.published, pieces: cl.pieces })}`);
      const o = await owners();
      c.ok(o.every((x) => x === c1.id), `owners after publish ${JSON.stringify(o)}`);
      const s = await msg("#summary");
      c.note(`summary "${s}"`);
      c.ok(/, 0 changed and not published$/.test(s), `summary "${s}"`);
      c.ok((await page.locator("#clients-list .adm-ccount").first().textContent()) === "4 pieces", "count after reload not 4");
      const m = await lookA(page, { touch: false, scope: "#clients" });
      c.ok(m.hScroll <= 0 && !m.clipped.length, `A1 ${m.hScroll} ${m.clipped}`);
    });
  } finally { await browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) {
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-06a ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
