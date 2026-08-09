# -*- coding: utf-8 -*-
"""Solve each why-column's body size so its copy fills its own box.

A broadsheet does not set every column at one size: each has a fixed measure
and a fixed depth (the picture beside it), so the type is tuned per column.
This binary-searches the size that lands the inked extent on the target.

⚠️ Fill is the INKED extent (createRange), never the element box — a stretched
<p> is always exactly as tall as its row.
"""
import sys, json
from playwright.sync_api import sync_playwright

LANG = sys.argv[1] if len(sys.argv) > 1 else "ar"
W, H = 1280, 900
TARGET = 99.0          # aim just under full so nothing spills

AREAS = {
  "wb1-side":  ".wb1-side .why-para",
  "wb2-flow":  ".wb2-flow .why-para",
  "wb2-rail":  ".wb2-rail .why-para",
  "wb3-col-a": ".wb3-body > .wb-col:first-child .why-para",
  "wb3-col-b": ".wb3-body > .wb-col:last-child .why-para",
}

FILL = """(sel) => {
  const ink = el => { const r = document.createRange(); r.selectNodeContents(el);
                      return r.getBoundingClientRect(); };
  if (sel === '.wb1-side .why-para') {
    const s = document.querySelector('.wb1-side'), m = document.querySelector('.wb1-media');
    return 100 * ink(s).height / m.getBoundingClientRect().height;
  }
  if (sel === '.wb2-flow .why-para') {
    const f = document.querySelector('.wb2-flow'), p = f.querySelector('.why-para');
    const fb = f.getBoundingClientRect();
    // the flow's height is set by the two floats; fill it to their bottom
    const m2 = document.querySelector('.wb2-m2').getBoundingClientRect();
    return 100 * (ink(p).bottom - fb.top) / (m2.bottom - fb.top);
  }
  if (sel === '.wb2-rail .why-para') {
    const r = document.querySelector('.wb2-rail'), m = document.querySelector('.wb2-rail-media');
    const mb = m.getBoundingClientRect();
    return 100 * ink(r).height / (mb.height * 1.32);
  }
  const col = document.querySelector(sel.replace(' .why-para',''));
  const cut = document.querySelector('.wb3-media').getBoundingClientRect().height;
  return 100 * ink(col).height / cut;
}"""

SETSIZE = """([sel, px]) => {
  document.querySelectorAll(sel).forEach(p => { p.style.fontSize = px + 'px'; });
}"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=2)
    pg.goto("http://localhost:8321/index.html", wait_until="domcontentloaded")
    pg.wait_for_timeout(600)
    pg.evaluate("l=>localStorage.setItem('aliph-lang',l)", LANG)
    pg.reload(wait_until="domcontentloaded"); pg.wait_for_timeout(1500)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(400)

    result = {}
    for name, sel in AREAS.items():
        lo, hi = 10.0, 64.0
        for _ in range(18):
            mid = (lo + hi) / 2
            pg.evaluate(SETSIZE, [sel, mid])
            f = pg.evaluate(FILL, sel)
            if f > TARGET:
                hi = mid
            else:
                lo = mid
        pg.evaluate(SETSIZE, [sel, lo])
        f = pg.evaluate(FILL, sel)
        result[name] = (round(lo, 1), round(f, 1))
        print("  %-11s %5.1fpx  -> %5.1f%% full" % (name, lo, f))

    pg.locator(".why").screenshot(path="why_fitted_%s.png" % LANG)
    print("\nwrote why_fitted_%s.png" % LANG)
    print(json.dumps({k: v[0] for k, v in result.items()}))
    b.close()
