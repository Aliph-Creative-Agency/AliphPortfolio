// UC-07 hide one piece, delete another, Discard; then History restore an older revision; publish (CASES.md UC-07).
// node tests/usecases/uc-07-discard-history.mjs [--only edge|webkit]
// Setup (step 0, through the app's own UI for the upload and its own API for text/hide/publish, not the case under test):
//   rev A (= revision 1) = hero1 AR «نبدأ من حيثُ» + photo-3 uploaded into Photo (live);
//   rev B (= revision 2) = hero1 AR «نبدأ من حيث تبدأ» + default piece P3 hidden.
// P3 is an addition to CASES: rev A and rev B then also differ in the gallery, so the restore is checked on pieces too.
// P1 = first default Photo piece (Hide), P2 = the uploaded photo-3 (Delete: a default piece can only be hidden, drawer.js:6).
// JSON snapshots (draft, published, admin content, gallery, clients, changes, revisions) -> runs/UC-07-<cfg>-<step>.json.
import fs from "node:fs";
import path from "node:path";
import { startDev, stopDev, resetState, configs, ORIGIN, ORCH, step, startRun, tapOrClick, setLang, check, done } from "./lib/uc.mjs";
import { lookA, checker, rect } from "./lib/look.mjs";

const UC = "UC-07";
const MEDIA = path.join(ORCH, "media");
const HERO1 = '.hero-title [data-i18n="hero1"]';
const TEXT_A = "نبدأ من حيثُ", TEXT_B = "نبدأ من حيث تبدأ";

// LOCAL-ONLY ARTEFACT: uploads get https://media.aliphcreative.com/admin/... URLs the real host does not have locally
async function mapMedia(context) {
  await context.route("https://media.aliphcreative.com/admin/**", async (r) => {
    try { await r.fulfill({ response: await r.fetch({ url: ORIGIN + "/api/admin/media/" + new URL(r.request().url()).pathname.slice(1) }) }); } catch { await r.abort().catch(() => {}); }
  });
}
// rev counters move on every write and the draft read carries the optimistic locks; everything else must match
const norm = (o) => JSON.stringify(o, (k, v) => (k === "rev" || k === "locks" ? undefined : v));

async function run(cfg) {
  startRun(UC, cfg.name);
  const { browser, page, context } = await cfg.open();
  await mapMedia(context);
  const pubCtx = await cfg.open(); await mapMedia(pubCtx.context);
  const pub = pubCtx.page;
  const S = (n, slug, expect, fn, pg = page) => step(pg, { uc: UC, cfg: cfg.name, n, slug, expect }, async () => {
    const c = checker(`${cfg.name} ${String(n).padStart(2, "0")}`);
    await fn(c);
    return c.pass;
  });
  const json = (p) => page.evaluate(async (p) => (await (await fetch(p, { cache: "no-store" })).json()), p);
  const snap = async (n) => {
    const d = await page.evaluate(async () => {
      const g = async (u) => (await fetch(u, { cache: "no-store" })).json();
      return { draft: await g("/api/content?state=draft"), published: await g("/api/content"), adminContent: await g("/api/admin/content"),
        gallery: await g("/api/admin/gallery"), clients: await g("/api/admin/clients"), changes: await g("/api/admin/changes"), revisions: await g("/api/admin/revisions") };
    });
    fs.writeFileSync(path.join(ORCH, "runs", `${UC}-${cfg.name}-${String(n).padStart(2, "0")}.json`), JSON.stringify(d, null, 1));
    return d;
  };
  const gallery = async () => {
    await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
    await page.waitForFunction(() => /items,/.test(document.getElementById("summary").textContent), null, { timeout: 15000 });
    await tapOrClick(page, '#tabs button[data-cat="photo"]', cfg); await page.waitForTimeout(800);
  };
  const editor = async (q = "") => {
    await page.goto(ORIGIN + "/admin/edit/" + q, { waitUntil: "load" });
    await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(2500);
  };
  const bar = () => page.evaluate((s) => ({ ar: document.querySelector(s)?.textContent, chip: document.querySelector(".ed-chip")?.textContent,
    pub: document.querySelector(".ed-publish")?.textContent, pubDis: document.querySelector(".ed-publish")?.disabled, disDis: document.querySelector(".ed-discard")?.disabled }), HERO1);
  const modal = () => page.evaluate(() => {
    const dl = document.querySelector(".ed-scrim .ed-dialog"); if (!dl) return null;
    const r = dl.getBoundingClientRect();
    return { title: dl.querySelector(".ed-dialog-title")?.textContent, text: dl.innerText.replace(/\s+/g, " "), items: [...dl.querySelectorAll("li")].map((l) => l.textContent),
      btns: [...dl.querySelectorAll("button")].map((b) => b.textContent + " " + Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)),
      inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, box: [r.left, r.top, r.right, r.bottom].map(Math.round) };
  });
  const tileInfo = (id) => page.evaluate((id) => {
    const t = document.querySelector(`.adm-tile[data-id="${id}"]`);
    return t && { hidden: t.dataset.hidden, removed: t.dataset.removed, changed: t.dataset.changed, badges: [...t.querySelectorAll(".adm-badge")].map((b) => b.textContent), label: t.getAttribute("aria-label") };
  }, id);
  const summary = () => page.locator("#summary").textContent();
  const openDrawer = async (id) => {
    await tapOrClick(page, `.adm-tile[data-id="${id}"]`, cfg);
    await page.waitForSelector("#drawer[open]", { timeout: 6000 }); await page.waitForTimeout(500);
  };
  const look = async (c, scope) => {
    const m = await lookA(page, { touch: cfg.touch, scope });
    c.ok(m.hScroll <= 0, `A1 page scrolls sideways by ${m.hScroll}px`);
    c.ok(!m.clipped.length, `A1 clipped: ${m.clipped.join(" | ")}`);
    if (cfg.touch) c.known("U-02", !m.small.length, `A3 <44px: ${m.small.join(" | ")}`);
  };

  // public helpers (fresh context, never opened an admin page)
  const pubOpen = async (p, lang) => { await pub.goto(ORIGIN + p, { waitUntil: "load" }); await setLang(pub, lang); await pub.waitForTimeout(2500); };
  const libRead = async (lang, focus) => {
    await pubOpen("/library", lang);
    await pub.waitForSelector('.acc-panel[data-cat="photo"]', { timeout: 10000 });
    if ((await pub.locator('.acc-panel[data-cat="photo"].open').count()) === 0) { await tapOrClick(pub, '.acc-panel[data-cat="photo"] .spine', cfg); await pub.waitForTimeout(900); }
    const d = await pub.evaluate((focus) => {
      const tiles = [...document.querySelectorAll('.acc-panel[data-cat="photo"] .lib-grid > .tile')];
      const ids = tiles.map((t) => [t.dataset.film, t.querySelector("img")?.getAttribute("src"), t.querySelector("img")?.dataset.full].filter(Boolean).join(" "));
      const f = tiles.find((t) => (t.querySelector("img")?.getAttribute("src") || "").includes(focus));
      if (f) f.scrollIntoView({ block: "center" });
      return { ids, hs: document.documentElement.scrollWidth - innerWidth, admin: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length };
    }, focus);
    await pub.waitForTimeout(1200);
    return d;
  };
  const homeRead = async (lang) => {
    await pubOpen("/", lang); await pub.waitForTimeout(1500);
    return pub.evaluate(() => ({ h1: document.querySelector('.hero-title [data-i18n="hero1"]')?.textContent, hs: document.documentElement.scrollWidth - innerWidth,
      admin: document.querySelectorAll(".ed-bar,[data-editor-ui],.ed-outline").length }));
  };
  const stem = (id) => id.split("/").pop().replace(/.w+$/, "");
  const has = (ids, id) => ids.some((x) => x.includes(stem(id)));
  const without = (ids, id) => ids.filter((x) => !x.includes(stem(id)));
  const pubClean = (c, d) => c.ok(d.hs <= 0 && d.admin === 0, `public h-scroll ${d.hs}, admin artefacts ${d.admin}`);

  let P1, P2, P3, PUB_A, PUB_B, ORDER_A, EN0;
  try {
    await S(0, "setup-rev-a-b", "setup: rev A (hero1 حيثُ + photo-3 upload) and rev B (hero1 تبدأ + P3 hidden) published", async (c) => {
      await gallery();
      const j0 = await json("/api/admin/gallery"); const ids0 = new Set(j0.items.map((x) => x.id));
      const defs = j0.items.filter((x) => x.cat === "photo" && x.kind === "default" && !x.video);
      // the Photo tab's own order (byOrder) decides "first two pieces"
      const tabOrder = await page.evaluate(() => [...document.querySelectorAll(".adm-tile")].map((t) => t.dataset.id));
      [P1, P3] = tabOrder.filter((id) => defs.some((d) => d.id === id)).slice(0, 2);
      await page.locator("#add-cat").selectOption("photo"); await page.waitForTimeout(300);
      const opts = await page.evaluate(() => [...document.querySelectorAll("#add-sub option")].map((o) => [o.value, o.textContent]));
      const sub = (opts.find((o) => o[0] && /still|photo/i.test(o[1])) || opts.find((o) => o[0]))[0];
      c.note("upload sub-category " + JSON.stringify(opts) + " -> " + sub);
      await page.locator("#add-sub").selectOption(sub); await page.waitForTimeout(300);
      const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 8000 }), tapOrClick(page, "#add-zone", cfg)]);
      await fc.setFiles([path.join(MEDIA, "photo-3.jpg")]); await page.waitForTimeout(800);
      await tapOrClick(page, "#add-go", cfg);
      await page.waitForFunction(() => { const r = [...document.querySelectorAll("#add-rows .adm-row")]; return r.length === 1 && r.every((x) => x.dataset.status === "done" || x.dataset.status === "error"); }, null, { timeout: 60000 });
      await page.waitForTimeout(1000);
      P2 = (await json("/api/admin/gallery")).items.find((x) => !ids0.has(x.id))?.id;
      c.note(`P1 ${P1}, P2 ${P2}, P3 ${P3}`);
      c.ok(P1 && P2 && P3, "pieces not found");
      await editor();
      const pubVia = (text, hideId) => page.evaluate(async ({ text, hideId }) => {
        const A = window.aliphEditorApi;
        const ct = await A.content();
        const s = await A.saveText("hero1", "ar", text, ct.locks.text.hero1?.ar || 0);
        let h = 200;
        if (hideId) {
          const it = (await (await fetch("/api/admin/gallery")).json()).items.find((x) => x.id === hideId);
          h = (await fetch("/api/admin/gallery/" + encodeURIComponent(hideId), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...it.own, hidden: true, baseRev: it.rev }) })).status;
        }
        const ch = await A.changes();
        const p = await A.publish(ch.token);
        return { save: s.status, hide: h, changes: ch.changes.length, publish: p.status, body: p.body };
      }, { text, hideId });
      const a = await pubVia(TEXT_A, null);
      c.note("rev A " + JSON.stringify(a));
      PUB_A = await json("/api/content");
      const la = await libRead("en", P1);
      ORDER_A = la.ids;
      c.ok(has(ORDER_A, P1) && has(ORDER_A, P2) && has(ORDER_A, P3), `rev A public photo panel misses P1/P2/P3 (${ORDER_A.length} tiles)`);
      const b = await pubVia(TEXT_B, P3);
      c.note("rev B " + JSON.stringify(b));
      PUB_B = await json("/api/content");
      c.ok(a.save === 200 && a.publish === 200 && b.save === 200 && b.hide === 200 && b.publish === 200 && b.changes === 2, "setup publish failed");
      const revs = await json("/api/admin/revisions");
      c.ok(revs.map((r) => r.id).join() === "2,1", `revisions ${revs.map((r) => r.id)}`);
      await editor();
    });

    await S(1, "gallery-start", "Photo tab: P1, P2 shown plain, P3 has the hidden badge; summary 0 changed", async (c) => {
      await snap(1);
      await gallery();
      const d = { p1: await tileInfo(P1), p2: await tileInfo(P2), p3: await tileInfo(P3), sum: await summary() };
      c.note(JSON.stringify(d));
      c.ok(d.p1 && d.p1.hidden === "0" && d.p2 && d.p2.removed === "0" && d.p3?.badges.includes("hidden"), "start tiles wrong");
      c.ok(/, 0 changed and not published$/.test(d.sum), `summary "${d.sum}"`);
      await page.locator(`.adm-tile[data-id="${P1}"]`).scrollIntoViewIfNeeded();
      await look(c, "main");
    });

    for (const [n, lang] of [[2, "ar"], [3, "en"]]) {
      await S(n, `pub-library-start-${lang}`, `PUB /library ${lang}: P1 + P2 visible, P3 not (hidden in rev B)`, async (c) => {
        const d = await libRead(lang, P1);
        c.note(`${d.ids.length} photo tiles`);
        c.ok(has(d.ids, P1) && has(d.ids, P2) && !has(d.ids, P3), `P1 ${has(d.ids, P1)} P2 ${has(d.ids, P2)} P3 ${has(d.ids, P3)}`);
        c.ok(norm(d.ids) === norm(without(ORDER_A, P3)), "rev B order differs from rev A minus P3");
        pubClean(c, d);
      }, pub);
    }

    await S(4, "hide-p1", "drawer: Hide -> status names hidden + not published; tile gets the hidden badge", async (c) => {
      await gallery(); await openDrawer(P1);
      await tapOrClick(page, "#d-hide", cfg);
      await page.waitForFunction(() => /Hidden/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 6000 }).catch(() => {});
      const d = await page.evaluate(() => ({ msg: document.getElementById("drawer-msg").textContent, status: document.getElementById("drawer-status").textContent, btn: document.getElementById("d-hide")?.textContent }));
      c.note(JSON.stringify(d));
      c.ok(d.msg === "Hidden (not published yet)." && /hidden/.test(d.status) && /not published/.test(d.status) && d.btn === "Unhide", `drawer ${JSON.stringify(d)}`);
      await look(c, "#drawer");
      const t = await tileInfo(P1);
      c.ok(t.hidden === "1" && t.badges.includes("hidden"), `tile ${JSON.stringify(t)}`);
    });

    await S(5, "delete-p2-confirm", "drawer: Delete -> confirm says it leaves the site on publish and can be restored until then", async (c) => {
      await tapOrClick(page, "#drawer-close", cfg); await page.waitForTimeout(400);
      await openDrawer(P2);
      await tapOrClick(page, "#d-delete", cfg);
      await page.waitForSelector("#confirm[open]", { timeout: 5000 }); await page.waitForTimeout(300);
      const d = await page.evaluate(() => { const r = document.getElementById("confirm").getBoundingClientRect(); return { text: document.getElementById("confirm-text").textContent, yes: document.getElementById("confirm-yes").textContent, inside: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 }; });
      c.note(JSON.stringify(d));
      c.ok(/^Delete .+\? It leaves the site when you publish; you can restore it until then\.$/.test(d.text) && d.yes === "Delete", `confirm "${d.text}"`);
      c.ok(d.inside, "confirm outside the viewport");
      await look(c, "#confirm");
    });

    await S(6, "delete-p2-done", "P2 kept in the grid, marked deleted (badge), drawer offers Restore; summary 2 changed", async (c) => {
      await tapOrClick(page, "#confirm-yes", cfg);
      await page.waitForFunction(() => /Deleted/.test(document.getElementById("drawer-msg").textContent), null, { timeout: 6000 }).catch(() => {});
      const d = await page.evaluate(() => ({ msg: document.getElementById("drawer-msg").textContent, status: document.getElementById("drawer-status").textContent, restore: !!document.getElementById("d-restore") }));
      c.note(JSON.stringify(d));
      c.ok(d.msg === "Deleted (not published yet). Restore brings it back." && d.restore, `drawer ${JSON.stringify(d)}`);
      await tapOrClick(page, "#drawer-close", cfg); await page.waitForTimeout(500);
      const t = await tileInfo(P2), sum = await summary();
      c.note(`P2 tile ${JSON.stringify(t)}; summary "${sum}"`);
      c.ok(t && t.removed === "1" && t.badges.includes("deleted"), "P2 not marked deleted");
      c.ok(/, 2 changed and not published$/.test(sum), `summary "${sum}"`);
      await page.locator(`.adm-tile[data-id="${P2}"]`).scrollIntoViewIfNeeded();
    });

    await S(7, "discard-modal", "editor: Publish (2); Discard modal names both changes in words, fits the screen", async (c) => {
      await editor();
      await page.waitForFunction(() => document.querySelector(".ed-publish").textContent === "Publish (2)", null, { timeout: 8000 }).catch(() => {});
      const b = await bar();
      c.note(JSON.stringify(b));
      c.ok(b.pub === "Publish (2)" && !b.disDis, `bar ${JSON.stringify(b)}`);
      await tapOrClick(page, ".ed-discard", cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }); await page.waitForTimeout(400);
      const m = await modal();
      c.note(JSON.stringify(m));
      c.ok(m.title === "Discard 2 unpublished changes? The live site's content comes back.", `title "${m.title}"`);
      c.known("U-50", /hid/i.test(m.text) && /delet/i.test(m.text), `the Discard list says only "${m.text.replace(m.title, "").trim()}": not which pieces, not hide vs delete`);
      c.ok(m.inside, `modal outside the viewport ${m.box}`);
      if (cfg.touch) c.known("U-02", m.btns.every((x) => parseInt(x.split("x").at(-1)) >= 44), `modal buttons ${m.btns}`);
    });

    await S(8, "discard-done", "Discard: page reloads; Publish disabled and plain; chip Draft; hero1 still rev B text", async (c) => {
      const nav = page.waitForEvent("load", { timeout: 15000 }).catch(() => null);
      await tapOrClick(page, '.ed-scrim .ed-dialog button:has-text("Discard")', cfg);
      await nav; await page.waitForSelector(".ed-bar", { timeout: 15000 }); await page.waitForTimeout(2500);
      const b = await bar();
      c.note(JSON.stringify(b));
      c.ok(b.pub === "Publish" && b.pubDis && b.disDis && b.chip === "Draft" && b.ar === TEXT_B, `bar ${JSON.stringify(b)}`);
    });

    await S(9, "after-discard-gallery", "Nothing lost: draft == published rev B (API), P1 not hidden, P2 present; summary 0 changed", async (c) => {
      const d = await snap(9);
      c.ok(d.changes.changes.length === 0, `changes after Discard: ${JSON.stringify(d.changes.changes)}`);
      const same = norm({ ...d.draft, rev: 0 }) === norm({ ...d.published, rev: 0 });
      c.ok(same, "LAUNCH: draft != published after Discard (see runs/UC-07-*-09.json)");
      c.ok(norm(d.published) === norm(PUB_B), "published snapshot changed by Discard");
      await gallery();
      const t1 = await tileInfo(P1), t2 = await tileInfo(P2), t3 = await tileInfo(P3), sum = await summary();
      c.note(JSON.stringify({ t1, t2, t3, sum }));
      c.ok(t1?.hidden === "0" && !t1.badges.length && t2?.removed === "0" && !t2.badges.length && t3?.hidden === "1", "tiles not back to rev B");
      c.ok(/, 0 changed and not published$/.test(sum), `summary "${sum}"`);
      await page.locator(`.adm-tile[data-id="${P2}"]`).scrollIntoViewIfNeeded();
    });

    for (const [n, lang] of [[10, "ar"], [11, "en"]]) {
      await S(n, `pub-library-after-discard-${lang}`, `PUB /library ${lang}: P1 + P2 visible, P3 not, order unchanged`, async (c) => {
        const d = await libRead(lang, P2);
        c.ok(has(d.ids, P1) && has(d.ids, P2) && !has(d.ids, P3), `P1 ${has(d.ids, P1)} P2 ${has(d.ids, P2)} P3 ${has(d.ids, P3)}`);
        c.ok(norm(d.ids) === norm(without(ORDER_A, P3)), "order changed");
        pubClean(c, d);
      }, pub);
    }

    let REVS = [];
    await S(12, "history-panel", "History: revisions 2 (live) then 1, each with date, by, change summary and Restore; fits", async (c) => {
      await editor();
      await tapOrClick(page, '[aria-controls="ed-history"]', cfg);
      await page.waitForSelector("#ed-history:not([hidden]) .ed-rev", { timeout: 8000 }); await page.waitForTimeout(500);
      REVS = await page.evaluate(() => [...document.querySelectorAll("#ed-history .ed-rev")].map((s) => ({ id: s.dataset.rev, head: s.querySelector(".ed-rev-head").innerText.replace(/\s+/g, " "),
        meta: s.querySelector(".ed-rev-meta").textContent, changes: s.querySelector(".ed-rev-changes").textContent, live: !!s.querySelector(".ed-rev-live") })));
      const r = await rect(page, "#ed-history");
      c.note(JSON.stringify(REVS)); c.note(`panel ${JSON.stringify(r)}`);
      c.ok(REVS.map((x) => x.id).join() === "2,1" && REVS[0].live && !REVS[1].live, "revision list");
      c.ok(REVS.every((x) => /^\d{1,2} \w{3} \d{4}, \d{2}:\d{2} · /.test(x.meta)), `date not human: ${REVS.map((x) => x.meta)}`);
      c.ok(r && r.x >= 0 && r.right <= cfg.viewport.width + 1, "panel wider than the screen");
      c.known("U-51", REVS.every((x) => !/\.(webp|jpe?g|png|mp4)\b|admin\//.test(x.changes)), `revision summaries show raw file ids: ${REVS.map((x) => x.changes).join(" | ")}`);
      await look(c, "#ed-history");
    });

    await S(13, "restore-modal", "Restore on revision 1: modal says it copies revision 1 into the draft and the live site does not change", async (c) => {
      await tapOrClick(page, '#ed-history .ed-rev[data-rev="1"] button.ed-reset', cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }); await page.waitForTimeout(400);
      const m = await modal();
      c.note(JSON.stringify(m));
      c.ok(m.title === "Restore revision 1?" && /This copies revision 1 into the draft\. The live site does not change until you publish\./.test(m.text), `modal "${m.text}"`);
      c.ok(m.inside, `modal outside the viewport ${m.box}`);
      if (cfg.touch) c.known("U-02", m.btns.every((x) => parseInt(x.split("x").at(-1)) >= 44), `modal buttons ${m.btns}`);
    });

    await S(14, "restore-done", "toast 'Revision 1 is in the draft. Publish to make it live.'; hero1 = rev A text; Publish (2)", async (c) => {
      const nav = page.waitForEvent("load", { timeout: 15000 }).catch(() => null);
      await tapOrClick(page, '.ed-scrim .ed-dialog button:has-text("Restore")', cfg);
      await nav; await page.waitForSelector(".ed-bar", { timeout: 15000 });
      const toast = await page.waitForFunction(() => document.querySelector(".ed-toast:not([hidden])")?.textContent, null, { timeout: 6000 }).then((h) => h.jsonValue(), () => null);
      await page.waitForFunction(() => /^Publish \(\d+\)$/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 8000 }).catch(() => {});
      const b = await bar();
      c.note(`toast "${toast}" ${JSON.stringify(b)}`);
      c.ok(toast === "Revision 1 is in the draft. Publish to make it live.", `toast "${toast}"`);
      c.ok(b.ar === TEXT_A, `hero1 "${b.ar}"`);
      c.ok(b.pub === "Publish (2)" && !b.pubDis, `publish "${b.pub}" (text + P3 unhidden = 2)`);
      const dir = await page.evaluate(() => getComputedStyle(document.querySelector(".ed-toast")).direction);
      c.known("U-10", dir !== "rtl", `English toast laid out dir=${dir} on the Arabic page: its full stop lands at the start`);
      await page.waitForTimeout(1500); // the hero letters drop in after the reload: shoot after they settled (toast lasts 5 s)
    });

    for (const [n, lang] of [[15, "ar"], [16, "en"]]) {
      await S(n, `pub-home-not-live-${lang}`, `PUB / ${lang}: still rev B (restore is not live yet)`, async (c) => {
        const d = await homeRead(lang);
        c.note(JSON.stringify(d));
        if (lang === "ar") c.ok(d.h1 === TEXT_B, `public AR hero1 "${d.h1}"`);
        else { EN0 = d.h1; c.ok(!!EN0 && !/[؀-ۿ]/.test(EN0), `public EN hero1 "${d.h1}"`); }
        pubClean(c, d);
      }, pub);
    }

    await S(17, "reload-editor", "reload: draft keeps the restored text, Publish (2), toast gone", async (c) => {
      await editor();
      await page.waitForFunction(() => /^Publish \(\d+\)$/.test(document.querySelector(".ed-publish").textContent), null, { timeout: 8000 }).catch(() => {});
      const b = await bar();
      c.note(JSON.stringify(b));
      c.ok(b.ar === TEXT_A && b.pub === "Publish (2)", `bar ${JSON.stringify(b)}`);
    });

    await S(18, "publish-c", "Publish -> modal -> Publish: revision 3; published snapshot == rev A's (API)", async (c) => {
      await tapOrClick(page, ".ed-publish", cfg);
      await page.waitForSelector(".ed-scrim .ed-dialog", { timeout: 15000 }); await page.waitForTimeout(400);
      const m = await modal(); c.note(JSON.stringify(m));
      c.ok(m.title === "Publish 2 changes to the live site?", `title "${m.title}"`);
      c.known("U-46", !/Gallery: \d+ changes?/.test(m.text), `the Publish list says only "Gallery: 1 change" for the piece the restore unhides: not which piece, not what`);
      await tapOrClick(page, '.ed-scrim .ed-dialog button:has-text("Publish")', cfg);
      await page.waitForFunction(() => /Published/.test(document.querySelector(".ed-toast")?.textContent || ""), null, { timeout: 10000 }).catch(() => {});
      const toast = await page.locator(".ed-toast").textContent().catch(() => null);
      c.note(`toast "${toast}"`);
      c.ok(toast === "Published. The live site is now revision 3.", `toast "${toast}"`);
      const d = await snap(18);
      const same = norm({ ...d.published, rev: 0 }) === norm({ ...PUB_A, rev: 0 });
      if (!same) fs.writeFileSync(path.join(ORCH, "runs", `${UC}-${cfg.name}-rev-a.json`), JSON.stringify(PUB_A, null, 1));
      c.ok(same, "LAUNCH: published after restore+publish != rev A (runs/UC-07-*-18.json vs -rev-a.json)");
      c.ok(d.changes.changes.length === 0, "draft still differs after publish");
    });

    for (const [n, lang] of [[19, "ar"], [20, "en"]]) {
      await S(n, `pub-home-c-${lang}`, `PUB / ${lang}: hero1 AR = rev A text, EN unchanged`, async (c) => {
        const d = await homeRead(lang);
        c.note(JSON.stringify(d));
        c.ok(d.h1 === (lang === "ar" ? TEXT_A : EN0), `public ${lang} hero1 "${d.h1}"`);
        pubClean(c, d);
      }, pub);
    }
    for (const [n, lang] of [[21, "ar"], [22, "en"]]) {
      await S(n, `pub-library-c-${lang}`, `PUB /library ${lang}: P1, P2, P3 all visible, order == rev A`, async (c) => {
        const d = await libRead(lang, P3);
        c.ok(has(d.ids, P1) && has(d.ids, P2) && has(d.ids, P3), `P1 ${has(d.ids, P1)} P2 ${has(d.ids, P2)} P3 ${has(d.ids, P3)}`);
        c.ok(norm(d.ids) === norm(ORDER_A), "public photo order != rev A");
        pubClean(c, d);
      }, pub);
    }

    await S(23, "reload-history", "reload editor + History: 3 (live), 2, 1; chip Draft, Publish disabled", async (c) => {
      await editor("?history");
      await page.waitForSelector("#ed-history:not([hidden]) .ed-rev", { timeout: 8000 }); await page.waitForTimeout(500);
      const ids = await page.evaluate(() => [...document.querySelectorAll("#ed-history .ed-rev")].map((s) => s.dataset.rev + (s.querySelector(".ed-rev-live") ? "*" : "")));
      const b = await bar();
      c.note(`${ids} ${JSON.stringify(b)}`);
      c.ok(ids.join() === "3*,2,1", `history ${ids}`);
      c.ok(b.ar === TEXT_A && b.pub === "Publish" && b.pubDis, `bar ${JSON.stringify(b)}`);
    });
    for (const [n, slug, p, lang] of [[24, "pub-home-reload-ar", "/", "ar"], [25, "pub-library-reload-en", "/library", "en"]]) {
      await S(n, slug, `PUB ${p} ${lang} after a reload: as steps 19-22`, async (c) => {
        if (p === "/") { const d = await homeRead(lang); c.ok(d.h1 === TEXT_A, `hero1 "${d.h1}"`); pubClean(c, d); }
        else { const d = await libRead(lang, P1); c.ok(norm(d.ids) === norm(ORDER_A), "order != rev A"); pubClean(c, d); }
      }, pub);
    }
  } finally { await browser.close(); await pubCtx.browser.close(); }
}

let dev;
try {
  for (const cfg of configs()) { // each config starts from the baseline (server stopped while the state is restored)
    resetState(); dev = await startDev();
    try { await run(cfg); } finally { stopDev(dev); dev = null; }
  }
} catch (e) { check("UC-07 ran", false, String(e.stack || e)); }
finally { stopDev(dev); }
done();
