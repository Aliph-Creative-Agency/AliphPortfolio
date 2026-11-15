// Deleting a client that pieces use (the gallery's Clients panel): the confirm says how many pieces use it and
// that they will show no client; Delete sends ?rev=&unassign=1; the panel says how many pieces it was taken off
// and the grid is read again (the pieces' revs changed). A stale client gets the "changed elsewhere" note.
//   PORT=8787 node tests/clients/ui-delete-unassign.mjs                          WebKit (the QA harness's exe)
//   PORT=8787 CHROMIUM=/path/to/chrome node tests/clients/ui-delete-unassign.mjs Chromium instead
// Needs a running `npx wrangler dev --local --port $PORT` (ADMIN_DEV_BYPASS=1 in .dev.vars). Local only.
// Writes nothing and creates no client: the client list and the DELETE answers are mocked in the browser.
import { existsSync } from "node:fs";
import { chromium, webkit } from "playwright-core";
import { WEBKIT, check, done } from "../qa/lib/harness.mjs";

const PORT = Number(process.env.PORT) || 8787;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try { await fetch(ORIGIN + "/admin/", { redirect: "manual" }); }
catch { console.error(`no dev server on ${ORIGIN}: start \`npx wrangler dev --local --port ${PORT}\` first`); process.exit(2); }

let browser, L;
if (process.env.CHROMIUM) { browser = await chromium.launch({ executablePath: process.env.CHROMIUM }); L = "chromium"; }
else { browser = await webkit.launch({ headless: true, ...(existsSync(WEBKIT) ? { executablePath: WEBKIT } : {}) }); L = "webkit"; }

const C = { id: "qa-used", name: { en: "Used Client", ar: "عميل مستخدم" }, rev: 3, published: true, changed: false, pieces: 4 };

async function run(answer) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  let list = [C], sent = null, galleryReads = 0;
  await page.route("**/api/admin/clients**", (r) => {
    const req = r.request();
    if (req.method() === "GET") return r.fulfill({ json: { clients: list } });
    if (req.method() === "DELETE") {
      sent = req.url();
      if (answer.status === 200) list = [];
      return r.fulfill({ status: answer.status, json: answer.body });
    }
    return r.continue();
  });
  page.on("request", (q) => { if (q.method() === "GET" && /\/api\/admin\/gallery(\?|$)/.test(q.url())) galleryReads++; });
  await page.goto(ORIGIN + "/admin/gallery/", { waitUntil: "load" });
  await page.waitForSelector("#clients-list .adm-client");
  await sleep(300);
  const readsBefore = galleryReads;
  await page.locator('#clients-list .adm-client button[aria-label^="Delete"]').click();
  await page.waitForSelector("#confirm[open]");
  const confirm = (await page.locator("#confirm-text").innerText()).trim();
  await page.locator("#confirm-yes").click();
  await page.waitForFunction(() => (document.getElementById("clients-note").textContent || "").trim(), null, { timeout: 8000 }).catch(() => {});
  await sleep(600);
  const note = (await page.locator("#clients-note").innerText()).trim();
  const out = { confirm, sent, note, reread: galleryReads - readsBefore, rows: await page.locator("#clients-list .adm-client").count(), errs };
  await page.close();
  return out;
}

try {
  const ok = await run({ status: 200, body: { deleted: C.id, unassigned: 4 } });
  check(`${L} the confirm says 4 pieces use the client and will show no client`, /4 pieces use this client/.test(ok.confirm) && /no client/.test(ok.confirm), JSON.stringify(ok.confirm));
  check(`${L} Delete sends the rev it read and unassign=1`, !!ok.sent && /\/api\/admin\/clients\/qa-used\?rev=3&unassign=1$/.test(ok.sent), String(ok.sent));
  check(`${L} after Delete the panel says it took the client off 4 pieces`, /^Deleted Used Client and took it off 4 pieces \(not published yet\)\.$/.test(ok.note), JSON.stringify(ok.note));
  check(`${L} the client is gone from the list and the grid is read again`, ok.rows === 0 && ok.reread >= 1, `rows ${ok.rows}, gallery reads ${ok.reread}`);
  check(`${L} no page errors`, !ok.errs.length, ok.errs.join(" | "));

  const stale = await run({ status: 409, body: { error: "changed elsewhere; reload", current: { ...C, rev: 4 } } });
  check(`${L} a stale client: "changed elsewhere", the client stays`, /changed elsewhere/.test(stale.note) && stale.rows === 1, JSON.stringify({ note: stale.note, rows: stale.rows }));
} catch (e) { check(`${L} ran`, false, String(e.stack || e)); }
await browser.close();
done();
