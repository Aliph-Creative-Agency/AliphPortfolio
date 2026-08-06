/* ══════════════════════════════════════════════════════════════════
   GUARDRAILS — plan §5, "in code first, prompt second."

   Everything here is a pure function of text. No fetch, no env, no
   Worker globals — so it runs under plain `node --test` and can be
   reasoned about without a model, a key, or a deployment.

   Three jobs:
     · PRE-FILTER   (pricing, jailbreak, size)  — runs BEFORE the model,
                     so a blocked message costs zero quota.
     · DIRECTIVES   derived from the transcript — the "one clarifying
                     question max" counter (plan §5 rule 5).
     · POST-FILTER  on model output — the feasibility ban (rule 6),
                     leaked prices, and the length cap (rule 2).

   ⚠️ Two design notes worth keeping:
   1. The bans are curated PHRASE lists, not broad patterns. A pattern
      like /we can\b/ also swallows "we can put you in touch with the
      team" — the one sentence this bot exists to say. Precision beats
      coverage here; the prompt is the second line of defence.
   2. Describing a service in general ("we do visual identities") is
      NOT a feasibility read and must stay allowed — job #1 in plan §9
      is answering simple questions about the four services. Only
      capability or commitment *about the visitor's project* is banned.
   ══════════════════════════════════════════════════════════════════ */

import { SERVICES } from "./services.js";

/* ── normalisation ────────────────────────────────────────────────
   Arabic is written with optional marks and several spellings of the
   same letter, so matching raw text misses more than it catches.
   Fold: tashkeel, tatweel, alef/ya/ta-marbuta variants, Arabic-Indic
   digits. `ة → ه` is what makes تكلفة and تكلفه one string. */
const AR_MARKS = /[ً-ْٰـ]/g;
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function norm(input) {
  return String(input == null ? "" : input)
    .toLowerCase()
    .replace(AR_MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[‏‎]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words, Unicode-aware. `\b` is useless here — JS word boundaries are
    ASCII, so every Arabic letter reads as a non-word character. */
export function tokens(text) {
  const out = [];
  for (const raw of norm(text).split(/[^\p{L}\p{N}]+/u)) {
    if (!raw) continue;
    out.push(raw);
    /* Arabic glues conjunctions and articles onto the word, so the bare
       form has to be offered too — otherwise "والسعر" never matches
       "سعر".
       ⚠️ Strip only the conjunction and the ARTICLE. A chain of
       optional single letters (و ب ك ل ال) is greedy and eats real
       ones: it turns "وكم" into "م". The article forms are
       unambiguous; a bare preposition is not. */
    for (const v of [raw, raw.replace(/^[وف]/u, "")]) {
      const bare = v.replace(/^(?:وال|بال|كال|فال|لل|ال)/u, "");
      if (bare.length > 1 && bare !== raw) out.push(bare);
      if (v.length > 1 && v !== raw) out.push(v);
    }
  }
  return [...new Set(out)];
}

/** Arabic-script text present? Decides the language when the client
    doesn't say, and it is the only signal that survives a mixed reply. */
export const hasArabic = (text) => /[؀-ۿ]/.test(String(text || ""));

export function detectLang(text, fallback = "ar") {
  const s = String(text || "");
  if (!s.trim()) return fallback;
  const ar = (s.match(/[؀-ۿ]/g) || []).length;
  const la = (s.match(/[A-Za-z]/g) || []).length;
  if (!ar && !la) return fallback;
  return ar >= la ? "ar" : "en";
}

/* ── 1. pricing (plan §5 rule 1) ──────────────────────────────────
   STRONG fires alone. WEAK needs a second signal — "كم" alone is
   "how much/how many" and lands on "كم يستغرق" (how long) just as
   often as on money, and answering a timeline question with a pricing
   card is its own kind of broken. */
const EN_STRONG = new Set([
  "price", "prices", "pricing", "priced", "cost", "costs", "costly", "costing",
  "budget", "budgets", "quote", "quotes", "quotation", "quotations",
  "fee", "fees", "invoice", "invoices", "charge", "charges", "charging",
  "cheap", "cheaper", "expensive", "affordable", "afford", "discount", "discounts",
  "deposit", "retainer", "usd", "ils", "nis", "shekel", "shekels", "dollar",
  "dollars", "euro", "euros", "free",
]);
const EN_WEAK = new Set([
  "estimate", "estimates", "rate", "rates", "worth", "range", "package",
  "packages", "pay", "paying", "money", "spend", "spending", "offer", "deal",
]);
const EN_PHRASES = [
  "how much", "price range", "ball park", "ballpark", "rate card",
  "day rate", "hourly rate", "per hour", "cost estimate", "for free",
];

const AR_STRONG_SUB = [
  "سعر", "اسعار", "تسعير", "تكلف", "كلفه", "ميزاني", "مصاري", "فلوس",
  "شيكل", "دولار", "دينار", "يورو", "رسوم", "خصم", "مجان", "عربون", "دفعه",
];
const AR_STRONG_TOK = ["بكم", "بكام", "قديش", "اديش", "كام", "بقديش"];
const AR_WEAK_TOK = ["كم", "مبلغ", "دفع", "اجر", "بدل", "عرض", "تكلفه"];

const CURRENCY = /[$₪€£]/;

/**
 * @returns {{hit: boolean, terms: string[]}}
 */
export function pricingCheck(text) {
  const n = norm(text);
  const toks = new Set(tokens(text));
  const terms = [];

  if (CURRENCY.test(String(text || ""))) terms.push("currency-symbol");
  for (const p of EN_PHRASES) if (n.includes(p)) terms.push(p);
  for (const t of toks) if (EN_STRONG.has(t)) terms.push(t);
  for (const s of AR_STRONG_SUB) if (n.includes(s)) terms.push(s);
  for (const t of AR_STRONG_TOK) if (toks.has(t)) terms.push(t);
  if (terms.length) return { hit: true, terms: [...new Set(terms)] };

  const weak = [];
  for (const t of toks) if (EN_WEAK.has(t) || AR_WEAK_TOK.includes(t)) weak.push(t);
  const uniq = [...new Set(weak)];
  return { hit: uniq.length >= 2, terms: uniq };
}

/* ── 2. jailbreak (plan §5 rule 4) ────────────────────────────────
   Prompt-level defence is the real one; this only catches the
   unmistakable openers, and only so they never cost a request.
   ⚠️ Deliberately NOT here: "act as". A visitor writing "we need
   someone to act as our social media manager" is describing a job,
   not attacking the bot. */
const JAILBREAK = [
  /\bignore\s+(?:all\s+)?(?:the\s+|your\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)/i,
  /\bdisregard\s+(?:all\s+)?(?:the\s+|your\s+)?(?:instructions?|rules?|guidelines?)/i,
  /\b(?:reveal|show|print|repeat|output|tell\s+me)\s+(?:me\s+)?(?:your|the)\s+(?:full\s+|entire\s+|original\s+)?(?:system\s+)?(?:prompt|instructions?)/i,
  /\bwhat\s+(?:is|are)\s+your\s+(?:system\s+)?(?:prompt|instructions?)\b/i,
  /\bdeveloper\s+mode\b/i,
  /\bjailbreak\b/i,
  /\byou\s+are\s+now\s+(?:a|an|my)\b/i,
  /\bpretend\s+(?:you\s+are|to\s+be)\b/i,
  /تجاهل\s*(?:كل)?\s*(?:التعليمات|الاوامر|ما\s*سبق|تعليماتك)/,
  /(?:اظهر|اعرض|اكتب)\s*(?:لي)?\s*(?:التعليمات|البرومبت|تعليماتك)/,
  /ما\s*هي\s*تعليماتك/,
  /(?:تصرف|تخيل)\s*(?:كانك|وكانك|انك)/,
  /وضع\s*المطور/,
];

export const jailbreakCheck = (text) => {
  const n = norm(text);
  return JAILBREAK.some((re) => re.test(n));
};

/* ── 3. the feasibility post-filter (plan §5 rule 6) ──────────────
   The three-bucket read from spec §4 is what this exists to keep
   dead. Anything that tells a visitor whether ألف can, can't, or
   might take their project on — or how long it would take — is a
   commitment a human has not made. */
const BANNED_OUT = [
  /* capability, about their project */
  "we can do", "we can build", "we can make", "we can handle", "we can take on",
  "we can deliver", "we can help with", "we could do", "we could build",
  "we can definitely", "we can certainly", "we are able to", "we're able to",
  "we can't do", "we cannot do", "we can't take", "we don't take",
  "this is something we regularly", "we regularly do", "we usually do this",
  /* the dropped three-bucket phrasings, verbatim */
  "sounds possible", "is possible", "not possible", "is feasible", "not feasible",
  "is doable", "definitely doable", "depends on the scope", "depends on scope",
  "depends on the timeline", "depends on your timeline",
  /* time commitments */
  "turnaround", "we guarantee", "we promise", "within a week", "within two weeks",
  "in a few days", "by next week",
  /* Arabic — capability + commitment, not service description */
  "نقدر ننفذ", "بنقدر ننفذ", "نقدر نعمل", "بنقدر نعمل", "منقدر نعمل",
  "نستطيع تنفيذ", "نستطيع القيام", "ما بنقدر", "ما منقدر", "لا نستطيع",
  "غير ممكن", "ممكن ننفذ", "ممكن جدا", "اكيد منعملها", "اكيد بنعملها",
  "يعتمد علي الحجم", "يعتمد علي النطاق", "بيعتمد علي", "يعتمد علي المده",
  "نضمن", "نعدكم", "نعدك", "مده التنفيذ", "خلال اسبوع", "خلال اسبوعين",
  "خلال ايام", "هذا شغلنا اليومي",
];

/** A price that got past the pre-filter and out of the model. */
const PRICE_OUT = /[$₪€£]\s?\d|\d[\d,.]*\s?(?:usd|ils|nis|shekels?|dollars?|euros?|شيكل|دولار|دينار|يورو)/i;

export const MAX_REPLY_CHARS = 700;

/**
 * @returns {{ok: boolean, reason: string|null, text: string}}
 *   ok:false means the reply must be discarded, not edited — a
 *   surgical cut leaves the surrounding sentence claiming the same
 *   thing with the evidence removed.
 */
export function postFilter(reply) {
  const text = String(reply == null ? "" : reply).trim();
  if (!text) return { ok: false, reason: "empty", text };

  const n = norm(text);
  const banned = BANNED_OUT.find((p) => n.includes(norm(p)));
  if (banned) return { ok: false, reason: "feasibility:" + banned, text };
  /* Tested against the normalised copy as well: `\d` is ASCII-only in
     JS, so "٢٠٠٠ شيكل" is invisible to this regex until norm() has
     folded the Arabic-Indic digits. */
  if (PRICE_OUT.test(text) || PRICE_OUT.test(n)) return { ok: false, reason: "price-leak", text };

  return { ok: true, reason: null, text: capLength(text) };
}

/** Rule 2's length cap. Trim to the last sentence that fits — a reply
    cut mid-clause reads like the connection dropped. */
export function capLength(text, max = MAX_REPLY_CHARS) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  const head = s.slice(0, max);
  const cut = Math.max(
    head.lastIndexOf("."), head.lastIndexOf("؟"), head.lastIndexOf("?"),
    head.lastIndexOf("!"), head.lastIndexOf("۔"), head.lastIndexOf("\n"),
  );
  return (cut > max * 0.4 ? head.slice(0, cut + 1) : head).trim();
}

/* ── 4. transcript-derived directives (plan §5 rule 5) ────────────
   Derived server-side from the messages the client sent, never from a
   flag the client sets — the client is the untrusted party here.

   "One clarifying question max" only binds BEFORE classification.
   Afterwards the bot legitimately asks "what's your name?" and
   "how should they reach you?", and counting those would gag it. */
export function conversationState(messages) {
  const list = Array.isArray(messages) ? messages : [];
  const assistant = list.filter((m) => m && m.role === "assistant");
  const classified = assistant.some((m) => mentionsService(m.content));
  const clarifiers = classified
    ? 0
    : assistant.filter((m) => /[?؟]\s*$/.test(String(m.content || "").trim())).length;
  return { classified, clarifiers, turns: list.filter((m) => m && m.role === "user").length };
}

/* Initialised at module load from the taxonomy itself. A forgotten
   registration call would silently mean "never classified", which
   gags every follow-up question the bot is allowed to ask — so it is
   wired here rather than left to the caller. */
const SERVICE_NAMES = [];
export function registerServiceNames(services) {
  SERVICE_NAMES.length = 0;
  for (const s of services) SERVICE_NAMES.push(norm(s.ar), norm(s.en));
}
registerServiceNames(SERVICES);

export function mentionsService(text) {
  const n = norm(text);
  return SERVICE_NAMES.some((name) => name && n.includes(name));
}

/** Extra lines appended to the system prompt for THIS turn only. */
export function directives(messages) {
  const st = conversationState(messages);
  const out = [];
  if (!st.classified && st.clarifiers >= 1) {
    out.push(
      "You have already asked your one clarifying question in this conversation. " +
      "Do not ask another. Classify the idea now with what you already have, " +
      "naming the service or services it falls under.",
    );
  }
  if (st.turns >= 8) {
    out.push(
      "This conversation is getting long. Move to the handoff: offer to have the " +
      "team get in touch, or give the direct contact details.",
    );
  }
  return out;
}

/* ── 5. size limits ───────────────────────────────────────────────
   A receptionist does not need a 4,000-character brief, and an
   unbounded transcript is an unbounded bill. */
export const LIMITS = {
  maxMessageChars: 1200,
  maxMessages: 24,
};

export function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) return "messages must be a non-empty array";
  if (messages.length > LIMITS.maxMessages) return "conversation too long";
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return "bad role";
    if (typeof m.content !== "string") return "content must be a string";
    if (m.content.length > LIMITS.maxMessageChars) return "message too long";
  }
  if (messages[messages.length - 1].role !== "user") return "last message must be from the user";
  return null;
}

/* ── the canned replies ───────────────────────────────────────────
   Written to sound like the studio, not like a policy. Each one still
   does the widget's actual job: get back to the idea, or to the team. */
export const CANNED = {
  pricing: {
    ar: "الأسعار يتكفّل بها الفريق — تختلف من مشروع لآخر ولا أعطي أرقامًا هنا. احكوا لي عن الفكرة وأدلّكم على الخدمة التي تقع تحتها، أو أوصلكم بالفريق مباشرةً.",
    en: "Pricing is the team's to give — it changes with every project, so I don't quote numbers here. Tell me the idea and I'll point you to the service it falls under, or put you in touch with the team.",
  },
  jailbreak: {
    ar: "لا أخرج عن دوري — أنا هنا للتعريف بخدمات ألِف وتوجيهكم إلى الفريق. ما الفكرة التي تفكّرون بها؟",
    en: "I can't step outside my role — I'm here to explain Aliph's services and route you to the team. What's the idea you have in mind?",
  },
  unsafe: {
    ar: "هذا سؤال يجيب عنه الفريق. أستطيع أن أدلّكم على الخدمة التي تقع تحتها فكرتكم وأوصلكم بهم — تحبّون ذلك؟",
    en: "That's one for the team to answer. I can tell you which service your idea falls under and put you in touch with them — would you like that?",
  },
  tooLong: {
    ar: "اختصروا لي الفكرة بسطر أو سطرين وسأدلّكم على الخدمة المناسبة.",
    en: "Give me the idea in a line or two and I'll point you to the right service.",
  },
  rateLimited: {
    ar: "وصلنا الحدّ لهذه الجلسة. تواصلوا مع الفريق مباشرةً — يردّون عادةً في اليوم نفسه.",
    en: "That's the limit for this session. Reach the team directly — they usually reply the same day.",
  },
};
