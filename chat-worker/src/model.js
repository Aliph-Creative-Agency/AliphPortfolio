/* ══════════════════════════════════════════════════════════════════
   THE MODEL ADAPTER — plan §11 stage 2: "Worker + guardrails, model
   stubbed. Pre-filters and rate limiting testable without a key."

   `respond()` is the seam. Stage 3 adds a Gemini implementation
   beside the stub and picks it when a key is present; nothing else in
   the Worker changes, because the guardrails already run on both
   sides of this call.

   THE STUB IS NOT A CLASSIFIER. It is keyword matching over the
   anchors in services.js, written so the whole flow — classify →
   offer → capture — can be exercised, and so the guardrails can be
   tested against a deterministic responder. It will misread anything
   phrased sideways. That is fine at this stage and not fine at the
   next one.
   ══════════════════════════════════════════════════════════════════ */

import { SERVICES, SERVICE_IDS, nameList } from "./services.js";
import { norm, tokens, capLength } from "./guardrails.js";

export const STUB_MODEL = "stub";

/* ⚠️ DERIVED, never typed. `offScope` below named the pre-2026-08 four
   services — الهويّات البصريّة / التسويق والمحتوى / الفعاليّات / التقنية —
   for as long as services.js has said three, and it is the one reply a
   visitor gets when the bot doesn't recognise their idea: the worst
   possible place to recite services the studio no longer offers. */
const COVERED = {
  ar: nameList(SERVICE_IDS, "ar"),
  en: nameList(SERVICE_IDS, "en"),
};

export const usingModel = (env) =>
  env && env.GEMINI_API_KEY ? String(env.GEMINI_MODEL || "gemini-2.5-flash-lite") : STUB_MODEL;

/* ── the stub's own lines, recognisable to itself ──────────────────
   The Worker keeps no session state (plan §4), so the stub re-derives
   where it is from the transcript the client sent. It can only do
   that if its own previous line is identifiable — hence fixed
   templates and a marker lookup rather than free text. */
const L = {
  greet: {
    ar: "أهلًا بكم. صِفوا فكرتكم بسطر أو سطرين وأدلّكم على الخدمة التي تقع تحتها.",
    en: "Hello. Describe your idea in a line or two and I'll tell you which service it falls under.",
  },
  clarify: {
    ar: "وضّحوا لي أكثر قليلًا — ما الذي تودّون عمله بالضبط؟",
    en: "Tell me a little more — what is it you're looking to do?",
  },
  offerOne: {
    ar: (n) => `هذه تقع تحت ${n}. تحبّون أن يتواصل معكم الفريق؟`,
    en: (n) => `That falls under ${n}. Would you like the team to get in touch?`,
  },
  offerMany: {
    ar: (n) => `هذه تمتدّ على أكثر من خدمة — ${n}. تحبّون أن يتواصل معكم الفريق؟`,
    en: (n) => `That spans more than one of ours — ${n}. Would you like the team to get in touch?`,
  },
  offScope: {
    ar: `لا تبدو من الخدمات التي نغطّيها — نحن نعمل في ${COVERED.ar}. إن كنت قد أخطأت الفهم، الفريق موجود — تحبّون أن يتواصل معكم الفريق؟`,
    en: `That doesn't look like something we cover — we do ${COVERED.en}. If I've got that wrong, the team is here — would you like the team to get in touch?`,
  },
  askName: {
    ar: "تمام. ما اسمكم؟",
    en: "Good. What's your name?",
  },
  askContact: {
    ar: "وأفضل طريقة للتواصل معكم؟",
    en: "And the best way to reach you?",
  },
  done: {
    ar: "وصلت. سأمرّر التفاصيل للفريق وسيتواصلون معكم قريبًا. سعدنا بمروركم.",
    en: "Got it. I'll pass the details to the team and they'll be in touch shortly. Good to have you.",
  },
  declined: {
    ar: "لا مشكلة إطلاقًا. إن غيّرتم رأيكم، الفريق على info@aliphcreative.com وعلى واتساب.",
    en: "No problem at all. If you change your mind, the team is on info@aliphcreative.com and on WhatsApp.",
  },
};

/* Fingerprints of the four lines whose answer changes what comes next.
   Matched on the normalised text so a language switch mid-conversation
   doesn't lose the thread. */
const MARK = {
  offer: [norm("تحبّون أن يتواصل معكم الفريق؟"), norm("Would you like the team to get in touch?")],
  name: [norm("ما اسمكم؟"), norm("What's your name?")],
  contact: [norm("وأفضل طريقة للتواصل معكم؟"), norm("And the best way to reach you?")],
  clarify: [norm(L.clarify.ar), norm(L.clarify.en)],
};

const YES = [
  "نعم", "ايوه", "اي", "اكيد", "تمام", "موافق", "بالتاكيد", "طبعا", "اوك", "حلو", "يلا",
  "yes", "yeah", "yep", "sure", "ok", "okay", "please", "absolutely", "definitely", "sounds good",
];
const NO = [
  "لا", "لأ", "مش هلق", "ليس الان", "لاحقا", "شكرا لا",
  "no", "nope", "not now", "no thanks", "later", "maybe later",
];

const anyOf = (text, list) => {
  const t = tokens(text);
  const n = norm(text);
  return list.some((w) => (w.includes(" ") ? n.includes(w) : t.includes(w)));
};

const lastAssistant = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return norm(messages[i].content);
  }
  return "";
};

const wasAsking = (messages, which) => {
  const last = lastAssistant(messages);
  return last ? MARK[which].some((m) => last.includes(m)) : false;
};

/* ── classification ───────────────────────────────────────────────── */
export function classify(text) {
  const n = norm(text);
  const t = new Set(tokens(text));
  const hits = [];
  for (const s of SERVICES) {
    const words = [...s.kw.ar, ...s.kw.en].map(norm);
    const score = words.reduce(
      (acc, w) => acc + (w.includes(" ") ? (n.includes(w) ? 1 : 0) : (t.has(w) ? 1 : 0)),
      0,
    );
    if (score) hits.push({ id: s.id, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.map((h) => h.id);
}

/** The first user message that actually described something — the
    verbatim line plan §2 carries into the lead so the record is never
    purely the bot's reading of it. */
function firstIdea(messages) {
  const users = messages.filter((m) => m.role === "user");
  for (const m of users) {
    if (classify(m.content).length) return m.content.trim();
  }
  return (users[0] && users[0].content.trim()) || "";
}

/**
 * @returns {{reply: string, services: string[], phase: string, lead: object|null, model: string}}
 */
export async function respond({ messages, lang, directives = [] }) {
  const user = messages[messages.length - 1].content;
  const idea = firstIdea(messages);
  const services = classify(idea);
  const pick = (k) => L[k][lang];

  /* mid-capture: the two questions whose answers ARE the lead */
  if (wasAsking(messages, "name")) {
    return out(pick("askContact"), services, "capture:contact", null);
  }
  if (wasAsking(messages, "contact")) {
    const name = nameAnswer(messages);
    return out(pick("done"), services, "done", {
      services,
      name,
      contact: user.trim(),
      summary: capLength(idea, 140),
      verbatim: idea,
      lang,
    });
  }

  /* the offer's answer */
  if (wasAsking(messages, "offer")) {
    if (anyOf(user, YES)) return out(pick("askName"), services, "capture:name", null);
    if (anyOf(user, NO)) return out(pick("declined"), services, "declined", null);
    /* neither — they carried on describing, so classify again */
  }

  /* nothing said yet */
  if (!user.trim()) return out(pick("greet"), [], "greet", null);

  /* one clarifying question, and only if the transcript hasn't spent
     it already — the directive from guardrails.directives() is what
     says so, which is how the real model will learn it too */
  const spent = directives.some((d) => d.includes("already asked")) || wasAsking(messages, "clarify");
  if (!services.length && tokens(user).length < 4 && !spent) {
    return out(pick("clarify"), [], "clarify", null);
  }

  if (!services.length) return out(pick("offScope"), [], "offer", null);

  const names = nameList(services, lang);
  const line = services.length > 1 ? L.offerMany[lang](names) : L.offerOne[lang](names);
  return out(line, services, "offer", null);
}

function nameAnswer(messages) {
  /* the user message that answered "what's your name?" */
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "assistant") continue;
    const n = norm(messages[i].content);
    if (MARK.name.some((m) => n.includes(m))) {
      const next = messages[i + 1];
      return next && next.role === "user" ? next.content.trim() : "";
    }
  }
  return "";
}

const out = (reply, services, phase, lead) => ({ reply, services, phase, lead, model: STUB_MODEL });
