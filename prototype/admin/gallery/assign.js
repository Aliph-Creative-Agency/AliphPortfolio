// Admin gallery: pick several pieces and give them one client (C-10).
//   POST /api/admin/gallery/assign {client: id | null, items: [{id, rev}]} -> 200 {items}
//   409 {error, stale, current} -> the grid reloads, the selection is dropped
// "Select pieces" turns the tiles into ticks (a click ticks instead of opening
// the drawer); a bar fixed to the bottom of the window reads "Assign 4 to [client]" + Clear.
// The selection lives in memory only: a reload, a 409, a successful assign and
// leaving select mode all empty it. Reordering and select mode exclude each other.
import { state, render } from "./gallery.js";
import { clients, loadClients } from "./clients.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const NONE = "__none__";
const MAX = 200; // the route's cap

let selecting = false;
let busy = false;
const picked = new Set();
let msg = { text: "", kind: "" };

const pickable = (it) => !(it.kind === "upload" && it.deleted);

function toggle() {
  selecting = !selecting;
  picked.clear(); msg = { text: "", kind: "" };
  if (selecting) state.order = null;
  render();
}

function clear() { picked.clear(); msg = { text: "", kind: "" }; render(); }

async function assign() {
  const sel = $("assign-client");
  if (!picked.size || !sel.value || busy) return;
  const target = sel.value === NONE ? null : sel.value;
  const name = target ? (clients.find((c) => c.id === target)?.name.en || target) : "no client";
  const byId = new Map(state.items.map((it) => [it.id, it]));
  const ids = [...picked].filter((id) => byId.has(id));
  busy = true; msg = { text: "Assigning…", kind: "" }; render();
  let r, j;
  try {
    r = await fetch("/api/admin/gallery/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ client: target, items: ids.map((id) => ({ id, rev: byId.get(id).rev })) }),
    });
    j = await r.json().catch(() => ({}));
  } catch {
    r = { ok: false, status: 0 }; j = {};
  }
  busy = false;
  if (r.ok) {
    const fresh = new Map(j.items.map((it) => [it.id, it]));
    state.items = state.items.map((it) => fresh.get(it.id) || it);
    picked.clear();
    msg = { text: `Assigned ${ids.length} ${ids.length === 1 ? "piece" : "pieces"} to ${name} (not published yet).`, kind: "ok" };
    render();
    loadClients(); // the Clients panel's piece counts
  } else if (r.status === 409) {
    picked.clear();
    await window.gallery.load();
    msg = { text: "Some of these pieces changed elsewhere. The grid is reloaded and nothing was assigned; pick them again.", kind: "error" };
    render();
  } else {
    msg = { text: j.error || `The gallery refused it (${r.status || "no connection"}).`, kind: "error" };
    render();
  }
}

/** Runs after every grid draw: ticks on the tiles, the toolbar, the sticky bar. */
function decorate() {
  if (state.order) { selecting = false; picked.clear(); }
  const have = new Set(state.items.map((it) => it.id));
  for (const id of [...picked]) if (!have.has(id)) picked.delete(id);

  const tb = $("select-toggle");
  tb.textContent = selecting ? "Done selecting" : "Select pieces";
  tb.setAttribute("aria-pressed", selecting ? "true" : "false");
  tb.disabled = !!state.order;
  tb.title = state.order ? "Finish reordering first" : "";
  $("grid").dataset.selecting = selecting ? "1" : "0";

  if (selecting) {
    for (const t of document.querySelectorAll("#grid .adm-tile")) {
      const it = state.items.find((x) => x.id === t.dataset.id);
      if (!it || !pickable(it)) { t.dataset.pickable = "0"; continue; }
      const on = picked.has(it.id);
      t.dataset.pickable = "1";
      t.dataset.picked = on ? "1" : "0";
      t.setAttribute("aria-pressed", on ? "true" : "false");
      t.append(el("span", "adm-tick", on ? "✓" : ""));
    }
  }

  const bar = $("assign-bar");
  bar.hidden = !selecting;
  if (!selecting) return;
  $("assign-n").textContent = picked.size ? `Assign ${picked.size} to` : "Assign to";
  const sel = $("assign-client");
  const prev = sel.value;
  sel.replaceChildren(new Option("Choose a client…", ""), new Option("No client (clear)", NONE));
  for (const c of clients) sel.append(new Option(c.name.en, c.id));
  sel.value = [...sel.options].some((o) => o.value === prev) ? prev : "";
  const over = picked.size > MAX;
  $("assign-go").disabled = busy || !picked.size || !sel.value || over;
  $("assign-clear").disabled = busy || !picked.size;
  $("assign-note").textContent = over ? `Pick at most ${MAX} pieces at a time.` : msg.text;
  $("assign-note").dataset.kind = over ? "error" : msg.kind;
}

// In select mode a tile click ticks instead of opening the drawer (capture,
// like order.js, so the drawer's click never sees it).
$("grid").addEventListener("click", (e) => {
  if (!selecting) return;
  const t = e.target.closest(".adm-tile");
  if (!t) return;
  e.stopPropagation(); e.preventDefault();
  const it = state.items.find((x) => x.id === t.dataset.id);
  if (!it || !pickable(it)) return;
  if (picked.has(it.id)) picked.delete(it.id); else picked.add(it.id);
  msg = { text: "", kind: "" };
  render();
  document.querySelector(`#grid .adm-tile[data-id="${CSS.escape(it.id)}"]`)?.focus();
}, true);

$("select-toggle").addEventListener("click", toggle);
$("assign-go").addEventListener("click", assign);
$("assign-clear").addEventListener("click", clear);
$("assign-client").addEventListener("change", () => { msg = { text: "", kind: "" }; render(); });
document.addEventListener("clients:changed", () => { if (selecting) render(); });
document.addEventListener("gallery:render", decorate);
