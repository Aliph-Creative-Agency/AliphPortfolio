// C-10: select mode + bulk assign on /admin/gallery/ in headless Edge against
//   wrangler dev --local --port 8871 --inspector-port 9271 (ADMIN_DEV_BYPASS=1)
//   node tests/clients/ui-assign.mjs
// Makes its own client and 4 uploads in the LOCAL dev store and removes them again.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { EDGE, FIX, ROOT, check, done } from "../gallery/browser.mjs";

const ORIGIN = process.env.ORIGIN || "http://127.0.0.1:8871";
const OUT = path.join(ROOT, "tests/clients/out");
fs.mkdirSync(OUT, { recursive: true });
const run = Date.now().toString(36);
const H = { origin: ORIGIN };

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const clients = async () => (await (await ctx.request.get(ORIGIN + "/api/admin/clients")).json()).clients;
const items = async () => (await (await ctx.request.get(ORIGIN + "/api/admin/gallery")).json()).items;

let mk;
const ups = [];
// Clean-up runs on success AND on a throw or timeout: it tolerates a half-made setup.
const clean = async () => {
  for (const u of ups) {
    try {
      const it = (await items()).find((i) => i.id === u.id);
      if (it) await ctx.request.delete(`${ORIGIN}/api/admin/gallery/${u.id}?baseRev=${it.rev}`, { headers: H });
    } catch {}
  }
  try {
    for (const c of await clients()) if (c.name.en.endsWith(run)) await ctx.request.delete(`${ORIGIN}/api/admin/clients/${c.id}?rev=${c.rev}`, { headers: H });
  } catch {}
  await browser.close();
};
try {
  mk = (await (await ctx.request.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "دلتا", en: `Delta ${run}` } } })).json()).client;
  for (let i = 0; i < 4; i++) {
    const u = await (await ctx.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `as-${run}-${i}.jpg` }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
    await ctx.request.put(`${ORIGIN}/api/admin/gallery/${u.id}`, { headers: H, data: { src: u.url, cat: "photo", ratio: 1.5, date: "2026-02", baseRev: 0 } });
    ups.push(u);
  }
  const tile = (id) => page.locator(`.adm-tile[data-id="${id}"]`);
  const owned = async () => (await items()).filter((i) => ups.some((u) => u.id === i.id) && i.own.client === mk.id).length;

  await page.goto(ORIGIN + "/admin/gallery/");
  await page.waitForSelector(".adm-tile");
  await page.click('.adm-tab[data-cat="photo"]');
  await page.locator(".adm-client", { hasText: `Delta ${run}` }).waitFor();
  check("bar is hidden outside select mode", await page.locator("#assign-bar").isHidden());

  await page.click("#select-toggle");
  check("bar shows in select mode, Assign disabled", (await page.locator("#assign-bar").isVisible()) && (await page.locator("#assign-go").isDisabled()));
  for (const u of ups.slice(0, 3)) await tile(u.id).click();
  check("a tile click ticks and does not open the drawer", (await page.locator("#drawer[open]").count()) === 0 && (await page.locator('.adm-tile[data-picked="1"]').count()) === 3);
  check("bar says Assign 3 to", (await page.textContent("#assign-n")).trim() === "Assign 3 to");
  await page.selectOption("#assign-client", mk.id);
  await page.screenshot({ path: path.join(OUT, "assign-1440.png") });

  // untick one and tick it again
  await tile(ups[2].id).click();
  check("click again unticks", (await page.textContent("#assign-n")).trim() === "Assign 2 to");
  await tile(ups[2].id).click();

  // Clear empties the picks
  await page.click("#assign-clear");
  check("Clear empties the selection", (await page.locator('.adm-tile[data-picked="1"]').count()) === 0 && (await page.locator("#assign-go").isDisabled()));
  for (const u of ups.slice(0, 3)) await tile(u.id).click();
  await page.selectOption("#assign-client", mk.id);

  // 409: one picked piece changes behind the grid's back.
  const cur = (await items()).find((i) => i.id === ups[0].id);
  await ctx.request.put(`${ORIGIN}/api/admin/gallery/${ups[0].id}`, { headers: H, data: { ...cur.own, cat: "photo", ratio: 1.5, date: "2026-02", alt: { en: "elsewhere" }, baseRev: cur.rev } });
  await page.click("#assign-go");
  await page.waitForFunction(() => /changed elsewhere/.test(document.getElementById("assign-note").textContent));
  check("409 reloads, assigns nothing, drops the picks", (await owned()) === 0 && (await page.locator('.adm-tile[data-picked="1"]').count()) === 0);

  // Real assign.
  for (const u of ups.slice(0, 3)) await tile(u.id).click();
  await page.selectOption("#assign-client", mk.id);
  await page.click("#assign-go");
  await page.waitForFunction(() => /Assigned 3 pieces/.test(document.getElementById("assign-note").textContent));
  check("API: 3 pieces carry the client", (await owned()) === 3);
  await page.locator(".adm-client", { hasText: `Delta ${run}` }).getByText("3 pieces").waitFor();
  check("Clients panel count is 3", true);

  // A reload empties select mode and the picks.
  await page.reload();
  await page.waitForSelector(".adm-tile");
  check("selection never survives a reload", await page.locator("#assign-bar").isHidden() && (await page.locator('.adm-tile[data-picked="1"]').count()) === 0);

  // Clear a client: "No client" through the bar.
  await page.click('.adm-tab[data-cat="photo"]');
  await page.click("#select-toggle");
  await tile(ups[1].id).click();
  await page.selectOption("#assign-client", { label: "No client (clear)" });
  await page.click("#assign-go");
  await page.waitForFunction(() => /Assigned 1 piece /.test(document.getElementById("assign-note").textContent));
  check("No client clears one piece", (await owned()) === 2);

  // Reorder mode is unavailable while selecting; the toggle is off during reorder.
  await page.click("#select-toggle");
  const reorderBtn = page.locator('.adm-run[data-run="photos"] [data-act="reorder"]');
  if (await reorderBtn.count()) {
    await reorderBtn.click();
    check("select toggle is disabled during reorder", await page.locator("#select-toggle").isDisabled());
  }

  // 390: sticky bar, no sideways scroll.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.reload();
  await page.waitForSelector(".adm-tile");
  await page.click('.adm-tab[data-cat="photo"]');
  await page.click("#select-toggle");
  await tile(ups[0].id).click();
  check("390: no sideways scroll", !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  const bar = await page.locator("#assign-bar").boundingBox();
  check("390: the bar sits at the bottom of the viewport", bar && Math.abs(bar.y + bar.height - 800) < 2, JSON.stringify(bar));
  await page.screenshot({ path: path.join(OUT, "assign-390.png") });

} finally {
  await clean();
}
check("no page errors", errors.length === 0, errors.join(" | "));
done();
