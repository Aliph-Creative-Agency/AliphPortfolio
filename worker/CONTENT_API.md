# Content API: the contract between the store, the Worker and the admin teams

The content store is D1 `aliph-admin` (schema: `migrations/`). It holds only overrides of main.js's tables and
additions to them. `worker/src/generated/defaults.json` is what the site says today, and an empty store means the
site is unchanged. The editable surface is `worker/src/generated/registry.json` (`npm run gen:defaults`, see
`worker/scripts/gen-defaults.mjs`). The code behind this document:

| file | what |
|---|---|
| `worker/src/store.ts` | `readSnapshot(db, "published" \| "draft")`, `galleryItemFromRow`, `isEmpty` |
| `worker/src/api/content.ts` | the GET routes below |
| `worker/src/validate.ts` | `validateText / validateSlot / validateRing / validateGalleryItem / validateClient`, `badRequest` |
| `worker/src/publish.ts` | `publish(db, by)`, `PublishConflictError` (see "Publish") |
| `worker/src/cache.ts` | the published snapshot + rendered pages, cached per publish (see "Publish") |

## Routes

| route | who | answers |
|---|---|---|
| `GET /api/content` (= `?state=published`) | public | the published snapshot. `ETag: "<publish_rev>"`, `Cache-Control: public, max-age=60`. `If-None-Match` with the current tag (weak, a list, or `*`) gets a `304` (from the cache in a warm isolate, without D1). |
| `GET /api/admin/content` | Access | the **draft** snapshot plus `locks`, with `Cache-Control: private, no-store`. **Editor and gallery screens use this one.** |
| `GET /api/content?state=draft` | Access | the same as above. The route is not under `/api/admin`, so the handler calls `verifyAccess` itself. |
| `?state=` anything else | | `400 {"error"}` |
| non-GET/HEAD on `/api/content` | | `405` |
| `/api/content` published, the store failing and nothing cached | | `503 {"error": "content store unavailable"}`, `no-store` (the pages fall back to the assets instead) |

With no valid Access JWT, either draft route returns `403` (plain text, `no-store`). If `ACCESS_*` is empty, they
also return 403 (fail closed). Locally, `ADMIN_DEV_BYPASS=1` in `.dev.vars` works on localhost only (see `auth.ts`).

## Snapshot

```jsonc
{
  "rev": 3,                         // meta.publish_rev (0 = never published). Draft: the rev the draft sits on.
  "text":  { "<key>": { "ar"?: "…", "en"?: "…" } },   // only the overridden locales
  "slots": { "<slot id>": { "src"?, "poster"?, "preview"?, "alt"?: { "ar"?, "en"? } } },
  "gallery": [ { "id", "src"?, "poster"?, "cat"?, "sub"?, "ratio"?, "date"?, "alt"?: {…}, "client"?, "hidden"?: true, "sort"? } ],
  "rings": { "<service>": ["<item id>", …] },          // whole list, ring order
  "clients": [ { "id", "name": { "ar", "en" }, "line"?: { "ar"?, "en"? }, "year"?, "url"? } ],
  "locks": {                         // DRAFT ONLY: every existing row's optimistic-lock rev
    "text": { "<key>": { "ar"?: 1, "en"?: 2 } }, "slots": { "<id>": 1 },
    "gallery": { "<id>": 1 }, "rings": { "<service>": 1 }, "clients": { "<id>": 1 }
  }
}
```

- An absent key, slot, locale, ring or field means the default applies.
- A published snapshot is built from `text_values.published`, `slot_values.published_json` and each row's
  `published_json`. A draft snapshot is built from the draft columns, leaving out rows with `state = 'deleted'`.
- The empty-string value `""` is a real value; it is not a reset.
- `isEmpty(snapshot)` is true when nothing is overridden. In that case P-06 serves the assets untouched (exact parity).
- `gallery` is ordered by `sort` ascending (items with no `sort` come last), then by `id`. `clients` is ordered by `id`.
- `locks` contains a row's rev even when its draft is NULL or the row is `deleted`, so a save can always send the
  rev it read.

## Keys (text_values)

Each text row is one `(key, locale)` pair. There are two kinds of key, and both live in the snapshot's `text`.

**I18N keys** (`registry.text`, 82 keys) are the keys of main.js's `I18N`, both locales. Each entry carries `page`
and `pages`, `section`, `uses` (`text` = element content, `label` = `data-i18n-label` attribute), `kind` and
`maxLength`.

**Fields** (`registry.fields`) are stored the same way but are not in I18N. Each one carries `table`, `path`,
`locales`, `minLength` and `maxLength`:

| key | locales | where the value goes (`path` into defaults) |
|---|---|---|
| `meta.<home\|about\|library>.title` | ar | `<title>` |
| `meta.<page>.description` | ar | `<meta name="description">` |
| `meta.<page>.ogTitle` | ar | `og:title`, and `twitter:title` mirrors it |
| `meta.<page>.ogDescription` | ar | `og:description`, and `twitter:description` mirrors it |
| `subcat.<svc>.<id>.name` | ar, en | `SUBCATS[svc][i].{ar,en}`, the subsection name (also the ring kicker) |
| `subcat.<svc>.<id>.desc` | ar, en | `SUBCATS[svc][i].desc`. **This is the ring line** under a service ring. |
| `subcat.<svc>.<id>.descShort` | ar, en | `SUBCATS[svc][i].descShort`, the phone ring line. It may be added where none exists yet. |
| `project.<i>.name` / `.desc` | ar, en | `PROJECTS[i].{ar,en}` / `.desc` (i is 0-based, the same index RINGS' `project` uses) |
| `project.<i>.tagline` / `.body` | ar, en | `PROJECTS[i].profile.tagline` / `.body` |
| `testimonial.<i>.name` / `.business` / `.quote` | ar, en | `TESTIMONIALS[i].*` (0-based). An anonymous one (`name: null`) can be given a name. |

- The meta keys are Arabic only. The served HTML is Arabic and nothing switches the head in English. They have
  `minLength` 1, so a page can never lose its title.
- `path` points at the `{ar, en}` holder in `defaults.json`. To merge a value (P-07b), create the holder when it is
  null or absent (descShort, an anonymous name), then set `holder[locale] = value`. The indexes in `path` are
  regenerated with the tables, so key off `key`, never off a stored `path`.
- A ring item's line comes from `SUBCATS` via the item's `sub`; every ring item has one. A `PROJECTS[i].desc` only
  shows on a ring when an item has a `project` and no `sub`, which none have today.
- Not editable here: SUBCATS `seed`, PROJECTS `date`, `cat`, `profile.url` and `shots`, CATS, RING_MARKS, AR_DIGITS.

**Kinds**
- `text`: one line of plain text. No line breaks and no control characters.
- `richline`: plain text whose only structure is `\n` (a line break). `\r`, other control characters and markup
  are not structure. The kind is decided by the default: `heroPara` and `rateAskPhone` today, and any field whose
  default contains `\n`.
- Values are always text, and `<`, `>` and `"` are refused in every value (see Validation). Use “ ” for quotes.

**Lengths.** `maxLength = ceil(longest default locale × 1.6)`, counted in UTF-16 code units (JS `.length`). For
`descShort` it is sized on the full `desc` when there is no short one. For a testimonial `name` it is sized on all
the names. The limit is the most FIT THE TYPE (`shrinkToFit`) can absorb, not a design target.

## Slots (slot_values)

The ids are `<page>.<kind>.<ordinal>` from `registry.slots`. `home.media.N` / `about.media.N` is the Nth
`<img src="assets/media/…">` in that page's markup, and `home.film.N` is `FILM_FRAMES[N-1]`. A value is an object
holding at least one of these fields:

| field | allowed on | value |
|---|---|---|
| `src` | every slot | an image: `assets/media/<file>` or `https://media.aliphcreative.com/<path>`, ending in `.webp`, `.jpg`/`.jpeg`, `.png` or `.avif` |
| `poster` | slots whose registry entry has `preview` (the reels and BTS videos) | an image, under the same rule |
| `preview` | the same slots | `https://media.aliphcreative.com/<path>.mp4` or `.webm` |
| `alt` | every slot | `{ar?, en?}`, plain text, at most 300 characters each |

The rules for every URL: at most 512 characters, no `..`, no query string, and no other origin. `srcset` is not
editable, because the markup has none. Any other field returns 400. A draft of `null` resets the slot to the
markup's default.

## Rings (ring_picks)

- `rings.<service>` (design, photo, tech) is the whole list of item ids in ring order. An item id is the MEDIA file
  name (`f`), `shot` for the tech ring's site screenshots, or a `gallery_items.id` for an upload.
- The list holds 1 to 24 distinct ids. Each must be one of that ring's default items, a MEDIA file of the same
  category, or an active gallery item of that category (the caller passes that lookup to `validateRing`).
- Resolving an id when merging (P-07b, P-08): first the service's default RINGS entry with that id (it keeps its
  `sub`, `open`, `project` and `full`), then a MEDIA entry, then a gallery item. For the last two, `sub` comes from
  the item, and for a gallery video `open` is its file. A MEDIA or gallery pick always gets a full picture URL,
  never `assets/media/<f>` (only the default ring entries are in the bundle; five photo posters are on R2 alone):
  the upload's `src` (image) or `poster` (video), else `R2/img/<f>` or `R2/poster/<p>`, the archive's `full`. A
  video pick plays its `src` when one is set, else `R2/video/<f>`.

**Resetting a ring to its default** is a staged removal. `item_ids_json` is NOT NULL, so it cannot be a NULL draft.
It works like gallery and clients do (migration `0002_ring_picks_state.sql`):

```sql
-- set (or re-set) a list: the row becomes active
INSERT INTO ring_picks (service, item_ids_json, state, updated_by) VALUES (?1, ?2, 'active', ?3)
  ON CONFLICT (service) DO UPDATE SET item_ids_json = ?2, state = 'active', rev = rev + 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_by = ?3
  WHERE ring_picks.rev = ?4;                       -- 0 rows changed = conflict (someone saved first)
-- reset to main.js's RINGS: staged until publish; item_ids_json keeps the last list and is ignored
UPDATE ring_picks SET state = 'deleted', rev = rev + 1, updated_at = …, updated_by = ?2 WHERE service = ?1 AND rev = ?3;
```

The draft snapshot leaves a `deleted` ring out, so the default shows. On publish, an active ring gets
`published_json = item_ids_json`, and a deleted one gets `published_json = NULL`. Publish may then delete a row
that is both deleted and unpublished.

## Gallery (gallery_items) and clients

- The item's `id` is the MEDIA `f` when the row overrides a default piece (to hide it, re-file it, give it alt
  text, or give it a client), and an id matching `[A-Za-z0-9][A-Za-z0-9._-]{0,127}` for an upload.
- An upload needs `src` and `cat`. An override leaves NULL every column it keeps from MEDIA.
- `cat` is design, photo or tech. `sub` must be one of `SUBCATS[cat]`, where cat is the item's own `cat` or, for
  an override, its MEDIA category.
- `ratio` is width/height, in the range (0, 10]. `date` is `YYYY-MM` or `YYYY-MM-DD`. `hidden` is a boolean.
  `sort` is a finite number.
- Mapping to MEDIA: `src` ≈ `f`, `poster` ≈ `p` (set means video), `cat` ≈ `c`, `ratio` ≈ `r`, `date` ≈ `d`.
- **Images and videos (P-10b).** An item is a video when it overrides a MEDIA row with `v`, or when it is an upload
  carrying `poster`. A video's `src` is the film main.js plays (`data-film`, the ring preview, the lightbox), so it
  must be an mp4/webm on `media.aliphcreative.com`, and its `poster` is the picture (an image). Anything else is an
  image: `src` is an image and `poster` is refused (400 `only a video has a poster`). An upload whose `src` is a
  video and has no `poster` gets 400 on `poster`. An override may set either field alone: main.js falls back per
  field, so a video tile shows `poster || R2/thumb/<p>` (lightbox `poster || R2/poster/<p>`) and plays
  `src || R2/video/<f>`, and an image tile shows `src || R2/thumb/<f>` (lightbox `src || R2/img/<f>`).
  Upload tiles use the full file as the thumbnail (there is no `thumb/` derivative for an upload).
- `published_json` is exactly `JSON.stringify(galleryItemFromRow(row))`, so an unchanged row reads the same in
  both states. A row with `state = 'deleted'` is a removal staged until publish. For an override, removing the row
  means going back to the default piece. Use `hidden` to take a default piece off the site.
- Clients: `{id, name: {ar, en}, line?: {ar?, en?}, year?, url?}`, both names 1 to 80 characters. Migration
  `0003_clients_details.sql` added the optional columns `line_ar`, `line_en` (one short line), `year` (INTEGER,
  NULL or 1000-9999, a CHECK) and `url` (the client's https website, stored normalised). A NULL column is left out
  of the object, and `line` is left out when both languages are NULL, in this key order: id, name, line, year,
  url. So a client with no details is exactly `{id, name}`, as before 0003. `published_json` is the same object
  (`JSON.stringify(clientFromRow(row))`; every client read selects `store.ts CLIENT_COLS`).
- No client rows ship: no migration, `defaults.json` or runtime fixture creates one (tests/clients/guard.test.ts).
  The boss creates clients in the admin after launch.

## Clients API (worker/src/clients, F5)

Admin only (Access), English UI. Every write: Origin must equal the request origin (else 403), then
`validateClient`, then the write, then an `audit` row. Clients are drafts until publish, like everything else.

- `GET /api/admin/clients` → `{clients: [AdminClient]}`, the ACTIVE rows only, ordered by `name_en` (case-insensitive),
  then `id`. `AdminClient` = the snapshot client (`{id, name, line?, year?, url?}`) plus `rev` (the lock to send
  back), `published` (a published copy exists), `changed` (the draft differs from the published copy; true when
  never published) and `pieces` (active draft `gallery_items` with this `client_id`, hidden ones included).
- `POST /api/admin/clients` `{name: {ar, en}, line?: {ar?, en?}, year?, url?}` → `201 {client: AdminClient}`. The
  Worker makes the id: a slug of `name_en` (accents dropped, lower case, runs of anything else → `-`; `client`
  when nothing Latin is left), `-`, and 4 random `[a-z0-9]`. So it matches `[a-z0-9-]`, is at most 40
  characters, and never changes. A collision with any row (deleted ones too) draws a new suffix. A body carrying
  `id` is a 400 (`field: "id"`). Audit `client.create`, target = the id.
- `PUT /api/admin/clients/<id>` `{rev, name, line?, year?, url?}` → `200 {client}`. Replaces every detail with exactly
  what is sent (a detail left out or blank becomes NULL), only on the ACTIVE row with that `rev`; `rev` + 1. A
  missing or bad `rev` is a 400 (`field: "rev"`), a body `id` other than the path's a 400 (`field: "id"`). A stale
  rev, an unknown or a deleted id: `409 {error, current}` (`current` = the AdminClient now, or `null`). Audit
  `client.update`.
- `DELETE /api/admin/clients/<id>?rev=<n>` → `200 {deleted: id}`. Stages the removal (`state = 'deleted'`, `rev` + 1;
  publish takes it off the site) in ONE statement whose WHERE also requires that no ACTIVE draft `gallery_items`
  row names the client, so an assignment cannot slip in between a check and the write. Hidden items count; deleted
  ones do not. When that guard stops it: `409 {error: "in use", count, message: "7 pieces use this client"}`.
  A stale rev, unknown or already deleted id: `409 {error, current}`. A missing or bad `rev`: 400. Audit
  `client.delete`.
- `POST /api/admin/gallery/assign` `{client: <id> | null, items: [{id, rev}]}` → `200 {items}` (the pieces as
  `GET /api/admin/gallery` draws them, in the order sent). Bulk assignment (worker/src/gallery/assign.ts): 1 to 200
  pieces get that client, or none with `null`. `rev` is the one the grid read (0 = a default with no row yet: it
  gets a bare override row, id + `client_id`). A piece is any id the grid lists except an upload staged for
  deletion. 400: `items` (not a list of 1 to 200), `items.N` (bad entry, duplicate, not a piece), `client` (not an
  id or null, unknown, or deleted). ALL OR NOTHING: one D1 batch led by the audit row (`gallery.assign`, target =
  the client id or NULL), whose CHECK fails, and rolls everything back, when any listed rev is stale or the client
  stopped being active. A stale rev: `409 {error, stale: [ids], current: [items]}` and nothing written. A piece
  that already has the client is only rev-checked; clearing a default with no row writes nothing.

## Validation (every write, server side)

1. Run the input through `validate.ts`. On `{ok:false}`, return `badRequest(result)` (HTTP 400,
   `{"error", "field"}`) before touching D1. These all return 400: an unknown key, slot, ring, ring item or gallery
   field; a locale the entry does not list; a wrong kind; a length outside `[minLength, maxLength]`; a URL outside
   the allowed origins.
   Also 400 `{"error": "use “ ” instead of \"; no < or >", field}`: a `<`, `>` or `"` in any text value
   (I18N keys, fields, `meta.*`, richlines), any `alt` (slots and gallery) or a client name. Why: the Worker escapes
   what it injects, but main.js does not only set `textContent`. It builds markup with `innerHTML` from table text
   (renderLibrary `fill()` writes the SUBCATS name) and puts I18N values inside double-quoted attributes
   (`aria-label` on the lightbox and the thumbs, renderServiceSections). The boot merge feeds published values into
   those tables, so these three characters are refused at the door instead of escaped at each sink. `'` and `&` are
   allowed: no sink is single-quoted, and an entity decodes to text. No default value contains them.
   Clients (`validateClient`, C-02): `name.ar` and `name.en` required, 1 to 80 characters. The optional details
   count as absent when missing, `null` or blank (`""` or spaces only), and are then left out of the stored object:
   - `line.ar` / `line.en`: one line, at most 120 characters, no line break or control character, and no `<`, `>`
     or `"` (same message as above). 400 `field: "line.<locale>"`; a `line` that is not an object: `field: "line"`.
   - `year`: an integer 1000 to 9999, or a 4-digit string (`"2024"`, stored as the number 2024). Anything else:
     400 `field: "year"`.
   - `url`: must parse as a URL with protocol `https:` and no user name or password, at most 2048 characters. It is
     stored as `new URL(u).href` (lower-case host, trailing `/`, `<`, `>` and `"` percent-encoded). `http:`,
     `javascript:`, `data:`, a bare host or garbage: 400 `field: "url"`.
   Other keys in a client body are ignored.
2. Write with the rev the client read (`locks`) using `… WHERE rev = ?` and `rev = rev + 1`. Zero rows changed
   means a conflict: return 409 with the current row.
3. Text and slot drafts reset with `draft = NULL` / `draft_json = NULL`. Gallery items, rings and clients reset or
   remove with `state = 'deleted'`.
4. Append an `audit` row (`actor` = the Access email, `action` e.g. `text.save`, and `target` = the key, slot or id).

## Served HTML (render/text.ts, P-06)

`/`, `/index.html`, `/about*`, `/library*` (GET, 200, `text/html`) are rewritten while streaming, and only when the
published snapshot is not empty. An empty store, or a D1 read that fails, serves the assets response untouched.

- `[data-i18n="k"]` gets the **Arabic** published value of an I18N key `k` as its content, and
  `[data-i18n-label="k"]` gets it as `aria-label`. An EN-only override changes no HTML; main.js applies it from the
  blob. `meta.*` and table fields never reach these elements.
- `meta.<page>.title` sets `<title>`. `og:title` and `twitter:title` take `meta.<page>.ogTitle`, or the title
  override when there is no ogTitle override. The defaults are equal, so a title edit carries to the share card.
  `description` / `ogDescription` work the same way.
- `<script type="application/json" id="aliph-content">` holds the published snapshot (`/api/content`'s body, no
  `locks`). It sits immediately before `<script src="main.js">`, once per page. `<`, `>`, `&`, U+2028 and U+2029 are
  `\u`-escaped, so a value can never close the script.
- A rewritten page carries `ETag: W/"<asset etag>-r<publish_rev>"` and answers `If-None-Match` itself. The asset's
  own 304 is never passed on for a rewritten page.
- Published media slots (render/slots.ts, P-06b) go into the same pass. `<page>.media.N` is the Nth
  `<img src="assets/media/…">`, counted the way gen-defaults counts. Its `src` becomes `poster` on a slot that has a
  preview, and `src` otherwise. `alt` becomes `alt.ar`, and the enclosing `<figure data-preview>` gets `preview`.
  Each element is checked against its registry default first; one that no longer matches is skipped with a
  `console.warn`. `home.film.N` has no markup and is left to the main.js merge.
- The `@static:*` SEO regions (render/regions.ts, P-08) go into the same pass. The tables are `defaults.json` with
  the snapshot merged in by `worker/src/shared/merge.mjs` `mergeContent(T, snapshot)`, the ONE merge main.js's boot
  hook copies (P-07b). `pageRegions(T)` renders them with build_static's own renderers. A region is replaced only
  when its output differs from the default's, between its markers, with the exact bytes `fill()` writes. So the
  markup never changes, and a snapshot that touches no region (EN-only, head, slots, rings) leaves them byte-identical.
  The merge, in place (arrays spliced and pushed, never reassigned):
  - An I18N key sets `I18N[key][locale]`. A field key sets the holder at `fieldPath(T, key)`. That path is derived
    from the key alone (main.js has no registry), and a test pins it equal to `registry.fields[].path`.
  - Gallery: a row whose `id` is a MEDIA `f` overrides that row in place (`cat`→`c`, `ratio`→`r`, `date`→`d`; a
    `poster` sets `v: 1`; `src`/`poster` are full URLs and stay under those names, so `f`/`p` keep the file names).
    `hidden` removes the row. Any other id is an upload, appended as `{f: id, c: cat, r: ratio ?? 1, d: date ?? null,
    src, poster?, v?, sub?, alt?, client?}`. Hidden uploads and uploads without `src` and `cat` are skipped.
  - Rings, slots and film frames are not merged here (no region reads them); the boot merge does them.

## Publish (publish.ts, cache.ts, P-09)

`publish(db, by)` (`by` = the Access email) makes the whole draft live and returns `{rev, publishedAt, snapshot}`.
The editor team's `POST /api/admin/publish` calls it. It writes everything in ONE D1 batch:

- `text_values.published = draft` and `slot_values.published_json = draft_json`, for every row.
- `gallery_items` and `clients`: `published_json` = `JSON.stringify(galleryItemFromRow(row))` /
  `JSON.stringify(clientFromRow(row))` for an active row, and `NULL` for a `deleted` one. The rows stay, so a
  deleted row is invisible in both states, and saving it with `state = 'active'` brings it back.
- `ring_picks.published_json` = `item_ids_json` when active, `NULL` when deleted.
- `meta.publish_rev` + 1, a fresh `meta.publish_id` (random), a `revisions` row (`id` = the new rev,
  `snapshot_json` = the published snapshot, equal to `/api/content`'s body), and an `audit` row
  (`action = 'publish'`, `target = 'rev:<n>'`).

The batch rolls back, and publish starts over from a fresh read, when a draft row changed after publish read it, or
when another publish took the rev. Two concurrent publishes therefore both land, as revs n+1 and n+2. After 4 lost
races it throws `PublishConflictError`; answer 409. A draft save must bump `rev` (see Validation), because that
is how publish notices it.

**Cache.** A publish is identified by `publish_rev` + `publish_id`, and everything is cached under that version, so
nothing is ever purged:

- In-isolate memo: the published snapshot, trusted for `CONTENT_CACHE_TTL_MS` (unset = 5000 ms) without asking D1.
  After that, one row read re-validates it. The isolate that ran `publish()` switches at once; other isolates switch
  within the TTL. If D1 fails after a snapshot was cached, the cached one keeps being served.
- Cache API (per colo; stores nothing on `*.workers.dev`): the snapshot per version, and each rewritten page per
  version + asset ETag, under `<origin>/__aliph-cache/`.
- `CONTENT_CACHE_TTL_MS = "0"` turns all caching off, so every request reads D1. The test config uses it.
