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

## Routes

| route | who | answers |
|---|---|---|
| `GET /api/content` (= `?state=published`) | public | the published snapshot. `ETag: "<publish_rev>"`, `Cache-Control: public, max-age=60`. `If-None-Match` with the current tag (weak, a list, or `*`) gets a `304` after one meta read. |
| `GET /api/admin/content` | Access | the **draft** snapshot plus `locks`, with `Cache-Control: private, no-store`. **Editor and gallery screens use this one.** |
| `GET /api/content?state=draft` | Access | the same as above. The route is not under `/api/admin`, so the handler calls `verifyAccess` itself. |
| `?state=` anything else | | `400 {"error"}` |
| non-GET/HEAD on `/api/content` | | `405` |

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
  "clients": [ { "id", "name": { "ar", "en" } } ],
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
- Values are always text. `<b>` is accepted and shown as those three characters. The Worker escapes everything it
  injects (P-06), and main.js sets `textContent`. Neither ever produces HTML from a value.

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
  the item, and for a gallery video `open` is its file.

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
- `published_json` is exactly `JSON.stringify(galleryItemFromRow(row))`, so an unchanged row reads the same in
  both states. A row with `state = 'deleted'` is a removal staged until publish. For an override, removing the row
  means going back to the default piece. Use `hidden` to take a default piece off the site.
- Clients: `{id, name: {ar, en}}`, both names 1 to 80 characters. `published_json` is the same object.

## Validation (every write, server side)

1. Run the input through `validate.ts`. On `{ok:false}`, return `badRequest(result)` (HTTP 400,
   `{"error", "field"}`) before touching D1. These all return 400: an unknown key, slot, ring, ring item or gallery
   field; a locale the entry does not list; a wrong kind; a length outside `[minLength, maxLength]`; a URL outside
   the allowed origins.
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
