/* Editor API wrapper (classic script, no build). One place for every call the
   edit-mode overlay makes to /api/admin/*. Exposes window.aliphEditorApi.
   Reads, plus the text writes (PUT/DELETE /api/admin/text). */
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
  function send(method, payload) {
    return fetch("/api/admin/text", {
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
    getJson: getJson,
  };
})();
