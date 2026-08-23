# Round 2026-08-23b — the agency's screenshot round

Ten edits, sent as nine annotated screenshots plus one screen recording, on
2026-08-23 evening. **This file is the whole brief.** The images are described
here in enough detail that no session needs to see them again.

Source images live in `C:\Users\Obaida\Desktop\issues\` (video only); the
screenshots were pasted into chat and are NOT on disk. Everything they showed
is written out below.

---

## T1 — Hero, phone: the lede's last line is orphaned

**What the screenshot showed.** iPhone, Arabic, home page. The hero paragraph
«لِف وكالة تبدأ من الحرف الأوّل …» wraps to five lines and the fifth is
«الأَلِف إلى الياء.» alone, sitting under the crumpled-paper أ with a red line
drawn beneath it.

**Ask.** Make the crumpled-alif component (`.dropcap`) *just* small enough that
the last three words pull up onto the previous line.

**Where.** `prototype/style.css` — `.dropcap { --cap-h: clamp(138px, 17.5vh, 205px) }`
(~line 907) and the phone block near line 3160. Phone only; do not disturb T9.

---

## T2 — Footer: two faults in the contact band

**What the screenshot showed.** Desktop-width home page, footer. The ink band
between «كل الأعمال» and the contact grid is a dark strip showing **only a
green emoji asterisk** — the marquee text is nowhere.

**Ask.** Two fixes.

1. **The star renders as a colour emoji.** `buildBandSource()` in `main.js`
   (~line 628) writes `<i class="cb-star">✳</i>` — U+2733, which iOS and
   several Androids render with emoji presentation. Force text presentation or
   replace the glyph outright.
2. **«لنبدأ من الألِف» is invisible.** `.footer` is `background: var(--ink)`
   and `.contact-band` sets `color: var(--ink)` with **no background of its
   own** — ink on ink. The band was written for a cream ground. Give it one.

**Where.** `main.js` `buildBandSource`; `style.css` `.contact-band` (~2546) and
`.cb-item .cb-star` (~2572).

---

## T3 — The about page, five separate faults

**What the screenshots showed.** Screenshot 3 is one of the about page's media
holders — two men on a step-ladder rigging a camera against a chain-link fence,
`@bader.events` and an Arabic caption burnt into the bottom of the frame, a
▶ play badge in the middle, and a red line drawn horizontally at roughly **95%
of the frame's height**, just above the watermark. Screenshot 4 is a clipping
from the collage *above* it: a black-and-white desert road, matted inside a
cream card with a hairline border, a caption («المرف الأول») set small at the
bottom, and the whole card rotated a degree or so.

**Identified.** The frame in screenshot 3 is **`bts-29`** — confirmed by
rendering all six about-page posters side by side; it is the only one with the
ladder, the fence and the `@bader.events` handle.

**Asks, all five.**

1. **The new rows do not use the collage style.** `.ab-read`'s five rows are a
   plain two-column grid. The agency wants the *scattered* treatment of
   `.about-clips` above it — matted cards, hairline, cast shadow, small
   rotations, staggered columns.
2. **The media containers are wrong for vertical media.** `.ab-holder` is a
   bare bordered box with `object-fit: cover`. Frame each piece the way
   screenshot 4 is framed — a mat sized to the medium's own ratio.
3. **The clips should move.** They are short; make them GIF-like — autoplay,
   muted, looping — "or at least make them auto play like the ones in home
   page", i.e. the `previews` module's treatment.
4. **The vertical gaps are enormous.** Match the collage's spacing.
5. **The media has no border** the way the clippings above do.
6. **Crop `bts-29` to the red line** — lose the bottom ~5–6% and the
   `@bader.events` watermark with it.

**Where.** `prototype/about.html` `.ab-read`; `style.css` `.clippings`/`.clip*`
(~2244) and `.ab-*` (~2324); `main.js` `previews` (~1959). The crop touches
`assets/media/bts-29.webp` and, on R2, `video/bts-29.mp4` + `poster/bts-29.webp`
+ `thumb/bts-29.webp`.

---

## T4 — ماذا نفعل: the ring, seven asks

**What the screenshots showed.**

- **Screenshot 5** — a phone-width crop of the ring with a Grillit poster
  **sliced off along the bottom edge** of `.ring-window`. The agency notes it
  also happens at the top sometimes.
- **Screenshot 6** — a reference image (not the site): eight or nine portrait
  cards scattered in a loose cluster, each tipped a few degrees, overlapping,
  receding into the distance — the *angle* the agency wants.
- **Screenshot 7** — the desktop ماذا نفعل section in English, with a **red
  vertical line drawn at roughly x = 655 of 1869**, i.e. about **35% across
  from the left**. Left of it: the three service names stacked and the ALL WORK
  oval. Right of it: the poster cluster. The line marks how far the *service
  column* should be allowed to reach.

**Asks, all seven.**

1. **Stop the clipping.** Items are cut off at the bottom, sometimes the top,
   of `.ring-window`.
2. **The rotation angle should match screenshot 6.**
3. **The items should bend.** "for the media items to curve and bend to
   actually feel like a ring … imagine the outer face of a normal ring with
   the media being literally bent on the outer face."
4. **The far half should invert.** "as it spins to the other side it should
   invert because its face should be to the absolute back of the website."
   ⚠️ This directly reverses the 2026-08-23 morning correction, which undoes
   the spin per item precisely so the far half is *not* turned away. See
   question Q1.
5. **Cut-out marks for design and tech.** The photographs are on the Desktop:
   `C:\Users\Obaida\Desktop\graphic designer.jpg` (a man from behind at a
   monitor showing a kanban board) and `C:\Users\Obaida\Desktop\progrmmer.jpg`
   (a man in headphones at an iMac, whiteboard behind him). Both are AI stock
   with gibberish lettering — the agency knows and wants them used anyway.
6. **Rebalance the desktop columns** — showcase bigger, service list smaller,
   to the red line in screenshot 7 (~35%). Push the ALL WORK button toward the
   showcase side, and **add a one-line invitation** above/beside it.
7. **Re-mix the design ring** — the nine Grillit/Shawarma pieces are stale now
   that three «حقك تعرف حقك» ads exist (`design-haqqak-1..3` on R2). Replace
   some. ⚠️ The ring paints from `assets/media/`, so each needs a local copy.
8. **Tech ring: logos, not screenshots.** Swap `queens-retreat-1` /
   `al-baydar-1` / `seeko-seeko-1` for the three `-cover.webp` logo tiles that
   already exist in `assets/shots/`. **Unify the three descriptions** — they
   are all landing pages.

**Where.** `main.js` `RINGS` (~1212), `RING_MARKS` (~1263), `serviceRings`
(~1286); `style.css` the ring block (~1538–1845).

---

## T5 — Footer clock: match the wordmark's width

**What the screenshot showed.** A crop of the footer's right-hand column: the
clock ٢٠:٥٠ with «بتوقيت القدس» under it, and the ألِف / ALIPH wordmark below.
Two red vertical lines drawn down either side of the **wordmark**, with the
clock visibly much narrower than that span.

**Ask.** Grow the clock until its block is as wide as the wordmark beneath it.

**Where.** `style.css` `.contact-clock` (~2629).

---

## T6 — Hero, desktop: the Arabic lede is too small

**What the screenshot showed.** The desktop `.dropcap-block` — two lines of
Arabic with the crumpled أ floated to the right — and a red horizontal line
drawn beneath the text, level with the **bottom edge of the paper**. The text
block currently stops well short of it.

**Ask.** Grow the Arabic hero paragraph until it reaches that line — i.e. until
the copy fills the height the dropcap occupies (a third line).

**Where.** `style.css` `.dropcap-block` (~893). Desktop only; do not undo T1.

---

## T7 — Phone: the reels carousel sits at flank opacity

**What the recording showed.** 12.5s, iPhone, Arabic, home page, the
«نقاطٌ بحثنا عنها، وأعمالٌ بنيناها منها» carousel. The centred slide is
**washed out** for almost the whole clip — one single frame at ≈9.9s shows it
at full strength and in motion. Everything else on the page (the headline, the
masthead) renders correctly, so the page is not dimmed; the *slide* is.

**Diagnosis so far, unconfirmed.** `.reel-slide` is `opacity: 0.34` and
`.reel-slide.is-current` is `opacity: 1`. The centred slide is not getting
`is-current`, or is losing it. `mark()` in `reelShow` (`main.js` ~2672) is the
only thing that toggles it. **Reproduce at 375px before changing anything.**

**Ask.** "this is a recurring issue on phone, fix it."

---

## T8 — Work page: a tech tile opens a lightbox over its profile

**What the screenshot showed.** The work page with the Queen's Retreat profile
sheet open *behind* a lightbox overlay showing the سيدا رايتليتا logo on its
pale mauve ground. Two close buttons visible, one focus-ringed.

**Root cause, confirmed by reading.** Two handlers fire on one click:

- `accRoot`'s delegate (`main.js` ~2379) → `projectSheet.open()`, correct.
- the lightbox's document-level delegate (~1907) → `OPENS` includes
  `.lib-grid .tile`, and a project tile **is** one.

The comment at `main.js:2370` says project tiles "carry the placeholder data
URI, so it falls through" — that stopped being true this morning, when
`derive_shots.py` gave every project a real `-card.webp` cover. `itemOf()` now
returns a picture and the overlay opens on top.

**Ask.** Remove the effect; a tech item opens straight to its profile.

**Fix.** Exclude `[data-project]` from the lightbox's `OPENS`.

---

## T9 — Footer, phone: centre the clock and the wordmark

**What the screenshot showed** (sent mid-round). The phone footer: clock at the
inline start of its row, wordmark below at the inline end, each hugging an
opposite edge.

**Ask.** "also center these on phone."

**Where.** `style.css` phone block ~3096–3114 — `.contact-clock`,
`.contact-mark`.

---

## Standing constraints for this round

- **No framework, no build step.** Static HTML/CSS/JS in `prototype/`.
- **Deploy is manual**: `npx.cmd wrangler deploy` from the repo root. Verify
  against a real version id before writing "deployed" anywhere.
- **Do not grep live Arabic through Git Bash** — fetch in Python, test with `in`.
- **A full-page screenshot without scrolling first** shows every `gsap.from()`
  reveal at opacity 0 and reads as "the text is missing".
- **`Range.getBoundingClientRect()` reports the font box, not the ink** — use
  `measureText().actualBoundingBoxAscent` on display type.
