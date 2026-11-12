-- ══════════════════════════════════════════════════════════════════
-- ring_picks gets the `state` gallery_items and clients already have
-- (P-05, worker/CONTENT_API.md "Rings").
--
-- item_ids_json is NOT NULL, so a draft could not say "this ring goes back
-- to main.js's RINGS" without inventing a magic list. 'deleted' is that:
-- the override is removed in the draft (the default ring shows in the draft
-- snapshot), and publish turns published_json NULL. Setting a list again
-- makes the row 'active'. item_ids_json keeps the last list meanwhile and is
-- ignored while the row is 'deleted'.
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE ring_picks
  ADD COLUMN state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'deleted'));
