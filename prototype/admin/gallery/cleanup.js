// Admin gallery: "Clean up unused files" (G-08).
//   Find     GET  /api/admin/upload/unused -> {files: [{key, size, uploaded, url, item?}], totalSize}
//   Delete   POST /api/admin/upload/cleanup {keys} -> {deleted, refused: [{key, reason}]}
// The server lists only uploads that neither the draft nor the published site
// names and that are at least a day old, and checks every key again when it
// deletes. The dialog lists them with sizes, every row ticked; the admin
// unticks what to keep and confirms. A file of a deleted item (`item`) is
// flagged: once it is gone, restoring that item shows nothing.

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export const size = (n) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
const isImage = (key) => !/\.(mp4|webm)$/.test(key);
const nameOf = (key) => key.split("/").pop();

let files = [];

function say(text, kind) {
  const n = $("cleanup-msg");
  n.textContent = text;
  n.dataset.kind = kind || "";
}

/** The ticked files, and the Delete button's label from them. */
function ticked() {
  return [...$("cleanup-list").querySelectorAll("input:checked")].map((c) => files.find((f) => f.key === c.value));
}
function sync() {
  const t = ticked();
  const go = $("cleanup-go");
  go.disabled = !t.length;
  go.textContent = t.length ? `Delete ${t.length} ${t.length === 1 ? "file" : "files"} (${size(t.reduce((n, f) => n + f.size, 0))})` : "Delete";
}

function row(f) {
  const li = el("li", "adm-crow");
  const box = el("input");
  box.type = "checkbox";
  box.checked = true;
  box.value = f.key;
  box.id = "c-" + f.key.replace(/[^a-z0-9]/g, "-");
  box.addEventListener("change", sync);
  const lab = el("label", "adm-clab");
  lab.htmlFor = box.id;
  if (isImage(f.key)) {
    const img = el("img", "adm-pick-pic");
    img.alt = "";
    img.loading = "lazy";
    img.src = f.url;
    img.onerror = () => {
      if (!img.dataset.fell) { img.dataset.fell = "1"; img.src = "/api/admin/media/" + f.key; }
      else img.style.visibility = "hidden"; // no copy anywhere: the grey box, not a broken icon
    };
    lab.append(img);
  } else lab.append(el("span", "adm-pick-pic adm-cvid", "video"));
  const txt = el("span", "adm-ctxt");
  txt.append(el("span", "adm-pick-name", nameOf(f.key)));
  const meta = `${size(f.size)} · uploaded ${f.uploaded.slice(0, 10)}`;
  txt.append(el("span", "adm-cmeta", meta));
  if (f.item) txt.append(el("span", "adm-cwarn", `File of the deleted item ${f.item}: restoring that item will show nothing.`));
  lab.append(txt);
  li.append(box, lab);
  return li;
}

async function find() {
  const btn = $("cleanup-find");
  btn.disabled = true;
  $("cleanup-note").textContent = "Looking…";
  try {
    const r = await fetch("/api/admin/upload/unused", { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`Could not list the files (${r.status}).`);
    const j = await r.json();
    files = j.files;
    if (!files.length) {
      $("cleanup-note").textContent = "No unused files. Uploads stay at least a day before they can be cleaned up.";
      return;
    }
    $("cleanup-note").textContent = "";
    const list = $("cleanup-list");
    list.replaceChildren(...files.map(row));
    $("cleanup-sum").textContent = `${files.length} ${files.length === 1 ? "file" : "files"}, ${size(j.totalSize)}, used by neither the draft nor the published site and uploaded over a day ago. Deleting cannot be undone.`;
    say("");
    sync();
    $("cleanup-dlg").showModal();
  } catch (e) {
    $("cleanup-note").textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

async function go() {
  const keys = ticked().map((f) => f.key);
  if (!keys.length) return;
  $("cleanup-go").disabled = true;
  say("Deleting…");
  let j;
  try {
    const r = await fetch("/api/admin/upload/cleanup", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ keys }),
    });
    j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Delete failed (${r.status}).`);
  } catch (e) {
    say(e.message, "error");
    sync();
    return;
  }
  const gone = new Set(j.deleted);
  const freed = files.filter((f) => gone.has(f.key)).reduce((n, f) => n + f.size, 0);
  files = files.filter((f) => !gone.has(f.key));
  for (const li of [...$("cleanup-list").children]) if (gone.has(li.querySelector("input").value)) li.remove();
  const why = j.refused.map((x) => `${nameOf(x.key)}: ${x.reason}`).join("; ");
  say(
    (j.deleted.length ? `Deleted ${j.deleted.length} ${j.deleted.length === 1 ? "file" : "files"} (${size(freed)}).` : "Nothing deleted.") +
      (why ? ` Kept ${j.refused.length}: ${why}.` : ""),
    j.refused.length ? "error" : "ok",
  );
  if (j.deleted.length) $("cleanup-note").textContent = `Deleted ${j.deleted.length} unused ${j.deleted.length === 1 ? "file" : "files"}.`;
  sync();
}

$("cleanup-find").addEventListener("click", find);
$("cleanup-go").addEventListener("click", go);
$("cleanup-close").addEventListener("click", () => $("cleanup-dlg").close());
