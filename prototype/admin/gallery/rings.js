// Admin gallery: ring picks (G-07). One panel per service that draws its ring
// from gallery items (design, photo; the tech ring turns project shots, which
// are not gallery items). The panel works on a local copy of the ring:
//   reorder  pointer drag, the Earlier / Later buttons, or the keyboard
//            (focus a pick, Alt+ArrowUp / Alt+ArrowDown, Alt+Home / Alt+End)
//   add      "Add from gallery" picker (search, this category's items)
//   remove   per pick
//   Save     PUT /api/admin/rings/:service {ids, baseRev}   (1..24 ids)
//   Reset    DELETE ?baseRev   back to main.js's default ring (confirm)
// 409 -> the panel takes the server's current ring and says so. A pick that is
// a hidden DEFAULT piece is allowed by the API and drawn with a "hidden" badge.
import { state, fileName } from "./gallery.js";

const SERVICES = [["design", "Design ring"], ["photo", "Photo ring"]];
const MAX = 24;
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const work = {}; // service -> ids being edited
const note = {}; // service -> {text, kind}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const dirty = (s) => !!work[s] && !!state.rings[s] && !same(work[s], state.rings[s].ids);
const byId = () => new Map(state.items.map((it) => [it.id, it]));

function say(s, text, kind) {
  note[s] = { text, kind: kind || "" };
  const n = document.querySelector(`.adm-ring-box[data-service="${s}"] .adm-ring-note`);
  if (n) { n.textContent = text; n.dataset.kind = kind || ""; }
}

function pick(s, id, i, items) {
  const it = items.get(id);
  const li = el("li", "adm-pick");
  li.dataset.id = id;
  li.tabIndex = 0;
  li.draggable = true;
  const name = it ? fileName(it) : id;
  li.setAttribute("aria-label", `${name}, position ${i + 1} of ${work[s].length}. Alt plus arrow keys move it.`);
  if (it) {
    const img = el("img", "adm-pick-pic");
    img.alt = ""; img.loading = "lazy"; img.src = it.thumb; img.draggable = false;
    img.addEventListener("error", () => {
      const m = /\/(admin\/.+)$/.exec(it.thumb);
      if (m && !img.dataset.fell) { img.dataset.fell = "1"; img.src = "/api/admin/media/" + m[1]; }
    });
    li.append(img);
  } else li.append(el("span", "adm-pick-pic"));
  const t = el("span", "adm-pick-name", name);
  li.append(el("span", "adm-pick-n", String(i + 1)), t);
  if (!it) li.append(el("span", "adm-badge-inline", "unknown"));
  else if (it.hidden) li.append(el("span", "adm-badge-inline", "hidden"));
  const btn = (text, label, fn, dis) => {
    const b = el("button", "adm-x", text);
    b.type = "button"; b.setAttribute("aria-label", `${label} ${name}`); b.disabled = !!dis;
    b.addEventListener("click", fn);
    li.append(b);
  };
  btn("Earlier", "Move earlier:", () => move(s, id, i - 1), i === 0);
  btn("Later", "Move later:", () => move(s, id, i + 1), i === work[s].length - 1);
  btn("Remove", "Remove", () => { work[s].splice(i, 1); say(s, ""); draw(s); });
  li.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const to = e.key === "ArrowUp" || e.key === "ArrowLeft" ? i - 1 : e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1 : e.key === "Home" ? 0 : e.key === "End" ? work[s].length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    move(s, id, to);
  });
  li.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; li.dataset.drag = "1"; });
  li.addEventListener("dragend", () => { delete li.dataset.drag; });
  li.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
  li.addEventListener("drop", (e) => {
    e.preventDefault();
    const from = e.dataTransfer.getData("text/plain");
    if (from && from !== id) move(s, from, i);
  });
  return li;
}

/** Move `id` to position `to` (clamped) and keep keyboard focus on it. */
function move(s, id, to) {
  const list = work[s];
  const from = list.indexOf(id);
  if (from < 0) return;
  const at = Math.max(0, Math.min(list.length - 1, to));
  if (at === from) return;
  list.splice(from, 1);
  list.splice(at, 0, id);
  say(s, `Moved to position ${at + 1}.`);
  draw(s);
  const box = document.querySelector(`.adm-ring-box[data-service="${s}"]`);
  const n = [...box.querySelectorAll(".adm-pick")].find((x) => x.dataset.id === id);
  if (n) n.focus();
}

async function call(s, method, url, payload) {
  const r = await fetch(url, { method, headers: payload ? { "content-type": "application/json" } : {}, body: payload && JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (r.ok) return j;
  if (r.status === 409 && j.current) {
    state.rings[s] = j.current;
    work[s] = [...j.current.ids];
    draw(s);
    say(s, "This ring changed elsewhere. It now shows the current picks; check them and try again.", "error");
  } else say(s, j.error || `The gallery refused it (${r.status}).`, "error");
  return null;
}

async function save(s) {
  const j = await call(s, "PUT", "/api/admin/rings/" + s, { ids: work[s], baseRev: state.rings[s].rev });
  if (!j) return;
  state.rings[s] = j.ring; work[s] = [...j.ring.ids];
  draw(s); say(s, "Saved (not published yet).", "ok");
}

async function reset(s) {
  const d = $("confirm");
  $("confirm-text").textContent = `Reset the ${s} ring to the site's default picks? Your picks are dropped when you publish.`;
  $("confirm-yes").textContent = "Reset";
  const ok = await new Promise((resolve) => {
    const done = (v) => { d.close(); resolve(v); };
    $("confirm-yes").onclick = () => done(true);
    $("confirm-no").onclick = () => done(false);
    d.oncancel = () => resolve(false);
    d.showModal();
  });
  if (!ok) return;
  const j = await call(s, "DELETE", `/api/admin/rings/${s}?baseRev=${state.rings[s].rev}`);
  if (!j) return;
  state.rings[s] = j.ring; work[s] = [...j.ring.ids];
  draw(s); say(s, "Reset to the default ring (not published yet).", "ok");
}

/** The picker: this category's items not already in the ring. A hidden or
 *  removed upload is refused by the API, so it is not offered. */
function openPicker(s) {
  const d = $("picker");
  d.dataset.service = s;
  $("picker-title").textContent = `Add to the ${s} ring`;
  $("picker-q").value = "";
  paintPicker();
  d.showModal();
  $("picker-q").focus();
}
function paintPicker() {
  const s = $("picker").dataset.service;
  const q = $("picker-q").value.trim().toLowerCase();
  const inRing = new Set(work[s]);
  const full = work[s].length >= MAX;
  const ul = $("picker-list");
  ul.textContent = "";
  const cands = state.items.filter((it) => it.cat === s && !inRing.has(it.id) && !(it.kind === "upload" && (it.hidden || it.deleted)) && (!q || fileName(it).toLowerCase().includes(q)));
  for (const it of cands) {
    const li = el("li");
    const b = el("button", "adm-tile");
    b.type = "button"; b.dataset.id = it.id; b.disabled = full;
    const img = el("img", "adm-pic");
    img.alt = ""; img.loading = "lazy"; img.src = it.thumb;
    img.addEventListener("error", () => {
      const m = /\/(admin\/.+)$/.exec(it.thumb);
      if (m && !img.dataset.fell) { img.dataset.fell = "1"; img.src = "/api/admin/media/" + m[1]; }
    });
    b.append(img);
    if (it.hidden) b.append(el("span", "adm-badge", "hidden"));
    b.append(el("span", "adm-meta", fileName(it)));
    b.setAttribute("aria-label", `Add ${fileName(it)}`);
    b.addEventListener("click", () => { work[s].push(it.id); say(s, ""); draw(s); paintPicker(); });
    li.append(b);
    ul.append(li);
  }
  $("picker-count").textContent = full ? `The ring is full (${MAX}).` : `${cands.length} item(s) to add.`;
}

function draw(s) {
  const box = document.querySelector(`.adm-ring-box[data-service="${s}"]`);
  if (!box) return;
  const ring = state.rings[s];
  const items = byId();
  const ol = box.querySelector(".adm-ring");
  ol.textContent = "";
  work[s].forEach((id, i) => ol.append(pick(s, id, i, items)));
  const n = work[s].length;
  const bits = [`${n} of ${MAX}`, ring.isDefault && !dirty(s) ? "default picks" : "custom picks"];
  if (ring.changed) bits.push("changed, not published");
  if (dirty(s)) bits.push("unsaved edits");
  box.querySelector(".adm-ring-sub").textContent = bits.join(" · ");
  box.querySelector("[data-act=save]").disabled = !dirty(s) || n < 1 || n > MAX;
  box.querySelector("[data-act=discard]").disabled = !dirty(s);
  box.querySelector("[data-act=add]").disabled = n >= MAX;
  box.querySelector("[data-act=reset]").disabled = ring.isDefault;
  const nt = note[s] || { text: "", kind: "" };
  const nn = box.querySelector(".adm-ring-note");
  nn.textContent = n < 1 ? "A ring needs at least one item." : nt.text;
  nn.dataset.kind = n < 1 ? "error" : nt.kind;
}

function build() {
  const host = $("rings");
  host.textContent = "";
  host.append(el("h2", "", "Ring picks"));
  // U-08: on a phone each ring folds to its title and state line, so the pictures are not buried under ~2000 px
  // of picks; a wider screen opens them as before
  const phone = window.matchMedia("(max-width: 520px)").matches;
  for (const [s, label] of SERVICES) {
    const box = el("details", "adm-ring-box");
    box.dataset.service = s;
    box.open = !phone;
    const head = el("summary", "adm-ring-head");
    head.append(el("h3", "", label), el("span", "adm-ring-sub"));
    const bar = el("div", "adm-dact");
    for (const [act, text, cls] of [["add", "Add from gallery…", "adm-btn adm-btn-2"], ["save", "Save ring", "adm-btn"], ["discard", "Discard edits", "adm-btn adm-btn-2"], ["reset", "Reset to default", "adm-btn adm-btn-2"]]) {
      const b = el("button", cls, text);
      b.type = "button"; b.dataset.act = act;
      bar.append(b);
    }
    bar.querySelector("[data-act=add]").addEventListener("click", () => openPicker(s));
    bar.querySelector("[data-act=save]").addEventListener("click", () => save(s));
    bar.querySelector("[data-act=discard]").addEventListener("click", () => { work[s] = [...state.rings[s].ids]; say(s, ""); draw(s); });
    bar.querySelector("[data-act=reset]").addEventListener("click", () => reset(s));
    const nt = el("p", "adm-ring-note");
    nt.setAttribute("role", "status");
    const ol = el("ol", "adm-ring");
    ol.setAttribute("aria-label", label);
    box.append(head, ol, bar, nt);
    host.append(box);
  }
}

/** After every grid render: new rings from a load() replace an untouched copy;
 *  an edited copy is kept (the thumbnails and hidden badges still refresh). */
function sync() {
  if (!state.rings || !Object.keys(state.rings).length) return;
  if (!$("rings").firstChild) build();
  for (const [s] of SERVICES) {
    const r = state.rings[s];
    if (!r) continue;
    if (!work[s] || !dirty(s)) work[s] = [...r.ids];
    draw(s);
  }
}

$("picker-q").addEventListener("input", paintPicker);
$("picker-close").addEventListener("click", () => $("picker").close());
document.addEventListener("gallery:render", sync);
sync();
