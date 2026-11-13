// The media-slot save API (E-14): one holder's draft at a time, modelled on text.ts.
//
//   PUT    /api/admin/slot {slot, value, baseRev}     draft_json = value (null = reset)
//   DELETE /api/admin/slot?slot=<id>&baseRev=<n>      draft_json = NULL (the default shows)
//
// Order: Origin (routes.ts) → validateSlot → ONE db.batch holding the rev-locked
// write and its audit row. baseRev is the slot's rev from the draft snapshot's
// `locks.slots`; 0 = "I saw no row" (INSERT … ON CONFLICT DO NOTHING, so a row
// created meanwhile is a conflict). The audit INSERT is guarded by changes() = 1.
//
//   200 {slot, value, rev}                 value null = reset
//   409 {error, current: {value, rev}}     current draft (null = default) and lock (0 = no row)
//   400 {error, field}                     before any write

import type { AdminCtx, Env } from "../index";
import { badRequest, validateSlot } from "../validate";
import { json, readJson } from "./http";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

const INSERT_SQL =
  "INSERT INTO slot_values (slot, draft_json, updated_by) VALUES (?1, ?2, ?3) ON CONFLICT (slot) DO NOTHING";
const UPDATE_SQL = `UPDATE slot_values SET draft_json = ?2, rev = rev + 1, updated_at = ${NOW}, updated_by = ?3
  WHERE slot = ?1 AND rev = ?4`;
const AUDIT_SQL = "INSERT INTO audit (actor, action, target, detail) SELECT ?1, ?2, ?3, ?4 WHERE changes() = 1";

const isRev = (n: unknown): n is number => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;

export async function slotRoute(request: Request, env: Env, url: URL, ctx: AdminCtx): Promise<Response> {
  let slot: unknown;
  let value: unknown;
  let baseRev: unknown;
  if (request.method === "DELETE") {
    slot = url.searchParams.get("slot");
    const raw = url.searchParams.get("baseRev");
    baseRev = raw !== null && /^\d{1,15}$/.test(raw) ? Number(raw) : null;
    value = null;
  } else if (request.method === "PUT") {
    const body = await readJson(request);
    if (!body) return badRequest({ ok: false, error: "body must be a JSON object" });
    ({ slot, baseRev } = body);
    if (!("value" in body)) {
      return badRequest({ ok: false, error: "value is required (null resets)", field: "value" });
    }
    value = body.value;
  } else {
    return json({ error: "method not allowed" }, 405);
  }

  const v = validateSlot(slot, value);
  if (!v.ok) return badRequest(v);
  if (!isRev(baseRev)) {
    return badRequest({ ok: false, error: "baseRev must be a non-negative integer", field: "baseRev" });
  }
  const id = slot as string;
  const stored = v.value === null ? null : JSON.stringify(v.value);
  const reset = stored === null;
  const rev = baseRev + 1;

  const db = env.DB;
  const write =
    baseRev === 0
      ? db.prepare(INSERT_SQL).bind(id, stored, ctx.adminEmail)
      : db.prepare(UPDATE_SQL).bind(id, stored, ctx.adminEmail, baseRev);
  const audit = db
    .prepare(AUDIT_SQL)
    .bind(ctx.adminEmail, reset ? "slot.reset" : "slot.save", id, JSON.stringify({ rev }));
  const [res] = await db.batch([write, audit]);

  if (res.meta.changes !== 1) {
    const cur = await db
      .prepare("SELECT draft_json, rev FROM slot_values WHERE slot = ?1")
      .bind(id)
      .first<{ draft_json: string | null; rev: number }>();
    const current = cur ? { value: cur.draft_json === null ? null : JSON.parse(cur.draft_json), rev: cur.rev } : { value: null, rev: 0 };
    return json({ error: "conflict: changed since you loaded it", current }, 409);
  }
  return json({ slot: id, value: v.value, rev });
}
