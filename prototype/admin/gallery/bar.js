/* Gallery top bar: draft-changes count + Publish. Same API and messages as the editor's Publish
   (window.aliphEditorApi.changes() -> publish(token); 409 = the draft moved, show the new count and ask again). */
const api = window.aliphEditorApi;
const $ = (id) => document.getElementById(id);
const btn = $("pub-btn"), state = $("pub-state"), dlg = $("pub-dlg"), text = $("pub-text"), msg = $("pub-msg"), yes = $("pub-yes"), no = $("pub-no");
let last = null;

function paint() {
  const n = last ? last.changes.length : 0;
  state.textContent = last ? "Draft changes: " + n : "Draft changes: \u2013";
  btn.textContent = n ? "Publish (" + n + ")" : "Publish";
  btn.disabled = !n || dlg.open;
}
function refresh() {
  return api.changes().then((c) => { last = c; paint(); return c; }, () => {});
}
function ask(note) {
  refresh().then((c) => {
    if (!c) { state.textContent = "Could not read the changes. Try again."; return; }
    if (!c.changes.length) { msg.textContent = ""; state.textContent = "Nothing to publish"; return; }
    const n = c.changes.length;
    text.textContent = "Publish " + n + (n === 1 ? " change" : " changes") + " to the live site?";
    msg.textContent = note || "";
    yes.disabled = no.disabled = false;
    if (!dlg.open) dlg.showModal();
    yes.focus();
    yes.onclick = () => {
      yes.disabled = no.disabled = true;
      msg.textContent = "Working\u2026";
      api.publish(c.token).then((r) => {
        if (r.status === 200) {
          dlg.close();
          state.textContent = "Published. The live site is now revision " + r.body.rev + ".";
          return refresh().then(() => { state.textContent = "Published. The live site is now revision " + r.body.rev + "."; });
        }
        if (r.status === 409) { ask("The draft changed while this was open. Here is the count as it is now."); return; }
        msg.textContent = "Not published: " + ((r.body && r.body.error) || r.status);
        yes.disabled = no.disabled = false;
      }, () => { msg.textContent = "Could not reach the server. Try again."; yes.disabled = no.disabled = false; });
    };
  });
}
btn.addEventListener("click", () => ask());
no.addEventListener("click", () => dlg.close());
dlg.addEventListener("close", paint);
refresh();
setInterval(() => { if (!document.hidden && !dlg.open) refresh(); }, 4000);
