-- ══════════════════════════════════════════════════════════════════
-- clients get the details the public Clients index and the client view
-- show (F5, Option 3; worker/CONTENT_API.md "Gallery and clients").
--
-- All four are optional; NULL = not given, and an absent column stays out
-- of the client's JSON (store.ts clientFromRow), so a client saved before
-- this migration publishes byte-for-byte what it did before.
--   line_ar / line_en  one short line about the client (≤ 120 chars, checked
--                      by validate.ts)
--   year               the year the work started, 4 digits
--   url                the client's website, https only, stored normalised
--                      (new URL(u).href, checked by validate.ts)
--
-- Adds columns only. No client rows: the boss creates clients himself.
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE clients ADD COLUMN line_ar TEXT;
ALTER TABLE clients ADD COLUMN line_en TEXT;
ALTER TABLE clients ADD COLUMN year INTEGER CHECK (year IS NULL OR year BETWEEN 1000 AND 9999);
ALTER TABLE clients ADD COLUMN url TEXT;
