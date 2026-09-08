# Aliph Portfolio — Handoff

_Updated 2026-09-01. Read this first._

> ## 🟢 State on 2026-09-01: BOTH ROUNDS ARE COMMITTED AND LIVE; THE FORM'S STATE IS UNVERIFIED
>
> ✅ **THE SITE IS CURRENT — version `d3113117-385a-450f-affe-bacd11786869`.**
> Both 2026-09-01 rounds are live: the dashes / ring kicker / phone copy round
> and the 2026-09-01b round (hero notes, the language pill's wash, the ring and
> the marks enlarged). It supersedes `76ec4b38-0a01-4860-9454-14fdcc434f01`,
> which had been live since 2026-08-30c.
>
> ✅ **They are ONE COMMIT, `07050bf`, and that is deliberate.** The two rounds
> interleave hunk by hunk in `main.js` and `style.css` and cannot be separated;
> the commit message names both bodies of work rather than describing one and
> carrying the other silently, which is the `ef173c5` mistake. ⚠️ **The
> 2026-09-01b round was NOT reviewed by the session that committed it** — it was
> verified only to the extent that the combined tree parses and renders.
>
> ✅ **Verified live the way this file demands** — browser UA, cache-buster,
> `-L`: `/`, `/about`, `/library` all **200**, `/index.html` 307s to `/`, and
> `style.css` and `main.js` are **md5-identical** to the working tree. All three
> HTML files came back byte-identical this time, with no analytics beacon delta.
> Rendered on the live domain: **zero dashes** on all three pages, the ring
> kicker painting, and the oval's label **0.67px** off centre against the
> 2.83px it was.
> ⚠️ **The deploy uploaded exactly 5 files of 205** — the three pages,
> `main.js`, `style.css` — which is the right shape for a round of CSS and copy
> edits. The trigger list names only `aliphcreative.ceo-6c6.workers.dev` and
> that is CORRECT here: the root `wrangler.toml` declares no `routes`, so the
> custom domain stays dashboard-managed and is not touched.
>
> ✅ **PUSHED, and `origin/main` is in sync at `2f1d0a3`.** Twenty-two commits
> went out together — the whole backlog since 2026-08-26, not just this round.
> ⚠️ **Deploying does NOT push.** wrangler ships the working tree and leaves git
> completely alone; the two went out minutes apart here only because both were
> asked for. A deployed site says nothing about the state of the remote.
>
> 🔴 **`github.com/Aliph-Creative-Agency/AliphPortfolio` IS A PUBLIC REPOSITORY,
> AND THIS FILE IS IN IT.** `visibility: public`, confirmed against the GitHub
> API on 2026-09-01, and public since at least 2026-08-26. **THIS FILE IS THE
> EXPOSURE.** It is 374 KB of internal operations notes: what broke, what the
> agency asked for and then reversed, their instructions quoted verbatim,
> clients named with dates and commentary, and the write-ups of two security
> incidents — including the one titled *"Refuse to commit a service-account
> key."*
>
> ⚠️ **SO WRITE EVERY ENTRY AS IF IT WERE PUBLISHED, BECAUSE IT IS.** Concretely,
> the conventions this file already follows are load-bearing rather than stylistic
> and must be kept: **truncate every identifier** — `1EMJApB2Rh…`, `17EV8437…`,
> `sheet-writer@aliph-feedback…` — because a truncated id is not a working link
> and a full one is; **never paste a key, a token or a `.env`**; and **use a
> placeholder** in setup docs the way `feedback-worker/SETUP.md` writes
> `THIS_LONG_ID`. ✅ Audited before the 2026-09-01 push: zero full-length
> sheet-id-shaped tokens in the whole 22-commit range, no key files, and every
> `PRIVATE_KEY` hit a variable NAME in code or docs. That result is what made the
> push safe — it is not a guarantee about the next one.
>
> ⚠️ **A near-miss on a private repo is a caught mistake; on a public one it is
> permanent.** History can be rewritten, but not un-cloned and not un-indexed.
>
> 🔴 **SOMETHING ELSE WROTE THIS FILE DURING THE 2026-08-30c SESSION, AND IT
> HAS NOT BEEN RECONCILED. READ THIS BEFORE EDITING.** At that session's start
> the working tree's header read *"🟡 State on 2026-08-30: THE FORM IS LIVE,
> RESTYLED AND STILL CLOSED; THE SITE IS BEHIND"*, while `HEAD` (`6206362`,
> *"Record that the form is open"*) already read *"🟢 … THE FORM IS OPEN AND
> TAKING ANSWERS"*. Part-way through the session the working copy acquired the
> `HEAD` version of that header on its own. **Nothing was verified lost** — every
> section written that session is still present — but the file was being written
> from two places at once and no one has checked the two versions line by line.
> ⚠️ **So the header's claim that THE FORM IS OPEN AND TAKING ANSWERS is NOT a
> claim this session verified.** The 2026-08-30c work never touched the form.
> Probe `/api/status` before repeating it to anyone.
> ⚠️ **`git status` has shown `M HANDOFF.md` since before that session began**,
> so the working tree already differed from `HEAD` at the start. **Diff the
> working copy against `HEAD` and settle it before the next commit**, or one
> side's edits go in the bin. This is the same lesson as *"the local clone was
> eight commits stale, and it was believed"* — clean is not up to date.
>
> ✅ **`feedback.aliphcreative.com` IS LIVE** — `feedback-worker/`, a THIRD
> deployable beside the site and the chat, version
> `fe8b50ba-17a3-4dd9-9573-179b1412cc13`. The custom domain and its DNS
> record were created by the deploy itself. **The site was untouched by it**:
> a separate deployable, on its own version line. (The site has since moved
> to `950f0645-…` under its own deploy — see below.)
>
> ✅ **THE RESTYLE IS DEPLOYED — version `5966511b-dc24-4cc1-b707-cada1d55a6c8`.**
> The type is at the site's scale, the option boxes are a ruled list, and the
> double aliph closes the thank-you. Verified live: `style.css` is md5-identical
> to the working tree, the Bold woff2 answers 200, the dropped Regular answers
> **404**, and the body rule reads `0.92rem / 700 / 1.85`.
>
> 🔴 **THE EDGE WAS SERVING A REPLACED CLIP FOR A WEEK, AND `HEAD` SAID IT
> WAS FINE.** A plain GET of `media.aliphcreative.com/video/bts-29.mp4`
> returned the OLD 1.14 MB watermarked clip — `cf-cache-status: HIT`, `Age:
> 616452`, held under `public, max-age=31536000, immutable` — while a `HEAD` of
> the same URL answered with the NEW object's ETag and length. **HEAD and GET
> are separate edge entries**, which is how the 2026-08-27 swap was recorded as
> "verified live" and stayed broken. `import_bts.py` and `thumb_media.py` no
> longer send `immutable`, and `about.html` carries `?v=2` on bts-29.
> 🔴 **STILL OWED, AND RE-MEASURED 2026-08-30c: THE EDGE IS STILL
> SERVING THE OLD CLIP.** A plain GET with no query returns **1,146,494
> bytes**, `cf-cache-status: HIT`, `Age: 643933` (~7.5 days and simply
> ageing — `max-age` is a year). `?v=2` returns the right **4,273,402**
> bytes, `REVALIDATED`.
> 🔴 **SO DO NOT REMOVE THE `?v=2` YET.** It is currently the only
> reason a visitor gets the correct video. The order is: purge, re-verify
> with an unmodified GET, and only then take the busters off.
> 🔴 **THIS MACHINE CANNOT PURGE IT.** `wrangler whoami` lists
> `zone (read)`; a purge needs Zone.Cache Purge (write). It is the dashboard
> (Caching → Configuration → Purge Custom URL) or a new scoped API token.
> **Verify any replace-in-place with an unmodified GET and a hash of the
> BODY** — a cache-buster is a different cache key and proves nothing.
>
> ✅ **THE SITE IS CURRENT — version
> `76ec4b38-0a01-4860-9454-14fdcc434f01`, the fourth deploy of 2026-08-30c.
> THE RING IS FLAT NOW — `SLATS = 1`, no facets, no plate — which is the seam
> fix that holds and the border fix at the same time (see §7). The plate round
> `d7ba90e8-…` is REVERTED. Before it: `c3804b1c-…` (stylesheet comment
> repair) and `950f0645-…` (the two-round gap).** It closes the
> two-round gap: the 2026-08-27b keyboard round and the whole 2026-08-30
> screenshot round are live. Three files changed — `about.html`,
> `style.css`, `main.js`. Verified with a browser UA and a cache-buster: CSS
> and JS md5-identical to the tree, `/`, `/about` and `/library` all 200, and
> `about.html` differing from the tree by exactly the analytics beacon.
>
> ⚠️ **DEPLOYED IS NOT SEEN.** The 2026-08-30 round is now live and
> still has not been looked at by anyone — see item 0. Shipping it only
> moved the unseen work in front of the public.
>
> ✅ **THE EMOJI CORRUPTION IS FIXED EVERYWHERE — 47 lines across three
> files**, closed 2026-08-30c: 14 in this file, 31 in `prototype/style.css`,
> 1 in `resources/import_bts.py`. The stylesheet is redeployed and the LIVE
> copy is clean, with all 194 status markers intact.
> ✅ **The stylesheet edit was PROVED comment-only** — with every `/* */`
> stripped, the old and new files are byte-identical
> (`8f41a5ae5ba61f39e6596911dc50be25`). That is the check worth repeating
> before deploying any comment repair, and it is cheaper than reading the
> diff.
> ⚠️ **Grep for an emoji adjacent to a letter after any scripted write.** It
> is never legitimate here — a status mark is always followed by a space.
>
> ⚠️ **A SCREENSHOT NUMBER IS A REPORT, NOT A FILE.** `16th.jpeg` and
> `20th.png` on the Desktop were both REPLACED on 2026-08-30 with unrelated
> shots. Several `style.css` comments cite the old ones; `.hero`'s citation has
> been annotated rather than deleted. Check the file's date before trusting a
> note that names one.
>
> 🔴 **`python -m http.server` SERVES YOUR EDITS FROM CHROME'S CACHE.** No
> `Cache-Control`, so heuristic freshness wins through a normal reload, a
> query-string reload and a forced navigation alike — subresources keep their
> own cache keys. Several measurements this round were taken against pre-edit
> files. **Use `aliph-prototype-nocache` on port 8323 for anything being
> MEASURED**, and compare `decodedBodySize` against the file on disk.
>
> ⚠️ **A HIDDEN BROWSER PANE FREEZES `requestAnimationFrame` AND CSS
> TRANSITIONS.** Zero frames, and transitions never advance — so animated
> state reads as broken when it is correct. Suppress the transition and read
> the end state instead of sampling.
>
> 🔴 **THE SHEET WAS THE QUEEN'S RETREAT SHEET, AND IT WAS STILL IN USE.** The
> agency renamed and emptied `تسجيلات عودة الملكة` to serve as the feedback log —
> but `queensretreat` was **still deployed and still reading it**, which one
> `curl` of its `/api/counts` proved in seconds. Both Workers write the first
> tab, and Queen's Retreat counts any row with a non-empty **column B** as an
> occupied seat — which is exactly what a feedback row has, the client's name.
> ✅ Closed by archiving Queen's Retreat, 2026-08-30 — see that session.
>
> 🔴 **THE QUEEN'S RETREAT SERVICE ACCOUNT CANNOT BE REUSED, and `SETUP.md`
> said it could.** A Cloudflare secret is **write-only**: settable,
> overwritable, never readable. The key is in use and unrecoverable, and no
> key JSON survives anywhere on the machine. ⚠️ Its `client_email` IS still
> readable from the Sheet's Share dialog — which makes the path look open until
> the last step. **A new service account is the only way.**
>
> 🔴 **A SATELLITE PAGE COPIED THE SITE'S TOKENS AND INVENTED ITS OWN TYPE
> SCALE.** Palette, faces and linen were lifted; the scale was not. Body was
> `0.62rem` at weight 400 against the site's `0.92rem` at 700 — and because
> both files set `html { font-size: 150% }` with no responsive override, that
> is a flat 1.5× size gap plus two weight steps at **every** width, phone
> included. The site's real Bold face had never been copied either, so matching
> the weight meant shipping a font file, not changing a number.
>
> ⚠️ **`getComputedStyle` READ IN THE SAME TASK AS THE CLICK CAN MISS
> `:has()`.** Ticking a box and reading the row's computed border in the same
> evaluation returned the UNCHECKED values while the rule was painting
> correctly the whole time. Read it again in a second call, or sample the
> pixel. A single computed read that contradicts what you expect is
> inconclusive, not a finding — and the same staleness can report a false PASS.
>
> ✅ **THE FORM IS OPEN. The Sheets append HAS RUN — 2026-08-31, verified end
> to end through the real page.** `/api/status` answers `ready:true`, the notice
> is gone, Send is enabled. The header wrote itself and a submission lands with
> full Arabic — diacritics, em dash, mixed Arabic/Latin — a plain `1`-`5` in
> column H and an Asia/Jerusalem stamp. Both test rows were deleted; the sheet
> holds only its header. **No redeploy was needed**: the secrets flipped it.
>
> 🔴 **THE SHEET IS `17EV8437…` ("FeedBack Form"), NOT the `1EMJApB2Rh…` handed
> over at the start.** That one was described as "the Queen's Retreat one,
> renamed and emptied". It is NEITHER: still titled
> `تسجيلات ايفنت عودة الملكة`, two tabs, and holding real registrants' names,
> WhatsApp numbers, emails, home areas and employers.
>
> 🔴 **AND `1EMJApB2Rh…` IS SHARED `{"role":"reader","type":"anyone"}` — anyone
> with the link can read all of it.** That exposure is STILL OPEN and is the
> most urgent item in this file. Sheet → Share → General access → **Restricted**;
> nothing depends on it being public. ⚠️ It is also why the first 403 was so
> confusing: `ensureHeader`'s READ succeeded on public access and only the write
> failed.
>
> 🔴 **THE SERVICE ACCOUNT IS NEW — `sheet-writer@aliph-feedback…`.** The
> Queen's Retreat one is unreachable forever: a Cloudflare secret is
> **write-only**, settable and overwritable but never readable, and no key JSON
> survives on this machine. ⚠️ Its `client_email` IS still readable from the
> Sheet's Share dialog, which makes reuse look possible until the last step.
> The new key is at `D:\Personal\keys\aliph-feedback\` — **the only copy**.
> ⚠️ `C:\Users\Obaida` is itself a git repo, so Downloads and Documents are
> NOT safe storage.
>
> ⚠️ **GOOGLE WORKSPACE BLOCKS BOTH KEY ROUTES.**
> `iam.managed.disableServiceAccountKeyCreation` denies only
> `keyOrigin == 'GOOGLE_PROVIDED'` — which reads like uploading your own public
> key is a way through, and it is not: `iam.disableServiceAccountKeyUpload` is a
> SEPARATE constraint that closes it. ⚠️ `roles/orgpolicy.policyAdmin` **cannot
> be scoped to a folder** — organization level only. `info@aliphcreative.com`
> holds it now, so the next project needs no admin.
>
> ⚠️ **STALE, kept because the ordering lesson is real:**
> page.** No Sheet, no service account, no secrets yet —
> `feedback-worker/SETUP.md` is the whole procedure. A Worker must EXIST
> before `wrangler secret put` will take a secret for it, so this window was
> unavoidable; what it does in it is not. `/api/status` reports
> `ready:false`, the page disables Send behind a notice, and a POST is a
> **503 saying nothing was saved** rather than a generic failure telling a
> client to try again. It fails OPEN if the probe itself dies. **No redeploy
> is needed to open it** — the secrets take effect and the notice clears
> itself.
>
> 🔴 **A MISPLACED KEY IN `wrangler.toml` DOES NOT FAIL — IT DOES NOTHING.**
> `routes` was written under `[observability]`, and in TOML a bare key belongs
> to whichever table header precedes it, so it became `observability.routes`.
> wrangler deployed happily and published with **no custom domain**, warning
> in one line printed above the asset-upload log. **Read the deploy summary's
> trigger list, not the exit code.**
>
> ⚠️ **`aliph-feedback.ceo-6c6.workers.dev` IS OFF.** Declaring `routes`
> disables workers.dev unless `workers_dev = true` is stated. One address is
> the right end state — but do not read that host's silence as a broken
> deploy.
>
> 🔴 **`[hidden]` IS ONLY `display: none` IN THE USER-AGENT SHEET.** Any
> author rule setting `display` beats it. Three inputs on the new form carried
> the attribute, reported `el.hidden === true`, and were on the page the whole
> time — found by walking Tab, not by looking.
>
> 🔴 **THREE STANDARD CSS IDIOMS ARE WRONG IN AN RTL DOCUMENT.** All three
> were written, shipped into the working tree, and caught by measuring:
> `left: -9999px` on a hidden field made a 390px page **10389px** wide, because
> the inline start is on the right and the page can scroll to it;
> `border-inline-start` drew a checkbox tick as a `>` chevron, because the
> logical pair mirrors and **a tick is a shape, not a direction**; and forcing
> `direction: ltr` on a rating scale put it against the left edge of a
> right-aligned page with its own read-out at the far right.
>
> ✅ **The keyboard round of 2026-08-27b (`b52aeb9`) IS DEPLOYED** — closed
> 2026-08-30c, together with the screenshot round. It sat undeployed for three
> days for one reason: nobody asked for it.
>
> 🔴 **A COMPUTED FOCUS RING IS NOT A VISIBLE ONE, and this file would have
> recorded one as verified.** `getComputedStyle` read
> `outline: rgb(187, 92, 57) solid 2px` on a carousel slide while a pixel
> sweep of that same slide found **zero accent pixels** — the slide's own
> `<img>` and its absolutely-positioned `video.preview` paint above an inset
> outline. At the previous outset offset it had been clipped away instead,
> because a slide is exactly as tall as its track. Two invisibility
> mechanisms, neither visible to computed style. **Sample the rendered pixel
> for anything whose whole job is to be seen.**
>
> 🔴 **`overflow: hidden` IS A SCROLL CONTAINER.** Tabbing to a hero film
> frame made Chrome scroll it into view by setting `scrollLeft` on
> `.filmstrip` to **-4121px**, permanently, stacked under the gsap
> translation. `overflow: clip` clips the same and cannot be scrolled.
>
> ⚠️ **The 11 `.ring-item` buttons inside `aria-hidden` stages are FINE** —
> they are `inert` too, which takes them out of the tab order. An audit sweep
> for "focusable content inside aria-hidden" that does not also check `inert`
> reports eleven false positives here. There was exactly one real one, and it
> was introduced and fixed in the same round.
>
> ### Still true from 2026-08-27a — everything below IS deployed
>
> ✅ **Superseded 2026-08-30c: the live site is now
> `76ec4b38-0a01-4860-9454-14fdcc434f01`**, not the
> `c5b80d8c-ce63-4c1a-8fe9-1686b2d1a75c` this subsection was written about.
> Everything below is still deployed — the newer versions only add to it.
> The four deploys of 2026-08-30c, in order: `950f0645-…` (the two-round
> gap), `c3804b1c-…` (stylesheet comment repair), `d7ba90e8-…` (the ring
> plate, **since reverted**) and `76ec4b38-…` (the flat ring).
>
> ⚠️ **`/index.html`, `/about.html` and `/library.html` now 307 to `/`,
> `/about` and `/library`.** A `curl` without `-L` returns 0 bytes and reads
> like a broken deploy. It is not — follow the redirect.
>
> ✅ **Three R2 objects were REPLACED, not added** — `video/bts-29.mp4`,
> `poster/bts-29.webp`, `thumb/bts-29.webp`. The watermarked clip they held is
> gone from the bucket and is recoverable only from the agency's own file on
> the Desktop. The code and the bucket shipped together.
>
> ⚠️ **STALE ON THE FIX, STILL TRUE ON THE METHOD (2026-08-30c).** There are
> no ring seams any more — there is no faceting to have them, `SLATS = 1` (§7)
> — and the bleed is 0, not the 2.2px this entry describes. What survives is
> the reason three rounds missed them, and it is the reason to keep the entry:
> 🔴 **HEADLESS CHROMIUM RASTERISES IN SOFTWARE.** Driven headed against the
> real GPU with every slat flat-filled the seams appeared; the identical
> headless run did not have them. Both frames are in `resources/notes/`, and
> `slat-seam-bench.html` isolates the geometry. **Never certify a
> 3D-transformed surface from a headless screenshot.** The 2026-08-30c round
> was driven headed on an NVIDIA D3D11 path for exactly this reason.
>
> 🔴 **THE FIXED CONTROLS HAD NO BACKGROUND OF THEIR OWN.** `17th.jpeg` was
> read as an overlap complaint; it is a legibility one. `.lang-switch` is a
> hairline ring, an ink knob and two words with the page showing straight
> through the middle, so a black heading ran THROUGH the pill and the knob
> merged with the letters. The pill is filled now and the burger clears a soft
> radial space for itself.
>
> ⚠️ **`main.js`'s list of dark sections had rotted BOTH ways.** Three of its
> six entries — `.testi`, `.sw-stage`, `.svc-pick` — named things that no longer
> exist anywhere in the stylesheet or the markup. Sections declare
> `--ground: dark` on themselves now and it inherits to every descendant free.
>
> 🔴 **A PYTHON PATCH SCRIPT TRUNCATED `style.css` TO 0 BYTES.** `open(p,'w')`
> truncates before it writes, and the write raised. It was recovered from git
> — and the recovery came back CRLF, 4 KB larger, because `core.autocrlf` was
> `true` in a tree that is otherwise all-LF. Both were caught by comparing
> `git hash-object` against `git rev-parse HEAD:<path>`. `core.autocrlf` is now
> `false` for this repo. **Write to a temp file and `os.replace`; never open the
> only copy for writing.**
>
> ⚠️ **`aliphcreative.com` injects a Cloudflare Web Analytics beacon into
> some HTML responses and `workers.dev` does not.** The 2026-08-26 round
> measured all three pages 359 bytes larger on the custom domain; this round
> they came back byte-identical. It is a zone setting either way — do not read
> a difference as a half-finished deploy.

---

## ⏳ INCOMING — handed over 2026-08-27

> Four instructions arrived at the end of the 2026-08-26 session. **Only the
> first is done.** The session was handed to another one before the rest were
> started — what is below is the brief plus everything that was already
> measured, so none of it has to be derived twice.
>
> ⚠️ Read _Session 2026-08-26_ first: that round is **built and still not
> deployed**, so this round starts on top of an undeployed working tree.

### 1. ✅ DONE — the full-quality reels are back on the page

The 2026-08-26 round pointed every inline preview at a 540px / 700 kbps
derivative under `preview/`. **The agency asked for that undone** — what plays
on the page should be the master again. Reverted 2026-08-27 and verified:

- `prototype/main.js` — the ring sets `data-preview` to `video/` again; the
  `data-video` second URL is gone from the two `itemOf()` branches that read it.
- `prototype/index.html` (8 slides) and `prototype/about.html` (5 clips) — the
  `data-preview` / `data-video` pairs collapsed back to one `video/` URL.
- Verified in a real browser: the carousel streams
  `video/reels-alif-tuktuk.mp4` (16.8 MB) and the lightbox opens the same file
  at 4.59s. No `/preview/` URL and no `data-video` remains anywhere.

✅ **The thirteen `preview/` objects on R2 and `resources/make_previews.sh` are
left in place, DORMANT.** Nothing points at them, they cost nothing, and they
are the whole recipe if this is ever reversed again. Do not "clean them up"
without saying so — and do not assume they are live.

### 2. ✅ EIGHT NEW SCREENSHOT NOTES — six built, two still open

> Built 2026-08-27: `15th`, `16th`, `17th`, `18th`/`20th`, `21th`, `22th`.
> Still open: `19th`, because nobody knows what the red line marks. See
> _Session 2026-08-27_ for each one. ⚠️ The readings below are what each
> screenshot was taken to SHOW; where the agency's own reading turned out to
> be a different complaint, that is recorded in the session write-up.

In **`C:\Users\Obaida\Desktop\issues\`**, numbered on from the fourteen of
2026-08-24. There is no written brief; the only instruction given was *"some of
them are placement or alignment issues."* All eight were opened on 2026-08-27
and this is what each one shows. ⚠️ **These are readings, not the agency's
words** — confirm anything ambiguous before building.

| file | device | what it shows |
|---|---|---|
| `15th.mp4` | iPad, EN, 5.2s | The reel carousel. The centre slide IS playing; the two side slides are **washed out almost to invisibility**, far paler than the desktop dim. The «we built from them.» heading is also cut by the browser chrome. |
| `16th.jpeg` | iPad, AR, landscape | The hero. The film strip's frames **run off the bottom edge with no bottom sprocket row** — only the top row of sprockets is present. |
| `17th.jpeg` | phone, AR | 🔴 **Ringed in red.** The fixed language pill sits **on top of** the لماذا ألِف؟ block-1 heading «نبدأ بالسؤال، لا بالإجابة» and hides the last word. |
| `18th.png` | crop | An about-page clipping whose **mat is much bigger than the photograph** — same fault as `20th`. ⚠️ Dated 2026-08-24, older than the rest; may be a leftover from the last round. |
| `19th.png` | desktop, crop | The hero, with a **red vertical line drawn** down the cream panel a little inside the film strip's edge. It marks a misalignment; **which two things are meant to line up is not clear from the crop** — ask. |
| `20th.png` | desktop, crop | Two about-page clippings with **very large empty mats** beside the pictures. |
| `21th.png` | ? | An about-page text card with the type in the top ~40% and **a large empty area beneath it**. ⚠️ Spelled `21th`. |
| `22th.png` | crop | 🔴 A ring item with the **ten pale vertical seams still clearly visible**. Spelled `22th`. |

⚠️ **All eight were taken against the LIVE site, which is the 2026-08-24
build** — the 2026-08-26 work is not deployed. Check whether a complaint is
already fixed in the working tree before building anything.

#### What was already measured for these

**The clipping mats (18th / 20th) reproduce, and the cause is known.** A
portrait `.clip-photo` keeps its picture at a fixed 197px wide while the mat is
sized by the GRID COLUMN, so the dead cream either side grows with the window:

| viewport | card | picture | gap each side |
|---|---|---|---|
| 1024 | 311 | 197 | 57px |
| 1280 | 391 | 197 | 97px |
| 1440 | 441 | 197 | **122px** |
| 1920 | 591 | 197 | **197px** — as wide as the photograph itself |

The landscape clipping is correct (21–23px) until 1920, where it too opens to
66px. At 900px and below every clipping is fine (20px). So this is a **desktop
fault only**, and the fix is the mat hugging the picture — the same thing T13
asked for on 2026-08-24 and got for `.ab-media` but evidently not for
`.clip-photo`.

**The text card (21th) did NOT reproduce.** `.ab-card` was measured at 900,
1024, 1180, 1280, 1440, 1600 and 1920 × 900: slack between the content and the
card's padding box is **2–3px at every one of them**. Whatever produces that
empty half is a viewport this sweep missed — get the width and height it was
taken at before hunting.

**The pill overlap (17th) is by design, and that is the problem.** Both the
language pill and the burger are `position: fixed; z-index: 940` —
`style.css:447` and `style.css:234` — with a comment saying they are fixed
deliberately "so it rides down the page with the burger instead of scrolling
away". Nothing hides or fades them when they are over text, so on a narrow
screen any centred heading passing through their band is covered. ⚠️ **Do not
just move the pill** — the three obvious fixes (reserve the gutters, hide on
scroll-down, fade while scrolling) all change an interaction the agency has
been living with. Ask which they want.

### 3. ✅ DONE — THE CROPPED CLIP ARRIVED as a REPLACEMENT, not a crop

> Imported 2026-08-27 by `resources/replace_bts29.py`. It IS bts-29 — same
> two people, same ladder, same yellow shade cloth, same chain-link fence,
> checked frame against poster before anything was written. All four objects
> swapped, the audio dropped, the ratio put back to 0.562 in about.html, and
> the three R2 objects replaced and verified live. `crop_bts29.py` carries a
> SUPERSEDED header now. ⚠️ The master is 4.27 MB against the 1.14 MB the
> cropped re-encode served — see _Session 2026-08-27_.

This is the watermark clip: `@bader.events` and a line of Arabic burnt into the
bottom of the frame, which the agency drew a line above on 2026-08-23b and asked
about again on 2026-08-24 (T8, answered "stale cache").

**They have supplied a replacement file instead**, already vertical and already
clean:

```
C:\Users\Obaida\Desktop\new bts\AQNfQpohlL1Mvecj4xFHntkS_cuPNT1zjtBcTAn7ivDk7-buQ3vT5y33XZpXj_fna2LMQe6ujrr9UWrejy3D7GW_3GVXIqXuh0Tsu3g.mp4
```

654×1162 (9:16 to within a pixel), 4.80s, 4.35 MB, **has an audio track**.
Written 2026-08-27 00:42 — the only file in that folder with today's date;
everything else there is from the 2026-08-23 import.

⚠️ **Confirm which `bts-NN` it replaces before importing.** The reasoning says
bts-29 — that is the clip `resources/crop_bts29.py` was written for — but that
has not been checked against the file itself. Play it and compare it with the
current `bts-29` poster in `prototype/assets/media/`.

⚠️ **FOUR OBJECTS, not one**, exactly as `crop_bts29.py` says in its own header:
a local poster in `prototype/assets/media/`, and a clip, a poster and a thumb on
R2. The thumb is what the archive draws, so a partial swap leaves the old frame
in the most visible place.

⚠️ **Strip the audio on import.** Nothing on this site plays sound.

✅ If this lands, `crop_bts29.py` becomes history rather than a tool — leave it
on disk with a line at the top saying it was superseded.

### 4. ✅ DONE BY THE AGENCY — the programmer's mark is fixed and already in place

The agency did not send a photograph to be cut; they dropped a finished cut-out
straight into the tree. `prototype/assets/marks/mark-tech.webp` was replaced at
**2026-08-27 02:59**, 48 KB -> 123 KB, and it is committed with this round.

Checked at the real render size before committing: the head, the glasses, the
monitor full of code and — the whole point — **the arm and the shoulder** all
read correctly. The torn black blob with jagged spikes is gone. Nothing in the
code changed; `RING_MARKS.tech` already pointed at that filename.

⚠️ **Its shape changed and the stylesheet's note was corrected to match.** It
went from 825x858 (0.96, near square) to **1624x1291 (1.26, landscape)**, so it
now fills the width of the near-square mark box and letterboxes to 202x160
rather than nearly filling both axes. That is `object-fit: contain` working;
the three dimensions in the `.ring-mark.is-photo` comment are the whole reason
that box is the shape it is, so a stale one would send the next reader wrong.

✅ **`mark-tech.png` was moved out of the bundle on 2026-08-27.** 703 KB,
referenced by nothing, sitting under `prototype/` so it deployed. It is now
`resources/mark-tech-source.png` with the rest of the source art. Confirmed on
the live site: `/assets/marks/mark-tech.png` returns **404** and the `.webp` the
ring actually draws returns 200.

✅ The red "landed but not finished" block that used to sit under
_Carried forward from 2026-08-24_ has been removed. That is what it was waiting
for.

---

## ⏭ The next round — what is open

0. ✅ **CLOSED 2026-08-30c — the round has been SEEN.** All four notes were
   checked on the live site across six viewports and all four pass; the
   measurements, and the two false findings that nearly went in this file,
   are in that session. What is left over from it:
   ⚠️ **the dead column beside the about-page pair is 218px at 1920x960,
   not the 79px `--abh`'s comment claims** — 108px of it is empty linen to
   the right of the pair against the card's 57px inset on the left. A
   composition call for the agency, not a bug.
   🔴 **whether a real pointer can pick a ring piece is UNTESTED.**
   Playwright's `hover` does not land on a 3D-transformed item, so `pick()`
   was driven with a dispatched event. The pop logic is proven; the hit test
   is not.
   ✅ **the seams ARE answered, later the same day** — by removing the
   faceting rather than by anything this pass could measure. See item 4.
   ⚠️ **This pass was headless, and headless cannot see a seam at all.** The
   round that closed them was driven headed against the GPU.
1. ✅ **CLOSED 2026-08-30 — `19th.png` was never an alignment mark.** The red
   line marks where the cream panel's DEAD STOCK begins: reconstructed at
   1920×960, the panel ran 1022..1905 while the lede stopped at 1225, so 143px
   of it was empty. The panel hugs its measure plus its padding now and the
   lede's line count is unchanged at every width. It lands 29px short of the
   line because that 29px is the panel's own padding.
2. ⚠️ **The heading under the pill is no longer OCCLUDED, but it is still
   veiled.** ✅ 2026-08-30 replaced the filled pill with the burger's radial
   wash at the agency's request, so the words read through it instead of
   disappearing behind it. What has still never been decided is whether the
   controls should get out of the way at all — the hide-on-scroll /
   fade-while-scrolling / reserve-the-gutters question.
3. ⚠️ **bts-29 is 4.27 MB now on a page that autoplays it**, up from the
   1.14 MB the cropped re-encode served. That is `import_bts.py`'s house rule
   (remux the master, never re-encode) meeting a 7.1 Mbps 4.8s source, and it is
   the trade the agency asked for when they had the page's previews put back to
   masters. One `-c:v libx264 -crf 23` in `resources/replace_bts29.py` is the
   whole change if they want it down.
4. ✅ **CLOSED 2026-08-30c — THE FACETING IS GONE, AND THAT IS WHAT CLOSED IT.**
   `SLATS = 1`: one flat face per item, no interior junction, nothing to shred.
   Not rarer — **impossible**. The mechanism is worth keeping even though the
   fix no longer depends on it: Skia batches the strip quads through
   `drawEdgeAAImageSet` and turns antialiasing OFF on interior edges it can
   prove are shared, so when anything splits that batch every quad is drawn
   with AA on all four sides, coverage at a junction sums to under 1, and the
   page leaks through. That is the whole intermittency, and why software
   rasterisation never reproduced it. **A bleed cannot fix a coverage
   shortfall** — it can only make it rarer — which is why no value of it ever
   held. See _Session 2026-08-30c_ §7.
   🔴 **THE PLATE OF §6 IS REVERTED.** It did hide the seams — 7 lines at
   bleed 0 without it, 0 with it — but it was inserted as the item's first
   child and so stole `:first-child` from the first slat, which is the rule
   that draws `border-left` and the two left corner radii. Every item shipped
   with a square unbordered left edge against a rounded bordered right one:
   *"theres stupid borders for items in the ring"*. §6's measurements still
   stand and are what proved the bleed was a dead end; none of its code does.
   ⚠️ **`will-change` and `backface-visibility` on the slats do NOTHING** —
   both measured under the bleed-0 stress test, both unchanged at 7 seams.
   This file recommended them twice.
   ⚠️ **Putting `SLATS` back above 1 puts the shredding back with it**, and
   `--bleed` has to return at the same time or the strips meet with nothing
   between them at all.
   ⚠️ **What it cost is the bend, and the bend was 10px** across a ~109px item.
   The ring still reads as a ring — the cards are rotated and stand in a circle
   — they are simply flat. That is what the ring was before 2026-08-23's
   faceting round (`080853d`), which is the version the agency remembered as
   better: *"the first ver ever made of it was much better"*.
5. **The ring's motion has still never been SEEN by a person.** What is unknown
   is the FEEL of the fixed version: whether 42s is slow enough for
   صناعة محتوى, and whether picking the piece you point at is the right
   amount of eager now that it no longer picks the pieces that come to you.
6. **The carousel fix is still REASONED, NOT REPRODUCED on a phone.** Verified
   again under Playwright — exactly one `video.preview` in `.reelshow` and it is
   playing — but the reported fault was a phone stutter and no phone has been in
   the loop.
7. **Open question 20 is still open**: the founding year is stated nowhere on
   the site. Settle it before a year goes back anywhere.
8. **The three digital ads are still undated**, like the other nine — open
   question 9.
9. **`master/` still has nothing from the new imports** (open question 11), and
   the 197 MB AliphxBader 4K master on the Desktop is archived nowhere but the
   Desktop. ⚠️ **The same is now true of the bts-29 replacement.** The only
   copy of the clean master is the agency's own file in
   `C:\Users\Obaida\Desktop\new bts\`; R2 has the remux, nothing has the
   source, and the watermarked object it overwrote is gone.
10. **Two things blocked on the user.** The `SeekoSeeko-MovieNight` repo cannot
    be created until `gh` is authenticated; the project is committed locally at
    `D:\Personal\Projects\bader-movie-night` with its remote already set. And
    `master/horizontal-maqasid.mp4` cannot be uploaded until an R2 API token
    exists (open question 16). ✅ `wrangler r2 object put --remote` DOES work
    from this machine — it replaced three bts-29 objects on 2026-08-27 — with
    `CLOUDFLARE_ACCOUNT_ID=6c60bd775004cfa0082f768c356c7242` in the environment,
    because this login can reach two accounts.
11. **The hero lede's orphan is the agency's decision now, not a bug hunt.** It
    is measured over a 7×5 grid of widths AND heights (see _Session 2026-08-26_,
    item 10): 10 of 35 window sizes. `text-wrap: pretty` has taken the worst off
    it. The fix that closes it is `max-width: 21em` on `.dropcap-block p`, and it
    trades the agency's "type reaches the bottom of the paper" rule for their
    "no lone word" rule. Ask them which they want.
12. ✅ **CLOSED 2026-08-27b — every media surface answers the keyboard.** The
    tab-order objection was real and is answered rather than paid: each field
    is ONE composite widget, so it costs a single tab stop and the arrow keys
    walk it. Four stops added to the home page and one to the about page, not
    ~39. Walked with real Tab presses: **32 stops in both languages**. See
    _Session 2026-08-27b_.
13. **The English headline's full stop is the Arabic face's full stop.** Idris
    Sharp carries a full Latin set, so "things begin." is set entirely in it,
    period included — and that period is drawn for Arabic typesetting, so at
    display size it reads like a comma. One rule fixes it if it bothers anyone;
    nothing was changed, because it is the face the agency chose.

⚠️ **On a phone the ring cannot be stopped, and that is still a decision
waiting to be made rather than an oversight.** Hover-to-pause is gated on
`(hover: hover)` for a good reason — on touch `pointerenter` fires once and
`pointerleave` never does. A phone visitor must tap a piece while it is moving:
13.8°/s on the design and tech rings, 8.6°/s on صناعة محتوى. The
2026-08-24 round made the first tap open the piece; a tap on the background to
pause, or a pause while the lightbox is open, would close the rest. An invisible
toggle that stops the ring with no affordance reads as a broken page, so no
gesture has been invented for it.

### Carried forward from 2026-08-24 — still true, still load-bearing

> 🔴 **NEVER PUT `font-variant-numeric: tabular-nums` ON IDRIS SHARP.** The
> clock the agency has now deleted was rendering as **six white diamonds** on
> their phone (`7th.png`, which they did not reference). The face advertises a
> `tnum` feature and does not implement it: with it on, all ten Arabic-Indic
> digits AND the colon collapse to exactly 50.4px at 120px — one `.notdef`
> advance. **The 2026-08-23b round measured that uniformity and wrote it up as
> proof the feature worked.** It was proof that every glyph had become the same
> empty box. If a display face ever needs tabular figures again, look at the
> rendered GLYPH, not the advance width.
>
> ⚠️ **The tech ring no longer reaches the software projects.** T7 removed
> navigation from the ring outright, so a click on حلول تقنية's three items now
> opens the lightbox like everything else. The overlay shows the project's real
> 1600×1000 screenshot plate rather than the 640px logo tile the ring shows —
> `RINGS.tech[].full`, the same `data-full` split the archive's thumbnails use —
> but the profile SHEET is now only reachable from the work page. That is the
> agency's instruction applied uniformly; it is one line to exempt `tech` if
> they want the sheet back.
>
> ⚠️ **The 16:9 AliphxBader montage is the flagged judgement call of T13.** Two
> rows of two verticals uses the four 9:16 clips and leaves it homeless. It is
> kept as a full-width piece at the head of the long read with no card beside
> it. One `<figure>` to move if they want it elsewhere.

> ✅ **The developer's mark was finished by the agency on 2026-08-27** — a
> real photograph of their own developer, cut out with the arm and shoulder
> intact. The block that stood here for three days, warning that the arm came
> back as a torn blob, is gone because it is no longer true. See item 4 of the
> incoming brief above.

---

**Standing rule: update this file at the end of every session.**

---

## Session 2026-09-01b — four screenshot notes, rejected twice, a wash that could never have been an ellipse, and a grid row that was holding the section apart

Four instructions. **All four were built, shown, and sent back**, and three of
the four had been solved the wrong way. What is below is the second pass; the
first is kept wherever its failure is the thing worth knowing. Nothing is
deployed, and this round sits on top of the previous one's undeployed tree. Two
files changed: `style.css` and `main.js`.

> 🔴 **THE FIRST PASS WAS REJECTED ON EVERY POINT AND THE PATTERN IS ONE
> THING**: each fix answered the measurement rather than the complaint. The pins
> were levelled while the agency was looking at the type; the wash's box was
> made proportional while the agency was looking at its outline; the paper was
> tinted "beige" without ever sampling what beige it had become; the ring was
> made 30% bigger against a reference that wanted 50%. ⚠️ **Three of the four
> were caught only because the agency looked again.** The one that was checked
> against a rendered pixel from the start — the label wrapping — is the one
> that survived.

### 1. ✅ The hero notes: the alignment was the TYPE, not the sheets

"align the 2 buttons like this for now" (their `1st pic`).

🔴 **THE FIRST READING WAS THE PINS, AND IT WAS WRONG.** `align-items:
flex-start` levels the sheet TOPS while the pins sit at their own fraction of
their own sheets, so the pins were 17px apart and the labels 21px. That was
measured, fixed, and reported — and the answer came back *"u didnt align the
hero buttons"*. ⚠️ **The pins were never what they were looking at.** In their
reference BOTH LABELS ARE HORIZONTAL; the build turned the contact note's line
**−13°** to lie along its own tilted top edge. A tilted line of type beside a
level one is what reads as unaligned, whatever the sheets do.

The −13° was deliberate and its reasoning is still in the file: a horizontal
line on a tilted sheet gives away that this is a photograph with words dropped
on top of it. **That illusion lost to the complaint.** The sheets are still
tilted; only the type is not.

✅ **The pin-line work was kept** — it is right, it is just not what was being
asked. Pins now **0.84–1.17px** apart against 17px, labels **2.8–4.1px** against
21px. The offset is derived from numbers already in the block
(`0.09 × 523/700` against `0.15 × 633/680` = 0.0724 of the sheet width), so
re-cropping a note moves it on its own.

⚠️ **`--note-w` IS RESTATED AT THE 640 BREAKPOINT** or that offset is computed
from a width no sheet has: the phone rule takes the sheets onto `flex: 1 1 0`,
so it is redefined there as `calc((100% - var(--note-gap)) / 2)`. A percentage
in a margin resolves against the same containing block the flex is divided from,
so the two agree by construction. Verified at 390: sheets 167.1 / 167.5px.

✅ Label **+20%**, and **checked the right way**: `Range.getClientRects()` on
each label, both languages, at 1920/1366/390 — **one line box in all twelve
cases**, `scrollHeight === clientHeight` throughout. ⚠️ A naive
`height / line-height` reports the contact label as TWO lines at every width;
before the rotation was removed that was the −13° inflating its bounding box,
and it would have sent someone hunting a wrap that was not there.

### 2. ✅ …and the colour: sampled, not reasoned about

"adjust their colors to be less white and more beige" → then, after the first
pass, *"they are too beige, make the creamy somthing a lil darker than our cream
color"*.

🔴 **THE FIRST ATTEMPT LED WITH `sepia()` AND NEVER MEASURED THE RESULT.** It
reached for sepia to add warmth and pushed `saturate()` to 1.42 to protect the
pin's red — and `saturate()` amplified the source photograph's own cast. Sampled
afterwards, the lit paper was **#FBFADD**: still at white's brightness and now
carrying a yellow one. It was custard, and the agency said so.

✅ **`brightness()` LEADS AND DOES THE WORK; the warm pass only stops the result
going grey.** `brightness(0.8) sepia(0.14) saturate(1.05)`. Sampled off the
rendered pixel: the lit face measures **#C9C3BD** against `--cream`'s
**#D9D9CE** — about 7% darker, carrying the same warm bias (R−B of 12 against
the linen's 11). That is "a lil darker than our cream color", stated as a
measurement rather than a hope.

⚠️ **`sepia()` ON NEAR-WHITE BARELY MOVES ANYTHING BY ITSELF** — on pure white
it only drops the blue channel by about 16·s and leaves red and green clipped at
255. It cannot darken. Anything that reads as "beige" from sepia alone is
saturation amplifying a cast that was already in the photograph, which is why
the first pass went somewhere nobody chose. **Re-measure the pixel if these
numbers are ever touched.**

⚠️ **The pin survives at `saturate(1.05)`** — checked, not assumed: the most
saturated pixel in the cut is **#BE2A1B**, saturation 163. It is still plainly
red.

⚠️ **`filter` IS A PIPELINE and the colour work must come before the shadows.**
A `brightness()` or `sepia()` written after the drop-shadows lightens and tints
the shadows too, laying two coloured smears on the linen. ⚠️ It is repeated in
`:hover` and `:active`, because `filter` is one property and restating it for a
different shadow drops the colour for as long as the pointer is on the note.

### 3. ✅ The language pill: a radial gradient can never be a stadium

"the effect behind the lang button is poorly made, it doesnt match the oval
shape of the button" — said **twice**, the second time after a fix.

🔴 **TWO ROUNDS WERE SPENT FITTING THE GRADIENT'S BOX AND NEITHER TOUCHED THE
FAULT.** First the px inset was measured wrong-shaped (a 151.6×51.7 box, ratio
2.94, around a 127.6×35.7 pill, ratio 3.57) and replaced with a percentage inset
that made it proportional (241×64.6, ratio 3.73). The proportion was then right
and the complaint was unchanged, **because the ellipse was never the pill's
shape to begin with**.

🔴 **THE PILL IS A STADIUM.** `border-radius: 99px` on a wide box draws two
semicircles joined by STRAIGHT top and bottom edges. `radial-gradient` cannot
produce that outline at any size or with any stops: an ellipse is curved
everywhere and pinched at the ends, so its widest point is a single tangent
where the pill's is a whole straight run. No amount of fitting the *box* fixes a
mismatch in the *curve*.

✅ **A filled stadium, blurred.** Same `border-radius` on the same box, so every
edge of the halo is parallel to the edge of the control in front of it, and the
blur is what makes it a wash rather than a plate:
`background: rgba(...); filter: blur(11px)`. The shape is now **inherited rather
than approximated**, so it stays right through `.ls-opt`'s clamp and the 640
breakpoint with nothing to keep in step.

⚠️ **SMALL INSET, LARGE BLUR, deliberately.** A blur spreads an edge over roughly
twice its radius, so the solid core stays under the pill where the type has to
be veiled and all the fading happens outside it. Growing the inset instead puts
a hard-edged plate back under the words, which is what the 2026-08-30 round
removed.
⚠️ **`filter` MAKES THE PSEUDO-ELEMENT A STACKING CONTEXT.** It still lands under
the ring, the knob and the words — `z-index: -1` resolves inside the pill's
`isolation: isolate` group as before, and the knob is also −1 and later in paint
order. Checked on both grounds after the change.

### 4. ✅ The ring and the marks — the solver was cutting them, and then the window was

"the ring in both the phone and pc are small" → after the first pass, *"the ring
is still small and the marks too"*.

🔴 **THE FIT SOLVER WAS CUTTING THE RING TO 74% BEFORE ANYTHING WAS TOUCHED.**
`layout()` sizes an item to a constant area and then shrinks the band by a solved
`fit` until it clears the window in both axes. Measured at 1920 and 1440:
**design 0.904, صناعة محتوى 0.736, tech 0.950**; on a phone **0.767 / 0.601 /
0.828**. The eight-piece photo ring was worst, which is the ring the agency
screenshotted.

🔴 **`h` IS ON BOTH SIDES OF THE HEIGHT TEST, so `fit` is invariant in it.** The
items are sized from the window's height and the height budget IS that height.
A taller window does not improve `fit`; it scales the same composition up. Proof:
`fit` was byte-identical (0.9043 / 0.7356) at 1920 and 1440, whose windows were
both clamped to 540px.

🔴 **THE BINDING AXIS MOVES WHEN YOU RELIEVE IT, AND ONE VIEWPORT WILL NOT SHOW
IT.** Raising the cap to 760px gave 1.32× at 1920 and **1.05× at 1440**, because
the extra height had pushed the constraint onto the WIDTH and `fit` fell from
0.736 to 0.555 to pay for it. **Re-establish which axis binds after every change**
rather than assuming it held.

🔴 **ON A PHONE THE HEIGHT BUYS NOTHING — 0.9%.** Swept at 390px, 310→480px of
window height moved the piece from 78.9 to 79.6. Both `halfW` terms scale with
the same `k` the items do, so `fit` lands wherever the width test puts it and the
resulting item size is independent of `h`. **The phone's only levers are the side
bleed and the neighbour spacing**, and the section's own comments already name
the currency: *"something has to give, and it is the sides."*

⚠️ **THE SOLVER RESERVES ~1.9× WHAT THE RING PAINTS.** At 1920 it stopped at
`2·halfW = 1294.7px` while the band painted **684.9px**. The width term applies
the FRONT item's perspective magnification, plus full `POP` and full `LIFT`, to
the horizontal extreme — but that extreme sits at z ≈ 0 where magnification is
≈1, and only one item is ever popped. That slack is what the desktop bleed spends,
and it is why raising the bleed is safe rather than reckless.

**What is set now:**
- `.ring-window` height → **`clamp(380px, min(58vw, 80vh), 900px)`**. ⚠️ The
  VIEWPORT'S HEIGHT is in there and has to be: the ring is height-bound on every
  desktop once the bleed is opened, so this number IS the ring's size, and a pure
  `vw` term sets it from the width of a screen it then has to fit inside — 58vw
  at 1920 is 1114px, taller than a 960px laptop viewport.
- Side bleed **1.14 → 1.90** desktop, **1.85** phone; neighbour spacing
  **1.12 → 1.04** on the phone only.
- `.ring-mark.is-photo` → `clamp(200px, 27vw, 415px)` / `clamp(230px, 29vw, 468px)`,
  after a SECOND "the marks arent big enough still". Two raises, +35% and
  +30%, and the second one was only asked for because the first was measured
  against the agency's screenshot rather than shown to them.

**Painted band, original → now:**

| viewport | window | صناعة محتوى | vs original |
|---|---|---|---|
| 1920×1080 | 1136×864 | 762×~590 | **~1.55×** |
| 1920×960 | 1136×768 | 691×~530 | ~1.40× |
| 1440×900 | 852×720 | 654×~500 | ~1.32× |
| 390×844 | 342×380 | 357×282 | ~1.65× |

✅ **NOTHING CLIPS TOP OR BOTTOM ANYWHERE.** Swept at 1920×1080, 1920×960, 1440,
1280, 1024, 900, 768 and 390, all three rings, **with every item in turn forced
to the full `--pop: 1.26`**: every clearance negative, tightest **37px**. The
"poster sliced along the bottom" fault stays fixed.

⚠️ **THE MARK'S HEADROOM IS NOW NARROWER.** `radius()` floors the orbit at
`markW/2 + widest × 0.55` so the work can never run through the thing it circles.
At 1920 the floor asks 408px and the chord rule 534px on the photo ring, so
the chord still wins there and the orbit is unmoved — **crossover around a
666px mark**.

🔴 **ON THE TECH RING THE FLOOR BINDS, AND IT ALWAYS HAS.** Three items
are 120° apart, so the chord rule asks for almost nothing (235px at 1920
against the mark floor's 407px) and the MARK has set that orbit at every width
since the floor was written — measured back at the original 210px mark and
540px window it was 230px against 147px, the same story. ⚠️ So a mark raise
costs the tech ring twice: the orbit widens with it and the fit solver then
shrinks the band to keep the wider ring inside the window. It still measures
603px painted at 1440 against the photo ring's 654, so it has not been hurt
— but the tech ring is the one to look at first after any further raise, and
it is the ring that will stop responding to them soonest. ⚠️ Both numbers
move with the window height; re-derive rather than trusting them.

⚠️ **The phone bleeds 2–7px past its window's sides**, which is the reading the
bleed exists to give and what the agency's reference shows.
⚠️ **The 768–900 band still carries a lot of dead width** — the ring gets the
full page there but its height is on the clamp's floor. It was not raised
further because that floor also governs the phone, where extra height buys
nothing.

### 5. ✅ The services section aligns in two grid rows, not three

The agency sent a composed target for the "what we do" section: *"heres my goal
for the alignment ... try to copy it as much as possible"*. What their picture
has and the build did not is the oval and the sentence under the ring sitting on
ONE band at the foot of the section, with the three service names centred across
the ring rather than hung from its top.

🔴 **A GRID ROW WAS HOLDING THE TWO COLUMNS APART, AND THE RING'S HEIGHT SET
HOW FAR.** The areas were `list/ring`, `foot/ring`, `foot/desc` — the ring
spanning rows 1–2, the foot spanning 2–3. Row 2 is therefore whatever the ring
has left after the list, and `align-self: start` pins the foot to the TOP of it.
Measured at 1440: the oval landed **273px above** the description it reads
alongside, with nothing in between. That gap is `row2 - footHeight`, so
⚠️ **every round that made the ring taller pushed the two further apart** —
which is why this surfaced now and not before.

✅ Two rows — `list/ring` then `foot/desc` — put the columns on the same two
bands. Measured after, at 1440 and 1920: the oval's top and the kicker's top are
**identical to the pixel** (5948 / 5948 at 1440, 7639 / 7639 at 1920), and the
description and the foot begin on the same line. ⚠️ **Nothing in the section's
alignment depends on the ring's height any more**, which is the real repair: the
ring can be resized again without dragging the foot out of true.

✅ `.svc-list` takes `align-self: center`, so the three names sit across the
ring's middle. It reads the row's height — the ring's — so it tracks any later
change on its own. Verified: list centre 5565 against ring centre 5565 at 1440,
7181 / 7181 at 1920.

⚠️ **Scoped to `@media (min-width: 901px)`.** Below that the section is
`display: block` and single-column; confirmed unchanged after.
⚠️ **The 35/65 column split is untouched** — it came from a line the agency
drew in 2026-08-23b and this was an alignment note, not a proportion one.

### 6. ⚠️ A second `isPhone` was written, and it shadowed the real one

The phone branch was first written `const isPhone = window.innerWidth <= 640`
inside `layout()`. It parsed and it measured correctly, and it was wrong twice: a
**fifth** copy of the 640 breakpoint, and a BOOLEAN shadowing the module-scope
`isPhone()` — a live `PHONE_MQ` MediaQueryList — for the whole function, so any
later `isPhone()` call inside `layout()` would have thrown rather than answered.
Replaced with the existing helper; every number identical after.

⚠️ **`radius()` takes a `spacing` parameter now** rather than a literal 1.12,
because the phone needs a different one. Called from exactly one place.

### What is still open

1. ✅ **CLOSED 2026-09-01 — both rounds are committed (`07050bf`) and deployed
   (`d3113117-385a-450f-affe-bacd11786869`).** They went in together because they could not be
   separated; the commit message names both. ⚠️ **This round was not reviewed by
   the session that shipped it**, only verified to parse and render.
2. ⚠️ **The ring is now bounded by the window and the window by the viewport
   height.** If it is still wanted bigger, the remaining levers are the
   section's 35/65 grid split, or `POP`/`LIFT` — the popped-state reserve, which
   is what stops the band using the last 30% of its window. Both change
   something the agency has already approved, so ask before spending them.
3. ⚠️ **The tech ring is mark-bound and is the first thing a further mark
   raise will cost** — see §4.
4. ⚠️ **The −13° on the contact label is gone at the agency's request.** If the
   sheets ever stop being tilted photographs, that decision should be revisited
   rather than inherited.
5. ⚠️ **The ring's motion has still never been SEEN by a person**, and it is now
   up to 55% bigger, which changes how fast the same angular speed reads.
6. 🔴 **Everything carried forward is still carried forward** — the bts-29 edge
   purge, the public `1EMJApB2Rh…` sheet, the key JSON being the only copy. None
   of it was touched this round.

---

## Session 2026-09-01 — the dashes go, the ring names what it is showing, and the phone gets its own copy

Six instructions. **Four are in the tree; two were built, shown, and then
killed by the agency the same day** — the about page (§5) and the design
exploration (§6). Nothing is deployed; the working tree is ahead of the live
site again.

### 0. 🔴 THE PREVIEW PANE RUNS ZERO FRAMES PER SECOND AND REPORTS ITSELF VISIBLE

The harness's in-app browser pane delivered **0 `requestAnimationFrame`
callbacks in 900ms** while `document.hidden === false` and
`document.visibilityState === "visible"`. This site's intro curtain is lifted by
a GSAP tween, so it never lifted, and every screenshot came back a flat fill of
linen. Fronting the tab, reloading and waiting all reported success and all
produced the same blank image.

⚠️ **A blank screenshot from that pane is not evidence about the page.** The
probe that separates the two cases is one loop counting rAF callbacks against a
wall clock. ✅ `gsap.ticker.tick()` in a loop drives the timeline by hand and
makes the pane usable for STATIC layout; ✅ the gstack `browse` daemon has a
live frame loop and is what the rest of this round was measured on.

### 1. ✅ Every visible dash on the site is gone

The instruction was "remove all the dashes ... and replace them with whatever
punctuation fits where it gets replaced". **32 code lines in `main.js` and 34
places across the three HTML files** carried an em or en dash; comments were
stripped before the scan, so that count is user-visible copy plus metadata only.

Each was replaced with punctuation chosen for that sentence, not by one global
substitution: a colon where the second clause explains the first
(«الحكاية كاملةً: كيف بدأت الوكالة»), a comma for an apposition
(«القدس، جبل الزيتون»), a semicolon in English where a comma would splice, a
full stop in the legal line, «·» between a page name and the site name in
`<title>` and the OpenGraph pairs, and nothing at all before the quote's
attribution («دفتر ألِف», which was «— دفتر ألِف»).

✅ **Verified by rendering, not by grepping the source.** A tree-walk over every
text node plus `aria-label`, `alt`, `title` and `document.title`, run on all
three pages in BOTH languages: **six of six CLEAN**. The source scan agrees at
**0 remaining**.

⚠️ **Three of them were accessible names, not visible text** — the lightbox's
"%1 of %2", the archive tile's date, the ring item's "n / total". They are
routed through a new `SEP()` helper. ⚠️ It is a FUNCTION, not a constant:
`lang` is reassigned by the toggle and these names are rebuilt on it, so a
constant captured at load would hand Arabic names an English comma for the rest
of the visit.

### 2. ✅ The oval's label was riding 2.83px high, and `align-items: center` was doing it

The agency's third screenshot, "align the button and its text center middle".
`align-items: center` centres the LINE BOX, and a line box is the font's ascent
plus its descent — 0.89em and 0.22em in Idris Sharp, nowhere near symmetric.
Centring it puts the baseline 0.335em below the middle, and Arabic ink lives
almost entirely above the baseline.

🔴 **Measured against rendered pixels at 3x, not against computed style**: the
ink's centre sat **2.83px above** the ellipse's centre on a 77.5px button.
After: **0.17px**.

The correction centres the band the eye reads, baseline to ascender:
`ascender/2 − (asc − desc)/2`. Arabic reaches 0.88em → **0.105em down**; Latin
caps reach 0.68em → 0.005em, i.e. nothing. ⚠️ **So it is scoped to
`html[lang="ar"]`** — two scripts, two ascender heights, one face, and one
number cannot serve both. ⚠️ It composes through a custom property, because the
hover swap sets `transform` and would drop a plain translateY on the floor.

⚠️ **The OTHER reading of that screenshot was checked and was already correct**:
the invite sentence and the oval beside it are vertically centred on each other
to within 0.8px at 1366, 1440 and 1920.

### 3. ✅ The ring says what kind of work is at the front

"put the type of service above its text (eg when a reel is being viewed type
reel on top of its txt)". `#ringDesc` now carries a `.ring-kind` kicker over a
`.ring-line`, both written by a new `writeDesc()`.

`kind()` reads the SAME table `line()` reads, in the same branch order, so the
kicker and the paragraph can never describe two different things — the
subsection wins over the project, and the fallback is the service name rather
than blank, so the paragraph below never jumps.

🔴 **THE KICKER IS INK, AND THE FIRST DRAFT OF IT WAS AN ACCESSIBILITY
REGRESSION.** It was written in `--accent`, which measures **3.14:1 on the
linen** and **3.98:1 on the film ground**; at 0.72em of a 1.45vw paragraph
(~15px) AA wants 4.5:1. `:root` also states that `--accent` is "nav strike +
focus only", so it would have been the first text on the site painted in it and
the only text on the site failing contrast. It is `--ink` (12.6:1) now; the
accent survives as the 1px rule under the word, which is decoration and carries
no contrast duty.
⚠️ **It was caught because a subagent, asked only for design mocks, reported the
accent's contrast on a DIFFERENT surface.** Read an out-of-scope finding from a
peer as a test to run against your own diff.

🔴 **NO `letter-spacing` ON THE ARABIC KICKER.** Arabic is joined; letter-spacing
inserts its value between every pair of glyphs and ريلز sets as four
disconnected shapes. The tracking is split by language and only `html[lang="en"]`
gets it.

⚠️ `.ring-desc`'s `min-height` went 3.4em → 6.1em with it, or the shortest
description let the block collapse under the tallest and the whole foot jumped
every time a piece came round.

### 4. ✅ The phone gets the agency's own shorter copy — four passages

"i have replacement for these but only apply for phone view". 640px, which is
already this file's phone line in `style.css` and in the previews module.

**Two different mechanisms, and the reason is structural:**

- **The ring's three shortened descriptions are a JS swap** — `descShort` on
  `SUBCATS.photo.reels`, `.stills` and `.tech.landing`, chosen in `line()`.
  There is no second element to hide: `paint()` writes one shared `#ringDesc`.
- **Block 1 of لماذا ألِف؟ is a CSS swap** — a fourth `<p class="wb1-short">`
  beside the three `.wb1-long` ones. Four real elements, so the breakpoint that
  already governs the layout governs the copy too, with no listener to keep in
  sync.

⚠️ **`PHONE_MQ` is a live MediaQueryList with a `change` listener**, not a
boolean read at load. Rotating a phone crosses the line; a captured boolean
leaves long copy on a 390px screen for the rest of the visit and reads as the
feature not working.

🔴 **HIDING A SIBLING BREAKS `:last-child`, silently.** `display: none` removes
an element from the RENDER tree, not the DOM tree, so the new fourth paragraph
became the parent's last child at every width and `w1ParaC` — the last one
anyone reads on a desktop — quietly got its 0.45rem trailing margin back.
`.wb1-long:has(+ .wb1-short)` names the relationship instead of counting.

⚠️ The agency's own replacement text contained an em dash. It was set as a colon
under their own instruction from the same message; that is a copy change made on
their behalf and is worth confirming.
⚠️ **The English of all four is MINE** and needs the same sign-off the Arabic
has had.

### 5. 🔴 The about page's desktop spacing — BUILT, MEASURED, AND REVERTED

The instruction was "the about us page for phone is perfect, but for pc theres
still a lot of empty unnecessary spaces in between displayed items". A fix was
built and measured, the agency looked at it and asked for it undone the same day
("can u also undo what u did for the about us page"). **It is out of the tree.**

⚠️ **REVERTED MEANS REVERTED, and it was checked rather than assumed.** After
the undo, `.ab-row`, `.ab-card`, `.ab-pair`, `.ab-wide`, its holder and all four
figures measure **byte-for-byte identical to the pre-session baseline** at both
1440x900 and 390x844 — document height 4501 / 5896, card type back to 27.84px
and 26.4px. The four rules removed were a `max-width` on `.ab-row`, an
`align-self: stretch` on the card, a `display: grid` / `align-content: center`
on the card, a `min-width: 901px` type block, and `.ab-wide`'s `--abh`.
⚠️ **Do not re-apply any of it without being asked.** The complaint is not a
standing task.

**The one thing worth keeping is the diagnosis, because it is a fact about the
layout and not about the change:** 🔴 **this section allocates WIDTH in `fr`
while capping its media by HEIGHT in `vh`, and on a wide short window those two
rules disagree.** A 9:16 clip capped at 450px tall is 253px wide whatever the
page does, so at 1920x900 the pair comes to 503px of content inside a 755px
track. The leftover cannot go to the margins, where it would read as a measure,
because `fr` has already handed it to the tracks — so it opens up BETWEEN the
pictures and the card. Anyone who looks at empty space on this page again will
land on that, and it is the thing to think about first.

### 6. ⚠️ `.hero-panel`'s shadow points off the screen in RTL — found, not fixed

`.hero-panel` casts `box-shadow: 24px 0 …`. That is a PHYSICAL offset in a
mirrored layout, so in Arabic it throws the shadow off the viewport edge instead
of onto the film strip it is meant to sit above. Nothing was changed — it is
recorded here so it is not rediscovered a fourth time. It belongs to the same
family as the three RTL idioms written up above: a logical layout with a
physical number hard-coded into it.

⚠️ **The testimonials / hero-button design exploration of this round is
DEAD.** Twelve directions were mocked up and the agency killed the whole line the
same day: *"entirely forget about those designs"*. **Do not revive them, do not
cite them, and do not treat "the hero buttons need replacing" as an open task** —
it is not one until the agency raises it again, and if they do it starts from a
new brief rather than from that set. The mocks lived in a session scratchpad that
is cleaned up with the session; nothing in the repo ever referenced them, and the
site was never touched by that work.

### What is still open

1. ✅ **COMMITTED (`07050bf`) AND DEPLOYED (`d3113117-385a-450f-affe-bacd11786869`).**
   Five files: `main.js`, `style.css`, `index.html`, `about.html`,
   `library.html`. ⚠️ `about.html` carries DASH EDITS ONLY — the layout work on
   that page was reverted (§5). ⚠️ The commit also carries the whole
   2026-09-01b round, which this session did not review.
2. ⚠️ **The English of the four phone passages, and the dash replacements inside
   the agency's own supplied copy, need sign-off.**
3. ⚠️ **`.hero-panel`'s RTL shadow is unfixed** — see §6.
4. ⚠️ **`--accent` has no light-ground variant.** `--accent-lit` `#D9835C`
   exists for the dark ground at 6.24:1; on the linen there is nothing, which is
   why the kicker is ink. If the accent is ever wanted under small text on paper,
   that token has to be created and measured.
5. 🔴 **THE REPOSITORY SHOULD BE PRIVATE, AND THAT IS A DECISION NOBODY HAS
   MADE.** Asked directly on 2026-09-01 and the recommendation was **private**,
   for four reasons that are about this repo rather than about repos in general:
   this file is an internal ops log and not documentation; the work is CLIENT
   work and names them with commentary; the history already contains a commit
   called *"Refuse to commit a service-account key"*, so the failure mode is
   demonstrated rather than hypothetical; and public buys nothing here, because
   the thing meant to be public already is — `aliphcreative.com`. Nobody forks a
   portfolio site.
   ⚠️ **Going private does NOT retract what is already out.** It has been public
   since at least 2026-08-26 with roughly 192 KB of this file already on the
   remote; forks and caches are not recallable. Flipping it stops the
   accumulation, which is most but not all of the value.
   ✅ **If a public presence is wanted, the clean shape is a SEPARATE repo** — a
   README, screenshots and the stack — rather than the working tree with the ops
   log inside it.
   ⚠️ Only the agency can change this: it is a GitHub account setting
   (Settings → General → Change visibility), not something a session can or
   should do.
6. 🔴 **Everything carried forward from before is still carried forward** — the
   bts-29 edge purge, the key JSON being the only copy. None of it was touched
   this round. ✅ The `1EMJApB2Rh…` sheet is RESTRICTED now — the agency
   confirmed it on 2026-09-01, closing what this file had called its most urgent
   item.

---

## Session 2026-08-31 — the form opens, and the sheet handed over was the live registration one

✅ **DONE. The form accepts answers**, verified through the live page rather
than asserted. See the state block for the standing facts; what follows is what
this round had to get through.

### 1. 🔴 The sheet handed over was the live registration sheet

`1EMJApB2Rh…` came with "i repurposed the تسجيلات عودة الملكة one, i renamed it
and emptied it". It was neither renamed nor emptied — real registrants' names,
WhatsApp numbers, emails, home areas and employers, under a public
`{"role":"reader","type":"anyone"}`.

🔴 **This was caught by PROBING BEFORE WRITING, and the plan at that moment
would have destroyed data.** The next step was going to be "clear row 1 so the
header rewrites itself" — on what turned out to be the header of live
registration data. What prevented it: a **zero-row `:append`**, which the Sheets
API accepts and which still returns 403 when the caller cannot write. It tests
write access **without writing anything**. Use it before any destructive fix.

⚠️ **Earlier in the session Queen's Retreat's `/api/counts` reported
`totalRegistered: 0, headerPresent: false`** — an empty first tab. It was not
empty hours later. Something restored it in between, unexplained. Do not treat
a reading of that sheet as stable.

### 2. The diagnosis came from WHICH error fired, not from its text

`appendRow` calls `ensureHeader` first, and that function throws three
distinguishable messages. Getting **"Sheets append failed"** rather than
"Sheets read failed" or "Sheets header write failed" proved read-OK /
write-denied before anything was opened in a browser. ✅ **A distinct message at
each step is what makes a 403 diagnosable from one log line.**

### 3. ⚠️ `curl` mangled the Arabic and the Sheet stored it faithfully

The first test row landed with `??????` in every free-text column — while the
columns filled from the Worker's own constant tables were perfect Arabic. **That
asymmetry is the whole tell**: the corruption entered through the test harness,
not the code, because only the values that travelled through the shell were
broken. Re-run through the real page, the same fields came back with full
diacritics and mixed scripts. **Never diagnose an encoding bug from a shell.**

### 4. Two Google walls, and the second one invalidated the workaround for the first

`iam.managed.disableServiceAccountKeyCreation` blocked Create-new-key. Its
condition — `keyType == 'USER_MANAGED' && keyOrigin == 'GOOGLE_PROVIDED'` —
says it denies only keys **Google generates**, so uploading a self-made public
key looks open. A keypair was generated for exactly that and the upload was
refused by `iam.disableServiceAccountKeyUpload`, a separate constraint.
⚠️ **Reading one constraint's condition does not tell you the other paths are
open.**

Then the scoping plan was wrong too: `roles/orgpolicy.policyAdmin` **cannot be
granted on a folder** — Google's docs say organization level, and it "doesn't
appear in the role list for projects". The folder-scoped design could not have
worked. ✅ Resolved by granting it (plus Tag Administrator) to
`info@aliphcreative.com` at the org.

### 5. ⚠️ `git add -A` swept another session's work into this one's commit

`ef173c5` carries this session's Apps Script fallback **and** a concurrent
session's site-deploy notes and mojibake repairs, under a message describing
only the former. Nothing was lost and nothing was pushed, and history was left
alone rather than rewritten under a second agent working the same tree.
⚠️ **In a repo another session may be editing, `git add -A` is not a safe
default** — stage paths.

### What is still open

1. 🔴 **`1EMJApB2Rh…` is public and holds personal data.** Restrict it.
2. ⚠️ **The key JSON at `D:\Personal\keys\aliph-feedback\` is the only copy.**
   Agency password manager.
3. ⚠️ **`C:\Users\Obaida` is a git repo** — `master`, one tracked file, no
   remote. A stray `git init`; Downloads and Documents sit inside it.
4. ⚠️ **`feedback-worker/apps-script/Code.gs` is an UNUSED fallback**, kept
   because its header documents the constraint situation. Delete it if the
   service-account path stays.

---

## Session 2026-08-30c — the two-round gap is closed, this file's own headlines had been corrupted, and the ring stops being faceted

Two instructions: deploy the site, then look at the screenshots. The deploy is
done and verified; the screenshots are next. Cleaning this file turned up a
fault in the file itself.

⚠️ **This is the THIRD session dated 2026-08-30** and the first two are
unlettered, which is why this one is `c`. Read the order from the file, not
from the dates.

### 1. ✅ The site is deployed — `950f0645-ae72-4a29-a061-8f80544c1b6d`

The gap is closed. `aliphcreative.com` had been carrying
`c5b80d8c-ce63-4c1a-8fe9-1686b2d1a75c` since 2026-08-27a, two rounds back.

Only **three** files were new to the bucket — `about.html`, `style.css`,
`main.js` — out of 205 read. Two committed rounds came to 0.37 KiB of upload,
which is what a round of CSS and copy edits actually weighs.

⚠️ **The trigger list named only `aliphcreative.ceo-6c6.workers.dev`**, with no
custom domain — exactly the shape that looked like a failure on the Queen's
Retreat deploy earlier the same day, and it is fine for the same reason: the
root `wrangler.toml` declares no `routes`, so the custom domain stays
dashboard-managed and is not touched. Confirmed rather than assumed: `/`,
`/about` and `/library` all answer **200** on `aliphcreative.com`.

Verified the way this file demands — browser User-Agent, cache-buster, `-L`:

- `style.css` and `main.js` md5-**identical** to the working tree.
- `about.html` live is 21,296 bytes against the tree's 20,937, and the diff is
  **one line**: the Cloudflare Web Analytics beacon. +359 bytes, the same
  number measured on 2026-08-26.
- the bts-29 `?v=2` cache-buster is present live, which is correct — it stays
  until the purge.

### 2. 🔴 Fourteen headlines in this file had letters replaced by emoji

`R` had become 🔴 and `W`/`U` had become ⚠️ **inside words**: line 19 read
`THE EDGE ⚠️AS SE🔴VING A 🔴EPLACED CLIP FO🔴 A ⚠️EEK`. Fourteen lines,
concentrated in the state block at the top — the part most likely to be read
first, and the part written in the loudest voice.

🔴 **It came from this project's own patch scripts.** `git log` puts 12 of the
14 in `9e80672` and the last 2 in `248db42`; every revision before those is
clean. The lines were **born corrupted** — there is no earlier good copy to
recover, so they were reconstructed from context.

⚠️ **A mechanical substitution would have been wrong.** ⚠️ stands for **two
different letters** — `⚠️AS` is WAS but `N⚠️MBE🔴` is NUMBER — and line 933 had
lost characters outright, reading `CHE'S` where `CHROME'S` belonged. A global
find-and-replace would have written `NWMBER` and left `CHE'S` standing.

The repair substituted only ASCII-letters-plus-emoji runs, so no em-dash,
arrow or apostrophe was ever retyped, and it asserted per line that the old
text was corrupt and the new text was not. `git diff --stat` came back
**14 insertions, 14 deletions**.

⚠️ **Verify a scripted edit of this file by reading it back.** The scripts that
write these session entries are the scripts that mangled them, and the damage
sat in the most-read block of the file across two commits without being
noticed. After any scripted write, grep for an emoji adjacent to a letter:
that pattern is never legitimate here — a status mark is always followed by a
space.

⚠️ **`PYTHONIOENCODING=utf-8`, or print to a file.** The first attempt to even
LIST the corrupt lines died on `UnicodeEncodeError: 'charmap' codec` — this
box's console is cp1252 and cannot print 🔴 at all. That is one more false
failure from the same console; see _Things that will bite you_.

### 3. What did NOT change

The purge is still owed, and the form is still closed and waiting on the
agency's service account. ✅ The round being unseen did NOT survive the
session — see below.

### 4. ✅ The round has now been SEEN — four notes checked on the live site

Item 0 is closed. Checked headless against `aliphcreative.com` at 1920x960,
1440x900, 1280x1080, 1100x1080, 1024x1366 and 390x844.

🔴 **TWO FALSE FINDINGS ALMOST WENT IN THIS FILE, BOTH FROM MEASURING THE
WRONG THING.** They are the reason this section is worth reading.

- **A screenshot of an element does not scroll it into view.** The overlapped
  verticals photographed washed-out and nearly invisible — a serious-looking
  defect. They were at `opacity: 0` because the reveal had never fired.
  Computed opacity read `0` below the fold and `1` after scrolling in. **Assert
  the end-state property before believing any capture.** The ring measured
  completely static for the same reason.
- **`querySelector('.lang-switch')` returns the OVERLAY's copy.** There are
  two, and the first in the DOM is the `visibility: hidden` one inside
  `.nav-overlay`, which correctly has no wash. Reading it says the wash is
  missing from the deploy. The visible one is `.masthead .lang-switch`. **Scope
  by `.closest('.masthead')`.**

**1. The two overlapped verticals — PASS.** `overflow` is `visible` on
`.ab-pair`, so the 2-4px the rotation throws past the box is painted, not
clipped. The two pairs are near-identical (≈75px overlap, ≈38px offset), and
row 0's pair clearing row 1's by -6px is harmless because row 1 is `.is-flip`
and sits on the opposite side. ✅ **The `min()` is confirmed doing its job**:
across all six viewports the pair never exceeds its track, so the
shrink-back-on-a-tall-window fault is really gone.
⚠️ **But the dead column is 218px at 1920x960, not the 79px the comment
claims.** The pair spans 537px of a 755px track. Measured from the row edges it
reads as 158px between card and pair and **108px of empty linen to the right of
the pair**, against the card's 57px inset on the left — a lopsided composition
on the picture side. That is a judgement call for the agency, not a bug, but
the number in `--abh`'s comment does not reconcile and should not be trusted.

**2. The ring's `--pop` — PASS, mechanism exactly as documented.** `popMax`
measured **1.117** at rest and **1.260** with a piece picked, which is
`popT = 1 + (POP-1) * (picked ? 1 : 0.45)` computing exactly right for
POP = 1.26. The ring does turn once it is on screen. The front piece is
**plainly** bigger, which was the stated goal over "technically bigger".
⚠️ **The seams are still NOT answered and this pass could not answer them.**
Headless rasterises in software; this file's own rule stands. What is new is
only that the scale is real and reads as intended.
⚠️ **Playwright's `hover` does not land on a ring item** — the 3D transform
means the hit test finds something else, so `pick()` never runs. It was driven
with a dispatched `pointerenter`, which proves the pop logic and proves nothing
about whether a real pointer can pick a piece. **That is untested.**

**3. The dropcap's shadow — the CONSTRUCTION is verified, the fault is not.**
Both `drop-shadow` filters sit on `.dc-sheet`, the element whose
`background-position` actually animates, and all four ancestors read
`filter: none`. So the stale-cached-layer case genuinely has nowhere left to
live. ⚠️ Still no iPad in the loop; the symptom itself remains unreproduced.

**4. The lang pill's wash — PASS, and it is measurable.** The heading only
reaches the pill on a PHONE: glyph left edge 64px against the pill's right edge
128px at 390 wide, while at 768, 1024 and 1440 the RTL heading stops well clear
of it. So `17th.jpeg` was a phone shot, and a desktop check will never show the
complaint. At 390x844, scroll 1000, the letters cross the control and the wash
veils them to **p50 luminance 78, against 224 for the same glyph just below the
pill** — about 35%, visible but subdued, with the knob and `EN` reading clearly
over the top. It does what the agency asked for.
⚠️ A grey glyph fragment still crosses the gap between the knob and `EN`. That
is the wash's deliberate trade — it veils rather than deletes — and it is the
weakest moment of the control.

### 5. ✅ The corruption is repaired everywhere, and the cache is re-measured

**47 lines across three files.** The 31 in `style.css` and the 1 in
`import_bts.py` were repaired with the same token-level method as this
file's 14 — 51 distinct corrupt tokens, decoded from context, applied
longest-first so `⚠️HE🔴E`→WHERE resolves before `HE🔴E`→HERE.

⚠️ **An invariant caught its own flaw before anything was written.** The
guard asserted that the count of "emoji followed by space" was unchanged, to
prove no status marker was eaten. It fired — because tokens ending in the
emoji (`BIGGE🔴 `) are also followed by a space, so they counted as markers.
The replacement was right and the invariant was wrong; it was narrowed to
emoji **surrounded** by whitespace. Nothing had been written yet.

✅ **The stylesheet change is provably comment-only**: strip every `/* */`
from the old and new files and the remainder is byte-identical. Deployed as
`c3804b1c-0d1e-4940-a9f1-efd646c630be`; the live `style.css` is md5-identical
to the tree, has zero corrupt lines and keeps all 194 markers.

🔴 **The bts-29 cache is still stale, measured properly this time.** See
the state block: plain GET 1,146,494 bytes on a HIT, `?v=2` 4,273,402 on a
REVALIDATE. The buster stays until someone purges. **This login cannot** —
`zone (read)` is not `Zone.Cache Purge`.

### 6. ⛔ REVERTED — the plate behind the facets (kept for its measurements)

> 🔴 **THIS ROUND WAS REVERTED THE SAME DAY — see §7.** The plate worked as a
> seam fix and broke the border on every item doing it. It is kept in full
> because the measurements below are what proved a bleed can NEVER close
> this, which is what justified removing the faceting instead. **No plate
> code remains. Do not re-add it without reading §7's `:first-child` trap.**

Deployed as `d7ba90e8-bdd3-40cf-a841-7b9001da0cb7`, **now superseded**. Driven
HEADED against the real GPU (NVIDIA RTX 3050, ANGLE D3D11), which is the only
path that shows this.

🔴 **THE SEAMS ARE A BATCHING DECISION, AND THAT IS WHY NO NUMBER EVER FIXED
THEM.** Skia batches the ten slat quads through `drawEdgeAAImageSet`, an API
that exists to turn antialiasing OFF on interior edges it can prove are shared.
When anything splits that batch, every quad is drawn with AA on all four sides,
coverage at a junction sums to less than 1, and what is behind leaks through.
That is the mechanism behind every word this file already wrote about the fault:
why it is INTERMITTENT frame to frame, and why software rasterisation — one
display list, no quad batching — never reproduced it. **A bleed cannot fix a
coverage shortfall. It can only make it rarer.**

✅ **So the fix stops closing the crack and changes what is behind it.** One
un-faceted copy of the picture, `.ring-plate`, sits behind each item. A pixel
the compositor drops now reveals THE WORK, within a pixel of the colour that
should have been there, instead of the cream page.

**Measured, flat-filling every slat so nothing could hide in picture detail:**

| bleed | plate | seam lines |
|------:|:-----:|-----------:|
| 0px   | no    | **7** |
| 0px   | yes   | **0** |
| 0.3px | no    | **7** |
| 0.3px | yes   | **0** |

🔴 **TWO THINGS HAD TO BE RIGHT OR THE PLATE IS WORSE THAN NOTHING**, and both
were found by measuring, not by reasoning:

1. **It must sit STRICTLY BEHIND the whole arc — hence `--sag`.** At the
   apothem the plane INTERSECTS the surface the slats stand on, and Chromium's
   BSP splitter cuts quads at an intersection. That is z-fighting, and it is far
   worse than the hairline.
2. **`backface-visibility: hidden` ON THE PLATE ONLY.** It sits nearer the axis,
   so on the far half the eye reaches it BEFORE the slats and it occludes them,
   flattening the bend across the whole back of the ring. Flat-filled lime to
   see it: **27,948 escaping pixels** before that line. The SLATS keep
   `visible` — the agency's 2026-08-23b choice of the mirrored back stands.

🔴 **`--plate-s` IS MATCHED TO THE ARC'S OUTER CORNER, NOT THE FRONT PLANE.**
The obvious compensation — pay the depth back at the centre — comes out **2.2%
too wide**, because the facets curve away toward the edges and their silhouette
is narrower than a flat plane of the same nominal width. main.js solves the
projected corner instead. The formula and the reasoning are in the comment.

✅ **THE BLEED STAYS AT 1.1px, and that is a measurement.** The tempting move
is to drop it to 0.3 now that the plate catches what is dropped, taking the
duplication smear down with it — the smear is what the agency rejected at 2.2.
It is the wrong trade. Flat-fill the plate and count what shows THROUGH the
junctions and you get how much gap is actually open: **1,169px at 1.1, 1,363px
at 0.6, 2,826px at 0.3.** The plate is a FLAT plane standing in for an ARC, so
its content is exact at the item's centre and drifts toward the edges; covering
a hairline hides that drift and covering a 3px gap shows it. **The two are a
pair** — the bleed closes the geometric gap, the plate catches the compositor's
miss — and 1.1 adds no smear that was not already on the site.

⚠️ **THE LEVERS THIS FILE RECOMMENDED DO NOTHING, and that is worth recording
because it recommended them twice.** Under the bleed-0 stress test:
`will-change: transform` on the slats — **7 seams, unchanged**.
`backface-visibility: hidden` on the slats — **7 seams, unchanged**. Promotion
changes when a tile is rasterised, not how a non-axis-aligned quad is
composited; the coverage ramp is untouched. Fewer facets was not tried, and is
now unnecessary.

⚠️ **BLEED 0 IS THE INSTRUMENT.** The fault is intermittent at 1.1 — two runs
in this session disagreed with each other at that value — so it cannot be A/B'd
there. At bleed 0 the gaps are deterministic on both rasterisation paths, which
makes it a reliable proxy for "the compositor dropped it". **Test seam work at
bleed 0 and ship at 1.1.**

⚠️ **A COUNT OF PLATE-COLOURED PIXELS IS NOT A COUNT OF FAULTS.** Flat-filling
the plate lime and counting lime looked like an escape metric and is not: most
of those pixels are the plate doing its JOB at the nine junctions. Escape is
lime OUTSIDE the item's silhouette. Half an hour went into driving that number
down before the picture showed what it actually was.

⚠️ **Playwright cannot pick a ring item.** `hover` does not land on a
3D-transformed button — the hit test finds something else — so every test here
drove `pick()` with a dispatched `pointerenter`. The pop logic and the plate are
proven; **whether a real pointer can pick a piece is still untested.**

⚠️ **An element screenshot never settles on a turning ring.** Playwright waits
for stability and times out at ~5s. Pick an item first (that holds the ring), or
use `screenshot --clip`. `eval` has the same ~5s ceiling — keep the waits in the
shell, not in the page.

### 7. 🔴 THE PLATE IS GONE, THE FACETING IS GONE, AND THAT IS THE FIX

Deployed **`76ec4b38-0a01-4860-9454-14fdcc434f01`**. `SLATS = 1`, `--bleed: 0`,
`.ring-plate` deleted. The agency's verdict on the plate round was "the new ring
edits are the worst ive ever seen, the first ver ever made of it was much
better" — and they were right on both counts.

🔴 **THE PLATE BROKE THE BORDER ON EVERY ITEM, and that is what "stupid
borders" was.** It was inserted as the item's FIRST CHILD, which stole
`:first-child` from the first slat — the rule that draws `border-left` and the
two left corner radii. Measured on the live build: `border-left: 0px` against
`border-right: 1px`, and `border-radius: 0 12.96px 12.96px 0`. Every item had a
square unbordered left edge against a rounded bordered right one. **A
pseudo-class selector is a position, not a name: adding a sibling silently
re-points every `:first-child` rule in the file.**

🔴 **AND THE FACETING IS THE SHREDDING — it cannot be fixed while it
exists.** The mechanism from §6 stands and is worth keeping: Skia batches the
strip quads and turns AA off on interior edges it can prove are shared; when the
batch splits, coverage at a junction falls short and the page leaks. Nine
junctions is nine chances per item, every frame. **A bleed cannot fix a coverage
shortfall.** The plate could hide it, but hiding it cost a broken border, three
geometry corrections, and a flat plane standing in for an arc.

✅ **At `SLATS = 1` an item has no interior junction, so there is nothing to
shred.** Not rarer — impossible. It is also what the ring WAS before
2026-08-23's faceting round (`080853d`), which is the version the agency
remembered as better.

✅ **NOTHING ELSE HAD TO CHANGE, and that is why this was one constant.** The
sprite formula degenerates correctly at n = 1; the single face is both
`:first-child` and `:last-child` so it takes the full border and all four
corners from the two end-strip rules — **measured live at 1px/1px/1px/1px** with
a uniform radius, which is the border complaint answered by the same edit.
Hit-testing, previews (4 of 20 items carry a film), the `--o` depth fade
(6 distinct values across the ring) and the keyboard all read the slat and are
untouched. `--pop` still reaches 1.260.

⚠️ **WHAT IT COSTS is the bend, and the bend was 10px across a ~109px item.**
The ring still reads as a ring — the cards are rotated and stand in a circle —
they are simply flat. If the agency ever wants the curve back, `SLATS` is the
one constant, **and the bleed has to come back with it or the strips meet with
nothing between them.** The shredding returns with both.

⚠️ **THE WHOLE §6 PLATE ROUND IS REVERTED.** Its measurements are still true and
still worth reading — they are what proved a bleed can never close this — but no
plate code remains. Do not re-add it without re-reading the `:first-child` trap
above.

### 8. ✅ The same process run over the WHOLE site — three pages × three widths

All against the live site on the real GPU: `/`, `/about`, `/library` at
1920×960, 1440×900 and 390×844. Nine combinations.

✅ **HORIZONTAL OVERFLOW: ZERO on all nine.** `scrollWidth - clientWidth` is 0
everywhere, which is the check that matters after the RTL round — this file
records `left: -9999px` making a 390px page 10,389px wide, and nothing like it
survives.
✅ **BROKEN IMAGES: ZERO of 170** (70 home, 12 about, 88 library).
✅ **No console errors and no failed requests** on a clean load.
✅ **The elements that sit outside the viewport are all supposed to**:
`.film-scroll` / `.film-group`, `.cb-track` / `.loop-group`, and
`reel-slide.is-clone` — marquee and carousel tracks, plus their clones.

🔴 **TWO FALSE POSITIVES, AND BOTH ARE THE SAME MISTAKE THIS FILE KEEPS
RECORDING: measuring the element and not its situation.**

1. **A 401 on every page at every width — from ONE stale entry.** Every
   reading carried the identical timestamp, which is the tell. **browse's
   console and network buffers survive navigation**, so page 1's error is
   reported against pages 2..9 forever. `console --clear` and
   `network --clear` before each load, or every page inherits the first.
2. **An H2 and a `.panel-count` measured off the left edge on `/library`** —
   reported as a heading hanging outside the page. They are inside
   `.panel-body`, which is `opacity: 0` on a COLLAPSED accordion panel. An
   audit that skips `opacity: 0` on the element itself, as this one did, still
   has to walk the ANCESTORS.

⚠️ **`.panel-count` LOOKS like the tnum catastrophe and is not** — worth
recording because the evidence is genuinely damning until the last step. It is
`font-variant-numeric: tabular-nums`, and with it on all ten Arabic-Indic
digits measure **exactly 8.08px**: one uniform advance, which is what this file
calls proof that every glyph became the same empty box. The arithmetic even
agrees with the 2026-08-23b measurement — 50.4px at 120px scales to 8.06px at
19.2px.
✅ **It is fine, and the file's own rule is what settles it: LOOK AT THE
GLYPH.** Rendered at 64px, tnum and normal both draw ٠١٢٣٤٥٦٧٨٩ correctly. The
rule names **Idris Sharp**; `.panel-count` is **"Idris Flat"**, a different
face that implements the feature properly. The uniform advance here is tnum
WORKING.
✅ **Swept the whole site for the real fault: `/` and `/about` have no
tabular-nums elements at all, and `/library`'s four are all `.panel-count` on
Idris Flat.** The stylesheet's only other declaration is `.lb-cap`, which sets
no `font-family` and so inherits the same path `.panel-count` does.

---

## Session 2026-08-30 — the feedback sheet turned out to be somebody else's, and the retreat becomes a portfolio piece

The agency answered the setup list: the Sheet is the Queen's Retreat
registration sheet, renamed and emptied; reuse its service account; and
*"elaborate"* on sharing. Two of those three turned out to be closed doors.

### 1. ✅ The restyle is deployed

Version **`5966511b-dc24-4cc1-b707-cada1d55a6c8`**, `feedback.aliphcreative.com`.
The deploy summary's trigger list named the custom domain, which is the thing to
read. Verified live: `style.css` md5-identical to the working tree, body computing
`0.92rem / 700 / 1.85`, `29LTIdris-FlatBold.woff2` **200**, the dropped
`29LTIdris-FlatRegular.woff2` **404**, `DoubleAliph-Icon.svg` 200, and
`/api/status` still honestly `{"ok":true,"ready":false}`.

### 2. 🔴 The feedback sheet was live under another Worker

`queensretreat` was still deployed and still reading the same spreadsheet. One
`curl` of `https://queensretreat.ceo-6c6.workers.dev/api/counts` settled it —
`ok:true` is the service account authenticating and reading *that sheet*, and
`totalRegistered:0, headerPresent:false` is the agency's emptying seen from the
other side.

⚠️ **Both Workers use UNQUALIFIED ranges, so both land on the first tab.** And
`getCounts()` counts every row whose **column B** is non-empty as an occupied
seat. A feedback row's column B is the client's name, a required field. So:

- every submission would have consumed a Queen's Retreat seat, ticking the
  live hero counter down;
- 🔴 the header check is the one that does lasting damage — Queen's Retreat
  writes its header only `if (!counts.headerPresent)`, so once the feedback
  header sat in row 1 any real registration would be filed under the feedback
  form's column names, permanently;
- a registrant's name and phone would land in a sheet the agency reads as
  feedback.

✅ **Two things were NOT a problem and were checked rather than assumed**: the
phone-duplicate scan reads column C, strips non-digits from the service name and
gets nothing; and the slot tally needs a literal `" @ "` plus a known station
name, so ratings and free text return `null`.

### 3. 🔴 A Cloudflare secret cannot be read back — and `SETUP.md` was wrong

The file recommended reusing the Queen's Retreat service account as the easy
path, and that advice was repeated to the agency before it was checked. It is a
dead end. `wrangler secret put` writes; nothing reads. The Worker is *using*
that private key and nothing can show it. Downloads, Desktop, Documents and the
whole Projects tree were searched for `"type": "service_account"` — nothing.

⚠️ **The trap is that the email IS recoverable** — the Sheet's Share dialog
lists it — so the path looks open until the key is needed.

⚠️ **And a second error followed the first**: having established the key could
not be READ, it was then wrongly said that Queen's Retreat could not be
repointed at all. A write-only store still accepts **overwrites**. Read,
overwrite and rotate are three different permissions; "cannot read" does not
imply "cannot change". `SETUP.md` step 2 now says all of this.

### 4. ✅ Queen's Retreat is archived — the page stays, the registration stops

The agency's call: *"i just want the page to stay up but no need for the
registration process to be functional, since we're displaying it in our
portofolio."*

⚠️ **The page was not behaving like a portfolio piece.** Emptying the sheet
un-hid the seat counter, so it was advertising **100 free seats** on a sold-out
event that ran on 19 July, with the register button enabled.

`Aliph-Creative-Agency/Queens-Retreat-Landing`, commit `bca2722`, deployed as
`9b7d5a4a-26be-4515-92b6-24aa84592092`:

- **all three endpoints answer from a constant** and `getCounts()` is never
  called. `/api/register` is **410** with a message the page already knows how
  to render through `showFormError`.
- **`seatsLeft` is pinned at 2** at the agency's request, to show the counter
  off. ⚠️ 2 is a display decision: the page renders the red «(متبقي فقط!)»
  urgency at 20 or fewer and a plain number above it, so raising this past 20
  quietly removes the thing the counter is there to demonstrate.
- **the page pins the same numbers client-side too**, so it still reads
  correctly if it is ever served as plain static files with no Worker.
- ✅ **the three secrets are left in place, unused.** Nothing to rotate, nothing
  to know, and redeploying needs neither.
- ✅ It also closes something that was always true: `/api/counts` returned every
  registrant's phone number in a public JSON response, and `/api/status?phone=`
  answered whether a guessed number was registered.

**Verified with an EMPTY env**, which is the test — any route still reaching the
Sheet would throw on the missing secrets. counts 200 / status 200 / register
410, and the page rendering «2 مقعداً (متبقي فقط!)» with **no `/api` call made
at all**. Then confirmed on the live custom domain after deploy.

### 5. 🔴 The local clone was eight commits stale, and it was believed

The whole reading of that page — what it renders, what a visitor can click —
came from a checkout **eight commits behind** its remote, 275 lines adrift in
`index.html`. Two of the missing commits removed the payment flow, so
*"the Bit payment link is live"* was reported to the agency and was **false of
the live site**. It surfaced only at `git push`, long after the conclusions had
been stated.

⚠️ **`git status` said "clean" throughout, and that is true and irrelevant** —
clean means no local edits, not up to date. The fix was `git fetch`, a branch to
hold the work, `reset --hard origin/main`, re-apply, re-verify. **Fetch before
reading, not before pushing** — and for any claim about what is live, probe the
deployment rather than the working copy.

### 6. ⚠️ Two deploy facts worth keeping

🔴 **That repo is CRLF; this one is LF.** The patch scripts here normalise to
`\n` to match anchors and write CRLF back. Getting it wrong rewrites every line
and buries the change in a whole-file diff.

⚠️ **`SETUP.md` there says a push to `main` auto-deploys. It did not.** Ten
minutes after `bca2722` no new deployment existed, and every deployment in the
list reads `Source: Unknown (deployment)` — the shape of a manual
`wrangler deploy`. It was deployed by hand.

✅ **A `wrangler deploy` with no `routes` key does NOT remove a
dashboard-managed custom domain** — Cloudflare's own configuration docs name
exactly that as the way to keep routing under dashboard control. Confirmed after
the fact: the trigger list printed only the workers.dev host, and
`queensretreat.aliphcreative.com` still answered 200.

⚠️ **The repo moved orgs** — `AliphCreaitve` → `Aliph-Creative-Agency`. The push
still worked on a redirect and warned. The local remote is updated.

### What is left on the form, and it is all the agency's

1. 🔴 **A NEW service account.** Own Google Cloud project, Sheets API enabled,
   JSON key downloaded — **and kept**, because that file is the only copy of the
   key that will ever exist.
2. **Share the Sheet with its `client_email`** — Editor, notify off.
3. **The three secrets**, from `feedback-worker/`. No redeploy: the notice
   clears itself.
4. 🔴 **The append has still never run.** The first real submission is the first
   time that code executes.

⚠️ **The `.xlsx` export is the only copy of the retreat's registrations** and it
is `*.xlsx`-gitignored in a **public** repo. Real names, phone numbers. Keep it,
keep it out of git, and ideally move it out of the working tree.

---

## Session 2026-08-30 — seven screenshot notes, a clip the edge had been hiding for a week, and a browser that stopped answering

The agency went back through `C:\Users\Obaida\Desktop\issues\` and said what
each of the open screenshots actually means. Their words, item by item, are in
the round below. **Five are built, one was already fixed and deployed, and two
parts are deliberately NOT done** — see _What was left_ at the end.

> 🔴 **`16th` AND `20th` ARE DIFFERENT SCREENSHOTS NOW.** The agency re-uses a
> number for a new shot: `16th.jpeg` on the Desktop is dated 2026-08-30 and
> shows the dropcap's shadow — it is NOT the film-strip crop the 2026-08-27
> round fixed and cited all over `style.css`. **A number in that folder
> identifies a REPORT, not a file.** The stale citation in `.hero` has been
> annotated rather than deleted.

### 1. 🔴 `18th` — nothing was doubled; the still was simply still there

The agency: *"when a vid item in the rings plays its like u put another one on
top of it with the previous ones bounders showing."*

Exactly right, and the mechanism is in the file's own notes. A ring item is
**ten `.ring-slat` strips bent around the axis**; when its reel plays, the film
is **one flat plane** at `translateZ(apo + 2px)`. Every slat except the middle
one sits further back and further out, so their rules came round the edge of
the flat plane as a second, offset outline. A bent rectangle cannot hide behind
a flat one.

`.ring-item.is-previewing .ring-slat { opacity: 0 }`. Once the film runs the
still has no job left.

⚠️ **The transition lives on `.ring-slat`, not in the `.is-previewing` rule**,
and that is not tidiness. A transition declared in the same rule that changes
the value **does not run** — the before-change style has no transition for the
property — so the slats would have snapped off under a film still fading in.
⚠️ `opacity` is named explicitly rather than `all`: this file's standing rule
is that nothing between `.ring` and a slat may transition on transform.

### 2. 🔴 `18th`, second half — the lift never made anything bigger, and that is measurable

The agency: *"just make the current item (the one that plays or gets inspected)
bigger."*

The ring already had a "lift" that the file describes as standing the front
piece proud so *"perspective does the rest — it is nearer the eye, so it is
drawn larger"*. **Measured, it does not.** At `apo` 264 a 40px lift takes the
front piece from **199×210 to 232×216 — 17% wider and 3% taller**. Pushing
slats out along their own normals fans the arc into a longer chord. It reads as
the piece *spreading*. That is why raising it was never the answer.

**A scale is now applied to the item, and the Z is paid back:**

```
transform: rotateY(--a) translateZ(calc(--apo * (1 - --pop))) scale(--pop)
```

The parent's own translateZ is applied **before** the scale in the matrix
chain, so it is not scaled, and a slat lands at
`apo·(1−pop) + pop·(apo + lift) = apo + pop·lift`. **The face stays on the
band's radius at every value of `--pop`** — which answers the objection this
file recorded against scaling (that it would drag the slice of cylinder off the
circle) rather than avoiding it.

Measured at 1920×960 with `--pop` driven by hand:

| `--pop` | rendered | vs the median piece |
|---|---|---|
| 1 | 201.1 × 210.6 | 1.66 |
| 1.081 (front) | 214.7 × 224.5 | 1.89 |
| **1.18 (picked)** | **230.8 × 241.1** | **2.18** |

⚠️ **`layout()`'s fit solver multiplies `widest` and `tallest` by `POP`
before it solves**, so the ring comes out slightly smaller to pay for the
enlarged piece. Without that the front item — already the nearest to the top
and side edges — grows straight through the stage. Checked at 390×844: every
piece inside the window (worst gaps 62px top, 49px bottom) and no horizontal
document scroll.
⚠️ **`POP` and the value `paint()` eases toward must stay equal.**
⚠️ The 0.45 share for a front-but-unpicked piece is applied to the **distance
from 1**, not to the scale. `0.45 × 1.18` would shrink a piece to half size.

### 3. 🔴 `20th` — the space was auto margins, not the gap

The agency: *"notice how i brought the pics closer and on top of each other …
i want u to do this for all the verticals in the about us and make them bigger
too because theres still a lot of spaces."*

Two separate faults, and the second is the one nobody had found.

**The overlap.** `.ab-pair` had a positive gap; `gap` cannot go negative, so
the second figure is pulled back with `margin-inline-start: calc(-1 *
var(--ab-lap))` — logical, so it mirrors. The one pulled back is the one that
paints on top (later sibling, both rotated, so each is its own stacking
context). ⚠️ The collage at the top of this page had been doing this all along:
`c3` and `c5` overlap by **102px**. The long read was written to copy that
section and kept a gap.

🔴 **`margin-inline: auto` ON `.ab-media` WAS EATING THE COLUMN.** It is
correct and inert for a lone mat in a grid track, which is what it was written
for. Inside a flex row an auto margin is **a claim on the free space, settled
before `justify-content` is consulted** — so the container's `center` never ran
at all. Measured with the overlap already in: **70.6px on each side of the
first mat and another 70.6 on the second, 212px of a 748px column**, and the
−84px overlap was paid straight back out. The rendered overlap was **26px
against 84 declared**. The CSSOM said the rule was right; only the *used*
margins showed where the space went.

`.ab-pair > .ab-media { margin-inline: 0 }`, stated before the negative margin
so the two do not fight over the same longhand.

**Bigger.** `--abh` 36vh → **50vh**, cap 380 → 470. Measured at 1920×960 the
mats went **245 → 325/321 wide** and the pair's dead column **259px → 128px**
(before the auto-margin fix; that fix moves the remainder to the outside where
it belongs). The overlap is what pays for the size: two mats that share
`--ab-lap` fit a column that would not have taken them side by side.

### 4. ✅ `19th` — the red line marks dead cream, and nothing was ever aligned to it

The agency: *"i wanted u to cut the hero text area (cream box) to the red
line."* The 2026-08-27 round could not build this because it read the line as
an alignment mark and no two things sat at that x. They were not meant to.

Reconstructed from the crop: it is **1920×~960**, and the crop is the region
x ∈ [813, 1898] — pinned by matching the `.hero-cta` hairline (crop 267..1027,
live 1082..1847) and the dropcap (110px wide in both). The red line is at
**x = 1197**. The panel ran **1022..1905** while the lede, capped at its 20em
measure, only reached **1225**. So **143px of the panel was empty stock that
grew with the window**, and the line was drawn through the middle of it.

The panel is now the measure plus its own padding:

```
width: min(46vw, calc(20 * var(--lede-fs) + 2 * var(--pad)))
```

⚠️ **`calc(20 * var(--lede-fs))`, not `20em`.** It has to be the same length as
`.dropcap-block p`'s measure, so it is read from one variable — but a custom
property holding `20em` resolves against whatever element uses it, and the
panel's font-size is not the lede's. A multiplied length is the only form that
means the same thing in both places.

🔴 **THE LEDE'S LINE COUNT IS UNCHANGED AT EVERY WIDTH**, which is the whole
risk this file warns about (the 19em four-line cliff):

| vw | panel before | after | lede lines before → after |
|---|---|---|---|
| 1920 | 883 | **737** | 3 → 3 |
| 1440 | 662 | **553** | 3 → 3 |
| 1280 | 589 | **533** | 4 → 4 |
| 1100 | 506 | 506 | 4 → 4 — `46vw` wins, inert |
| 950 | 437 | 437 | 4 → 4 — inert |

The measure never moves; only the empty stock beside it goes. At 1100 and
narrower this is a no-op, which is what keeps it clear of the cliff.

🔴 **IT LANDS ON THE LINE — 1196.5 AGAINST 1197.** The first version of this
stopped 29px short, at the hug with equal padding, and shipped with a paragraph
explaining why the agency's own line was wrong. It was not wrong. `--pad` is
57.6px a side at 1920 and the line asks for **86px of total padding, not 115**
— so the START side keeps `--pad` and the END side, the edge being cut, takes
`--pad-cut` (half of it).

⚠️ **The content box is identical either way** — it is the measure at every
width, and only outer padding goes. So every wrap measurement taken against the
equal-padding version transfers unchanged: same lede line counts, same title.
Checked arithmetically at 1920/1440/1280/1100, content box = 20em at all four.
**Trimming padding is the only safe way to reach the line**; squeezing the
measure is what tips 1440 and 1280 to four lines.

### 5. 🔴 `16th` (the new one) — a filter on the parent of the thing that moves

The agency: *"the shadow of the aliph paper part is not where its supposed to
be after triggering the animation for the first time."*

Measured off the screenshot: a **hard-edged grey rectangle offset to the left
of the scrap and below it, with nothing at all on its right.** The declared
shadow is `0 2px` and `0 14px` — straight down, soft, symmetric about the
vertical. A hard rectangle with a sideways offset is not that shadow rendered
badly; it is a **stale raster** of it.

🔴 **The cause is the shape of the construction.** `filter: drop-shadow()` sat
on `.dropcap` — the PARENT — while the only thing that paints, `.dc-sheet`'s
`background-position`, animated inside it. The filter's input changed 24 times
without the filtered element itself painting anything, which is exactly the
case a compositor may serve from a cached layer. The filter is on `.dc-sheet`
now: the element that paints and the element that is filtered are the same one,
so the stale case has nowhere to live.

⚠️ **NOT VERIFIED ON AN iPAD.** There is no iOS device in this loop and the
fault does not reproduce in Chrome at any viewport. What is established is the
mechanism and that the construction allowing it is gone. If it survives, the
next lever is baking the shadow into the sprite's own pixels and dropping the
filter — which needs the cells re-cut with margin, because frame 23's paper
already fills **318 of its 320px cell** (measured, all 24 frames).

### 6. ✅ `17th` — the pill gets the burger's wash instead of its plate

The agency: *"i dont like what u did with the lang button, how about
replicating what u did with the nav button for it?"*

They are right, and the two controls should never have been solved
differently. A solid cream pill stops the heading tangling with the knob by
**deleting the words behind it** — a hole traded for a smudge. `.menu-btn`'s
answer was a radial wash in the ground's own colour, opaque under the mark and
gone by the edge; the pill has the same gradient, the same stops and the same
`.on-dark` flip now, at `inset: -9px -13px` so `closest-side` draws the ellipse
a wide box needs.

⚠️ **`overflow: hidden` had to go**, and that is why this is a `::before` and
not a `background`: the wash must bleed past the pill to fade out, and clipped
to the border-radius it is a hard-edged cream pill again. ✅ Measured in both
languages, the knob sits **4px inside the pill on three sides and 64px on the
fourth** — the clip was holding nothing in, and nothing had to move to remove
it. Re-check if `.ls-knob`'s `left`/`width` pair is ever re-expressed.
⚠️ **Both hover rules had to change too.** They set a solid background, which
on a transparent pill would put the plate straight back for as long as the
pointer is on it. The wash deepens instead.

### 7. ✅ `15th` was already fixed, and it is already LIVE

The agency: *"i suppose u fixed it and if u didnt find the exact issue and fix
it."* It was fixed on 2026-08-27 and it is on the deployed build — **confirmed
against `aliphcreative.com` this session**, not assumed:

- `.reel-slide` opacity is **0.45** on the live stylesheet (it was 0.34)
- the live CSS still carries the `15th.mp4` note explaining why
- the hero's `clamp(460px, calc(100svh - var(--mast-h)), 940px)` is live too,
  which is the other half of that report — the heading cut by browser chrome

Nothing to build. If the agency still sees pale flanks, the number to move is
`.reel-slide`'s opacity and the next stop up is 0.55.

### 8. 🔴 THE CLIP WAS RIGHT ON THE BUCKET AND WRONG ON THE PAGE FOR A WEEK

The agency: *"ur still using the old رفع اللقطة clip although i brought a new
cropped ver."* **They are right, they had reported it once before, and the
2026-08-27 round recorded it as verified.**

`رفع اللقطة` is **bts-29**. What a plain `GET` of
`media.aliphcreative.com/video/bts-29.mp4` returned on 2026-08-30:

```
Content-Length: 1146494          ← the OLD watermarked clip
Cache-Control: public, max-age=31536000, immutable
Age: 616452                      ← 7.1 days
cf-cache-status: HIT
Last-Modified: Sun, 23 Aug 2026
```

The same URL **with any query string** returned `4273402` bytes, 654×1162, no
audio — the clean replacement, `MISS`. The bucket was right the whole time.

🔴 **A `HEAD` REQUEST ANSWERED WITH THE NEW OBJECT.** HEAD and GET are
separate edge entries, so a HEAD probe reported the new ETag, length and
Last-Modified while every visitor got the old body. **That is how this was
recorded as "verified live" and stayed broken.** Verify a replace-in-place with
an unmodified GET and a hash of the BODY — a cache-buster proves nothing,
because it is a different cache key.

🔴 **Root cause: `resources/import_bts.py` and `thumb_media.py` upload with
`--cache-control "public, max-age=31536000, immutable"`.** `immutable` is a
promise the bytes at that URL never change; this pipeline replaces bytes at
fixed keys. Cloudflare kept its word instead of ours, and would have held that
entry until roughly **2027-08**. Both scripts now send `public, max-age=86400`.
The poster and thumb came through fine only because their edge entries had been
evicted — luck, not correctness.

**Two things were done and a third is owed:**

1. ✅ Both upload scripts fixed, so nothing new can get stuck this way.
2. ✅ `about.html` carries **`?v=2` on BOTH `data-film` and `data-preview`** for
   bts-29 — `data-preview` is the inline autoplay and `data-film` is what the
   lightbox turns into `${R2}/video/…`, so versioning one leaves the other
   serving the watermark. Verified after the edit: an unmodified GET of the
   exact URL the page now requests returns `4273402` bytes,
   md5 `ab079e95e2b2461ecfa1abd20ce22b6c`, 654×1162, no audio track.
3. 🔴 **PURGE THE URL IN THE CLOUDFLARE DASHBOARD** (Caching → Configuration →
   Purge Custom URL) and then **remove both `?v=2`**. Until then the stale
   entry is still sitting there under the bare URL.

### A dev server that does not lie, because the old one did

🔴 **`python -m http.server` SERVED SEVERAL OF THIS ROUND'S MEASUREMENTS
FROM CHROME'S CACHE.** It sends `Last-Modified` and no `Cache-Control`, so Chrome
applies heuristic freshness and does not revalidate — through a normal reload,
a query-string reload on the document, and a forced navigation, because
**subresources keep their own cache keys**. One change was nearly recorded as
having no effect. The tell:

```
performance.getEntriesByType('resource')
  style.css  decodedBodySize 178393  (disk: 187486)  transferSize 0
  main.js    decodedBodySize 199930  (disk: 201870)  transferSize 0
```

`resources/devserve.py` serves the same directory with `Cache-Control:
no-store` and **suppresses `Last-Modified`** — a 304 satisfies revalidation
from the same stale entry, so `no-cache` alone is not enough. It is
`aliph-prototype-nocache` on **port 8323** in `.claude/launch.json`.
⚠️ It is a `ThreadingHTTPServer`. The first version was single-threaded and the
page hung with only `/` served, which reads exactly like a broken build rather
than a blocked queue.

**Use 8323 for anything being MEASURED.** Cheap standing check: compare each
critical resource's `decodedBodySize` against its size on disk before trusting
a round of measurements.

### ⚠️ A hidden browser pane freezes rAF *and* CSS transitions

`document.visibilityState` goes `"hidden"` when the pane is not displayed, and
then **`requestAnimationFrame` delivers zero frames and CSS transitions do not
advance**. Three readings this round were wrong because of it: a rAF-driven
`--lift` looked frozen mid-ease and was nearly "fixed"; `.is-previewing` read
`opacity: 1` for seconds while its rule demonstrably matched, because the
transition never started ticking; and a parameter sweep returned a flat line.

**Setting `transition: none` inline and re-reading gives the true value.** That
is how `.is-previewing` was confirmed to take the slats to 0. Assert the clock
is running before trusting anything time-dependent — and when it is not,
measure end states rather than sampling the animation.

### What was left, and why

🔴 **The browser tooling stopped answering partway through this round.** A
safety check began refusing every Browser-pane call — navigate, evaluate,
batch — and the refusal states it will keep firing for the rest of that
session. Everything after that point is reasoned and code-checked but **not
rendered**. Specifically:

🔴 **NOTHING IN THIS ROUND HAS BEEN LOOKED AT.** Not one screenshot was taken
— of seven visual complaints from a designer, about overlapping photographs, a
control's wash, the size of a ring piece and where a panel is cut. Every check
was numeric. The browser was available for two thirds of the round and was
spent reading `getBoundingClientRect`. **This file's own standing rule is
"sample the rendered pixel for anything whose whole job is to be seen", and it
was read at the start of the round and then broken seven times.** Whoever picks
this up: open the two pages and LOOK before changing anything, because the
numbers below are all that stands behind any of it.

✅ **Both items that were filed as "not done" were finished after the agency
pushed back** — they had been deferred by choice and mislabelled as blocked:

- ✅ **The cards are bigger**, by padding and type rather than width: padding
  cap `2rem → 2.9rem`, `.ab-p` `1rem → 1.1rem`, `.ab-lead` up a step.
  ⚠️ **NOT by narrowing `.ab-row`'s 0.86fr picture track**, which is the
  obvious move and the wrong one: the pair is sized off `--abh` and on a tall
  narrow desktop it already fills its track, so taking width from it shrinks
  the PICTURES exactly where they are tightest in order to widen the card.
- ✅ **The collage's verticals are bigger** — `--clh` `38vh → min(48vh, 34vw)`.
- 🔴 **AND THE `min()` IS THE BUG BOTH OF THEM HAD.** A height in `vh` alone
  grows with a tall window while the grid track holding it is governed by the
  WIDTH — so a tall narrow desktop drove the mat past its track and
  `max-width: 100%` silently shrank the picture back. **The clipping got
  smaller the taller the window got, and nothing said so.** `--abh` and
  `--clh` are both capped by a `vw` term now.

⚠️ **Still not seen rendered:** everything above, plus the `.ab-pair`
auto-margin fix, the dropcap's moved filter, and `--pop` in live motion.

---

## Session 2026-08-29b — the form's type comes up to the site's, the option boxes stop being boxes, and a different mark closes it

The agency read the deployed form and sent three notes: *"text are small i can
barly read, match to sizes in the website homepage"*, *"the choices boxes feel
boxy and stiff, change their look"*, and *"dont use the aliph stamp at the end,
use another asset like the double aliph"*.

All three are built and verified. 🔴 **None of it is deployed** — nobody asked,
and the deploy is one command from `feedback-worker/`.

### 1. 🔴 The type was never the site's — it was a form's, invented beside it

The first build copied the site's `:root` wholesale: the palette, both faces,
the linen, the double rule, the language pill. It did **not** copy the scale,
and nothing in the file admitted that:

| | the site | the form, before | now |
|---|---|---|---|
| `html` | `150%` → 24px | `150%` → 24px | unchanged |
| body size | `0.95rem` ≈ 22.8px | **`0.62rem` = 14.9px** | `0.92rem` = 22.1px |
| body weight | **700**, a real drawn Bold | **400** | 700 |
| body line-height | 1.85 | 1.75 | 1.85 |

⚠️ **Both files set `html { font-size: 150% }` and NEITHER has a responsive
override**, so a rem is the same number of pixels on both pages at every width.
That is what makes the comparison exact rather than approximate — and it is the
first thing to check before trusting any rem-to-rem comparison between two
stylesheets. The gap was a flat 1.5× plus two weight steps, on a phone as much
as on a desktop.

🔴 **The site's Bold face had never been copied into this Worker.** `prototype/`
declares four `@font-face` rules — Sharp ExtraBold 800, Flat Regular 400,
Medium 500 and **Bold 700** — and the form carried the first three. Asking for
`font-weight: 700` without it would have got a synthesised smear, which on an
Arabic face reads as the wrong font and does not error. `29LTIdris-FlatBold.woff2`
is in the bundle now and `document.fonts.check('700 16px "Idris Flat"')` answers
true in the browser.

✅ **The payload did not grow: the 400 Regular came OUT.** Nothing asks for 400
any more, and CSS weight matching sends a stray 400 **up** to the 500 Medium —
a real drawn face, not a synthesis. Three faces in, three faces out; the preload
in `index.html` moved with it.

**The rest of the scale, in one place** — every value is a step off the body:

| | before | now |
|---|---|---|
| `.title` | `clamp(1.15rem, 5.4vw, 1.62rem)` | `clamp(1.45rem, 6.6vw, 2.1rem)` |
| `.lede` | inherited 0.62/400 | `1.02rem`, weight **500** |
| `.q-label` | 0.62rem, weight 500 | inherits 0.92rem, weight **700** |
| `.opt-t` | inherited | weight **500** |
| `.field` | `font: inherit` | `0.88rem`, weight 500 |
| `.hint` / `.meta` | 0.48 / 0.5rem | 0.7rem, weight 500 |
| `.notready` | 0.54rem | 0.78rem |
| `.err`, `.rating-read` | 0.5rem | 0.72rem |
| `.ls-opt` | 0.42rem, 500 | **0.62rem, 700** — the site's, to the decimal |
| `.foot` | 0.46rem | 0.68rem |

⚠️ **The question is 700 and the answers are 500, and that is deliberate.** Both
are real drawn weights, so the hierarchy lives in the face rather than in a size
difference nobody can see at arm's length. The same reason puts `.field` at 500:
a form that renders what a client TYPES in the same bold as the thing asking for
it reads as shouting back at them.

⚠️ **`.field` sets its size AFTER `font: inherit`.** The shorthand resets both
size and weight; a rule written above it does nothing.

✅ **The measure improved by itself.** `.sheet` is still `max-width: 34rem` — but
34rem of 0.62rem text is a 55em line, and 34rem of 0.92rem text is 37em. The
width did not move; the type filling it did. Nothing was tuned here.

### 2. 🔴 The option boxes are gone — it is a ruled list now

Every option was its own full-width rectangle: hairline border, 2px radius, its
own warm fill. A four-answer question was four hard-edged buttons stacked in a
column, which is the one thing a page set in this newsprint vocabulary is not.
That is the "boxy and stiff" the agency named.

**What replaced it:** hairlines BETWEEN the rows and a rule above and below the
set, and nothing at all drawn around any single row — answers on a printed form.

⚠️ **The affordance had to move somewhere, and it moved onto the marker and the
row's ink.** A set of options with nothing drawn is prose. So: the marker is
always drawn and is no longer a full-ink outline at rest (`rgba(…, 0.45)` — a
hard outline on every unchosen answer is exactly the stiffness the boxes had);
it comes to full ink on hover; it fills on choosing; the row's text lifts from
`--ink-soft` to full ink; and a **terracotta rule lights at the reading edge**.

🔴 **`border-inline-start` ON PURPOSE, and it is NOT the mistake the tick made
on 2026-08-29a.** A rule at the edge the reading starts from is a **direction**
and must mirror — right in Arabic, left in English. A tick is a **shape** and
must not. Both were checked in the rendered page: the rule is on the right in
Arabic and on the left in English, and the tick points the same way in both.

⚠️ **The rule is reserved TRANSPARENT at rest**, so lighting it moves nothing
sideways. And the focus outline dropped from `offset: 2px` to `1px`: the rows
share their edges now, and a ring pushed 2px out sits on the neighbour's
hairline.

### 3. ✅ The double aliph closes the page, not the stamp

`assets/img/DoubleAliph-Icon.svg`, copied from
`Brand/Assets/Icon/Double Aliph/`. The bare pair of letterforms rather than the
seal — the agency asked for a mark that is not the stamp, and the half-aliph
stamp is what the site itself uses on the home page.

🔴 **It is sized by HEIGHT, and it has to be.** `HalfAliph-Stamp.svg` is a seal
on a 354×342 canvas — near square, so `width: 3.2rem` drove it. The double aliph
is **63×208**, a ratio of 0.31: the same rule would have drawn it **252px tall**.
It is `height: 3.8rem` now, rendering 27.8×91.2. If this mark is ever swapped
again, check which axis is the long one before copying the rule across.

⚠️ **`HalfAliph-Stamp.svg` is still the FAVICON** and still in the bundle. The
instruction was about the end of the page. Worth raising separately: the site's
own three pages use `HalfAliph-Icon.svg` for theirs, and an 18 KB seal is not
what a 16px tab icon wants.

### Verified, not assumed

Against `wrangler dev` on :8341, in a real browser, both languages.

- body computes **22.08px / 700 / 40.85px line** — the site's setting
- all three faces are real: `fonts.check()` true at **700, 500 and 800**
- the option rows compute with **no background, no radius**, a transparent 2px
  inline-start border, and 62.7px of height per row
- a chosen row: `rgb(187, 92, 57)` rule, `rgb(15, 24, 32)` text, ink-filled
  marker — **seen in the render**, in Arabic on the right edge and in English on
  the left
- **14 tab stops**, unchanged, honeypot still excluded
- four real `Tab` presses land on the first checkbox and the terracotta focus
  ring is **visible in the captured pixels**, not merely computed
- `scrollWidth === clientWidth === 390` in **both** languages — no horizontal
  scroll
- `.done-stamp img` renders 27.8 × 91.2 from `DoubleAliph-Icon.svg`
- no console errors

⚠️ **`getComputedStyle` LIED ONCE WHILE CHECKING THIS.** Ticking a box and
reading the row's computed border in the same evaluation returned the UNCHECKED
values — transparent rule, soft text — while the rule was painting correctly the
whole time. A second call returned the truth, and the screenshot agreed with the
second call. Style invalidation is asynchronous with respect to the script that
triggers it, and `:has()` on an ancestor is the case where it shows. **Read it in
a separate call, or sample the pixel** — and treat a single contradicting
computed read as inconclusive rather than as a finding, because the same
staleness can report a false PASS.

⚠️ **The preview pane's screenshots go stale after a scroll on this page** — a
fixed `body::before` linen layer and a small pane between them produced blank
and tiled captures. What worked was a tall emulated viewport with no scrolling
at all. Measure with script; capture without scrolling.

### Not touched

`src/index.js`, the endpoint, the validation, the status probe, the Sheets path,
`wrangler.toml`, `SETUP.md`. This round is `public/style.css`, `public/index.html`
and two asset files. **The form still has no Sheet behind it** — see the section
below, which is unchanged.

---

## Session 2026-08-29a — the client-feedback form, four ways a form breaks in Arabic, and a deploy that silently skipped its own address

> ⚠️ **This round was filed as "2026-08-27c" until the deploy, and it was
> never the 27th.** `date +%F` and every commit stamp say **2026-08-29**; the
> keyboard round really was the 27th and this one inherited its label. Fixed
> throughout. A dated handoff with a wrong date sends the next reader looking
> for a session that does not exist.

The agency sent a Tally form — *How Was Your Experience With Me?* — and asked
for their own version of it: Aliph-themed, on its own page or subdomain,
writing to a Google Sheet "like we did with queen's retreat".

✅ **Built, and then deployed the same day** to
<https://feedback.aliphcreative.com> when the agency asked for it — see
_The deploy_ at the foot of this section. It is live and **deliberately
closed**: the three secrets do not exist yet, so the page says so and will
not take an answer it cannot keep. Opening it needs no redeploy.

### Where it lives, and why it is not a page on the site

`feedback-worker/` is a **third deployable** in this repo:

| | |
|---|---|
| `../wrangler.toml` | the site — assets only, **no `main`** |
| `chat-worker/` | the chat backend |
| `feedback-worker/` | the form and the one endpoint behind it |

⚠️ **The obvious reading of "a separate page" would have been wrong.** A page on
the main site needs an endpoint behind it, and the site's own `wrangler.toml`
says in its header that it has no `main` and must keep it that way. Giving a
live assets-only Worker a script to add a form is a much bigger change than
standing a small Worker up beside it.

✅ **The URL is not lost by doing it this way.** Both addresses are *routing* on
the `aliphcreative.com` zone and neither touches the site's deploy:

- **`feedback.aliphcreative.com`** — Add custom domain. This is what it is built
  for as it stands.
- **`aliphcreative.com/feedback`** — Add route `aliphcreative.com/feedback*`.
  ⚠️ The star is load-bearing: the page also fetches `/style.css`, `/app.js` and
  `/assets/…`, and without it those fall through to the site and 404. Taking
  this option means moving the assets under `/feedback/` first.
  ✅ Its one real gain: same origin, so the language a client picked on
  `aliphcreative.com` carries into the form — `localStorage` is per-origin.

### The Sheets path is Queen's Retreat's, deliberately

Lifted from `D:\Personal\Projects\عودة الملكة-landing page\src\worker.js`: a
service-account JWT signed with WebCrypto and exchanged for an OAuth token. No
dependencies, nothing to keep updated, and it is code the agency has had in
production since July. ✅ **The service account can be Queen's Retreat's own** —
it already exists with the Sheets API enabled. A new one is tidier if these ever
change hands separately.

The header row writes itself on the first submission, so there is no setup step
that can be forgotten and no empty-looking Sheet to wonder about.

### Two decisions taken, and they were put to the user

1. **The services are Aliph's own three plus أخرى**, not the freelancer's list
   on the Tally form (packaging / marketing campaign / visual identity / social
   content). The Tally list names three things the site never mentions;
   تصميم جرافيكي / صناعة محتوى / حلول تقنية وبرمجية are the names the site, the
   ring and the archive already use, so the feedback sorts against real service
   lines.
2. **AR/EN toggle, the site's own pill**, rather than printing both languages in
   every label the way Tally does.

⚠️ **The form's voice changed from singular to plural.** The Tally form is a
freelancer's — "with me", «معي». Every string here is «معنا».

### What lands in the Sheet

Ten columns, **written in Arabic whichever language the visitor used** — the
language they used is column J. The agency reads this Sheet in Arabic; the
visitor's choice of interface is not the same question as what the row says.

⚠️ **Column H is a plain `1`–`5`, not «٤/٥» and not stars.** It is the one
column meant to be averaged and sorted, and a Sheet cannot average a string.

⚠️ **The timestamp is Asia/Jerusalem, not UTC.** Off by two or three hours
depending on the season, which is exactly enough to put an evening submission
on the wrong day.

### The four things that were wrong first

Every one found by measuring, and each would have shipped looking fine.

#### 1. 🔴 `[hidden]` is only `display: none` in the USER-AGENT sheet

So any author rule that sets `display` beats it — and `.field { display: block }`
did. The three «أخرى» inputs carried the attribute, reported
`el.hidden === true`, and **were on the page the whole time**, in the tab order.
Found by walking Tab and seeing `INPUT[servicesOther]` between the services and
the next question.

`[hidden] { display: none !important }` now sits at the top of the stylesheet.
The `!important` is not a shortcut around a specificity fight; it is the only
way an attribute meaning "this is not here" can outrank a class that happens to
mention display.

#### 2. 🔴 `left: -9999px` is an RTL bug

The standard way to hide a honeypot, and it is wrong in an Arabic document: the
inline start is on the **right**, so content parked 9999px to the left is
content the page can **scroll to**. Measured at 390px wide, `scrollWidth` came
back **10389** against a 390px viewport — the whole form sat in a window that
slid ten thousand pixels sideways.

1px, `clip-path: inset(50%)`, at its own static position now. It renders, it
occupies nothing it can overflow with, and it stays as findable to something
filling every input as it ever was.

#### 3. 🔴 The checkbox tick was a `>` chevron in Arabic

It was drawn with `border-inline-start` + `border-block-end` rotated -45°, which
is a tick in LTR — and in RTL the logical properties resolve to the **mirror
pair**, so the two lit borders drew a chevron. **A tick is a shape, not a
direction**; it points the same way in both languages. Physical `border-right` +
`border-bottom` now, and that is the one place in this stylesheet that reaches
for physical properties on purpose.

#### 4. 🔴 The rating was forced `direction: ltr`

Reasoning: "so low is always on the left". What it produced was the single row
of stamps hard against the **left** edge of an otherwise right-aligned Arabic
page, with its own «٤ من ٥» read-out stranded at the far right — the label for a
control sitting as far from it as the page allows. A rating scale starts where
the reading starts: rightmost in Arabic, leftmost in English. The fill logic is
DOM-order `:has()`, so it follows the direction for free.

⚠️ **And a measurement trap while checking it.** A first sweep read "0 of 5
stamps lit" with rating 4 chosen. The CSS was right: Playwright's `check()` is a
real click, so the pointer was still resting on the star, and what was measured
was the **hover preview** (0.45) overriding the chosen state. Parking the mouse
at (5, 5) first gives `1 1 1 1 0.16`.

### Also: two decorative spans were eating their own inputs

`.opt .box` and `.star-mark` are drawn exactly over the transparent input they
illustrate, and were taking the click. A person never notices — the whole row is
a `<label>`, so the click reaches the input anyway — but the input was not
something that could be aimed at directly, which is a state no control should be
in. Both are `pointer-events: none` now; they are `aria-hidden` decoration and
have no business in the hit test.

⚠️ **The inputs are NOT `display: none`.** A hidden input is not focusable, so
the whole set would drop out of the tab order and the arrow keys would stop
moving between radios — the exact "cannot be filled in without a mouse" failure.
They are transparent and sized over the drawn box instead.

### Verified, not assumed

Against `wrangler dev` on :8341, with real `page.keyboard.press()` and real
POSTs. **Every validation path returns before Sheets is touched**, so all of it
runs with no credentials at all.

The endpoint:

- honeypot filled → **200 and the row is dropped**. Answering `ok` is the point:
  a rejection tells the sender what tripped and the next attempt comes back
  without it.
- a submission in 300ms → `too_fast`. There is a 4s floor.
- all **eight** missing fields → 400 `missing_field`, naming the field
- `rating: 9`, an unknown service, an unknown radio value → 400, each naming its
  field
- `GET /api/feedback` → **405**

The page:

- **14 tab stops**: pill → logo → name → 4 service boxes → comms → value →
  liked → vision → rating → improve → send. Arrow keys move within a radio
  group.
- «أخرى» reveals its field **and gives it focus**; unchecking hides it and the
  text survives
- the rating reads «٤ من ٥» / "4 of 5" and lights 4 of 5
- the toggle restates **what is already on screen** — the rating read-out and
  any error showing — not just the static labels
- a full submission hides the form and the intro, shows the card, and **moves
  focus to it**
- **no horizontal scroll at 390px**, both languages, no console errors

🔴 **NOT verified: the append itself.** It needs the three secrets and a shared
Sheet. SETUP.md step 5 is the first real submission, and it is the only part of
this that has never run.

### The deploy — `feedback.aliphcreative.com`, live and deliberately closed

✅ **Live at <https://feedback.aliphcreative.com>, version `fe8b50ba-17a3-4dd9-9573-179b1412cc13`.**
The custom domain and its DNS record were created by the deploy itself, from
`routes` in `feedback-worker/wrangler.toml`, so the address lives with the thing
it points at rather than in somebody's memory of a dashboard.

✅ **The site is untouched.** `aliphcreative.com` still answers 200 and is still
`c5b80d8c-…`. The site holds the apex and `www`; this holds `feedback`.

#### 🔴 The Worker had to be deployed BEFORE its secrets could exist

`wrangler secret put` refuses a Worker that is not there —
`Worker "aliph-feedback" not found. If this is a new Worker, run wrangler deploy
first.` So **"live at a real address with no Sheet behind it" is a state this
form was always going to pass through.** It is not a mistake in the ordering;
it is the only ordering Cloudflare allows.

Left alone, that window is the worst state the form has: a client answers eight
questions, presses send, and gets the generic failure telling them to try again
— which will never work, and their writing is gone. So the window was closed
rather than noted:

- **`GET /api/status`** answers `{ok, ready}` **and nothing else**. ⚠️ A
  boolean, deliberately: not which secret is missing, not a length, not a
  prefix. That an endpoint is unconfigured is all a public endpoint has any
  business saying.
- **`POST /api/feedback` while unconfigured is `503 not_configured`**, not the
  generic 500 the missing-configuration throw used to produce, and its message
  says plainly **that nothing was saved** and to write directly instead.
- **The page asks on load**, shows a notice above the questions and disables
  Send, with `aria-describedby` pointing at the notice — a greyed-out button is
  nothing at all to someone who cannot see the banner explaining it.
- ⚠️ **It FAILS OPEN.** If the probe itself cannot be reached the form stays
  usable: the Worker refuses the submission with its own message anyway, and a
  form disabled by a failed status probe is a form that breaks for everyone
  whenever anything twitches. Verified by aborting the request.

✅ **This outlives the setup window.** A key rotated or revoked months from now
stops the form politely instead of eating submissions.

#### 🔴 A MISPLACED KEY IN `wrangler.toml` DOES NOT FAIL — IT DOES NOTHING

`routes` was written *underneath* `[observability]`. In TOML **a bare key
belongs to whichever table header precedes it**, so it was read as
`observability.routes`. wrangler deployed happily, published to `workers.dev`
with **no custom domain at all**, and the only sign was one line —
`Unexpected fields found in observability field: "routes"` — printed *above*
the asset-upload log, where a successful-looking deploy scrolls it out of sight.

The deploy summary is the thing to read, not the exit code: it prints the
triggers it actually created. First attempt said
`https://aliph-feedback.ceo-6c6.workers.dev`; the second said
`feedback.aliphcreative.com (custom domain)`.

⚠️ **`routes` now sits above every `[table]` header and carries a note saying
why it must stay there.** The same trap applies to `account_id`, `main` and
`compatibility_date` — every top-level key in that file.

#### ⚠️ `workers.dev` is now OFF for this Worker

A side effect of declaring `routes`: wrangler warned that because `workers_dev`
is not in the config it would be disabled, and it was. `aliph-feedback.ceo-6c6.workers.dev`
no longer answers. That is the right end state — one address, not two — but it
is worth knowing before someone tries the workers.dev URL to test and reads its
silence as a broken deploy. `workers_dev = true` brings it back.

#### `.dev.vars` exists now, and it is gitignored

The `not_configured` guard runs **before** validation — correctly, since with no
Sheet nothing else matters — which meant the local suite could no longer reach
any of the validation paths. `feedback-worker/.dev.vars` holds three dummy
values so `configured()` is true under `wrangler dev`. ⚠️ They are **not
credentials** and authenticate against nothing; every invalid payload returns
before Sheets is ever called. It is gitignored, and `wrangler dev` only reads it
at startup — create it before starting the server, or restart after.

#### Verified on the live host

- `/` → **200**, `https`, both faces loaded, no console errors
- `/api/status` → `{"ok":true,"ready":false}`
- `POST /api/feedback` → **503 `not_configured`**, bilingual, says nothing was
  saved
- the notice is shown, **Send is disabled**, no horizontal scroll
- `aliphcreative.com` → **200**, unchanged

🔴 **Still never run: the append.** It needs the three secrets and a shared
Sheet. The agency's first real submission is the first time that code path
executes.

### What is waiting on the agency

1. 🔴 **THE ONLY THING BETWEEN THIS AND WORKING: three secrets.** The Google
   Sheet and the service account do not exist yet. `SETUP.md` is the whole
   procedure; from `feedback-worker/`, `npx wrangler secret put SHEET_ID` and
   the same for `GOOGLE_SA_EMAIL` and `GOOGLE_SA_PRIVATE_KEY`. **No redeploy.**
   ✅ The Queen's Retreat service account can be reused — it exists and has
   the Sheets API on already.
   ⚠️ The step people skip is **sharing the Sheet with the service account's
   `client_email`** — Google answers a 403 that says nothing about sharing.
2. ✅ **CLOSED — the address is `feedback.aliphcreative.com`**, chosen by the
   agency and deployed 2026-08-29. The `aliphcreative.com/feedback*` route is
   still documented in `SETUP.md` as the alternative; it would need the page's
   assets moved under `/feedback/` first, and its one real gain is same-origin
   so the language a client picked on the site carries into the form.
3. ⚠️ **Spam protection is a honeypot and a 4-second floor.** Both are speed
   bumps. If this is ever abused for real the answer is **Turnstile** — add the
   widget and verify the token before the append; nothing else changes.
4. ⚠️ **The palette is duplicated** at the top of
   `feedback-worker/public/style.css`. If the ink, cream or terracotta move in
   `prototype/style.css` they have to move here too. The fonts and the linen are
   **copied, not linked** (508 KB of WOFF2 + 381 KB `fabric.webp`) so this
   page's first paint does not depend on the main site being up.
5. ⚠️ **`noindex` is set.** This is a link the agency sends to a client, not
   something that should turn up in a search for Aliph.

---

## Session 2026-08-27b — the last five media surfaces get a keyboard, and four ways a focus ring can be perfectly correct and completely invisible

The brief was "read the handoff and start right away". Almost everything on
_The next round_ is waiting on the agency — `19th.png` needs a question asked,
the pill decision is theirs, the seam fix is conditional on them coming back,
open questions 9/11/16/20/21 are all theirs. **Item 12 was the one thing on the
list that needed nobody**, so that is what was built.

🔴 **This round is committed (`b52aeb9`) and NOT DEPLOYED.** Deploying puts it
on the agency's live domain and nobody asked for that; it is one
`npx wrangler deploy` away whenever it is wanted.

### What was open, and why it had been left

Six media surfaces opened the lightbox **on click and on click only**. Three
had been fixed one at a time in earlier rounds — the archive's 82 tiles, the
ring, the about page's five `.ab-media` clips. Five never had been: the hero
film strip, the gallery wall, the reel carousel, the about page's three
clippings, and the still beside block 1 (which this file had never even
counted — it lists six surfaces and there were seven).

This file recorded the reason it had been left: *"Making them all focusable
adds ~39 tab stops to the home page — a judgement about tab-order weight
rather than a bug."* That count is right and it is also not the price of the
feature. **A field of pictures is one composite widget**, not N controls: one
tab stop, arrow keys within it, Home and End to the ends, Enter and Space to
open. The home page gained **four** stops and the about page one.

Walked with real Tab presses under Playwright, in both languages: **32 stops
either way**, one per field.

| field | openable nodes | nodes in the DOM | tab stops |
|---|---|---|---|
| hero film strip `.film-group` | 4 | 24 (6 cloned groups) | 1 |
| gallery wall `.gwall` | 12 | 12 | 1 |
| reel carousel `.reelshow-track` | 8 | 24 (tripled) | 1 |
| block 1 still `.wb1` | 1 | 1 | 1 |
| about clippings `.clippings` | 3 | 3 | 1 |

✅ **Opening was already free and no new opening code was written.** Every
selector above is in the lightbox's `OPENS` list, and its generic
`[role="button"]` keydown handler already answered Enter and Space for anything
matching it. Naming the nodes and letting the keyboard reach them was the whole
job. Names come from the node's own `figcaption` or `alt` where it has one (the
clippings, the wall's three brand marks) and from `mOpen`/`mPlay` plus a new
`mOf` where it does not — «افتح الصورة — ٣ من ١٢», "Play film — 1 of 8".

⚠️ **`#reelTrack` stopped being a tab stop by itself, and that is correct.** It
is a scroll container with `role="group"`, and a browser makes such a thing
focusable **only while it has no keyboard-focusable children**. Giving the
slides a tab stop took the track's away, so the count is one and not two. It
keeps its role and its name, which is now the group's name. Measured, not
assumed — 0 stops land on it.

### The four things that were wrong first

Every one of these was found by measuring and would have shipped as "verified"
on any weaker check.

#### 1. 🔴 The strip's new tab stop lived inside `aria-hidden="true"`

`.filmstrip` is authored `aria-hidden="true"` — four photographs repeated
across the hero, plus a sprocket run, are decoration right up until something
makes them openable. Putting a tab stop inside it is **focusable content inside
aria-hidden**, the exact WCAG failure `inert` was brought in to fix on the
ring's off-screen stages on 2026-08-26.

The attribute now comes off **in the same function that names the frames**, not
in the markup. Uncovering the strip and naming it have to be one act: a page
whose script never ran would otherwise hand a screen reader twenty unnamed
figures instead of a decorative strip it can ignore.

⚠️ **NOT `inert` on the clones**, which is the other half of the ring's answer
and would be wrong here: `inert` takes pointer events with it, and the strip
travels, so most of the frames under the cursor at any moment **are** clones.
They keep `aria-hidden` and `tabindex="-1"` — hidden and unreachable, still
clickable.

#### 2. 🔴 `overflow: hidden` is a SCROLL container, and the strip ran away by 4,121px

Tabbing to a film frame made Chrome scroll it into view the only way it could:
by setting **`scrollLeft` on `.filmstrip` to -4121px**. It never came back. That
is a second, invisible offset sitting under the gsap translation, permanently
misaligning the strip's window — and it happens on the real Tab key, not only
under a scripted `.focus()`.

`overflow: clip` clips identically and **is not scrollable**, so there is
nothing for the browser to scroll. Both lines are in the rule, `hidden` first as
the fallback, and `hold()` zeroes the offset where `clip` is not understood.

#### 3. 🔴 The carousel's ring was invisible twice, and computed style said it was fine

* **Outset**, the global `outline-offset: 3px` was **clipped away entirely**: a
  slide is exactly as tall as the track that holds it — **806px against 806px**
  at 1440 — so the whole ring lands outside the track's overflow.
* **Inset** (`outline-offset: -3px`), it was **painted over**. `.holder` holds a
  full-bleed `<img>` and an absolutely-positioned `video.preview`, and a
  positioned descendant paints above its ancestor's outline.

🔴 **`getComputedStyle` reported `rgb(187, 92, 57) solid 2px` for the inset
version and a pixel sweep of the slide found ZERO accent pixels.** This round
was one step from writing "focus ring verified" on that reading. It is a
positioned `::after` above both children now, with `pointer-events: none` so
the slide keeps its own click.

#### 4. 🔴 The strip's ring was drawn on a node 3,704px off screen

`xForFrame()` shifts by whole **periods** to the nearest x, so what it centres
is whichever **copy** of a frame is closest — and the original, which is the
node that actually holds focus, is routinely a period away. Measured on four
consecutive arrow presses: the focused element sat at x -3704 with the strip
running 0–1440. `visibleFrac: 0`, every time. A perfectly correct
`:focus-visible` ring, drawn off screen, forever.

✅ **The file already carried the fix.** `focus(id)` has always marked **every**
copy with `.pop` for this exact geometry. `.is-kbd` is the same trick for the
keyboard, written by `hold()` and cleared by `release()`; `:focus-visible` on
`.film-frame` is turned off so there is one answer rather than two that
disagree. Copies of one index are a whole period apart and the period is wider
than the window, so **six copies marked, exactly one visible**, measured on
every press.

### The strip holds still while it is being read

The strip travels at 34px/s, so a frame you have just arrowed onto slides out
of the window while you look at it. `hold()` stops the loop and centres the
frame — the same courtesy the service hover already got — and `release()`
starts it again when focus leaves the strip.

⚠️ **`release()` defers to `has-pop`.** A service can be focused in the ring
while the strip is being tabbed, and the ring is the louder claim on the strip;
restarting the loop under it would undo the centring `focus(id)` had just done.

This is also a small win on **WCAG 2.2.2**: the strip has no pause control at
all, and now at least stops for anyone reading it with a keyboard.

### Verified, not assumed

All of it driven by **real `page.keyboard.press()` calls**, not dispatched
`KeyboardEvent`s — a synthetic event exercises the same listener but proves
nothing about reachability by the **Tab key**, which is the whole point.

- **32 sequential tab stops** in AR and in EN; 1 each on the strip, the wall,
  the carousel and the block-1 still; **0** on `#reelTrack`.
- Arrows follow **reading order and flip with the language**: RTL ArrowLeft
  goes `gw-a → gw-b → gw-c`, EN ArrowRight does the same. Home and End reach
  the ends; both ends **clamp** rather than wrap.
- Enter and Space open the right **group**, not the whole page: «١ / ١٢» on the
  wall, «١ / ٨» on the carousel, «1 / 3» on the clippings. Escape closes and
  **returns focus to the tile it came from**.
- Roving is real: 12 wall tiles, **1** tabbable; 3 clippings, **1** tabbable,
  still 1 after arrowing.
- The strip **moves** (d≈21px/600ms), is **held** while a frame has focus
  (d=0.00), and **resumes** on blur (d≈21px).
- `.filmstrip` `scrollLeft` stays **0** through Tab and arrows, on desktop and
  on a 390px phone.
- **Zero** focusable nodes inside `aria-hidden` once `inert` is honoured, and
  **zero** `role="button"` nodes without an accessible name.
- The accent ring **pixel-counted on all five fields** — 6833 / 4962 / 6675 /
  28521 / 2211 accent pixels — after a sweep found 0 on the carousel.
- Reduced motion, a 390×844 phone, and the three surfaces that already worked
  (archive «١ / ٧٩», ring «١ / ٩», `.ab-media` «١ / ٥») all still pass.
- **No console or page errors** on any page, in any of the three profiles.

### Two things worth knowing for the next audit

⚠️ **A "focusable content inside aria-hidden" sweep must honour `inert`.** The
first sweep here reported **12**. Eleven were the ring's off-screen
`.ring-item` buttons, which are `inert` as well as `aria-hidden` and therefore
already out of the tab order — false positives, and this file had already
written down why they are correct. There was exactly one real finding.

🔴 **`os.replace` LEAVES A CORPSE WHEN THE WRITE RAISES, AND `prototype/` IS
THE DEPLOY DIRECTORY.** Every patch script here now writes to a temp file
beside its target and `os.replace()`s it over the original — the rule adopted
after a script truncated `style.css` to 0 bytes on 2026-08-27a. `mkstemp`
creates that file in the TARGET's directory, so a run that raises between
`mkstemp` and the write leaves a zero-byte `.tmp` in `prototype/`. Two of them
were swept into `b52aeb9` by `git add -A` and would have deployed as two
empty assets. `*.tmp` is gitignored now. **The safe-write rule is still right;
it just needs the litter picking up.**

⚠️ **A test that moves focus can move the thing it is measuring.** "The strip
resumes when focus leaves" first reported **False**. The code was right:
focusing the first link on the page scrolled to the top, took the strip out of
the viewport, and the IntersectionObserver correctly paused it. The test's own
side effect satisfied a *different* pause condition. A plain `blur()` in place
passes.

### Not touched

The `.gw-tile.gw-mark` tiles — the three brand marks on the gallery wall — open
the lightbox on a **logo** when clicked, and now from the keyboard too. That is
pre-existing behaviour and it was left exactly as it was: changing which things
open is a design call, and keyboard parity with the mouse is not. They are
named by their own `alt` rather than by `mOpen`, so nothing announces a logo as
a photograph. **Worth asking whether they should open at all.**

---

## Session 2026-08-27 — the agency's eight screenshots, a GPU that lies to headless, and a script that ate the stylesheet

The brief was the four instructions carried over from 2026-08-26 plus "read the
handoff and start doing the tasks". Everything below is **deployed** — version
`c5b80d8c-ce63-4c1a-8fe9-1686b2d1a75c`, verified on `aliphcreative.com` with a
cache-buster and a browser User-Agent, `style.css` and `main.js` md5-identical
to the tree and all three HTML pages byte-identical.

⚠️ **Two of the agency's complaints meant something different from what this
file recorded**, and both readings had been written down as fact:

| screenshot | what this file said | what it actually was |
|---|---|---|
| `17th.jpeg` | the pill sits ON TOP of a heading and hides a word | the pill has NO BACKGROUND, so the heading shows through it and the control disappears into the type |
| `21th.png` | "did not reproduce" across seven widths | measured the wrong element — `.ab-card`, when the crop is `.clip-text` |

### 1. 🔴 The two fixed controls had no ground of their own — `17th.jpeg`

`.lang-switch` is a hairline ring, an ink knob and two words, with
`background` never set. The page shows **through the middle of it**. Over the
لماذا ألِف؟ heading that means the black letters run through the pill and the
ink knob merges with them: neither the control nor the word can be read. The
burger is worse — two 2px ink bars laid across ink type are not the wrong
colour, they are the *same* colour.

Neither state of an inverting control can fix that. Cream bars on cream paper
vanish exactly as completely as ink bars on ink type. So each control now
carries its own ground:

- **the pill is FILLED** — `var(--cream)` in the light state, `var(--ink)` under
  `.on-dark`. Scoped to `.masthead .lang-switch`, because the overlay's copy
  sits on a solid ink field where transparent is already right.
- **the burger clears a soft radial space** — a `::before` wash in the ground's
  own colour, opaque at the centre and gone by the edge, flipping with
  `.on-dark`. Over plain paper it is cream on cream and costs nothing. A rounded
  PLATE was the other option and was not taken: this control has been a bare
  mark since it was drawn, and a box would be a new object on the page rather
  than the page giving way.
- the `.on-dark` hover had to be **pre-mixed** (`#1E2B36`): the `background`
  shorthand replaces the new fill, so the translucent lift that used to sit over
  nothing would have wiped the ink out.

### 2. ⚠️ And the list of dark sections had rotted in BOTH directions

`overDark()` decided the inversion by hit-testing ONE point — the control's
centre — and asking `closest()` against a hardcoded list in `main.js`:
`.filmstrip, .banner, .footer, .testi, .sw-stage, .svc-pick.is-active`.

**Three of those six name things that no longer exist** anywhere in the
stylesheet or the markup. Nothing would ever have said so. And a new dark band
would have been invisible to it until somebody remembered this file existed.

A section states `--ground: dark` next to its own background now, and because a
custom property INHERITS, every descendant answers the same without being
listed. Reading it is one lookup on an already-computed style — no `closest()`,
no selector matching. Declared on `:root` as `light`, overridden by `.filmstrip`,
`.banner` and `.footer`.

⚠️ **The load curtain is deliberately left saying nothing.** It is ink, but it
COVERS the button while it is up, and counting it used to leave the button stuck
dark after the curtain lifted — so it inherits `light` and the old exception
needs no code at all.

⚠️ **Five sample points, not one**, majority wins, ties stay light. The centre
alone says nothing about a control straddling a section's edge, and the pill is
86px wide, so its two ends can be over different fields. Measured cost:
**0.08–0.14 ms per call**, and `queueMenuSync` still spaces the whole sync to
~100ms — ten hit tests every six frames, not ten every frame.

⚠️ **The picture holders were deliberately NOT marked dark.** `.gw-tile`,
`.ab-holder` and `.tile-img` all carry `background: var(--ink)` and none was in
the old list. They stay `light`: over a photograph either halo is visible and
cream is the page's own colour, so a cream one reads as the paper showing
through. The halo is what guarantees legibility there, not the choice of state.

### 3. 🔴 The ring seams are a GPU fault — `22th.png`, and why three rounds missed it

**Every check this project has run on the ring was blind to this.** Headless
Chromium rasterises in SOFTWARE. Driven headed against the real GPU (NVIDIA
RTX 3050, D3D11), with every slat flat-filled so nothing could hide in picture
detail, the seams appear. The identical run headless does not have them. Both
frames are kept: `resources/notes/seam-2026-08-27-gpu.png` and `-software.png`.

The screenshot was measured before any of that, and it settles the old
argument for good: the pale lines solve to **69% page colour over the maroon**,
consistently across R, G and B. They are GAPS, not a dark composite — on a
build that already carried the `--bleed` fix and was verified live.

⚠️ **It is intermittent, and that is stated rather than glossed.** Four
further GPU sweeps — ring held under the pointer and ring turning, centre mark
shown and hidden, at 1.1 / 2.2 / 3.4 / 5px — could not make it come back. And
the geometry is provably fine: `resources/notes/slat-seam-bench.html` stands the
same ten facets up with no page around them and shows seams at bleed 0 and none
at 0.5px or more, **on both paths**. So the fault is the compositor dropping a
sub-pixel at a junction under some batching it chooses for itself.

`--bleed` is doubled to **2.2px**. That is a MARGIN, not a proof: it doubles how
much the compositor has to lose before a junction opens, and the only real price
is the two END slats, whose picture is now 2.2px out of step instead of 1.1 — at
the extreme outer edge of the frame, where nothing can be read against it.

🔴 **The rule this leaves behind: never certify a 3D-transformed surface from
a headless screenshot.** Anything that leans on compositing — `preserve-3d`,
`will-change`, layer promotion, blend modes — has to be looked at on a real GPU.

### 4. The about page's clippings — `18th.png`, `20th.png`, `21th.png`

All three are one section, and two of them are the same fault on different axes.
It is also the same fault `13th.png` reported against `.ab-media` on 2026-08-24
and got fixed there — **the clippings the long read was copying never got the
same treatment**, so the section that set the pattern was the one still showing
it.

**Across (`20th.png`).** `.clip-img` capped its own width through the height,
`min(100%, 38vh * ratio)`, inside a figure that still spanned its whole 4-column
track. Dead cream per side, measured:

| viewport | 1024 | 1280 | 1440 | 1600 | 1920 |
|---|---|---|---|---|---|
| before | 57px | 97px | 122px | 147px | **178px** |
| after | 21 | 21 | 21 | 21 | 21 |

— against a photograph 197px wide. The landscape clipping was always fine on
this axis (21–23px): its picture is wide enough to reach the track on its own.

**Down (`18th.png`).** The figure is a grid item and stretched to a row whose
height the TALL portrait clipping beside it sets, so the landscape one carried
its caption at the top of a mat with **164px** of empty stock under it at 1024,
104 at 1280, 67 at 1440. Now 21px at every width.

**The card (`21th.png`).** ⚠️ **The sweep that "did not reproduce" this
measured the wrong element.** It measured `.ab-card`, which is a different
component in a different section and is genuinely fine (2–3px at every width).
The crop is `.clip-text.c4`, which shares its row with the tall `.c5` clipping
and stretched to it: **148px** of slack under the last line at 1024, 192 at 1440,
**302** at 1920. `align-self: start` is the whole fix; `.c2` already carried
`center` for the same reason. The last paragraph's trailing `1rem` came off too,
so the card now matches the quote clipping beside it (44px against 45).

The mechanism is `.ab-media`'s, copied exactly: `width: fit-content` plus a
holder whose width is DEFINITE (`--clh * ratio`, `--clh: 38vh` named on
`.clippings`). A percentage inside a shrink-to-fit parent is the circular case
this stylesheet keeps warning about. ⚠️ The phone rule puts `width: auto` back,
for the same reason `.ab-wide` does.

### 5. The hero ran off the bottom of an iPad — `16th.jpeg`

`--hero-h: clamp(560px, 88vh, 940px)`, and **88% is an arithmetic coincidence
rather than a proportion**: the masthead is 104.8px, so on the 1440×900 window
this was designed at, 88vh + 104.8 comes to 897 and the hero appears to end
exactly at the fold. It only holds at 900.

Two things break it on an iPad and the screenshot has both. `vh` on iOS resolves
against the LARGE viewport — the window as if the chrome were hidden — so 88vh
was measured against 834 while only 759 was on screen; and 105px of masthead
comes off the top of even that. Reconstructed from the screenshot: a 727px strip
in 654px of room, **73px under the fold**, and the bottom sprocket row is the
bottom 19% of the tile. The frames ran off the edge of a strip with perforations
down one side only, which stops reading as film at all.

Now `clamp(460px, calc(100svh - var(--mast-h)), 940px)`, with the `vh` line kept
underneath as the fallback for an engine without `svh`. `--mast-h` is
`calc(4.2rem + 4px)` on `:root` — the masthead is a **constant 104.797px at
every width** (measured at 390, 640, 900, 1024, 1194, 1440, 1920), because
`.masthead-top`'s `min-height: 4.2rem` always beats its content and
`.rule-double` under it is 4px.

⚠️ **The floor came down, 560px to 460px, and that is the fix rather than a
side effect.** A floor is a promise to overflow: at 560 any window under 665px
tall would have gone straight back to cutting the strip. 460 + 104.8 = 565, so
every window with 565px of viewport or more shows both rows of perforations.
Verified: the hero's bottom now lands **exactly** on the viewport at 1194×759,
1194×834, 1180×700, 1024×600 and 1440×900 (795 where the old expression gave
792 — the desktop the design was tuned on does not move).

### 6. The carousel's flanks — `15th.mp4`

0.34 → **0.45**. The number was never wrong on a dark ground; it is wrong on
this one. Opacity over the page's cream does not dim a picture, it fades it
TOWARD the cream, so a light frame at 0.34 is two thirds paper and the subject
is gone. Nothing about the iPad they filmed it on is special — it is the desktop
value.

0.45 is not a fresh guess: `.film-scroll.has-pop .film-frame:not(.pop) img`
already takes exactly that. Rendered side by side at 1194 against 0.55 and 0.65,
it is the lowest of the three that leaves a flank readable as a picture.

### 7. bts-29 replaced — four objects, and the audio dropped

`resources/replace_bts29.py`. **It IS bts-29** — checked frame against poster
before anything was written: same two people, same ladder, same yellow shade
cloth, same chain-link fence. 654×1162 (0.5628), 4.80s, clean bottom 20% across
the whole clip.

| object | before | after |
|---|---|---|
| `video/bts-29.mp4` (R2) | 1,139,035 | **4,273,402** |
| `poster/bts-29.webp` (R2) | 61,240 | 63,326 |
| `thumb/bts-29.webp` (R2) | 47,522 | 48,152 |
| `assets/media/bts-29.webp` | 58,562 | 53,594 |
| `about.html` holder ratio | `--r:0.625` | `--r:0.563` |

REMUX, not re-encode — `import_bts.py`'s rule, and the crop was the only reason
`crop_bts29.py` ever touched the pixels. ⚠️ That makes the master **4.27 MB on
a page that autoplays it**; see the open list. The 128 kbps AAC track came off
in the same pass. `crop_bts29.py` now carries a SUPERSEDED header and stays on
disk for the measurement of where a burnt-in handle's ink actually sits and the
four-object rule a partial swap breaks — both of which outlive the clip.

### 8. `mark-tech.png` moved out of the bundle

703 KB, referenced by nothing, sitting under `prototype/` so it deployed. It is
now `resources/mark-tech-source.png` with the rest of the source art, and
`/assets/marks/mark-tech.png` returns **404** on the live site while the `.webp`
the ring actually draws returns 200.

### 9. 🔴 A patch script truncated `style.css` to 0 bytes

`open(path, 'w')` truncates **before** anything is written, and the write raised
`UnicodeEncodeError` — an emoji written as a pair of numeric escapes had made
two lone surrogates. The traceback named the encoding fault, not the 162 KB that
had just been destroyed.

It was committed, so `git checkout` recovered it — **and the recovery came back
wrong**. `core.autocrlf` was `true` in a tree that is otherwise entirely LF, so
the file returned 4 KB larger with CRLF on all 3,974 lines, and `git status`
reports that as clean by design. Both the loss and the silent rewrite were
caught by comparing `git hash-object <path>` against
`git rev-parse HEAD:<path>`.

✅ `core.autocrlf` is now `false` for this repository, and every edit after that
point wrote to `path + '.tmp'` and `os.replace`d it.

**Two rules out of one incident.** Never open the only copy of something for
writing — build the replacement completely, then swap it in atomically, so every
failure mode leaves the original intact. And verify a recovery against the
artefact, not against the tool that performed it: a tool that normalises on the
way out normalises on the way in, and its status output is built to hide exactly
that difference.

### What was checked and found clean

- Console and page errors on all three pages at 1440×900, 1194×759 and
  390×844 — nothing but the expected R2 media requests.
- No horizontal overflow on any page at any of those sizes.
- The phone layout of the clippings is untouched: 342px wide, 20px mat on all
  four sides, exactly as before.
- `--ground` inversion verified at the film strip, both banners, both footers
  and every cream section, on all three pages, at desktop and phone.
- The live site re-checked after deploy: flank 0.45, bleed 2.2px, hero fits the
  fold, mats 20–22px, card slack 42–44px, `--r:0.563`.

---

## Session 2026-08-26 — the audit round: 3.4 MB of fonts, a runaway ring, and a page that shared as a bare URL

No brief and no screenshots this time. The instruction was "resolve the issues
ur aware of and check the website for any" — so this round is the open list
from the top of this file plus a full sweep of the three pages under
Playwright, at 1440×900 and 390×844, in both languages, with and without
reduced motion.

**Nothing was deployed.** Everything below is built and verified against
`python -m http.server 8321 -d prototype`; `npx.cmd wrangler deploy` has not
been run. The one thing that DID reach production is thirteen new objects on
R2 under `preview/` — additive, referenced by nothing that was live at the
time, and now referenced by the working tree.

### The measured before and after

| | before | after |
|---|---|---|
| index.html, phone, first load | 8.20 MB | **4.11 MB** |
| library.html, phone | 4.92 MB | **1.60 MB** |
| about.html, phone | 4.86 MB | **1.54 MB** |
| webfonts, every page | 3,918 KB | **503 KB** |
| the thirteen autoplaying reels | 442.6 MB | **19.6 MB** |
| flagged tab stops on the home page | 43 of 88 | **0 of 87** |

### 1. The fonts were raw OTF — 3.9 MB on every page, and 87% of it was air

`@font-face` pointed at four `.otf` files and nothing else. Three of them load
on every page (Flat Medium, Flat Bold, Sharp ExtraBold) and they are 1.3 MB
each: **3,918 KB of webfont before a single picture**, served as
`application/octet-stream`, on a site that is mostly opened on a phone in the
street.

`fontTools` repacks an OTF into WOFF2 losslessly — the same tables, brotli'd —
and it took **87% off each one**. 3,918 KB → 503 KB. The `src:` lists woff2
first and keeps the otf behind it as a fallback that no browser since 2016
will reach.

⚠️ **Proven glyph-identical, not assumed.** The `tnum` lesson at the top of
_Things that will bite you_ is exactly this shape — a metric that matched
while the rendering was broken — so this was checked twice over:

- Canvas `measureText` across four faces and four strings (Arabic, Latin,
  Arabic-Indic digits, the لا / لله ligatures), plus the rects of
  `.hero-title`, `.why-title`, `.banner h2` and `body`: **identical to the
  hundredth of a pixel**.
- A page loading both formats as separate families, screenshotted at DPR 2 and
  diffed: **zero pixels differ** on all three pairs once the crops are aligned
  on their first inked row. Shaping, the ligatures, the Arabic-Indic digits
  and the Latin kerning all survive.

⚠️ The `.otf` files are still in the repo and still deploy. They are the
fallback; they are never fetched.

### 2. 🔴 The phone's film-grain override had never once applied

`@media (max-width: 900px)` set `.film-frame::before` to the 23 KB
`film-grain-m.webp` — and it sat at line 668, while the base rule that names
the 657 KB `film-grain.webp` is at line 726. **A media query contributes no
specificity.** Same selector, same specificity, and the later declaration wins
at every width, so every phone since 2026-08-11 downloaded and decoded the
full-resolution grain.

This is the one the note above it calls "the phone's biggest cost", and the
cost was never actually removed — only the `.film-scroll` half of it, which is
declared *before* the query and therefore worked.

The override now sits after the rule it overrides. While in there, the wash's
mask joined it: `.film-scroll::after` was cutting itself out of the full
`film.webp` at every width, so a phone fetched a 154 KB tile to mask a
background painted from the 45 KB one. Mask-size is `--pitch` either way, so
only the source resolution changes.

Phone film assets: **873 KB → 68 KB**, and the decode goes with it.

### 3. 🔴 A cursor resting on the ring made it spin seven times too fast

The open list has asked three rounds running whether the ring's hover "is
delightful or twitchy". It is neither: **it runs away.**

`pointerenter` was read as "the visitor moved onto this piece" and called
`pick()`. But picking a piece MOVES IT AWAY from the cursor, which slides the
next piece underneath, which enters, which picks, which moves. Measured with
the pointer parked on one item and never moved again:

```
  t+0.6s  spin  344.6°  picked 6  picks so far  7
  t+1.8s  spin  950.4°  picked 0  picks so far 22
  t+3.0s  spin 1566.7°  picked 3  picks so far 37
  t+4.8s  spin 2494.5°  picked 7  picks so far 60
```

**60 picks in 4.8 seconds**, `--spin` climbing ~520°/s against the ring's own
13.8°/s, for as long as a cursor rested anywhere over it. It compounds because
`pickAngle()` takes the short way round from the CURRENT spin and `spin` is
only folded back into 0–360 when a glide COMPLETES; a chain of interrupted
glides adds up to 180° a time forever.

Two changes, both in `serviceRings`:

- **The pick is gated on the pointer's own position.** An enter whose
  coordinates are within 6px of the last pick was caused by the ring arriving
  at the cursor, not the cursor arriving at the ring, and is ignored. The first
  enter of a visit compares against `NaN` — false — so a real hover is never
  swallowed.
- **The release moved from the item to the window.** An item-level
  `pointerleave` cannot work once picking is what moves the piece: bringing it
  to the front carries it out from under the cursor, so the pick released
  itself the moment it succeeded. `#ringWindow` gets both `pointerenter` (hold
  the ring still) and `pointerleave` (drop the pick, let it go again).

After: **one pick, and everything holds still.** Same parked pointer, eight
samples over 4.8s, `spin` fixed at 160.0°, `picked` fixed on the item the
visitor actually pointed at. Moving across the ring still re-picks piece by
piece; leaving it resumes the turn; a click still opens the overlay.

⚠️ **This is why it was never caught.** Every earlier check either drove the
item programmatically — `.click()` bypasses hit-testing entirely — or ran in
the Browser pane, which never composites a frame. It only appears under a real
pointer on a compositing engine.

### 4. The reels the page plays by itself were the masters — 442.6 MB of them

Open item 3, closed. `data-preview` pointed at `video/`, and `video/` is where
the full-quality masters live: 16.8 to 79.2 MB each, one of them a 50 fps
23 Mbps camera file. The ring turns a new piece to the front every 5.25s.

`resources/make_previews.sh` derives a `preview/` twin of each: 540 on the long
side, 25 fps, no audio, CRF 30 capped at 700 kbps, `+faststart`. All thirteen
are on R2 now.

**442.6 MB → 19.6 MB, 95.6% smaller.** The largest is 5.24 MB and the smallest
is 0.27 MB.

🔴 **Same duration to the frame, and that is a hard requirement, not a nicety.**
The overlay opens the master at the preview's own `currentTime`; a derivative
even a second short hands it a timestamp past its end. Every one is verified
against its source after encoding — the script prints `DURATION DRIFT` if any
pair differs by more than 0.1s.

**The node now carries two URLs.** `data-preview` is the small one the page
plays; `data-video` is the master, and `itemOf()` reads it FIRST so the
lightbox still opens the real file. Verified end to end: the carousel plays
`preview/reels-alif-tuktuk.mp4` (1.25 MB) and a click opens
`video/reels-alif-tuktuk.mp4` (16.8 MB) **at 4.59s, the frame the preview had
reached**. The ring plays `preview/reels-child-section-final.mp4` — 0.64 MB
where it used to pull 72.3.

Quality was checked, not assumed: frames pulled at t=10s from master and
preview, side by side. Slightly softer in the fine detail, indistinguishable at
the ~200–350 CSS px these actually draw at.

### 5. The keyboard could not reach half the site, and the overlays leaked it

A tab-walk of 90 stops on the home page: **43 of 88 flagged.**

| what | was | now |
|---|---|---|
| `.ring-item` | 40 stops, none with a name | named from SUBCATS / PROJECTS — «إعلانات رقمية — ١ / ٩», «رتريت عودة الملكة» |
| the two off-screen ring stages | `aria-hidden="true"` and still tabbable — 22 stops on pieces a window away | `inert`, written only when it changes |
| the lightbox | `role="dialog"` sat on `.lb-body`, which does not contain the close, prev or next buttons — so a screen-reader user inside the modal could not reach the button that closes it | role + `aria-modal` + name on `.lb` itself |
| the lightbox, again | Tab escaped to the masthead behind the scrim on the third press | cycles within the overlay |
| the project sheet | six stops in, the seventh landed in the footer | cycles within `.sheet` |
| 66 of the archive's 82 tiles | click-only; the 13 film tiles were keyboard-openable and the photographs beside them were not | every tile `role="button" tabindex="0"`, named with its date |
| `.reelshow-track` | a focusable scroll container with no name | `role="group"` + a name |

⚠️ **The `aria-hidden` guard on the ring stages is load-bearing and nearly got
broken.** `previews.syncRing` asks for `aria-hidden === "false"` before it will
play the front item's reel. The first version of the write-only-when-changed
guard compared `.inert`, which starts `false` on a fresh element — so it would
have skipped the very first write for the stage that IS showing, left its
`aria-hidden` absent rather than `"false"`, and silently stopped every reel on
the ring from ever starting. The guard reads the attribute.

### 6. Sixteen aria-labels were hard-coded Arabic on a bilingual site

The menu button announced «القائمة» to a screen reader on the English page. So
did the main nav, the masthead logo, the contact band, the archive's view
toggle and the sheet's thumbnail strip. `applyI18n` grew a second pass —
`[data-i18n-label]` writes `aria-label` from the same table `[data-i18n]`
writes text from — and every one of them is wired to it. Verified by toggling
to English and re-reading every `aria-label` on all three pages: **0 left in
Arabic** (the «ع» inside the language pill is the one Arabic string that is
supposed to stay, and it is text, not a label).

### 7. A link to this site unfurled as a bare URL

All three pages had a `<title>` and nothing else — no description, no Open
Graph, no canonical, no `robots.txt`, no sitemap. For an agency whose work
travels by being posted to WhatsApp, Instagram and LinkedIn, that is the first
thing anyone sees of it.

Added to all three: description, canonical, theme-color, the full og:* set, and
`twitter:card=summary_large_image`. **The Arabic is the site's own copy** —
`I18N.heroPara` for the home page, `I18N.aboutP` for the about page. ⚠️ The
archive's one sentence is the only line written for these tags and not by the
agency; it needs the same sign-off the rest of the copy has had.

`assets/img/og-card.jpg` is 1200×630 — the real logo on the real linen with the
real tagline, rendered from the site's own stylesheet and screenshotted rather
than mocked up elsewhere. JPEG, not WebP: several unfurlers still will not read
WebP.

⚠️ **These tags are static and do not follow the language pill.** An unfurler
reads the HTML as served, and the served page is Arabic.

### 8. Two pages had no `<h1>`

`library.html`'s only headings were the four category names the accordion
renders; `about.html` opened at `<h2>`. The archive's «الأرشيف» is an `<h1>`
now (with `font: inherit` restated so the bar does not grow), and the about
page's «من نحن؟» banner is an `<h1>` (`.banner h2` became `.banner :is(h1, h2)`
in all three places it appears). index.html keeps `<h2>` on both of its banners
— it has an `h1` in the hero, and two banners.

Measured after: the about banner is the same box, 1354×336 at 208.8px, and the
archive bar is unchanged at 71px tall.

### 9. `I18N.svc1/svc2/svc3` were dead literals — removed

Nothing read them. They were the fourth spelling of the three service names,
kept in step by hand through three renames, rendered nowhere. This is the same
shape as the `heroMeta3` literal removed on 2026-08-11 and the same rule
applies: a copy that nothing renders cannot be seen to go stale.

**The "six live copies" list in this file was wrong, and is now three.** The
`data-i18n` fallback span and the `heroMeta3` fallback it named have not
existed in the markup for a while. What is left: `CATS`, `SERVICES[].tag`, and
`chat-worker/src/services.js`.

### 10. The hero lede's orphan is four times bigger than this file said

Open item 9 said "one narrow band where the hero lede still orphans", at
~1100px, "every other width from 1180 to 1920 sets three lines at 76-96%".
That is wrong, and the reason is instructive: **every measurement of it,
including the table in the CSS, sampled one viewport HEIGHT.**

Swept over a 7×5 grid of widths and heights, the lone-word last line appears at
**10 of 35 window sizes** — 1100 at every height, and also 1180×1080,
1280×1000, 1280×1080 and 1440×1080. Ordinary laptop windows. The wrap is a
two-dimensional cliff because `--cap-h` is `clamp(130px, 16vh, 184px)`: the
sheet grows with viewport HEIGHT while the copy is measured in em, so a taller
window enlarges the float, shortens more lines, and pushes the copy onto one
more.

⚠️ **The lever this file nominated does not work.** `.dropcap`'s
`margin-inline-end` at 0.9rem slides the cliff sideways by about 20px and, at
1080px of height, makes 1100 worse rather than better — 38% down to 12%. Three
`--cap-h` variants tying the sheet to `min(16vh, Nvw)` were swept as well: 10,
8 and 10 orphans out of 35 against the current 10. The sheet's size is not the
lever either.

**What went in: `text-wrap: pretty` on `.dropcap-block p`.** Not a cure — the
failing sizes still set four lines — but the last line goes from 12% of the
column to 20–21% at every one of them, and at 1920×1080, 1600×900, 1440×900,
1366×768, 1280×800 and 1024×768 it changes nothing at all: same line count,
same percentage, same gap to the sheet. Engines without it ignore it.

🔴 **The fix that actually closes it is one character, and it is the agency's
call.** `max-width: 21em` turns 1280×1024 and 1180×1080 into three lines at
55–65%. It costs: 1440×900's last line falls from 67% to 55%, and the gap from
the type to the bottom of the sheet opens to −37px and −46px at the two sizes
it fixes — which breaks the rule the agency drew on 2026-08-23b, that the type
reaches the bottom of the paper. It trades one of their rules for the other, so
it is written up in the stylesheet and not applied.

### What was checked and found clean

- No console errors, no page errors, no failed requests, no 4xx — on all three
  pages, both languages, both viewports.
- No horizontal overflow anywhere (`scrollWidth === clientWidth` at 390 and
  1440 on all three).
- No broken images, no empty links or buttons, no duplicate ids, no dead
  in-page anchors.
- Under `prefers-reduced-motion: reduce` every page reaches its full height
  with nothing stranded at opacity 0.
- Every external link already carries `rel="noopener noreferrer"`.
- The two phone numbers really are different numbers, and the markup already
  says so in a comment.
- `fabric.webp` (372 KB, the biggest asset left) was tested at four lower
  qualities: 22% smaller at best, with a mean error of 4.85/255 across a
  texture that sits behind everything on the site. **Left alone** — that is a
  visible change to the site's ground for 80 KB.

---


## Session 2026-08-24 — the agency's fourteen screenshot edits

**The brief is `resources/briefs/2026-08-24/TASKS.md`**, and this time the
screenshots themselves survive at `C:\Users\Obaida\Desktop\issues\`. What
follows is what was built and what it measured.

### 1. The ring's ten vertical lines were GAPS — the diagnosis was inverted

🔴 **Read the banner first.** The brief and the agency both attributed the ten
rules across every piece of work to the per-slat opacity compositing over the
`scaleX(1.012)` overlap. Measured on the built page at 1440, sampling a row of
pixels across the front item: spikes at **x = 849, 889, 929, 968 — 40px apart,
2px wide, luminance 200 against the picture's 115.** Cream is 213. They were the
page showing through, not a darker band.

**Why 1.2% was never enough.** A slat measured 40px at that width, so the scale
gave 0.48px of overlap — 0.24px on each side — and two strips meeting at an
angle in 3D are antialiased independently over about a whole pixel each.

**The fix is a LENGTH, not a ratio, and it does not stretch the picture:**

```
--bleed: 1.1px;
width: calc(var(--sw) + var(--bleed) * 2);
background-position: calc(var(--bleed) - var(--sw) * var(--k)) 0;
```

The strip grows a pixel on each side and the sprite is pushed back by the same
pixel, so the extra pixel shows the NEIGHBOUR'S OWN CONTENT out of the same
image — which is exactly what belongs there. A scale can never do that; it
stretches whatever it widens.

⚠️ **The percentage form of `background-position` had to go with it.**
`k/(n-1) * 100%` resolved to exactly `-sw * k` only while the element was `sw`
wide. Widen it and the same percentage is a different offset, and the ten
slices walk out of step by a pixel each.

⚠️ **The two END strips keep the widening and give the bleed back in the
PICTURE** (`background-position: 0` and `--bleed * 2`). A different width would
move their centre off their station — `inset: 0; margin: auto` is what puts
every strip on the axis — and without the correction the outermost strip shows
its bleed pixel as bare element inside the band's own rule: a transparent
hairline down the outside of every piece of work, i.e. the same fault moved one
strip over.

🔴 **The per-slat opacity is gone and the depth fade is PAINTED.** The two are
incompatible: with a wider overlap, two strips at `--o` 0.8 composite to 0.96
where they cross, which is the fault the brief described arriving for real. So
every strip is fully opaque and `.ring-slat::after` lays a flat cream veil at
`calc(1 - var(--o))` over the picture. Over the cream page that composites to
exactly the same colour the opacity did — and because the veil is a CHILD of
the strip, the nearer strip's picture and veil both paint over the further
one's, so an overlap looks identical to no overlap. That is the property the
opacity version could not have at any bleed.

⚠️ The veil takes `border-radius: inherit`, and `inset: 0` resolves against the
padding box, so the band's 1px rules stay full strength on the far side while
the work fades. Deliberate: the rule is the band's edge, not part of the work.

**Verified: the 40px-spaced luminance spikes are gone at every sampled row, and
the bend still measures as a cylinder.**

### 2. The ring: speed, reels, hover, and where a click goes

**`TURN` is `TURNS`, per service** — 26s / **42s** / 26s. The agency asked for
صناعة محتوى specifically. ⚠️ A full revolution is also what hands on to the
next service, so this is how long that ring holds the section, and it is the
dwell of a reel preview: 42s over eight items is 5.25s each.

🔴 **The front item's reel plays, as ONE FLAT PLANE standing on the band.** A
film cannot be sliced across ten background strips — `background-image` takes a
URL, not a video — so `video.preview` is appended to `.ring-item` itself and
pushed out to `translateZ(--apo + --lift + 2px)`. `--apo` is where the MIDDLE
slat already sits and every other slat is at `apo·cos((k−kc)·dth)`, i.e.
further back, so 2px clears the whole bulge. ⚠️ It is a SIBLING of the slats,
never a wrapper: anything between `.ring` and a slat that carries a transform or
an opacity forces `transform-style` back to flat and collapses the bend.

🔴 **Driven by a `ringfront` EVENT, not by the IntersectionObserver.** A ring
item lives in a `preserve-3d` subtree rotated on two axes, and two of the three
stages are translated a whole window off screen — the same reason the centre
marks are not lazy. An observer reports "not intersecting" forever there and
would stop the reel a frame after `syncRing()` started it. What IS a plain box
is `#ringWindow`, so that is what is observed; which item is at the front is a
thing only the ring knows, and it says so.
⚠️ **The event is also the only way to call across the module boundary.**
`previews` is defined several hundred lines below `serviceRings`, so a direct
reference from `front()` is in the temporal dead zone at build time — and
`typeof` does NOT protect against a TDZ `const`, it throws like any other read.

**Hover brings a piece to the front on a desktop**, by calling `pick()` —
literally the function the click used to call. ⚠️ Gated on `(hover: hover)`:
on touch `pointerenter` fires once on the first tap and `pointerleave` never
fires, so an ungated version would pick an item and, because `tick()` holds
still while something is picked, stop the ring for the rest of the visit.
⚠️ `pointerleave` RELEASES the pick for that same reason. Moving from one item
to another fires leave-then-enter, so the release never eats the next pick.

🔴 **A click opens the LIGHTBOX and the two-step is gone.** `.ring-item` is in
`OPENS` and `.ring` is in `GROUPS`, so the overlay walks that one service's own
pieces — measured «٥ / ٩» on the design ring, «٢ / ٣» on tech, «٣ / ٨» on photo,
and the page stays on `/index.html`.
⚠️ **The lightbox cannot find a ring item's picture by query.** Ten
`.ring-slat` spans carry the same URL as a BACKGROUND — that is what makes the
bend cost one decode — so `node.querySelector("img")` returns null there and
always will. The node states its own contents on `data-full`, which is the same
attribute the archive's thumbnails already use, and `itemOf()` falls through to
it. A reel additionally carries `data-preview`, and that one attribute does two
jobs: the previews module plays it in place, and the overlay opens it at the
frame the preview had reached.
⚠️ `picked` no longer decides where a click goes. All it does now is hold the
ring still and stand a piece proud of the band while a pointer rests on it.
⚠️ `tick()` also stops while `body.lb-open`, or the ring would carry the front
item — and the playing reel — on while the visitor is looking at it.

### 3. The footer, redesigned, and the clock deleted

🔴 **The clock is gone from markup, `tickClock()`, `.contact-clock`, the
`setInterval`, and the `cClock` I18N pair.** Read the banner for the `tnum`
fault it was hiding.

**The mark is the footer's mass now** — `HalfAliph-Icon-cream.svg`, cut cream
from the ink `HalfAliph-Icon.svg` this session because no cream variant existed.
⚠️ **Not `Aliph-Logo-Main-cream.svg`**, which is the wordmark ألِف + ALIPH at
561×375 — a horizontal signature, and not what either drawing shows. ⚠️ **Not
the stamp** either: `HalfAliph-Stamp` is the same glyph inside a ring of type,
and that was removed from this footer on 2026-08-11 at the agency's request.

It is a child of `.footer`, absolutely positioned, `inset-inline-end: 0`, and
bleeds past the bottom edge — `.footer`'s own `overflow: hidden` is the cut. It
could not do that from inside `.contact-side`: the two things it has to run
past, `.rule-cream` and the legal line, are that grid's siblings.

⚠️ **Three tokens on `.footer` — `--mark-w`, `--mark-drop`, `--mark-clear` —
and four consumers.** `.contact-side`, `.footer .rule-cream` and `.footer-legal`
all read `--mark-clear`; the phone block restates only the three tokens. The
mark is invisible to layout, so nothing would otherwise know to leave room, and
cream type over a cream letterform is an erasure rather than a near miss.

🔴 **The socials became a FULL-WIDTH BAND, not the second column, and that is
arithmetic.** `8th.png` sets the three on one line beside the mark. Measured,
that row is **440px** wide — and the second column was 648px at 1440, 576px at
1280 and **461px at 1024**, of which the mark's clearance took 302 / 281 / 215.
It fitted at 1920 and nowhere else. `grid-column: 1 / -1` gives it 1051px at
1440 and 748px at 1024. The column it left is where the mark now sits.
⚠️ The contact table's tracks went 7/5 → **1/1** to pay for it; its longest
value, `info@aliphcreative.com`, sets 415px.

**Phone**: socials one per line at the inline start, both legal lines at the
start, mark at the end. ⚠️ **The legal lines had to set smaller and tighter** —
measured at 390, «ألِف © ٢٠٢٦ — جميع الحقوق محفوظة» sets 251px and
ALIPH CREATIVE sets 285px at 0.18em of tracking, against 205px of room. 0.58rem
and 0.07em bring them to 145 and 144, one line each, which is what `10th.png`
draws.

### 4. The hero lede — a measure, a setting, and a widow guard

🔴 **`max-width: 20em` on `.dropcap-block p`.** The copy is a fixed length, so a
narrower measure moves words DOWN into the short line until it fills. The last
line as a fraction of the column, Arabic:

| | uncapped | 20em |
|---|---|---|
| 1920 | 7% | **80%** |
| 1600 | 12% | **80%** |
| 1440 | 22% | **96%** |
| 1280 | 44% | **80%** |

Three lines at every one of them, so the rule of 2026-08-23b — the type reaches
the bottom of the paper — survives: the gap at 1920 is unchanged at **−14px**.
⚠️ **AND IT IS A CLIFF.** 19em tips 1440 and 1280 to four lines with an 11%
last line, which is the fault coming back one step narrower. 20 is a whole em
clear of it; do not trim it to taste.

**Justified, at every width.** The float shortens the first lines and the rest
run full, so the start edge steps in and out — the "a lil messy" of `11th.jpg`.
Flushing both edges turns a wobble into one clean step at the line the float
releases, and a justified column beside a dropped initial is what this site's
whole voice is. ⚠️ Three treatments were rendered and compared before choosing:
ragged, justified, and justified with a two-line sheet. The third crowds.

⚠️ **U+00A0 binds the last two words in both languages**, in the I18N table and
in the document fallback. It is what covers the widths where the measure never
binds — at 1100 the panel gives the lede 437px and no cap can reach it; the last
line went from 11% of the column to 19%. It is a REAL no-break space, not an
`&nbsp;` entity: the table is assigned with `textContent`, which would print the
entity literally.

### 5. The about page — the mat hugs the picture, and a new shape

🔴 **`.ab-media` shrink-wraps its holder.** `13th.png` against `14th.png`: the
holder capped its own width through the height and then centred inside an
`.ab-media` that still spanned the whole grid track, so a 200px clip sat in a
560px mat with its caption at the far corner. `width: fit-content` fixes it —
**but only after the holder's width stopped being a percentage.** A percentage
inside a shrink-to-fit parent is the circular case this file keeps warning
about, and Chrome breaks the circle with the intrinsic ratio (the same trap that
made the gallery wall's أ 654px tall in a 447px tile). The holder states a
definite `--abh * ratio`, so its max-content contribution is a real number.
**Measured after: 20–22px of mat on every side of every figure, desktop and
phone, and every ratio within 0.005 of the one it states** — the residual is
`getBoundingClientRect` reporting the axis-aligned box of a rotated element,
not a re-crop.

**Two rows, four verticals, two texts.** `abP2`, `abP3` and the pull quote
`abPull` are gone from the markup AND the I18N table, and `.ab-card-quote` with
them. ⚠️ **The side is `.is-flip`, not `:nth-child(even)`** — the section's
first child is the montage now, so counting children flips the wrong row.
⚠️ **The rotation is a `--pin` VARIABLE and the transform is stated once.** It
used to be a transform per row, which the hover rule then had to out-specify —
at four selectors deep it would have silently stopped being able to.

⚠️ **`previews.bandOf` keys an about clipping on its own index in the section,
not on its row.** One band plays exactly one member, and two verticals sharing a
row would have shared a band — one of every pair would have sat still. Verified:
five distinct bands `ab-0 … ab-4`, three playing at once.

**The pair stays two-up on a phone** and that is where the page gets shorter:
`flex: 1 1 0` with `min-width: 0` overrides the desktop's `fit-content`, so each
figure takes half the column — a 9:16 comes out 139×247 where a full-width one
would be 316×562. **Phone 8,713 → 5,724px. Desktop 4,696 → 4,105px** — ⚠️ the desktop "before"
was first written as 5,493, which was a stale figure from the previous round
rather than a measurement of the build this replaced. Re-measured from a
worktree of the pre-round commit.

**The 16:9 montage is the flagged judgement call** — full width at the head of
the section, no card. See the banner.

### 6. The hero's two CTAs are pinned paper notes

`resources/cut_notes.py`, sources committed under `resources/notes/`.

🔴 **White paper on a white ground, and the two frames do not behave the same
way.** `contact us.jpg` cuts cleanly off the file with `birefnet-general-lite`
— it is tilted and curled, so its own cast shadow separates it all the way
round. `start here.jpg` does not: it lies flat and square, and along its TOP
edge the paper and the ground are within about three levels of each other with
nothing between them. `u2net` and `isnet-general-use` return a **0.6% mask**
(nothing at all) and birefnet returns 43% — the sheet with its whole top edge
bitten away, which is worse than no cut because it looks like a torn photograph
rather than like a failure. ⚠️ **Upscaling does not help**; 612, 1024 and 1400
all produced the same bite. The information is not missing, the CONTRAST is.

**So the frame is STRETCHED before it is segmented and the mask is applied to
the ORIGINAL pixels**: [238, 255] onto [0, 255] turns a three-level difference
into a forty-level one. ⚠️ The stretch is thrown away — it exists to be looked
at by the model. ⚠️ The floor is a narrow window: at 225 the top edge is still
partly eaten, at 244 the model starts taking the cast shadow as subject.

⚠️ **A fresh rembg session per frame.** onnxruntime raises
`[ONNXRuntimeError] : 1 : FAIL : bad allocation` on the SECOND predict of a
reused birefnet session on this box — the first cut writes its file and the run
then dies, which reads exactly like a problem with the second source.

⚠️ **NO LINE BORDER ON EITHER**, per the agency's explicit instruction. The
drop shadow is drawn in CSS, where it can follow the hover — and it is a
`drop-shadow` FILTER, not a `box-shadow`: the note is an irregular cut-out with
a curled corner, and a box-shadow would draw a hard grey rectangle behind it.

🔴 **The transform-origin is the PIN, and that is the whole of the motion.**
Measured off the cuts: 49% × 9% on `note-start`, 43% × 15% on `note-contact`.
Anything that turns about that point reads as paper swinging on a pin; the same
rotation about the centre reads as a card being tilted. Hover swings it straight
and lifts it 6px; `:active` drops it back onto the pin in 90ms.
⚠️ The two notes are NOT the same shape (700×523 and 680×633) and are not meant
to be — one box for both would either letterbox them, giving a note floating in
a larger invisible click target, or stretch them.
⚠️ `--swing` and `--lift` are variables because `:active` would otherwise have
to restate the whole `transform`, rotation included, and the two would drift.

### 7. T8 — no code change, and say so

**`bts-29` is clean on all three live objects** and was re-verified with a
cache-buster before this round began. The agency is looking at a stale copy on
their device. Tell them to hard-refresh.

### The deploy — a real version id, and both hosts byte-compared

`npx.cmd wrangler deploy` from the repo root, **version id
`5db9d87b-6a2a-43b6-94a5-216e842aadd0`** — ⚠️ the FIRST of this round's two
deploys; the review below shipped `6cba40be` on top of it. Ten files uploaded (179 already
uploaded by hash), then every one of them fetched from BOTH hosts with a
`?v=<timestamp>` cache-buster and compared by sha256:

| | workers.dev | aliphcreative.com |
|---|---|---|
| `style.css`, `main.js` | 161,357 / 177,977 | **identical hash** |
| the four new assets | — | **identical hash** |
| `index/about/library.html` | 26,323 / 17,086 / 12,572 | **+359 bytes each** |

⚠️ **The +359 on the three documents is expected and is not a stale asset** —
the custom domain injects Cloudflare Web Analytics' beacon. It is the same 359
on all three, which is what makes it a beacon rather than a diff.

Eighteen content assertions were then run against the LIVE files rather than
against the local ones, in Python and tested with `in` (never grepped through
this box's cp1252 shell): the notes in the hero, the clock gone from markup and
script, the half-aliph mark, the U+00A0 widow guard in the live Arabic, the
slat bleed and veil, the 20em measure, `.ab-pair`, `.note-btn`, `photo: 42000`,
`.ring-item` in `OPENS`, `syncRing`, two `.ab-row`s and one `.ab-wide` on the
about page, and `abPull` absent. All pass.

### Verified, not assumed

Three pages × two languages × desktop (1440) and phone (390), with every lazy
image forced eager and the whole page scrolled first so nothing below the fold
could hide a 404:

| | images | broken | page errors | failed requests | h-overflow |
|---|---|---|---|---|---|
| index AR / EN 1440 | 70 / 69 | **0** | **0** | **0** | **0** |
| index AR / EN 390 | 70 / 69 | **0** | **0** | **0** | **0** |
| about AR / EN 1440 | 12 | **0** | **0** | **0** | **0** |
| about AR / EN 390 | 12 | **0** | **0** | **0** | **0** |
| library AR / EN 1440 | 88 | **0** | **0** | **0** | **0** |
| library AR / EN 390 | 88 | **0** | **0** | **0** | **0** |

Plus, with all four archive panels opened the way a visitor opens them:
**170 images, 164 tiles, 0 broken, 0 overflow, 0 errors** at both viewports and
in both languages.

And, under Playwright — which composites, unlike the pane these sessions get:
the hover glide, the front item's reel at `readyState 4`, the overlay's counter
on all three rings, the ring resuming after the overlay closes, exactly one
video playing in the reel carousel, and three of the five about clippings
looping at once.

### The review pass — and the four things it found

The round was reviewed by a session that had not built it, working from the
agency's screenshots and the live site rather than from the write-up above. It
rebuilt the PRE-ROUND commit in a worktree so the two builds could be measured
side by side, which is what settled the seam argument. Its verdict on all
fourteen edits was that they hold. Four things did not, and all four are fixed
in `7249ec1` / version `6cba40be`.

🔴 **`--rest` was referenced and never defined, so reduced motion did the one
thing its own comment forbids.** `.note-btn:hover { --swing: var(--rest, 0deg) }`
fell through to the fallback, and the pinned notes STRAIGHTENED on hover —
while the comment two lines above read "Setting --swing to 0 here would
straighten them, which is a different design rather than a calmer one." Now
`--rest` is the number, `--swing: var(--rest)` derives from it, and **the
fallback is deliberately gone**: a fallback is precisely what let a missing
property ship silently, and without one a missing `--rest` makes the
declaration invalid at computed-value time, which leaves the note at its
resting angle — the behaviour the rule exists to guarantee anyway.

🔴 **The stylesheet contradicted itself inside one rule.** `.ring-slat` carried
a correct note saying the lines on the agency's maroon tile were LIGHTER than
the maroon and had been gaps all along — and, forty lines below it, the
pre-investigation text still claiming they were the overlap compositing darker
and calling itself "the whole of the seam fix". Both blocks were shipped. The
second is rewritten: the opacity did have to go, but PROSPECTIVELY — at a real
1.1px overlap translucent strips would have traded the bright seam for a dark
one — not because it caused what was on the screen.

⚠️ **A number that did not reproduce.** The desktop about page went
**4,696 → 4,105px**, not 5,493 → 4,105. 5,493 was the previous round's figure
carried forward rather than a measurement of the build this round replaced. The
phone figures reproduce exactly. Corrected in place above.

⚠️ **The developer's mark's caveat was written where nobody reads it** — in
`resources/cut_people_marks.py` and in commit `522985a`'s message, neither of
which is opened at the start of a round. It is in the banner now.

⚠️ **Also recorded from the review**: Cloudflare answers a default scripting
User-Agent with 403 on the SITE hosts, not only the media bucket (see _Running
and deploying_); and a phone still cannot stop the ring, which is now an open
decision rather than an oversight (see _The next round_).

---

## Session 2026-08-23 (evening) — the agency's ten screenshot edits

**The brief is `resources/briefs/2026-08-23b/TASKS.md`.** It describes every
screenshot in words, including which file each red line was drawn on, so this
round can be re-read without the images. What follows is what was built.

### 1. The ring is a real ring now — bent, and inverting at the back

**Each item is cut into ten vertical SLATS**, each one flat, each placed a
little further round the cylinder than the last. The picture is a background
stepped across by the ordinary sprite formula, so ten slats cost ONE decode.
Measured on item 0: the ten slat centres run from x = −72.4 to +72.4 with z
rising from 256.7 at the ends to 266.6 in the middle — a 10.0px bulge, which is
exactly `r − √(r² − 72.4²)` for r = 266.6. It is a cylinder, not an approximation
of one.

⚠️ **The APOTHEM, not the radius.** A slat is a flat chord across the arc it
covers; putting its centre on the circle pushes both ends outside it, and ten
of those make a cog. `rad·cos(dθ/2)` puts the slat's ENDS on the circle.

⚠️ **`scaleX(1.012)` on every slat is a seam fix, not styling.** Two
neighbouring strips meet along a shared edge at an angle and each is
antialiased independently, which leaves a hairline of page showing between
every pair — ten vertical rules across every picture. The overlap stretches the
slice by a third of a pixel.

**The far half turns away and shows its mirrored back.** Measured at spin 0:
items 3–7 of 9 have a composed m33 < 0. This is the reversal of the morning's
billboarding, at the agency's instruction — see the banner.

🔴 **The clipping is fixed, and it needed a two-axis fit through the
perspective.** The old `layout()` only checked width, which was enough for a
billboarded ring where an item's vertical extent was its own height. A real
ring is different twice over: `rotateX(tilt)` maps depth to `y = −z·sin(tilt)`,
so the band rises and falls by `rad·sin(tilt)` — ±112px at 22° and a 300px
radius; and the near half sits at `+rad·cos(tilt)` toward the camera and is
drawn `P/(P−z)` larger, about 1.25×. The item that clipped was always the front
one, which is exactly the one being magnified. The fit now solves for the
largest scale whose worst-case magnified half-extents fit, by bisection.
**Verified by sweeping `--spin` through a full turn in 5° steps and measuring
every slat against its stage: 0px over the top, 0px over the bottom, 0 either
side, on all three rings, at 1920 and at 390.**

⚠️ **The width gets a 1.14 bleed and the height gets none**, and that
asymmetry is deliberate. Nine items at 1.12 spacing need a diameter of 3.2
widths before perspective, so on a 390px phone they cannot be both large and
entirely inside. A poster running under the left or right edge says the orbit
carries on; a poster sliced along the BOTTOM is the fault that was reported.

⚠️ **The front item is LIFTED, not scaled.** A scale on a wrapper between
`.ring` and a slat forces `transform-style` back to flat and collapses the
bend — and so does an opacity below 1. So the front item's slats push out along
the normal they already sit on, like a stone set proud of the band, and
perspective makes it larger for free. Opacity is set on the ITEM and read by
each slat.

⚠️ **The radius floor is the MARK, not a constant.** It was a flat 150px,
which never bound on the nine-item ring and always bound on the three-item one
— forcing an orbit twice as wide as the chord rule wanted, which the window fit
then shrank back down, taking the items with it. Measured: the tech ring's logo
tiles came out 77px across while the mark they circled was 100px. The floor is
now `markW/2 + widest·0.55`, and the item area grew from a flat 0.34 of the
window to `0.30 + 0.36/n` — the same 0.34 at nine, 0.42 at three.

**Every item is clickable at every angle.** Hit-tested at six spins × nine
items: no dead zones. `.ring-item` gives its clicks up to its slats for the
same reason `.ring` gives its up — it is a flat plane across the middle of the
stage whose children have all been translated off it.

### 2. The desktop columns, the button, and the invitation

**35 / 65**, from the line the agency drew: measured 31.8% list, 59.1% ring.
The way out is pushed to the inline END of its column — the edge that touches
the ring — and a one-line invitation sits above it. Verified in English/LTR
too: list at x=43, ring at x=540, button at 194→497 (the right end of the list
column, nearest the ring).

### 3. The centre marks are photographs, all three

`resources/cut_people_marks.py`. ⚠️ **It is NOT `cut_mark.py`**, and the
difference matters: that one finds a flat ground by reachability, because the
cameraman arrived already cut out onto black. These two are whole scenes — a
room, a desk, a lamp, a whiteboard — and there is no ground to find. They are
segmented instead (rembg / isnet-general-use), with two corrections a segmenter
cannot make:

🔴 **The designer's MONITOR is put back by hand.** The segmenter is right that
it is not part of the man and wrong about what the mark is for: a man
photographed from behind in a desk chair is any office worker alive. The screen
full of colour-blocked layout is the only thing in the frame that says GRAPHIC
DESIGNER, exactly as the rig is what makes the cameraman legible at 90px.

⚠️ **`.ring-mark img` is `position: absolute; inset: 0`, and it took three
attempts.** `max-width/max-height: 100%` bound only on the width; `width/height:
100%` computed the height as 318.172px in a 240px box. The parent is
`display: grid; place-items: center`, so its single row is sized FROM its item —
and an item asking for a percentage of a row whose height depends on that item
is circular. Chrome breaks the circle with the intrinsic ratio, which is why
the two marks shorter than the box looked fine and the one taller did not.

⚠️ **The marks are NOT lazy.** A lazy image inside a `preserve-3d` subtree
rotated on two axes, two thirds of which are translated a whole window off
screen by `.ring-reel`, is a fragile thing to ask an intersection test about.

### 4. The ring's media

**Nine design pieces still, three of them new.** The «حقك تعرف حقك» ads
REPLACED veal-2, mix-2 and habash-2 rather than joining them — nine is what the
radius, the area and the spacing were derived for. ⚠️ They paint from
`assets/`, not the bucket: `resources/ring_media.py` is what puts a piece there.

**The tech ring shows the clients' marks**, not screenshots — the same 640×640
logo-on-brand-colour tiles `derive_shots.py` already cuts. A 1.6:1 crop of a
page at ring size is a grey rectangle. ⚠️ All three carry `sub: "landing"` and
`line()` now reads the SUBSECTION BEFORE the project, which is the whole of
"unify their descriptions since they're all landing pages". Reverse those two
branches and the three sites get three different lines again.

### 5. The about page

🔴 **The even rows were laying out as two rows.** See the banner — this was the
real cause of the reported gaps, and it was never a gap.

**The long read takes the collage's treatment**: cream-warm mat, hairline, cast
shadow, a caption under each picture, and a rotation stated PER ROW (five
different angles, not one alternated — a single value flipped by `nth-child`
reads as a zigzag). Even rows carry a small negative top margin so the board
overlaps rather than lists.

⚠️ **The height cap came down from 56vh to 38vh.** The cap decides how tall a
row is, and at 56vh a 9:16 clip stood 605px beside a card holding one short
sentence.

**The clips autoplay.** ⚠️ Each holder is its OWN preview band — a band plays
exactly one member, so one band for the section would have played one clip at a
time. And every about band HOLDS rather than cycling: a band of one that
re-advanced would stop and restart its only member every 5.2s. ⚠️ The video is
appended to the picture's PARENT now, not to the node: `video.preview` is
`position: absolute; inset: 0`, and on this page the figure also carries a mat
and a caption, which a video pinned to the figure would cover.

**`bts-29` is cropped above its watermark** — `resources/crop_bts29.py`. The
handle's ink runs from 90.5% to 94.3% of the frame, so the crop is at 90%, not
at the ~95% the line was drawn at. ⚠️ **Four objects, not one**: the local
poster, and `video/`, `poster/` and `thumb/` on R2. The clip is re-encoded
rather than remuxed — a crop rewrites the picture.

### 6. The footer

🔴 **The band was ink on ink.** `.footer` is `background: var(--ink)` and
`.contact-band` set `color: var(--ink)` with no ground of its own, so
«لنبدأ من الألِف» has been invisible on every page for as long as the footer has
been ink. The only thing that showed was the asterisk between the words —
because iOS was drawing U+2733 as a colour emoji. **Two faults, one strip, and
the second one is what made the first visible.**

🔴 **The clock has TABULAR FIGURES, and without them the agency's rule cannot
be kept at all.** Idris Sharp's Arabic-Indic digits are proportional: measured
at 163px, «١١:١١» sets 211px and «٨٨:٨٨» sets 322px. A clock sized to match the
wordmark would have matched it for part of the day and jumped on the minute.
The face ships a real `tnum`; with it every time sets the same width.

⚠️ **It is sized from its COLUMN, in `cqw`, not from the viewport.** The
wordmark is capped at `min(272px, 60%)` of the column, so the clock is that
divided by the tabular ratio. A `vw` term matched it at 1920 and missed it by
82px at 1024, where the 60% branch binds and the viewport one does not.
Measured after: **271.9 vs 272.0 at 1920, 226.6 vs 226.7 at 1024, 176.1 vs
176.0 at 390.**

**Phone: stacked and centred**, reversing the two-up row — which was chosen to
avoid "three shallow bands of mostly-empty ink" and produced a clock hugging
one edge and a wordmark hugging the other. The type is large enough now that
the band is not shallow.

### 7. The hero

**Phone**: the paper أ is `clamp(104px, 27vw, 132px)` there, down from
`clamp(138px, 17.5vh, 205px)`. The float steals the width of the first lines,
so the run has to make it up at the end; a shorter sheet clears the text one
line earlier. **5 lines with a 3-word widow → 4 lines, 7 words on the last**, at
375 and at 390.

**Desktop**: the lede is sized against the paper, not against the body scale.
⚠️ **Do not chase the last pixel by growing the type — the wrap is a
knife-edge: 33.0px sets three lines and 33.024px sets four.** The sheet was
moved instead. Measured at 1920×1080: three lines, **0.2px** between the text's
bottom and the paper's. 1440×900: three lines, 14.5px short. 1280×720: four
lines, 38.7px past — which is ordinary drop-cap behaviour and the opposite of
the fault.

### 8. The work page

`OPENS` excludes `.lib-grid .tile[data-project]`. The comment at that site said
project tiles "carry the placeholder data URI, so it falls through" — which
stopped being true on 2026-08-23 morning, when `derive_shots.py` gave every
project a real `-card.webp`. `itemOf()` resolved it, and a click opened the
profile sheet AND floated the lightbox over it with two close buttons stacked.
**Verified: clicking a tech tile leaves `.lb` absent from the DOM entirely and
sets `body.sheet-open`.**

### Verified, not assumed

Three pages × two languages × desktop and phone, with every lazy image forced
eager first so nothing below the fold could hide a 404:

| | images | broken | page errors | h-overflow |
|---|---|---|---|---|
| index AR 1440 | 70 | **0** | **0** | **0** |
| index EN 1440 | — | **0** | **0** | **0** |
| index AR 390 | — | **0** | **0** | **0** |
| about EN 1440 | — | **0** | **0** | **0** |
| about AR 390 | — | **0** | **0** | **0** |
| library AR 1440 | 96 | **0** | **0** | **0** |

Plus: every `.ab-holder` and `.clip-img` renders its stated ratio to within
0.002 on a phone (nothing re-cropped); rotations off at one column; the ring
clips nowhere at any of 72 spin angles on any of three rings at two widths.

---

## Session 2026-08-23 — the agency's six edits

### 1. ماذا نفعل — the ring is Saturn now, and the desktop is two columns

**Phone keeps the layout the agency asked to keep**: the service named between
two arrows, the ring under it, the line under that, and «كل الأعمال» — now
**centred**, which also settles open question 19.

**Desktop is the sketch**: the three services stacked as a list with the current
one underlined by the site's 3px ink rule, the ring beside it, the item's line
under the ring, and the way out under the list. `.svc-head` and `.svc-list` are
two controls for one state; CSS shows one at a time and both call the same
`go()`, so there is one implementation.

⚠️ **The 901px media query has to come AFTER the base rules**, or
`.svc-head { display: flex }` wins on source order and the phone control shows
on a desktop as well as the list. It did, first try.

🔴 **The tilt is undone per item, and that is the whole correction.** `.ring`
leans the plane; each item ends its transform with the inverse of both parent
rotations, so the composite orientation is identity and the orbit stays
elliptical. **Undoing the spin as well is not decoration** — without it the far
half is turned 180° away, which leaves it either invisible
(`backface-visibility: hidden`, which this rule used to carry) or **mirrored**,
and half this ring is design work with Arabic type baked into it.

🔴 **`.ring` needed `pointer-events: none`, and nothing about that is obvious.**
It is a plane at z = 0 that hit-tests across the whole stage, so every item
*behind* it loses its clicks to it. Measured: **items 4 and 5 of 9 resolved to
`.ring` and could not be clicked at all.** It never showed while the far side
was faded almost to nothing; keeping it visible made it a dead zone.

⚠️ **The mark moved INSIDE `.ring`** and undoes the spin and tilt the same way
an item does. That is what depth-sorts it — near items pass in front, far items
behind. As a sibling it painted in flat DOM order and both halves crossed over
it.

⚠️ **`--spin` changes every frame, so `.ring-item`'s transform must NOT be
transitioned.** A transition there restarts a 0.45s interpolation sixty times a
second and the ring smears. The grow and the fade moved to a new inner
`.ring-face`, which changes only when the front item does.

⚠️ **The radius is derived now, not tuned.** Two neighbours are 360/n apart, so
the chord between them is `2r·sin(π/n)`; asking that to be 1.18 widths gives the
radius, and it stays right for a ring of three as well as one of nine. The old
`n/(2π)·1.55` was calibrated for items seen edge-on at the sides, which
billboarding removed.

⚠️ **`layout()` fits the ring to the WINDOW as well as to its items.** On a
desktop the ring now lives in half the section, and an item at a quarter turn
sits a full radius off the axis with nothing foreshortening it — sized only
from its height it silently ran out under `overflow: hidden`. A 1.05 bleed is
deliberate: a ring that stops dead inside its frame reads as a diagram.

**The two-step click** — first click glides the item to the front and grows it
to 1.3; a second click on the item already there opens it on the work page.
Verified on mouse and on touch, and the ring holds still while something is
picked so the second click has a target. ⚠️ **Under `prefers-reduced-motion` it
JUMPS rather than glides** — `start()` returns without arming the rAF there, so
a glide would never arrive and the two-step would deadlock. Verified.

**Hover pauses only on an item**, and only where there is a real pointer:
`pointerenter` fires once on touch and `pointerleave` never does, which would
stop the ring for the rest of the visit.

**The centre mark for صناعة محتوى is a photograph** —
`resources/cut_mark.py` turns the agency's cutout into
`assets/marks/mark-photo.webp`. 🔴 **A colour key would have destroyed it**: the
cutout is on flat black and the man is wearing a black shirt. The ground is
found by *reachability* instead — near-ground pixels grouped into connected
runs, a run counted as ground if it reaches the border **or** is over 1% of the
frame. At `tol=46` the fill walked out of the ground into the shirt and left a
floating head and two arms at a plausible-looking 22.6% coverage; at `tol=2` the
subject reads 59% and is intact. The size rule is what clears the pocket of
background between his arm, the rig and his body — measured at 49,703px against
3,904 for the next enclosed run, a 13× gap.

### 2. The clipped إعلانات رقمية heading — the font lies about its ascent

Measured at 57.6px: Idris Sharp reports a font-box ascent of **37px** while
«إعلانات رقمية» inks to **49.3px**, so the ink starts **7.68px above its own
line box** — and the sub-head pins flush against a panel head that is an opaque
cream box at a higher z-index. It was not tight, it was **painted over**.

⚠️ **`Range.getBoundingClientRect()` cannot see this.** It reports the font box,
so the heading measured 4.5px *clear* while its ascenders were behind the rule.
Use `measureText().actualBoundingBoxAscent` when a display face looks clipped.

Fixed with `padding-top: 0.16em` on `.sub-name` (the measured minimum is
0.133em) plus 0.4rem of offset on the pin, and the grid's top padding moved
from `1.15em + 0.7rem` to `1.31em + 1.1rem` so the tiles keep their clearance.
**Measured after: 12px of clear air above the ink at 1280 and at 390.**

### 3. Al Baydar — a different project entirely

🔴 The entry pointed at `albaydar.ceo-6c6.workers.dev`, the **developer tuning
build** of a scroll-driven building tour, with a settings panel, an fps HUD and
AI-generated walkthrough clips. The agency's actual site is
**<https://albaydaropening.aliphcreative.com>** and it is **not the same thing at
all**: an opening invitation for مؤسسة البيدر — a countdown, the place, two
workshops with one to choose between, an RSVP that asks only for a name, and a
success card that hands back a calendar file and a map link. Static HTML/CSS/JS
on Cloudflare with a Google Apps Script Web App behind the form.

The title, tagline, description and write-up are all rewritten for the real
site. `shoot_jobs.json` points at it, its tuning-panel `prep` step is gone, and
all five screenshots are re-captured.

⚠️ **`profile.meta` is deleted from all three projects.** The details rail was
the only thing that read it, and data nothing reads goes stale silently.

**The covers are the client's logo on the client's colour** (`derive_shots.py`,
`BRAND`). They were a 160px square crop of screenshot 1 drawn into a tile ~270px
wide at a *different* aspect — upscaled, and showing a fragment of a page rather
than whose page it is. Now: `<slug>-cover.webp` 640×640 for the sheet and
`<slug>-card.webp` 960×600 for the work-page tile, from real logos in
`resources/site-logos/`. Colours are read, not chosen — Al Baydar's own
`<meta name="theme-color">` `#590505`, Seeko Seeko's `--bg` `#0C0A08`, and
Queen's Retreat's measured page field `#E2D7E7`.

⚠️ **Al Baydar's mark ships as flat RGB with its maroon ground baked in and
rounded corners.** Keying it left four pale corner arcs; a 12% alpha floor did
not fix it either, because the file's outermost 2–3 pixels are at *full*
opacity. It is inset by 1.2% first, then the ground is **unmixed** — each pixel
read as ground and ink mixed by some alpha, and that alpha recovered — so
anti-aliased edges come back as partial alpha instead of a hard cut.

### 4. The details rail is out of the sheet

`.sheet-side`, `#sheetMeta`, `.sm-row` and its rules, the block in
`projectSheet.paint()` that filled it, `profile.meta` on every project, and
`I18N.pfDetails` / `pfService` / `pfDate`. `.sheet-body` is one column, so the
screenshots take the full width of the sheet rather than 74% of it.

### 5. The work page — measured before and after

Phone profile (375×812, **4× CPU throttle**), same script both times:

| | before | after |
|---|---|---|
| DOM nodes | 1,189 | **783** |
| tiles laid out | 158 | **82** (for 82 items, up from 79) |
| `<img>` elements | 164 | **88** |
| images actually fetched | 64 | **24** |
| **decoded megapixels** | **73.0** | **7.0** |
| media bytes | 2,515 KB | **760 KB** |
| total transfer | 6,739 KB | **4,994 KB** |
| five forced full layouts | 755.6 ms | **436 ms** (±8 over three runs) |

Two changes, and the second is the big one.

🔴 **Three of the four panels are shut at any moment, and a shut panel was
still being laid out.** It is 64–104px wide with `overflow: hidden`, not
`display: none` — so every tile in it went through a four-column column layout
inside a box narrower than one column, and most items exist twice (once in
`all`, once in their service). `loading="lazy"` does not touch this: it defers
the **bytes**, not the **boxes**. A panel now ships empty and is filled by
`ensurePanel()` the first time it opens. ⚠️ `openFromQuery` has to build the
panel that holds its target before it can search for it — it works out which
one from `MEDIA` rather than from the DOM.

🔴 **The tile was serving the 1600px archive file into a box ~180 CSS px wide.**
A browser decodes an image at its intrinsic size however small it is drawn.
`resources/thumb_media.py` derives a 600px-wide `thumb/` for all 76 archive
objects — **8.4 MB → 1.9 MB, 112.6 MP → 27.1 MP** across the whole archive — and
the tiles point at it. ⚠️ **The lightbox must not follow.** It reads the picture
that is on screen, so the tile carries `data-full` with the archive file; without
it the overlay would enlarge the thumbnail, which looks exactly like a broken
pipeline and is not one.

⚠️ **Width-capped, not long-edge.** The archive is a column layout: a tile's
width is set by its column and its height follows from its own ratio, so width
is the only dimension that decides how much detail is thrown away.

### 6. The about page — media rails, text cards, and the BTS lands

**The facts table is gone** (`.ab-facts`, `.ab-fact`, four I18N pairs).

**Five rows, each one picture and one card**, sides alternating, so behind-the-
scenes runs down the left and the right of the page. ⚠️ **Every row is written
media-first and only the even rows are flipped, in CSS.** Flipping in the markup
would put two cards side by side the moment the grid collapses — and the phone
rule is exactly "one holder, then one card". The cards are the quote clipping's
treatment, which is what the agency pointed at.

**The three grey rectangles in the clippings collage are real pictures now** —
the last placeholder media on the site. Their captions described things that
were never in them and are rewritten to describe what is: «من موقع التصوير» /
«خلف الكاميرا» / «تجهيز اللقطة».

⚠️ **`aspect-ratio` is stated per holder (`--r`), and the width is capped
through the height.** A 9:16 across half a 1280px page is 880px tall, taller
than the window it is read in; `min(100%, 56vh × ratio)` takes the column when
the picture is wide and the height cap when it is tall. **Desktop 7,546 →
5,493px.** ⚠️ **No cap on a phone** — a cap and an `aspect-ratio` cannot both be
honoured and the cap wins silently, which is what was re-cropping 9:16 media
before 2026-08-10. The phone page is **8,640px**, up from 5,051: that is the
cost of putting eleven pieces of media on it, and the agency asked for them.

⚠️ **The posters are LOCAL, the clips stream from R2** — open question 13, and
the reason the home page stayed up the day `r2.dev` went dark.
`resources/about_media.py` writes the eight local copies at 1000px.

⚠️ **The reveal selector said `.ab-p, .ab-fact`.** `.ab-fact` no longer exists
and the card is the unit now, so it is `.clip, .ab-media, .ab-card`. A stale
selector here costs nothing at run time and is exactly how a reveal quietly
stops covering something that was renamed.

### The import — 22 new objects on R2

`resources/import_bts.py`. The source names are Instagram/Facebook CDN hashes,
so everything is renamed on the way in: the clips and stills continue the
`bts-NN` run (which ended at 25 plus `bts-montage`), and the ads are named after
their campaign the way `design-grillit-*` is named after its client.

| what | keys |
|---|---|
| 3 digital ads, «حقك تعرف حقك» for مكاتب خدمات الرفاه الاجتماعي — القدس | `img/design-haqqak-1..3` + `thumb/` |
| 2 BTS stills | `img/bts-26`, `img/bts-27` + `thumb/` |
| 4 BTS clips, 720×1280 | `video/bts-28..31` + `poster/` + `thumb/` |

⚠️ **The clips took a faststart REMUX, not a re-encode** — they are already
H.264 at 1–3 Mbps. Check `codec_name` before assuming that of any other import;
the 2026-08-16 batch was HEVC and had to be re-encoded.

⚠️ **`Copy of AliphxBader_BTS.mp4` is deliberately NOT imported.** It is the
4K master of the 65s montage, and its web derivative is already on the bucket
as `video/bts-montage.mp4` from 2026-08-16 — same 65.1s length. It is what the
agency meant by "use the aliphxbader", and it is in the about page's first row.

⚠️ **`img/design-newmat-27` and `-28` are superseded.** They are two of the
three new ads at 1280px from the 2026-08-16 import; these come from the 4500px
masters. The old keys are left on the bucket and referenced by nothing.

**Verified: all 176 objects the three pages ask for return 200 at plausible
lengths** — thumbs, archive files, posters and clips.

### Verified, not assumed

A sweep over three pages × two languages × two viewports, scrolling the whole
page with real wheel events first so every `gsap.from()` reveal has fired:
**0 broken images, 0 horizontal overflow, 0 page errors, 0 failed requests.**

⚠️ **Two false trails avoided, both written up in _Things that will bite you_.**
A full-page screenshot without scrolling shows every reveal at opacity 0 and
reads exactly like "the text is missing" — it cost one round here before the DOM
was queried instead. And a `Range` rect over display type reports the font box,
not the ink.

---
### The audit after the deploy — a second pair of eyes

The session that built this round wrote its own write-up and then died before
deploying (see the banner). Everything above was therefore re-checked from the
outside, against the live site rather than against the description of it. All
six edits hold. The numbers below are measured on `aliphcreative.com`, not
locally.

**The ring, against the sketch, one row per thing asked for:**

| asked | measured on the deployed page |
|---|---|
| tilt like Saturn | item transform ends `rotateY(-(a + spin)) rotateX(-tilt)` — the orbital angle *and* the spin are undone, then the plane tilt. Orbit elliptical, pictures upright and facing front. `--tilt` is `-22deg`, was `-14deg`. |
| smooth, curved edges | `border-radius: clamp(6px, 0.9vw, 14px)` |
| back half stays visible | `--o` floor is now `1 - min(away,180)/600` → **0.70** at the back. It was `/240` → 0.25. |
| hover only on the item | bound on each `.ring-item`, not `.ring-window` |
| two-step click | first click sets `picked` and glides; navigation is gated on `picked === i && front === i` |
| desktop two columns | ring 43→697, its line beneath it in the same column, the three services stacked at x=754, the way out at 917→1219 |
| phone unchanged, button centred | `.svc-head` returns; the button sits 32px from each edge — measured equal |

⚠️ **Two things that read as bugs and are not. Both cost a round here.**

1. **The active service is marked `is-on`, not `is-active`.** Checking for
   `is-active` reports all three options inactive and identically styled, which
   looks exactly like the active state never landed. It did: the live one
   carries an ink `border-bottom-color` and full-strength text while the other
   two are transparent at 68%.
2. **`.svc-opt`'s own computed `display` is `inline-block` at every width**, so
   reading it on a phone looks like the desktop list is rendering on top of the
   phone heading. It is not — the parent `.svc-list` is `display: none` there
   and all three options measure 0×0. **Read the parent, not the child**, when
   a container is what the breakpoint switches.

**The work page's deferral, in numbers, on the live page:**

| | at load |
|---|---|
| tiles in the DOM | **82** — the open panel only; the other three are empty until opened |
| DOM nodes | 784 |
| `<img>` elements | 88 |
| images actually fetched | **4** (1 KB transferred) |
| DOMContentLoaded / load | 224 ms / 224 ms |

The eager build put every panel's rows in at load. The lazy one builds a
panel's tiles when its spine is clicked — opening تصميم جرافيكي took it from
`design:0` to `design:12` on the spot.

⚠️ **One behaviour could NOT be tested and is still unverified: the two-step
click in motion.** The glide that carries a picked item to the front is driven
by `requestAnimationFrame`, and a browser pane that is not displayed does not
composite, so rAF never fires — the second click can never find an item at the
front there. The logic reads correctly and every static property measures
right, but the *feel* of it — the glide's timing, whether `1.3` is too large a
jump against the `1.14` of an unpicked front item — has never been seen by
anyone. It needs a real pair of eyes on a real screen.
---

## Session 2026-08-22 — five features, shipped and deployed

Built and deployed in one pass: work-page subsections, the three real software
projects (closing open question 14), the carousel reels (closing open question
7), the ماذا نفعل rebuild as three service rings, and the hero CTAs. Everything
below was verified by measurement in a browser, not by eye.

### The work page files itself into named runs

Each service panel is split into subsections whose heading is the **year head
from the very first archive build** — a display numeral hung over the grid,
sticky as the run scrolls. `.lib-sub` / `.sub-head` / `.sub-name` in style.css,
`LIBSUBS` in renderLibrary.

| service | runs | counts |
|---|---|---|
| تصميم جرافيكي | Digital Ads | 9 |
| صناعة محتوى | Videos / Photos | 13 / 54 |
| حلول تقنية | Websites *(Apps hides)* | 3 |

⚠️ **`all` is deliberately NOT subdivided.** A row's run is a property of its
service, so grouping the mixed view would only re-sort it by category under
another name. It stays one continuous newest-first run, as the agency asked.

⚠️ **`--phead` is measured from JS (`syncSubOffset`), not typed.** A subsection
head pins directly under the panel head, which is sticky in the *same*
scroller — pin it any higher and it slides behind that head and is never seen.
The panel head is display type at a clamp in two languages; it measured 85px at
1280 and the same at 375, but that is a coincidence of the clamp, not a
constant. Re-run after fonts land.

⚠️ **`align-items: flex-start` on `.sub-head` is load-bearing.** The head is
`height: 0` so it hangs over the grid rather than pushing it down, and a flex
item in a zero-height container *stretches to zero* — the heading then measures
0 tall while its glyphs spill out of it, which looks fine and is impossible to
position against. Measured 81px tall after the fix, 16px clear of the tiles.

The grid's top padding is derived from the type
(`calc(var(--sub-type) * 1.15 + 0.7rem)`) rather than a second clamp, so the
clearance moves when the heading does.

⚠️ **An unclaimed row still renders.** `LIBSUBS` predicates are first-match, and
anything no run claims gets its own unnamed grid. A piece of work must never
fall out of the archive because the taxonomy grew a hole. `logos`, `print` and
`apps` are declared with predicates that cannot currently match — they are the
shape the archive grows into, and appear on their own the day something is
filed there.

⚠️ **Every design piece is a digital ad because the agency said so
(2026-08-22)**, not because anything in the data says which is which. MEDIA
carries no subsection field. When they classify the nine, `of` stops being a
constant and becomes a lookup.

### Open question 14 is closed — three real projects

`PROJECTS` was twelve invented entries; it is three real ones, all live, all
built by the agency:

| project | client | live | date |
|---|---|---|---|
| رتريت عودة الملكة | منتدى سيّدات إيليا | `queensretreat.ceo-6c6.workers.dev` | 2026-07 |
| موقع البيدر | مؤسّسة البيدر | `albaydar.ceo-6c6.workers.dev` | 2026-08 |
| سيكو سيكو — ليلة سينما | بدر للفعاليّات | `seekoseeko.ceo-6c6.workers.dev` | 2026-05 |

The sheet's button is an `<a target="_blank" rel="noopener noreferrer">` now and
leaves for the real site; the note under it is the address itself.
`I18N.pfVisit` replaced `pfPreview`/`pfPreviewNote`.

**Screenshots are real and reproducible.** `resources/shoot.py` drives headless
Edge over CDP; `resources/derive_shots.py` cuts them to the sheet's own three
aspect ratios (1600×1000 plate, 400×250 thumb, 160×160 cover — read off the CSS,
not guessed). 31 files, 636 KB, in `prototype/assets/shots/`. Job list in
`resources/shoot_jobs.json`; raw captures are gitignored.

⚠️ **Chrome's `--screenshot` flag was not enough and neither was Playwright.**
The flag only ever captures scroll 0, and two of the three sites are
scroll-driven. Playwright's MCP wants a Chrome that is not installed. CDP over
`websocket-client` against headless Edge is what worked — with two traps:

1. 🔴 **`--remote-allow-origins=*` is required.** Without it `/json` answers
   perfectly and then the WebSocket upgrade 403s. *"The port is open" is not
   evidence that CDP is reachable* — and a catch-all retry loop hides the 403
   behind a generic timeout for as long as you let it.
2. ⚠️ **`--disable-extensions` is not tidiness.** A fresh `--user-data-dir`
   still picked up the signed-in profile's extensions, and the target list came
   back led by a Grammarly signup tab — so "the first page target" is not this
   browser's blank tab, and driving it screenshots somebody else's page.

⚠️ **Al Baydar's deployed root is the TUNING build.** It ships a settings panel
and an fps HUD over the tour; both were hidden by script for the screenshots
(`panel`, `panelOpen`, `hud` — the prep string is in `shoot_jobs.json`), but a
visitor clicking "زيارة الموقع" lands on the version *with* them. Its README
also says both walkthrough clips are **AI-generated**. It is labelled
«نموذج أوّلي / Working prototype» in its own meta rather than presented as a
finished client site. **The agency should decide whether it ships in that
state** — it is one entry to remove.

⚠️ **The سيكو سيكو page is served with an archive shim, and that is not
cosmetic.** It was built for Netlify, where `POST /` is the Forms endpoint; on
Workers that endpoint does not exist (`POST /` → 405, measured). The form asks
for a **name and a phone number**. `public/demo.js` intercepts that one request
so the values never reach the network, and puts a ribbon on the page saying
registration is off and the event has passed. Resolving the request `ok` is what
makes the success panel appear — which is the flow worth showing — so **without
the ribbon the page would be telling a visitor they have a seat at an event that
ended on 30 May**. See that repo's own README.

The tech tiles on the work page show their real cover screenshot now
(`coverOf`), not the grey `HOLDER` rectangle.

### Open question 7 is closed — the carousel plays reels

The eight slides are eight reels from R2, ordered so no two neighbours come from
the same shoot **including across the wrap**, where slide 8 sits beside slide 1.
The three near-duplicate portraits (46/47/48) are gone.

`reels-alif-tuktuk · connect-edited · child-section-final · einar-edited ·
dardashat · copy-of-bader-4 · finallllllllllll · draft2-show`

⚠️ **The posters are LOCAL, the reels are on R2, and that split is a rule.**
Everything the home page paints comes out of `assets/` (open question 13) —
which is the only reason it stayed up when r2.dev went dark and took the work
page with it. A poster is what the slide shows until it is centred, so it is
page content; the reel has no choice, at 17–83 MB against a 25 MiB asset cap.
`resources/`-adjacent puller is in the session scratchpad; the eight `.webp`
posters are committed under `prototype/assets/media/`.

🔴 **The preview module had NEVER worked, and adding `data-preview` would have
done nothing.** It ran its only `refresh()` at *definition* time — before
`reelShow` triples the slides and before `renderLibrary` paints a tile — so
`nodes` held the eight originals and never the clones. The centred slide is
almost always a clone. It is re-scanned from `applyI18n` now (which also covers
the language switch re-rendering the library).
**Verified: exactly one video playing, in the centred slide, `readyState 4`,
streaming from `media.aliphcreative.com`; clicking it opened the lightbox on the
same reel at the frame it had reached (20.4s → 21.9s), counter "8 / 8" not 24.**

⚠️ **A save-data guard was added.** `navigator.connection.saveData` or a 2g
`effectiveType` and the carousel stays a run of poster frames. The carousel
advances on its own, so a visitor who never touches it can otherwise pull
several 50 MB reels in the street. Feature-detected — Network Information is
Chromium-only and where it is absent nothing is assumed.

Block 1's picture is `pics-Queen-retreat-55-copy-of-0c2a0240.webp` as asked.

### The film strip — PREPARED, not implemented

The agency wants the frames bigger and able to hold a vertical item. **It needs
no re-cut of the scan.** Measured off `film.webp` (5400×2206): the perforation
bands end at y=220 and resume at y=1981, so the clear window is **1761px =
79.8% of tile height** — and `.film-frame` only uses 62% of it.

| | now | for a 9:16 item |
|---|---|---|
| `.film-frame` height | 62% | **78%** |
| `--fgap` | `--fh * 0.035` | **`--fh * 0.0866`** |
| frame aspect | 0.874 (crops 9:16 by 19%) | **0.5625** (exact) |
| frame area | 0.3360 fh² | 0.3423 fh² |

`FRAMES_PER_TILE` stays 4 and the frame-slot constant stays `0.611967`, so no
asset is rebuilt. The trade is wider bare stock between frames. The alternative
is `FRAMES_PER_TILE = 5` with `--fgap` at **0.0254** for a tighter run at the
same aspect — that one *does* need `cut_film_scan.py` re-run, and the constant
it prints goes into style.css.

⚠️ Area only moves +2% either way, so **"bigger" also wants `--hero-h` raised**
— about +14% for roughly +30% frame area.

⚠️ `FILM_FRAMES[].cap` is deleted. It held four invented project names kept as
"the shopping list for the real titles"; the real titles exist now and none of
them belongs to those photographs.

### ماذا نفعل is three service rings

The picker and its example stage are gone. Three rings, one per service, stacked
in one window that slides; each turns around a drawn mark; the item facing the
viewer grows and its line appears underneath; clicking it opens that piece on
the work page. `serviceRings` in main.js, `RINGS` / `RING_MARKS` beside it.

⚠️ **The React component in the brief could not be used.** This site is vanilla
HTML/CSS/JS with no build step — no package.json, no Tailwind, no TypeScript.
Installing shadcn would mean rebuilding the site. The ring is CSS 3D, which also
buys the three things that component does not do: preserved aspect ratios,
centre-line alignment, and per-item scale on the front face.

🔴 **The window CLIPS and the stages hold the PERSPECTIVE, never the other way
round.** `overflow: hidden` forces `transform-style` back to flat on the same
element — a window that both clipped and carried the perspective would collapse
every ring into a flat row of overlapping pictures, with no error and no obvious
cause.

⚠️ **`inset: 0; margin: auto` with an explicit width and height is what puts
every item's transform-origin on the ring's axis.** That is why items of
different shapes line up through their middles rather than their edges —
measured: all eight photo-ring items at cy = 268px.

Items are sized to **constant area**, not constant width or height: a 9:16 reel
beside a 3:2 photograph looks like two different sizes either way, and equal
area is the one where neither dominates. Measured ~33,700px² each at ratios
0.562 / 0.667 / 1.500.

⚠️ **`front()` runs only when the facing item CHANGES, never per frame.**
Writing `--o` and `--s` on every item every frame is ~60 style writes a frame,
all setting the value the element already had, all invalidating style on a
composited 3D layer — *and* it fought the 0.45s transition those properties
carry, so paying the cost bought a worse-looking ring. This section sits three
screens above a carousel with a reported phone stutter (open question 17); it
should not become the next suspect.

Services auto-advance after each full revolution (26s) and stop advancing for
the visit as soon as anything is clicked. Hover pauses. Off screen it does not
turn at all.

**Deep links, new:** `library.html?open=<MEDIA filename>` and
`library.html?project=<n>`, handled by `openFromQuery`.
⚠️ It prefers the item's **category** panel over `all` — every piece exists in
both and `all` comes first in the DOM, and the panel it opens in decides what
the overlay's arrows walk through. Verified: `?open=reels-alif-tuktuk.mp4`
lands in صناعة محتوى with the counter reading "3 / 13", not "3 / 79".
⚠️ It uses a **timer, not `requestAnimationFrame`** — a link opened into a
background tab does not paint, rAF never runs there, and the piece would stay
unopened until the tab was looked at, which is exactly when the arrival is over.

### The hero has two buttons instead of a meta line

`منذ ٢٠٢٦ · القدس — جبل الزيتون · the three services` is replaced by
«ابدأ من هنا» (`#why`) and «تواصل معنا» (`#contact`). The first echoes the
headline above it on purpose — نبدأ من حيث تبدأ الأشياء. A third «تواصل معنا»
is in the nav overlay on all three pages.

Both are plain anchors: `scroll-behavior: smooth` is already on `html` and
already dropped under `prefers-reduced-motion`, so a scripted scroll would only
be a second, worse copy of that.

⚠️ **The nav CTA has to close the overlay itself.** Unlike the three nav links
it is a same-page anchor, so nothing tears the panel down behind it and it would
sit over the footer it had just scrolled to. It re-clicks the burger rather than
re-implementing the close, which owns the exit tween and the `.nav-closing`
hand-off.

⚠️ **`.oval-btn.is-solid` needs `z-index` on its swap.** The oval is a `::before`
*under* the label, so filling it paints ink straight over the words. The
outlined version never needed this — there was nothing to hide behind.

🔴 **The founding year is now stated NOWHERE on the site.** `heroMeta1` said
٢٠٢٦; `about.html`'s facts table says ٢٠٢٤. They contradicted each other for two
weeks and the hero line is gone, so the contradiction is dormant rather than
resolved. Settle it before the year goes back anywhere.

### Removed this session

`svcPicker`, `activateService`, `fitPicks`, `setHolder`, `playWhenVisible`, the
sheet's `webview` iframe and its 88 lines of CSS, `prototype/preview/`,
`I18N.heroMeta1/2/3`, `.hero-meta` / `.hm-row` / `.hm-seam`, `.svc-picks` /
`.svc-pick` / `.svc-dot` / `.svc-demo` / `.sw-*`. All of it was code whose
subject no longer existed.

### Two things the hidden-tab browser cannot show you

The verification browser in this session did not composite, and that produced
two false trails worth recognising:

1. 🔴 **Frozen transitions read exactly like a cascade bug.** A panel that had
   just been given `.open` reported `flex: 0 1 auto` and `offsetWidth: 1px` —
   the CSS *initial* value, frozen at t=0 — while its closing sibling still
   measured 1085px. Three rounds went into checking whether the stylesheet had
   failed to parse. **Inject
   `*{transition:none!important;animation:none!important}` before reading any
   geometry**, and check `document.visibilityState` first when a measurement
   disagrees with the DOM.
2. ⚠️ **`naturalWidth === 0` on a lazy image is not a 404.** Nothing decodes in
   a tab that never paints. Fetch the src, or set `loading = 'eager'` and wait —
   which is how all 158 work-page images and all 169 on the deployed page were
   confirmed.

⚠️ And a third: **cross-origin `fetch` from localhost fills the console with
CORS errors that are the CHECKER's, not the page's.** `<img>` loading is not
CORS-gated, so R2 pictures load fine while a HEAD request for the same URL
fails. Do not report those as broken images.

---

## Session 2026-08-21 — the report as a slide deck (no site code changed)

Again nothing in `prototype/`, `chat-worker/` or `resources/` was touched, and the
2026-08-17 fixes are still uncommitted in the working tree.

Built: a nine-slide deck of the final report, published as a Claude Design canvas
(`https://claude.ai/code/artifact/c133957d-89e3-4f1f-835b-f840d011d822`). Working
files live OUTSIDE this repo, in `D:\Personal\Projects\Internship-Report-Deck\`:
`make_slides.py` writes the nine `.dc.html` artboards and `canvas.json`,
`build_assets.py` derives the images. **Edit the generators, never the
`.dc.html` files or the seeded output** — a re-run overwrites them.

The deck is this site's design system at presentation scale: `#0F1820` /
`#D9D9CE` / `#BB5C39`, Georgia (the site's own `--font-latin`), the double rule,
the 3px section rule, the hairline rows, and the linen. **Idris is NOT used** —
5.2 MB of OTF cannot be embedded in an artifact, and English sets in Georgia on
the site anyway. Arabic falls back to IBM Plex Sans Arabic off Google Fonts.

⚠️ **The cover's film band is composited with THIS repo's geometry, not by eye**
(`build_assets.py:film_band`): the tile is 5400×2206, a frame slot is
`tileAspect / 4` of the strip height, the frame is 62% of that height nudged
2.1% down, with a 3.5% gap either side — the same numbers as `.film-frame` and
`--fgap` in `style.css`. If the tile is ever re-cut, those constants move with
it. The base is pasted FIRST and the photographs on top: the film base is opaque
except for the sprocket holes, so compositing the other way round hides every
frame (it did, first try — the band came out 5 KB).

⚠️ **Two things about the artboard format that cost a round each.** There is no
`box-sizing` reset, so a `height:100%` column with padding is 900+96 tall and
the footer falls off the bottom of every slide — the site's own
`* { box-sizing: border-box }` is now in each artboard's helmet. And image
references resolve by literal substitution on the source, so `url(&quot;…&quot;)`
never matches; the filename has to appear unescaped.

Nine photographs from `prototype/assets/media/` are in the deck (eight in the
cover band, four on the Aliph slide) — the agency's real work, same as the site.

---

## Session 2026-08-19 — the internship final report (no code changed)

Nothing in `prototype/`, `chat-worker/` or `resources/` was touched. **The seven
fixes from 2026-08-17 are still uncommitted in the working tree** — that state is
unchanged and the banner above still applies.

Written this session: `C:\Users\Obaida\Desktop\Internship Final Report.docx` — a
whole-internship report covering Aliph, Al Baydar, Queen's Return, Badr Events
and the two scoped-but-unstarted projects. It is generated from the *5th week
report*'s own `.docx`, so the running header, the Al-Quds + Aliph cover and every
paragraph style are the original's rather than a rebuild: the cover block and
`sectPr` are kept byte-for-byte and only the body between them is regenerated.
The generator is `build.py` in this session's scratchpad (`…\e7163d84-…\`).

⚠️ **The period on the cover reads 29 June – 19 August 2026, and the start date is
inferred, not sourced.** Week 5 was labelled 26–31 July, which puts week 1 at
28 June, and the Queen's Return repo's first commit is 2026-06-29. If the real
first day differs it is one string in `build.py`.

The Aliph facts in it were read out of this file: 80 archive items (54
photographs, 13 films, 9 design pieces), the R2 move to
`media.aliphcreative.com`, the chatbot at stage 2 of 5 with 67 tests and no key,
and the four placeholder software entries carried as outstanding.

---

## Session 2026-08-17 — seven fixes from the agency

### The texture is a BACKGROUND now, not a wash over the page

The agency's note: the texture should not sit on top of media items and text.
It was `body::before`, `position: fixed`, **`z-index: 5`**, `mix-blend-mode:
multiply` — i.e. the weave was printed over every photograph and every line of
type on the site. It is `z-index: -2` now, behind everything.

⚠️ **Three coupled changes, and only the first is obvious from the request.**

1. **The blend had to change with the depth.** `mix-blend-mode` composites
   against what is painted BELOW it, and below a background layer there is
   nothing — the weave would have vanished. It is `background-blend-mode:
   multiply` against the element's own `background-color: var(--cream)`, which
   is self-contained: same arithmetic, same result over the cream field, no
   backdrop to read.
2. **The cream moved from `body` to `html`.** A negative-z child of `body`
   still paints ABOVE `body`'s own background, so a cream body would have
   buried the layer. The root paints the field; `body` is transparent.
3. 🔴 **Every section that painted its own cream became a flat hole.** While
   the linen was on top it was masking how many elements repaint the page
   colour. `.masthead`, `.hero` and `.contact-band` all had
   `background: var(--cream)` and all three now have none. Cards and chrome
   that are deliberately `--cream-warm` keep theirs; so does `.hero-panel`,
   which is opaque over the film and carries its own linen.

✅ **Verified by differential render, not by eye.** The page was screenshotted
with the layer forced off and diffed against the layer on:

| region | signature | reading |
|---|---|---|
| `.masthead` | **100% negative**, mean −12.4 | weave behind a cream field ✔ |
| body-text box | 97% negative, mean −11.6 | weave in the cream *between* the glyphs ✔ |
| gallery tile | exactly 0 | nothing over the picture ✔ |
| `.wb1` photo | **52% neg / 48% pos**, mean −0.006 | rasterisation noise, not the weave |

⚠️ **That last row is the trap.** A photograph showed a delta of up to 5/255
across 15% of its pixels, which reads exactly like "the texture is still on
top". It is not: a multiply can only ever DARKEN, so a real overlay is ~100%
negative like the masthead, while this was symmetric about zero. The control —
two identical runs — diffed to exactly 0, so the noise is real but comes from
the compositing change, not the layer. **Check the sign distribution before
concluding an overlay is still there.**

⚠️ **`?flat=1` is now nearly meaningless and open question 17 moved with it.**
It existed to A/B the `mix-blend-mode` backdrop read as the suspect for the
phone stutter. There is no backdrop read any more — this change *is* the fix
that diagnostic was hunting for. If the Galaxy A54 still stutters, the linen is
ruled out for good.

### Body copy is bold — and one solved size moved with it

`body { font-weight: 700 }`, inherited, so every paragraph picks it up. Idris
Flat ships a real 700 (`29LTIdris-FlatBold.woff2`), so this resolves to the drawn
face rather than a synthesised one — `document.fonts.check('700 16px "Idris
Flat"')` is `true` on all three pages in both languages. Explicit weights (500
meta, 800 display) are their own tiers and were left alone.

⚠️ **Bold sets wider, so `fit_columns.py` had to be re-run.** English moved
**20.7 → 20.1px**, so `--why-type` is **0.761** (was 0.784). Arabic did **not**
move — still 26.4px. A weight change alters where lines break, not the size
directly, so whether a column re-solves depends on whether a line actually
re-wrapped: *"the Arabic is unchanged" is not evidence the solver failed to
run.*

⚠️ **It also broke the footer legal line**, which is written up below.

### The film strip's edges — a detection threshold used as a delimiter

The agency circled the top and bottom of the strip. Both long edges carried a
row of **pale crescents in the gaps between the sprocket holes** — 16 of them,
+10 to +20 luma, and spaced at ~331px where the holes sit at 300.

🔴 **Root cause, and it is a shape worth remembering.** `cut_film_scan.py`
found the two perforation bands with a coverage threshold (`>25%` of the row is
bright) and then reused those bounds to decide what was *outside* the bands. A
sprocket hole has rounded corners, so its first and last rows are only a few
percent bright: the true top band is rows **31–221** and the 0.25 threshold
reports **37–216**. Those ten rows stayed opaque *and* bright, and — because
the edge-print rebuild takes everything above the band as "margin" and tiles a
clean patch across it — got smeared across the full width at the **patch's**
period instead of the hole's. Hence crescents at the wrong pitch.

The tell was the spacing mismatch: an artefact that does not share the feature's
period did not come from the feature.

`grow()` now widens each band outward to where the signal actually dies (floor
0.01, 2px pad) before either keying alpha or cutting the edge bands, and a new
assertion fails the build if any margin band still holds hole pixels.
**Measured after: 16 anomaly runs → 0, residual tone step ~2% of base** (grain
level; it was 15–27% at the crescents).

✅ **The frame-slot constant did NOT move — still `0.611967`**, so no CSS
change. Transparent fraction 6.8% → 6.9%, 18/18 holes, all asserts pass.

### The carousel's clones were being counted as content

The agency: *"it says that it has 24 when it actually has 8 duplicated ones."*
The loop triples the slide set, and the lightbox grouped by `.reelshow-track`
and counted the DOM — so the counter read **"٣ / ٢٤"** and the arrows walked
the same eight pictures three times.

⚠️ **There was a second, quieter bug in the same place.** A click landing on a
*clone* was not in the group at all, so `group.indexOf(node)` returned `-1`,
`Math.max(0, -1)` made it `0`, and the overlay silently opened **slide 1**
instead of the picture that was clicked. Two thirds of the carousel is clones,
so this was the common case, not the edge case.

Clones now carry `.is-clone`; originals carry `data-slide`, which `cloneNode`
copies across, so a clone can be resolved back to its original. The lightbox
filters clones out of the set and resolves the clicked node first.
**Verified: 24 in the DOM / 16 clones / 8 real; counter reads "٤ / ٨"; clicking
the clone of slide 3 opens the same picture and the same index as slide 3.**

### Block 2's title is centred — and it took two things, not one

The second hairline centres the text **block** (the rules flex to fill, so a
leading one balances the trailing one). `text-align: center` centres the
**lines within it**.

⚠️ **Arabic alone would have hidden the second half.** It sets this title in
one line and looked finished; English wraps to two, and the second line ragged
to the start edge under a centred first — measured, line 1 at `124..1151` and
line 2 at `124..613` in a box of `38..1242`. Both are needed. The ≤640px block
already hid the hairlines and centres by `justify-content`; the new `::before`
had to be added to that hide-list or it pushed the title off-centre on a phone.

### The footer mark and the legal line

**Desktop:** the wordmark was centred in its column while the clock above and
the socials below both hugged the same edge — the one thing in the footer
lined up with nothing. It takes `justify-content: flex-end` now (logical, so it
mirrors with the language; in Arabic that is the left).

⚠️ **`width: 100%` on `.contact-mark` is load-bearing and was removed once by
mistake.** `Aliph-Logo-Main-cream.svg` has a `viewBox` and **no width/height
attributes**, so it has a ratio but no intrinsic size — let the box shrink-wrap
and `width: auto` resolves to **zero and the mark disappears**. Measured a 0×0
box. It is also what the img's `60%` cap resolves against.

**Phone (≤640px):** `.contact-side` becomes a **grid** — clock at the start of
row 1, mark at the far end of the same row, socials on row 2. A column flex
cannot put two children on one line, and stacking all three was three shallow
bands of mostly-empty ink. The mark is `112px` wide there (was 148) with an
explicit `width`, for the same SVG reason as above.

⚠️ **The legal line is stacked now, and bold is why.** `.footer-legal` is a
`space-between` row of two blocks; bold pushed the pair past the width, so
instead of overflowing **each half wrapped inside itself** and the Latin
wordmark broke across two lines that ragged back toward the Arabic. Measured at
375px the two need **310px of a 327px line** — trimming type cannot buy 60px —
so they get a line each: `align-items: stretch` plus a `text-align` per child,
so the legal keeps the start edge and the wordmark takes the end edge, which in
Arabic is the left. Verified: ALIPH CREATIVE on **one** line, ink starting at
x=24, flush with the page margin.

⚠️ **"Left" was read as the LOGICAL end throughout**, because the footer
mirrors with the language and the agency is reading Arabic, where end *is* the
left. In English these three all mirror to the right. Worth confirming that is
what they want.

---

## What this is

A portfolio site for **Aliph Creative Agency (ألِف)**, a bilingual Arabic-first
creative agency in Jerusalem. The brand is built on the letter alif — "the point
things begin from."

⚠️ **It is an AGENCY, not a studio** (confirmed 2026-08-10). 29 occurrences were
renamed across the three pages and `main.js`. Arabic needed care, not a find and
replace: وكالة is feminine where استوديو is masculine, so `استوديو إبداعي` →
`وكالة إبداعية`, and the verbs moved with it — `كيف بدأ الاستوديو` → `كيف بدأت
الوكالة`, `لِف استوديو يبدأ` → `لِف وكالة تبدأ`. **`chat-worker/` still says
studio in 7 places** and was left alone deliberately: the widget is hidden and
touching it risks the 67 tests under deadline.

Static HTML/CSS/JS in `prototype/`. **No framework, no build step, no npm.** Plus a
separate Cloudflare Worker in `chat-worker/` for the (unfinished) chatbot.

```
prototype/
  index.html      home: film hero → لماذا ألِف؟ → ماذا نفعل؟ → footer
  library.html    work archive + project profile sheet
  about.html      clippings, long read, one section per service
  style.css       one stylesheet, all pages
  main.js         one script, all pages (i18n + every interaction)
  chat/           the chat widget (separate deployable's client half)
  assets/         fonts, images, derived art
chat-worker/      the chatbot backend — its own deployable
resources/        source art + the Python that derives assets from it
```

---

## Running and deploying

```bash
python -m http.server 8321 -d prototype
```

**Deploy is not automatic. Pushing to GitHub does nothing.**

```bash
npx.cmd wrangler deploy
```

- From the repo root → deploys **the site**. From `chat-worker/` → deploys **the bot**.
- `npx.cmd`, not `npx` — PowerShell's execution policy blocks the `.ps1` shim.
- Live at `aliphcreative.ceo-6c6.workers.dev`. `account_id` is pinned in
  `wrangler.toml` because this login can reach two accounts.
- Wrangler often says *"No updated asset files to upload"* even when files changed.
  It dedupes by content hash and the deploy is still correct — verify by fetching
  the live file and diffing, not by trusting the message.
- ⚠️ **Verify with a cache-buster, and compare BYTES.** Straight after a deploy
  the custom domain can still serve the previous copy of an asset for a minute
  or two while `workers.dev` already has the new one — measured on 2026-08-16,
  `film-m.webp` came back 264,986 bytes on `aliphcreative.com` and 42,086 on
  `workers.dev`, which looks exactly like a half-finished deploy. Appending
  `?v=<timestamp>` shows the true origin. Assets are `max-age=0,
  must-revalidate`, so it clears itself; there is nothing to purge.
- ⚠️ **Send a browser User-Agent when you verify.** Cloudflare answers a
  scripting library's default UA with **403** on the SITE hosts too, not just
  on the media bucket — confirmed 2026-08-24. A verification pass that 403s on
  every file looks exactly like a failed deploy, and it is the same trap the
  R2 checker fell into for a whole round. Real failures are partial; a check
  that fails for every item is more likely broken than the thing it checks.
- 🔴 **`/index.html`, `/about.html` and `/library.html` 307 to `/`, `/about`
  and `/library`.** A `curl` without `-L` returns **0 bytes** for all three and
  reads exactly like a broken deploy — which is what it looked like on
  2026-08-27, minutes after a deploy that was in fact perfect. Always `curl -L`,
  or fetch the clean paths. CSS and JS have no redirect, which is why they
  verified fine in the same pass and made the HTML look worse than it was.
- ⚠️ **HTML byte-matching between the two hosts is NOT reliable either way.**
  On 2026-08-26 `aliphcreative.com` came back +359 bytes on every page from an
  injected Cloudflare Web Analytics beacon; on 2026-08-27 all three pages were
  byte-identical to the tree. It is a zone setting, so do not read a difference
  — or the absence of one — as evidence about the deploy. CSS and JS do match,
  and md5 is the check worth running. See _Things that will bite you_.
- ⚠️ **R2 from this machine needs the account id in the environment**, because
  this login can reach two accounts and wrangler refuses to guess
  non-interactively:
  `CLOUDFLARE_ACCOUNT_ID=6c60bd775004cfa0082f768c356c7242 npx.cmd wrangler r2 object put aliph-media/<key> --file=<path> --remote --content-type=<type>`.
  Confirmed working 2026-08-26 — it uploaded the thirteen `preview/` objects.
  The bucket is `aliph-media`.
- ⚠️ **Do not grep live Arabic through Git Bash.** The shell mangles the
  pattern and every match comes back empty, which reads as "the copy did not
  deploy". Fetch in Python and test with `in`. This box's cp1252 console has
  now produced three different false failures — see _Things that will bite you_.

---

## Design system

- **Ink `#0F1820` and cream `#D9D9CE` only.** Terracotta `#BB5C39` is reserved for
  the nav strike on the current page and focus rings. Nothing else.
- Secondary text uses `--ink-soft` / `--ink-mute` / `--ink-faint`. Never a raw low
  alpha — anything under ~0.65 fails AA on the cream.
- **Type:** Idris Sharp Extrabold (display), Idris Flat (body), Georgia (Latin).
  Tokens are `--font-display` / `--font-body` / `--font-latin`.
  ⚠️ **Served as WOFF2 since 2026-08-26** — 503 KB for the three that load,
  where the OTFs were 3,918 KB. The `.otf` files are still on disk and still
  listed second in every `src:`; nothing fetches them. Re-derive with
  `fontTools` (`font.flavor = "woff2"; font.save(...)`) if a face is replaced,
  and diff the RENDERING, not the metrics — see the `tnum` entry in
  _Things that will bite you_.
  ⚠️ **Idris carries a full Latin set** (A–Z, a–z, 0–9 and ASCII punctuation),
  so English display lines are set in it, full stop included — and that full
  stop is drawn for Arabic typesetting. At hero size the English headline's
  period reads like a comma. It is the face the agency chose; nothing overrides
  it.
- `html { font-size: 150% }`, so **1rem = 24px**. Every rem number reads 1.5× larger
  than it looks.
- **Media is in colour as of 2026-08-10.** `filter: grayscale(1)` was removed from
  all 11 rules that carried it. What is left is the tonal grade only —
  `contrast(1.05)`–`contrast(1.08)`, plus `brightness(0.92)` on the film strip.
  Texture over flatness still holds; it is just no longer monochrome.
  ⚠️ **This means ink-and-cream is the rule for the *interface*, not the page.**
  Every photograph now brings its own palette, so "two colours only" can no longer
  be checked by looking at a screenshot — it applies to type, rules, and chrome.
  Two knock-ons: the film strip's `sepia(0.12)` went too (a warm cast reads as aged
  stock on grey, as a yellow tint on colour), and the library tile's hover was
  `grayscale(0.15)` — "desaturate less on hover", which **inverts** without a grey
  base — so it is `saturate(1.12)` now.
- **Body copy is BOLD since 2026-08-17** — `body { font-weight: 700 }`,
  inherited. Idris Flat ships a real 700, so check
  `document.fonts.check('700 16px "Idris Flat"')` rather than trusting that a
  missing weight would error: it does not, the browser fakes one, and a faked
  bold on an Arabic face reads as the wrong font entirely.
- **The linen is a layer BEHIND the page, not a wash over it** (2026-08-17).
  ⚠️ Which means a section that paints `background: var(--cream)` punches a
  flat hole in the texture. Only paint a background when the tone is
  deliberately different (`--cream-warm` cards) or the element must be opaque.
- Voice: editorial broadsheet — the site behaves like an Arabic newspaper issue.

**Arabic is the primary language.** Type is tuned to Arabic; English sets longer and
is scaled down to compensate, never the other way round.

---

## Services (three, since 2026-08-08 — relabelled 2026-08-10)

| id | Arabic | English |
|---|---|---|
| `design` | تصميم جرافيكي | Graphic Design |
| `photo` | صناعة محتوى | Media Production |
| `tech` | حلول تقنية وبرمجية | Tech & Software Solutions |

Each has three subcategories (`SUBCATS` in `main.js`). The ids are the join key across
`CATS`, `SUBCATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`, `data-service` in
the markup, **and `chat-worker/src/services.js`**. Change one without the others and
classification breaks silently.

⚠️ **Renamed twice now, and neither rename moved an id** — only labels.
2026-08-10 gave the three their long names; **2026-08-11 changed `photo` from
تصوير احترافي / Professional Photography to صناعة محتوى / Media Production**,
which widens it from photography to everything the feed is made of.

**Three live copies, and they must all move together** — this string has gone
stale twice by being changed in one place:

1. `CATS` in `main.js` — the names on screen, and what `I18N.heroMeta3` derives
   from
2. `SERVICES[].tag` in `main.js` (the uppercase Latin tag)
3. `chat-worker/src/services.js`

⚠️ **This list said SIX until 2026-08-26, and three of the six had not existed
for a while.** The `data-i18n` fallback span and the `heroMeta3` fallback it
named are gone from the markup, and `I18N.svc1/svc2/svc3` — a fourth spelling
kept in step by hand through three renames — were read by nothing at all and
were deleted. A list of places to keep in sync is itself a thing that goes
stale; check it against a grep before trusting it.

`I18N.heroMeta3` is **derived from `CATS`** and needs no edit. A dead literal
for it sat in the I18N table carrying the pre-rename short labels until
2026-08-11; it was overwritten at boot and never rendered. It is gone, and so
are `svc1/svc2/svc3` — don't reintroduce either.

The keyword lists in `services.js` keep the **short** forms on purpose: a visitor
types "تصميم", and "تصوير" still routes to `photo` because they still shoot.

✅ **The rename fixes open question 2.** صناعة محتوى covers *running* a channel,
which the three-service taxonomy had no home for since `creative` was dropped —
the social keywords parked on `photo` now sit under a name that admits them.

⚠️ **A service name is a substring problem now.** `guardrails.mentionsService()`
decides "has the bot classified yet" by looking for a full service name in its reply,
and it is what un-gags the follow-up questions. A model that writes "تصميم" instead of
"تصميم جرافيكي" now reads as *never classified*. That is dead at stage 2 (the stub
echoes the exact name) and live the moment a real model answers.

---

## Things that will bite you

Ordered by how much time each one cost.

**A media query adds NO specificity, so an override written above the rule it
overrides loses at every width.** `@media (max-width: 900px) { .film-frame::before
{ background-image: url(film-grain-m.webp) } }` sat at line 668; the base
`.film-frame::before` naming the 657 KB file is at line 726. Same selector, same
specificity, later wins — so the phone override never once applied, for fifteen
days, on the exact rule the comment above it calls "the phone's biggest cost".
Its sibling `.film-scroll` worked only because its base rule happens to be
declared *before* the query. Put narrowing overrides AFTER what they narrow, and
when a stylesheet is 3,500 lines long, check the line numbers rather than the
intent.

**`pointerenter` means "these two now overlap". It does not mean "the visitor
moved here", and when the handler MOVES the element the difference is a feedback
loop.** The ring's hover called `pick()`, which glides the piece to the front —
out from under the cursor — which slides the next piece in, which enters, which
picks. 60 picks in 4.8s with the pointer parked and never moved, `--spin`
climbing 520°/s against a design speed of 13.8. The fix is to ask whether the
POINTER moved: compare the enter's coordinates with where the pointer was at the
last activation, and ignore anything that has not moved. The same trap waits on
any hover handler that animates its own target.

**A test that reports "nothing happened" has to prove it did something first.**
Verifying the fix above, a script picked "the first ring item that is not at the
front", hovered it, re-ran the same scan for a second target and moved there. It
reported "moving to another piece does not re-pick" — twice — and the fix looked
broken. Both scans had returned the SAME screen coordinate: the first hover had
moved that piece away and another had slid into exactly that spot, so the mouse
was told to move to where it already was and no pointer event fired at all. Make
a negative result print its own inputs.

**`aria-modal="true"` is a promise made to assistive tech and to nothing else.**
It hides the rest of the page from a screen reader; it does not stop Tab walking
out of the dialog into the page behind the scrim. Both overlays here did exactly
that until 2026-08-26 — the lightbox on the third Tab, the project sheet on the
seventh. A modal needs the role AND a Tab cycle. And put the role on the element
that CONTAINS THE CONTROLS: the lightbox had `role="dialog"` on `.lb-body`, whose
siblings are the close, previous and next buttons, so a screen-reader user inside
the modal could not reach the button that closes it.

**`aliphcreative.com` injects a Cloudflare Web Analytics beacon into every HTML
response; `workers.dev` does not.** All three pages come back exactly 359 bytes
larger on the custom domain, byte-for-byte identical otherwise, and CSS and JS
match on both. It is a zone setting, not a bad deploy — which means **HTML can
never byte-match between the two hosts**, and the byte-compare in _Running and
deploying_ has to be run per host or on CSS/JS only.

**A line-wrap measured at one viewport height is measured at one point on a
two-dimensional cliff.** The hero lede's orphan was recorded here as "one narrow
band at ~1100px" through two sessions of measuring. Swept over widths AND
heights it is 10 of 35 window sizes, including 1180×1080, 1280×1000, 1280×1080
and 1440×1080. The cause is mixed units: `--cap-h` is `clamp(130px, 16vh, 184px)`
and the copy is measured in em, so a taller window grows the float, shortens more
lines and pushes the copy onto one more. Anything sized in vh beside anything
sized in em needs a grid, not a row.

**A display face can advertise `tnum` and not implement it, and the check most
people run is the one that cannot tell.** Idris Sharp's `font-variant-numeric:
tabular-nums` makes all ten Arabic-Indic digits AND the colon set to exactly
50.4px at 120px — which is one `.notdef` advance, not a tabular figure. The
2026-08-23b round measured that uniformity and wrote it up as proof the feature
worked; the agency's phone rendered the footer clock as six white diamonds
(`7th.png`). **Look at the rendered GLYPH, never at the advance width alone**,
and never put `tnum` on this face.

✅ **Two `font-variant-numeric: tabular-nums` rules SURVIVE in `style.css` and
both are correct — do not rip them out on the strength of the warning above.**
They are on `.lb-cap` (the lightbox counter) and `.panel-count`, which inherit
**Idris Flat**, not Idris Sharp. Flat ships a real `tnum` and implements it; the
lightbox counter was checked visually and renders true Arabic-Indic digits, not
notdef diamonds. The rule is face-specific, not a blanket ban — and a grep for
`tabular-nums` finds these two, which is exactly how a correct rule gets deleted
by someone who has just read a red warning.

**A seam between two shapes can be a gap OR an overlap, and the two want
opposite fixes.** The ring's ten vertical rules were diagnosed as the per-slat
opacity compositing over a 1.2% overlap — which is a real mechanism and was not
what was happening. Sampling a row of pixels settled it in one command: the
lines read **200 against the picture's 115**, i.e. LIGHTER, which only the cream
page can be. **Check the SIGN before choosing a fix**; the overlap explanation
would have had the scale removed, which is the exact opposite of what the
picture needed.

**A 200 and a file on disk is not proof you got the file.** Google Drive answers
a large-file request with an HTML "can't scan for viruses" page — same status
code, real bytes, and the old downloader wrote it out as a `.mp4`. Five of
twelve videos were that page for six days and nobody noticed, because a
directory listing shows twelve files. **Check sizes, not existence.** The same
shape of bug hid a sixth video that produced no file at all and so never
appeared in any list of failures. Anything fetched over a network needs a
plausibility check on what came back.

**A check that fails for EVERY item is more likely broken than the thing it
checks.** All 70 R2 objects reported 403 while being perfectly readable —
`r2.dev` sits behind bot protection and rejects a scripting library's default
User-Agent. It looks exactly like "public access is disabled", and it sent a
round of diagnosis into settings that were already correct. Real failures are
usually partial; send the same headers the real consumer sends, and keep a
known-good probe object to test the checker itself.

**This box's console is cp1252 and it has produced three different false
failures.** It cannot render Arabic at all, and each time the symptom looked
like something else entirely: a `print()` of a Drive filename killed a download
run with a `UnicodeEncodeError` that read as a failed fetch; a folder listing
died mid-parse on a directional-isolate character; and grepping the live site
for Arabic through Git Bash returned empty for every string, which read as "the
copy never deployed" when it had. **Sanitise before printing**
(`.encode("ascii","replace")`), and when checking text that contains Arabic,
read it in Python and test with `in` rather than piping it through the shell.

**Model-generated data is plausible in every local detail and still wrong.** A
70-row table read out of file metadata was retyped from a truncated terminal
view: **47 of the 70 rows came back with invented filenames, dates and ratios**,
all correctly formatted, all fake. Nothing looked wrong on inspection and only a
line-by-line diff against the generator caught it. Never retype generated data —
splice it in with a script that asserts the anchor, asserts the row count, and
re-reads the file to diff it afterwards.

**An overlay can only DARKEN, so check the sign before believing it is still
there.** After the texture moved behind the content, a photograph still diffed
by up to 5/255 across 15% of its pixels against a render with the layer off —
which reads exactly like "the texture is still on top". It was not: a
`multiply` overlay is ~100% negative (the masthead measured exactly that, mean
−12.4), while this was **52% negative / 48% positive, mean −0.006** — symmetric
noise from the compositing change. ⚠️ **Run the control**: two renders with
*identical* settings diffed to exactly 0, which is what proved the noise was
real but not the overlay. A magnitude alone cannot tell you which of two
explanations you are looking at; the distribution can.

**A `Range` rect over display type reports the FONT box, not the ink — and
Idris Sharp's ink runs above its declared ascent.** Measured at 57.6px: the
font-box ascent is 37px while «إعلانات رقمية» inks to 49.3px, so the heading
starts 7.68px *above* its own line box. `Range.getBoundingClientRect()` said it
was 4.5px clear of the rule above it while its ascenders were in fact behind an
opaque cream box at a higher z-index. Use
`canvas.measureText().actualBoundingBoxAscent` whenever a display face looks
clipped; the layout number will tell you it is fine.

**A full-page screenshot without scrolling shows every reveal at opacity 0.**
The about page is a run of `gsap.from()` tweens hung on ScrollTriggers, so a
`fullPage: true` capture of it comes back with real pictures and *empty text
cards* — which reads exactly like "applyI18n failed" or "the copy is missing".
It is not: query the DOM before believing a picture of it, and drive real wheel
events down the whole page before capturing. This cost a round here on
2026-08-23 after the same family of trap had already been written up twice.

**In a `preserve-3d` context, an untransformed ancestor box hit-tests as a plane
at z = 0 — and everything behind it loses its clicks.** The service ring's
`.ring` is `inset: 0` with no background, which does not stop it swallowing
pointer events across the whole stage: the two items on the far side of a
nine-item ring resolved to `.ring` and could not be clicked at all. It never
showed while the far half was faded almost to nothing. `pointer-events: none`
on the container and `auto` on the items is the fix.

**An SVG with a `viewBox` and no `width`/`height` has a ratio but no size.**
`Aliph-Logo-Main-cream.svg` is one. Put it in a shrink-to-fit box and
`width: auto` resolves to **zero** — the footer mark measured a 0×0 box and
simply vanished, with no error anywhere. Either the container carries a
definite width or the image does. This is the same family as the percentage
traps below, and it bites hardest when "tidying" a `width: 100%` that looks
redundant.

**A `var()` naming a token that doesn't exist fails silently.** `font-family` is
inherited, so an undefined custom property makes the element inherit instead of
erroring — every headline quietly renders in the body face. This has happened twice
(`--terra`, then `--display`). If anything looks slightly off-brand, check that every
token resolves before touching anything else.

**A selector with no block swallows the next rule.** Comments are stripped before
parsing, so a dangling selector merges with whatever follows. Check after any CSS
edit — braces and comment markers must balance, and the browser's parsed rule count
must equal the source brace count:

```bash
python -c "import io,re;s=io.open('prototype/style.css',encoding='utf-8').read();t=re.sub(r'/\*.*?\*/','',s,flags=re.S);print(t.count('{'),t.count('}'),s.count('/*'),s.count('*/'))"
```

**A killed GSAP tween is still truthy, and `resume()` will not revive it.** Always
null the handle when killing, or a "paused" check resumes a corpse and the animation
never restarts.

**A percentage does not always resolve against the box you think.** This has now
cost time three separate ways in one section, so treat any percentage near a
padded or grid-sized box as suspect until measured:

- `padding-inline` resolves against the **parent's** width; a flex item's
  `flex-basis` resolves against the **content box** that padding just shrank.
  Using one variable for both gave a third of a third (125px in a 1188px track).
- `height: 100%` and `max-height: 100%` **do not resolve at all** against an
  auto-sized grid row. The browser falls back to the intrinsic ratio and sizes
  from the width — a 0.279-ratio glyph became 654px tall in a 447px tile. Give
  the row a definite size (`minmax(0, 1fr)`) or cap with `max-*` and no
  percentage.
- A `clamp()` floor is what applies on a phone, not its vw term. At this 150%
  root, `clamp(1.7rem, …)` is 40.8px at 390px wide.

**Floats are gone from the why section** (2026-08-11). The lessons they cost are
worth keeping if floats ever come back: a float excludes text with its **margin**
box, so a bottom margin squeezes any line that clips it (a 28px margin made the
line under a picture 35% wide); and a float only wraps text that comes *after* it
in the flow, so no margin can put a line *above* one — only markup order can.

**`behavior: "auto"` on a scroll method means "defer to CSS `scroll-behavior`",
not "jump".** On a container that sets `scroll-behavior: smooth`, an "auto" call
animates — which silently defeated the reduced-motion branch of the carousel.
`"instant"` is the one that jumps.

**`scrollLeft` is negative under RTL** and its origin differs between engines.
Measure centre-to-centre with `getBoundingClientRect` and move with `scrollBy`,
which takes a visual delta and needs no direction flip.

**Anything that names or counts the services must derive it from `SERVICES`.** Typed
copies have now survived two taxonomy changes and gone stale both times: the chatbot
prompt said "four services" and its off-scope reply recited the pre-August four for
weeks. The brand stamp is still wrong for the same reason (see open questions).

**`order` is ignored for explicitly-placed grid items.** If a mobile query collapses
a grid, it must reset `grid-row` as well as `grid-column`, or the children stack on
top of each other. The gallery wall places all twelve tiles explicitly, so its
phone rule restates both axes **and** the container's aspect.

**You cannot measure "is this box full" with `getBoundingClientRect()`.** A stretched
`<p>` is always exactly as tall as its row. Use the inked extent:
`document.createRange().selectNodeContents(el).getBoundingClientRect()`.

**Measure after `document.fonts.ready`.** The webfonts land after first paint
and every number moves until they do. (503 KB of WOFF2 since 2026-08-26, down
from 3.9 MB of OTF — faster, and still after first paint.)

**Every scripted edit must assert its anchor.** `str.replace` on a miss is a no-op
that looks like success. This has silently lost real edits.

**`film.webp` is RGBA and the alpha is load-bearing** — ~7% of it is transparent,
the sprocket holes the page shows through. It must say `RGBA`.
⚠️ **Check the MODE, never the file size.** The old rule of thumb — "near 145 KB
means the alpha is gone" — was calibrated on a 795 KB scan and is now simply
wrong: the current tile is a flat synthetic base with its edge printing removed,
so it compresses to ~150 KB with its alpha perfectly intact. A size heuristic
that outlives the file it was measured on turns into a false alarm.
`cut_film_scan.py` asserts `mode == "RGBA"` and a plausible transparent
fraction instead, which is what actually matters.

**🔴 The Browser pane reports `document.visibilityState === "hidden"`, so it never
runs a frame.** `requestAnimationFrame` never fires, CSS transitions sit frozen at
`currentTime: 0`, and smooth scrolling does not move. Anything time-based reads as
broken there when it is fine — a `.is-current` class was correctly applied while
the computed opacity stayed at the un-transitioned value, which looks exactly like
a cascade bug. It is still good for **layout** measurement (rects, computed
styles, the CSSOM); it cannot verify motion.

**Use Playwright for anything animated, and for screenshots.** Neither the
`playwright` npm package nor the `chrome` channel is installed, but the browser
builds are cached and `playwright-core` is in the npx cache, so drive it directly:

```bash
node -e "const {chromium}=require(process.env.LOCALAPPDATA+'/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core');chromium.launch({executablePath:process.env.LOCALAPPDATA+'/ms-playwright/chromium-1234/chrome-win64/chrome.exe'})"
```

The `executablePath` override is required — `playwright-core` asks for a build
number the cache does not have and tells you to run `npx playwright install`,
which is not necessary. Scroll with real wheel events before measuring anything
ScrollTrigger drives: a `gsap.from()` sits at opacity 0 until its trigger fires.

⚠️ **Two test techniques that produce false failures here**, both of which cost a
round of debugging:

- `document.elementFromPoint` takes **viewport** coordinates. The gallery wall is
  taller than the viewport, so sampling its cells reported all 144 uncovered.
  Verify tiling geometrically from rects instead.
- A synthetic **mouse** drag does not scroll an overflow container — browsers only
  drag-to-scroll for touch. A "swipe" test built on `mouse.down/move/up` scrolls
  nothing and reads as a broken carousel. Drive `scrollBy` instead; it exercises
  the same scroll → handler path.

**A stray terracotta rectangle on the page is the focus ring**, not a bug —
`:focus-visible { outline: 2px solid var(--accent) }`. It appears around whatever last
took keyboard focus and has been mistaken for a stray border.

---

## The home page

**Hero** — a film strip loops behind a cream panel. `filmLoop` in `main.js` travels
exactly one period at 34 px/s and repeats, so the restart is pixel-identical. The
film tile's aspect divided by 4 is the frame-slot constant in `style.css`
(**`0.611967`** since the 2026-08-16 DaVinci cut); re-cut the tile and that number
must change with it — `cut_film_scan.py` prints the value. The strip pauses off
screen. **It has been blamed for four bugs and caused none of them** — check the
callers first.

🔴 **Measure the thing itself, not a proxy that happens to correlate.** This has
now cost time three times on this one file:

- `recut_film.py` scored perforations on *luminance*, which drops alpha and lets
  the bright rim around each hole count as its own run. It found **43 holes where
  the tile had 21**, halved the pitch, and graded the seam against a rhythm that
  did not exist — two scripts were tuned against that phantom and both looked
  like they were working. A hole *is* the transparency, so **alpha is the only
  ground truth**, and both cutters read it now.
- The 2026-08-16 cut then spent two rounds "levelling a lighting gradient" that
  was never there. The interior profile is flat to within 5%; the 10% step at the
  seam was **scan margin bleeding into the tile edges**, because the base-box
  threshold was loose enough to include a soft ~30px ramp. No amount of
  gradient-fitting can fix an edge artefact. Inspect the profile before fitting a
  correction to it.
- 2026-08-17: the coverage threshold that *finds* the perforation bands was
  also used to *delimit* them, and a hole's rounded corners fall below it — so
  ten rows of bright hole-edge stayed outside the band and were tiled across
  both margins by the edge-print rebuild. **A threshold tuned to identify a
  feature is by construction too strict to describe its extent.** See _Session
  2026-08-17_. `cut_film_scan.py` now grows each band to where the signal dies
  and asserts the margins hold no hole pixels.

The headline's أ (and Latin A) are photographed paper scraps that re-cut themselves
every second or so. `splitSafe()` refuses to split a word where Arabic shaping would
break it. Only the two verbs نبدأ and تبدأ.

**لماذا ألِف؟** — three blocks. Block 1 is still the editorial layout from the
user's annotated wireframe, deliberately unanimated. **Blocks 2 and 3 were
replaced on 2026-08-11** at the agency's request and no longer follow the
wireframe at all — see the two sections below.

Block 1's type size is **solved, not chosen** — the size that fills its own box:

```bash
python resources/fit_columns.py ar
```

⚠️ **It now has one column to fit, not four.** Blocks 2 and 3 lost their copy, so
`--wb2-body`, the rail size and both wb3 column sizes are gone. `--why-type` on
`.why` is still the single lever for the language difference (English runs longer;
text area grows with the *square* of the size, so a 1.37× overflow takes a 0.85
scale).

### Block 2 — the reel carousel (2026-08-11)

Vertical media at 9:16, the playing item centred and its neighbours faded either
side. No copy. `--reel-w` is the centre slide's share of the track: **33.5%
desktop** ("a third-ish"), 52% under 900px, **78% on a phone**, where the media
being big is the point and the flanks are cut to a sliver rather than dropped.

⚠️ **It is a scroll-snap scroller, not a transform rail, and that is deliberate.**
Arabic is the primary direction; a hand-rolled `translateX` carousel needs a sign
flip in every calculation, and a scroller inverts itself and brings native swipe.
`reelShow` in `main.js` reads which slide is centred and drives the arrows — it
never owns the position.

**It loops (2026-08-11).** `main.js` clones the slide set either side of the real
one at runtime — **8 slides in the HTML, 24 in the DOM** — and the carousel lives
in the middle set. That is what puts a neighbour on both sides of *every* slide
including the first and last, and what lets "next" past the end carry on in the
same direction instead of rewinding the track. On settle (140ms after the last
scroll event, and never while a finger is down) `recentre()` jumps instantly to
the equivalent slide in the middle set; the jump is invisible because both clones
show the same picture at the same offset. Verified: forward and back both cycle
0→7→0 with **three slides visible at every step**, and each image is still
requested **once** — the browser dedupes the clones by URL.

⚠️ **Prepending the leading clone set shifts an RTL scroller under you.** The
browser's scroll anchoring adjusts `scrollLeft` *after* the insert, so a centre
computed in the same tick lands one slide out — measured, the carousel opened on
slide 7 of 8. Two things fix it and both are load-bearing: the track sets
`overflow-anchor: none`, and the home position is asserted again inside a
`requestAnimationFrame`, after the adjustment has happened.

⚠️ **`go()` re-homes BEFORE it steps, and that is not belt-and-braces either.**
Recentring only on settle is not enough: anyone clicking faster than the 140ms
settle never lets it fire, and the index walks straight out of the middle set —
measured, sixteen fast clicks reached slide 23 of 24 and opened a **319px hole**
where the track runs out of slides. That is the blank flank in the 2026-08-11
screen recording.

⚠️ And `recentre()` **translates** by the distance between two equivalent slides
rather than re-centring the target. They are the same thing only at rest, and it
now fires mid-flight: re-centring would snap a running animation to a stop, where
a translation preserves the exact visual offset and stays invisible.

Three things about it are easy to get wrong, all measured, and all three are
written up once in _Things that will bite you_ rather than twice here — the
percentage-base trap, `scrollLeft` under RTL, and `behavior: "auto"` not
meaning "instant". How this carousel settles them:

- the slide is `flex: 0 0 100%`, because the track's `padding-inline` has
  already made the content box exactly one slide wide
- everything is measured **centre-to-centre** with `getBoundingClientRect` and
  moved with `scrollBy`, so nothing needs a direction flip. ⚠️ Centres, not
  edges: a flank sits at `scale(0.94)` and the centred slide at `scale(1)`, so
  their edges differ by 3% of a slide width even when perfectly co-located,
  while a uniform scale leaves the centre exactly where it was
- the reduced-motion branch passes `"instant"`

Autoplay is a self-resetting timeout, not an interval, so every scroll re-arms it
and it cannot yank itself forward out of a swipe someone is mid-way through. It
holds on hover (bound only for `(hover: hover)` — on touch, `pointerenter` fires
once and `pointerleave` never does, which would stop it for good) and stops off
screen, same rule as the film strip.

### Block 3 — the gallery wall (2026-08-11, re-hung dark 2026-08-12)

Photographs and the agency's own marks hung tight — 7px gaps. Twelve tiles cover
a **12×12** field exactly on desktop and a **6×11** field on a phone; verified
programmatically at **0 holes, 0 overlaps**.

⚠️ **ONE treatment now, and it is the ink plate.** The three frames (cream
mount, darkroom print, ink plate) were offered side by side as a comparison and
the agency chose unified dark on 2026-08-12. Two knock-ons that are easy to
miss if this is ever re-styled:

- **The three marks point at `-cream` artwork**, not the ink files the rest of
  the site uses. Ink on an ink plate is invisible. All three ship as a
  `-cream` / ink pair, so this is real assets rather than a CSS `invert()`.
- The mixed hang is in git history if it is ever wanted back.

**Hover lifts the whole tile, not the picture.** `translateY(-10px)
scale(1.02)` plus a cast shadow and `z-index: 3` — the gesture is taking a
print down off the wall, not zooming a photograph inside a frame that stays
put. ⚠️ This is the one shadow on the wall, and the rest state is still flat:
across a 7px grid a shadow has nowhere to fall until something lifts, which is
why the shadow arrives *with* the transform.

⚠️ An earlier pass zoomed the image inside the tile instead, which needed a
`.gw-win` wrapper because `overflow: hidden` clips at the **padding** box — so
a picture scaled on the tile itself rides up over its own mount. That wrapper
is gone with the zoom. If an inner zoom ever comes back, the wrapper has to
come back with it.

Touch has no hover, so `main.js` toggles `.is-lifted` on tap, one tile at a
time — a `:hover` left ungated on a phone latches and stays.

⚠️ **Cells are square by construction and every tile's shape depends on it:**
equal column and row counts, one gap value both ways, and `aspect-ratio: 1` on the
container. A tile spanning 6×4 is therefore 3:2 with no arithmetic anywhere.
Break any one of those three — change the row count without the aspect, or set a
row gap that differs from the column gap — and every tile on the wall re-crops at
once. The phone rule restates **both axes and the aspect** for that reason.

The tiles are explicitly placed, so `order` is ignored and a half-reset stacks all
twelve in the first cell. Three frame treatments — `gw-mat` (mount board),
`gw-print` (darkroom margin, deeper at the foot), `gw-plate` (ink) — deliberately
unlike the about page's `.clip`, which is a shadowed cutting pinned at an angle.
Nothing here is rotated or shadowed: a wall is hung flat, and a shadow needs a gap
to fall into that this grid does not have.

⚠️ **No graphic-design work on the wall.** Those are finished 4:5 layouts with
type baked in and every tile crops. The three marks are the brand instead.

⚠️ **The three marks sit apart on purpose.** They were first written into columns
11-12, one under another — which under RTL is the entire left edge — so the
agency's own marks read as a sidebar bolted to one side. They now run a diagonal:
أ top-right, the stamp through the middle, the wordmark bottom-left, on three
different rows *and* three different columns. The phone field had the same fault
(all three in the last band) and got the same treatment. Keep them separated if
this is ever re-tiled.

They are **ink artwork on a light `--cream-warm` field, with no frame** — the
photographs are matted and ruled, the marks are not. `--cream-warm` rather than
the page cream because, with no border, a tile in the page's own colour would
have no edge where the wall meets the margin, and two of the three sit on the
wall's outer corners.

⚠️ **`HalfAliph-Stamp.svg` is new (2026-08-11).** The stamp shipped only in cream,
which is invisible on a light field; the ink version is the same artwork with its
single `#D9D9CE` fill swapped to `#101820`, the way the other marks already ship
as a `-cream` / ink pair. No pixel invented.

⚠️ **A mark is capped with `max-width`/`max-height`, never `width/height: 100%` +
`object-fit`.** A percentage height does not resolve against an auto-sized grid
row, so the browser fell back to the intrinsic ratio and sized from the width —
the أ came out **654px tall in a 447px tile** and had its stem cut off by the
tile's own `overflow: hidden`. The inner grid declares `minmax(0, 1fr)` tracks so
there is a definite height to resolve against.

**ماذا نفعل؟** — three service names on one line, sized by `fitPicks()` to fill the
column exactly. Not a fixed vw: the strings differ too much between languages. Below
the names, a subcategory switcher with one media slot.

### The phone edit of لماذا ألِف؟ (≤640px, added 2026-08-10)

A **separate breakpoint from the 900px one**, which also catches tablets and small
laptop windows. Don't merge them: at tablet width the section still reads as a sheet.

**`data-kind` drives `aspect-ratio`, everywhere, and it is the only place a media
ratio is declared** — `reel` 9/16, `video` 16/9, `poster` 4/5, `still` 3/2, all from
the measured Drive numbers. Before this, every holder wore the ratio its *grid cell*
wanted (1/1 and 7/6 for design work, 9/13 for a reel) rather than the shape of the
thing inside it. **Ratio belongs to the medium; if a layout needs a different box,
change the layout.**

⚠️ **`max-height: 78vh` had to go with it.** A cap and an `aspect-ratio` cannot both
be honoured and the cap wins silently: 78vh is 520px on a 667px phone, while a
full-width 9:16 reel needs 581px. It was re-cropping the exact media the ratios
exist to protect, on the smallest screens.

⚠️ The gallery wall is the **one place that deliberately does not use `data-kind`**.
Its tiles crop to their cells by design, so they are not holders.

**What is left of the phone edit.** Blocks 2 and 3 were rebuilt on 2026-08-11 and
most of this breakpoint went with them — the rules that hid `.wb2-m2`, `.wb2-rail`
and eight of block 3's paragraphs are gone because none of those elements exist.
What remains is block 1's reorder (`.wb1-side` becomes `display: contents` so the
picture can be ordered *between* the title and the paragraph, which is impossible
while they share a wrapper), plus the carousel's `--reel-w: 78%` and the wall's
6-column re-hang.

Measured at 375px across the three edits: the section went **4,493 → 2,509
(2026-08-10) → 2,131px**, and the page **7,701 → 5,717 → 5,236px**. Verified at
360, 375 and 390 wide, in both languages.

---

## Chatbot — stage 2 of 5

`aliph-chatbot-plan.md` governs (it supersedes `aliph-chatbot-spec.md`).

Built: the widget (`prototype/chat/`) and the Worker (`chat-worker/`, 67 tests,
`npm test`, no key or network needed). **They are not connected** — `CONFIG.endpoint`
and `CONFIG.health` are `null`, so the widget shows its contact card. That is correct,
not broken. Load any page with `?chat=up` to review the chat surface.

**Stage 3 is the next real work** and is blocked only on the model key:

```bash
cd chat-worker && npx.cmd wrangler secret put GEMINI_API_KEY
```

The key must never go in the repo, a file, or chat. `wrangler.toml [vars]` is
committed plaintext — secrets are a different mechanism. Where the key comes from
decides the SDK: AI Studio issues a plain key; Vertex needs a different client.
Then flip `ALLOW_STUB` to `"0"` and set the two widget constants.

**Resolved 2026-08-09: it is an AI Studio plain key**, from the user's existing
default Gemini project — so `respond()` needs one `fetch` to
`generativelanguage.googleapis.com`, no service account and no OAuth minting.
⚠️ **That project is on a PERSONAL Google account, not the studio's.** The key is
only ever a Worker secret, so re-issuing it under `Ceo@aliphcreative.com` is one
command and zero code changes — but it is a **launch gate**, not a nice-to-have:
on a personal key, the studio's assistant dies whenever that account revokes it,
hits quota or changes hands. The studio's Cloud console blocked key creation in
"My First Project" (`serviceusage.services.list` missing, most likely a
multi-login mismatch); creating a *fresh* project is the way around it, and if
`Ceo@` turns out to be Google Workspace, a domain admin can have AI Studio
switched off entirely.

### Three stage-3 landmines cleared ahead of the wiring (2026-08-09)

All three were dead text at stage 2 and become live faults the moment a real
model and a real visitor are on the other end. 67/67 still pass.

1. 🔴 **`SYSTEM_PROMPT` said "four services" three times** while `serviceBlock`,
   which is generated from `SERVICES`, correctly listed three — the generated
   half survived the session-9 taxonomy change and the prose around it did not.
   This is the model's actual instruction at stage 3: it was telling the
   assistant to miscount the studio's own services.
2. 🔴 **`model.js`'s `offScope` reply still recited the pre-2026-08 four** —
   الهويّات البصريّة / التسويق والمحتوى / الفعاليّات / التقنية. It is the one line a
   visitor gets when the bot does *not* recognise their idea, i.e. the worst
   place on the site to name services that no longer exist.
3. 🔴 **`ALLOWED_ORIGINS` was localhost-only.** `src/cors.js` matches origins
   **exactly** — scheme, host, port, no suffix matching. Setting
   `CONFIG.endpoint` without the live origin present would have failed every
   visitor's request in CORS, and the widget's own fallback makes that look
   identical to "the chatbot doesn't work". `https://aliphcreative.ceo-6c6.workers.dev`
   is now listed; ⚠️ **a custom domain will need adding separately.**

⚠️ **Both counts and both name lists are now DERIVED from `SERVICES`**
(`prompt.js` `count`, `model.js` `COVERED`) rather than typed, because this is
the second taxonomy change these strings have failed to survive. Don't retype
them. `PROMPT_VERSION` is bumped to `2026-08-09.1` — the prompt is versioned
separately on purpose (spec §8), so bump it whenever its text moves.

Two contracts not to break: `ok` and `quotaRemaining` in the health response are read
by those exact names, and the guardrail bans are curated phrase lists on purpose —
a regex for "we can" also swallows the one sentence the bot exists to say.

---

## Answered by the agency, 2026-08-10

| question | answer |
|---|---|
| Name | **Aliph Creative Agency**, not a studio |
| Founding year "2024" in the about copy | **Deleted.** `بدأ سنة ٢٠٢٤ بفكرة واحدة` → `بدأت بفكرة واحدة` |
| "منذ ٢٠٢٤ / Since 2024" in the hero furniture | **Kept for now** — note this contradicts the line above; they know |
| Location, "from the Mount of Olives" | **Real, keep** |
| Sensitive folders — Agreements, official visits, Queen retreat, students | **Cleared to publish**, clients agreed. All 63 images are in |
| Project list for the work page | **Deferred.** Display first, organise later |
| Socials | Real URLs wired on all three pages; **BEHANCE was a placeholder and is gone** |
| Chatbot | **Hidden**, all three pages. Commented, not deleted |

⚠️ **The reel is not optional.** It was swapped for a still because the caption
said "ملصق" and R2 was unsolved; that was wrong and was reverted. The video is
the content and the caption is what needs fixing. Do not make that trade again.
**Still true after 2026-08-11** — the carousel is built for vertical video and is
carrying portrait photographs only until the reels are on R2.

## Asked by the agency, 2026-08-11

| ask | done |
|---|---|
| Contact numbers in the footer were wrong | **Fixed on all three pages.** The phone and the WhatsApp are different numbers and one row labelled `هاتف / واتساب` carried only the phone. Now two rows, `tel:` and `wa.me`, from the values `chat/aliph-chat.js` has had since 2026-08-06 |
| Remove the ألِف stamp from the footer | **Removed**, all three pages, plus its CSS and the `spin` keyframes it was the only user of |
| Block 2 → a slideshow of vertical media at reel ratio, current centred, neighbours faded, "3rd-ish", no description | **Built.** See _Block 2 — the reel carousel_ |
| Block 3 → a calm gallery wall, photos + our own marks, tight spacing, no descriptions, framed unlike the about page | **Built.** See _Block 3 — the gallery wall_ |
| Phone: socials on one line, keep the font size, tighten the dot spacing | **One line at 360/375/390.** ⚠️ See the note below — the dot spacing alone was not enough |

⚠️ **The socials needed more than the dot spacing, and the trade is worth
confirming.** At the current size the three names measure 389.5px inside a 327px
column: 73px of that is `.latin`'s `letter-spacing: 0.18em` against only 33px of
dot margin, so zeroing the margins still overflows. The **font size is
unchanged**; the phone rule cuts tracking to `0.03em` and the dot margin to
0.14rem, landing at 304.3px. If the agency would rather keep the wide tracking,
the alternative is a smaller font — it cannot be neither.

## Asked by the agency, 2026-08-12

| ask | done |
|---|---|
| Phone: centre everything on the home page and the nav, **except** the hero and the footer | **Done** in the ≤640px block. Titles, copy, both ways out, and the switcher column. The hero panel stays ragged on purpose — it is a masthead with a dropcap floated into its lede, and centring strands the float |
| Language pill a little smaller on phone; move it to the nav menu's top left | **Done.** Only `.ls-opt`'s type shrinks (14.9 → 13.0px), so the 3px frame and the knob geometry are untouched. ⚠️ The pill had to **move in the markup** — see below |
| Hero meta: centre it on phone, break into two lines, drop the joining dot; bigger and bold everywhere | **Done.** 18.2 → 20.2px, weight 500 → 700, two centred rows at ≤640px |
| Unify the gallery wall's frames — dark or light? | **Compared, then built dark.** See _Block 3_ |
| Zoom on hover in block 3 | **Built as a lift**, not an inner zoom — the whole framed box rises with a shadow behind it |
| Replace the boxed hand-drawn arrow with a plain `>`, no square | **Done, on both pairs** — the carousel's and the service switcher's. They were the same control drawn twice |
| Kill the blue selection flash on buttons/images/chrome, keep it on text, tint it terracotta | **Done.** `::selection` is terracotta at 0.28 alpha; `user-select: none` on chrome only; `-webkit-tap-highlight-color: transparent` for the mobile equivalent |
| Move the outro button down on phone — it was stuck to the text | **Done**, 1.6rem above it |
| Upload all the Drive media to R2 and fill the work page — media only, no titles, dated from metadata | **Done.** See the banner and _The work page_ |

⚠️ **The nav language pill needed a markup move, not a CSS rule.** It lived
inside `.nav-foot`, which is `position: relative` — so an absolutely positioned
pill measured its `top` from the **footer row**, not the overlay, and landed
763px down a 800px screen with `top: 48px` computed exactly as written. It is a
direct child of `.nav-overlay` on all three pages now. Its centre line matches
the burger's to the pixel (both 48.4px), so the pill inverts in place when the
menu opens instead of jumping.

⚠️ **The switcher arrows are cream with a drop shadow; the carousel's are ink.**
Not an inconsistency — `.sw-arrow` sits **on** the picture, and the cream box
that used to guarantee its contrast is gone with the redesign. A cream mark
over a dark cast is the one combination that survives both a bright frame and a
dark one. The carousel's sit at the track edges over faded flanks, where ink
reads.

## Asked by the agency, 2026-08-16

| ask | done |
|---|---|
| Re-download the videos that failed, upload them, put them on the site | **All six in.** Five recovered past Google's scan interstitial; `الف للتوكتوك` was a dead Drive file the agency fetched by hand. See _The six recovered films_ |
| A task list for moving the media to a custom domain | **Written** — see _Moving media to a custom domain_ |
| A lightbox on every image and video, except the ماذا نفعل؟ switcher | **Built.** See _The lightbox_ |
| Bring Software Development back on the work page, with a profile view per item | **Restored**, rendering from `PROJECTS` into the existing profile sheet. ⚠️ Its content is still placeholder |
| The button animation visibly cuts off the text — make it horizontal | **Done.** The vertical mask was the cause, not the timing — see _Two animation fixes_ |
| Crumpled paper texture: on the hero area, inside the big titles only, and a whole-site version to judge | **Done**, from the agency's own scan, three separate crops. Whole-site version is at `?paper=1` |
| The nav animates open but not closed | **Fixed.** The exit tween existed and was running on an invisible element |

⚠️ **The agency supplied the paper scan after three procedural attempts were
rejected.** Recorded because the instinct to generate a texture will come back:
don't. It is in `resources/` now.

## Session 2026-08-16 (second round)

### The boss's copy doc — the site's text is real now

Source: a Google Doc titled «نص موقع الف». ⚠️ **It exports without auth** —
`https://docs.google.com/document/d/<ID>/export?format=txt` returns the whole
thing as UTF-8. `WebFetch` on the `/edit` URL returns the SPA shell and reads
as an empty document; don't conclude the doc is unreadable from that.

What moved: the hero paragraph, `w1Title` + a three-paragraph `w1ParaA/B/C`,
`w2Title` («نقاطٌ بحثنا عنها، وأعمالٌ بنيناها منها.»), and the `desc` of all six
subcategories. All of it replaced invented prototype copy.

⚠️ **Three doc typos were corrected, not transcribed** — flag them if the doc
is ever re-imported: `مساعتدكم` → `مساعدتكم` (hero), `بالية يخدم` → `بما يخدم`
(فيديو أفقي), and a doubled comma in the stills paragraph.

⚠️ **The doc heads the stills paragraph «صناعة المحتوى»**, which is the SERVICE
name, not a subcategory. Its three items map one-to-one onto the three photo
subcategories and that paragraph is entirely about stills, so it was read as
the stills copy. Worth confirming.

**Still outstanding from the doc:** the about page instruction — «بلزمش نرجع
نكرر خدماتنا» — i.e. من نحن؟ should keep only the intro paragraph and stop
repeating the services. That is a structural change to `about.html` and has
not been made. The برمجيات block was skipped at the agency's request.

### The third service was renamed — and this time the id did NOT move

`تطوير برمجيات` → **`حلول تقنية وبرمجية`** / `Software Development` →
**`Tech & Software Solutions`**. Third rename, third time only labels moved.
All six live copies plus the `SERVICES[].tag` were updated together, and
`chat-worker`'s 67 tests still pass — because both the count and the name list
are DERIVED from `SERVICES` rather than typed.

### The oval button's clipping was the mask, not the axis

The 2026-08-16 vertical→horizontal fix changed which edge cut the label; it did
not stop the cutting. `.oval-swap` was `width: max-content`, so the mask was
sized to the LABEL — 113.7px centred in a 404.7px ellipse — putting a hard cut
line **145.5px inside the rim** with empty oval either side. The mask spans the
whole button now (bled out over its padding so the cut lands on the rim), and
both faces fade as they travel, which stops label length in either language
from ever reintroducing a slice.

⚠️ **The rest-state measurement said nothing.** Mask and label measured exactly
equal at rest; the defect only exists mid-transition. A complaint about an
animation cannot be checked in a static state.

### Block 1 needed a SECOND language lever

`--why-type` scales the body. It does not scale the title, and block 1's column
is exactly as tall as the picture beside it — so title and body share one
height budget and a longer title steals the body's room rather than overflowing
on its own. «نبدأ بالسؤال، لا بالإجابة» sets in two lines; "We begin with the
question, not the answer." sets in **five**, and the body solved at **10px**.
`--why-title-type` (1 for Arabic, 0.62 for English) is the fix.

⚠️ **`fit_columns.py` was stale and would have thrown before solving anything**
— `AREAS` still listed `.wb2-flow`, `.wb2-rail` and both `.wb3` columns, which
stopped existing on 2026-08-11. It fits the one remaining column now and takes
`PORT` from the environment.

### The carousel jitter is NOT the wrap — and the first probe fabricated a bug

🔴 **Read this before chasing it again.** Measured on the current code: the
wrap moves the picture **0.25px**, steps are monotone with **zero overshoot**,
there is **no drift at rest**, and there are **no long frames even at 6× CPU
throttle**. The geometry is not the problem.

⚠️ **A first probe reported a 7.5px visible jump and was wrong.** It compared
the `left` edge of the centred slide before and after the wrap — but across a
wrap that is two DIFFERENT elements, mid-way through opposite `scale(0.94)`
transitions, so their edges differ by ~3% of a slide width even when perfectly
co-located. The tell was that the number came out **identical on the broken and
the fixed code**. Measuring centres instead — invariant under a uniform scale
about its own origin — gives 0.25px either way. A fix had already been written
for a defect that never existed.

`recentre()` does now measure centres rather than edges. That is a genuine
latent-correctness fix — the old delta was ~4.6px wrong and only survived
because mandatory scroll-snap absorbed it inside the same frame — but **it is
not the jitter fix and must not be described as one.**

**The open lead is texture memory.** The track holds **41 megapixels of decoded
image**: eight 1600px photographs shown at ~304px wide, tripled by the loop
clones. Reported on a Galaxy A54 (Mali-G68) in Brave. This is the same failure
the film strip already hit once — "a browser decodes an image at its intrinsic
size however small it is drawn" — and the answer there was a phone-sized
derivative. Not yet done.

### The film strip is the agency's DaVinci scan now

`resources/cut_film_scan.py` turns the scan into the tile. It is a different
job from `recut_film.py` (which re-cuts an existing tile) and the difference
that matters is that the scan's sprocket holes are **white pixels**, where the
page needs transparency so the cream shows through.

**Tile: 5400×2391 → 5400×2206 RGBA, 18 pitches, 6.8% transparent.**
⚠️ **The frame-slot constant moved 0.826630 → 0.611967** and lives in two
places in `style.css`. The new scan is proportionally taller than the old one,
so the frames come out squarer than the old landscape 3:2. That is what the
asset gives; `FILM_FRAMES` is fixed at four entries and `SERVICE_FRAMES`
indexes into it, so frames-per-tile cannot be changed to compensate.

⚠️ **`film.webp` is ~150 KB now and the alpha is FINE.** The old "near 145 KB
means the alpha is gone" rule was calibrated on the previous 795 KB tile; this
one is a flat synthetic base with the edge text removed, so it compresses far
harder. Check `mode == RGBA` and the transparent fraction, not the file size.

Three things the script does that are not obvious:

- ⚠️ **It paints out "KODAK T-MAX 400".** Not tidiness — the edge printing does
  **not** repeat on a regular period (measured gaps of 2479 and 2590 px), so no
  cut width can ever make it join and the seam lands mid-word whatever the
  perforations do. It is also a third-party trademark across a commercial
  hero. The bands are rebuilt from the longest text-free stretch of the same
  band, so the replacement is the scan's own base and grain.
- ⚠️ **The base box is found strictly, then inset 90px.** The scan's edges are
  soft and carry a dark rim ~50px inside the ramp. A loose threshold left that
  rim in the tile and the repeat showed a **10% tonal step** — which looks
  exactly like a lighting gradient across the scan. It is not: the interior
  profile is flat to within 5%. Two rounds of gradient-fitting were spent on a
  gradient that did not exist before the edge was measured.
- ⚠️ **It regenerates `film-grain.webp` too, and that is not optional.** The
  grain is a high-pass of the film scan itself — the same grain as the
  surrounding base, not a generic overlay — and it is positioned by the
  frame-slot constant. Left over from the previous scan it is grain from a
  different piece of film placed by the new constant, and the two disagree.
  Both `-m` variants are regenerated with it. ✅ Done for this cut.
- The residual tilt is levelled with a **polynomial fit, not a wrapped blur**.
  Wrapping treats the tile's two ends as neighbours and averages them, so the
  fitted profile is already continuous across the join and dividing by it
  removes nothing — the step came back 10.1% → 10.7%. Now −1.8%, asserted.

### The emulsion wash — one layer over the strip AND its frames

`.film-scroll::after`, `soft-light` at 0.92, **masked by `film.webp`'s own
alpha at the same size and phase as the background**. That mask is the whole
trick: the wash stops dead at every sprocket hole and at both long edges
instead of laying a rectangle of colour over the cream.

⚠️ **`background-size` is now declared twice** — once for the film, once for
the mask. Change one without the other and the wash drifts out of register.
`.film-scroll` also sets `isolation: isolate`, or the blend would act on the
cream page seen through the holes.

⚠️ **`.hero-overlay` had to give up its clicks.** It spans the whole hero at
z-index 4, so the empty half beside the panel sat on top of the film and
swallowed every click meant for a frame — `elementFromPoint` over a frame
returned `.hero-overlay`. It is `pointer-events: none` with
`.hero-overlay > * { pointer-events: auto }`, so the panel keeps its own.

`.film-frame` is in the lightbox's `OPENS` list now, and `.film-group` in
`GROUPS`: a frame opens like any other media, and the wash does not follow it
out — which is the point, the work is seen in its own colours.

### The hero's crumple is gone

`.hero-panel::before` removed at the agency's request. `paper-panel.webp` is
still on disk and still cut by `cut_paper.py`. ⚠️ **`.hero-panel::after` is the
linen and must stay** — it is the only thing stopping the panel reading as a
flat cream block.

### The linen, the scroll gap, and the footer mark

**The linen is 0.28 / 620px** (was 0.16 / 900px). Two knobs and they are not
interchangeable: opacity is how deep the weave sits into the cream, tile size
is how close it is, and a tighter tile reads stronger at the same opacity
because more thread edges land per centimetre. Lifting opacity alone would
have muddied the ink instead of showing the weave. Five alternatives were
rendered side by side at 3× on plain cream; the agency has the sheet.

🔴 **The scroll "gap in the texture" was `position: fixed; inset: 0`.** A fixed
element is sized to the LAYOUT viewport, and on Android that does not grow when
the URL bar retracts — so scrolling with a finger down exposes a band at the
bottom the linen never covers, and because the texture stops at a horizontal
line it reads as a seam in the paper. It is overscanned now (`top: -8vh`,
`height: calc(100lvh + 16vh)`). ⚠️ Do not tidy it back to `inset: 0`.

⚠️ **The layer moved behind the content on 2026-08-17** and its blend went from
`mix-blend-mode` to `background-blend-mode` with it — see _Session 2026-08-17_
for why those two are one change. `?flat=1` still exists but no longer proves
anything: there is no backdrop read left for it to remove.

**The footer mark is back** — the wordmark, in the 562px of empty ink the
spinning stamp left between the clock and the socials, as the third child of a
`space-between` column. ⚠️ Not `Aliph-Icon-cream.svg`, which looks like the
obvious "short" mark and is a 68×244 letterform: capped to 54px wide it came
out **194px tall** and grew the phone footer by more than it saved. Both axes
are capped now. `HalfAliph-Stamp` would fit but is the mark the agency asked to
remove from this footer on 2026-08-11.

### The about page stopped repeating the services

At the boss's instruction. Three `.asvc` articles, ~1300px each on a phone —
**3,934px of a 9,187px page**, all placeholder media and prototype copy.
The page is **5,051px now, 10.9 phone screens → 6.0**.
`renderServiceSections()` and `SERVICES[].what/why/does` are still in `main.js`,
unused and marked; ⚠️ that copy was never approved, so do not wire it back up
without replacing it first.

### Inline previews — built, tested, and deliberately unwired

A short, muted, looping piece of a film plays inside its own tile; clicking
opens the lightbox and **carries on from the frame the preview was showing**.
`previews` in `main.js`, with `.preview` styling in `style.css`.

🔴 **THE FILMS ARE NOT CHOSEN YET, so nothing carries `data-preview` and the
module is inert.** Wiring one up is a single attribute — that is the whole
design:

```html
<figure class="gw-tile gw-b" data-preview="https://media.aliphcreative.com/video/clip.mp4">
  <img src="…poster.webp" alt="">
</figure>
```

Three placements, three different rules, all measured on desktop and phone:

| where | rule | verified |
|---|---|---|
| gallery wall | one tile at a time per band; the wall is banded by grid row so a band lights as it is scrolled past. A phone collapses it to **one band**, i.e. one tile on the whole wall | ✅ |
| carousel | only the centred slide. No second timer — the carousel's own dwell does the advancing | ✅ |
| why-block 1 | plays and **never** hands on. One picture in a column, not a sequence | ✅ |

⚠️ **A stopped preview is DESTROYED, not paused** — `pause()` alone leaves the
buffer, and some browsers keep filling it. The position survives on the node as
`data-at`, which is what the overlay reads to resume.

⚠️ **`muted` is set BEFORE `src`.** The other order gets autoplay refused, and
the failure is a rejected promise rather than an error — it looks like the
preview simply never starts.

⚠️ **`refresh()` re-queries the DOM; it does not capture a node list at boot.**
The work page renders its tiles from JS after this module runs, so a snapshot
taken at boot would silently ignore every one of them.

### "new materials" — downloaded, derived, uploaded

Drive folder `1-aCuYK_SoM4slQEh2ZACBcrmoxj2XNzY`. **28 media files, 761.8 MB,
0 failures** fetched into the session scratchpad, then derived to **166.7 MB**.

⚠️ **18 of the 19 clips are HEVC**, which Chrome on Android and Firefox will
not play — so unlike the Drive films, `-c copy` was not an option and these had
to be **re-encoded to H.264**. Do not assume a remux is enough because it was
last time; check `codec_name` first.

⚠️ **Everything was 3840×2160** and is capped to 1920 on the long edge. A 4K
master behind a slot a few hundred px wide is the exact mistake the film strip
already paid for.

⚠️ **Rotation is BAKED IN, not left in metadata.** Most clips carried
`rot=-90`; browsers honour that inconsistently, so what ships is already the
right way up and the tag is cleared. Portrait clips are 1080×1920, landscape
1920×1080 — check that, not the source dimensions.

Naming: `bts-NN` for the behind-the-scenes set, `bts-montage` for the 65s cut,
`design-newmat-NN` for the two 4:5 posters. Arabic filenames strip to nothing,
which is how the first import produced `copy-of-1` / `copy-of-2`.

✅ **All 47 objects are on R2 and verified** — 28 assets plus 19 poster frames,
every one 200 over `media.aliphcreative.com` with the right content-type and
`immutable`. They are **not referenced by any page yet**: `MEDIA` in `main.js`
is generated and was not regenerated, so the work page does not know about
them. That is the next step, and it needs the agency to say which of them
belong on the site.

⚠️ **The masters are NOT uploaded** — only the web derivatives. That is open
question 11 and still unanswered; the 762 MB of originals sit in the session
scratchpad, which Windows can clear, with the Drive as the only other copy.

⚠️ **The Al-Baidar landing page is deliberately excluded.** It is a full git
working copy (116 files, ~98 of them `.git` internals), i.e. source, not media.
Serve it from its own domain and put a screenshot in R2; a copy in a media
bucket goes stale the moment they touch the site. The boss's doc also names it
as the landing page to feature (with سيدات ايلياء as the alternative) — that
line sits inside the برمجيات block the agency asked to defer.

⚠️ **`embeddedfolderview` beats driving the browser for this.**
`https://drive.google.com/embeddedfolderview?id=<ID>#list` returns a plain,
non-virtualised list — no scrolling, no browser, and it recurses. Folder vs
file comes from the `href` (`/drive/folders/` vs `/file/d/`), **not** from the
icon image, whose filename matches nothing.

⚠️ **The folder also contains a full git working copy of the landing page** —
116 files, ~98 of them `.git` internals. That is source, not media. It is
excluded from the fetch and **must not go in the bucket**: a landing page is a
live site with its own analytics and links, and a copy in R2 goes stale the
moment they touch it. Serve it from its own domain; put a screenshot in R2.

Still to do: HEIC → WebP, MOV → faststart MP4, then upload and wire up. The
`.MOV` files are iPhone HEVC and will not play in most browsers untouched.

## The work page (2026-08-12, tech restored 2026-08-16)

One continuous run of **the media itself** — no titles, no captions. The
agency's call: show the work now, organise it into named projects later.

⚠️ **TWO different kinds of thing share this run and they are not
interchangeable.** `design` and `photo` come from `MEDIA`: the Drive, shown as
itself with a date and nothing else. `tech` cannot — the software work is
sites, systems and apps, and there is no photograph of a booking system. It
renders from `PROJECTS` instead, and each entry opens the **profile sheet**,
which is the only way that work can actually be shown. Same tile, different
payload; `row.kind` is the switch.

- **80 items**: 9 design pieces, 54 photographs, 13 films, 4 software projects.
  All four categories render now. A category with nothing in it is still
  skipped — a spine opening onto cream reads as broken.
- 🔴 **The four tech entries are PLACEHOLDER content**, and so are their
  screenshots (`HOLDER`, the grey data URI). The sheet around them is real and
  works; what it displays is invented. This is the most visible piece of
  fabricated content on the site now that the archive is real.
- ⚠️ **`MEDIA` in `main.js` is GENERATED. Do not hand-edit it.** Every `d` is
  read out of the file's own metadata — EXIF `DateTimeOriginal` for a
  photograph, the container's `creation_time` for a film. Hand-transcribing
  this table went wrong once already: **47 of 70 rows came back with invented
  filenames, dates and ratios**, every one of them plausible, and only a
  line-by-line diff against the generator caught it.
- ⚠️ **The nine design pieces genuinely have no date.** They are 1080×1350 PNG
  exports with an empty EXIF block — checked, not missing. They carry `d: null`,
  show no date, and sort to the **end** of the run rather than to 1970. A real
  date has to come from the agency.
- ⚠️ **The archive is a COLUMN layout, not a grid of equal cells**, and that is
  load-bearing. It holds four shapes at once — 4:5 design work, 3:2 and 2:3
  photographs, 9:16 reels, 16:9 film — and a fixed-aspect cell crops every one.
  On the design work that crop cuts the type baked into the layout, which is the
  one thing this page exists not to do. Each tile is sized from its own ratio.
  The trade is reading order: columns fill down then across. 4 columns desktop,
  2 on a phone.
- **Film is inert until asked for.** The tile shows a ~25 KB poster frame;
  nothing of the film itself is fetched until it is opened. A screen of muted
  loops is the exact load the phone pass spent a week removing.
- The **فهرس / معرض toggle is `hidden`**, not deleted. An index is a list of
  titles and there are none yet; it rendered a column of bare dates. It comes
  back with the project names.

## The lightbox (2026-08-16)

Click any picture or film and it opens full size over a dimmed page. Built
entirely in `main.js` — it is chrome, it is identical on all three pages, and
three copies of the same markup is three places to forget one.

Covers `.why .holder` (block 1 and every carousel slide), `.gw-tile`,
`.lib-grid .tile`, `.sheet-shot`, `.clip-photo`, `.asvc-media`.

⚠️ **The ماذا نفعل؟ switcher is deliberately excluded.** Its stage is a
control: the arrows step through examples, so a click there means "next", not
"bigger". `.sw-stage` is in the handler's skip list — don't add it back.

Three things in it that are load-bearing:

- ⚠️ **A drag guard.** The carousel is a scroll-snap scroller, so a swipe that
  starts on a slide ends in a `click` on it. Without the 10px movement check,
  every swipe on a phone would open the overlay.
- ⚠️ **The `<video>` is created on open and destroyed on close**, not paused.
  A paused element that still has a `src` keeps its buffer and on some browsers
  keeps filling it behind a closed overlay.
- ⚠️ **Arrow keys follow READING order**, so ← and → swap meaning with the
  language. Grouping is by nearest container (`.gwall`, `.lib-grid`,
  `.reelshow-track`, `.clippings`, `.wb1`), which is what makes "3 / 12" mean
  anything.

**Film no longer plays inside its own tile.** It opens here like every other
piece of media — one behaviour instead of two, and much bigger. The gallery
wall's tap-to-lift went at the same time: a tap opens the picture now, and the
lift is a pointer affordance gated behind `(hover: hover)`.

### The R2 pipeline (2026-08-12, extended 2026-08-16)

Everything derives from the cached Drive originals, **still on disk** at
`…\58773dc5-…\scratchpad\orig` (64 files, 938 MB) and `…\videos`, plus this
session's `…\7afe1974-…\scratchpad\{videos2,r2-video2,r2-web,tuktuk}`.

⚠️ **All of that is under `%LOCALAPPDATA%\Temp`** and can be cleared by Windows
without warning. The 938 MB of camera originals is the only copy outside the
Drive. Only the derived WebPs in `prototype/assets/media/` are safe.

Scripts worth keeping together (scratchpad): `prep_video.py` (faststart remux +
probe), `build_index.py` (EXIF dates), `posters.py`, `upload_r2.py`,
`verify_r2.py`, `splice_media.py`, `refetch.py`, `derive.py`, `upload_web.py`,
`tuktuk.py`. `cut_paper.py` is in `resources/` with the rest of the asset
scripts.

### The six recovered films (2026-08-16)

🔴 **Five of the twelve Drive videos had never actually downloaded.** What was
on disk was ~2.4 KB of Google's "can't scan this file for viruses"
interstitial, written out as a `.mp4`. The request returned 200 and produced a
file, so nothing looked wrong until the sizes were compared. A sixth
(`Final Hasoub`) had produced no file at all and so was invisible even in a
list of failures.

Getting past it needs two things the first attempt had neither of: a **cookie
jar** (the confirm token is bound to a session cookie) and the interstitial's
**hidden form fields replayed back** to the endpoint. `refetch.py` does both.

⚠️ One file — `الف للتوكتوك.mp4` — answers **"Google Drive - Can't download
file"**, which is a different thing entirely: not the scan gate but a dead
file (quota spent, sharing changed, or removed). No amount of token replay
fixes it. The agency downloaded that one by hand.

⚠️ **They arrived as EDIT MASTERS, 11–25 Mbps.** `final-hasoub` was 209 MB for
68 seconds — a 10 Mbps visitor cannot stream that in real time, it just
buffers. So `video/` holds a **web derivative** (CRF 22 under a 5.5 Mbps
ceiling, same resolution and length: **1125 MB → 224 MB**) and `master/` holds
the untouched original.

That split is the whole point, and it is consistent with the no-compression
position rather than a departure from it: **a slot and an archive are different
assets.** The argument for a derivative was never an argument for discarding
the original. Don't "fix" this by pointing the page at `master/`.

⚠️ **`wrangler r2 object put` needs `CLOUDFLARE_ACCOUNT_ID` set explicitly.**
This login reaches two accounts and stops to ask otherwise — which is a hard
failure non-interactively, and publishes into the personal account if answered
wrong. Same reasoning as the pin in `wrangler.toml`.

⚠️ **Send a browser user-agent from any verification script.** `r2.dev` used to
403 a scripting library's default UA — Cloudflare bot protection, which looks
exactly like "public access is disabled": all 70 objects reported 403 while
being perfectly readable. The host is gone but the habit stays, and so does the
rule behind it: a check that fails for *every* item is more likely broken than
the thing it checks. ⚠️ **`401` from `pub-0b1a7847….r2.dev` is a different
thing and is now correct** — that URL is switched off on purpose.

## Crumpled paper (2026-08-16)

Cut from **the agency's own scan**, `resources/Free_crumpled_paper_texture…jpg`
(2848×4272), by `resources/cut_paper.py`. Three tiles from three
**non-overlapping** regions of the same sheet, at the agency's request — the
same creases in the hero, the headlines and the page background would read as
one repeated stamp rather than as a material.

| tile | where | note |
|---|---|---|
| `paper-panel.webp` | `.hero-panel::before`, multiply 0.55 | broad calm folds |
| `paper-title.webp` | `.banner h2`, clipped to the glyphs | most contrast, smallest size |
| `paper-page.webp` | `body.paper::after`, whole site | softest of the three |

**The whole-site version is behind a switch:** load any page with **`?paper=1`**
to see it, so the agency can judge it before committing. Same query-string
convention as the chat widget's `?chat=up`. Off by default.

⚠️ **The headline tile needs far more contrast at a far smaller size than the
other two, and it is easy to get wrong** — it was rejected twice. The texture is
clipped to the LETTERS, so almost all of the tile is thrown away and only what
falls inside a stroke survives. A curve that reads beautifully across a whole
panel is invisible inside a letterform. Hence `background-size: 240px` (not the
600px that "looks right" on its own) and a hard gamma.

⚠️ **But crease DEPTH is what decides the colour.** The tile is multiplied into
the cream, so a strong setting stops the type being cream at all — at strength
0.92 the folds hit 20/255 and the headline read as grey paper on ink, which the
agency rejected. Contrast comes from the **gamma**, which lifts the flats toward
white; depth stays low. Flats land at ≈`#D2D2C7`, the deepest fold at
≈`#9C9C94`.

⚠️ **`background-clip: text` is guarded by `@supports`, and that guard matters.**
The technique needs `color: transparent` to let the background through, so
anywhere the clip is unsupported an unguarded rule gives you *invisible*
headlines rather than untextured ones.

Two things `cut_paper.py` does that are not obvious:

- **Curve first, then blend.** The tile is made seamless by cross-fading a
  surplus band back over the opposite edge. Applying the contrast curve
  *afterwards* amplifies the tiny residual difference across the join into a
  visible line — which is exactly what happened. The blend must be the last
  thing to touch the pixels.
- **It picks where to cut.** The blend guarantees the wrap is *continuous*, not
  that it is *inconspicuous*: a join landing along a strong fold repeats that
  fold at every tile boundary and reads as a grid. The script tries a few
  nearby origins and keeps whichever puts the join in the quietest part of the
  sheet, scored by how the join ranks among every other join in the tile.

⚠️ **Three procedural attempts failed before the scan arrived** — contour rings,
quilted leather, cracked stone. They are not in the repo. Worth knowing only so
nobody tries generating it again: crumpled paper is flat facets meeting at sharp
creases, and *summing* smooth noise can never produce a sharp edge.

## Two animation fixes (2026-08-16)

**Closing the nav is animated now, and the tween was always there.** The
overlay is only painted while the body carries `.nav-open` — and that class
comes off on the same frame the burger is clicked, so a 0.55s slide ran on
something already invisible. `.nav-closing` keeps it painted for exactly as long
as the tween needs and comes off in `onComplete`. Scroll is released
immediately; only the paint is held. `gsap.killTweensOf` on every toggle, or a
fast double-click strands `.nav-closing` on the body and pins the overlay over
the page.

**The oval buttons swap sideways.** They used to slide on Y inside a
`height: 1.5em` mask — so the mask was only as tall as the travel needed, and
Arabic paid for it: تعرّف على ألِف has a hamza above and a descender below and
`overflow: hidden` sliced both off flat. **A vertical mask cannot clip the
travel without also clipping the letters.** Horizontal travel decouples them:
padding gives the glyphs room, a matching negative margin keeps the button's
height unchanged, and the overflow now only ever cuts left/right where there is
nothing but the face waiting off stage. `--swap` flips the direction with the
language.

## Moving media to a custom domain — DONE 2026-08-16

The agency did the dashboard half: `media.aliphcreative.com` is connected to
`aliph-media`, the certificate is live, and **the `r2.dev` URL is switched
off** — it answers `401 Unauthorized` now, for every object.

Verified this session:

- **All 89 objects the page actually asks for** — 63 `img/`, 13 `poster/`,
  13 `video/` — return 200 over the new host at real lengths with
  `cache-control: public, max-age=31536000, immutable` intact. The checker
  reads the keys out of `MEDIA` in `main.js` rather than listing the bucket,
  because what matters is the set the page requests.
- **Edge caching works with no Cache Rule needed** — `cf-cache-status: HIT` on
  a repeat GET, 0.20s → 0.07s. ⚠️ Do not conclude otherwise from a `HEAD`:
  HEADs report `DYNAMIC` on an object that is in fact cached, which reads
  exactly like "the cache rule is missing" and sent one round of diagnosis at
  a non-problem.
- A film still streams: `horizontal-maqasid.mp4` reports 1920×1080 / 207.1s
  from `loadedmetadata` alone, so the faststart remux and byte-range serving
  both survived the move.
- The work page renders end to end from the new host — 152 tiles, 0 broken,
  **0 failed requests**.

✅ **Deployed 2026-08-16.** ⚠️ The lesson worth keeping: switching off `r2.dev`
and shipping the constant are **one change, not two**. The moment public access
came off the old host, every image, poster and film on the deployed work page
401'd — and it stayed broken for as long as the deploy was held. If the media
host is ever moved again, land the repo change first.

⚠️ **The bucket has no CORS policy, and that is fine — don't "fix" it.** A
cross-origin `fetch()` for a media object fails; `<img>` and `<video>` with a
plain `src` do not need CORS and are unaffected. Nothing in `main.js` fetches
media — the lightbox builds a `<video>` element. Only add a CORS policy if
something starts reading media bytes from script.

## Open questions for the agency

> Numbers are stable — the banner and other sections refer to them. Closed ones
> stay in place as one-liners rather than being renumbered away.

1. **The English copy is unapproved.** The Arabic came from the boss's doc and
   is signed off; every English string derived from it is mine, because the doc
   is Arabic only. (The Arabic half of this — invented لماذا ألِف؟ copy — was
   closed 2026-08-16.)
2. **Channel management has no home** in the three-service taxonomy. The old
   `creative` service was the only one that covered *running* an account. Social
   keywords are parked on `photo` with a comment.
3. **The brand stamp still names the old four services**, set as outlined vector, so
   it needs re-exporting from the Illustrator source. It is on every page.
4. **The coloured ransom scraps** (red, purple, brown, blue-ruled) break the
   ink-and-cream rule. Raised, unanswered. One line to restrict the pool.
5. **The fonts are 5.2 MB of raw OTF — 83% of the page.** No WOFF2, no subsetting.
   Blocked on the 29LT licence: converting desktop OTFs can breach a foundry
   licence, and the kit may already exist. This is the last big lever on phone
   performance.
6. ~~`wb2-rail-media` points three ways at once.~~ ✅ Closed 2026-08-11.
7. ~~The carousel is showing photographs, not reels.~~ ✅ Closed 2026-08-22 —
   eight reels, ordered so no two neighbours come from the same shoot including
   across the wrap; `portraits-46/47/48` are gone. See _Session 2026-08-22_.
   ⚠️ Closing it required a fix nobody had found: the preview module ran its
   only `refresh()` at definition time, so adding `data-preview` alone would
   have done nothing at all.
8. **Which work goes on the gallery wall?** The twelve tiles are a curated
   composition, not a feed — the shapes are fixed and the pictures were chosen to
   fill them. Swapping a photograph is one `src`; changing how many there are
   means re-tiling both the 12×12 and the 6×11 fields.
9. **The nine design pieces have no date**, and the archive shows them undated
   at the end of the run. Their PNGs carry no EXIF at all — this is checked,
   not missing. Either the agency supplies dates, or they stay as they are.
10. ~~Five Drive videos never downloaded.~~ ✅ Closed 2026-08-16 — all six are
    in; see _The six recovered films_.
11. **~1.7 GB of originals are not on R2** — only the web derivatives the site
    serves. Two sets now: the 938 MB of camera originals from the first import,
    and the **762 MB of "new materials"** pulled on 2026-08-16. Say if the
    masters should be archived there too. ⚠️ Both live in **temp folders**
    Windows can clear, and the Drive is the only other copy. This is the
    outstanding item with an actual clock on it.
12. ~~A custom domain for the media.~~ ✅ Closed 2026-08-16 —
    `media.aliphcreative.com` is live and deployed; `r2.dev` is off.
13. **Every page but the work archive serves its own images from the repo**,
    not R2. ⚠️ This is what kept the home page working while `r2.dev` went dark:
    only the work page broke. The about page followed the same rule on
    2026-08-23 — its BTS stills and poster frames are committed
    (`resources/about_media.py`), and only the clips, which have to stream,
    come off the bucket. Worth unifying if one address is ever wanted.
14. ~~Do the tech projects get real content?~~ ✅ Closed 2026-08-22 — three
    real, live projects with real screenshots replaced the twelve invented
    entries. **There is no fabricated content left on the site.**
    ✅ **The Al Baydar entry is corrected (2026-08-23).** It pointed at the
    developer tuning build of a scroll-driven tour; the agency's real site is
    the opening invitation at `albaydaropening.aliphcreative.com`, and it is a
    different project — re-shot and re-written. The tuning build is not linked
    from anywhere on the site any more.
    ⚠️ Still to rule on: **the سيكو سيكو page is a labelled archive demo** —
    its Netlify form endpoint does not exist on Workers, so the registration is
    intercepted and a ribbon says so.
15. **Does the whole-site paper texture ship?** Built and switchable at
    `?paper=1`, deliberately not enabled. The hero panel and the two banner
    headlines carry it either way.
16. 🔴 **`master/horizontal-maqasid.mp4` is not in the bucket, and the fix
    written here before was wrong.** 384 MiB. `wrangler r2 object put` caps at
    300 MiB — and so does the **dashboard**, which this file previously said had
    "no such cap" (screenshotted refusing the file on 2026-08-22, offering the
    S3 Compatibility API or a Worker instead). Both documented routes are dead
    ends; the only way up is a **multipart upload over the S3 API**, which needs
    an R2 API token the agency has not issued. An uploader is written and its
    imports check out — `put_master.py` in this session's scratchpad, reading
    `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` from the environment and never
    printing them. ⚠️ The 384 MiB master is in a **Windows temp folder** with
    Drive as the only other copy (see open question 11). The web version is up
    and playing, so nothing on the site is broken meanwhile.
17. 🟡 **The carousel stutters on a Galaxy A54 in Brave — and the prime suspect
    was removed on 2026-08-17 as a side effect of another fix.** Everything
    checkable was already clean: the wrap moves the picture 0.25px, steps are
    monotone with zero overshoot, no drift at rest, no long frames even at 6×
    CPU throttle, decoded texture a reasonable 13.6 MP. The one untested
    suspect was the linen — a viewport-sized fixed layer with
    `mix-blend-mode: multiply` above everything, which a phone GPU cannot
    composite without reading the backdrop for every affected pixel.
    ✅ **That blend is gone.** Moving the texture behind the content forced it
    to `background-blend-mode`, which is self-contained and reads no backdrop
    at all. **Ask the agency to retest on the same phone.** Stutter gone → it
    was the linen and this closes. Stutter stays → the linen is ruled out for
    good and the open lead is texture memory (41 MP of decoded image in the
    track; a phone-sized derivative is the known answer, not yet done).
    ⚠️ `?flat=1` no longer proves anything — there is no blend left for it to
    drop. Do not start rewriting the carousel: a previous round already built
    a fix for a defect that did not exist.
18. 🟡 **Mostly answered 2026-08-23 — eleven pieces are on the about page.**
    `bts-01` and the AliphxBader montage as the agency named, the six new pieces
    they sent, and two older stills for the clippings. The two 4:5 posters from
    that import (`design-newmat-27/28`) turned out to be low-res copies of two
    of the three ads sent this round and are superseded.
    **Still unplaced: the other ~14 BTS clips**, and the three inline-preview
    slots on the gallery wall (tiles 2/10/12) are still waiting on a choice.

19. ~~Which edge does «كل الأعمال» belong on?~~ ✅ Closed 2026-08-23 — the
    agency asked for it CENTRED, on the phone and on the desktop alike.
    ⚠️ The same ambiguity moved to the desktop ماذا نفعل layout instead: the
    sketch is drawn with English words left-to-right and is read here as an
    Arabic layout. See the banner — two words in `grid-template-areas` flip
    it.
20. 🔴 **What year was the agency founded?** The hero said ٢٠٢٦ and
    `about.html`'s facts table says ٢٠٢٤; they contradicted each other for two
    weeks. The hero's meta line is gone now, so the contradiction is dormant
    rather than settled — and the year is currently stated **nowhere** on the
    site. Settle it before it goes back anywhere.
21. 🔴 **The سيكو سيكو repo needs creating.** `gh` is not authenticated here so
    it could not be. The project is committed locally at
    `D:\Personal\Projects\bader-movie-night` with its remote already set;
    create `Aliph-Creative-Agency/SeekoSeeko-MovieNight` and push. The site it
    links to is already deployed, so nothing on the portfolio waits on this.
22. 🔴 **Two of the three ring marks are still drawn icons.** The cameraman
    cutout is real and is in; the two files supplied for a designer and a
    programmer are AI stock and are the wrong material, and the agency's own
    BTS is one desert film shoot with nobody at a screen. **One photograph of
    each, at work, is all it takes** — then `resources/cut_mark.py` and one
    line in `RING_MARKS`. Until then the section mixes one photograph with two
    line drawings, which is the one thing about it that does not hold together.
23. **Should the three new digital ads go on the ماذا نفعل ring?** They are in
    the archive. The ring's design run is the nine Grillit/Shawarma pieces and
    is a curated sample rather than a feed — and it paints from `assets/`, so
    adding one means committing a local copy of it.
---

## The Drive, and how media gets off it

The Drive folder (`aliph website/`) holds `graphic designs`, `horizintal videos`,
`pics` (~54 JPEGs, in 11 subject subfolders), `reels`. It resolves without signing
in; `https://drive.usercontent.google.com/download?id=…&export=download` works.

**The link, which went unrecorded for weeks and cost a round trip to get back:**

```
https://drive.google.com/drive/folders/15r6-M6L1Y_lmS-PXta_fBNjOE0gNERAB
```

| subfolder | id |
|---|---|
| `graphic designs` | `1TvlT5QesG6td4KKt5SNinrkvLgMfISij` |
| `horizintal videos` | `17VKTEzpw4aN-gB_wKTD4xnPnYlNXRAhY` |
| `pics` | `1pwS50pJajlei9EBmiaIhpu8EI8KXFVo5` |
| `reels` | `1bb7r81B6lBrTSR0C3q-GhhsXZfzGzF0-` |

### The pipeline, built 2026-08-10 — Drive is the SOURCE, never the server

This was argued twice, so: the Drive is a perfectly good place to pull files
FROM. It is not a place to serve them from — the download endpoint is not a CDN,
public files have a daily quota that returns an error page instead of the bytes,
and Google has broken the hotlink patterns before. The pipeline is
**Drive → derivative → repo (images) or R2 (video)**.

`scratchpad/build_media.py` does the image half and is worth keeping:

1. `manifest.tsv` — every file id in all 13 folders, walked with the browse tool.
   Drive virtualises the grid, so **the folder page must be scrolled** or you get
   the first handful only. Names come from `innerText`; `aria-label` exists only
   on the folder's own header.
2. Download originals — **they are camera files, 28-30 MP, 7-10 MB each, 598 MB
   for 63 images.**
3. Derive WebP at a **1600px long edge**, quality 82. Nothing on the page is
   wider than ~936 CSS px, so 1600 is still ~1.7× the largest slot.

**598 MB → 7.9 MB**, individual files 7.2 MB → 116 KB. That is the whole media
library for less than twice the weight of the fonts. Committed to
`prototype/assets/media/`.

⚠️ One Drive filename carried a **broken UTF-16 surrogate** and one console
print killed the whole run — the first of the console-encoding failures written
up in _Things that will bite you_.

⚠️ The design filenames came out as `copy-of-1`, `copy-of-2` because the slug
function strips Arabic to nothing. They are renamed after their clients —
`design-grillit-1.webp`, `design-shawarma-habash-1.webp`. Any new import needs
the same treatment or the library becomes unnavigable.

### The ratios, measured 2026-08-10 — the number the layout needs

| folder | pixels | ratio | decimal |
|---|---|---|---|
| `graphic designs` (all 9) | 1080×1350 | 4:5 | 0.800 |
| `pics` — portrait | — | 2:3 | 0.667 |
| `pics` — landscape | — | 3:2 | 1.500 |
| `reels` | 1080×1920 | 9:16 | 0.563 |
| `horizintal videos` | — | 16:9 | 1.778 |

⚠️ **Nothing in the Drive is square.** Every near-square holder on the site was
built for media that does not exist. Don't add another one.

Read a ratio without downloading anything — the thumbnail endpoint needs no auth
and preserves aspect:

```
https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w1600
```

Load it in an `Image()` and read `naturalWidth`/`naturalHeight`. `sz=w1600` caps the
long edge, so the *pixels* are a lower bound but the *ratio* is exact.

⚠️ **The design work does not crop, and that is permanent.** Those assets are
finished layouts with type baked in at 4:5; every fixed-aspect holder crops them
(keeping 53–80%) and the crop cuts the words. It is the reason the archive is a
column layout rather than a grid, and the reason no design work is on the film
strip or in the carousel.

The Drive is organised by *subject*; the site needs *projects* with a title,
date, service and cover. That mapping cannot be derived from the folder names —
the agency has to supply it.

The home page carries real photographs throughout. `HOLDER` (an inline SVG data
URI) is what `setHolder()` paints when an item has no `src`, which is what the
**ماذا نفعل؟ switcher and the about page** still show. The `seed` fields on
`PROJECTS` are dead data kept on purpose — they are the shopping list.

### Reels in the carousel — the treatment is proven

A real reel was trialled in a holder on 2026-08-10 and it read correctly:
`.holder > video` is styled alongside `.holder > img`, so no CSS is needed. Every
carousel slide is a true 9:16 now, so a reel plays uncropped.

⚠️ **No video belongs in the repo.** That trial reel was 51.8 MB — past GitHub's
50 MB warning and into every clone forever, for something that should be served
by URL. `prototype/media/` is gitignored and empty; video lives on R2.

⚠️ **The reels have burnt-in titles.** They no longer collide with anything, but
they will read as part of the page rather than part of the film.

### Decided 2026-08-10: video lives on R2 — refined 2026-08-16

**Compression is off the table for the MASTER** — the agency's position is that
the work is shown at the quality it was made at, and that is a brand call.

⚠️ **That was never a decision to stream a 25 Mbps edit master to a browser**,
and it was read that way once. The recovered films arrived at 11–25 Mbps;
`final-hasoub` was 209 MB for 68 seconds, which a 10 Mbps visitor cannot play in
real time. **The masters are kept, untouched, under `master/`. The page plays a
derivative from `video/`.** A slot and an archive are different assets — the
same distinction this file already drew for the rail loop.

Three size limits, all real, all different:

- **Cloudflare Workers static assets: 25 MiB per file.** A 51.8 MB reel cannot
  ship in the site bundle whatever anyone thinks about repo size. This is why
  R2 exists here at all.
- **`wrangler r2 object put`: 300 MiB per object.** Anything larger has to go
  through the dashboard. `master/horizontal-maqasid.mp4` (384 MiB) is stuck on
  exactly this.
- **GitHub: 50 MB warning per file.** Which is why `resources/*.mp4` is now
  gitignored.

✅ **The base URL is `https://media.aliphcreative.com`** (bucket `aliph-media`),
since 2026-08-16. Both `r2.dev` hosts this file used to name are dead now: the
first (`pub-90bac601…`) was always a different bucket, and the second
(`pub-0b1a7847…`) was switched off with the domain move. See the banner.

✅ **The faststart remux is DONE — for all seven videos (2026-08-12).** `moov`
was the last 12 KB of each file, so nothing played until the whole 28–84 MB had
arrived.

```bash
ffmpeg -i <source> -c copy -movflags +faststart <out>.mp4
```

Every one is asserted `moov`-before-`mdat` by the script that made it. **Lossless
by construction** — `-c copy` remuxes the container and re-encodes nothing.
Do this to anything before it goes on R2; it does not cost a pixel.

⚠️ Two harmless differences if you diff a remux against its source, neither of
which is quality loss: the output is a few KB **larger** (the relocated index
needs 32-bit offsets), and a handful of audio packets differ where ffmpeg
re-split the tail into uniform 1024-sample packets. Total sample count is
identical.

⚠️ **`prototype/media/` is empty now** and the old hand-made
`wb2-rail-reel.mp4` is gone with the rail that used it. The remuxed files live
in the session scratchpad and on R2; the directory stays gitignored.

⚠️ **ffmpeg is installed but not on PATH.** It is at
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-9.0-full_build\bin\ffmpeg.exe`
— call it by full path rather than concluding it is missing.

⚠️ **A rail loop and a showcase piece are different assets.** The rail box is
474×685 CSS px; a 1080×1920 master is downscaled by the browser to fill it, so the
extra pixels cost bandwidth and are never seen *in that slot*. That is an argument
for a second, smaller derivative for the loop — **not** for degrading the master,
which is what full-screen or lightbox playback should serve. If the work is only
ever shown in a holder this size, the derivative is free quality-wise; if it is ever
opened full-screen, the master has to be there too.

Before blaming markup for a video that will not play, check the container:

```bash
python -c "import struct,sys;d=open(sys.argv[1],'rb').read();i=0
while i+8<=len(d):
    s,t=struct.unpack('>I',d[i:i+4])[0],d[i+4:i+8].decode('latin1');print(t,s)
    i+=s if s>=8 else len(d)
print('bytes',len(d),'moov at',d.find(b'moov'))" <file>
```

That is how a **truncated** copy was caught here: an interrupted copy left 9,354,776
bytes of a file whose own `mdat` declared 54,265,568, with no `moov` at all. It looked
identical to a wrong `src` — `error.code === 4`, empty cream box.

---

## The briefs in `resources/briefs/`

What the agency actually asked for, kept where the code can be read beside
it. One dated folder per round, each with its own README.

⚠️ **`briefs/2026-08-23/` holds the only surviving record of two sketches.**
They were pasted into a chat, and a pasted image cannot be carried from one
session to the next — `layout-desktop.svg` and `ring-tilt.svg` are redraws
made from the originals while they were still on screen. If a question ever
comes up about what the desktop arrangement or the Saturn tilt was supposed
to be, those two files are the answer and there is no other copy.

The same folder carries the three centre-mark candidates and a verdict on
each: the cameraman is a real cutout of the agency's own crew and is the one
in use; the other two are AI stock, and the giveaway is that the whiteboard
lettering and the on-screen code in the programmer image are both gibberish.
⚠️ **Anything generated does not belong in this section** — it is otherwise
built entirely from the agency's own work, and that is the whole point of it.

---

## The scripts in `resources/`

Every derived asset comes from one of these, and the source art sits beside it. They
are the record of *how* something was made — rerun them rather than hand-editing the
output.

| script | what it does |
|---|---|
| `fit_columns.py` | Solves each why-column's body size so its copy fills its box. Run it whenever the copy changes length **or weight** — bold sets wider: `python resources/fit_columns.py ar` |
| `cut_film_scan.py` | Turns the agency's DaVinci scan into the film tile + its grain. Prints the frame-slot constant `style.css` needs. Asserts `RGBA`, the hole count, the seam step, and that the margin bands hold no hole pixels. |
| `shoot.py` | Screenshots the three live client sites over CDP against headless Edge. ⚠️ Needs `--remote-allow-origins=*` (without it `/json` answers and the WebSocket 403s) and `--disable-extensions` (a fresh profile still picked up the signed-in one's, and the first page target came back as somebody else's tab). Jobs and per-site prep in `shoot_jobs.json`. |
| `derive_shots.py` | Cuts those captures to the profile sheet's own three ratios — 1600x1000 plate, 400x250 thumb, 160x160 cover — read off the CSS, not guessed. Phone captures are letterboxed onto ink rather than cropped. |
| `comment_tool.py` | Splits a source file into code segments and comment spans (string- and regex-aware). Used to rewrite comments without touching code, and to prove code is byte-identical afterwards. |
| `recut_film.py` | Re-cuts the film tile so it repeats on a whole perforation pitch. Prints the frame-slot constant `style.css` needs. |
| `fix_rebate_seam.py` | Clears the edge print the tile's right edge slices, and levels the base-tone step across the seam. |
| `build_assistant.py` | Lifts the launcher's ring and double-alif mark out of the studio's artwork into transparent PNGs. |
| `cut_ransom.py` | Cuts the 16 torn paper scraps per language for the headline letters. |
| `build_crumple.py` | Bakes the dropcap's 24-frame sprite from the crumple clip. |
| `cut_paper.py` | Cuts the three paper tiles out of the agency's crumpled-paper scan. Picks each crop's origin by measuring where the wrap is least visible, and curves before blending — see _Crumpled paper_. |
| `extract.py` | Pulls the wireframe's colour-coded boxes out as percentages of the page column. |
| `cut_mark.py` | Turns a cutout-on-flat-ground photograph into the transparent WebP a ring turns around. 🔴 A colour key destroys this picture — the man is in a black shirt on black. The ground is found by reachability, and a run counts as ground only if it reaches the border or is over 1% of the frame. Asserts the coverage, which is what catches a leak. |
| `thumb_media.py` | Derives the work page's 600px `thumb/` for every archive object and puts them on R2. Width-capped, because the archive is a column layout. `--upload`. |
| `import_bts.py` | The 2026-08-23 import: the `new bts` folder and the digital ads in it, renamed off their CDN hashes, remuxed faststart, posters cut, uploaded. `--upload`. |
| `about_media.py` | Pulls the about page's BTS stills and poster frames off R2 and writes them into `assets/` at 1000px. They are local on purpose — open question 13. |

⚠️ Several of these **overwrite their output in place**. Back the file up before
rerunning, and check the result's **mode** — a film tile that is not `RGBA` has
lost its sprocket holes. Do not judge that by file size; see _Things that will
bite you_.

The list above is the whole of `resources/*.py`. Two superseded scripts were deleted
on 2026-08-09 — `fit.py` (targeted grids block 2 no longer has; `fit_columns.py`
replaced it) and `clean_assistant.py` (worked on the old single composite and had
hardcoded absolute paths; `build_assistant.py` replaced it). Both are in git history.

---

## Git

- Remote: `https://github.com/Aliph-Creative-Agency/AliphPortfolio.git`, branch `main`.
- `Brand/` is **not** in the repo (too large for GitHub) but is on the user's disk.
  `prototype/assets/` carries its own copies of everything the site needs.
- `resources/` **is** tracked — it holds the inputs the derived assets come from.
  ⚠️ **Which means anything large dropped in there goes straight into the repo
  and into every clone forever.** A 111 MB reel landed there on 2026-08-16 and
  would have been committed silently. `.gitignore` now excludes
  `resources/*.mp4` and `*.mov`, with the small green-screen crumple clip
  exempted by name because it predates the rule and is already tracked. Video
  belongs on R2, served by URL.
- End commit messages with the Claude co-author trailer.
- ⚠️ **`git add -A` is a trap here, twice over.** Run from the wrong directory it
  stages a *different repo* (there is one at `C:\Users\Obaida`). Run at the right
  moment it sweeps up whatever the user is midway through editing — that is how the
  chat-worker service-derivation fix ended up inside a commit about comments. Prefer
  `git -C <repo> add <explicit paths>`.
- The user edits files between turns. Check `git status` before staging anything.

---

## Working style

- The user iterates in tight, specific rounds and **edits files between turns** —
  always re-read current state before editing.
- **Copy references literally.** Enhance their art in place; don't substitute
  something you generated. The one exception is the film strip, which is
  AI-generated art they did not make and have approved replacing.
- Measure before claiming. Three estimated layout numbers in a row were wrong by
  more than 15 points; the annotated wireframe is a spec, not a suggestion.
- All names, counts and images in the prototype are placeholder content.
- **Comments explain why, not what.** They were all rewritten on 2026-08-09 and cut
  by a third; keep them short and delete them when the thing they describe is gone.
  Seven were removed in that pass for naming code that no longer existed — a comment
  that lies is worse than none.
- When the user pastes test text into the copy to see how it fits, **take it back
  out**. Two such runs have nearly shipped.
