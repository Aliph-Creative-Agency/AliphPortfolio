/* Picture drawer for the edit pages (classic script, no build). Loaded after
   editor.js, which hands over window.aliphEditorUi. Every [data-es="<slot>"]
   element (the Worker tags the media <img>s, main.js tags the film frames)
   opens a side drawer on click or Enter: the current file, its alt text in
   Arabic and English, and "Back to default". Alt edits autosave through
   PUT /api/admin/slot (E-14) 800 ms after typing stops; a 409 reloads the
   row and says so. The picture is previewed in place by setting src / alt /
   data-preview only, so the box never moves. The click is swallowed before
   the page's own handlers (lightbox, link, preview) see it: this listener sits
   on `window` in the capture phase. Nodes added here carry data-editor-ui. */
(function () {
  "use strict";
  var api = window.aliphEditorApi;
  var ui = window.aliphEditorUi;
  if (!api || !ui || document.documentElement.dataset.editMode !== "1") return;

  var SAVE_DELAY = 800;
  var defs = {};          /* slot id -> registry def {id, kind, src, preview?, poster?} */
  api.registry().then(function (r) { (r.slots || []).forEach(function (d) { defs[d.id] = d; }); }).catch(function () {});

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    n.setAttribute("data-editor-ui", "");
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ── holders: focusable, so Enter opens them ── */
  function tagHolders() {
    document.querySelectorAll("[data-es]").forEach(function (el) {
      if (el.hasAttribute("data-es-ready")) return;
      el.setAttribute("data-es-ready", "");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-haspopup", "dialog");
    });
  }
  tagHolders();
  var tagTimer = 0;
  new MutationObserver(function () {
    clearTimeout(tagTimer);
    tagTimer = setTimeout(tagHolders, 200);
  }).observe(document.body, { childList: true, subtree: true });

  /* the <img> a holder shows (the holder is the img itself, or a figure around one) */
  function imgOf(holder) { return holder.tagName === "IMG" ? holder : holder.querySelector("img"); }
  function figureOf(holder) { return holder.closest("figure[data-preview]"); }

  /* ── drawer ── */
  var drawer = h("aside", { id: "ed-media", class: "ed-panel ed-media", "aria-label": "Picture", hidden: "" });
  var title = h("strong", { text: "Picture" });
  var slotLabel = h("span", { class: "ed-panel-page" });
  var closeBtn = h("button", { type: "button", class: "ed-close", "aria-label": "Close", text: "×" });
  var thumb = h("img", { class: "ed-media-thumb", alt: "" });
  var urlText = h("p", { class: "ed-media-url" });
  var altAr = h("input", { type: "text", dir: "rtl", lang: "ar", id: "ed-alt-ar", autocomplete: "off" });
  var altEn = h("input", { type: "text", dir: "ltr", lang: "en", id: "ed-alt-en", autocomplete: "off" });
  var resetBtn = h("button", { type: "button", class: "ed-reset", text: "Back to default" });
  var status = h("p", { class: "ed-hint ed-media-status", role: "status" });
  var body = h("div", { class: "ed-panel-list ed-media-body" }, [
    h("div", { class: "ed-media-file" }, [thumb, urlText]),
    h("label", { class: "ed-media-field", for: "ed-alt-ar" }, [h("span", { text: "Alt text (Arabic)" })]),
    altAr,
    h("label", { class: "ed-media-field", for: "ed-alt-en" }, [h("span", { text: "Alt text (English)" })]),
    altEn,
    h("div", { class: "ed-media-actions" }, [resetBtn]),
    h("div", { class: "ed-media-more" }),
    status,
  ]);
  drawer.appendChild(h("div", { class: "ed-panel-head" }, [h("div", {}, [title, document.createTextNode(" "), slotLabel]), closeBtn]));
  drawer.appendChild(body);
  document.body.appendChild(drawer);

  var cur = null; /* { id, holder, def, value (draft object | null), rev, timer, busy, dirty, orig } */
  var openerFocus = null;
  var opening = false;    /* openDrawer is clicking other panels shut: do not treat that as "a bar button was pressed" */
  var arTouched = false;  /* the Arabic alt was typed in (else it is just the markup's alt and is not sent) */

  function say(t) { status.textContent = t || ""; }
  function isPreviewSlot(c) { return !!(c.def && c.def.preview); }
  /* what the holder shows now: the draft's poster/src over the registry default */
  function shownUrl(c) {
    var v = c.value || {};
    return (isPreviewSlot(c) ? v.poster : undefined) || v.src || c.def.poster || c.def.src;
  }
  function paint() {
    var c = cur;
    if (!c) return;
    var u = shownUrl(c);
    thumb.src = u;
    urlText.textContent = u + (c.value ? "" : "  (default)");
    if (isPreviewSlot(c)) {
      var pv = (c.value && c.value.preview) || c.def.preview;
      urlText.textContent += "\n" + pv;
    }
    resetBtn.disabled = !c.value;
  }
  /* put the draft on the page in place: src / alt / data-preview only */
  /* the page clones some strips (the reels, the film), so one slot can have several holders */
  function eachHolder(c, fn) {
    var all = document.querySelectorAll('[data-es="' + c.id + '"]');
    for (var i = 0; i < all.length; i++) fn(all[i]);
  }
  function preview(c) {
    var u = shownUrl(c);
    var a = c.value && c.value.alt;
    var want = (a && (edit_lang() === "en" ? a.en || a.ar : a.ar || a.en)) || null;
    eachHolder(c, function (hd) {
      var img = imgOf(hd);
      if (img) {
        if (u && img.getAttribute("src") !== u) img.setAttribute("src", u);
        if (want !== null) img.setAttribute("alt", want);
      }
      var fig = figureOf(hd);
      if (fig && isPreviewSlot(c)) fig.setAttribute("data-preview", (c.value && c.value.preview) || c.def.preview);
    });
  }
  function edit_lang() { return (window.aliphEdit && window.aliphEdit.lang) || "ar"; }

  function openOther(btnSel) {
    /* close the Page text / History panels: one side panel at a time */
    document.querySelectorAll(".ed-bar button[aria-controls][aria-expanded='true']").forEach(function (b) { b.click(); });
    var done = document.querySelector(".ed-pop:not([hidden]) .ed-pop-actions .is-primary");
    if (done) done.click();
  }

  function load(c) {
    return api.content().then(function (d) {
      var row = (d.slots || {})[c.id];
      c.value = row ? JSON.parse(JSON.stringify(row)) : null;
      c.rev = ((d.locks && d.locks.slots) || {})[c.id] || 0;
    });
  }
  function fillFields(c) {
    var a = (c.value && c.value.alt) || {};
    var img = imgOf(c.holder);
    altAr.value = typeof a.ar === "string" ? a.ar : (img && img.getAttribute("alt")) || "";
    altEn.value = typeof a.en === "string" ? a.en : "";
    arTouched = false;
  }

  function openDrawer(holder) {
    var id = holder.getAttribute("data-es");
    var def = defs[id];
    if (!def) { api.registry().then(function (r) { (r.slots || []).forEach(function (d) { defs[d.id] = d; }); if (defs[id]) openDrawer(holder); }); return; }
    if (cur && cur.holder === holder) { altAr.focus(); return; }
    if (cur) flush();
    opening = true;
    openOther();
    opening = false;
    openerFocus = holder;
    var img = imgOf(holder);
    cur = { id: id, holder: holder, def: def, value: null, rev: 0, timer: 0, busy: false, dirty: false, alt0: img ? img.getAttribute("alt") : null };
    title.textContent = isPreviewSlot(cur) ? "Video" : "Picture";
    slotLabel.textContent = id;
    say("Loading…");
    drawer.hidden = false;
    holder.classList.add("ed-es-active");
    var c = cur;
    load(c).then(function () {
      if (cur !== c) return;
      fillFields(c); paint(); say("");
      altAr.focus();
    }, function () { say("Could not read the draft. Close and try again."); });
  }
  function closeDrawer() {
    if (!cur) return;
    if (op) op.ctl.abort();
    flush();
    var holder = cur.holder;
    upMsg.textContent = "";
    bar.hidden = true;
    cur.holder.classList.remove("ed-es-active");
    cur = null;
    drawer.hidden = true;
    say("");
    if (holder && holder.isConnected) holder.focus();
  }
  closeBtn.addEventListener("click", closeDrawer);

  /* ── saving: alt only in this task; the file itself comes in the next ── */
  function altValue(c) {
    var out = {};
    var had = c.value && c.value.alt && c.value.alt.ar !== undefined;
    if (altAr.value && (had || arTouched)) out.ar = altAr.value;
    if (altEn.value) out.en = altEn.value;
    return Object.keys(out).length ? out : null;
  }
  function wanted(c) {
    var v = {};
    var cv = c.value || {};
    Object.keys(cv).forEach(function (k) { if (k !== "alt") v[k] = cv[k]; });
    var a = altValue(c);
    if (a) v.alt = a;
    return Object.keys(v).length ? v : null;
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function queueSave() {
    if (!cur) return;
    cur.dirty = true;
    cur.value = wanted(cur) || null;
    preview(cur);
    ui.setChip("saving", "Saving…");
    clearTimeout(cur.timer);
    var c = cur;
    c.timer = setTimeout(function () { save(c); }, SAVE_DELAY);
  }
  function flush() { if (cur && cur.dirty) { clearTimeout(cur.timer); save(cur); } }

  function save(c) {
    if (c.busy) { c.timer = setTimeout(function () { save(c); }, 200); return; }
    c.dirty = false;
    var value = c.value;
    c.busy = true;
    var req = value ? api.saveSlot(c.id, value, c.rev) : api.resetSlot(c.id, c.rev);
    return req.then(function (res) {
      c.busy = false;
      if (res.status === 200) {
        c.rev = res.body.rev;
        ui.setChip("saved", "Draft");
        ui.refreshChanges();
        if (cur === c && !c.dirty) say("Saved.");
      } else if (res.status === 409) {
        var now = res.body && res.body.current;
        c.value = now && now.value ? now.value : null;
        c.rev = (now && now.rev) || 0;
        c.dirty = false;
        ui.setChip("saved", "Draft");
        if (cur === c) { fillFields(c); paint(); preview(c); say("This picture was changed somewhere else. Showing the latest."); }
        ui.refreshChanges();
      } else {
        ui.setChip("error", "Not saved");
        if (cur === c) say("Not saved: " + ((res.body && res.body.error) || res.status));
      }
    }, function () {
      c.busy = false;
      c.dirty = true;
      ui.setChip("offline", "Offline");
      if (cur === c) say("Offline. Will retry.");
      c.timer = setTimeout(function () { save(c); }, 8000);
    });
  }

  altAr.addEventListener("input", function () { arTouched = true; queueSave(); });
  altEn.addEventListener("input", queueSave);

  /* Back to default: the draft row goes (DELETE), the page shows the default file again */
  resetBtn.addEventListener("click", function () {
    var c = cur;
    if (!c || !c.value) return;
    clearTimeout(c.timer);
    c.dirty = false;
    var run = function () {
      c.busy = true;
      api.resetSlot(c.id, c.rev).then(function (res) {
        c.busy = false;
        if (res.status === 200 || res.status === 409) {
          if (res.status === 409) {
            c.rev = (res.body.current && res.body.current.rev) || c.rev;
            return api.resetSlot(c.id, c.rev).then(function (r2) { finishReset(c, r2); });
          }
          finishReset(c, res);
        } else say("Not reset: " + ((res.body && res.body.error) || res.status));
      }, function () { c.busy = false; say("Offline. Try again."); });
    };
    run();
  });
  function finishReset(c, res) {
    if (res.status !== 200) { say("Not reset: " + ((res.body && res.body.error) || res.status)); return; }
    c.rev = res.body.rev;
    c.value = null;
    eachHolder(c, function (hd) {
      var img = imgOf(hd);
      if (img) {
        img.setAttribute("src", c.def.poster || c.def.src);
        if (c.alt0 !== null && c.alt0 !== undefined) img.setAttribute("alt", c.alt0);
      }
      var fig = figureOf(hd);
      if (fig && c.def.preview) fig.setAttribute("data-preview", c.def.preview);
    });
    if (cur === c) { fillFields(c); altAr.value = c.alt0 || ""; altEn.value = ""; paint(); say("Back to the default."); }
    ui.refreshChanges();
  }

  /* ── upload new ──
     Image slot: prepareImage (WebP, 2000 px) + upload -> {src}. Preview slot:
     a video -> upload the film, preparePoster + upload with posterFor ->
     {preview, poster}; an image picked for a preview slot replaces the poster
     only. shared/media.js is the gallery team's module, imported as it is. */
  var mediaMod = null;
  function media() {
    if (!mediaMod) mediaMod = import("/admin/shared/media.js").catch(function (e) { mediaMod = null; throw e; });
    return mediaMod;
  }
  var pickInput = h("input", { type: "file", class: "ed-media-file-input", hidden: "", "aria-label": "Choose a file" });
  var uploadBtn = h("button", { type: "button", class: "ed-reset", text: "Upload new" });
  var cancelBtn = h("button", { type: "button", class: "ed-reset", text: "Cancel", hidden: "" });
  var bar = h("div", { class: "ed-media-progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0", hidden: "" }, [h("span")]);
  var upMsg = h("p", { class: "ed-hint ed-media-uperr", role: "alert" });
  var more = body.querySelector(".ed-media-more");
  more.appendChild(h("div", { class: "ed-media-actions" }, [uploadBtn, cancelBtn]));
  more.appendChild(pickInput);
  more.appendChild(bar);
  more.appendChild(upMsg);

  var op = null; /* { ctl: AbortController, c } while an upload runs */
  function setProgress(pct) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    bar.hidden = false;
    bar.setAttribute("aria-valuenow", String(pct));
    bar.firstChild.style.width = pct + "%";
  }
  function busyUi(on) {
    uploadBtn.disabled = on;
    resetBtn.disabled = on || !(cur && cur.value);
    cancelBtn.hidden = !on;
    if (!on) setTimeout(function () { if (!op) bar.hidden = true; }, 1200);
  }
  function mediaMessage(e) {
    var code = e && e.code;
    if (code === "aborted") return "Cancelled.";
    if (code === "unreadable") return "That file could not be read. Use a JPEG, PNG or WebP picture, or an MP4 or WebM film.";
    if (code === "unsupported") return "That file type is not supported (JPEG, PNG, WebP, AVIF, MP4, WebM).";
    if (code === "toolarge") return "That file is too large.";
    return "The upload did not finish: " + ((e && e.message) || "network error") + ". Try again.";
  }
  /* write a patch into the draft row right now (no debounce) and show it */
  function commit(c, patch) {
    var v = wanted(c) || {};
    Object.keys(patch).forEach(function (k) { v[k] = patch[k]; });
    clearTimeout(c.timer);
    c.value = v;
    preview(c);
    if (cur === c) paint();
    return save(c);
  }
  function startUpload(file) {
    var c = cur;
    if (!c || op) return;
    upMsg.textContent = "";
    var preview_ = isPreviewSlot(c);
    media().then(function (M) {
      var kind = M.kindOf(file);
      if (!kind) throw new M.MediaError("unreadable", "unreadable");
      if (kind === "video" && !preview_) { upMsg.textContent = "This is a picture slot. Choose a JPEG, PNG or WebP picture."; return; }
      var ctl = new AbortController();
      op = { ctl: ctl, c: c };
      busyUi(true);
      setProgress(0);
      say("Uploading…");
      var run;
      if (kind === "image") {
        run = M.prepareImage(file).then(function (img) {
          if (ctl.signal.aborted) throw new M.MediaError("aborted", "cancelled");
          return M.upload(img.blob, file.name, { signal: ctl.signal, onProgress: function (p) { setProgress(100 * (p.loaded / (p.total || 1))); } });
        }).then(function (r) { return preview_ ? { poster: r.url } : { src: r.url }; });
      } else {
        var film;
        run = M.upload(file, file.name, { signal: ctl.signal, onProgress: function (p) { setProgress(88 * (p.loaded / (p.total || 1))); } }).then(function (r) {
          film = r;
          return M.preparePoster(file);
        }).then(function (poster) {
          if (ctl.signal.aborted) throw new M.MediaError("aborted", "cancelled");
          return M.upload(poster.blob, file.name, { signal: ctl.signal, posterFor: film.key, onProgress: function (p) { setProgress(88 + 12 * (p.loaded / (p.total || 1))); } });
        }).then(function (pr) { return { preview: film.url, poster: pr.url }; });
      }
      return run.then(function (patch) {
        setProgress(100);
        return commit(c, patch).then(function () { if (cur === c) say("Uploaded. Saved to the draft."); });
      });
    }).catch(function (e) {
      upMsg.textContent = mediaMessage(e);
      if (cur === c) say("");
    }).then(function () { op = null; busyUi(false); });
  }
  uploadBtn.addEventListener("click", function () {
    pickInput.value = "";
    pickInput.setAttribute("accept", cur && isPreviewSlot(cur) ? "video/mp4,video/webm,image/*" : "image/*");
    pickInput.click();
  });
  pickInput.addEventListener("change", function () { if (pickInput.files && pickInput.files[0]) startUpload(pickInput.files[0]); });
  cancelBtn.addEventListener("click", function () { if (op) op.ctl.abort(); });

  /* ── events ── */
  function holderOf(t) {
    if (!t || !t.closest) return null;
    if (t.closest("[data-editor-ui]")) return null;
    return t.closest("[data-es]");
  }
  /* window + capture: before editor.js's document listener and before every handler the page has */
  window.addEventListener("click", function (e) {
    var el = holderOf(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openDrawer(el);
  }, true);
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cur && !document.querySelector(".ed-scrim") && !document.querySelector(".ed-pop:not([hidden])")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeDrawer();
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target && e.target.hasAttribute && e.target.hasAttribute("data-es") && !e.target.closest("[data-editor-ui]")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      openDrawer(e.target);
    }
  }, true);
  /* a bar button that opens another panel closes this drawer */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ed-bar button[aria-controls]");
    if (b && cur && !opening) closeDrawer();
  }, true);
  /* the page's own pointer handlers (hover preview, strip drag) are left alone; only the click is taken */
  window.addEventListener("beforeunload", flush);

  window.aliphEditorMedia = { open: openDrawer, close: closeDrawer, more: more, commit: function (patch) { return cur ? commit(cur, patch) : null; } };
})();
