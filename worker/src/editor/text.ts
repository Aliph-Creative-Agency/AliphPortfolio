// The text save API (E-03): one (key, locale) draft at a time.
//
//   PUT    /api/admin/text {key, locale, value, baseRev}   draft = value
//   DELETE /api/admin/text {key, locale, baseRev}          draft = NULL (the default shows)
//
// Order: Origin (routes.ts) → validateText → ONE db.batch holding the
// rev-locked write and its audit row. `baseRev` is the row's rev from the
// draft snapshot's `locks`; 0 means "I saw no row": the write is then an
// INSERT … ON CONFLICT DO NOTHING, so a row someone created meanwhile is a
// conflict, never overwritten. Otherwise `… WHERE rev = baseRev` with
// rev + 1. The audit INSERT is guarded by `changes() = 1`, i.e. it only lands
// when the write before it in the same transaction did: a lost race leaves
// no trace but the 409.
//
//   200 {key, locale, value, rev}          rev = the row's new lock (baseRev + 1)
//   409 {error, current: {value, rev}}     current draft (null = default) and lock (0 = no row)
//   400 {error, field}                     before any write

import type { AdminCtx, Env } from "../index";
import { badRequest, validateText } from "../validate";
import { json, readJson } from "./http";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

const INSERT_SQL =
  "INSERT INTO text_values (key, locale, draft, updated_by) VALUES (?1, ?2, ?3, ?4) ON CONFLICT (key, locale) DO NOTHING";
const UPDATE_SQL = `UPDATE text_values SET draft = ?3, rev = rev + 1, updated_at = ${NOW}, updated_by = ?4
  WHERE key = ?1 AND locale = ?2 AND rev = ?5`;
/* changes() = rows changed by the statement before it in this batch */
const AUDIT_SQL = "INSERT INTO audit (actor, action, target, detail) SELECT ?1, ?2, ?3, ?4 WHERE changes() = 1";

export async function textRoute(request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  const reset = request.method === "DELETE";
  if (!reset && request.method !== "PUT") return json({ error: "method not allowed" }, 405);

  const body = await readJson(request);
  if (!body) return badRequest({ ok: false, error: "body must be a JSON object" });
  const { key, locale, baseRev } = body;
  if (!reset && typeof body.value !== "string") {
    return badRequest({ ok: false, error: "value must be a string (DELETE resets)", field: "value" });
  }
  const v = validateText(key, locale, reset ? null : body.value);
  if (!v.ok) return badRequest(v);
  if (typeof baseRev !== "number" || !Number.isSafeInteger(baseRev) || baseRev < 0) {
    return badRequest({ ok: false, error: "baseRev must be a non-negative integer", field: "baseRev" });
  }
  const k = key as string;
  const loc = locale as "ar" | "en";
  const value = v.value;
  const rev = baseRev + 1;

  const db = env.DB;
  const write =
    baseRev === 0
      ? db.prepare(INSERT_SQL).bind(k, loc, value, ctx.adminEmail)
      : db.prepare(UPDATE_SQL).bind(k, loc, value, ctx.adminEmail, baseRev);
  const audit = db
    .prepare(AUDIT_SQL)
    .bind(ctx.adminEmail, reset ? "text.reset" : "text.save", `${k}:${loc}`, JSON.stringify({ rev }));
  const [res] = await db.batch([write, audit]);

  if (res.meta.changes !== 1) {
    const cur = await db
      .prepare("SELECT draft AS value, rev FROM text_values WHERE key = ?1 AND locale = ?2")
      .bind(k, loc)
      .first<{ value: string | null; rev: number }>();
    return json({ error: "conflict: changed since you loaded it", current: cur ?? { value: null, rev: 0 } }, 409);
  }
  return json({ key: k, locale: loc, value, rev });
}
