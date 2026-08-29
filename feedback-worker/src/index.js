/**
 * Aliph client-feedback backend — Cloudflare Worker.
 *
 * Serves the static form from ./public (the assets binding) and exposes one
 * JSON endpoint backed by a Google Sheet:
 *
 *   POST /api/feedback  → validate, then append a row to the sheet
 *
 * Required configuration:
 *   secrets : SHEET_ID                — the Google Sheet ID (from its URL)
 *             GOOGLE_SA_EMAIL         — service account email
 *             GOOGLE_SA_PRIVATE_KEY   — service account private key (PEM, PKCS#8)
 *
 * ⚠️ THIS IS A THIRD DEPLOYABLE, not a change to the site. The portfolio at
 * ../wrangler.toml is an assets-only Worker with no `main`, and its own header
 * says to keep it that way; ../chat-worker is the second. Putting an API on
 * the site would mean giving the site a script, which is a much bigger change
 * to a live thing than standing a small Worker up beside it. See SETUP.md for
 * how to hang this off a subdomain or off a path on the main domain — both
 * are routing, and neither touches the site's own deploy.
 *
 * The auth and append path below is lifted, deliberately, from the Queen's
 * Retreat Worker (D:\Personal\Projects\عودة الملكة-landing page\src\worker.js).
 * It is a service-account JWT signed with WebCrypto and exchanged for an OAuth
 * token — no dependencies, nothing to keep updated, and it is the code the
 * agency has already had in production since July.
 */

/* ------------------------------------------------------------------ */
/* The form's own vocabulary                                           */
/* ------------------------------------------------------------------ */

/* ⚠️ These ids are the CONTRACT with public/app.js, and the Arabic on the
   right is what lands in the Sheet. The agency reads the Sheet in Arabic, so
   the row is written in Arabic whichever language the visitor filled in — the
   language they used is its own column instead. */
const SERVICES = {
  design: "تصميم جرافيكي",
  photo: "صناعة محتوى",
  tech: "حلول تقنية وبرمجية",
  other: "أخرى",
};

const COMMS = {
  clear: "واضح وسلس",
  organised: "جيد لكن يحتاج تنظيمًا أكثر",
  unexpected: "لم يكن كما توقّعت",
  other: "أخرى",
};

const VALUE = {
  yes: "نعم، تمامًا",
  somewhat: "إلى حدٍّ ما",
  no: "لا",
  other: "أخرى",
};

const VISION = {
  yes: "نعم، تمامًا",
  partly: "إلى حدٍّ ما",
  no: "لا، ليس كما توقّعت",
  other: "أخرى",
};

const SHEET_HEADER = [
  "التاريخ والوقت",
  "الاسم أو المؤسسة",
  "الخدمة",
  "أسلوب التواصل",
  "قيمة الخدمة",
  "أكثر ما أعجبهم",
  "انعكاس الرؤية",
  "التقييم العام",
  "ما يمكن تحسينه",
  "لغة النموذج",
];

/* Length caps. A public endpoint that writes to someone else's spreadsheet has
   to bound what it will write — an unbounded free-text field is a way to put a
   megabyte into a cell. These are generous for a real answer and useless for
   an attack. */
const MAX = { name: 120, text: 2000, other: 120 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/feedback") {
      if (request.method !== "POST") {
        return json(405, { ok: false, error: "method_not_allowed" });
      }
      try {
        return await handleFeedback(request, env);
      } catch (err) {
        console.error("feedback error:", err.stack || err.message || err);
        return json(500, {
          ok: false,
          error: "server_error",
          message: {
            ar: "حدث خطأ غير متوقّع. حاول مرّة أخرى، أو راسلنا مباشرة.",
            en: "Something went wrong. Please try again, or write to us directly.",
          },
        });
      }
    }

    /* Everything else is the static form. env.ASSETS is the binding declared in
       wrangler.toml; a Worker with a `main` has to hand assets over itself. */
    return env.ASSETS.fetch(request);
  },
};

/* ------------------------------------------------------------------ */
/* The endpoint                                                        */
/* ------------------------------------------------------------------ */

async function handleFeedback(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad("bad_json", {
      ar: "تعذّرت قراءة النموذج.",
      en: "The form could not be read.",
    });
  }

  /* 🔴 THE HONEYPOT IS FIRST AND IT ANSWERS `ok`. `company_website` is a real
     input in the markup, positioned off screen and marked aria-hidden and
     tabindex="-1", so nothing a person uses can reach it — a bot filling every
     field it finds will. Answering 200 rather than an error is the whole
     point: a rejection tells the sender what tripped, and the next attempt
     comes back without it. This one silently goes nowhere. */
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return json(200, { ok: true });
  }

  /* ⚠️ And a floor on how fast the form can be completed. `elapsed` is set by
     app.js from the moment the page loaded. A person reading eight questions
     takes longer than this; a script posting straight at the endpoint sends 0
     or nothing at all. It is a speed bump, not a gate — see SETUP.md on
     Turnstile, which is the real answer if this ever gets abused. */
  const elapsed = Number(body.elapsed);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 4000) {
    return bad("too_fast", {
      ar: "تمّ الإرسال بسرعة غير متوقّعة. أعد المحاولة من فضلك.",
      en: "That came through faster than expected. Please try again.",
    });
  }

  const lang = body.lang === "en" ? "en" : "ar";

  const name = clean(body.name, MAX.name);
  if (!name) return missing("name", lang);

  /* The services question is the only multi-select on the form. */
  const picked = Array.isArray(body.services) ? body.services : [];
  const services = picked.filter((s) => Object.hasOwn(SERVICES, s));
  if (!services.length) return missing("services", lang);

  const comms = COMMS[body.comms] ? body.comms : null;
  if (!comms) return missing("comms", lang);

  const value = VALUE[body.value] ? body.value : null;
  if (!value) return missing("value", lang);

  const liked = clean(body.liked, MAX.text);
  if (!liked) return missing("liked", lang);

  const vision = VISION[body.vision] ? body.vision : null;
  if (!vision) return missing("vision", lang);

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return missing("rating", lang);
  }

  const improve = clean(body.improve, MAX.text);
  if (!improve) return missing("improve", lang);

  /* «أخرى» is a real answer only when something was typed beside it. The label
     alone in a cell tells the agency nothing they did not already know. */
  const withOther = (label, id, note) => {
    const extra = clean(note, MAX.other);
    return id === "other" && extra ? `${label}: ${extra}` : label;
  };

  const servicesCell = services
    .map((id) =>
      id === "other"
        ? withOther(SERVICES.other, "other", body.servicesOther)
        : SERVICES[id]
    )
    .join("، ");

  const row = [
    stamp(),
    name,
    servicesCell,
    withOther(COMMS[comms], comms, body.commsOther),
    withOther(VALUE[value], value, body.valueOther),
    liked,
    withOther(VISION[vision], vision, body.visionOther),
    /* Plain 1-5, not «٤/٥» and not stars: this column is meant to be averaged
       and sorted in the Sheet, and a Sheet cannot average a string. */
    String(rating),
    improve,
    lang === "en" ? "English" : "العربية",
  ];

  await appendRow(env, row);

  return json(200, { ok: true });
}

/* ------------------------------------------------------------------ */
/* Google Sheets                                                       */
/* ------------------------------------------------------------------ */

/* The header is written once, on the first submission the sheet ever sees, so
   there is no setup step that can be forgotten and no empty-looking Sheet to
   wonder about. Checked per append, which is one cheap read against a form
   that is submitted a handful of times a month. */
async function ensureHeader(env, token) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values/${encodeURIComponent("A1:J1")}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Sheets read failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  if (data.values && data.values.length) return;

  const put = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values/${encodeURIComponent("A1:J1")}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [SHEET_HEADER] }),
    }
  );
  if (!put.ok) {
    throw new Error(`Sheets header write failed: ${put.status} ${await put.text()}`);
  }
}

async function appendRow(env, row) {
  const token = await getAccessToken(env);
  await ensureHeader(env, token);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}/values/${encodeURIComponent("A1:J1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) {
    throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`);
  }
}

/* ------------------------------------------------------------------ */
/* Google service-account auth (JWT → OAuth token, no dependencies)    */
/* ------------------------------------------------------------------ */

let tokenCache = { token: null, exp: 0 };

async function getAccessToken(env) {
  if (!env.SHEET_ID || !env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) {
    throw new Error(
      "Missing configuration: SHEET_ID, GOOGLE_SA_EMAIL and GOOGLE_SA_PRIVATE_KEY secrets must be set."
    );
  }
  if (tokenCache.token && Date.now() < tokenCache.exp - 60_000) {
    return tokenCache.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: env.GOOGLE_SA_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claims}`;

  const key = await importPrivateKey(env.GOOGLE_SA_PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${b64urlBytes(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=" +
      encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") +
      "&assertion=" +
      jwt,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

async function importPrivateKey(pem) {
  // Secrets pasted through dashboards sometimes carry literal "\n".
  const normalized = pem.replace(/\\n/g, "\n");
  const b64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function clean(value, max) {
  if (typeof value !== "string") return "";
  /* Collapse the runs of blank lines a paste can carry, then cap. */
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

/* ⚠️ The agency is in Jerusalem and reads this Sheet there. A UTC stamp is off
   by two or three hours depending on the season, which is exactly enough to
   put an evening submission on the wrong day. */
function stamp() {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

function missing(field, lang) {
  return bad("missing_field", {
    ar: "من فضلك أكمل الحقول المطلوبة.",
    en: "Please complete the required fields.",
  }, { field, lang });
}

function bad(error, message, extra = {}) {
  return json(400, { ok: false, error, message, ...extra });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function b64url(str) {
  return b64urlBytes(new TextEncoder().encode(str));
}

function b64urlBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
