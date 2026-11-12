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
    setTimeout(syncLang, 60);
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
    var el = cur.el;
    /* a line with element children (ransom chips) is rebuilt by apply: follow it to its new node */
    if (!el.isConnected) {
      el = document.querySelector('[data-ek="' + cur.key + '"]');
      if (!el) return;
      cur.el = el;
    }
    if (!el.hasAttribute("data-ek")) { el.setAttribute("data-ek", cur.key); if (cur.auto) el.setAttribute("data-ek-auto", ""); }
    if (loc === edit.lang && !el.children.length && el.textContent !== value) el.textContent = value;
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
    var area = h("textarea", { rows: "3", "data-loc": loc, "aria-label": label, dir: loc === "ar" ? "rtl" : "ltr", lang: loc });
    var count = h("span", { class: "ed-count" });
    cur.area[loc] = area;
    cur.count[loc] = count;
    area.addEventListener("input", function () {
      updateCount(loc);
      preview(loc, area.value);
      place();
    });
    return h("label", { class: "ed-field" }, [
      h("span", { class: "ed-field-top" }, [h("span", { text: label }), count]),
      area,
    ]);
  }

  function open(el) {
    if (cur) closePop(false);
    var key = el.dataset.ek;
    var entry = entryOf(key);
    cur = { el: el, key: key, orig: {}, area: {}, count: {}, max: entry && entry.maxLength || 0, auto: el.hasAttribute("data-ek-auto") };
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
      h("p", { class: "ed-hint", text: "Preview only, not saved yet. Esc restores both languages." }),
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

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-editor-ui]")) return;
    var el = eligible(e.target);
    if (el) {
      e.preventDefault();
      e.stopPropagation();
      if (!cur || cur.el !== el) open(el);
      return;
    }
    /* links stay inert while a popover is open */
    if (cur && e.target.closest && e.target.closest("a")) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && cur) { e.preventDefault(); closePop(true); }
  }, true);

  window.addEventListener("scroll", function () { if (cur) place(); else if (hovered) drawOutline(hovered, false); }, true);
  window.addEventListener("resize", function () { if (cur) place(); });

  document.body.appendChild(outline);
  document.body.appendChild(pop);
  document.body.appendChild(bar);
})();
