/* ══════════════════════════════════════════════════════════════════
   Aliph client-feedback form.

   Three jobs: the language toggle, the «أخرى» fields that appear when they
   are chosen, and the submit. Nothing here validates for real — the Worker
   does that, because a check that runs in the visitor's browser is a courtesy
   and not a guarantee. What runs here is the same check run early, so nobody
   is told about a missing answer by a round trip.
   ══════════════════════════════════════════════════════════════════ */

/* ── the two languages ────────────────────────────────────────── */

const T = {
  title:    { ar: "كيف كانت تجربتك معنا؟", en: "How was your experience with us?" },
  lede:     { ar: "شكرًا لاختيارك العمل مع ألِف. يهمّنا أن نسمع رأيك الصادق، لأن ملاحظاتك هي ما نبني عليه الخدمة القادمة.",
              en: "Thank you for choosing to work with Aliph. We would like to hear what you honestly thought — your feedback is what we build the next piece of work on." },
  meta:     { ar: "ثماني أسئلة، أقل من ثلاث دقائق.", en: "Eight questions, under three minutes." },

  qName:    { ar: "الاسم أو المؤسسة", en: "Name or company" },
  qService: { ar: "ما الخدمة التي حصلت عليها؟", en: "Which service did you receive?" },
  hintMulti:{ ar: "يمكنك اختيار أكثر من واحدة", en: "You can pick more than one" },
  svcDesign:{ ar: "تصميم جرافيكي", en: "Graphic design" },
  svcPhoto: { ar: "صناعة محتوى", en: "Media production" },
  svcTech:  { ar: "حلول تقنية وبرمجية", en: "Tech & software solutions" },
  optOther: { ar: "أخرى", en: "Other" },
  phOther:  { ar: "اكتبها هنا", en: "Tell us which" },

  qComms:   { ar: "كيف تصف أسلوب التواصل والتعامل أثناء المشروع؟",
              en: "How would you describe the communication and collaboration during the project?" },
  commsClear:{ ar: "واضح وسلس", en: "Clear and smooth" },
  commsOrg: { ar: "جيد لكن يحتاج تنظيمًا أكثر", en: "Good, but could be better organised" },
  commsUnexp:{ ar: "لم يكن كما توقّعت", en: "Not what I expected" },

  qValue:   { ar: "هل شعرت أن الخدمة كانت تستحق قيمتها؟",
              en: "Did the service feel worth what it cost?" },
  valYes:   { ar: "نعم، تمامًا", en: "Yes, completely" },
  valSome:  { ar: "إلى حدٍّ ما", en: "Somewhat" },
  valNo:    { ar: "لا", en: "No" },

  qLiked:   { ar: "ما أكثر شيء أعجبك في تجربتك معنا؟",
              en: "What did you like most about working with us?" },

  qVision:  { ar: "هل عكست النتيجة النهائية رؤيتك وهويّتك؟",
              en: "Did the final result reflect your vision and identity?" },
  visYes:   { ar: "نعم، تمامًا", en: "Yes, completely" },
  visPart:  { ar: "إلى حدٍّ ما", en: "Partly" },
  visNo:    { ar: "لا، ليس كما توقّعت", en: "Not really" },

  qRating:  { ar: "كيف تقيّم تجربتك العامة معنا؟", en: "How would you rate the experience overall?" },
  rate1:    { ar: "١ من ٥", en: "1 of 5" },
  rate2:    { ar: "٢ من ٥", en: "2 of 5" },
  rate3:    { ar: "٣ من ٥", en: "3 of 5" },
  rate4:    { ar: "٤ من ٥", en: "4 of 5" },
  rate5:    { ar: "٥ من ٥", en: "5 of 5" },

  qImprove: { ar: "ما الذي يمكن تحسينه برأيك؟", en: "What could we do better?" },

  send:     { ar: "أرسل", en: "Send" },
  sending:  { ar: "جارٍ الإرسال…", en: "Sending…" },

  logoHome: { ar: "ألِف — الموقع", en: "Aliph — website" },

  errRequired: { ar: "هذا الحقل مطلوب.", en: "This one is required." },
  errPick:     { ar: "اختر إجابة.", en: "Please pick an answer." },
  errPickOne:  { ar: "اختر خدمة واحدة على الأقل.", en: "Please pick at least one." },
  errRating:   { ar: "اختر تقييمًا من ١ إلى ٥.", en: "Please choose a rating from 1 to 5." },
  errNetwork:  { ar: "تعذّر الإرسال. تحقّق من اتصالك وحاول مرّة أخرى.",
                 en: "That did not send. Check your connection and try again." },

  notReady: { ar: "هذا النموذج لا يستقبل الردود بعد. سنفتحه قريبًا — أو راسلنا مباشرة.",
              en: "This form is not accepting responses yet. It will open shortly — or write to us directly." },

  doneTitle: { ar: "وصلَنا رأيك.", en: "We have it." },
  doneText:  { ar: "شكرًا لوقتك ولثقتك. ملاحظاتك هي ما يجعل العمل القادم أفضل من الذي قبله.",
               en: "Thank you for your time and your trust. Your feedback is what makes the next piece of work better than the last." },
  doneLink:  { ar: "إلى موقع ألِف", en: "Go to aliphcreative.com" },
  legal:     { ar: "ألِف © ٢٠٢٦", en: "Aliph © 2026" },

  pageTitle: { ar: "كيف كانت تجربتك معنا؟ — ألِف", en: "How was your experience with us? — Aliph" },
};

/* ⚠️ The same key the main site uses, and that is deliberate: a client who has
   already put aliphcreative.com into English should not have to say so again
   here. localStorage is per-origin, so it only carries over once this Worker
   is served from a path on aliphcreative.com rather than its own subdomain —
   see SETUP.md. On its own origin it simply starts at Arabic, which is right. */
const LANG_KEY = "aliph-lang";

let lang = "ar";
try {
  if (localStorage.getItem(LANG_KEY) === "en") lang = "en";
} catch {
  /* Safari in private mode throws on localStorage rather than returning null.
     A form that will not render because it could not read a preference is a
     worse failure than a form that opens in Arabic. */
}

function applyLang() {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = T.pageTitle[lang];

  document.querySelectorAll("[data-t]").forEach((el) => {
    const entry = T[el.dataset.t];
    if (entry) el.textContent = entry[lang];
  });
  document.querySelectorAll("[data-t-label]").forEach((el) => {
    const entry = T[el.dataset.tLabel];
    if (entry) el.setAttribute("aria-label", entry[lang]);
  });
  document.querySelectorAll("[data-t-ph]").forEach((el) => {
    const entry = T[el.dataset.tPh];
    if (entry) el.placeholder = entry[lang];
  });

  /* Anything already on screen has to be restated, not left in the language it
     was written in: the rating read-out and any error still showing. */
  paintRating();
  document.querySelectorAll(".err:not([hidden])").forEach((el) => {
    if (el.dataset.key) el.textContent = T[el.dataset.key][lang];
  });
  const fe = document.getElementById("formErr");
  if (!fe.hidden && fe.dataset.key) fe.textContent = T[fe.dataset.key][lang];
}

document.querySelector(".js-lang").addEventListener("click", toggleLang);
document.querySelector(".js-lang").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleLang(); }
});

function toggleLang() {
  lang = lang === "ar" ? "en" : "ar";
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* see above */ }
  applyLang();
}

/* ── «أخرى» reveals its own field ─────────────────────────────── */

/* Delegated, so it covers the checkbox group and the three radio groups with
   one listener and no per-group wiring. The field is `hidden` rather than
   removed: a visitor who picks Other, types, then changes their mind and picks
   it again should find what they wrote still there. */
document.getElementById("feedbackForm").addEventListener("change", (e) => {
  const input = e.target;
  if (!input.name) return;
  const set = input.closest("fieldset");
  if (!set) return;
  const other = set.querySelector(".field-other");
  if (!other) return;

  const chosen = [...set.querySelectorAll('input[value="other"]')].some((i) => i.checked);
  other.hidden = !chosen;
  if (chosen && input.value === "other" && input.checked) other.focus();
});

/* ── the rating reads itself out ──────────────────────────────── */

const ratingRead = document.getElementById("ratingRead");

function paintRating() {
  const on = document.querySelector('input[name="rating"]:checked');
  ratingRead.textContent = on ? T["rate" + on.value][lang] : "";
}
document.getElementById("rating").addEventListener("change", paintRating);

/* ── validation, and the submit ───────────────────────────────── */

const form = document.getElementById("feedbackForm");
const formErr = document.getElementById("formErr");
const submitBtn = document.getElementById("submitBtn");
const loadedAt = Date.now();

function showErr(field, key) {
  const el = form.querySelector(`[data-err="${field}"]`);
  if (!el) return;
  el.dataset.key = key;
  el.textContent = T[key][lang];
  el.hidden = false;
}

function clearErrs() {
  form.querySelectorAll(".err").forEach((el) => { el.hidden = true; });
  formErr.hidden = true;
}

/* Returns the payload, or null having marked up what is missing. The order
   matters: the FIRST thing missing is the one that gets focus, so a visitor is
   taken to the top of the problem rather than the bottom of it. */
function collect() {
  clearErrs();
  const data = new FormData(form);
  const problems = [];

  const name = (data.get("name") || "").toString().trim();
  if (!name) problems.push(["name", "errRequired", "#name"]);

  const services = data.getAll("services");
  if (!services.length) problems.push(["services", "errPickOne", 'input[name="services"]']);

  const comms = data.get("comms");
  if (!comms) problems.push(["comms", "errPick", 'input[name="comms"]']);

  const value = data.get("value");
  if (!value) problems.push(["value", "errPick", 'input[name="value"]']);

  const liked = (data.get("liked") || "").toString().trim();
  if (!liked) problems.push(["liked", "errRequired", "#liked"]);

  const vision = data.get("vision");
  if (!vision) problems.push(["vision", "errPick", 'input[name="vision"]']);

  const rating = data.get("rating");
  if (!rating) problems.push(["rating", "errRating", 'input[name="rating"]']);

  const improve = (data.get("improve") || "").toString().trim();
  if (!improve) problems.push(["improve", "errRequired", "#improve"]);

  if (problems.length) {
    problems.forEach(([field, key]) => showErr(field, key));
    const first = form.querySelector(problems[0][2]);
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return null;
  }

  return {
    name,
    services,
    servicesOther: (data.get("servicesOther") || "").toString().trim(),
    comms,
    commsOther: (data.get("commsOther") || "").toString().trim(),
    value,
    valueOther: (data.get("valueOther") || "").toString().trim(),
    liked,
    vision,
    visionOther: (data.get("visionOther") || "").toString().trim(),
    rating: Number(rating),
    improve,
    lang,
    company_website: (data.get("company_website") || "").toString(),
    elapsed: Date.now() - loadedAt,
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = collect();
  if (!payload) return;

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = T.sending[lang];

  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok || !body.ok) {
      /* The Worker sends its messages as {ar, en} so the page can show the one
         the visitor is reading, rather than whichever the server felt like. */
      formErr.textContent = (body.message && body.message[lang]) || T.errNetwork[lang];
      formErr.dataset.key = body.message ? "" : "errNetwork";
      formErr.hidden = false;
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = T.send[lang];
      return;
    }

    /* Done. The questions go — the form, the intro that asked them and the
       rules between the two — and the card arrives in their place. Focus moves
       to it, or a keyboard visitor is left standing on a button that no longer
       exists and nothing announces that anything happened. */
    form.hidden = true;
    document.querySelector(".intro").hidden = true;
    document.querySelectorAll(".sheet > .splitter").forEach((el) => { el.hidden = true; });
    const done = document.getElementById("done");
    done.hidden = false;
    done.setAttribute("tabindex", "-1");
    done.focus({ preventScroll: true });
    done.scrollIntoView({ block: "center", behavior: "smooth" });
  } catch {
    formErr.textContent = T.errNetwork[lang];
    formErr.dataset.key = "errNetwork";
    formErr.hidden = false;
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = T.send[lang];
  }
});

applyLang();

/* ── is there a Sheet behind this yet? ────────────────────────── */

/* 🔴 The Worker has to be deployed before `wrangler secret put` will take a
   secret for it, so "live at a real address with nowhere to write" is a real
   state and not a hypothetical one. Asking on load costs one small request and
   is what stops a client writing eight answers into nothing.

   ⚠️ Fails OPEN. If the check itself cannot be reached — offline, a blip — the
   form stays usable: the Worker refuses the submission with its own message
   anyway, and a form disabled because a status probe failed is a form that is
   broken for everyone whenever anything twitches. */
(async () => {
  try {
    const res = await fetch("/api/status", { cache: "no-store" });
    const body = await res.json();
    if (body && body.ready === false) {
      document.getElementById("notReady").hidden = false;
      submitBtn.disabled = true;
      /* [disabled] alone reads as "not yet" to a mouse and as nothing at all to
         anyone who cannot see the banner sitting above the questions. */
      submitBtn.setAttribute("aria-describedby", "notReady");
    }
  } catch {
    /* see above — fail open */
  }
})();
