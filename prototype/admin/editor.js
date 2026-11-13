/* Edit-mode overlay (classic script, no build). Loaded only by the /admin/edit/*
   pages, after main.js has run its EDIT MODE HOOKS (window.aliphEdit).
   What it adds: a slim bar at the bottom edge (page switcher, AR/EN toggle,
   status chip), a hover outline on [data-ek] text, and a click popover with
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
  var bar = h("div", { class: "ed-bar", role: "toolbar", "aria-label": "Page editor" }, [
    h("span", { class: "ed-brand", text: "Aliph editor" }),
    h("div", { class: "ed-pages" }, pageLinks),
    langBtn,
    h("span", { class: "ed-spacer" }),
    chip,
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
    if (loc === edit.lang && !el.children.length && el.textContent !== value) el.textContent = value;
    if (cur.rich) el.classList.add("ed-rich");
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
    var r = cur.el.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var pw = pop.offsetWidth, ph = pop.offsetHeight, bottomBar = bar.offsetHeight + 8;
    var top = r.bottom + 10;
    if (top + ph > vh - bottomBar) top = r.top - ph - 10;
    if (top < 8) top = Math.max(8, vh - bottomBar - ph);
    var left = Math.min(Math.max(8, r.left), Math.max(8, vw - pw - 8));
    pop.style.top = top + "px";
    pop.style.left = left + "px";
    drawOutline(cur.el, true);
  }

  function field(loc, label) {
    var area = h("textarea", { rows: cur.rich ? "5" : "3", "data-loc": loc, "aria-label": label, dir: loc === "ar" ? "rtl" : "ltr", lang: loc });
    var count = h("span", { class: "ed-count" });
    cur.area[loc] = area;
    cur.count[loc] = count;
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

  function open(el) {
    if (cur) closePop(false);
    var key = el.dataset.ek;
    var entry = entryOf(key);
    cur = { el: el, key: key, orig: {}, area: {}, count: {}, max: entry && entry.maxLength || 0, auto: el.hasAttribute("data-ek-auto"), rich: !!entry && entry.kind === "richline" };
    LOCALES.forEach(function (l) { cur.orig[l] = origOf(key, l, null); });
    pop.textContent = "";
    var cancel = h("button", { type: "button", text: "Cancel" });
    var done = h("button", { type: "button", class: "is-primary", text: "Done" });
    cancel.addEventListener("click", function () { closePop(true); });
    done.addEventListener("click", function () { closePop(false); });
    [
      h("div", { class: "ed-pop-head" }, [
        h("span", { class: "ed-pop-key", text: key }),
        h("span", { class: "ed-pop-sec", text: entry && entry.section || "" }),
      ]),
      field("ar", "Arabic"),
      field("en", "English"),
      h("p", { class: "ed-hint", text: (cur.rich ? "Enter makes a line break. " : "") + "Saved as a draft while you type. Esc puts back the text from when you opened this." }),
      h("div", { class: "ed-pop-actions" }, [cancel, done]),
    ].forEach(function (n) { pop.appendChild(n); });
    LOCALES.forEach(function (l) { cur.area[l].value = cur.orig[l]; updateCount(l); });
    pop.hidden = false;
    place();
    /* the draft may hold a newer value than the tables if someone saved since load */
    var mine = cur;
    api.content().then(function (draft) {
      if (cur !== mine) return;
      LOCALES.forEach(function (l) {
        if (mine.area[l].value !== mine.orig[l]) return; /* already typing */
        var v = origOf(mine.key, l, draft);
        if (v !== mine.orig[l]) { mine.orig[l] = v; mine.area[l].value = v; updateCount(l); }
      });
    }).catch(function () {});
    var first = cur.area[edit.lang === "en" ? "en" : "ar"];
    first.focus();
    first.setSelectionRange(first.value.length, first.value.length);
  }

  function closePop(restore) {
    if (!cur) return;
    if (restore) LOCALES.forEach(function (l) { preview(l, cur.orig[l]); });
    pop.hidden = true;
    outline.classList.remove("is-on", "is-active");
    var el = cur.el;
    cur = null;
    hovered = null;
    if (el.isConnected) edit.tag();
  }

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

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cur) { e.preventDefault(); closePop(true); }
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
  document.body.appendChild(bar);
})();
