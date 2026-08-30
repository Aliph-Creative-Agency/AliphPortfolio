/**
 * Aliph client-feedback — the Google Sheet writer.
 *
 * ══════════════════════════════════════════════════════════════════
 * 🔴 WHY THIS EXISTS AT ALL, instead of the service account the rest of this
 * repo uses.
 *
 * The chat and Queen's Retreat both write to Sheets with a service-account JWT
 * signed in the Worker. That needs a downloadable key, and the agency's Google
 * Workspace org enforces BOTH of Google's Secure-by-Default constraints:
 *
 *   iam.managed.disableServiceAccountKeyCreation   (blocks Create new key)
 *   iam.disableServiceAccountKeyUpload             (blocks Upload existing key)
 *
 * ⚠️ They are SEPARATE constraints and the first one's condition is narrow —
 * it denies only `keyOrigin == 'GOOGLE_PROVIDED'`, which reads like uploading
 * your own public key is a way through. It is not; the second constraint
 * closes that door. Exempting the project needs `roles/orgpolicy.policyAdmin`,
 * which nobody at the agency holds.
 *
 * A bound Apps Script sidesteps all of it: it runs AS the sheet's owner, so
 * there is no robot identity, no key, and no Cloud project for a policy to
 * apply to.
 *
 * ✅ If an org policy admin ever appears, the service-account path is strictly
 * better and this file can be deleted — see SETUP.md.
 * ══════════════════════════════════════════════════════════════════
 *
 * Deployed as a web app: Execute as ME, access ANYONE. "Anyone" is what lets
 * an unauthenticated Worker reach it, so the URL is a capability — anything
 * holding it can POST here. That is what TOKEN below is for.
 *
 * Expects: POST application/json
 *   { token: "<shared secret>", header: [...], row: [...] }
 *
 * 🔴 Apps Script CANNOT set an HTTP status code. Every response is 200,
 * including the failures. The Worker MUST branch on the `ok` field in the body
 * and never on `res.status` — a 200 here means "the script ran", not "the row
 * was written".
 */

/** Set in Project Settings → Script properties. Never hard-code it here: this
 *  file is committed. */
function token_() {
  return PropertiesService.getScriptProperties().getProperty("TOKEN");
}

function doPost(e) {
  try {
    var expected = token_();
    if (!expected) return reply_({ ok: false, error: "not_configured" });

    if (!e || !e.postData || !e.postData.contents) {
      return reply_({ ok: false, error: "empty_body" });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return reply_({ ok: false, error: "bad_json" });
    }

    if (!body || typeof body.token !== "string" || !equals_(body.token, expected)) {
      return reply_({ ok: false, error: "forbidden" });
    }
    if (!Array.isArray(body.row) || !body.row.length) {
      return reply_({ ok: false, error: "bad_row" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // ⚠️ Two submissions landing together would otherwise both read
    // getLastRow() as 0 and both write a header. A script lock is the only
    // thing serialising this — appendRow on its own is not enough.
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (sheet.getLastRow() === 0 && Array.isArray(body.header) && body.header.length) {
        sheet.appendRow(body.header);
      }
      sheet.appendRow(body.row);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return reply_({ ok: true });
  } catch (err) {
    // The message is returned so the Worker can log it. Nothing here is
    // reachable without the token, so it cannot leak to a stranger.
    return reply_({ ok: false, error: "script_error", detail: String(err) });
  }
}

/** A GET is almost always a person pasting the URL into a browser. Say nothing
 *  useful — this endpoint's existence is not a secret, but its shape is. */
function doGet() {
  return reply_({ ok: false, error: "post_only" });
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Length-independent compare. Apps Script has no timing-safe primitive; this
 *  at least does not return early on the first differing character. */
function equals_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
