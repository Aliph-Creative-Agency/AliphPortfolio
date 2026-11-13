// C-04: client writes.
//
//   POST /api/admin/clients  {name: {ar, en}, line?: {ar?, en?}, year?, url?}  → 201 {client}
//
// The Worker makes the id: a slug of name_en, "-", then 4 random [a-z0-9]
// (only [a-z0-9-], at most 40 characters, never changed afterwards). A
// collision with any row, deleted ones included, draws a new suffix.
// Validation is validateClient (C-02); the row is a draft until publish.
// Audit 'client.create'.

import type { AdminCtx, Env } from "../index";
import type { Client } from "../store";
import { badRequest, validateClient } from "../validate";
import { audit } from "../gallery/upload";
import { json } from "../gallery/routes";
import { readClient } from "./read";

export const CLIENT_ID_MAX = 40;
const SUFFIX = 4;
const ALNUM = "abcdefghijklmnopqrstuvwxyz0123456789";

/** "Café Al-Baydar & Co." → "cafe-al-baydar-co"; "" when nothing Latin is left. */
export function slugOf(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, CLIENT_ID_MAX - SUFFIX - 1)
    .replace(/-+$/, "");
}

function suffix(): string {
  // 36 does not divide 256, so x % 36 is a little uneven; an id only has to be unlikely to collide
  const b = crypto.getRandomValues(new Uint8Array(SUFFIX));
  return Array.from(b, (x) => ALNUM[x % ALNUM.length]).join("");
}

export const newClientId = (nameEn: string) => `${slugOf(nameEn) || "client"}-${suffix()}`;

/** The JSON body as an object, or the 400 to send. */
export async function readBody(request: Request): Promise<Record<string, unknown> | Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest({ ok: false, error: "body must be JSON", field: "client" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return badRequest({ ok: false, error: "client must be an object", field: "client" });
  }
  return body as Record<string, unknown>;
}

/** [name_ar, name_en, line_ar, line_en, year, url] of a validated client. */
export const clientCols = (v: Client) => [
  v.name.ar,
  v.name.en,
  v.line?.ar ?? null,
  v.line?.en ?? null,
  v.year ?? null,
  v.url ?? null,
];

export async function clientCreate(request: Request, env: Env, ctx: AdminCtx): Promise<Response> {
  const body = await readBody(request);
  if (body instanceof Response) return body;
  if (body.id !== undefined) return badRequest({ ok: false, error: "the id is made by the server", field: "id" });

  // a placeholder id: the real one is drawn only for a valid client
  const v = validateClient({ ...body, id: "new" });
  if (!v.ok) return badRequest(v);
  for (let i = 0; i < 5; i++) {
    const id = newClientId(v.value.name.en);
    const res = await env.DB.prepare(
      `INSERT INTO clients (id, name_ar, name_en, line_ar, line_en, year, url, updated_by)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT (id) DO NOTHING`,
    )
      .bind(id, ...clientCols(v.value), ctx.adminEmail)
      .run();
    if (!res.meta.changes) continue;
    const client = await readClient(env, id);
    await audit(env, ctx.adminEmail, "client.create", id, { rev: client?.rev });
    return json({ client }, 201);
  }
  return json({ error: "could not find a free id; try again" }, 503);
}
