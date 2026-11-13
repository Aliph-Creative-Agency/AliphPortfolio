// Admin gallery grid (G-03). Reads GET /api/admin/gallery and draws every
// item filed the way /library files it: design -> "Digital Ads"; photo ->
// Videos / Photos. Each tile carries its SUBCATS `sub` as a chip ("unfiled"
// when none). Read-only here; the add / drawer / ring tasks build on the
// state and render() exported here (also on window.gallery).
//
// "deleted" means two things (leader's note):
//   upload            -> removed from the site        -> struck + "deleted"
//   default/override  -> "revert to default" staged   -> badge "revert staged", NOT struck

const RUNS = {
  design: [{ id: "ads", en: "Digital Ads", of: () => true }],
  photo: [
    { id: "videos", en: "Videos", of: (it) => it.video },
    { id: "photos", en: "Photos", of: (it) => !it.video },
  ],
};
const CAT_LABEL = { design: "Design", photo: "Photo", tech: "Tech" };
const CAT_ORDER = ["design", "photo", "tech"];

// order = the library sub being reordered (order.js): {cat, run, ids, base} or null
export const state = { items: [], subcats: {}, rings: {}, publishRev: 0, cat: null, q: "", order: null };

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** The file name an item is searched and labelled by: last path segment of its id. */
export const fileName = (it) => it.id.split("/").pop();

const subLabel = (it) => {
  if (!it.sub) return "unfiled";
  const s = (state.subcats[it.cat] || []).find((x) => x.id === it.sub);
  return s ? s.en : it.sub;
};

/** Library order inside a sub, as /library files it (editor E-10): a piece
 *  with a saved `sort` first, ascending; the rest after, newest date first,
 *  undated last, ties by id. */
export function byOrder(a, b) {
  const sa = a.own && Number.isFinite(a.own.sort) ? a.own.sort : null;
  const sb = b.own && Number.isFinite(b.own.sort) ? b.own.sort : null;
  if (sa !== null && sb !== null && sa !== sb) return sa - sb;
  if ((sa === null) !== (sb === null)) return sa === null ? 1 : -1;
  return (b.date || "").localeCompare(a.date || "") || a.id.localeCompare(b.id);
}

/** Tabs: design + photo always, any other category only when it has items. */
function categories() {
  const seen = new Set(["design", "photo"]);
  for (const it of state.items) if (it.cat) seen.add(it.cat);
  return [...seen].sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}

function tile(it) {
  const b = el("button", "adm-tile");
  b.type = "button";
  b.dataset.id = it.id;
  const removed = it.deleted && it.kind === "upload";
  b.dataset.hidden = it.hidden ? "1" : "0";
  b.dataset.removed = removed ? "1" : "0";
  b.dataset.changed = it.changed ? "1" : "0";
  b.dataset.kind = it.kind;
  const img = el("img", "adm-pic");
  img.loading = "lazy";
  img.alt = "";
  img.src = it.thumb;
  // Local dev: media.aliphcreative.com has no copy of an upload, the admin route does.
  img.addEventListener("error", () => {
    const m = /\/(admin\/.+)$/.exec(it.thumb);
    if (m && !img.dataset.fell) { img.dataset.fell = "1"; img.src = "/api/admin/media/" + m[1]; }
  });
  b.append(img);
  if (it.hidden) b.append(el("span", "adm-badge", "hidden"));
  if (removed) b.append(el("span", "adm-badge", "deleted"));
  else if (it.deleted) b.append(el("span", "adm-badge", "revert staged"));
  if (it.changed) { const d = el("span", "adm-dot"); d.title = "Changed, not published"; b.append(d); }
  if (it.video) b.append(el("span", "adm-vid", "video"));
  const meta = el("span", "adm-meta");
  meta.append(el("span", "adm-name", fileName(it)), el("span", "adm-chip", subLabel(it)), el("span", "", it.date || "undated"));
  b.append(meta);
  const flags = [it.hidden && "hidden", removed ? "deleted" : it.deleted && "revert staged", it.changed && "changed"].filter(Boolean);
  b.setAttribute("aria-label", [fileName(it), subLabel(it), ...flags].join(", "));
  return b;
}

export function render() {
  const cats = categories();
  if (!state.cat || !cats.includes(state.cat)) state.cat = cats[0];
  const q = state.q.trim().toLowerCase();
  const match = (it) => !q || fileName(it).toLowerCase().includes(q);

  const tabs = $("tabs");
  tabs.textContent = "";
  for (const c of cats) {
    const n = state.items.filter((it) => it.cat === c && match(it)).length;
    const t = el("button", "adm-tab", `${CAT_LABEL[c] || c} (${n})`);
    t.type = "button";
    t.setAttribute("role", "tab");
    t.setAttribute("aria-selected", c === state.cat ? "true" : "false");
    t.dataset.cat = c;
    t.addEventListener("click", () => { if (c !== state.cat) state.order = null; state.cat = c; render(); });
    tabs.append(t);
  }

  const grid = $("grid");
  grid.textContent = "";
  const inCat = state.items.filter((it) => it.cat === state.cat && match(it));
  const ord = state.order && state.order.cat === state.cat ? state.order : null;
  const runs = RUNS[state.cat] || [{ id: "all", en: CAT_LABEL[state.cat] || state.cat, of: () => true }];
  const claimed = new Set();
  for (const run of runs) {
    const rows = inCat.filter((it) => !claimed.has(it.id) && run.of(it));
    rows.forEach((it) => claimed.add(it.id));
    if (!rows.length) continue;
    // saved order first, then newest (as /library does); the sub being
    // reordered follows its working list (a removed upload stays last)
    if (ord && ord.run === run.id) {
      const at = new Map(ord.ids.map((id, i) => [id, i]));
      rows.sort((a, b) => (at.has(a.id) ? at.get(a.id) : 1e9) - (at.has(b.id) ? at.get(b.id) : 1e9) || byOrder(a, b));
    } else rows.sort(byOrder);
    const sec = el("section", "adm-run");
    sec.dataset.run = run.id;
    sec.dataset.cat = state.cat;
    const h = el("h2", "", run.en + " ");
    h.append(el("span", "", `(${rows.length})`));
    const ul = el("ul", "adm-grid");
    for (const it of rows) { const li = el("li"); li.append(tile(it)); ul.append(li); }
    sec.append(h, ul);
    grid.append(sec);
  }
  if (!inCat.length) grid.append(el("p", "adm-empty", q ? "No file matches that search." : "Nothing in this category yet."));

  const changed = state.items.filter((it) => it.changed).length;
  $("summary").textContent = `${state.items.length} items, ${changed} changed and not published`;
  document.dispatchEvent(new Event("gallery:render"));
}

export async function load() {
  const r = await fetch("/api/admin/gallery", { headers: { accept: "application/json" } });
  if (!r.ok) { $("summary").textContent = `Could not load the gallery (${r.status}).`; return; }
  Object.assign(state, await r.json());
  render();
}

$("search").addEventListener("input", (e) => { state.q = e.target.value; render(); });
window.gallery = { state, render, load, byOrder };
load();
