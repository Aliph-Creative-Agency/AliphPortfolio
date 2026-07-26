# Aliph Portfolio — Session Handoff

_Last updated: 2026-07-26. Read this first when starting a new session._

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
| `paper-front.png` | `resources/aliph background.png`, pixels with luma ≥ 205, tight-cropped to `(182, 74, 853, 1511)` | the bright top paper layer |
| `paper-back.png` | same source, full silhouette (alpha ≥ 24), same crop | the whole shape, used as the backing layer |

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

## Known-open / next up

1. **The torn-paper Aliph dropcap is NOT right — the user's top open item.**
   Current attempt: `.dropcap[data-paper]` in index.html stacks `.pl-back` / `.pl-mid` /
   `.pl-front` (from `paper-back.png` / `paper-front.png`) plus a `.paper-grain` linen
   layer masked to the paper silhouette, with the أ icon on top; `initPaperCap()` in
   main.js gives each layer a rest pose, an idle drift, and a hover separation.
   The user's brief was: use `resources/aliph background.png` as the **background** ref,
   **animate its layers**, **add textures and shadows**. They looked at it and said it
   "isn't done correctly" — needs rethinking, likely closer to the ref's two-layer
   torn-paper look.
2. Then: polish **work (library)** and **about** to the same bar as the new home.
3. Cropped-title fix is in (see below) — spot-check other headings for the same issue.

## Fixes worth remembering

- **Arabic titles were clipped at the top.** `.hero-title .line-mask` had bottom-only
  padding, cutting hamza/alef tips. Now padded on all sides with matching negative
  margins (line spacing unchanged); `.banner h2` got extra top padding. If a heading
  looks cropped, this is the pattern to apply.
- **RTL + `width: max-content`**: such a track is right-aligned, so its natural left
  offset is NOT 0. `makeLoop` measures `baseLeft` before seeding x. Assuming 0 pushed
  every frame off-screen once — check this first if a strip renders blank.

## How to preview / verify

```bash
python -m http.server 8321 -d prototype
```
Or the Browser pane: `preview_start` with name `"prototype"`.

- The Browser pane's `computer{screenshot}` **times out** here. Use **Playwright**
  (installed for Python): launch chromium, `goto(...)`, screenshot, then Read the PNG.
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

- Branch: `fix/restore-about-library-styles` (NOT main). Main branch is `main`.
- Latest commit: `4ff1662 Add session handoff notes`.
- **Everything from 2026-07-25/26 is UNCOMMITTED** — the unified footers, the film-strip
  rework, the loop fixes, the title fix, the paper dropcap, and the new derived assets
  (`film.png`, `paper-front.png`, `paper-back.png`). `.claude/settings.local.json` is
  local config, leave it.
- Commit only when asked. End commit messages with the Claude co-author trailer.

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
