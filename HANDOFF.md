# Aliph Portfolio — Session Handoff

_Last updated: 2026-08-02 (session 5). Read this first when starting a new session._

> **Standing rule from the user: update this file at the end of every session.**
> Not only when asked — it is part of finishing the work.

## Session 5 (2026-08-02) — services reshuffle, no counts, tech profiles, about rebuild

Six things landed. Everything below is committed and verified in the browser.

1. **The four services changed.** Content and Marketing merged; Technical
   Solutions was added. Still four. See "Service taxonomy" below.
2. **Every project count is gone** — hero meta, services strip, archive spines,
   panel heads, tiles, list rows, the home slider. The archive is now **one
   continuous run sorted newest-first with no year sections.**
3. **Technical-solutions projects have a profile sheet** — the Ghost of
   Tsushima–style page the user referenced, minus the reviews card. Websites
   additionally open a live preview inside browser chrome.
4. **The about page was rebuilt**: the clippings section stayed, the team grid
   is gone, a long read was added, and each of the four services now has its
   own section (what we do / why us / what's included).
5. **Google Drive** (agency media + projects) was handed over for later:
   `https://drive.google.com/drive/folders/15r6-M6L1Y_lmS-PXta_fBNjOE0gNERAB`
   ⚠️ **Do not pull from it yet** — the user was explicit that nothing is sorted
   there and a lot is still missing. It's for when they say go.
6. **`aliph-chatbot-spec.md`** (repo root) was added by the user and reviewed.
   Nothing has been built. See "Chatbot — status" below.

## What this is

A portfolio website for **Aliph (ألِف)** — a bilingual (Arabic-first) creative studio
based in Jerusalem, Mount of Olives. The brand's soul is the letter **Alif**: the first
letter of the Arabic alphabet, "the point things begin from."

### Service taxonomy (changed 2026-08-02 — four services, new ids)

| id | Arabic | English | note |
|---|---|---|---|
| `identity` | هويّات بصريّة | Identities | unchanged |
| `creative` | تسويق ومحتوى إبداعي | Creative Marketing | **merge** of the old `content` + `marketing` |
| `events` | تنظيم فعاليّات | Events | unchanged |
| `tech` | حلول تقنيّة | Technical Solutions | **new** — software and websites |

The user chose the merged name themselves; don't rename it. The ids are the
join key across `CATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `MQ_ITEMS`,
`SERVICES`, and `data-service` on the home page's service cells — changing one
without the others silently breaks the film-strip hover sync.

Everything so far is a **static HTML/CSS/JS prototype** in `prototype/`. No framework,
no build step. Not a Node/Next project — do NOT try to `npm install` or run Agentation.

## Where things live

```
Brand/                     the brand book, fonts, logos, textures (the "soul")
  Brand Book/Brand-Book-v01-Draft.pdf   14 pages, Arabic — the source of truth
  Assets/Font/OTF/         29LT Idris family (Sharp Extrabold, Flat Regular/Medium/Bold)
  Assets/Logo, Icon, Stamp SVGs (ink #101820; *-cream.svg variants made for dark bg)
  Assets/Textures/Fabric.jpg   linen grain used across the site
resources/                 raw art the user drops in for me to use (NOT served)
  ready.png                the scanned 35mm film strip, bg already transparent
  aliph background.png     torn-paper cutout art for the hero dropcap
  brown film.png, ChatGPT Image ….png, <uuid>.png   older/unused refs
prototype/
  index.html   home (film-strip hero, marquee, services, story, contact footer)
  library.html work archive (category accordion, continuous run) + profile sheet
  about.html   clippings + the long read + one section per service
  style.css    one stylesheet, all pages
  main.js      one script, all pages (i18n + all interactions)
  assets/      fonts + img copied from Brand/ + derived art (see below)
  preview/
    site-demo.html   the stand-in "preview build" the profile sheet iframes
.claude/launch.json   preview server config, name "prototype", port 8321
aliph-chatbot-spec.md the user's chatbot brief (nothing built yet)
HANDOFF.md            this file
memory/               auto-memory (see aliph-website-direction.md)
```

### Derived assets in `prototype/assets/img/` (regenerable with PIL)

| File | How it was made | Notes |
|---|---|---|
| `film.webp` | `resources/upscalled.png` (user's 4× upscale of ready.png, 6144×4096, **alpha flattened by their upscaler**) → alpha transplanted from `ready.png`'s alpha scaled 4× LANCZOS → cropped to the film band `(y 1175–2816)` at **exactly 22 perforation pitches** → 5697×1641, WebP q92 | 0.78MB. **Their pixels, untouched** — only alpha restore + crop. |
| `film-shadow.webp` | `film.webp`'s alpha, offset +15px, Gaussian blur 11, ×0.62 opacity, ink-colored | 210KB. The shadow seen *through* the sprocket holes. |
~~`paper-front.png` / `paper-back.png`~~ — **deleted 2026-07-26.** They backed the
torn-paper dropcap, which is gone for good (see the dropcap section).
**Dead weight was stripped on 2026-07-26.** `prototype/` went 14MB → 9.0MB.
Deleted: `film-strip.png` (superseded by `film.webp`), `ready.png` (a duplicate
of `resources/ready.png`), and six unreferenced logo/icon SVG variants. Also
removed from the shipped code: the whole **testimonials** feature (≈70 lines of
CSS and the `TESTIMONIALS` array — it had no markup on any page), the old footer
CSS, `.lang-btn`, `.svc-body-inner`, and 11 orphaned `I18N` keys.
Everything is recoverable from `Brand/` or git history. If you add a
testimonials section later, the old block is in the history of this commit.

⚠️ I once "enhanced" the film (2× LANCZOS + unsharp + baked hole shadows) and the user
rejected it: **reuse their art as-is.** The pipeline above only restores alpha their
upscaler destroyed and crops it — no resampling of their pixels, no sharpening.

Regeneration recipe for `film.webp` lives in this file's history; the two inputs
(`resources/upscalled.png` + `resources/ready.png`) are both still on disk.

## Design system (locked — don't drift)

- **Colors: ink `#0F1820` + cream `#D9D9CE` ONLY.** Terracotta `#BB5C39` is reserved
  strictly for the nav strikethrough on the current page + focus rings. No other colors.
- ⚠️ **Secondary text uses the tint tokens, never a raw low alpha** (added 2026-08-03):
  `--ink-soft` (0.78) for secondary paragraphs, `--ink-mute` (0.68) for labels, meta
  and captions, `--ink-faint` (0.5) for **large display only (≥24px)** and decorative
  separators. Measured on the cream: ink at 0.6 gives **4.15:1** and 0.55 gives
  **3.6:1** — both fail AA for body text. Twenty elements across all four surfaces
  were failing before this. If you write `color: rgba(15, 24, 32, 0.5)` on anything
  small, you have reintroduced the bug.
- **Type:** Idris Sharp Extrabold = display; Idris Flat = body; Georgia/serif = Latin.
- **Texture over flatness:** linen grain overlays; B&W photography only (placeholders are
  `picsum.photos` seeds — all imagery is temporary).
- **Signature move:** the logo's extending baseline stroke, used as rules/dividers.
- **Voice:** editorial broadsheet — the site behaves like an Arabic newspaper "issue."
- **Scale:** unified `html { font-size: 150% }`; everything is rem-based off that. If
  something looks oversized, the cause is usually a stray vw-based clamp compounding with
  the root scale — fix the element, not the root.

## The three references we're copying MECHANICS from (not aesthetics)

1. **niccolomiranda.com** — overlay nav (stacked huge page names), banner section
   headers, awards-strip → our services counters, oval slide buttons, page transitions.
2. **optikarchiv.com** — the work archive: year headline + count, tile grid, and the
   **sticky year that rides over the grid while scrolling**.
3. User wants edits **copied faithfully to description**, using our fonts/colors. When in
   doubt, match the reference mechanic exactly rather than inventing a variant.

## Homepage — current state

`index.html` order: masthead → **film-strip hero** → **interactive marquee** →
**"ماذا نفعل؟" services** → **"لماذا ألِف؟" story (4 sticky panels)** → **contact footer**.

### The hero panel is CREAM now (inverted 2026-07-26)

The text panel used to be an ink block with cream type. The user asked to
"invert the colors for the hero text and its background (**only**)", so
`.hero-panel` is now cream with ink type, a 3px ink border against the film,
and its own multiply-linen overlay (`.hero-panel::after`) so it doesn't read as
a flat cream slab beside the film. `.hero-eyebrow` / `.hero-title` /
`.hero-rule` / `.dropcap-block` / `.hero-meta` all took the matching ink
treatment. Nothing else on the page inverted.

### Film-strip hero (reworked 2026-07-26 — read this before touching it)

- `#filmScroll` holds one `.film-group` of **4 `.film-frame`s — one per service**
  (`FILM_FRAMES` / `SERVICE_FRAMES` in main.js), then N cloned groups.
- The film graphic is `film.webp` as the element's `background`, `repeat-x`, with
  `background-size: var(--pitch) 100%`. **JS sets `--pitch` to exactly one group width**,
  so one film tile spans one group. The frame slot is **`0.8679 × --fh`** = ¼ of the
  tile's own aspect (5697/1641 = 3.4717), so the scan is shown with **zero stretch**
  (measured 0.9999). If the tile is ever re-cropped, retune that constant to
  `tileAspect / 4`.
- `--fh: calc(var(--hero-h) - 3px)` — the hero's 3px border sits inside its height, so
  the strip is that much shorter. Forgetting this reintroduces a ~0.4% stretch.
- **The film fills the whole hero, edge to edge** (height 100%). The only cream visible
  is what shows *through* the sprocket holes. The user explicitly asked for this — no
  cream bands above/below.
- **Shadow:** `.film-scroll::before` at `z-index: -1` paints `film-shadow.webp` under the
  film image but above the hero's cream, so the shadow is visible **only through the
  sprocket holes** — that is exactly what the user wanted ("not top or bottom"). Baked,
  so no runtime `filter` on a 16000px element.
- **No linen on the strip.** The user identified the linen overlay as what made the film
  "look weird" — the texture layer over the film and the grain over the photos are both
  **removed**; `.film-frame::after` is vignette-only now. Do not add fabric texture back
  onto the film or the frames.
- The page-wide linen (`body::before`) *does* show through the sprocket holes. That is
  **intended and confirmed fine** — the holes are openings onto the background, which
  isn't part of the film.
- **Seeding (`seedX`, fixed 2026-07-26):** the EN/LTR layout used to open with a
  blank gap before the first frame. The thing that has to land correctly is the
  content's **leading edge in strip coordinates** (`originX() + x`), *not* `x`.
  Under RTL a `max-content` track is right-aligned, so `originX()` is a large
  negative number and `x` is the positive translation cancelling it — reducing
  `x` alone (the first attempt) threw the whole strip off-screen. `seedX` shifts
  by whole periods until that leading edge lands in `(-2P, -P]`: one full period
  before the window, so the tween can travel a period either way and still
  cover. A period shift is pixel-identical, so frame 0 stays centred.
- **Measure against `.filmstrip`, not `.hero`.** `windowCenter()` / `originX()`
  both do. `windowCenter()` also detects the **stacked mobile layout** (panel
  above the strip rather than beside it) and returns the strip's own centre.
- **Loop:** `filmLoop` in main.js. It travels **exactly one period and repeats**
  (`repeat: -1`), one direction, constant **34 px/s**. Because the content and the
  background tile are both periodic at `period`, a one-period shift is pixel-identical,
  so the restart is invisible. **Do NOT use a yoyo timeline** — that was the old bug the
  user reported as "keeps switching the side it's moving to and its speed."
- **Hover sync:** hovering a `.service-cell` **or** a marquee item calls
  `filmLoop.focus(service)` → kills the loop, glides that frame to the film window's
  center (`xForFrame` picks the nearest period-equivalent copy), adds `.pop`
  (3D lift + translateZ + rotateX + brighten, caption fades in) and dims the rest via
  `.has-pop`. `filmLoop.blur()` clears it and restarts the loop from the current x.
- Frames are styled to sit *in* the film: hairline ink rebate, cast shadow onto the base,
  inset emulsion darkening, plus a grain+vignette `::after` and a slight sepia in the
  grade.
- ⚠️ Shadows: the user wants depth **at the sprocket holes**, NOT inset shadows on the
  hero's top/bottom edges (I added those once; they were removed on request).

### Hero dropcap — the paper uncrumples (2026-07-26, current)

Built from the user's own clip: `resources/Paper Crumple Effect Green Screen.mp4`.
Rejected before this: the three-layer drifting paper stack, a two-sheet
`rotateX` unfold, and an asset-free letterpress slug. `paper-front.png` /
`paper-back.png` are deleted.

**What the source clip actually is** (the filename is misleading):

- 1920×1080, 2.14s. The background is **blue `(0,102,246)`, not green.**
- It is a **double key**. The blue is the surround; the **green is the paper's
  FACE** — a second chroma surface meant to be replaced with your own artwork.
- Only **0 → 0.88s** is animated: a ball uncrumpling into a flat sheet. After
  that it is a frozen flat sheet. Play it backwards to crumple.

**The bake** (`build_crumple.py`, kept in the session scratchpad — the recipe
matters more than the script):

1. Key blue → alpha, with a soft matte (out below 60, in above 120) so edges
   don't alias.
2. Key green → the face mask (`g - max(r,b)` ramped 25→60).
3. Take **luminance from both surfaces** and re-light: paper stock → cream,
   face → cream × 0.94. This is what keeps every crease and fold.
4. Print the glyph into the face, scaled to the face's bbox, **modulated by the
   same shading** so the ink creases with the paper. It fades in over the last
   ~55% of the clip — you can't read print on a crumpled ball.
5. Rotate 90° (the sheet is landscape, a dropcap wants portrait), resize to
   320×450 cells, assemble a 6×4 sprite.

Output: `crumple-ar.webp` / `crumple-en.webp`, ~153KB each, 24 frames.

**Wiring:** `background-size: 600% 400%` makes one cell exactly fill the
element, so frame maths is `c/(cols-1)` and `r/(rows-1)` in
`background-position`. ⚠️ **The element's width must stay locked to the cell
aspect** (`calc(var(--cap-h) * 320 / 450)`) or the frames letterbox.
`initDropCap()` scrubs a frame index with `ease: "none"` — the frames are
already evenly spaced in time, so easing would fight the motion baked into the
clip. It waits for the sprite to decode before starting.

**Hover crushes it the whole way back to the ball** (`CRUMPLE.crushed` = frame
0) and lets it fall open again on leave. It originally stopped half-way at
frame 10; the user's note was that it *"doesn't retract fully when hovered
upon"* — a partial retract just reads as a sheet that failed to open. The two
durations are deliberately unequal (0.5s in, 0.85s out): crushing paper is
faster than it relaxing back open. The float box keeps its size throughout, so
the paragraph never reflows.

⚠️ **Extracting frames from video here:** seeking (`currentTime` + `onseeked`)
then drawing to canvas returns **stale frames** in headless Chromium — it
reported the clip as completely static, which is wrong. Sample during real
playback with a reduced `playbackRate` instead (floor is 0.0625). Also, a
`file://` video **taints the canvas**; serve over HTTP.

### "ماذا نفعل؟" — latest-work slider (rebuilt 2026-07-26)

The static one-example panel is gone. The stage now shows **the newest projects
in whichever service is selected**, newest first, up to `SLIDER_MAX` (5).

- **Mechanics are unchanged** — the service cells still drive it
  (`activateService` → `svcSlider.setService`). What's new is that each service
  has several pieces, so prev/next step through that category's latest work.
- Every entry in `PROJECTS` now carries a `desc: {ar, en}` one-liner so the text
  column can speak about whichever piece is on screen. (Placeholder copy.)
- **The dead space is fixed by construction:** the grid is `align-items:
  stretch`, `.sl-stage` carries the `min-height`, and `.sl-foot` uses
  `margin-top: auto`. The "كل الأعمال" button therefore lands **exactly on the
  stage's bottom edge** — verified, both bottoms at the same y.
- **`.sl-stamp`** is the newspaper "مؤخّرًا / LATEST" call-out: cream plate,
  double ink rule, rotated ∓7°. Only `idx === 0` wears it.
- **The transition** is a press wipe: the text lifts out while an ink bar
  (`.sl-wipe`) sweeps in from the leading edge, content swaps behind it, the bar
  sweeps off the far edge, and the photo settles out of a slow zoom.
  ⚠️ Everything that depends on the new content is built **inside the `.add()`
  callback, after `paint()`** — tween targets resolved at timeline-build time
  would point at the previous slide. The `.line` node is reused, never
  re-created, for the same reason.
- ⚠️ `paint()` must set the stamp's resting inline styles itself. GSAP writes
  inline, so a leftover inline `opacity: 1` would beat the CSS `:not(.on)` rule.

### Other homepage pieces (all wired in `main.js`)

- **Marquee:** the 4 services + "ALIPH CREATIVE". Hover pauses the bar and syncs the film
  strip; clicking an item jumps to that service in the "what we do" section.
- **`makeLoop()`** (marquee + contact band) uses the same period-exact technique as the
  film: clone a group, travel one period, repeat. No wrap modifier.
- **Both loops are rebuilt on `document.fonts.ready` and on resize** — widths measured
  before the Idris fonts land are wrong and leave a visible gap. This was the cause of
  the "services strip isn't perfectly looped either" report.
- **Services strip:** award-style counters; clicking a cell swaps the example below.
  Oval "كل الأعمال" button underneath (`.svc-cta-wrap`).
- **Story section:** 4 sticky stacked panels (alternating cream / ink) built from the
  brand book — الاسم / الطريقة / النظام / الوعد. Each has an interactive scattered-media
  cluster (mouse-parallax). Panel 4 has an oval "تعرّف على ألِف" button.
- **Contact footer:** hover-inverting scrolling band ("لنبدأ من الألِف"), contact rows
  with a swap-on-hover value animation, spinning stamp, **live Jerusalem clock**, socials.
- **Oval buttons** (`.oval-btn`): hairline ellipse, label slides up to an arrow on hover.
- **Language switch** (`.lang-switch`): segmented pill with a sliding ink knob, top-left
  of masthead. Full AR/EN i18n via the `I18N`/`CATS`/`PROJECTS` dictionaries in main.js;
  choice persists in `localStorage` (`aliph-lang`); `dir` flips RTL/LTR and mirrors layout.

## The data model (`PROJECTS` in main.js) — changed 2026-08-02

- **`count` is gone from every project and every render.** The user asked for
  the number of projects to disappear everywhere it was mentioned. If you are
  tempted to show "N pieces" or "N projects" again, don't.
- **`year` was replaced by `date: "YYYY-MM"`.** `byDate` sorts the whole
  archive as one run; `fmtDate()` renders it as "أيّار ٢٠٢٦" / "May 2026" using
  the `MONTHS` table (Levantine month names in Arabic, not كانون/يناير mixed).
- **`.sc-num` is gone entirely.** It briefly became `.sc-idx` (ordinals ٠١–٠٤
  in place of the counts), then was removed on 2026-08-03 — see the polish
  pass below. The services strip is now label-over-name in a single column,
  and `applyI18n` no longer localises any numeral there.
- The home slider's meta line is now **date · service**, not year · count.

### `profile` — the technical-solutions preview sheet

A project that carries a `profile` object gets a clickable tile and opens the
sheet. Only the four `tech` entries have one today, **but nothing about the
sheet is tech-specific** — give an identity or events project a `profile` and
it just works. Shape:

```js
profile: {
  kind: "site" | "app",     // "site" is what unlocks the live preview button
  tagline: {ar, en},
  body: {ar, en},           // the write-up under the screenshots
  meta: [ { k:{ar,en}, v:{ar,en}, latin?: true } ],   // the details rail
  shots: ["picsumSeed", …],  // first one is the opening screenshot
  preview: "preview/site-demo.html",   // sites only
}
```

`latin: true` on a meta row is for stack strings. It needs its own rule because
the global `.latin` carries `letter-spacing: 0.18em` for all-caps display
strings, which wraps a stack list onto three lines.

The sheet lives in `library.html` as static markup (`#sheet`) and is driven by
the `projectSheet` module in main.js. `applyI18n` calls `projectSheet.refresh()`
so switching language while it's open repaints it in place.

### ⚠️ The live preview iframe — two traps, both already hit

1. **`sandbox="allow-scripts"` alone blocks form submission entirely** — the
   `submit` event never fires, so the preview looked dead. `allow-forms` is
   required *just to let the event fire*; the demo's own handler still
   `preventDefault`s it and nothing is ever sent. **`allow-same-origin` is
   deliberately NOT set**, so the frame runs on an opaque origin and cannot
   touch cookies or storage. Keep it that way — it's what makes "no data is
   collected" true rather than a claim.
2. **That opaque origin CORS-blocks `@font-face`.** Idris silently failed to
   load inside the frame and it fell back to system fonts. `preview/site-demo.html`
   therefore uses **system font stacks on purpose** — which is also the more
   honest choice, since the page stands for a *client's* site, not Aliph's.
   Don't "fix" it by adding Idris back.
3. `wvFrame.src` is reset to `about:blank` on close, so the preview build stops
   running the moment the user closes it.

## Chatbot — status

Two files, and **`aliph-chatbot-plan.md` is the one that governs**:

- `aliph-chatbot-spec.md` — the user's original brief. Keep for context.
- `aliph-chatbot-plan.md` — **the build document**, agreed with the user on
  2026-08-02. It supersedes the spec's §9 open items and narrows §1/§4/§5.
  Where the two disagree, the plan wins.

**Nothing has been built yet.** What was decided:

- **v1 classifies, offers a handoff, and captures a lead. It gives NO
  feasibility read** — the spec's three-bucket "this is something we regularly
  do" framing was dropped on purpose. It was the biggest liability surface and
  wasn't needed to route an enquiry. Don't reintroduce it.
- Leads go to **email** (`info@aliphcreative.com`), **conversations are never
  logged**, the widget is a **corner launcher on every page**, and the
  unavailable state is a **contact card with an explicit notice**.
- It is a **separate deployable** (Cloudflare Worker + vanilla-JS widget), not
  part of `prototype/` — the prototype has no build step and no server.
**Stage 1 is built** (`prototype/chat/aliph-chat.{js,css}`, loaded by all three
pages). Seal launcher bottom-corner, ink/cream panel, contact-card fallback,
AR/EN mirroring the site.

⚠️ **It shows the contact card permanently right now, and that is correct** —
`CONFIG.endpoint`/`CONFIG.health` are `null`, so the probe returns false without
making a request. It is not broken. Stage 3 sets those two constants and the
chat surface appears on its own. Load any page with **`?chat=up`** to review the
chat surface without a backend (`?chat=down` forces the fallback back).

The composer in the "up" state is intentionally inert until stage 3 — see the
notes under plan §11.1 before touching it.

The launcher is an ink disc carrying the studio stamp
(**`HalfAliph-Stamp-cream.svg`**) with "مساعد ألِف" / "ALIPH ASSISTANT" struck
around it on an SVG `textPath` — so there are **two concentric rings of type**:
the stamp's own, and the assistant label outside it. That is the user's explicit
choice, made after seeing a single-ring version built on the bare mark. Don't
"simplify" it back. A top arc rather than a full ring, because at 4.4rem the
bottom half would read upside down.

## ⚠️ The brand stamp still names the old services

`assets/img/HalfAliph-Stamp-cream.svg` has **هويّات بصريّة · صناعة محتوى ·
تسويق … · تنظيم فعاليّات** set around its rim as **outlined vector paths**, not
live text. That is the pre-2026-08 taxonomy — it predates the Content+Marketing
merge and has no حلول تقنيّة.

It is on **every page**: `.contact-stamp` in the shared footer of all three,
plus `.scatter-mark` in the home story panels. So the site's own seal currently
contradicts the four services it advertises.

Because the type is outlined, **this cannot be fixed in the SVG by editing
text** — it needs re-exporting from the Illustrator source
(`Brand/Assets/Stamp/…`, still on the user's disk though no longer tracked).
Flagged to the user 2026-08-02; awaiting their call on whether to re-cut it.

Stages 2–4 are blocked on plan §10 — service examples, voice samples, confirmed
contact details, and who owns the Gemini key.

## Library & About pages

- **library.html:** horizontal **category accordion** (الكل / هويّات / تسويق ومحتوى /
  فعاليّات / حلول تقنيّة as vertical spines). فهرس/معرض (index/gallery) toggle.
  Rendered from `PROJECTS`.
  ⚠️ **The Optik year-calendar is gone** (2026-08-02). The user asked for the
  archive to run continuously, so there are no year headings, no sticky year,
  and no counts on the spines or panel heads. The big top padding that used to
  clear the sticky year was removed with it — if tiles ever start half a screen
  down again, that's the leftover `clamp(4.5rem, 9vw, 8.5rem)` coming back.
- **about.html:** clippings (kept — the user said the first section is good),
  then `.ab-read` (the long read: text column + a sticky facts rail), then
  `#svcAbout`, which `renderServiceSections()` fills from the `SERVICES` array —
  one block per service with what-we-do / why-us / a chip list of deliverables.
  The photo and text swap sides on even blocks so four in a row don't read as a
  list. **The team grid was removed on request** — `.team`, `.member` and the
  `m1Name`…`m3Role` keys are all deleted; they're in git history if wanted back.
- ✅ **The contact footer is now unified across all three pages** (identical markup on
  index / library / about). The old `.footer-inner` / `.footer-title` / `.footer-social`
  CSS has now been **deleted** (2026-07-26). `@keyframes spin` was kept — it moved
  out of the dead `.footer-stamp` rule and still drives `.contact-stamp`.

## Responsive / phone view

- **The hero stacks on ≤900px: text on top, film strip underneath.** `.hero`
  becomes `display: flex; flex-direction: column-reverse` (DOM order is strip →
  overlay), the panel goes full width, and `.filmstrip` becomes static with
  `height: var(--film-h)`. This puts the film strip **directly above the
  marquee**, which is the point — the user wants the two strips connected.
- `.film-scroll { --fh: calc(var(--film-h) - 6px) }` there — the strip's own top
  and bottom borders sit inside its height. Getting this wrong re-introduces a
  fractional stretch in the scan.
- `.svc-latest` collapses to one column with `.sl-stage { order: -1 }` so the
  photograph leads.

## Known-open / next up

1. **The Google Drive is the next big unblock.** When the user says the folder
   is sorted, real media replaces every `picsum.photos` seed: `PROJECTS[].seed`,
   `profile.shots`, `FILM_FRAMES`, `SERVICES[].seed`, and the about clippings.
2. **Library still needs a polish pass** to the same bar as home — the accordion
   mechanics work but it hasn't had a design round since the year sections came
   out, and the panels now have a lot of empty top-left space in the grid view.
3. **The tech `profile` copy and the about service copy are placeholder** — good
   Arabic in the brand voice, but written by me, not by the studio. Real project
   facts (clients, stacks, dates) need confirming before this goes anywhere near
   a client.
4. Only `tech` projects have profile sheets. If the user wants them for the
   other three services, it's data-only — add a `profile` block.
5. The chatbot (see above) is unbuilt and undecided.
6. Spot-check remaining headings for the clipped-Arabic-tops issue (see below).
   The three new ones — `.asvc-name`, `.sheet-title`, and the demo page's `h1` —
   already carry the `padding-top: .12em` fix.
7. Minor, unreported: in EN the Idris Sharp full stop renders as a raised
   diamond in `.hero-title` ("things begin◆"). Left alone — not asked for.

## Polish pass — 2026-08-03 (whole site, client-ready bar)

Run through the `impeccable polish` playbook. What changed, and what was
deliberately left:

- **Contrast was the systemic finding.** Every ink tint below ~0.65 failed AA on
  the cream. Fixed via the three tokens above. Failures went 20 → 0 across home,
  work, about, the profile sheet and the chat widget, at both viewports.
  ⚠️ The first audit under-reported this because it parsed `rgba()` without
  compositing the alpha — if you re-audit contrast, composite against the
  resolved background *and* multiply inherited `opacity`, or you will get a
  clean result on genuinely failing text.
- **The `·` and `/` separators are the one accepted exception.** They sit at
  `--ink-faint` and are `aria-hidden`. Raising them to AA makes punctuation
  louder than the words it divides. ⚠️ `main.js` `paint()` rebuilds the slider
  meta, so the `aria-hidden` had to go in the template too — editing only the
  static HTML silently loses it on the first slide change.
- **`.ab-pull` lost its vertical rule.** A 3px `border-inline-start` on a
  blockquote is the generic quote-callout tab. Aliph's device is the logo's
  *extending baseline* — horizontal — so the rule moved to `border-top`, which
  matches `.hero-rule` and `.asvc-rule`.
- **The chat launcher gained a 1px cream ring.** It floats over the ink story
  panels, the ink banners and the footer, where an ink disc on ink lost its edge
  entirely. Invisible over cream, load-bearing over ink. Don't remove it.
- **The slider progress bar animates `scaleX`, not `width`** — the leftover
  `transform-origin: inline-start` showed that was always the intent. `main.js`
  writes `style.transform` now, not `style.width`.
- **Overshoot easings replaced** on `.oval-swap` and `.scatter-card` with
  `cubic-bezier(0.22, 1, 0.36, 1)`.
- **`.ab-col` capped at 37.5rem** — the long read measured 78ch, now 69ch.
- `<img src="">` removed from the two sheet images; an empty `src` re-requests
  the document URL.

**Knowingly left alone:**

- **`.banner h2` at 209px on desktop.** Over the craft floor's 6rem display cap,
  but it is the broadsheet masthead and the site's signature. The committed
  world wins.
- **`.acc-panel { transition: min-height }`** on mobile. It triggers layout, but
  it *is* the accordion's motion; replacing it means rewriting the accordion,
  which is redesign, not polish.
- **Mobile body measure reads ~26–32ch**, under the Latin ideal. Checked
  visually and it holds: Arabic sets denser than the `ch` approximation
  suggests. Don't shrink the type on the strength of that number alone.
**Then removed on the user's call:**

- **The `.sc-idx` ordinals (٠١–٠٤) are gone.** Section numbers earn their place
  only when the sequence carries information, and four services are not a
  sequence — they were decoration standing in for the deleted project counts.
  Raised with the user, who chose to remove them. The strip rebalanced around
  what was left: `.service-cell` dropped from a two-column grid (which existed
  only to seat the ordinal on the far edge) to a single block, the label gained
  `margin-bottom: 0.5rem`, and the cell padding went 1.5rem → 1.9rem, because
  the ordinal had been carrying the band's vertical mass and without it the
  strip collapses to a thin row of names. Verified: no name clips or wraps at
  either viewport; mobile stays a 2×2 grid where row 1 is taller only because
  "تسويق ومحتوى إبداعي" wraps to two lines.

## Fixes worth remembering

- **Arabic titles were clipped at the top.** `.hero-title .line-mask` had bottom-only
  padding, cutting hamza/alef tips. Now padded on all sides with matching negative
  margins (line spacing unchanged); `.banner h2` got extra top padding. If a heading
  looks cropped, this is the pattern to apply.
- **RTL + `width: max-content`**: such a track is right-aligned, so its natural left
  offset is NOT 0. `makeLoop` measures `baseLeft` before seeding x. Assuming 0 pushed
  every frame off-screen once — check this first if a strip renders blank.
- **The menu button inverts on dark sections.** `syncMenuBtn()` reads
  `document.elementsFromPoint` at the button's centre and toggles `.on-dark`
  (cream bars) when anything in `DARK_UNDER` is in the stack. rAF-throttled on
  scroll/resize, plus a sync at boot, on `fonts.ready`, when the curtain lifts,
  and when the nav closes. ⚠️ The **curtain is deliberately not in `DARK_UNDER`**
  — counting it left the button stuck dark after the curtain lifted, because
  nothing re-sampled until the first scroll.
- **`.lang-switch` is `position: relative` by default**; only `.masthead
  .lang-switch` is pinned. It used to be absolutely positioned unconditionally,
  which yanked it out of the nav overlay's flex footer and dropped it on top of
  the socials. The overlay copy also inverts (cream pill on ink).
  ⚠️ The masthead one uses **physical `left`, not `inset-inline-start`** — the
  burger is physically right, so a logical start would stack them in RTL.
  (I made exactly that mistake mid-session.)
- **`.story-index`** ("٠١" … "٠٤" in لماذا ألِف) was `opacity: .28` and read as an
  invisible watermark. It is now full-strength `currentColor` with a rule under
  it — a section marker, not a texture.
- **`body[data-page="index"] .footer { margin-top: 0 }`** — the shared footer's
  top margin showed as a stray cream strip above the contact band on the home
  page, where the last story panel already butts up against it.

## How to preview / verify

```bash
python -m http.server 8321 -d prototype
```
Or the Browser pane: `preview_start` with name `"prototype"`.

- The Browser pane's `computer{screenshot}` **times out** here. Use **Playwright**
  (installed for Python): launch chromium, `goto(...)`, screenshot, then Read the PNG.
- ⚠️ **Stub the picsum images before _any_ screenshot call, not just for
  deterministic output — it is a hang risk.** `locator.screenshot()` waits for
  the page to settle, and those requests never finish; one run sat wedged for
  half an hour. `page.screenshot(clip=...)` with the stub injected is the
  reliable path.
- **Use `wait_until="domcontentloaded"`, not the default `load`** — the external
  picsum/CDN images often never finish and `goto` times out at 30s.
- **picsum.photos rate-limits** these seeds constantly, so film frames render empty in
  headless runs. For deterministic shots, substitute a local file:
  `document.querySelectorAll('.film-frame img').forEach(i=>i.src='assets/img/Fabric.jpg')`.
  (Remember to say so when showing the user a screenshot — those gray panels are the
  stand-in, not the design.)
- Set `PYTHONIOENCODING=utf-8` when printing Arabic from Python on this Windows shell.
- Useful loop assertion: sample `gsap.getProperty('#filmScroll','x')` every 500ms — the
  deltas must all share one sign and one magnitude (17px @ 34px/s).
- ⚠️ **Stub picsum by serving bytes, not by redirecting.** A `302` to a relative
  local path is not followed from inside the sandboxed preview iframe and
  leaves broken-image icons everywhere:
  `page.route("**://picsum.photos/**", lambda r: r.fulfill(status=200,
  content_type="image/jpeg", body=open(".../assets/img/Fabric.jpg","rb").read()))`
  The session's screenshot script is in the scratchpad as `shots.py`.

## Git

- **Remote: `origin` → https://github.com/AliphCreaitve/AliphPortfolio.git**
- Working branch is now **`main`** (the local branch was called `master`; it was
  renamed, and `fix/restore-about-library-styles` was fast-forwarded into it).
  The old feature branch still exists locally and can be deleted.
- Everything through this session is committed and pushed.
- `.gitignore` excludes `old/` and `old prototype/` — ~9.8MB of superseded
  local snapshots. `resources/` **is** tracked: it holds the inputs the derived
  assets are regenerated from.
- ⚠️ **`Brand/` is no longer in the repo (2026-08-02).** The user deleted it on
  the remote (commit `8739af2`) to get under GitHub's size limits — the folder
  is ~174MB and `NameTag-70x100-3mmBleed.indd` alone is 57MB, over the 50MB
  recommendation. It is now in `.gitignore`, so **the files still live on the
  user's disk** but git ignores them. Every version through `8739af2` remains
  in history: `git checkout 5a47349 -- Brand` restores any of it.
  **The site is unaffected and does not read from `Brand/` at all** — verified:
  no path in `prototype/` points outside itself, and `prototype/assets/`
  (8.8MB) carries its own copies of the four Idris cuts, the logo/icon/stamp
  SVGs and `Fabric.jpg`. If you need brand source art in a future session, ask
  the user for it rather than assuming a clone has it.
- End commit messages with the Claude co-author trailer.

## Working style notes (from this project so far)

- The user iterates in tight rounds of specific edits and often tweaks files between turns
  — always re-read current file state before editing; don't assume your last version is
  intact.
- **Copy references literally.** The user pushes back hard when I "make my own similar
  version" or swap their art for something I generated. Enhance their assets in place;
  don't substitute.
- When a request names a reference image, ask what it's a reference *for* if it's
  ambiguous (background vs. whole element) — I got the film strip and the dropcap wrong
  once each by guessing.
- Real client history exists in **photography and ads**; the studio is new to web/tech.
- All names, counts, and images in the prototype are placeholder content.
