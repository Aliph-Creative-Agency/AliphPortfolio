# Aliph Portfolio — Handoff

_Updated 2026-08-23 (evening). Read this first._

> ## 🟢 State on 2026-08-23 evening: the agency's ten screenshot edits are built and committed
>
> A second round landed the same day, sent as nine annotated screenshots and one
> screen recording. The full brief — every arrow, every red line, written out in
> words — is at **`resources/briefs/2026-08-23b/TASKS.md`**, so no future session
> needs the images.
>
> ⚠️ **The deploy is written up in its own section below, and only after
> wrangler returned a version id.** The morning round was written up as
> "deployed" before it was; do not repeat that.
>
> ### What changed, in one line each
>
> | # | the agency asked | what landed |
> |---|---|---|
> | 1 | the hero lede's last line is orphaned on a phone | the paper أ is shorter there: 5 lines with a 3-word widow → **4 lines, 7 words on the last** |
> | 2 | the footer band shows an emoji and no text | it was **ink on ink** — the band never had a ground of its own; and U+2733 needed U+FE0E to stop iOS drawing it as a green sprite |
> | 3 | the about page doesn't look like the section above it | the long read takes the collage's **matted clipping** treatment, and its even rows were **silently stacking** — see below |
> | 4 | the ring doesn't feel like a ring | every item is **bent across ten slats** on the cylinder, the far half **turns away and shows its mirrored back**, and nothing clips at any angle |
> | 5 | the footer clock is too small for the wordmark | sized from its own column, matched to within **0.1px**, with tabular figures so it stays matched all day |
> | 6 | the hero lede is too small on a desktop | three lines that end **0.2px** from the bottom of the paper at 1920×1080 |
> | 7 | the reels carousel is washed out on a phone | `is-current` was thrashing; hysteresis, an in-flight guard, and a debounce on the preview sync |
> | 8 | a tech item opens a lightbox over its own profile | the lightbox no longer claims a tile that carries `data-project` |
> | 9 | centre the clock and the wordmark on a phone | stacked and centred, both 176px wide |
>
> 🔴 **Two faults found while building that the agency had not reported, and both
> were bigger than what they had.**
>
> 1. **The about page's even rows were laying out as TWO rows, not one.** The
>    picture was placed in column 2 and the card in column 1, and CSS grid
>    auto-placement cannot send the cursor backwards — so the card dropped to a
>    row of its own. Measured before the fix: `grid-template-rows: 493.531px
>    169.281px` on rows 2 and 4. That is where most of the "huuuuuuuge spaces"
>    actually came from. `grid-row: 1` on both children fixes it.
> 2. **The ring's slats resolved to a flat identity matrix on first paint.**
>    `layout()` measures the window, which flushes style for the nodes it has
>    just inserted — before it has written their geometry. Every `var()` in the
>    transform was undefined on that pass, the property fell back to `none`,
>    and the transition on it turned that into a half-second unfold on load and
>    on every resize. Fallbacks on the vars, and no transition on anything
>    layout writes.
>
> ⚠️ **The ring reverses the morning's correction, on the agency's instruction
> and with the consequence stated.** The morning build billboarded each item so
> the far half stayed square to the eye and readable. The agency asked for a
> real ring instead — "its face should be to the absolute back of the website" —
> and chose, when asked, the mirrored back over a blank card back. **So the
> Arabic set into the design ads reads backwards on the far half. That is the
> agency's decision of 2026-08-23b, not an oversight.** Un-reversing it means
> putting the two inverse rotations back on `.ring-item`.
>
> ⚠️ **The two missing ring marks are IN, and they are the AI stock files.** The
> agency was told on 2026-08-23 that the designer and developer photographs are
> AI generated — gibberish hand-lettering on the whiteboard, code on the screens
> that is not code — and asked for them anyway. `resources/cut_people_marks.py`
> cuts them; the whiteboard leaves with the background, and the screens read as
> texture at 60px. Replace them the day the agency photographs their own two
> people: one script run, no other change.
>
> 🔴 **NOTHING ANIMATED WAS EVER SEEN.** The browser pane available to this
> session does not composite frames — screenshots time out with "the page is not
> compositing frames" — so `requestAnimationFrame`, `IntersectionObserver`,
> `loading="lazy"`, `scroll-behavior: smooth` and writes to `scrollLeft` are all
> inert in it, and **every CSS transition is frozen at its FROM value**. Every
> static property in this round was measured, and the geometry was proved by
> sweeping `--spin` through 360° by hand. What was NOT verified: the ring
> turning, the two-step click's glide, the carousel actually advancing, and
> therefore **whether the carousel fix works**. See the next round.

---

## ⏭ The next round — what is open

1. **The carousel fix is REASONED, NOT REPRODUCED, and it is the one thing in
   this round that could still be wrong.** The pane refuses programmatic
   scrolling — `scrollLeft` was written four times and never moved off −2473 —
   so the fault could not be recreated locally. What is known: 10 frames a
   second out of the agency's recording show the centred reel flickering
   between opaque, half-faded and gone, which is `is-current` being taken off
   and put back many times a second while a 0.5s opacity transition restarts
   from wherever it had got to. Three changes went in — hysteresis in `mark()`
   (a challenger must be a quarter of a slide nearer to take the class), an
   in-flight guard so `recentre()`'s instant scroll cannot cancel a running
   smooth one, and a 120ms debounce on `syncReel()`, which was building and
   tearing down a `<video>` element on every scroll event. **Watch it on a real
   phone before believing it.**
2. **The ring's motion has still never been SEEN** — now for a second round.
   The turn, the glide, and the new lift (the front item stands proud of the
   band rather than scaling) are all rAF-driven. Every static property
   measures right; the feel is unknown.
3. **Open question 20 is still open**: the founding year is stated nowhere on
   the site. Settle it before a year goes back anywhere.
4. **The three new digital ads are still undated**, like the other nine — open
   question 9. They are on the ring now, so the gap is more visible.
5. **`master/` still has nothing from the new imports** (open question 11), and
   the 197 MB AliphxBader 4K master on the Desktop is archived nowhere but the
   Desktop.
6. **Two things blocked on the user, both carried for several sessions.** The
   `SeekoSeeko-MovieNight` repo cannot be created until `gh` is authenticated;
   the project is committed locally at `D:\Personal\Projects\bader-movie-night`
   with its remote already set. And `master/horizontal-maqasid.mp4` cannot be
   uploaded until an R2 API token exists (open question 16). ✅ Note that
   `wrangler r2 object put --remote` DOES work from this machine — it put the
   three cropped bts-29 objects this round — so the token may only be needed
   for the file that exceeds the 300 MiB cap.
7. **The about page's phone height is 8,713px** and the media there is
   deliberately uncapped, per the rule of 2026-08-10 that a height cap and an
   `aspect-ratio` cannot both be honoured. If that page needs to be shorter, the
   lever is `width: min(100%, calc(<H> * var(--r)))` — the desktop's approach —
   not a `max-height`, which crops.

---

**Standing rule: update this file at the end of every session.**

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
Flat ships a real 700 (`29LTIdris-FlatBold.otf`), so this resolves to the drawn
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
| `tech` | تطوير برمجيات | Software Development |

Each has three subcategories (`SUBCATS` in `main.js`). The ids are the join key across
`CATS`, `SUBCATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`, `data-service` in
the markup, **and `chat-worker/src/services.js`**. Change one without the others and
classification breaks silently.

⚠️ **Renamed twice now, and neither rename moved an id** — only labels.
2026-08-10 gave the three their long names; **2026-08-11 changed `photo` from
تصوير احترافي / Professional Photography to صناعة محتوى / Media Production**,
which widens it from photography to everything the feed is made of.

**Six live copies, and they must all move together** — this string has gone stale
twice by being changed in one place:

1. `I18N.svc2` in `main.js`
2. `SERVICES[].tag` in `main.js` (the uppercase Latin tag)
3. `CATS` in `main.js` — which once carried a *third* spelling of its own
4. the `data-i18n` fallback in `index.html` (the `svc2` span)
5. the `heroMeta3` fallback in `index.html`
6. `chat-worker/src/services.js`

`I18N.heroMeta3` itself is **derived from `CATS`** and needs no edit. A dead
literal for it sat in the I18N table carrying the pre-rename short labels until
2026-08-11; it was overwritten at boot and never rendered. It is gone — don't
reintroduce one.

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

**Measure after `document.fonts.ready`.** 5 MB of OTF lands after first paint and
every number moves until it does.

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
