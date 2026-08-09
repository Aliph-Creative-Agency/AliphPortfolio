"""Compare the rendered layout against the wireframe's measured geometry,
and report how full each text box is.

TARGETS come from extract.py, normalised to the section's content width.
fill% = how much of its box a text element actually occupies. Under ~85%
is the cream void the user keeps rejecting.
"""
import json
from playwright.sync_api import sync_playwright

# slot -> (target width as % of its container, target aspect w/h or None)
TARGETS = {
    ".wb1-side":        (30.1, None),
    ".wb1-media":       (69.2, 1.50),
    ".wb2-rail":        (39.9, None),
    ".wb2-main":        (59.3, None),
    ".wb2-rail-media":  (100.0, 0.5625),
    ".wb2-m1":          (54.3, 1.00),
    ".wb2-m2":          (56.7, 1.167),
    ".wb3-media":       (44.6, 0.571),
}

JS = """
() => {
  const pct = (el, parent) => 100 * el.getBoundingClientRect().width / parent.getBoundingClientRect().width;
  const out = { slots: {}, fill: {}, heights: {} };
  for (const sel of __SELS__) {
    const el = document.querySelector(sel);
    if (!el) { out.slots[sel] = null; continue; }
    const r = el.getBoundingClientRect();
    out.slots[sel] = {
      w: +pct(el, el.parentElement).toFixed(1),
      aspect: +(r.width / r.height).toFixed(3),
    };
  }
  // how full is each text box? compare scrollHeight of the column to its box
  const pairs = [
    ['block1 text col', '.wb1-side', '.wb1-media'],
    ['b2 rowA text',    '.wb2-a > .wb-col', '.wb2-m1'],
    ['b2 rowC text',    '.wb2-c > .wb-col', '.wb2-m2'],
    ['b2 rail col',     '.wb2-rail', '.wb2-main'],
    ['b3 text right',   '.wb3-body > .wb-col:first-child', '.wb3-media'],
    ['b3 text left',    '.wb3-body > .wb-col:last-child', '.wb3-media'],
    ['switcher text',   '.sw-text', '.sw-stage'],
  ];
  for (const [name, a, b] of pairs) {
    const ea = document.querySelector(a), eb = document.querySelector(b);
    if (!ea || !eb) { out.fill[name] = null; continue; }
    // Measure the INKED extent, not the box.
    // align-items:stretch makes every <p> as tall as its grid row, so the
    // box height always reports full and hides the void completely. A Range
    // over the contents gives the height the glyphs actually occupy.
    const rng = document.createRange();
    rng.selectNodeContents(ea);
    const ha = rng.getBoundingClientRect().height;
    const hb = eb.getBoundingClientRect().height;
    out.fill[name] = { text: Math.round(ha), box: Math.round(hb), fill: Math.round(100 * ha / hb) };
  }
  for (const s of ['.why', '.services', '.wb1', '.wb2', '.wb3']) {
    const e = document.querySelector(s);
    if (e) out.heights[s] = Math.round(e.getBoundingClientRect().height);
  }
  out.overflow = document.documentElement.scrollWidth - innerWidth;
  return out;
}
""".replace("__SELS__", json.dumps(list(TARGETS)))

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.goto("http://localhost:8321/", wait_until="domcontentloaded")
    pg.evaluate("() => document.fonts.ready"); pg.wait_for_timeout(1200)
    r = pg.evaluate(JS)

    print("SLOT                 width%%  target   aspect  target")
    for sel, (tw, ta) in TARGETS.items():
        got = r["slots"].get(sel)
        if not got:
            print("  %-18s MISSING" % sel); continue
        wf = "OK " if abs(got["w"] - tw) <= 2.5 else "OFF"
        af = "" if ta is None else ("OK " if abs(got["aspect"] - ta) / ta <= 0.08 else "OFF")
        print("  %-18s %5.1f  %5.1f %s   %6.3f %s %s" %
              (sel, got["w"], tw, wf, got["aspect"], ("%.3f" % ta) if ta else "  -  ", af))

    print("\nTEXT FILL (under 85%% = a cream void)")
    for k, v in r["fill"].items():
        if not v:
            print("  %-18s MISSING"); continue
        flag = "" if v["fill"] >= 85 else "   <-- underfull"
        print("  %-18s %3d%%  (text %4d / box %4d)%s" % (k, v["fill"], v["text"], v["box"], flag))

    print("\nheights:", r["heights"], " overflow:", r["overflow"])
    for sel, name in [(".why", "sec-why"), (".services", "sec-svc")]:
        el = pg.query_selector(sel)
        el.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        el.screenshot(path=r"C:\Users\Obaida\AppData\Local\Temp\claude\D--Personal-Projects-aliph-portfolio\cf6782e4-0161-4ab2-9ddd-1d972752cbe8\scratchpad\%s.png" % name)
    b.close()
