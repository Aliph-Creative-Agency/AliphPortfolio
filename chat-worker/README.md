# Aliph chat Worker

The backend for the chat widget in `prototype/chat/`. A **separate
deployable** — `prototype/` is hand-written static HTML with no build
step, and plan §4 keeps it that way.

Governing document: [`../aliph-chatbot-plan.md`](../aliph-chatbot-plan.md).
Where the plan and `../aliph-chatbot-spec.md` disagree, the plan wins.

**Status: stage 2 of 5.** Worker, guardrails and rate limiting are
built and tested. **The model is a stub** — keyword matching over
`src/services.js`, not classification. Stage 3 wires Gemini in behind
the same seam.

---

## Run it

```bash
cd chat-worker && npx wrangler dev
```

```bash
cd chat-worker && npm test
```

The tests need no wrangler, no key and no network: the fetch handler
runs under plain Node, and the rate limiter falls back to an in-isolate
Map when there is no Durable Object binding. 67 cases, ~150ms.

⚠️ **Run `wrangler dev` at least once before shipping any change to
`src/index.js`.** Node imports the module happily; workerd validates
every named export and refuses to boot if the entry module exports
anything that isn't the default handler or a Durable Object class. The
test suite cannot see that class of error.

### Try it by hand

```bash
curl -s -H "Origin: http://localhost:8321" http://127.0.0.1:8787/api/health
```

```bash
curl -s -X POST http://127.0.0.1:8787/api/chat -H "Origin: http://localhost:8321" -H "content-type: application/json" -H "X-Aliph-Session: demo" --data '{"messages":[{"role":"user","content":"we are opening a cafe and need a logo and someone to run the instagram"}]}'
```

---

## The two routes

### `GET /api/health`

```json
{ "ok": true, "quotaRemaining": 1198, "model": "stub", "stub": true,
  "durableRateLimit": true, "promptVersion": "2026-08-05.1", "version": "0.2.0-stage2" }
```

⚠️ **`ok` and `quotaRemaining` are a contract with the widget**, which
reads exactly `data.ok === true && data.quotaRemaining !== 0`
(`prototype/chat/aliph-chat.js` → `probe()`). Renaming either field
silently sends every visitor to the contact card.

`ok` means "a visitor can be answered right now" and nothing weaker:
no model and no stub → `false`, quota gone → `false`. That is what
makes plan §7's fallback honest instead of decorative.

`GET /api/health` never spends quota — it reads the counters in dry-run.

### `POST /api/chat`

```
{ "messages": [ { "role": "user" | "assistant", "content": "…" } ], "lang": "ar" | "en" }
header: X-Aliph-Session: <opaque id, session-lifetime, ≤64 chars>
```

```json
{ "reply": "…", "services": ["identity","creative"], "phase": "offer",
  "leadReady": false, "done": false, "model": "stub" }
```

`blocked` appears when a guardrail answered instead of the model:
`pricing`, `jailbreak`, `length`, `rate:*`, `post:*`, `model-error`.

`phase` ∈ `greet · clarify · offer · capture:name · capture:contact ·
done · declined`. The Worker holds **no session state** (plan §4) — the
phase is re-derived from the transcript the client sends on every turn.

---

## The order of operations is the design

```
CORS → validate → rate limit → PRE-FILTER → model → POST-FILTER
```

The pre-filters run **before** the model so a pricing question or a
jailbreak attempt costs no quota and can't depend on the model
behaving. The post-filter runs **after** it because the model is the
one component here that cannot be trusted to hold a rule.

| Plan §5 | Where |
|---|---|
| 1 · no pricing, ever | `guardrails.pricingCheck` — pre-filter, plus a second pass over the model's own output |
| 2 · no creative/consulting work | prompt + `capLength` (700 chars) |
| 3 · no internal info | prompt; there is no internal data in the context to leak |
| 4 · no jailbreak compliance | system prompt re-sent every turn + `jailbreakCheck` on the obvious openers |
| 5 · one clarifying question max | `guardrails.directives`, derived server-side from the transcript |
| 6 · no feasibility language | `guardrails.postFilter` — the ban list that keeps spec §4's three-bucket read dead |
| 7 · per-visitor rate limit | `ratelimit.js`, per-session and per-IP first, global daily as the backstop |

**Three judgement calls worth knowing before you edit the filters:**

1. **The bans are curated phrase lists, not broad patterns.** A pattern
   like `/we can\b/` also swallows *"we can put you in touch with the
   team"* — the one sentence this bot exists to say.
2. **Describing a service is not a feasibility read.** "We do visual
   identities" must stay allowed; job #1 in plan §9 is answering simple
   questions about the four services. Only capability or commitment
   *about the visitor's project* is banned.
3. **`كم` alone is weak, `بكم`/`قديش` are strong.** Bare `كم` is "how
   much" and "how many" both, and it lands on `كم يستغرق` (how long)
   just as often as on money. Answering a timeline question with a
   pricing card is its own kind of broken, so weak terms need a second
   signal before they fire.

Arabic matching runs over a normalised copy: tashkeel and tatweel
stripped, alef/ya/ta-marbuta folded, Arabic-Indic digits converted.
`ة → ه` is what makes `تكلفة` and `تكلفه` one string. Tokenising also
offers the bare form of a word so `والسعر` matches `سعر` — but it strips
only the conjunction and the **article**, never a lone preposition: a
greedy chain of optional letters turns `وكم` into `م`.

---

## Rate limiting

| | limit | window |
|---|---|---|
| session | 24 | 10 min |
| IP | 80 | 1 hour |
| global daily | 1200 | 24 h |

Per-session and per-IP counters share one Durable Object instance keyed
by IP, so one round trip enforces both; the daily counter is a second
instance named `global`.

**Why a Durable Object and not KV:** KV is eventually consistent, and an
eventually-consistent counter is not a rate limit — two requests a
second apart can read the same stale count. Without the binding the
Worker falls back to a per-isolate `Map`; that is best-effort, not a
limit, and `/api/health` reports `durableRateLimit: false` when you're
on it.

The daily cap sits **under** Gemini's free-tier daily quota on purpose,
so the day runs out here — where the widget shows a contact card —
rather than at Google, where it returns an error. ⚠️ Plan §4: re-check
Google's current quota when the key goes in; the spec's numbers are old.

---

## Privacy (plan §6)

**Conversations are not logged.** There is deliberately no
`console.log` of message content anywhere in `src/`, and adding one
breaks a promise printed on the widget. Only a submitted lead is ever
stored, and only in the destination inbox.

---

## What is stubbed, and what stage 3 changes

`src/model.js` exports `respond()`. That is the whole seam. Stage 3
adds a Gemini implementation beside the stub and picks it when
`GEMINI_API_KEY` is set; nothing else in the Worker moves, because the
guardrails already run on both sides of that call.

The stub is **keyword matching**, not classification. It will misread
anything phrased sideways. It exists so the flow (classify → offer →
capture) and the guardrails can be tested deterministically without a
key.

```
stage 3   wrangler secret put GEMINI_API_KEY
          set ALLOW_STUB = "0"   ← after this a missing key is a 503,
                                   health says not-ok, widget falls back
          point prototype/chat/aliph-chat.js CONFIG.endpoint/.health here
stage 4   leads.js: the completed lead → info@aliphcreative.com
          (`leadReady` already fires; nothing is carried anywhere yet)
stage 5   the adversarial pass — plan §11 is explicit that it is not
          optional and not a formality
```

Still blocked on the studio (plan §10): real service examples, voice
samples, confirmed contact details, who owns the Gemini key, and where
the site will be hosted (which decides `ALLOWED_ORIGINS`).

⚠️ `src/services.js` must stay in sync with `CATS` in
`prototype/main.js`. Its `examples` and `kw` lists are **placeholders I
wrote**, not the studio's — plan §3 is explicit that placeholder
examples produce placeholder classification.
