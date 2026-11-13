// C-07 / C-08: the Clients panel on /admin/gallery/ in headless Edge against
//   wrangler dev --local --port 8871 --inspector-port 9271 (ADMIN_DEV_BYPASS=1)
//   node tests/clients/ui-clients.mjs
// Creates its own clients in the LOCAL dev store and removes them again.
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
const list = async () => (await (await ctx.request.get(ORIGIN + "/api/admin/clients")).json()).clients;
const row = (name) => page.locator(".adm-client", { hasText: name });
const made = [];

await page.goto(ORIGIN + "/admin/gallery/");
await page.waitForSelector("#clients-new"); await page.waitForTimeout(500);
const before = await list();
if (!before.length) check("empty state says No clients yet", (await page.textContent("#clients-empty")).includes("No clients yet") && !(await page.isHidden("#clients-empty")));

// C-07: create through the form, server error on the field first.
await page.click("#clients-new");
await page.fill('input[name="name.en"]', `Acme ${run}`);
await page.fill('input[name="name.ar"]', `أكمي ${run}`);
await page.fill('input[name="url"]', "http://insecure.example");
await page.click(".adm-cform button[type=submit]");
await page.waitForFunction(() => document.querySelector('[data-field="url"] .adm-ferr')?.textContent);
check("server error shows on the website field", (await page.textContent('[data-field="url"] .adm-ferr')).length > 0);
await page.fill('input[name="url"]', "https://acme.example/");
await page.fill('input[name="year"]', "2024");
await page.fill('input[name="line.en"]', "Branding and film");
await page.screenshot({ path: path.join(OUT, "clients-form-1440.png") });
await page.click(".adm-cform button[type=submit]");
await page.waitForSelector(`.adm-client:has-text("Acme ${run}")`);
const mine = (await list()).find((c) => c.name.en === `Acme ${run}`);
made.push(mine);
check("created client lists with count 0 and a monogram", (await row(`Acme ${run}`).textContent()).includes("0 pieces") && (await row(`Acme ${run}`).locator(".adm-mono").textContent()) === "A");
check("API holds all fields", mine.year === 2024 && mine.url === "https://acme.example/" && mine.line.en === "Branding and film");

// A client with a very long name: wraps, no sideways scroll at 390.
await page.click("#clients-new");
const long = `Extraordinarily Long Client Name Incorporated International ${run}`;
await page.fill('input[name="name.en"]', long);
await page.fill('input[name="name.ar"]', "اسم عميل طويل جدا جدا جدا جدا جدا جدا جدا جدا جدا");
await page.click(".adm-cform button[type=submit]");
await page.waitForSelector(`.adm-client:has-text("${run}"):has-text("Extraordinarily")`);
made.push((await list()).find((c) => c.name.en === long));
for (const w of [390, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.locator("#clients").scrollIntoViewIfNeeded();
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  check(`no sideways scroll at ${w}`, !sideways);
  await page.locator("#clients").screenshot({ path: path.join(OUT, `clients-${w}.png`) });
}
await page.setViewportSize({ width: 1440, height: 900 });

// C-08: edit in place, survives reload.
await row(`Acme ${run}`).locator("button", { hasText: "Edit" }).click();
await page.fill('.adm-cform input[name="name.en"]', `Acme Renamed ${run}`);
await page.fill('.adm-cform input[name="year"]', "");
await page.click(".adm-cform button[type=submit]");
await page.waitForSelector(`.adm-client:has-text("Acme Renamed ${run}")`);
await page.reload();
await page.waitForSelector(`.adm-client:has-text("Acme Renamed ${run}")`);
const edited = (await list()).find((c) => c.id === mine.id);
check("edit survives a reload; blank year clears it", edited.name.en === `Acme Renamed ${run}` && edited.year === undefined && edited.url === "https://acme.example/");

// Cancel leaves it alone.
await row(`Acme Renamed ${run}`).locator("button", { hasText: "Edit" }).click();
await page.fill('.adm-cform input[name="name.en"]', "Nope");
await page.click(".adm-cform button:has-text('Cancel')");
check("cancel keeps the old name", await row(`Acme Renamed ${run}`).count() === 1);

// 409: change it behind the form's back, then save.
await row(`Acme Renamed ${run}`).locator("button", { hasText: "Edit" }).click();
const cur = (await list()).find((c) => c.id === mine.id);
const put = await ctx.request.put(`${ORIGIN}/api/admin/clients/${mine.id}`, { headers: H, data: { rev: cur.rev, name: { ar: cur.name.ar, en: `Acme Elsewhere ${run}` } } });
check("side edit ok", put.ok());
await page.fill('.adm-cform input[name="name.en"]', `Acme Mine ${run}`);
await page.click(".adm-cform button[type=submit]");
await page.waitForSelector(`.adm-client:has-text("Acme Elsewhere ${run}")`);
check("409 reloads the row and says so", /changed elsewhere/.test(await page.textContent("#clients-note")));

// Delete guard: 7 pieces use the client.
const up = [];
for (let i = 0; i < 2; i++) {
  const u = await (await ctx.request.post(ORIGIN + "/api/admin/upload", { headers: { ...H, "x-file-name": `cl-${run}-${i}.jpg` }, data: fs.readFileSync(path.join(FIX, "photo-plain.jpg")) })).json();
  await ctx.request.put(`${ORIGIN}/api/admin/gallery/${u.id}`, { headers: H, data: { src: u.url, cat: "photo", ratio: 1.5, date: "2026-01", baseRev: 0, client: mine.id } });
  up.push(u);
}
await page.reload();
await page.waitForSelector(`.adm-client:has-text("Acme Elsewhere ${run}")`);
check("count shows 2 pieces", (await row(`Acme Elsewhere ${run}`).textContent()).includes("2 pieces"));
await row(`Acme Elsewhere ${run}`).locator("button", { hasText: "Delete" }).click();
await page.waitForSelector("#confirm[open]");
await page.click("#confirm-yes");
await page.waitForFunction(() => /use this client/.test(document.getElementById("clients-note").textContent));
check("delete of a used client shows the count and deletes nothing", /2 pieces use this client/.test(await page.textContent("#clients-note")) && (await list()).some((c) => c.id === mine.id));

// Clean up: remove the pieces, then both clients through the UI confirm.
for (const u of up) {
  const it = (await (await ctx.request.get(ORIGIN + "/api/admin/gallery")).json()).items.find((i) => i.id === u.id);
  await ctx.request.delete(`${ORIGIN}/api/admin/gallery/${u.id}?baseRev=${it.rev}`, { headers: H });
}
await page.reload();
await page.waitForSelector(`.adm-client:has-text("Acme Elsewhere ${run}")`);
for (const name of [`Acme Elsewhere ${run}`, long]) {
  await row(name).locator("button", { hasText: "Delete" }).click();
  await page.waitForSelector("#confirm[open]");
  await page.click("#confirm-yes");
  await page.waitForFunction((n) => ![...document.querySelectorAll(".adm-client")].some((x) => x.textContent.includes(n)), name);
}
check("deleted clients leave the list", (await list()).filter((c) => made.some((m) => m && m.id === c.id)).length === 0);
check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
done();
