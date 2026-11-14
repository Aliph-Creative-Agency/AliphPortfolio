/* Edit-mode overlay (classic script, no build). Loaded only by the /admin/edit/*
   pages, after main.js has run its EDIT MODE HOOKS (window.aliphEdit).
   What it adds: a slim bar at the bottom edge (page switcher, AR/EN toggle,
   status chip, Publish / Discard), a hover outline on [data-ek] text, and a click popover with
   an Arabic and an English field. Typing previews live through
   aliphEdit.apply; Esc or Cancel puts both languages back; Done keeps the
   preview and closes. Nothing is saved here yet (autosave is E-05).
   Every node this file adds carries data-editor-ui, which the page's tagger
   skips, so the overlay is never mistaken for site text. */
(function () {
  "use strict";
  var edit = window.aliphEdit;
  var api = window.aliphEditorApi;
  if (!edit || !api) return;

  var LOCALES = ["ar", "en"];
  var PAGES = [
    { href: "/admin/edit/", label: "Home" },
    { href: "/admin/edit/about", label: "About" },
    { href: "/admin/edit/library", label: "Library" },
  ];

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    n.setAttribute("data-editor-ui", "");
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  var registry = { text: [], fields: [] };
  api.registry().then(function (r) { registry = r; }).catch(function () {});
  function entryOf(key) {
    var i;
    for (i = 0; i < registry.text.length; i++) if (registry.text[i].key === key) return registry.text[i];
    for (i = 0; i < registry.fields.length; i++) if (registry.fields[i].key === key) return registry.fields[i];
    return null;
  }

  /* ── bar ── */
  var langBtn = h("button", { type: "button", "aria-label": "Switch page language" });
  function syncLang() { langBtn.textContent = (edit.lang || "ar").toUpperCase(); }
  langBtn.addEventListener("click", function () {
    var t = document.querySelector(".js-lang");
    if (t) t.click();
    setTimeout(function () { syncLang(); refit(document.querySelector(".hero-title")); }, 60);
  });
  syncLang();

  var here = location.pathname.replace(/\/+$/, "") || "/";
  var pageLinks = PAGES.map(function (p) {
    var a = h("a", { href: p.href, text: p.label });
    if (here === p.href.replace(/\/+$/, "")) a.setAttribute("aria-current", "page");
    return a;
  });
  var chip = h("span", { class: "ed-chip", text: "Draft" });
  var publishBtn = h("button", { type: "button", class: "ed-publish", disabled: "", text: "Publish" });
  var discardBtn = h("button", { type: "button", class: "ed-discard", disabled: "", text: "Discard" });
  var panelBtn = h("button", { type: "button", "aria-expanded": "false", "aria-controls": "ed-panel", text: "Page text" });
  var histBtn = h("button", { type: "button", "aria-expanded": "false", "aria-controls": "ed-history", text: "History" });
  var bar = h("div", { class: "ed-bar", role: "toolbar", "aria-label": "Page editor" }, [
    h("span", { class: "ed-brand", text: "Aliph editor" }),
    h("div", { class: "ed-pages" }, pageLinks),
    langBtn,
    panelBtn,
    histBtn,
    h("span", { class: "ed-spacer" }),
    chip,
    discardBtn,
    publishBtn,
    h("a", { href: "/admin/", text: "Dashboard" }),
  ]);

  /* ── autosave ──
     Every preview() queues (key, locale, value). 800 ms after the last
     keystroke for that pair the value is PUT with the row's rev (the draft's
     `locks`, 0 = no row yet) and the answer's rev is kept for the next save.
     A value equal to what the server already holds is never sent (so Esc after
     an autosave sends the old text back, and Esc before one sends nothing).
     Nothing is lost on a failed send: the pending values live in localStorage
     (a convenience, wrapped in try/catch) and are retried on `online` and every
     8 s. 409 opens a dialog: Keep mine (re-PUT with the current rev) or Take
     theirs (apply the server's value). */
  var SAVE_DELAY = 800, RETRY_MS = 8000, BACKUP = "aliph-editor-backup";
  var st = {};            /* "key|loc" -> { key, loc, value, saved, rev, timer, busy, dirty } */
  var locksReady = null;  /* promise of the draft's locks.text, fetched once */
  var locks = {};
  var chipState = "saved";
  var conflicts = [];     /* conflict dialogs waiting */

  function setChip(state, text) {
    chipState = state;
    chip.textContent = text;
    chip.setAttribute("data-state", state);
  }
  setChip("saved", "Draft");

  function loadLocks() {
    if (!locksReady) {
      locksReady = api.content().then(function (c) { locks = (c && c.locks && c.locks.text) || {}; }).catch(function () { locksReady = null; });
    }
    return locksReady;
  }
  function slot(key, loc, savedValue) {
    var id = key + "|" + loc;
    if (!st[id]) st[id] = { key: key, loc: loc, value: savedValue, saved: savedValue, rev: null, timer: 0, busy: false, dirty: false };
    return st[id];
  }
  function backupWrite() {
    try {
      var out = {};
      Object.keys(st).forEach(function (id) { if (st[id].value !== st[id].saved) out[id] = { key: st[id].key, loc: st[id].loc, value: st[id].value }; });
      if (Object.keys(out).length) localStorage.setItem(BACKUP, JSON.stringify(out)); else localStorage.removeItem(BACKUP);
    } catch (_) {}
  }
  function pendingCount() {
    return Object.keys(st).filter(function (id) { return st[id].value !== st[id].saved || st[id].busy; }).length;
  }
  function refreshChip() {
    if (conflicts.length) return setChip("conflict", "Conflict");
    if (chipState === "error" || chipState === "offline") return;
    setChip(pendingCount() ? "saving" : "saved", pendingCount() ? "Saving…" : "Saved");
    syncPublishBtns();
    if (!pendingCount()) refreshChanges();
  }

  /* called by preview(): the value now on screen for (key, loc) */
  function queue(key, loc, value, savedValue) {
    var s = slot(key, loc, savedValue);
    s.value = value;
    clearTimeout(s.timer);
    s.timer = setTimeout(function () { flush(s); }, SAVE_DELAY);
    if (chipState !== "conflict") { chipState = "saving"; }
    backupWrite();
    refreshChip();
  }

  function flush(s) {
    clearTimeout(s.timer);
    if (conflicts.indexOf(s) >= 0) return Promise.resolve(); /* nothing goes out until the dialog is answered */
    if (s.busy) { s.dirty = true; return Promise.resolve(); }
    if (s.value === s.saved) { backupWrite(); refreshChip(); return Promise.resolve(); }
    s.busy = true;
    s.dirty = false;
    var sent = s.value;
    setChip("saving", "Saving…");
    return loadLocks().then(function () {
      var rev = s.rev != null ? s.rev : ((locks[s.key] || {})[s.loc] || 0);
      return api.saveText(s.key, s.loc, sent, rev);
    }).then(function (r) {
      s.busy = false;
      if (r.status === 200) {
        s.saved = sent;
        s.rev = r.body.rev;
        if (chipState === "error" || chipState === "offline") chipState = "saving";
      } else if (r.status === 409) {
        s.rev = r.body.current ? r.body.current.rev : 0;
        showConflict(s, r.body.current || { value: null, rev: 0 });
      } else if (r.status >= 500) {
        setChip("offline", "Retrying…");
        s.timer = setTimeout(function () { flush(s); }, RETRY_MS);
        return;
      } else {
        setChip("error", "Not saved: " + ((r.body && r.body.error) || r.status));
        return;
      }
      if (s.dirty || s.value !== s.saved) { if (r.status === 200) return flush(s); }
      backupWrite();
      refreshChip();
    }, function () {
      s.busy = false;
      setChip("offline", "Offline");
      s.timer = setTimeout(function () { flush(s); }, RETRY_MS);
    });
  }
  function flushAll() {
    return Promise.all(Object.keys(st).map(function (id) { return flush(st[id]); }));
  }
  window.addEventListener("online", function () { if (chipState === "offline") setChip("saving", "Saving…"); flushAll(); });
  window.addEventListener("offline", function () { if (pendingCount()) setChip("offline", "Offline"); });

  /* ── conflict dialog ── */
  function showConflict(s, cur) {
    if (conflicts.indexOf(s) >= 0) return;
    conflicts.push(s);
    setChip("conflict", "Conflict");
    var dlg = h("div", { class: "ed-dialog", role: "alertdialog", "aria-label": "Edit conflict" });
    var mine = h("button", { type: "button", class: "is-primary", text: "Keep mine" });
    var theirs = h("button", { type: "button", text: "Take theirs" });
    var theirText = cur.value == null ? "(the default text)" : cur.value;
    dlg.appendChild(h("p", { class: "ed-dialog-title", text: "Someone saved " + s.key + " (" + s.loc.toUpperCase() + ") while you were typing" }));
    dlg.appendChild(h("p", { class: "ed-dialog-theirs", text: "Theirs: " + theirText }));
    dlg.appendChild(h("p", { class: "ed-dialog-mine", text: "Yours: " + s.value }));
    dlg.appendChild(h("div", { class: "ed-pop-actions" }, [theirs, mine]));
    function done() {
      conflicts.splice(conflicts.indexOf(s), 1);
      dlg.remove();
      refreshChip();
    }
    mine.addEventListener("click", function () {
      done();
      s.saved = cur.value; /* so the differing value is sent */
      s.rev = cur.rev;
      flush(s);
    });
    theirs.addEventListener("click", function () {
      done();
      if (cur.value == null) {
        s.saved = s.value = ""; s.rev = cur.rev; backupWrite();
        location.reload(); /* the default is only in the page's own tables: re-read them */
        return;
      }
      s.saved = s.value = cur.value;
      s.rev = cur.rev;
      edit.apply(s.key, s.loc, cur.value);
      syncOpenFields(s.key, s.loc, cur.value);
      backupWrite();
      refit(document.querySelector('[data-ek="' + s.key + '"]'));
    });
    document.body.appendChild(dlg);
    mine.focus();
  }

  /* ── publish / discard ──
     Publish is enabled when the draft differs from the live site (GET
     /api/admin/changes, re-read once saves settle) and nothing is still
     saving. It lists the changes per page in a dialog; Publish there POSTs the
     token that list came with, so a draft that moved meanwhile is a 409 and the
     list is shown again instead of publishing something unseen. Discard puts
     every draft (text, pictures, gallery, rings, clients) back to the live state
     and reloads. */
  var lastChanges = null, changesTimer = 0, modal = null, toastTimer = 0, modalOpener = null;
  var PAGE_NAMES = { home: "Home", about: "About", library: "Library" };
  function syncPublishBtns() {
    var all = lastChanges ? lastChanges.changes : [];
    var busy = pendingCount() > 0 || !!modal;
    publishBtn.disabled = busy || !all.length;
    discardBtn.disabled = busy || !all.length;
    publishBtn.textContent = all.length ? "Publish (" + all.length + ")" : "Publish";
  }
  function refreshChanges() {
    clearTimeout(changesTimer);
    changesTimer = setTimeout(function () {
      api.changes().then(function (c) { lastChanges = c; syncPublishBtns(); }).catch(function () {});
    }, 300);
  }
  function toast(text) {
    var t = document.querySelector(".ed-toast") || document.body.appendChild(h("div", { class: "ed-toast", role: "status" }));
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 5000);
  }
  /* A change row reads "Page · Section · what": the registry's page and section for text (the first 40 characters of the
     text when this page can read it), "About · Media · photo 3" for a picture, then Library · Gallery, Rings, Clients.
     The raw key is never shown. Client names come from the draft (loadNames). */
  var SECTION_TITLES = {
    "nav-big": "Navigation", hero: "Hero", services: "Services", script: "Script", testiRotor: "Testimonials", contact: "Contact",
    "contact-socials": "Contact", masthead: "Masthead", main: "Main", "sheet-head": "Header", page: "Page", "about-clips": "Clippings",
    "ab-read": "About text", head: "Page title", "svc-static-item": "Services", "why-block": "Why Aliph",
  };
  function titleCase(w) { return String(w).replace(/[-_]+/g, " ").replace(/^./, function (m) { return m.toUpperCase(); }); }
  var names = {};
  function loadNames() {
    return api.content().then(function (d) {
      ((d && d.clients) || []).forEach(function (c) { names[c.id] = (c.name && (c.name.en || c.name.ar)) || c.id; });
    }, function () {});
  }
  function clip(v, n) { v = String(v).replace(/\s+/g, " ").trim(); return v.length > n ? v.slice(0, n - 1) + "…" : v; }
  function slotWhat(id) {
    var m = /\.(media|film)\.(\d+)$/.exec(id);
    var e = null;
    ((registry.slots) || []).forEach(function (x) { if (x.id === id) e = x; });
    if (!m) return "picture";
    if (m[1] === "film") return "film frame " + m[2];
    return (e && e.preview ? "video " : "photo ") + m[2];
  }
  function rowLabel(c, withText) {
    var parts;
    if (c.section === "slots") {
      parts = [PAGE_NAMES[c.page] || titleCase(c.page || "site"), "Media", slotWhat(c.id)];
    } else if (c.section === "gallery") {
      parts = ["Library", "Gallery", c.id];
    } else if (c.section === "rings") {
      parts = ["Rings", c.id];
    } else if (c.section === "clients") {
      parts = ["Clients", names[c.id] || c.id];
    } else {
      var e = entryOf(c.id);
      parts = [PAGE_NAMES[c.page || (e && e.page)] || "Site", (e && (SECTION_TITLES[e.section] || titleCase(e.section))) || "Text"];
      var loc = c.locales && c.locales.length ? c.locales[0] : null;
      var v = withText && loc && edit.read ? edit.read(c.id, loc) : null;
      if (typeof v === "string" && v.trim()) parts.push(clip(v, 40));
      else if (c.locales) parts.push(c.locales.join(" + ").toUpperCase());
    }
    return parts.join(" · ");
  }
  function describe(c) { return rowLabel(c, true); }
  /* the changes per page, then one "Gallery: N changes" line */
  function changeList(changes) {
    var groups = {}, order = [], gallery = 0, nodes = [];
    changes.forEach(function (c) {
      if (c.section === "gallery" || c.section === "clients") { gallery++; return; }
      var p = c.page || "other";
      if (!groups[p]) { groups[p] = []; order.push(p); }
      groups[p].push(c);
    });
    function n(k) { return k + (k === 1 ? " change" : " changes"); }
    order.forEach(function (p) {
      nodes.push(h("p", { class: "ed-dialog-page", text: (PAGE_NAMES[p] || p) + ": " + n(groups[p].length) }));
      nodes.push(h("ul", { class: "ed-dialog-list" }, groups[p].map(function (c) { return h("li", { dir: "auto", text: describe(c) }); })));
    });
    if (gallery) nodes.push(h("p", { class: "ed-dialog-page", text: "Gallery: " + n(gallery) }));
    return nodes;
  }
  function closeModal() {
    var back = modalOpener;
    modalOpener = null;
    if (modal) { modal.remove(); modal = null; }
    syncPublishBtns();
    /* focus goes back to what opened the dialog (a button the save just disabled falls back to the bar) */
    if (back && back.isConnected && !back.disabled) back.focus();
  }
  /* onConfirm(msg) resolves true to keep the dialog open (msg says why) */
  function openModal(title, body, confirmText, onConfirm) {
    var opener = document.activeElement && document.activeElement !== document.body && !modal ? document.activeElement : modalOpener;
    closeModal();
    modalOpener = opener;
    var ok = h("button", { type: "button", class: "is-primary", text: confirmText });
    var cancel = h("button", { type: "button", text: "Cancel" });
    var msg = h("p", { class: "ed-dialog-msg", role: "status" });
    var dlg = h("div", { class: "ed-dialog ed-confirm", role: "dialog", "aria-modal": "true", "aria-label": title },
      [h("p", { class: "ed-dialog-title", text: title }), h("div", { class: "ed-dialog-body" }, body), msg,
        h("div", { class: "ed-pop-actions" }, [cancel, ok])]);
    modal = h("div", { class: "ed-scrim" }, [dlg]);
    cancel.addEventListener("click", closeModal);
    ok.addEventListener("click", function () {
      ok.disabled = cancel.disabled = true;
      msg.textContent = "Working…";
      onConfirm(msg).then(function (keep) {
        if (keep) { ok.disabled = cancel.disabled = false; } else closeModal();
      }, function () { ok.disabled = cancel.disabled = false; msg.textContent = "Could not reach the server. Try again."; });
    });
    document.body.appendChild(modal);
    ok.focus();
    syncPublishBtns();
  }
  /* settle the open popover and every pending save, then read the list */
  function settled() {
    if (cur) closePop(false);
    return flushAll().then(function () { return Promise.all([api.changes(), loadNames()]); }).then(function (both) {
      var c = both[0];
      lastChanges = c;
      syncPublishBtns();
      return c;
    });
  }
  function startPublish(note) {
    settled().then(function (c) {
      if (!c.changes.length) { toast("Nothing to publish"); return; }
      var body = changeList(c.changes);
      if (note) body.unshift(h("p", { class: "ed-dialog-note", text: note }));
      openModal("Publish " + c.changes.length + (c.changes.length === 1 ? " change" : " changes") + " to the live site?", body, "Publish", function (msg) {
        return api.publish(c.token).then(function (r) {
          if (r.status === 200) {
            toast("Published. The live site is now revision " + r.body.rev + ".");
            refreshChanges();
            return false;
          }
          if (r.status === 409) {
            closeModal();
            startPublish("The draft changed while this list was open. Here is the list as it is now.");
            return false;
          }
          msg.textContent = "Not published: " + ((r.body && r.body.error) || r.status);
          return true;
        });
      });
    }, function () { toast("Could not read the changes. Try again."); });
  }
  function startDiscard() {
    settled().then(function (c) {
      var mine = c.changes;
      if (!mine.length) return;
      var body = changeList(mine);
      openModal("Discard " + mine.length + " unpublished " + (mine.length === 1 ? "change" : "changes") + "? The live site's content comes back.", body, "Discard", function (msg) {
        return api.discard(c.token).then(function (r) {
          if (r.status === 200) {
            try { localStorage.removeItem(BACKUP); } catch (_) {}
            Object.keys(st).forEach(function (id) { st[id].saved = st[id].value; });
            location.reload();
            return true;
          }
          if (r.status === 409) { closeModal(); startDiscard(); return false; }
          msg.textContent = "Not discarded: " + ((r.body && r.body.error) || r.status);
          return true;
        });
      });
    }, function () { toast("Could not read the changes. Try again."); });
  }
  publishBtn.addEventListener("click", function () { startPublish(); });
  discardBtn.addEventListener("click", startDiscard);

  /* ── hover outline ── */
  var outline = h("div", { class: "ed-outline", "aria-hidden": "true" });
  var hovered = null;

  function editable(el) {
    if (!el || el.closest("[data-editor-ui]")) return false;
    /* a stray one-letter node that happens to equal a one-letter table value */
    if (el.hasAttribute("data-ek-auto") && el.textContent.trim().length < 2) return false;
    return true;
  }
  function eligible(target) {
    var el = target && target.closest ? target.closest("[data-ek]") : null;
    return editable(el) ? el : null;
  }
  function drawOutline(el, active) {
    if (!el || !el.isConnected) { outline.classList.remove("is-on"); return; }
    var r = el.getBoundingClientRect();
    outline.style.left = r.left - 2 + "px";
    outline.style.top = r.top - 2 + "px";
    outline.style.width = r.width + 4 + "px";
    outline.style.height = r.height + 4 + "px";
    outline.classList.add("is-on");
    outline.classList.toggle("is-active", !!active);
  }

  /* ── popover ── */
  var cur = null; /* { el, key, orig:{ar,en}, area:{ar,en}, count:{ar,en}, max } */
  var pop = h("div", { class: "ed-pop", role: "dialog", "aria-label": "Edit text", hidden: "" });

  function origOf(key, loc, draft) {
    var v = edit.read(key, loc);
    if (typeof v === "string") return v;
    var d = draft && draft.text && draft.text[key];
    return d && typeof d[loc] === "string" ? d[loc] : "";
  }

  function updateCount(loc) {
    var max = cur.max;
    var n = cur.area[loc].value.length;
    cur.count[loc].textContent = max ? n + " / " + max : String(n);
    cur.count[loc].classList.toggle("is-over", !!max && n > max);
  }

  /* The popover holds the clicked element itself. Clearing a field empties the
     node, and the page's tagger drops an auto tag from an empty node, so
     apply() could no longer find it by data-ek: write to the node directly
     and put the tag back. */
  function preview(loc, value) {
    edit.apply(cur.key, loc, value);
    queue(cur.key, loc, value, cur.orig[loc]);
    var el = cur.el;
    /* a line with element children (ransom chips) is rebuilt by apply: follow it to its new node */
    if (!el.isConnected) {
      el = document.querySelector('[data-ek="' + cur.key + '"]');
      if (!el) return;
      cur.el = el;
    }
    if (!el.hasAttribute("data-ek")) { el.setAttribute("data-ek", cur.key); if (cur.auto) el.setAttribute("data-ek-auto", ""); }
    panelVals[cur.key + "|" + loc] = value;
    if (cur.virtual) return; /* opened from the panel: the page shows it (if at all) through apply() */
    if (loc === edit.lang && !el.children.length && el.textContent !== value) el.textContent = value;
    if (cur.rich && !cur.collapse) el.classList.add("ed-rich");
    if (loc === edit.lang) refit(el);
  }

  /* a longer or shorter text can break the box it sits in: re-fit it (main.js
     does the measuring; one pass per frame however fast the typing) */
  var fitFrame = 0;
  function refit(el) {
    if (fitFrame) cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(function () {
      fitFrame = 0;
      if (edit.refit) edit.refit(el);
      if (cur) place();
    });
  }

  function place() {
    if (!cur || !cur.el.isConnected) return;
    if (cur.virtual) { placeBesidePanel(); return; }
    var r = cur.el.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var pw = pop.offsetWidth, ph = pop.offsetHeight, bottomBar = bar.offsetHeight + 8;
    var top = r.bottom + 10;
    if (top + ph > vh - bottomBar) top = r.top - ph - 10;
    if (top < 8) top = Math.max(8, vh - bottomBar - ph);
    /* U-17: a text scrolled (or grown) far out of view must not take the popover with it */
    top = Math.min(top, Math.max(8, vh - bottomBar - ph));
    var left = Math.min(Math.max(8, r.left), Math.max(8, vw - pw - 8));
    pop.style.top = top + "px";
    pop.style.left = left + "px";
    drawOutline(cur.el, true);
  }

  /* a popover opened from the panel sits beside it, not at an element */
  function placeBesidePanel() {
    var pr = panel.getBoundingClientRect();
    var vw = window.innerWidth, pw = pop.offsetWidth;
    var left = pr.left - pw - 10;
    if (left < 8) left = Math.max(8, Math.min(vw - pw - 8, pr.left - 8));
    pop.style.left = left + "px";
    pop.style.top = Math.max(8, pr.top + 8) + "px";
    outline.classList.remove("is-on", "is-active");
  }

  function field(loc, label) {
    var area = h("textarea", { rows: cur.rich && !cur.collapse ? "5" : "3", "data-loc": loc, "aria-label": label, dir: loc === "ar" ? "rtl" : "ltr", lang: loc });
    var count = h("span", { class: "ed-count" });
    cur.area[loc] = area;
    cur.count[loc] = count;
    if (cur.collapse) {
      /* the public element collapses whitespace: a line break typed here would show in the editor only */
      area.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
      area.addEventListener("beforeinput", function (e) { if (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") e.preventDefault(); });
      area.addEventListener("paste", function (e) {
        var t = e.clipboardData && e.clipboardData.getData("text");
        if (!t || !/[\r\n]/.test(t)) return;
        e.preventDefault();
        area.setRangeText(t.replace(/\s*[\r\n]+\s*/g, " "), area.selectionStart, area.selectionEnd, "end");
        area.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    area.addEventListener("input", function () {
      updateCount(loc);
      preview(loc, area.value);
      place();
    });
    var reset = h("button", { type: "button", class: "ed-reset", text: "Reset", title: "Drop the draft and go back to the live text" });
    reset.addEventListener("click", function () { resetLocale(cur.key, loc); });
    return h("label", { class: "ed-field" }, [
      h("span", { class: "ed-field-top" }, [h("span", { text: label }), h("span", { class: "ed-field-tools" }, [count, reset])]),
      area,
    ]);
  }

  /* DELETE the draft of one locale; the live text is only in the page's own
     tables, which the draft overwrote, so the page reloads to show it */
  function resetLocale(key, loc) {
    var sl = slot(key, loc, cur ? cur.orig[loc] : "");
    clearTimeout(sl.timer);
    setChip("saving", "Saving…");
    loadLocks().then(function () {
      var rev = sl.rev != null ? sl.rev : ((locks[key] || {})[loc] || 0);
      return api.resetText(key, loc, rev);
    }).then(function (r) {
      if (r.status === 200) { sl.saved = sl.value; try { localStorage.removeItem(BACKUP); } catch (_) {} backupWrite(); location.reload(); }
      else if (r.status === 409) showConflict(sl, r.body.current || { value: null, rev: 0 });
      else setChip("error", "Not reset: " + ((r.body && r.body.error) || r.status));
    }, function () { setChip("offline", "Offline"); });
  }
  function syncOpenFields(key, loc, value) {
    if (!cur || cur.key !== key || !cur.area[loc]) return;
    cur.area[loc].value = value;
    cur.orig[loc] = value;
    updateCount(loc);
  }

  function open(el, panelKey) {
    if (cur) closePop(false);
    var key = panelKey || el.dataset.ek;
    var entry = entryOf(key);
    var locs = entry && entry.locales ? LOCALES.filter(function (l) { return entry.locales.indexOf(l) >= 0; }) : LOCALES;
    cur = { el: el, key: key, locs: locs, virtual: !!panelKey, orig: {}, area: {}, count: {}, max: entry && entry.maxLength || 0, auto: el.hasAttribute("data-ek-auto"), rich: !!entry && entry.kind === "richline", collapse: false };
    /* a richline keeps its line breaks only where the public element does: read what it computes to, not a key list */
    if (cur.rich) {
      var live = el.hasAttribute("data-ek") ? el : document.querySelector('[data-ek="' + key + '"]');
      if (live) {
        var had = live.classList.contains("ed-rich");
        live.classList.remove("ed-rich");
        var ws = getComputedStyle(live).whiteSpace;
        cur.collapse = ws === "normal" || ws === "nowrap";
        if (had && !cur.collapse) live.classList.add("ed-rich");
      }
    }
    locs.forEach(function (l) { cur.orig[l] = origOf(key, l, panelKey ? panelDraft : null); });
    pop.textContent = "";
    var cancel = h("button", { type: "button", text: "Cancel" });
    var done = h("button", { type: "button", class: "is-primary", text: "Done" });
    cancel.addEventListener("click", function () { closePop(true); });
    done.addEventListener("click", function () { closePop(false); });
    [
      h("div", { class: "ed-pop-head" }, [
        /* U-05: where the text is, in words ("Hero", "Home"), not the registry key */
        h("span", { class: "ed-pop-key", text: (entry && (SECTION_TITLES[entry.section] || titleCase(entry.section))) || "Text" }),
        h("span", { class: "ed-pop-sec", text: (entry && PAGE_NAMES[entry.page]) || "Site" }),
      ]),
      locs.indexOf("ar") >= 0 ? field("ar", "Arabic") : null,
      locs.indexOf("en") >= 0 ? field("en", "English") : null,
      h("p", { class: "ed-hint", text: (locs.length === 1 ? "Arabic only. " : "") + (cur.rich ? (cur.collapse ? "This line has no line breaks on the page. " : "Enter makes a line break. ") : "") + "Saved as a draft while you type. Esc puts back the text from when you opened this." }),
      h("div", { class: "ed-pop-actions" }, [cancel, done]),
    ].forEach(function (n) { if (n) pop.appendChild(n); });
    locs.forEach(function (l) { cur.area[l].value = cur.orig[l]; updateCount(l); });
    pop.hidden = false;
    place();
    /* the draft may hold a newer value than the tables if someone saved since load */
    var mine = cur;
    api.content().then(function (draft) {
      if (cur !== mine) return;
      mine.locs.forEach(function (l) {
        if (mine.area[l].value !== mine.orig[l]) return; /* already typing */
        var v = origOf(mine.key, l, draft);
        if (v !== mine.orig[l]) { mine.orig[l] = v; mine.area[l].value = v; updateCount(l); }
      });
    }).catch(function () {});
    var first = cur.area[edit.lang === "en" && cur.area.en ? "en" : locs[0]];
    first.focus();
    first.setSelectionRange(first.value.length, first.value.length);
  }

  function closePop(restore) {
    if (!cur) return;
    if (restore) cur.locs.forEach(function (l) { preview(l, cur.orig[l]); });
    if (cur.virtual) { var pk = cur.key; setTimeout(function () { refreshPanelRow(pk); }, 0); }
    pop.hidden = true;
    outline.classList.remove("is-on", "is-active");
    var el = cur.el;
    cur = null;
    hovered = null;
    if (el.isConnected) edit.tag();
  }

  /* ── "Page text" panel ──
     Every registry key of this page that cannot be clicked on the page itself:
     the <head> texts (title, description, share card; Arabic only), aria
     labels, strings only the scripts show, and the nav links (a plain click
     there navigates). Rows open the same popover and use the same autosave. */
  var PAGE = (/^\/admin\/edit\/(about|library)\/?$/.exec(location.pathname) || [0, "home"])[1];
  var panelDraft = null;
  var panelVals = {}; /* "key|loc" -> value typed this session, wins over the fetched draft */
  var panel = h("aside", { id: "ed-panel", class: "ed-panel", "aria-label": "Page text", hidden: "" });
  var panelList = h("div", { class: "ed-panel-list" });
  var panelFilter = h("input", { type: "search", placeholder: "Filter keys and text", "aria-label": "Filter page text" });
  var rows = {}; /* key -> { btn, val, entry } */
  var panelClose = h("button", { type: "button", class: "ed-close", "aria-label": "Close Page text", text: "×" });
  panel.appendChild(h("div", { class: "ed-panel-head" }, [h("strong", { text: "Page text" }), h("span", { class: "ed-panel-page", text: PAGE }), panelClose]));
  panel.appendChild(panelFilter);
  panel.appendChild(panelList);

  /* true when the key has a node on the page that a plain click edits */
  function clickable(key) {
    var els = document.querySelectorAll('[data-ek="' + key + '"]');
    for (var i = 0; i < els.length; i++) if (!els[i].closest("a[href]") && editable(els[i])) return true;
    return false;
  }
  function rowText(e) {
    var loc = e.locales && e.locales.indexOf("en") < 0 ? "ar" : (edit.lang === "en" ? "en" : "ar");
    var v = origOf(e.key, loc, panelDraft);
    if (typeof panelVals[e.key + "|" + loc] === "string") v = panelVals[e.key + "|" + loc];
    if (cur && cur.key === e.key && cur.area[loc]) v = cur.area[loc].value;
    return v;
  }
  function refreshPanelRow(key) {
    var r = rows[key];
    if (!r) return;
    var v = rowText(r.entry);
    r.val.textContent = v || "(default)";
    r.btn.setAttribute("data-text", v.toLowerCase());
  }
  function buildPanel() {
    panelList.textContent = "";
    rows = {};
    var all = registry.text.concat(registry.fields).filter(function (e) {
      return e.pages && e.pages.indexOf(PAGE) >= 0 && !clickable(e.key);
    });
    var bySec = {};
    all.forEach(function (e) { (bySec[e.section || "other"] = bySec[e.section || "other"] || []).push(e); });
    Object.keys(bySec).forEach(function (sec) {
      var grp = h("section", { class: "ed-panel-sec" }, [h("h3", { text: sec })]);
      bySec[sec].forEach(function (e) {
        var val = h("span", { class: "ed-row-val" });
        var btn = h("button", { type: "button", class: "ed-row", "data-key": e.key }, [h("span", { class: "ed-row-key", text: e.key }), val]);
        btn.addEventListener("click", function () { open(btn, e.key); });
        rows[e.key] = { btn: btn, val: val, entry: e };
        grp.appendChild(btn);
        refreshPanelRow(e.key);
      });
      panelList.appendChild(grp);
    });
    if (!all.length) panelList.appendChild(h("p", { class: "ed-hint", text: "Every text of this page is editable on the page itself." }));
    applyFilter();
  }
  function applyFilter() {
    var q = panelFilter.value.trim().toLowerCase();
    Array.prototype.forEach.call(panelList.querySelectorAll(".ed-panel-sec"), function (sec) {
      var any = false;
      Array.prototype.forEach.call(sec.querySelectorAll(".ed-row"), function (b) {
        var hit = !q || b.getAttribute("data-key").toLowerCase().indexOf(q) >= 0 || (b.getAttribute("data-text") || "").indexOf(q) >= 0;
        b.hidden = !hit;
        if (hit) any = true;
      });
      sec.hidden = !any;
    });
  }
  panelFilter.addEventListener("input", applyFilter);
  panelBtn.addEventListener("click", function () {
    if (!panel.hidden) {
      if (cur && cur.virtual) closePop(false);
      panel.hidden = true;
      panelBtn.setAttribute("aria-expanded", "false");
      return;
    }
    if (!hist.hidden) toggleHistory();
    panel.hidden = false;
    panelBtn.setAttribute("aria-expanded", "true");
    api.registry().then(function (r) { registry = r; return api.content(); }).catch(function () { return null; }).then(function (d) {
      panelDraft = d;
      buildPanel();
    });
  });

  /* ── history ──
     Every publish, newest first (the first one is what the site shows now),
     each with what it changed against the one before. Restore copies that
     revision into the DRAFT, text, pictures and gallery alike (POST
     /api/admin/revisions/:id/restore); nothing goes live until Publish. The
     page then reloads, because the edit page is rendered from the draft on the
     server. /admin/edit/?history opens the panel (the dashboard links there). */
  var hist = h("aside", { id: "ed-history", class: "ed-panel ed-history", "aria-label": "History", hidden: "" });
  var histList = h("div", { class: "ed-panel-list" });
  var histClose = h("button", { type: "button", class: "ed-close", "aria-label": "Close History", text: "×" });
  hist.appendChild(h("div", { class: "ed-panel-head" }, [h("strong", { text: "History" }), h("span", { class: "ed-panel-page", text: "published revisions" }), histClose]));
  hist.appendChild(h("p", { class: "ed-hint", text: "Restore copies a revision into the draft. Publish to make it live." }));
  hist.appendChild(histList);
    function changeLabel(c) { return rowLabel(c, false); }
  function when(iso) {
    var d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function revRow(r, live) {
    var n = r.changed.length;
    var shown = r.changed.slice(0, 4).map(changeLabel).join("; ") + (n > 4 ? ", +" + (n - 4) + " more" : "");
    var btn = h("button", { type: "button", class: "ed-reset", "data-rev": String(r.id), text: "Restore" });
    btn.addEventListener("click", function () { startRestore(r); });
    return h("section", { class: "ed-rev", "data-rev": String(r.id) }, [
      h("div", { class: "ed-rev-head" }, [
        h("strong", { text: "Revision " + r.id }),
        live ? h("span", { class: "ed-rev-live", text: "live" }) : null,
        h("span", { class: "ed-spacer" }),
        btn,
      ].filter(Boolean)),
      h("p", { class: "ed-rev-meta", text: when(r.publishedAt) + " · " + r.by }),
      h("p", { class: "ed-rev-changes", dir: "auto", text: n ? n + (n === 1 ? " change: " : " changes: ") + shown : "No changes" }),
    ]);
  }
  function loadHistory() {
    histList.textContent = "";
    histList.appendChild(h("p", { class: "ed-hint", text: "Loading…" }));
    loadNames().then(function () { return api.revisions(50); }).then(function (list) {
      histList.textContent = "";
      if (!list.length) histList.appendChild(h("p", { class: "ed-hint", text: "Nothing has been published yet." }));
      list.forEach(function (r, i) { histList.appendChild(revRow(r, i === 0)); });
    }, function () {
      histList.textContent = "";
      histList.appendChild(h("p", { class: "ed-hint", text: "Could not load the history. Try again." }));
    });
  }
  function toggleHistory() {
    if (!hist.hidden) {
      hist.hidden = true;
      histBtn.setAttribute("aria-expanded", "false");
      return;
    }
    if (!panel.hidden) panelBtn.click();
    hist.hidden = false;
    histBtn.setAttribute("aria-expanded", "true");
    loadHistory();
  }
  histBtn.addEventListener("click", toggleHistory);
  /* the close button and Esc shut a side panel and hand focus back to its bar button */
  panelClose.addEventListener("click", function () { if (!panel.hidden) panelBtn.click(); panelBtn.focus(); });
  histClose.addEventListener("click", function () { if (!hist.hidden) toggleHistory(); histBtn.focus(); });
  function startRestore(r) {
    settled().then(function (c) {
      var body = [h("p", { text: "This copies revision " + r.id + " into the draft. The live site does not change until you publish." })];
      if (c.changes.length) {
        body.push(h("p", { class: "ed-dialog-note", text: "It replaces the " + c.changes.length + " unpublished " + (c.changes.length === 1 ? "change" : "changes") + " in the draft, gallery included." }));
      }
      openModal("Restore revision " + r.id + "?", body, "Restore", function (msg) {
        return api.restore(r.id).then(function (res) {
          if (res.status === 200) {
            try { localStorage.removeItem(BACKUP); } catch (_) {}
            Object.keys(st).forEach(function (id) { st[id].saved = st[id].value; });
            location.replace(location.pathname + "?restored=" + r.id);
            return true;
          }
          msg.textContent = "Not restored: " + ((res.body && res.body.error) || res.status);
          return true;
        });
      });
    }, function () { toast("Could not read the changes. Try again."); });
  }
  (function fromQuery() {
    var q = new URLSearchParams(location.search);
    if (q.has("history")) toggleHistory();
    var done = q.get("restored");
    if (done) {
      toast("Revision " + done + " is in the draft. Publish to make it live.");
      history.replaceState(null, "", location.pathname);
    }
  })();

  /* ── events ── */
  document.addEventListener("mouseover", function (e) {
    if (cur) return;
    var el = eligible(e.target);
    if (el === hovered) return;
    hovered = el;
    drawOutline(el, false);
  }, true);

  /* A page link in the site's own markup goes to the matching edit page, so
     the editor is never left by following the nav. A link whose own text is
     editable (the nav items) navigates on a plain click and edits on Alt+click;
     while a popover is open every link is inert. */
  function editHref(a) {
    var u;
    try { u = new URL(a.getAttribute("href") || "", document.baseURI); } catch (_) { return null; }
    if (u.origin !== location.origin) return null;
    if (!/^\/(?:index(?:\.html)?|about(?:\.html)?|library(?:\.html)?)?$/.test(u.pathname)) return null;
    var name = u.pathname.replace(/^\/|\.html$/g, "");
    var dest = name === "about" || name === "library" ? "/admin/edit/" + name : "/admin/edit/";
    return dest + u.hash;
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-editor-ui]")) return;
    var link = e.target.closest ? e.target.closest("a[href]") : null;
    if (link && !cur && !e.altKey && link.hasAttribute("data-ek")) {
      var dest = editHref(link);
      if (dest) { e.preventDefault(); e.stopPropagation(); location.href = dest; return; }
    }
    var el = eligible(e.target);
    if (el) {
      e.preventDefault();
      e.stopPropagation();
      if (!cur || cur.el !== el) open(el);
      return;
    }
    /* links stay inert while a popover is open */
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      var to = !cur && editHref(link);
      if (to) location.href = to;
    }
  }, true);

  /* A tap on a phone becomes a click only on a node that answers clicks
     itself or through an ancestor element (iOS Safari / WebKit; the document
     listener above does not count), so a tap on plain text never reached it.
     Every [data-ek] node gets a no-op listener, nodes tagged or re-rendered
     later too. The same function twice is one listener, so re-arming is free;
     on desktop it changes nothing. */
  function tapNoop() {}
  function armTap(n) {
    if (n.nodeType !== 1) return;
    if (n.hasAttribute("data-ek")) n.addEventListener("click", tapNoop);
    if (n.firstElementChild) n.querySelectorAll("[data-ek]").forEach(function (el) { el.addEventListener("click", tapNoop); });
  }
  armTap(document.body);
  new MutationObserver(function (recs) {
    recs.forEach(function (r) {
      if (r.type === "attributes") armTap(r.target);
      else r.addedNodes.forEach(armTap);
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-ek"] });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal) { e.preventDefault(); closeModal(); return; }
    /* the confirm dialog is aria-modal: Tab and Shift+Tab cycle its enabled buttons and never
       reach the page behind (F-20); while both are disabled ("Working…") focus rests on the dialog */
    if (e.key === "Tab" && modal) {
      var box = modal.querySelector(".ed-dialog");
      var stops = [].slice.call(box.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")).filter(function (n) { return !n.disabled; });
      var at = stops.indexOf(document.activeElement);
      e.preventDefault();
      if (!stops.length) { box.setAttribute("tabindex", "-1"); box.focus(); return; }
      stops[at < 0 ? (e.shiftKey ? stops.length - 1 : 0) : (at + (e.shiftKey ? stops.length - 1 : 1)) % stops.length].focus();
      return;
    }
    if (e.key === "Escape" && cur) { e.preventDefault(); closePop(true); return; }
    /* then the side panels; the picture drawer (editor-media.js) answers its own Esc before this runs */
    if (e.key === "Escape" && !panel.hidden) { e.preventDefault(); panelClose.click(); return; }
    if (e.key === "Escape" && !hist.hidden) { e.preventDefault(); histClose.click(); }
  }, true);

  window.addEventListener("scroll", function () { if (cur) place(); else if (hovered) drawOutline(hovered, false); }, true);
  window.addEventListener("resize", function () { if (cur) place(); });

  window.addEventListener("beforeunload", function (e) {
    if (pendingCount()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* values a failed send left in localStorage: put them back on screen and retry */
  (function restoreBackup() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(BACKUP) || "null"); } catch (_) { saved = null; }
    if (!saved) return;
    Object.keys(saved).forEach(function (id) {
      var b = saved[id];
      if (!b || typeof b.value !== "string" || typeof b.key !== "string" || (b.loc !== "ar" && b.loc !== "en")) return;
      var before = edit.read(b.key, b.loc);
      if (typeof before !== "string") before = "";
      if (before === b.value) return;
      edit.apply(b.key, b.loc, b.value);
      queue(b.key, b.loc, b.value, before);
    });
  })();

  document.body.appendChild(outline);
  document.body.appendChild(pop);
  document.body.appendChild(panel);
  document.body.appendChild(hist);
  document.body.appendChild(bar);
  /* the side panels end where the bar starts (the bar wraps to two rows on a phone) */
  if (window.ResizeObserver) new ResizeObserver(function () {
    document.documentElement.style.setProperty("--ed-bar-h", bar.offsetHeight + "px");
  }).observe(bar);
  refreshChanges();
  /* what editor-media.js (the picture drawer) needs from here */
  window.aliphEditorUi = { refreshChanges: refreshChanges, toast: toast, setChip: setChip, bar: bar };
})();
