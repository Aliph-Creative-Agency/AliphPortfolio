/* Editor API wrapper (classic script, no build). One place for every call the
   edit-mode overlay makes to /api/admin/*. Exposes window.aliphEditorApi.
   Reads here; the write calls (PUT/DELETE text) arrive with autosave (E-05). */
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

  window.aliphEditorApi = {
    /** { text:[{key,page,pages,section,kind,maxLength}], fields, slots }, fetched once. */
    registry: function () { return once("registry", "/api/admin/registry"); },
    /** The draft snapshot with locks; fresh each call (it moves as people save). */
    content: function () { return getJson("/api/admin/content"); },
    whoami: function () { return once("whoami", "/api/admin/whoami"); },
    getJson: getJson,
  };
})();
