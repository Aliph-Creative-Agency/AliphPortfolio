// Admin gallery: the item drawer (G-05a). A tile opens a side sheet with the
// item's details (sub-category, date, ratio, alt ar/en), Hide / Unhide, and
// the removal that fits the item:
//   upload             -> Delete (confirm, staged) / Restore a deleted one
//   override           -> Revert to default (DELETE, confirm)
//   default piece      -> Hide only (a default is never deleted)
// PUT replaces the whole draft row, so a save sends the row's own columns
// (item.own) back together with the edits. Fields the admin never touched on a
// default piece stay out of the body, so the row keeps "use MEDIA's value".
// Server answers: 200 {item}; 400 {error, field} shown on that field; 409
// {error, current} -> "changed elsewhere", the form refills with the current
// values and the new rev.
import { kindOf, checkSize, explain } from "/admin/shared/media.js";
import { state, render, fileName } from "./gallery.js";
import { prepareAndUpload } from "./pipeline.js";
import { clients, loadClients, newClientDialog } from "./clients.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

let it = null; // the item being edited (a snapshot of state.items' entry)
let busy = false;
const NEW = "__new__";

const dlg = () => $("drawer");
const isUpload = () => it.kind === "upload";

function field(label, input, name) {
  const w = el("label", "adm-fld");
  w.append(el("span", "adm-flab", label), input);
  const e = el("span", "adm-ferr");
  e.dataset.for = name;
  e.setAttribute("role", "alert");
  w.append(e);
  return w;
}

function flash(msg, kind) {
  const m = $("drawer-msg");
  m.textContent = msg || "";
  m.dataset.kind = kind || "";
}
function fieldError(name, msg) {
  const e = dlg().querySelector(`.adm-ferr[data-for="${name}"]`);
  if (e) e.textContent = msg;
  return !!e;
}

/** Draw the form for `it` (also after a 409 refill or a successful save). */
function draw() {
  const f = $("drawer-body");
  f.textContent = "";
  $("drawer-title").textContent = fileName(it);
  const status = [];
  if (it.hidden) status.push("hidden");
  if (it.deleted) status.push(isUpload() ? "deleted" : "revert to default staged");
  if (it.changed) status.push("changed, not published");
  $("drawer-status").textContent = status.join(" · ") || (it.kind === "default" ? "default piece, as published" : "as published");

  const pic = el("img", "adm-dpic");
  pic.alt = "";
  pic.src = it.thumb;
  pic.addEventListener("error", () => {
    const m = /\/(admin\/.+)$/.exec(it.thumb);
    if (m && !pic.dataset.fell) { pic.dataset.fell = "1"; pic.src = "/api/admin/media/" + m[1]; }
  });
  f.append(pic);

  const sub = el("select", "adm-sel");
  sub.id = "d-sub";
  sub.append(new Option("unfiled", ""));
  for (const s of state.subcats[it.cat] || []) sub.append(new Option(s.en, s.id));
  sub.value = it.sub || "";
  const date = el("input", "adm-in");
  date.id = "d-date"; date.value = it.date || ""; date.placeholder = "YYYY-MM or YYYY-MM-DD"; date.autocomplete = "off";
  const ratio = el("input", "adm-in");
  ratio.id = "d-ratio"; ratio.value = it.ratio; ratio.inputMode = "decimal"; ratio.autocomplete = "off";
  const ar = el("input", "adm-in");
  ar.id = "d-alt-ar"; ar.value = it.alt.ar || ""; ar.dir = "rtl"; ar.autocomplete = "off";
  const en = el("input", "adm-in");
  en.id = "d-alt-en"; en.value = it.alt.en || ""; en.autocomplete = "off";
  const cl = el("select", "adm-sel");
  cl.id = "d-client";
  cl.append(new Option("No client", ""));
  for (const c of clients) cl.append(new Option(c.name.en, c.id));
  const own = it.own.client;
  // A piece may still name a client that was deleted since: keep it visible, never drop it silently.
  if (own && !clients.some((c) => c.id === own)) cl.append(new Option(`${own} (removed)`, own));
  cl.append(new Option("New client…", NEW));
  cl.value = own || "";
  cl.dataset.prev = cl.value;
  cl.addEventListener("change", async () => {
    if (cl.value !== NEW) { cl.dataset.prev = cl.value; return; }
    cl.value = cl.dataset.prev; // back to the old pick while the dialog is open (and if it is cancelled)
    const made = await newClientDialog();
    if (!made) return;
    // Pick it the moment the dialog closes; the shared list refreshes after (a slow GET must not leave the old pick showing).
    cl.insertBefore(new Option(made.name.en, made.id), cl.querySelector(`option[value="${NEW}"]`));
    cl.value = made.id; cl.dataset.prev = made.id;
    await loadClients();
  });
  f.append(
    field("Sub-category", sub, "sub"),
    field("Client", cl, "client"),
    field("Date", date, "date"),
    field("Ratio (width / height)", ratio, "ratio"),
    field("Alt text, Arabic", ar, "alt.ar"),
    field("Alt text, English", en, "alt.en"),
  );

  const bar = $("drawer-actions");
  bar.textContent = "";
  const btn = (id, text, fn, cls) => {
    const b = el("button", cls || "adm-btn", text);
    b.type = "button"; b.id = id;
    b.addEventListener("click", fn);
    bar.append(b);
    return b;
  };
  btn("d-save", "Save details", () => save({}));
  if (!(isUpload() && it.deleted)) btn("d-replace", "Replace file…", () => $("d-file").click(), "adm-btn adm-btn-2");
  btn("d-hide", it.hidden ? "Unhide" : "Hide", () => save({ hidden: !it.hidden }), "adm-btn adm-btn-2");
  if (isUpload()) {
    if (it.deleted) btn("d-restore", "Restore", () => save({}), "adm-btn adm-btn-2");
    else btn("d-delete", "Delete", remove, "adm-btn adm-btn-2");
  } else if (it.kind === "override" && !it.deleted) {
    btn("d-revert", "Revert to default", remove, "adm-btn adm-btn-2");
  }
}

/** The PUT body: the row's own columns + the form, hidden possibly flipped. */
function body(over) {
  const v = (id) => $(id).value.trim();
  const b = { ...it.own, hidden: over.hidden ?? it.hidden };
  if (v("d-sub")) b.sub = v("d-sub");
  // a default piece's date / ratio only become overrides when the admin changes them
  if (v("d-date") && (it.own.date !== undefined || isUpload() || v("d-date") !== (it.date || ""))) b.date = v("d-date");
  const r = v("d-ratio");
  if (r !== "" && (it.own.ratio !== undefined || isUpload() || Number(r) !== it.ratio)) b.ratio = Number(r);
  // the row's own client column: set it, clear it, or leave a default piece's row alone
  const pick = v("d-client");
  if (pick) b.client = pick; else delete b.client;
  const alt = {};
  if (v("d-alt-ar")) alt.ar = v("d-alt-ar");
  if (v("d-alt-en")) alt.en = v("d-alt-en");
  if (Object.keys(alt).length) b.alt = alt;
  if (!b.cat && isUpload()) b.cat = it.cat;
  return { ...b, baseRev: it.rev };
}

function adopt(item) {
  it = item;
  const i = state.items.findIndex((x) => x.id === item.id);
  if (i >= 0) state.items[i] = item;
  render();
}

/** Disable the action buttons while a request runs (the form keeps what was typed). */
function setBusy(b) {
  busy = b;
  for (const x of $("drawer-actions").querySelectorAll("button")) x.disabled = b;
}

async function send(method, url, payload) {
  setBusy(true);
  flash("Working…", "");
  for (const e of dlg().querySelectorAll(".adm-ferr")) e.textContent = "";
  try {
    const r = await fetch(url, { method, headers: payload ? { "content-type": "application/json" } : {}, body: payload && JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return j;
    if (r.status === 409) {
      if (j.current) adopt(j.current);
      setBusy(false); draw();
      flash("This item changed elsewhere. The form now shows the current values; check them and try again.", "error");
    } else {
      setBusy(false);
      const msg = j.error || `The gallery refused it (${r.status}).`;
      if (!j.field || !fieldError(j.field, msg)) flash(msg, "error");
      else flash("Not saved: see the field below.", "error");
    }
    return null;
  } catch {
    setBusy(false);
    flash("The network failed; try again.", "error");
    return null;
  }
}

async function save(over) {
  const j = await send("PUT", "/api/admin/gallery/" + encodeURIComponent(it.id), body(over));
  if (!j) return;
  setBusy(false);
  adopt(j.item); draw();
  loadClients(); // the Clients panel's piece counts
  flash(over.hidden === undefined ? "Saved (not published yet)." : over.hidden ? "Hidden (not published yet)." : "Unhidden (not published yet).", "ok");
}

/** Replace the file: same pipeline as Add, then PUT the new src (+ poster, ratio) with the item's rev.
 *  The old file stays in R2 until the clean-up. Typed edits in the form are saved with it. */
async function replace(file) {
  const kind = kindOf(file);
  if (!kind || (kind === "video") !== it.video) return flash(it.video ? "This piece is a film: choose an MP4 or WebM film." : "This piece is a picture: choose a JPEG, PNG, WebP or AVIF picture.", "error");
  const big = checkSize(file, kind);
  if (big) return flash(explain(big, kind), "error");
  const prog = $("drawer-prog");
  prog.hidden = false; prog.value = 0;
  setBusy(true);
  let out;
  try {
    out = await prepareAndUpload(file, kind, { onStage: (m) => flash(m, ""), onProgress: (p) => { prog.value = p; } });
  } catch (e) {
    prog.hidden = true; setBusy(false);
    return flash(explain(e, kind), "error"); // U-63: the same wording as Add files and the editor
  }
  prog.hidden = true; setBusy(false);
  const b = body({});
  b.src = out.src; b.ratio = out.ratio;
  if (it.video) b.poster = out.poster;
  const j = await send("PUT", "/api/admin/gallery/" + encodeURIComponent(it.id), b);
  if (!j) return;
  setBusy(false);
  adopt(j.item); draw();
  flash("File replaced (not published yet). The old file stays in storage until you clean up unused files.", "ok");
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

async function remove() {
  const up = isUpload();
  const ok = await confirmBox(
    up ? `Delete ${fileName(it)}? It leaves the site when you publish; you can restore it until then.` : `Revert ${fileName(it)} to its default piece? Your changes to it are dropped when you publish.`,
    up ? "Delete" : "Revert",
  );
  if (!ok) return;
  const j = await send("DELETE", `/api/admin/gallery/${encodeURIComponent(it.id)}?baseRev=${it.rev}`);
  if (!j) return;
  setBusy(false);
  adopt(j.item); draw();
  flash(up ? "Deleted (not published yet). Restore brings it back." : "Reverted to the default piece (not published yet).", "ok");
}

export function open(id) {
  const found = state.items.find((x) => x.id === id);
  if (!found) return;
  it = found; busy = false;
  draw(); flash("", "");
  if (!dlg().open) dlg().showModal();
}

$("grid").addEventListener("click", (e) => {
  const t = e.target.closest(".adm-tile");
  if (t) open(t.dataset.id);
});
$("d-file").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) replace(f); });
$("drawer-close").addEventListener("click", () => dlg().close());
window.gallery.openDrawer = open;
