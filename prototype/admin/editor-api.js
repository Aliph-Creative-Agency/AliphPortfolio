/* Editor API wrapper (classic script, no build). One place for every call the
   edit-mode overlay makes to /api/admin/*. Exposes window.aliphEditorApi.
   Reads, the text writes (PUT/DELETE /api/admin/text), publish / discard and
   the history (revisions + restore). */
(function () {
  "use strict";

  function getJson(url) {
    return fetch(url, { credentials: "same-origin", headers: { accept: "application/json" } }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  var cache = {};
  function once(name, url) {
    if (!cache[name]) {
      cache[name] = getJson(url).catch(function (e) { delete cache[name]; throw e; });
    }
    return cache[name];
  }

  /* A write never throws on an HTTP answer: it resolves { status, body } so the
     caller can tell 409 (conflict) from 400 (invalid) from 5xx. Only a network
     failure rejects (that is "offline"). */
  function send(method, payload, url) {
    return fetch(url || "/api/admin/text", {
      method: method,
      credentials: "same-origin",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { status: r.status, body: body }; });
    });
  }

  window.aliphEditorApi = {
    saveText: function (key, locale, value, baseRev) { return send("PUT", { key: key, locale: locale, value: value, baseRev: baseRev }); },
    resetText: function (key, locale, baseRev) { return send("DELETE", { key: key, locale: locale, baseRev: baseRev }); },
    /** { text:[{key,page,pages,section,kind,maxLength}], fields, slots }, fetched once. */
    registry: function () { return once("registry", "/api/admin/registry"); },
    /** The draft snapshot with locks; fresh each call (it moves as people save). */
    content: function () { return getJson("/api/admin/content"); },
    whoami: function () { return once("whoami", "/api/admin/whoami"); },
    /** { rev, token, changes:[{section, id, page?, locales?}] } = draft vs live, fresh each call. */
    changes: function () { return getJson("/api/admin/changes"); },
    /** POST with the token from changes(): 200 {rev, publishedAt, changed}, 409 stale / nothing to publish. */
    publish: function (token) { return send("POST", { token: token }, "/api/admin/publish"); },
    /** POST with the token from changes(): 200 {discarded} (text + slot drafts back to live), 409 stale. */
    discard: function (token) { return send("POST", { token: token }, "/api/admin/discard"); },
    /** [{id, publishedAt, by, changed}], newest first (the first is live). */
    revisions: function (limit) { return getJson("/api/admin/revisions?limit=" + (limit || 50)); },
    /** POST: 200 {restored, skipped} = that revision copied into the draft, 404 unknown id. */
    restore: function (id) { return send("POST", {}, "/api/admin/revisions/" + encodeURIComponent(id) + "/restore"); },
    /** PUT a slot override (value null resets). 200 {slot,value,rev}, 409 {error,current:{value,rev}}. */
    saveSlot: function (slot, value, baseRev) { return send("PUT", { slot: slot, value: value, baseRev: baseRev }, "/api/admin/slot"); },
    /** DELETE: the draft of this slot goes back to the markup default. */
    resetSlot: function (slot, baseRev) {
      return fetch("/api/admin/slot?slot=" + encodeURIComponent(slot) + "&baseRev=" + baseRev, {
        method: "DELETE", credentials: "same-origin", headers: { accept: "application/json" },
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) { return { status: r.status, body: body }; });
      });
    },
    getJson: getJson,
  };
})();
