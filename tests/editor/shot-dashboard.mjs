import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://127.0.0.1:8841/admin/", { waitUntil: "networkidle" });
  const o = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.getElementById("who").textContent]);
  console.log(w, o);
  await p.screenshot({ path: `.wrangler/dash-${w}.png` });
}
await b.close();
