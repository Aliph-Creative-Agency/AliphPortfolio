// G-06b: library order inside a sub on /admin/gallery/, headless Edge against
// `wrangler dev --local --port 8851 --inspector-port 9251` (ADMIN_DEV_BYPASS=1).
//   node tests/gallery/ui-order.mjs
// 1440: keyboard Move mode (item 3 to first), Escape puts a tile back, a
// pointer drag, a 409 (row edited elsewhere) reloads with a toast. 390: the
// Earlier buttons alone. Each save is published (editor publish route) and
// GET /api/content must carry ascending `sort` in that order. Harmless: the
// dev DB keeps the order.
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, ROOT, check, done, publish as publishDraft } from "./browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8851";
const OUT = path.join(ROOT, "tests/gallery/out");
const H = { origin: ORIGIN };

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const read = async () => (await (await ctx.request.get(ORIGIN + "/api/admin/gallery")).json());
const publish = () => publishDraft(ctx.request, ORIGIN);
const J = JSON.stringify;

const sec = (run) => page.locator(`.adm-run[data-run="${run}"]`);
/** The order the grid shows (a removed upload is not part of it). */
const ids = (run) => sec(run).locator('.adm-tile:not([data-fixed="1"])').evaluateAll((e) => e.map((x) => x.dataset.id))
  .then(async (all) => { const m = await read(); return all.filter((id) => { const it = m.items.find((x) => x.id === id); return !(it.kind === "upload" && it.deleted); }); });
const tile = (run, id) => sec(run).locator(`.adm-tile[data-id="${id}"]`);
const note = (run) => sec(run).locator(".adm-run-note");
const saved = (run) => page.waitForFunction((r) => /Order saved/.test(document.querySelector(`.adm-run[data-run="${r}"] .adm-run-note`)?.textContent || ""), run);
/** API draft order of these ids: own.sort ascending, all present. */
const draftOk = async (want) => {
  const m = await read();
  const s = want.map((id) => m.items.find((x) => x.id === id).own.sort);
  return s.every((x, i) => Number.isFinite(x) && (i === 0 || x > s[i - 1]));
};
/** Published: GET /api/content gallery rows of the sub, sorted by sort, equal `want`. */
const publishedOk = async (want) => {
  await publish();
  const g = (await (await ctx.request.get(ORIGIN + "/api/content")).json()).gallery;
  const mine = g.filter((x) => want.includes(x.id));
  const asc = [...mine].sort((a, b) => a.sort - b.sort).map((x) => x.id);
  return [mine.length === want.length && mine.every((x) => Number.isFinite(x.sort)) && J(asc) === J(want), asc.slice(0, 4).join(",")];
};

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector('.adm-run[data-run="ads"] .adm-tile');

// --- 1440, keyboard: item 3 to first ----------------------------------------
const before = await ids("ads");
await sec("ads").locator("[data-act=reorder]").click();
check("Reorder: section in reorder mode, Save off, search off", (await sec("ads").getAttribute("data-reorder")) === "1" &&
  (await sec("ads").locator("[data-act=save-order]").isDisabled()) && (await page.locator("#search").isDisabled()));
await tile("ads", before[0]).click();
check("a tile click does not open the drawer while reordering", !(await page.locator("#drawer").evaluate((d) => d.open)));
await tile("ads", before[2]).focus();
await page.keyboard.press("Enter");
check("Enter picks the tile up (Move mode)", (await tile("ads", before[2]).getAttribute("data-moving")) === "1" && /Moving/.test(await note("ads").textContent()));
await page.keyboard.press("ArrowLeft");
await page.keyboard.press("ArrowLeft");
check("focus stays on the moving tile", (await page.evaluate(() => document.activeElement.dataset.id)) === before[2]);
await page.keyboard.press("Enter");
const kb = [before[2], before[0], before[1], ...before.slice(3)];
check("ArrowLeft x2 + Enter: item 3 is first", J(await ids("ads")) === J(kb), (await ids("ads")).slice(0, 3).join(","));
check("moved tiles are marked", (await sec("ads").locator('.adm-tile[data-moved="1"]').count()) === 3);
await page.screenshot({ path: path.join(OUT, "order-1440.png") });
await sec("ads").locator("[data-act=save-order]").click();
await saved("ads");
check("saved: API draft sort ascending in that order", await draftOk(kb));
check("saved tiles show the changed dot", (await tile("ads", kb[0]).locator(".adm-dot").count()) === 1);
let [ok, got] = await publishedOk(kb);
check("published: /api/content ads rows ascending sort, item 3 first", ok, got);

// --- Escape puts a picked-up tile back --------------------------------------
await sec("ads").locator("[data-act=reorder]").click();
await tile("ads", kb[0]).focus();
await page.keyboard.press("Enter");
await page.keyboard.press("ArrowRight");
await page.keyboard.press("ArrowRight");
await page.keyboard.press("Escape");
check("Escape: back where it was, Save off", J(await ids("ads")) === J(kb) && (await sec("ads").locator("[data-act=save-order]").isDisabled()));

// --- pointer drag ------------------------------------------------------------
await tile("ads", kb[1]).dragTo(tile("ads", kb[0]));
const dr = [kb[1], kb[0], ...kb.slice(2)];
check("drag item 2 onto item 1 puts it first", J(await ids("ads")) === J(dr), (await ids("ads")).slice(0, 3).join(","));
await sec("ads").locator("[data-act=save-order]").click();
await saved("ads");
check("drag saved: API draft order", await draftOk(dr));
[ok, got] = await publishedOk(dr);
check("published after drag", ok, got);

// --- 409: a piece edited elsewhere while reordering --------------------------
await sec("ads").locator("[data-act=reorder]").click();
await tile("ads", dr[0]).locator("xpath=..").getByRole("button", { name: /^Later/ }).click();
const row = (await read()).items.find((x) => x.id === dr[3]);
const bump = await ctx.request.put(`${ORIGIN}/api/admin/gallery/${encodeURIComponent(row.id)}`, { headers: H, data: { ...row.own, hidden: row.hidden, baseRev: row.rev } });
check("edited elsewhere (rev bumped)", bump.status() === 200, String(bump.status()));
await sec("ads").locator("[data-act=save-order]").click();
await page.waitForFunction(() => /changed elsewhere; order reloaded/.test(document.getElementById("order-toast")?.textContent || ""));
check("409: toast, reorder mode left, grid shows the saved order", (await sec("ads").getAttribute("data-reorder")) === null && J(await ids("ads")) === J(dr) && (await draftOk(dr)));

// --- 390: buttons only, Photos ----------------------------------------------
await page.setViewportSize({ width: 390, height: 800 });
await page.locator('.adm-tab[data-cat="photo"]').click();
await page.waitForSelector('.adm-run[data-run="photos"] .adm-tile');
const ph = await ids("photos");
await sec("photos").locator("[data-act=reorder]").click();
const earlier = () => tile("photos", ph[2]).locator("xpath=..").getByRole("button", { name: /^Earlier/ });
await earlier().click();
await earlier().click();
const pw = [ph[2], ph[0], ph[1], ...ph.slice(3)];
check("390: Earlier x2 puts item 3 first", J(await ids("photos")) === J(pw), (await ids("photos")).slice(0, 3).join(","));
const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
check("390: no horizontal scroll while reordering", sw[0] <= sw[1], sw.join());
await page.screenshot({ path: path.join(OUT, "order-390.png") });
await sec("photos").locator("[data-act=save-order]").click();
await saved("photos");
check("390 saved: API draft order", await draftOk(pw));
[ok, got] = await publishedOk(pw);
check("390 published: /api/content photos rows ascending sort, item 3 first", ok, got);


// --- 390, keyboard: Videos item 3 to first ----------------------------------
const vd = await ids("videos");
await sec("videos").locator("[data-act=reorder]").click();
await tile("videos", vd[2]).focus();
await page.keyboard.press("Enter");
await page.keyboard.press("Home");
await page.keyboard.press("Enter");
const vw = [vd[2], vd[0], vd[1], ...vd.slice(3)];
check("390 keyboard: Enter, Home, Enter puts item 3 first", J(await ids("videos")) === J(vw));
await sec("videos").locator("[data-act=save-order]").click();
await saved("videos");
[ok, got] = await publishedOk(vw);
check("390 published: /api/content videos rows ascending sort, item 3 first", (await draftOk(vw)) && ok, got);

await browser.close();
done();
