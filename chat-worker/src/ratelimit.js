/* ══════════════════════════════════════════════════════════════════
   RATE LIMITING — plan §5 rule 7.

   The spec had a global daily counter only. That doesn't stop one
   person from burning the whole day's quota for every other visitor,
   so the per-visitor limit is the primary control and the global
   counter is the backstop.

   ⚠️ Why a Durable Object and not KV: KV is eventually consistent, and
   an eventually-consistent counter is not a rate limit — two requests
   a second apart can both read the same stale count. A DO gives one
   authoritative instance per key with serialised access.

   Both per-IP and per-session counters live in the SAME instance,
   keyed by IP. Sessions from one visitor land in one DO, so a single
   round trip enforces both. The global daily counter is one shared
   instance named "global".

   Without a DO binding (plain `node --test`, or a deployment that
   skips the migration) it falls back to a per-isolate Map. That is
   honest best-effort, not a limit — `usingDurableObject` says which
   one you got, and /api/health reports it.
   ══════════════════════════════════════════════════════════════════ */

export const RATE = {
  /* one visitor, one sitting */
  session: { limit: 24, windowMs: 10 * 60 * 1000 },
  /* everyone behind one address — a shared office NAT should still fit */
  ip: { limit: 80, windowMs: 60 * 60 * 1000 },
  /* the backstop. Held under the free tier's daily cap on purpose so
     the quota runs out here, where the widget shows a contact card,
     rather than at Google, where it returns an error.
     ⚠️ plan §4: re-check Google's current quota at wiring time. */
  daily: { limit: 1200, windowMs: 24 * 60 * 60 * 1000 },
};

/* ── the counter itself, shared by both backends ──────────────────
   Fixed window. A sliding window is more accurate and needs a stored
   list of timestamps per key; for "stop one person hammering a
   widget" the fixed window is the right amount of machinery. */
async function tick(store, key, limit, windowMs, dryRun) {
  const now = Date.now();
  const rec = (await store.get(key)) || { n: 0, reset: now + windowMs };
  if (now >= rec.reset) { rec.n = 0; rec.reset = now + windowMs; }

  const allowed = rec.n < limit;
  if (allowed && !dryRun) {
    rec.n += 1;
    await store.put(key, rec);
  }
  return {
    key,
    allowed,
    remaining: Math.max(0, limit - rec.n),
    resetInMs: Math.max(0, rec.reset - now),
  };
}

/* ── Durable Object backend ───────────────────────────────────────── */
export class ChatLimiter {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async fetch(request) {
    const { checks, dryRun } = await request.json();
    const results = [];
    for (const c of checks) {
      results.push(await tick(this.ctx.storage, c.key, c.limit, c.windowMs, dryRun));
    }
    return new Response(JSON.stringify({ results }), {
      headers: { "content-type": "application/json" },
    });
  }
}

/* ── in-isolate fallback ──────────────────────────────────────────── */
const memory = new Map();
const memoryStore = {
  async get(k) { return memory.get(k); },
  async put(k, v) { memory.set(k, v); },
};

function ask(env, name, checks, dryRun) {
  const ns = env && env.CHAT_LIMITER;
  if (!ns) {
    return Promise.all(checks.map((c) => tick(memoryStore, name + "|" + c.key, c.limit, c.windowMs, dryRun)))
      .then((results) => ({ results }));
  }
  const stub = ns.get(ns.idFromName(name));
  return stub
    .fetch("https://limiter/tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checks, dryRun }),
    })
    .then((r) => r.json());
}

export const usingDurableObject = (env) => Boolean(env && env.CHAT_LIMITER);

/**
 * Charge one request against every limit at once.
 * `dryRun` reads the counters without spending anything — /api/health
 * needs the daily figure and must not consume it to get it.
 *
 * @returns {{allowed: boolean, blockedBy: string|null, retryAfterMs: number, dailyRemaining: number}}
 */
export async function charge(env, { ip, session, dryRun = false } = {}) {
  const visitorKey = "ip:" + (ip || "unknown");
  const [visitor, global] = await Promise.all([
    ask(env, visitorKey, [
      { key: "ip", ...RATE.ip },
      { key: "s:" + (session || "anon"), ...RATE.session },
    ], dryRun),
    ask(env, "global", [{ key: "daily", ...RATE.daily }], dryRun),
  ]);

  const all = [...visitor.results, ...global.results];
  const blocked = all.find((r) => !r.allowed);
  const daily = global.results[0];

  return {
    allowed: !blocked,
    blockedBy: blocked ? (blocked.key === "daily" ? "daily" : blocked.key.startsWith("s:") ? "session" : "ip") : null,
    retryAfterMs: blocked ? blocked.resetInMs : 0,
    dailyRemaining: daily.remaining,
  };
}

/** Read-only peek for /api/health. Never spends a request. */
export const peek = (env, who) => charge(env, { ...who, dryRun: true });
