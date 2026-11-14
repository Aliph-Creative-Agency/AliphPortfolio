// Admin gallery: add items (G-04). A drop zone / file picker stages files as
// rows; "Upload" then runs each row through the shared media pipeline:
//   image: prepareImage -> upload -> PUT item {src, cat, sub, ratio, date}
//   video: preparePoster -> upload (the film) -> upload (poster, posterFor =
//          the film's key) -> PUT item {src: film, poster, ...}
// One file failing (unreadable / 415 / 413 / network) marks its row and the
// batch carries on; a failed row offers Retry (back to ready, run again) and
// Remove (F-09). A wrong-type row only offers Remove: a retry cannot help it. Cat is required, sub optional; both set once for the batch
// and editable per row until the row is uploading.
import { MediaError, kindOf, checkSize, explain } from "/admin/shared/media.js";
import { prepareAndUpload } from "./pipeline.js";
import { state, load } from "./gallery.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const CATS = [["design", "Design"], ["photo", "Photo"]];
const rows = []; // {file, kind, cat, sub, status, msg, pct, node}
let busy = false;
let at = null; // U-38: {i, n} while a batch runs, for "Uploading i of n…"

// U-62 / U-63 / U-65: the same wording as the editor's picture drawer (shared/media.js explain)
const problem = (e, kind) => explain(e, kind);

function subOptions(sel, cat, value) {
  sel.textContent = "";
  sel.append(new Option("unfiled", ""));
  for (const s of state.subcats[cat] || []) sel.append(new Option(s.en, s.id));
  sel.value = value || "";
}
function catSelect(value, onchange) {
  const s = el("select", "adm-sel");
  for (const [v, t] of CATS) s.append(new Option(t, v));
  s.value = value;
  s.addEventListener("change", () => onchange(s.value));
  return s;
}

function drawRow(r) {
  const n = r.node;
  n.textContent = "";
  n.dataset.status = r.status;
  const name = el("span", "adm-rname", r.file.name);
  const cat = catSelect(r.cat, (v) => { r.cat = v; r.sub = ""; drawRow(r); });
  const sub = el("select", "adm-sel");
  subOptions(sub, r.cat, r.sub);
  sub.addEventListener("change", () => { r.sub = sub.value; });
  cat.setAttribute("aria-label", "Category for " + r.file.name);
  sub.setAttribute("aria-label", "Sub-category for " + r.file.name);
  cat.disabled = sub.disabled = r.status !== "ready";
  const bar = el("progress", "adm-prog");
  bar.max = 100;
  bar.value = r.pct || 0;
  const msg = el("span", "adm-rmsg", r.msg || (r.kind === "video" ? "video" : "image"));
  msg.setAttribute("role", r.status === "error" ? "alert" : "status");
  // U-60: a refused or failed row keeps only its name, the reason and Retry / Remove (Retry brings the selects back)
  if (r.status === "error") n.append(name, msg);
  else n.append(name, cat, sub, bar, msg);
  if (r.status === "error" && r.kind && !r.final) n.append(button("Retry", () => retry(r)));
  if (r.status === "ready" || r.status === "error") {
    n.append(button("Remove", () => { rows.splice(rows.indexOf(r), 1); n.remove(); summary(); }));
  }
}
function button(text, onclick) {
  const b = el("button", "adm-x", text);
  b.type = "button";
  b.addEventListener("click", onclick);
  return b;
}

function summary() {
  const ready = rows.filter((r) => r.status === "ready").length;
  $("add-go").disabled = busy || !ready;
  $("add-go").textContent = busy && at ? `Uploading ${at.i} of ${at.n}…` : ready ? `Upload ${ready} file(s)` : "Upload";
}

export function stage(files) {
  for (const file of files) {
    const kind = kindOf(file);
    const r = { file, kind, cat: $("add-cat").value, sub: $("add-sub").value, status: "ready", pct: 0, node: el("li", "adm-row") };
    const big = kind && checkSize(file, kind);
    if (!kind) { r.status = "error"; r.msg = problem(new MediaError("unsupported", "unsupported"), null); }
    else if (big) { r.status = "error"; r.final = true; r.msg = problem(big, kind); } // a retry cannot make it smaller
    rows.push(r);
    $("add-rows").append(r.node);
    drawRow(r);
  }
  summary();
}

async function put(id, body) {
  const r = await fetch("/api/admin/gallery/" + encodeURIComponent(id), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, baseRev: 0 }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `The gallery refused the item (${r.status}).`);
  }
}

async function run(r) {
  r.status = "uploading"; r.msg = "Preparing…"; drawRow(r);
  // U-38: keep the row that is working in view (on a phone the list runs off the screen)
  r.node.scrollIntoView({ block: "nearest", behavior: "instant" });
  try {
    const out = await prepareAndUpload(r.file, r.kind, {
      onStage: (m) => { r.msg = m; drawRow(r); },
      onProgress: (pct) => { r.pct = pct; const b = r.node.querySelector("progress"); if (b) b.value = pct; },
    });
    const { id, ...fields } = out;
    await put(id, { ...fields, cat: r.cat, sub: r.sub || null });
    r.status = "done"; r.pct = 100; r.msg = "Added (not published yet)";
  } catch (e) {
    r.status = "error"; r.msg = problem(e, r.kind);
  }
  drawRow(r);
}

/** Runs `list` one by one, then refreshes the grid. A failed refresh (the
 *  network dropped) leaves the grid as it was instead of an unhandled error. */
async function runAll(list) {
  busy = true;
  for (let i = 0; i < list.length; i++) { at = { i: i + 1, n: list.length }; summary(); await run(list[i]); }
  busy = false; at = null; summary();
  await load().catch(() => {});
}
const go = () => runAll(rows.filter((x) => x.status === "ready"));

/** Retry one failed row: back to ready, then run it alone (while a batch is
 *  running it just waits as ready for the next Upload). */
function retry(r) {
  r.status = "ready"; r.msg = ""; r.pct = 0; drawRow(r);
  if (busy) summary();
  else runAll([r]);
}

function init() {
  const cat = catSelect("design", (v) => subOptions($("add-sub"), v, ""));
  cat.id = "add-cat";
  cat.setAttribute("aria-label", "Category for the batch");
  const sub = el("select", "adm-sel");
  sub.id = "add-sub";
  sub.setAttribute("aria-label", "Sub-category for the batch");
  $("add-batch").append(el("span", "", "Batch:"), cat, sub);
  const fill = () => subOptions(sub, cat.value, "");
  fill();
  // subcats arrive with the first load; refresh the options then
  const t = setInterval(() => { if (Object.keys(state.subcats).length) { fill(); clearInterval(t); } }, 100);

  const input = $("add-file");
  const zone = $("add-zone");
  input.addEventListener("change", () => { stage([...input.files]); input.value = ""; });
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  for (const ev of ["dragenter", "dragover"]) zone.addEventListener(ev, (e) => { e.preventDefault(); zone.dataset.over = "1"; });
  for (const ev of ["dragleave", "drop"]) zone.addEventListener(ev, (e) => { e.preventDefault(); zone.dataset.over = "0"; });
  zone.addEventListener("drop", (e) => { e.preventDefault(); stage([...e.dataTransfer.files]); });
  $("add-go").addEventListener("click", go);
  summary();
}
init();
