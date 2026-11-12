-- ══════════════════════════════════════════════════════════════════
-- aliph-admin — the content store behind the admin dashboard.
--
-- main.js's tables stay the DEFAULTS. Every row here is an OVERRIDE of a
-- default (same key / slot / media file name) or an ADDITION; an empty store
-- is today's site, byte for byte (tests/platform/parity*.ts).
--
-- Draft and published live side by side in each row: the editor writes the
-- draft side, publish() (worker/src/publish.ts) copies draft → published for
-- every row in ONE batch, bumps meta.publish_rev and appends a revision.
--   text_values / slot_values  draft + published columns
--   gallery_items / ring_picks / clients
--                              the plain columns ARE the draft; the row's
--                              published copy is `published_json` (NULL =
--                              not live). state 'deleted' is a removal staged
--                              in the draft: publish turns published_json NULL.
--
-- `rev` on a row is its optimistic lock: a save sends the rev it read and the
-- UPDATE matches `WHERE rev = ?` and sets rev = rev + 1. It is NOT the
-- publish rev (that is meta.publish_rev, = revisions.id).
-- Times are ISO-8601 UTC text; `*_by` / `actor` are the Access email.
-- ══════════════════════════════════════════════════════════════════

-- One editable string in one language. `key` is an I18N key or a registry
-- key (worker/src/generated/registry.json). draft/published NULL = "use the
-- default"; an empty string is a real (empty) value.
CREATE TABLE text_values (
  key         TEXT    NOT NULL,
  locale      TEXT    NOT NULL CHECK (locale IN ('ar', 'en')),
  draft       TEXT,
  published   TEXT,
  rev         INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by  TEXT    NOT NULL,
  PRIMARY KEY (key, locale)
) WITHOUT ROWID;

-- One media holder (`<page>.<kind>.<ordinal>`, see the registry): src,
-- srcset, poster, alt… as JSON, because each kind carries different fields.
CREATE TABLE slot_values (
  slot            TEXT    PRIMARY KEY NOT NULL,
  draft_json      TEXT    CHECK (draft_json IS NULL OR json_valid(draft_json)),
  published_json  TEXT    CHECK (published_json IS NULL OR json_valid(published_json)),
  rev             INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by      TEXT    NOT NULL
) WITHOUT ROWID;

-- The names the gallery credits. Created before gallery_items, which
-- references it.
CREATE TABLE clients (
  id              TEXT    PRIMARY KEY NOT NULL,
  name_ar         TEXT    NOT NULL,
  name_en         TEXT    NOT NULL,
  state           TEXT    NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'deleted')),
  published_json  TEXT    CHECK (published_json IS NULL OR json_valid(published_json)),
  rev             INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by      TEXT    NOT NULL
) WITHOUT ROWID;

-- One piece in the library / gallery. `id` = the MEDIA entry's `f` when the
-- row overrides a default piece (hide it, re-file it, give it alt text), or a
-- generated id for an upload. Mirrors MEDIA: src ≈ f, poster ≈ p (set ⇒
-- video), cat ≈ c, ratio ≈ r, date ≈ d (YYYY-MM-DD or NULL).
CREATE TABLE gallery_items (
  id              TEXT    PRIMARY KEY NOT NULL,
  src             TEXT,
  poster          TEXT,
  cat             TEXT,
  sub             TEXT,
  ratio           REAL    CHECK (ratio IS NULL OR ratio > 0),
  date            TEXT,
  alt_ar          TEXT,
  alt_en          TEXT,
  client_id       TEXT    REFERENCES clients (id) ON DELETE SET NULL,
  hidden          INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  sort            REAL,
  state           TEXT    NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'deleted')),
  published_json  TEXT    CHECK (published_json IS NULL OR json_valid(published_json)),
  rev             INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by      TEXT    NOT NULL
) WITHOUT ROWID;

CREATE INDEX gallery_items_cat_sort ON gallery_items (cat, sub, sort);
CREATE INDEX gallery_items_client ON gallery_items (client_id);

-- A service ring's picks (RINGS in main.js: design / photo / tech). The list
-- is a JSON array of item ids (a MEDIA `f` or a gallery_items id), in ring
-- order; the whole list is one value because it is edited as one.
CREATE TABLE ring_picks (
  service         TEXT    PRIMARY KEY NOT NULL,
  item_ids_json   TEXT    NOT NULL CHECK (json_valid(item_ids_json) AND json_type(item_ids_json) = 'array'),
  published_json  TEXT    CHECK (published_json IS NULL OR json_valid(published_json)),
  rev             INTEGER NOT NULL DEFAULT 1,
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by      TEXT    NOT NULL
) WITHOUT ROWID;

-- Every publish, whole. id IS the publish rev (1, 2, 3 …): publish() inserts
-- id = meta.publish_rev + 1 in the same batch that bumps it, so two
-- publishes racing for the same rev collide on the primary key and the
-- second one fails instead of interleaving. Restoring = re-drafting a
-- snapshot and publishing it again, never rewriting history.
CREATE TABLE revisions (
  id              INTEGER PRIMARY KEY NOT NULL CHECK (id > 0),
  published_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_by    TEXT    NOT NULL,
  snapshot_json   TEXT    NOT NULL CHECK (json_valid(snapshot_json))
);

CREATE TRIGGER revisions_no_update BEFORE UPDATE ON revisions
BEGIN
  SELECT RAISE(ABORT, 'revisions is append-only');
END;

CREATE TRIGGER revisions_no_delete BEFORE DELETE ON revisions
BEGIN
  SELECT RAISE(ABORT, 'revisions is append-only');
END;

-- Who did what. Append-only for the same reason as revisions.
-- action: e.g. 'text.save', 'slot.save', 'gallery.add', 'publish';
-- target: the key / slot / id it touched; detail: optional JSON.
CREATE TABLE audit (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor   TEXT    NOT NULL,
  action  TEXT    NOT NULL,
  target  TEXT,
  detail  TEXT    CHECK (detail IS NULL OR json_valid(detail))
);

CREATE INDEX audit_at ON audit (at);

CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit
BEGIN
  SELECT RAISE(ABORT, 'audit is append-only');
END;

CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit
BEGIN
  SELECT RAISE(ABORT, 'audit is append-only');
END;

-- Store-wide values. publish_rev 0 = nothing ever published = parity.
CREATE TABLE meta (
  k  TEXT PRIMARY KEY NOT NULL,
  v  TEXT NOT NULL
) WITHOUT ROWID;

INSERT INTO meta (k, v) VALUES ('publish_rev', '0');
