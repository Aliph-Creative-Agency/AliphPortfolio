// Admin gallery: library order inside one sub (G-06b). A sub here is a grid
// section = a /library run (design: Digital Ads; photo: Videos / Photos), the
// unit POST /api/admin/gallery/order takes. "Reorder" on a section works on a
// local copy of its order (state.order, drawn by gallery.js render()):
//   pointer  drag a tile onto another (desktop)
//   buttons  Earlier / Later under each tile (phone: no drag needed)
//   keyboard focus a tile, Enter or Space picks it up ("Move" mode), arrow
//            keys / Home / End move it, Enter drops it there, Escape puts it
//            back where it was picked up
//   Save order  POST {cat, sub, items: [{id, rev}]} with every piece of the
//               sub (an upload staged for deletion is not one)
// 409 -> the grid reloads and a toast says so. While a section is being
// reordered its tiles do not open the drawer and search is off.
import { state, render, load, fileName } from "./gallery.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const RUN_LABEL = { ads: "Digital Ads", videos: "Videos", photos: "Photos" };
const gone = (it) => it.kind === "upload" && it.deleted;
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

let moving = null; // keyboard Move mode: {id, from}
let msg = { text: "", kind: "" };
let msgAt = ""; // "cat/run" of the section a message after Save / Cancel belongs to
let busy = false;

/** The ids of a section's pieces in the order the grid shows them. */
const shown = (sec) =>
  [...sec.querySelectorAll(".adm-tile")].map((t) => t.dataset.id)
    .filter((id) => { const it = state.items.find((x) => x.id === id); return it && !gone(it); });

function start(sec) {
  const ids = shown(sec);
  state.order = { cat: sec.dataset.cat, run: sec.dataset.run, ids, base: [...ids] };
  state.q = ""; $("search").value = "";
  moving = null;
  msg = { text: "Drag a tile, use Earlier / Later, or focus a tile and press Enter to move it with the arrow keys.", kind: "" };
  render();
  const first = document.querySelector(`.adm-run[data-run="${state.order.run}"] .adm-tile`);
  if (first) first.focus();
}

function stop(text, kind) {
  if (state.order) msgAt = state.order.cat + "/" + state.order.run;
  state.order = null; moving = null;
  msg = { text: text || "", kind: kind || "" };
  render();
}

/** Move `id` to index `to` (clamped), redraw, keep focus on it. */
function move(id, to, say = true) {
  const list = state.order.ids;
  const from = list.indexOf(id);
  if (from < 0) return;
  const at = Math.max(0, Math.min(list.length - 1, to));
  if (at !== from) { list.splice(from, 1); list.splice(at, 0, id); }
  if (say) msg = { text: `${fileName({ id })}: position ${at + 1} of ${list.length}.`, kind: "" };
  render();
  const t = document.querySelector(`.adm-run[data-run="${state.order.run}"] .adm-tile[data-id="${CSS.escape(id)}"]`);
  if (t) t.focus();
}

function toast(text) {
  let t = $("order-toast");
  if (!t) { t = el("p", "adm-toast"); t.id = "order-toast"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 6000);
}

async function save() {
  const o = state.order;
  const byId = new Map(state.items.map((it) => [it.id, it]));
  busy = true; msg = { text: "Saving…", kind: "" }; render();
  let r, j;
  try {
    r = await fetch("/api/admin/gallery/order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cat: o.cat, sub: o.run, items: o.ids.map((id) => ({ id, rev: byId.get(id).rev })) }),
    });
    j = await r.json().catch(() => ({}));
  } catch {
    r = { ok: false, status: 0 }; j = {};
  }
  busy = false;
  if (r.ok) {
    const fresh = new Map(j.items.map((it) => [it.id, it]));
    state.items = state.items.map((it) => fresh.get(it.id) || it);
    stop("Order saved (not published yet).", "ok");
  } else if (r.status === 409) {
    stop("", "");
    await load();
    toast("This sub changed elsewhere; order reloaded.");
  } else {
    msg = { text: j.error || `The gallery refused it (${r.status || "no connection"}).`, kind: "error" };
    render();
  }
}

/** After every grid render: a Reorder bar per section, and the controls of
 *  the section being reordered. */
function decorate() {
  const o = state.order && state.order.cat === state.cat ? state.order : null;
  $("search").disabled = !!o;
  for (const sec of document.querySelectorAll("#grid .adm-run")) {
    const mine = !!o && o.run === sec.dataset.run;
    const bar = el("div", "adm-run-bar");
    const label = RUN_LABEL[sec.dataset.run] || "this sub";
    if (!mine) {
      const b = el("button", "adm-x", "Reorder");
      b.type = "button"; b.dataset.act = "reorder";
      b.setAttribute("aria-label", `Reorder ${label}`);
      b.disabled = !!o || !!state.q.trim() || shown(sec).length < 2;
      b.title = state.q.trim() ? "Clear the search to reorder" : "";
      b.addEventListener("click", () => start(sec));
      bar.append(b);
      if (!o && msg.text && msgAt === sec.dataset.cat + "/" + sec.dataset.run) {
        const n = el("p", "adm-run-note", msg.text); n.dataset.kind = msg.kind; n.setAttribute("role", "status"); bar.append(n);
      }
      sec.querySelector("h2").after(bar);
      continue;
    }
    sec.dataset.reorder = "1";
    const s = el("button", "adm-btn", "Save order");
    s.type = "button"; s.dataset.act = "save-order";
    s.disabled = busy || same(o.ids, o.base);
    s.addEventListener("click", save);
    const c = el("button", "adm-btn adm-btn-2", "Cancel");
    c.type = "button"; c.dataset.act = "cancel-order"; c.disabled = busy;
    c.addEventListener("click", () => stop("Order not changed.", ""));
    const n = el("p", "adm-run-note", msg.text);
    n.dataset.kind = msg.kind; n.setAttribute("role", "status");
    bar.append(s, c, n);
    sec.querySelector("h2").after(bar);

    for (const t of sec.querySelectorAll(".adm-tile")) {
      const id = t.dataset.id;
      const i = o.ids.indexOf(id);
      if (i < 0) { t.dataset.fixed = "1"; continue; } // a removed upload: not part of the order
      const name = fileName({ id });
      t.draggable = true;
      if (i !== o.base.indexOf(id)) t.dataset.moved = "1";
      if (moving && moving.id === id) t.dataset.moving = "1";
      t.setAttribute("aria-label", `${name}, position ${i + 1} of ${o.ids.length}. ` +
        (moving && moving.id === id ? "Moving: arrow keys move it, Enter drops it, Escape puts it back." : "Enter picks it up to move."));
      t.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; t.dataset.drag = "1"; });
      t.addEventListener("dragend", () => { delete t.dataset.drag; });
      t.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
      t.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/plain");
        if (from && from !== id && o.ids.includes(from)) move(from, o.ids.indexOf(id));
      });
      t.addEventListener("keydown", (e) => key(e, id));
      t.addEventListener("blur", () => { if (moving && moving.id === id && !moving.redraw) { moving = null; render(); } });
      const li = t.parentElement;
      const arrows = el("div", "adm-move");
      const btn = (text, to, dis) => {
        const b = el("button", "adm-x", text);
        b.type = "button"; b.disabled = dis;
        b.setAttribute("aria-label", `${text}: ${name}`);
        b.addEventListener("click", () => {
          move(id, to);
          // keep focus on the same button of the moved tile (the tile itself at an end)
          const t = document.querySelector(`.adm-run[data-reorder="1"] .adm-tile[data-id="${CSS.escape(id)}"]`);
          const k = t && [...t.parentElement.querySelectorAll(".adm-move button")].find((x) => x.textContent === text);
          if (k && !k.disabled) k.focus();
        });
        arrows.append(b);
      };
      btn("Earlier", i - 1, i === 0);
      btn("Later", i + 1, i === o.ids.length - 1);
      li.append(arrows);
    }
  }
}

function key(e, id) {
  const o = state.order;
  const i = o.ids.indexOf(id);
  if (!moving) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      moving = { id, from: i };
      msg = { text: `Moving ${fileName({ id })}, position ${i + 1} of ${o.ids.length}. Arrow keys move it, Enter drops it, Escape puts it back.`, kind: "" };
      redraw(id);
    }
    return;
  }
  if (moving.id !== id) return;
  const to = e.key === "ArrowUp" || e.key === "ArrowLeft" ? i - 1 : e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1
    : e.key === "Home" ? 0 : e.key === "End" ? o.ids.length - 1 : null;
  if (to !== null) { e.preventDefault(); moving.redraw = true; move(id, to); moving.redraw = false; return; }
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    moving = null;
    msg = { text: `Dropped at position ${i + 1}. Save order when done.`, kind: "" };
    redraw(id);
  } else if (e.key === "Escape") {
    e.preventDefault();
    const back = moving.from;
    moving.redraw = true; move(id, back, false); moving = null;
    msg = { text: "Move cancelled.", kind: "" };
    redraw(id);
  }
}

/** Redraw and put focus back on `id` without ending Move mode on the blur. */
function redraw(id) {
  if (moving) moving.redraw = true;
  render();
  const t = document.querySelector(`.adm-run[data-run="${state.order.run}"] .adm-tile[data-id="${CSS.escape(id)}"]`);
  if (t) t.focus();
  if (moving) moving.redraw = false;
}

// Tiles of the section being reordered do not open the drawer (capture runs
// before drawer.js's bubbling listener on the same element).
$("grid").addEventListener("click", (e) => {
  const t = e.target.closest(".adm-tile");
  if (t && t.closest('.adm-run[data-reorder="1"]')) { e.stopPropagation(); e.preventDefault(); }
}, true);
document.addEventListener("gallery:render", decorate);
// gallery.js may have drawn the grid before this module ran (a fast first load)
if (document.querySelector("#grid .adm-run")) decorate();
