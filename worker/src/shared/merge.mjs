/* ══════════════════════════════════════════════════════════════════
   The published content merged into the tables — ONE merge, two callers.
   The Worker runs it on a copy of worker/src/generated/defaults.json before
   re-rendering the @static:* regions (render/regions.ts); main.js runs the
   same code on its own tables at boot (the admin content merge, P-07b), so a
   crawler and a visitor see the same words. Plain ESM with no imports and no
   Node or Worker APIs, so it can be copied into main.js as it is.

   It MUTATES the tables it is given, in place: main.js's tables are `const`
   bindings, so an array is spliced and pushed, never reassigned. A caller
   that must keep its tables (the Worker) passes a copy.

   What goes where (worker/CONTENT_API.md "Keys", "Gallery"):
     text, an I18N key        I18N[key][locale]
     text, a field key        the {ar, en} holder the key names, in SUBCATS /
                              PROJECTS / TESTIMONIALS (and META when the
                              tables carry it — the Worker's do, main.js's do
                              not). The holder is created when it is null or
                              absent (an anonymous name, a descShort).
     gallery, id = a MEDIA f  that row, overridden field by field; `hidden`
                              takes it off the site
     gallery, any other id    an upload, appended as a MEDIA row (hidden ones
                              are not)
   Not here: rings, media slots and film frames, which no @static region
   reads. The boot merge does those (P-07b).
   ══════════════════════════════════════════════════════════════════ */

const LOCALES = ["ar", "en"];
const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);

/* The path to a field key's {ar, en} holder, worked out from the key itself
   so main.js needs no registry. Keys are validated on write (validate.ts);
   this still refuses anything it does not recognise, and any index or id the
   tables do not have, by returning null. The holder of `.name` on a subcat or
   a project is the row itself (its `ar`/`en`). */
export function fieldPath(T, key) {
  const k = String(key).split(".");
  const index = (list, s) => (/^\d+$/.test(s) && list && +s < list.length ? +s : -1);
  if (k[0] === "meta" && k.length === 3) {
    return ["home", "about", "library"].includes(k[1]) && ["title", "description", "ogTitle", "ogDescription"].includes(k[2])
      ? ["META", k[1], k[2]] : null;
  }
  if (k[0] === "subcat" && k.length === 4) {
    const list = own(T.SUBCATS, k[1]) ? T.SUBCATS[k[1]] : null;
    const i = list ? list.findIndex((s) => s.id === k[2]) : -1;
    if (i < 0) return null;
    if (k[3] === "name") return ["SUBCATS", k[1], i];
    return k[3] === "desc" || k[3] === "descShort" ? ["SUBCATS", k[1], i, k[3]] : null;
  }
  if (k[0] === "project" && k.length === 3) {
    const i = index(T.PROJECTS, k[1]);
    if (i < 0) return null;
    if (k[2] === "name") return ["PROJECTS", i];
    if (k[2] === "desc") return ["PROJECTS", i, "desc"];
    return k[2] === "tagline" || k[2] === "body" ? ["PROJECTS", i, "profile", k[2]] : null;
  }
  if (k[0] === "testimonial" && k.length === 3) {
    const i = index(T.TESTIMONIALS, k[1]);
    return i >= 0 && ["name", "business", "quote"].includes(k[2]) ? ["TESTIMONIALS", i, k[2]] : null;
  }
  return null;
}

/* Set each overridden locale of `pair` on the holder at `path`. Everything
   above the holder must exist (a project with no profile has no tagline to
   set); the holder itself is created when null or absent. */
function setPair(T, path, pair) {
  let o = T;
  for (let i = 0; i < path.length - 1; i++) {
    if (o == null || typeof o !== "object") return false;
    o = o[path[i]];
  }
  if (o == null || typeof o !== "object") return false;
  const last = path[path.length - 1];
  if (o[last] == null) o[last] = {};
  const h = o[last];
  LOCALES.forEach((l) => { if (pair[l] !== undefined) h[l] = pair[l]; });
  return true;
}

/* A gallery item as a MEDIA row: `src`/`poster` are full URLs and stay under
   their own names (MEDIA's f/p are file names main.js builds R2 URLs from);
   a poster means a video, so `v` is set. An upload is filed as f = its id,
   with r = 1 and d = null when it has no ratio or date. */
function mediaRow(g, base) {
  const m = base ? Object.assign({}, base) : { f: g.id, c: g.cat, r: 1, d: null };
  if (g.src !== undefined) m.src = g.src;
  if (g.poster !== undefined) { m.poster = g.poster; m.v = 1; }
  if (g.cat !== undefined) m.c = g.cat;
  if (g.ratio !== undefined) m.r = g.ratio;
  if (g.date !== undefined) m.d = g.date;
  if (g.sub !== undefined) m.sub = g.sub;
  if (g.alt !== undefined) m.alt = Object.assign({}, g.alt);
  if (g.client !== undefined) m.client = g.client;
  return m;
}

/** Merge a published snapshot into the tables T, in place. Returns T. */
export function mergeContent(T, s) {
  if (!s) return T;
  const text = s.text || {};
  Object.keys(text).forEach((key) => {
    if (own(T.I18N, key)) setPair(T.I18N, [key], text[key]);
    else {
      const path = fieldPath(T, key);
      if (path) setPair(T, path, text[key]);
    }
  });

  const M = T.MEDIA;
  (s.gallery || []).forEach((g) => {
    if (!M) return;
    const at = M.findIndex((m) => m.f === g.id);
    if (at >= 0) {
      if (g.hidden) M.splice(at, 1);
      else M[at] = mediaRow(g, M[at]);
    } else if (!g.hidden && g.src && g.cat) {
      M.push(mediaRow(g, null));
    }
  });
  return T;
}
