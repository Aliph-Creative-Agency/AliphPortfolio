// Admin gallery: the Clients panel (C-07, C-08) and the shared client list the
// drawer's Client select and the bulk-assign bar read (C-09, C-10).
//   List    GET    /api/admin/clients            -> {clients: [{id, name, line?, year?, url?, rev, published, changed, pieces}]}
//   Create  POST   /api/admin/clients            {name:{ar,en}, line?, year?, url?} -> 201 {client}; 400 {error, field}
//   Edit    PUT    /api/admin/clients/:id        {rev, ...}  -> 200 {client}; 409 {error, current|null}
//   Delete  DELETE /api/admin/clients/:id?rev=n&unassign=1 -> 200 {deleted, unassigned}: the client is taken
//           off its pieces and deleted in one go (the confirm says how many pieces); 409 stale
// The panel never creates a client by itself: an empty store shows "No clients yet".
// Other modules listen for the "clients:changed" event on document, or import
// `clients`, `loadClients` and `openNewClient` from here.

import { load } from "./gallery.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/** The current list, by English name. Replaced (never mutated) on every load. */
export let clients = [];
let editing = null; // id of the row open for editing
let adding = false;

const FIELD_LABEL = { "name.ar": "Arabic name", "name.en": "English name", "line.ar": "Arabic line", "line.en": "English line", year: "Year", url: "Website" };

function say(text, kind) {
  const n = $("clients-note");
  if (!n) return;
  n.textContent = text || "";
  n.dataset.kind = kind || "";
}

async function call(method, url, payload) {
  let r;
  try {
    r = await fetch(url, { method, headers: payload ? { "content-type": "application/json" } : {}, body: payload && JSON.stringify(payload) });
  } catch {
    return { ok: false, status: 0, body: { error: "Could not reach the server." } };
  }
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

/** Reloads the list and redraws everything that shows it. */
export async function loadClients() {
  const r = await call("GET", "/api/admin/clients");
  if (!r.ok) { say(r.body.error || `Could not load clients (${r.status}).`, "error"); return clients; }
  clients = r.body.clients;
  draw();
  document.dispatchEvent(new CustomEvent("clients:changed", { detail: clients }));
  return clients;
}

const mono = (c) => (c.name.en || c.name.ar || "?").trim().charAt(0).toUpperCase();

/** One labelled input; `err` is filled by showErrors. */
function field(name, label, value, opts = {}) {
  const wrap = el("label", "adm-fld");
  wrap.append(el("span", "adm-flab", label));
  const input = el("input", "adm-in");
  input.name = name;
  input.type = opts.type || "text";
  input.value = value ?? "";
  if (opts.dir) input.dir = opts.dir;
  if (opts.lang) input.lang = opts.lang;
  if (opts.inputMode) input.inputMode = opts.inputMode;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  if (opts.required) input.required = true;
  wrap.append(input, el("span", "adm-ferr"));
  wrap.dataset.field = name;
  return wrap;
}

/** The form for a new client or an edit; `c` is null for new. */
function form(c, onDone) {
  const f = el("form", "adm-cform");
  f.noValidate = true;
  f.append(
    field("name.en", "English name", c?.name.en, { required: true, dir: "ltr", lang: "en" }),
    field("name.ar", "Arabic name", c?.name.ar, { required: true, dir: "rtl", lang: "ar" }),
    field("line.en", "English line (optional)", c?.line?.en, { dir: "ltr", lang: "en" }),
    field("line.ar", "Arabic line (optional)", c?.line?.ar, { dir: "rtl", lang: "ar" }),
    field("year", "Year (optional)", c?.year, { inputMode: "numeric", dir: "ltr" }),
    field("url", "Website (optional)", c?.url, { type: "url", dir: "ltr", placeholder: "https://" }),
  );
  const note = el("p", "adm-dmsg adm-cform-note");
  note.setAttribute("role", "status");
  const row = el("div", "adm-dact");
  const save = el("button", "adm-btn", c ? "Save" : "Add client");
  save.type = "submit";
  const cancel = el("button", "adm-btn adm-btn-2", "Cancel");
  cancel.type = "button";
  cancel.addEventListener("click", () => onDone(false));
  row.append(save, cancel);
  f.append(note, row);
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    for (const x of f.querySelectorAll(".adm-ferr")) x.textContent = "";
    note.textContent = ""; note.dataset.kind = "";
    const v = (n) => f.elements[n].value.trim();
    const body = { name: { ar: v("name.ar"), en: v("name.en") } };
    const line = { ar: v("line.ar"), en: v("line.en") };
    // Blank = absent on the server, so send every key and let it decide.
    body.line = line; body.year = v("year"); body.url = v("url");
    if (c) body.rev = c.rev;
    save.disabled = true;
    const r = c ? await call("PUT", "/api/admin/clients/" + encodeURIComponent(c.id), body) : await call("POST", "/api/admin/clients", body);
    save.disabled = false;
    if (r.ok) { onDone(true, r.body.client); return; }
    if (r.status === 409) {
      // Someone else changed or removed it: show what is there now.
      editing = null; adding = false;
      await loadClients();
      say(r.body.current ? "That client was changed elsewhere. It now shows the current details; check them and try again." : "That client was removed elsewhere.", "error");
      return;
    }
    const wrap = r.body.field && f.querySelector(`[data-field="${CSS.escape(r.body.field)}"]`);
    if (wrap) {
      wrap.querySelector(".adm-ferr").textContent = r.body.error || "Not valid.";
      wrap.querySelector("input").focus();
    } else { note.textContent = r.body.error || `The server refused it (${r.status}).`; note.dataset.kind = "error"; }
  });
  return f;
}

const piecesText = (n) => (n === 1 ? "1 piece" : `${n} pieces`);

/** Delete a client. Pieces that use it are not a reason to refuse: the confirm says how many, and the server
 *  takes the client off them and deletes it in one go (?unassign=1). */
async function removeClient(c) {
  const name = c.name.en || c.name.ar;
  const n = c.pieces || 0;
  const ok = await confirmBox(n
    ? `Delete ${name}? ${n === 1 ? "1 piece uses" : `${n} pieces use`} this client; ${n === 1 ? "it" : "they"} will show no client. Both leave the site when you publish.`
    : `Delete ${name}? It leaves the site when you publish.`, "Delete");
  if (!ok) return;
  const r = await call("DELETE", `/api/admin/clients/${encodeURIComponent(c.id)}?rev=${c.rev}&unassign=1`);
  if (r.ok) {
    const u = r.body.unassigned || 0;
    await loadClients();
    say(`Deleted ${name}${u ? ` and took it off ${piecesText(u)}` : ""} (not published yet).`, "ok");
    // the pieces' revs changed: the grid (and an open drawer) read them again before the next edit
    if (u) await load().catch(() => {});
    return;
  }
  if (r.status === 409) { await loadClients(); say("That client changed elsewhere. It now shows the current details; try again.", "error"); return; }
  say(r.body.error || `The server refused it (${r.status}).`, "error");
}

/** A small confirm dialog; resolves true on the confirm button. */
function confirmBox(text, yes) {
  return new Promise((resolve) => {
    const d = $("confirm");
    $("confirm-text").textContent = text;
    $("confirm-yes").textContent = yes;
    const done = (v) => { d.close(); resolve(v); };
    $("confirm-yes").onclick = () => done(true);
    $("confirm-no").onclick = () => done(false);
    d.oncancel = () => resolve(false);
    d.showModal();
  });
}

function item(c) {
  const li = el("li", "adm-client");
  li.dataset.id = c.id;
  if (editing === c.id) {
    li.append(form(c, async (saved) => {
      editing = null;
      if (saved) { await loadClients(); say("Saved (not published yet).", "ok"); } else draw();
    }));
    return li;
  }
  li.append(el("span", "adm-mono", mono(c)));
  const names = el("span", "adm-cnames");
  names.append(el("span", "adm-cname-en", c.name.en));
  const ar = el("span", "adm-cname-ar", c.name.ar);
  ar.dir = "rtl"; ar.lang = "ar";
  names.append(ar);
  li.append(names);
  const n = c.pieces;
  li.append(el("span", "adm-ccount", `${n} ${n === 1 ? "piece" : "pieces"}`));
  const act = el("span", "adm-cact");
  const edit = el("button", "adm-x", "Edit");
  edit.type = "button";
  edit.setAttribute("aria-label", `Edit ${c.name.en}`);
  edit.addEventListener("click", () => { editing = c.id; adding = false; say(""); draw(); });
  const del = el("button", "adm-x", "Delete");
  del.type = "button";
  del.setAttribute("aria-label", `Delete ${c.name.en}`);
  del.addEventListener("click", () => removeClient(c));
  act.append(edit, del);
  li.append(act);
  return li;
}

function draw() {
  const list = $("clients-list");
  if (!list) return;
  list.replaceChildren();
  $("clients-empty").hidden = clients.length > 0;
  for (const c of clients) list.append(item(c));
  $("clients-count").textContent = clients.length ? `(${clients.length})` : "";
  const slot = $("clients-form");
  slot.replaceChildren();
  $("clients-new").setAttribute("aria-expanded", adding ? "true" : "false");
  if (adding) {
    slot.append(form(null, async (saved, client) => {
      adding = false;
      if (saved) { await loadClients(); say(`Added ${client.name.en} (not published yet).`, "ok"); } else draw();
    }));
    slot.querySelector("input")?.focus();
  }
}

/** The New client form in a modal of its own (the drawer's "New client…"): resolves the created client, or null on Cancel. */
export function newClientDialog() {
  return new Promise((resolve) => {
    const d = $("client-new");
    const slot = $("client-new-form");
    let out = null;
    const finish = (saved, client) => { out = saved ? client : null; d.close(); };
    slot.replaceChildren(form(null, finish));
    d.addEventListener("close", () => resolve(out), { once: true });
    d.showModal();
    slot.querySelector("input")?.focus();
  });
}

/** Opens the New client form (the drawer's "New client…" uses this in C-09). */
export function openNewClient() {
  adding = true; editing = null; say("");
  draw();
  $("clients").scrollIntoView?.({ block: "nearest" });
}

if ($("clients")) {
  $("clients-new").addEventListener("click", () => { if (adding) { adding = false; draw(); } else openNewClient(); });
  loadClients();
}
