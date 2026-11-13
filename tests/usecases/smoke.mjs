// Harness smoke: /admin/ (step 1) and / in AR (step 2) in both configs.
import { startDev, stopDev, resetState, configs, ORIGIN, step, startRun, setLang, check, done } from "./lib/uc.mjs";

let dev;
try {
  resetState();
  dev = await startDev();
  for (const cfg of configs()) {
    startRun("UC-00", cfg.name);
    const { browser, page } = await cfg.open();
    try {
      const a = await step(page, { uc: "UC-00", cfg: cfg.name, n: 1, slug: "admin-home", expect: "/admin/ loads 200" }, async () => {
        const r = await page.goto(ORIGIN + "/admin/", { waitUntil: "load" }); await page.waitForTimeout(800);
        return r.status() === 200;
      });
      const b = await step(page, { uc: "UC-00", cfg: cfg.name, n: 2, slug: "home-ar", expect: "/ loads in AR, dir rtl" }, async () => {
        await page.goto(ORIGIN + "/", { waitUntil: "load" });
        await setLang(page, "ar");
        return (await page.evaluate(() => document.documentElement.dir)) === "rtl";
      });
      check(`${cfg.name} steps ok`, a.ok && b.ok);
    } finally { await browser.close(); }
  }
} catch (e) { check("smoke ran", false, String(e)); }
finally { stopDev(dev); }
done();
