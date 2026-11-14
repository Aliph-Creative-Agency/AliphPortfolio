// LOOK-A helpers for the use-case scripts (CASES.md §0): overflow / clipping / small touch targets / overlap,
// plus a per-step checker that tells a new failure (FAIL, fails the run) from a proven one (KNOWN U-NN, does not).

/**
 * A1 + A3 measured inside `scope`: horizontal page scroll, text boxes clipped by overflow hidden/clip,
 * and (touch) interactive elements under 44x44 css px. Returns {hScroll, clipped[], small[]}.
 */
export async function lookA(page, { touch = false, scope = "body" } = {}) {
  return page.evaluate(({ scope, touch }) => {
    const desc = (e) => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") +
      (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).join(".") : "") +
      ` "${(e.getAttribute("aria-label") || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28)}"`;
    const vis = (e) => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const root = document.querySelector(scope) || document.body;
    const out = { hScroll: document.documentElement.scrollWidth - innerWidth, clipped: [], small: [] };
    for (const e of root.querySelectorAll("*")) {
      if (!vis(e) || !e.textContent.trim()) continue;
      const cs = getComputedStyle(e);
      if (e.scrollWidth > e.clientWidth + 1 && /hidden|clip/.test(cs.overflowX) && cs.textOverflow !== "ellipsis") out.clipped.push(`${desc(e)} ${e.scrollWidth}>${e.clientWidth}`);
    }
    if (touch) {
      for (const e of root.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[tabindex='0']")) {
        if (!vis(e)) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 44 || r.height < 44) out.small.push(`${desc(e)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  }, { scope, touch });
}

/** Bounding rect of the first match (null if none / not rendered). */
export async function rect(page, sel) {
  return page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return r.width || r.height ? { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom } : null;
  }, sel);
}
export const overlaps = (a, b) => !!(a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom);

/**
 * Sub-checks of one step. c.ok(cond, msg) logs FAIL on a new problem; c.known("U-NN", cond, msg) logs
 * KNOWN U-NN for a problem already in REPORT and does not fail; c.note(msg) logs a value for the next step.
 * The step fn returns c.pass.
 */
export function checker(tag) {
  const c = {
    pass: true,
    ok(cond, msg) { if (!cond) { c.pass = false; console.log(`   FAIL ${tag}: ${msg}`); } return !!cond; },
    known(id, cond, msg) { if (!cond) console.log(`   KNOWN ${id} ${tag}: ${msg}`); return !!cond; },
    note(msg) { console.log(`   note ${tag}: ${msg}`); },
  };
  return c;
}
