# Instructions: fix round 2 for the Aliph admin (for a Claude session working from GitHub)

You are fixing the open items in `docs/fixes/REQUIRED-FIXES.md` (from two QA rounds). The admin dashboard is
already live on aliphcreative.com; these are "fix soon" and "cosmetic" items, no launch-blockers are open.

## Ground rules (read first, they are not optional)
1. **Branch:** start from `admin-dashboard` (NOT `main`; `main` on GitHub is old). Make a branch per batch, e.g.
   `fix/batch-1-phone-admin`, and open a pull request into `admin-dashboard`. Never push to `main` or `admin-dashboard`
   directly, never force-push, never rewrite history.
2. **Never deploy.** Do not run `wrangler deploy`, `wrangler login`, or anything with `--remote`. `wrangler.toml` holds
   the REAL live database id and login settings. Obaida deploys from his PC after reviewing your PR.
3. **Never touch the live site** (aliphcreative.com): no requests to `/admin` or `/api/admin` there.
4. **No secrets in commits.** `.dev.vars` and `.env*` are git-ignored; keep it that way. Never commit `.orchestration/`.
5. **Do not create client rows** anywhere (seed, migration, defaults). The studio boss creates clients himself.
6. **Small and safe:** one fix = one commit (or a few), each with a test that fails before and passes after when the
   item can be tested. No new dependencies, no refactors beyond the fix, no new migration (if one seems needed, stop
   and write why in the PR).

## Project facts
- Static site in `prototype/` (Arabic-first, RTL, English via toggle) served by a Cloudflare Worker
  (`worker/src/index.ts`). Content and admin API contract: `worker/CONTENT_API.md`. House style and design rules:
  `HANDOFF.md` (search "FIT THE TYPE" and the design sections).
- Admin (English only): dashboard `prototype/admin/index.html`, in-place editor `prototype/admin/editor.js` +
  `editor-media.js` + `editor.css`, gallery `prototype/admin/gallery/*`. Reuse existing admin classes.
- Public pages must stay **byte-identical** unless the item is about a public page. In `prototype/style.css` only ADD
  scoped rules at the end; never change existing rules. After changing anything `main.js` renders, run
  `node resources/build_static.mjs`.
- Validation already refuses `<`, `>` and `"` in text fields; keep every write path: Origin check, validate,
  rev-locked write (409), audit row.

## Setup and checks
```bash
npm install
printf 'ADMIN_DEV_BYPASS=1\n' > .dev.vars        # local admin without login; localhost only, git-ignored
npx wrangler d1 migrations apply aliph-admin --local
npm run typecheck
npm run check:site
npm test                                          # ~620 tests; if the first run crashes the pool, run it once more
```
Local server for browser checks: `npx wrangler dev --local --port 8787` (then `/admin/`, `/admin/edit/home`,
`/admin/gallery/`). Browser scripts use `playwright-core`; helpers in `tests/qa/lib/`, examples in `tests/qa/*.mjs`,
`tests/blockers/blockers.mjs`. If your environment has no browser, still write the test and say in the PR that it
was not run.

All three checks (`typecheck`, `check:site`, `npm test`) must be green on every PR.

## Order of work (one PR per batch, stop after each batch and report)
1. **Batch 1, admin on the phone** (the boss uses an iPhone): touch targets ≥ 44 px (U-02), gallery grid buried under
   the ring panels (U-08), dialogs that do not fit 390 px, anything in the list tagged `webkit` that is admin layout.
2. **Batch 2, admin clarity:** where Publish is (U-01), unclear or raw messages (upload errors, "Offline", the
   300 MB limit not named, raw keys like "hero1" in the popover heading), failed-upload rows, the Saved/Draft chip.
3. **Batch 3, visitor pages:** lightbox swipe on phones (F-13), long client name in 2 lines (F-11), contrast items,
   layout shift on /about (F-16). Public byte changes are expected here: say exactly what changed in the PR.
4. **Batch 4, the remaining cosmetic items.**

Skip, and list in the PR as "needs a real device", anything marked **Verify: real iPhone** that you cannot prove in
code, especially **U-07 (Arabic font without dots in the test browser)**: do NOT change the font for it.

## PR description (keep it short)
- The items fixed (ids), one line each, with the test that proves it.
- The items skipped and why.
- Output lines of `typecheck`, `check:site`, `npm test`.
- Any change to public pages, exactly.

The screenshot paths in REQUIRED-FIXES.md point to Obaida's PC and are not in the repo; use the "Where" and "Likely
cause" lines instead.
