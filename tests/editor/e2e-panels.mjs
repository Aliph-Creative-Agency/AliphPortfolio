// E-13a / E-13b e2e: side panels and dialogs close on Esc and on a visible close button (focus back on the opener, one
// Esc closes only the topmost layer), and the change rows read "Page · section · text" (no raw keys).
// Against `wrangler dev --local` on :8841 (ADMIN_DEV_BYPASS=1), headless Edge.   node tests/editor/e2e-panels.mjs   [EDITOR_WIDTH=390]
// Writes hero1 as a LOCAL draft (never published) and resets it at the end. Never run against anything remote.
import { chromium } from "playwright-core";

const BASE = process.env.EDITOR_BASE || "http://127.0.0.1:8841";
const W = Number(process.env.EDITOR_WIDTH || 1440);
const b = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: W < 768 ? 844 : 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(cond ? "ok  " : "FAIL", name, extra); if (!cond) fails++; };

const ready = async (path) => {
  await p.goto(BASE + path);
  await p.waitForFunction(() => window.aliphEdit && document.querySelector(".ed-bar"));
  await p.waitForTimeout(2500);
};
const write = (key, locale, value) =>
  p.evaluate(async ({ key, locale, value }) => {
    const c = await (await fetch("/api/admin/content")).json();
    const baseRev = ((c.locks.text[key] || {})[locale]) || 0;
    const r = await fetch("/api/admin/text", {
      method: value === null ? "DELETE" : "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(value === null ? { key, locale, baseRev } : { key, locale, value, baseRev }),
    });
    return r.status;
  }, { key, locale, value });
const focusedIs = (sel) => p.evaluate((s) => document.activeElement === document.querySelector(s), sel);
const visible = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.hidden && e.getClientRects().length > 0; }, sel);

await ready("/admin/edit/");
ok("draft hero1 written", (await write("hero1", "ar", "عنوان مسودة للاختبار")) === 200);
await ready("/admin/edit/");
await p.waitForFunction(() => !document.querySelector(".ed-publish").disabled, null, { timeout: 5000 });

// side panels: Page text, History
for (const [name, btn, panel] of [["Page text", ".ed-bar button[aria-controls=ed-panel]", "#ed-panel"], ["History", ".ed-bar button[aria-controls=ed-history]", "#ed-history"]]) {
  for (const how of ["Esc", "close button"]) {
    await p.focus(btn);
    await p.click(btn);
    await p.waitForSelector(panel + ":not([hidden])");
    ok(`${name}: close button is visible`, await visible(panel + " .ed-close"));
    if (how === "Esc") await p.keyboard.press("Escape");
    else await p.click(panel + " .ed-close");
    await p.waitForTimeout(150);
    ok(`${name}: ${how} closes it`, !(await visible(panel)));
    ok(`${name}: ${how} returns focus to the opener`, await focusedIs(btn));
    ok(`${name}: aria-expanded false`, (await p.getAttribute(btn, "aria-expanded")) === "false");
  }
}

// a dialog: Publish (needs a change), Discard
for (const [name, btn] of [["Publish", ".ed-publish"], ["Discard", ".ed-discard"]]) {
  for (const how of ["Esc", "Cancel button"]) {
    await p.focus(btn);
    await p.click(btn);
    await p.waitForSelector(".ed-confirm");
    if (how === "Esc") await p.keyboard.press("Escape");
    else await p.click(".ed-confirm .ed-pop-actions button:not(.is-primary)");
    await p.waitForTimeout(150);
    ok(`${name} dialog: ${how} closes it`, (await p.$(".ed-confirm")) === null);
    ok(`${name} dialog: ${how} returns focus to ${name}`, await focusedIs(btn));
  }
}

// one Esc closes only the topmost layer: a dialog over the open History panel
await p.click(".ed-bar button[aria-controls=ed-history]");
await p.waitForSelector("#ed-history:not([hidden])");
await p.focus(".ed-publish");
await p.click(".ed-publish");
await p.waitForSelector(".ed-confirm");
await p.keyboard.press("Escape");
await p.waitForTimeout(150);
ok("Esc closes the dialog only", (await p.$(".ed-confirm")) === null && (await visible("#ed-history")));
await p.keyboard.press("Escape");
await p.waitForTimeout(150);
ok("second Esc closes the panel", !(await visible("#ed-history")));
ok("focus on History", await focusedIs(".ed-bar button[aria-controls=ed-history]"));

// a popover over the open Page text panel: Esc closes the popover first
await p.click(".ed-bar button[aria-controls=ed-panel]");
await p.waitForSelector("#ed-panel:not([hidden])");
await p.click('#ed-panel .ed-row');
await p.waitForSelector(".ed-pop:not([hidden])");
await p.keyboard.press("Escape");
await p.waitForTimeout(150);
ok("Esc closes the popover, panel stays", !(await visible(".ed-pop")) && (await visible("#ed-panel")));
await p.keyboard.press("Escape");
await p.waitForTimeout(150);
ok("next Esc closes the panel", !(await visible("#ed-panel")));

// cleanup
await write("hero1", "ar", null);
ok("no page errors", errs.length === 0, errs.join("|"));
await b.close();
console.log(fails ? fails + " FAILED" : "ALL OK");
process.exit(fails ? 1 : 0);
