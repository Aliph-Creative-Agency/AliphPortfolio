// C-09: the drawer's Client select on /admin/gallery/ in headless Edge against
//   wrangler dev --local --port 8871 --inspector-port 9271 (ADMIN_DEV_BYPASS=1)
//   node tests/clients/ui-drawer.mjs
// Makes its own client and upload in the LOCAL dev store and removes them again.
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
const item = async (id) => (await (await ctx.request.get(ORIGIN + "/api/admin/gallery")).json()).items.find((i) => i.id === id);

const mk = await (await ctx.request.post(ORIGIN + "/api/admin/clients", { headers: H, data: { name: { ar: "بيتا", en: `Beta ${run}` } } })).json();
const up = await (await ctx.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `dc-${run}.jpg` }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
await ctx.request.put(`${ORIGIN}/api/admin/gallery/${up.id}`, { headers: H, data: { src: up.url, cat: "photo", ratio: 1.5, date: "2026-01", baseRev: 0 } });

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector(".adm-tile");
await page.locator(".adm-client", { hasText: `Beta ${run}` }).waitFor();
const open = async () => {
  await page.click('.adm-tab[data-cat="photo"]');
  await page.locator(`.adm-tile[data-id="${up.id}"]`).click();
  await page.waitForSelector("#drawer[open]");
};
await open();
const opts = await page.$$eval("#d-client option", (o) => o.map((x) => x.textContent));
check("select = No client, clients by name, New client…", opts[0] === "No client" && opts.includes(`Beta ${run}`) && opts.at(-1) === "New client…", opts.join("|"));

// Assign an existing client, save, reload, the select shows it.
await page.selectOption("#d-client", mk.client.id);
await page.click("#d-save");
await page.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent));
check("API item carries the client", (await item(up.id)).own.client === mk.client.id);
await page.reload();
await page.waitForSelector(".adm-tile");
await open();
check("after reload the select shows it", (await page.inputValue("#d-client")) === mk.client.id);
check("panel count follows", await page.locator(".adm-client", { hasText: `Beta ${run}` }).locator(".adm-ccount").textContent() === "1 piece");

// New client… from inside the drawer: dialog, creates, selects it.
await page.selectOption("#d-client", { label: "New client…" });
await page.waitForSelector("#client-new[open]");
check("the select snaps back while the dialog is open", (await page.inputValue("#d-client")) === mk.client.id);
await page.fill('#client-new input[name="name.en"]', `Gamma ${run}`);
await page.fill('#client-new input[name="name.ar"]', "غاما");
await page.screenshot({ path: path.join(OUT, "drawer-new-client-1440.png") });
await page.click('#client-new button[type=submit]');
await page.waitForFunction(() => !document.getElementById("client-new").open);
const gamma = (await clients()).find((c) => c.name.en === `Gamma ${run}`);
check("new client created and selected", !!gamma && (await page.inputValue("#d-client")) === gamma.id);
await page.click("#d-save");
await page.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent));
check("saved with the new client", (await item(up.id)).own.client === gamma.id);

// Cancel in the dialog changes nothing; No client clears.
await page.selectOption("#d-client", { label: "New client…" });
await page.waitForSelector("#client-new[open]");
await page.click("#client-new button:has-text('Cancel')");
await page.waitForFunction(() => !document.getElementById("client-new").open);
check("cancel keeps the pick", (await page.inputValue("#d-client")) === gamma.id);
await page.selectOption("#d-client", "");
await page.click("#d-save");
await page.waitForFunction(() => /Saved/.test(document.getElementById("drawer-msg").textContent));
check("No client clears it", (await item(up.id)).own.client === undefined);

// 390 px: the drawer still has no sideways scroll.
await page.setViewportSize({ width: 390, height: 800 });
check("390: no sideways scroll", !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
await page.screenshot({ path: path.join(OUT, "drawer-client-390.png") });

// Clean up.
const it = await item(up.id);
await ctx.request.delete(`${ORIGIN}/api/admin/gallery/${up.id}?baseRev=${it.rev}`, { headers: H });
for (const c of await clients()) if (c.name.en.endsWith(run)) await ctx.request.delete(`${ORIGIN}/api/admin/clients/${c.id}?rev=${c.rev}`, { headers: H });
check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
done();
