// Smoke: / and /admin/ load in Edge 1440 and WebKit 390; one shot each.
import { startDev, stopDev, edge, webkit, VIEWPORTS, ORIGIN, shot, watch, check, done } from "./lib/harness.mjs";

let dev;
try {
  dev = await startDev();
  for (const [label, launch, vp] of [["edge-1440", edge, VIEWPORTS.desktop], ["webkit-390", webkit, VIEWPORTS.phone]]) {
    const { browser, page } = await launch(vp);
    const w = watch(page);
    try {
      for (const p of ["/", "/admin/"]) {
        const r = await page.goto(ORIGIN + p, { waitUntil: "load" });
        check(`${label} ${p} status`, r && r.status() === 200, String(r && r.status()));
      }
      await shot(page, `smoke-${label}`);
      check(`${label} no page errors`, !w.errors.some((e) => e.startsWith("pageerror")), w.errors.join(" | ").slice(0, 200));
    } finally { await browser.close(); }
  }
} catch (e) { check("smoke ran", false, String(e)); }
finally { stopDev(dev); }
done();
