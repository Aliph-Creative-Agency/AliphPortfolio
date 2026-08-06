/* ══════════════════════════════════════════════════════════════════
   ALIPH CHAT WORKER — plan §4/§11, stage 2.

   Two routes:
     GET  /api/health   what the widget probes before showing a
                        composer. Shape is fixed by the widget:
                        { ok, quotaRemaining } — see
                        prototype/chat/aliph-chat.js probe().
     POST /api/chat     { messages: [{role, content}], lang? }
                        header: X-Aliph-Session

   THE ORDER OF OPERATIONS IS THE DESIGN:

     CORS → validate → rate limit → PRE-FILTER → model → POST-FILTER

   The pre-filters sit before the model so a pricing question or a
   jailbreak attempt costs no quota and cannot depend on the model
   behaving. The post-filter sits after it because the model is the
   one component here that can't be trusted to hold a rule.

   ⚠️ Conversations are not logged (plan §6). There is deliberately no
   console.log of message content anywhere in this file, and adding
   one breaks a promise printed on the widget.
   ══════════════════════════════════════════════════════════════════ */

import { json, preflight } from "./cors.js";
import * as G from "./guardrails.js";
import { buildSystem, PROMPT_VERSION } from "./prompt.js";
import { respond, usingModel, STUB_MODEL } from "./model.js";
import { charge, peek, usingDurableObject, ChatLimiter } from "./ratelimit.js";

/* ⚠️ The ONLY named exports a Worker entry module may carry are the
   default handler and Durable Object classes. workerd validates every
   export at startup and refuses to boot on anything else:
     "Incorrect type for map entry 'VERSION': the provided value is
      not of type 'function or ExportedHandler'."
   Node imports this file happily, so the test suite will not catch
   it — `wrangler dev` is what catches it. Keep constants unexported. */
export { ChatLimiter };

const VERSION = "0.2.0-stage2";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return preflight(request, env);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return health(request, env);
    }
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return chat(request, env);
    }
    return json({ error: "not found" }, { status: 404, request, env });
  },
};

/* ── health ───────────────────────────────────────────────────────
   `ok` means "a visitor can be answered right now", and nothing
   weaker. With no key and no stub allowed it is false, so the widget
   shows its contact card rather than a composer that can't reply —
   which is exactly the state plan §7 asks for. */
async function health(request, env) {
  const model = usingModel(env);
  const stubOK = model === STUB_MODEL && String(env.ALLOW_STUB || "") === "1";
  const live = model !== STUB_MODEL || stubOK;

  const quota = await peek(env, { ip: clientIP(request), session: null });

  return json({
    ok: live && quota.dailyRemaining > 0,
    quotaRemaining: quota.dailyRemaining,
    model,
    stub: model === STUB_MODEL,
    durableRateLimit: usingDurableObject(env),
    promptVersion: PROMPT_VERSION,
    version: VERSION,
  }, { request, env });
}

/* ── chat ─────────────────────────────────────────────────────────── */
async function chat(request, env) {
  const model = usingModel(env);
  if (model === STUB_MODEL && String(env.ALLOW_STUB || "") !== "1") {
    /* No key, and the stub wasn't opted into. Say so plainly rather
       than answering with a stub in production by accident. */
    return json({ error: "assistant unavailable" }, { status: 503, request, env });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad json" }, { status: 400, request, env });
  }

  const bad = G.validateMessages(body && body.messages);
  if (bad) {
    /* Over-length is a visitor writing an essay, not an error — answer
       it in the conversation instead of with a status code. */
    if (bad === "message too long") {
      return json(reply(G.CANNED.tooLong[langOf(body)], { blocked: "length" }), { request, env });
    }
    return json({ error: bad }, { status: 400, request, env });
  }

  const messages = body.messages;
  const last = messages[messages.length - 1].content;
  const lang = langOf(body, last);

  /* ── rate limit (plan §5 rule 7) ───────────────────────────────── */
  const session = (request.headers.get("X-Aliph-Session") || "").slice(0, 64) || null;
  const gate = await charge(env, { ip: clientIP(request), session });
  if (!gate.allowed) {
    return json(
      reply(G.CANNED.rateLimited[lang], { blocked: "rate:" + gate.blockedBy, done: true }),
      {
        status: 429,
        request,
        env,
        extra: { "retry-after": String(Math.ceil(gate.retryAfterMs / 1000)) },
      },
    );
  }

  /* ── pre-filters: before the model, always ─────────────────────── */
  if (G.pricingCheck(last).hit) {
    return json(reply(G.CANNED.pricing[lang], { blocked: "pricing" }), { request, env });
  }
  if (G.jailbreakCheck(last)) {
    return json(reply(G.CANNED.jailbreak[lang], { blocked: "jailbreak" }), { request, env });
  }

  /* ── the model ─────────────────────────────────────────────────── */
  const directives = G.directives(messages);
  let answer;
  try {
    answer = await respond({
      messages,
      lang,
      directives,
      system: buildSystem(directives),
      env,
    });
  } catch {
    /* Same landing place as every other failure: the team. */
    return json(reply(G.CANNED.unsafe[lang], { blocked: "model-error", done: true }),
      { status: 502, request, env });
  }

  /* ── post-filter: the model is the untrusted component ─────────── */
  const checked = G.postFilter(answer.reply);
  if (!checked.ok) {
    return json(
      reply(G.CANNED.unsafe[lang], { blocked: "post:" + checked.reason }),
      { request, env },
    );
  }
  /* A price in the model's own words is a pricing violation wherever
     it appears — the pre-filter only ever saw the visitor's side. */
  if (G.pricingCheck(checked.text).hit) {
    return json(reply(G.CANNED.pricing[lang], { blocked: "post:pricing" }), { request, env });
  }

  return json(reply(checked.text, {
    services: answer.services,
    phase: answer.phase,
    /* Stage 4 hands this to leads.js → email. Stage 2 reports that a
       lead is COMPLETE without carrying it anywhere; nothing is
       stored, sent or logged yet. */
    leadReady: Boolean(answer.lead),
    done: answer.phase === "done" || answer.phase === "declined",
    model: answer.model,
  }), { request, env });
}

/* ── helpers ──────────────────────────────────────────────────────── */
const reply = (text, extra = {}) => ({ reply: text, services: [], ...extra });

function langOf(body, text) {
  const asked = body && body.lang;
  if (asked === "ar" || asked === "en") return asked;
  return G.detectLang(text || "", "ar");
}

const clientIP = (request) =>
  request.headers.get("CF-Connecting-IP") ||
  request.headers.get("X-Forwarded-For") ||
  "unknown";
