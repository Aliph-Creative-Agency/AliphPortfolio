// C-04: the admin Clients read model, GET /api/admin/clients.
//
// Every ACTIVE client row (a 'deleted' one is a staged removal and stays out),
// with what the Clients panel and the drawer select need: the draft details,
// the optimistic-lock rev, whether it is live and whether the draft differs
// from what is live, and how many active draft gallery items use it (the
// number the delete guard counts, C-05). Ordered by English name, then id.

import type { Env } from "../index";
import { clientFromRow, CLIENT_COLS, type Client, type ClientRow } from "../store";

export interface AdminClient extends Client {
  /** optimistic lock: send it back with PUT / DELETE */
  rev: number;
  /** a published copy exists */
  published: boolean;
  /** the draft differs from the published copy (always true when unpublished) */
  changed: boolean;
  /** active draft gallery items that name this client (hidden ones included) */
  pieces: number;
}

export type AdminClientRow = ClientRow & { rev: number; published_json: string | null; pieces: number };

/** Everything adminClient() needs, for `… WHERE c.…`. */
export const ADMIN_CLIENT_SQL = `SELECT ${CLIENT_COLS.split(", ")
  .map((c) => "c." + c)
  .join(", ")}, c.rev, c.published_json,
  (SELECT count(*) FROM gallery_items g WHERE g.client_id = c.id AND g.state = 'active') AS pieces
  FROM clients c`;

export function adminClient(r: AdminClientRow): AdminClient {
  const c = clientFromRow(r);
  return {
    ...c,
    rev: r.rev,
    published: r.published_json !== null,
    // publish writes exactly JSON.stringify(clientFromRow(row)) (CONTENT_API "Publish")
    changed: r.published_json !== JSON.stringify(c),
    pieces: r.pieces,
  };
}

/** One active client as the panel draws it, or null when there is none. */
export async function readClient(env: Env, id: string): Promise<AdminClient | null> {
  const r = await env.DB.prepare(`${ADMIN_CLIENT_SQL} WHERE c.id = ?1 AND c.state = 'active'`)
    .bind(id)
    .first<AdminClientRow>();
  return r ? adminClient(r) : null;
}

export async function clientsList(env: Env): Promise<AdminClient[]> {
  const { results } = await env.DB.prepare(
    `${ADMIN_CLIENT_SQL} WHERE c.state = 'active' ORDER BY c.name_en COLLATE NOCASE, c.id`,
  ).all<AdminClientRow>();
  return results.map(adminClient);
}
