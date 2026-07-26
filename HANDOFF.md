# Aliph Portfolio — Session Handoff

_Last updated: 2026-07-26 (session 2). Read this first when starting a new session._

> **Standing rule from the user: update this file at the end of every session.**
> Not only when asked — it is part of finishing the work.

## What this is

A portfolio website for **Aliph (ألِف)** — a bilingual (Arabic-first) creative studio
based in Jerusalem, Mount of Olives. The brand's soul is the letter **Alif**: the first
letter of the Arabic alphabet, "the point things begin from." Services: visual
identities, content creation, creative marketing, event production.

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
  library.html work archive (category accordion + Optik-style year calendar)
  about.html   scattered clippings + team
  style.css    one stylesheet, all pages
  main.js      one script, all pages (i18n + all interactions)
  assets/      fonts + img copied from Brand/ + derived art (see below)
.claude/launch.json   preview server config, name "prototype", port 8321
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
`prototype/assets/img/ready.png` (2.1MB) is also unreferenced — a leftover of the
film pipeline, whose real input is `resources/ready.png`. Safe to delete; left
alone because nobody asked.

⚠️ I once "enhanced" the film (2× LANCZOS + unsharp + baked hole shadows) and the user
rejected it: **reuse their art as-is.** The pipeline above only restores alpha their
upscaler destroyed and crops it — no resampling of their pixels, no sharpening.

Regeneration recipe for `film.webp` lives in this file's history; the two inputs
(`resources/upscalled.png` + `resources/ready.png`) are both still on disk.

## Design system (locked — don't drift)

- **Colors: ink `#0F1820` + cream `#D9D9CE` ONLY.** Terracotta `#BB5C39` is reserved
  strictly for the nav strikethrough on the current page + focus rings. No other colors.
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

### Hero dropcap — letterpress initial (2026-07-26, final)

🚫 **The torn-paper dropcap is dead. Do not bring it back.** Three attempts were
rejected: the three-layer drifting stack, then a genuine two-sheet `rotateX`
unfold. The user's call was _"quit using the torn paper asset, just bring
something that looks good and works from the libs ur connected to."_
`paper-front.png` / `paper-back.png` have been **deleted** from
`prototype/assets/img/`. The source art is still at
`resources/aliph background.png` if it is ever wanted for something else.

What is there now is asset-free and built on GSAP, which the project already
loads — no new dependency:

- `.dc-slab` — a solid ink slug with the brand linen over it, so it sits in the
  same material as every other ink field on the site.
- `.dc-glyph` — `Aliph-Icon-cream.svg` knocked out of the slug, inside an
  `overflow: hidden` `.dc-letter`, so it rises into place behind a mask. Same
  line-mask move the headlines use. EN swaps to a Georgia "A" in cream.
- `.dc-base` — a cream hairline at the letter's foot: the baseline the rest of
  the alphabet is drawn against, which is the brand's signature stroke.
- `.dc-ghost` — a second ink outline offset ~5px, like a mis-registered second
  pass on a press.
- `initDropCap()` presses it in: slug `scaleY` up from its foot, glyph rises,
  baseline draws out, ghost slides out of register. Hover takes the impression —
  the slug sinks 2px, the ghost pulls further out, the baseline brightens.
- `.dc-glyph img` needs `max-width: none`; the global `img { max-width: 100% }`
  fights the explicit height otherwise.
- Size is `--cap-h` on `.dropcap`, width `calc(var(--cap-h) * .47)`.

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

## Library & About pages

- **library.html:** horizontal **category accordion** (الكل / هويّات / محتوى / تسويق /
  فعاليّات as vertical spines). Opening one reveals the Optik year-calendar with the
  sticky year+count. فهرس/معرض (index/gallery) toggle. Rendered from the `PROJECTS` array.
- **about.html:** scattered newspaper clippings + team grid.
- ✅ **The contact footer is now unified across all three pages** (identical markup on
  index / library / about). The old `.footer-inner` / `.footer-title` / `.footer-social`
  CSS in style.css is now **dead code** — safe to delete, left in place to keep the diff
  small. The about-page `.footer-title` GSAP reveal was removed with it.

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

1. Polish **work (library)** and **about** to the same bar as the new home —
   they have not been touched since the footer unification.
2. Spot-check remaining headings for the clipped-Arabic-tops issue (see below).
3. All imagery is still `picsum.photos` placeholders.
4. Minor, unreported: in EN the Idris Sharp full stop renders as a raised
   diamond in `.hero-title` ("things begin◆"). Left alone — not asked for.

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

## Git

- **Remote: `origin` → https://github.com/AliphCreaitve/AliphPortfolio.git**
- Working branch is now **`main`** (the local branch was called `master`; it was
  renamed, and `fix/restore-about-library-styles` was fast-forwarded into it).
  The old feature branch still exists locally and can be deleted.
- Everything through this session is committed and pushed.
- `.gitignore` excludes `old/` and `old prototype/` — ~9.8MB of superseded
  local snapshots. `resources/` **is** tracked: it holds the inputs the derived
  assets are regenerated from.
- ⚠️ GitHub warns that `Brand/Printables/NameTag/Open FIles/NameTag-70x100-3mmBleed.indd`
  is 54MB, over its 50MB recommendation. It pushes fine today; if the repo gets
  unwieldy, that file is the first candidate for Git LFS.
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
