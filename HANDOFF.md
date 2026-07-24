# Aliph Portfolio — Session Handoff

_Last updated: 2026-07-24. Read this first when starting a new session._

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
prototype/
  index.html   home (film-strip hero, marquee, services, story, contact footer)
  library.html work archive (category accordion + Optik-style year calendar)
  about.html   scattered clippings + team
  style.css    one stylesheet, all pages
  main.js      one script, all pages (i18n + all interactions)
  assets/      fonts + img copied from Brand/ (incl. *-cream.svg + Aliph-Icon.svg)
.claude/launch.json   preview server config, name "prototype", port 8321
HANDOFF.md            this file
memory/               auto-memory (see aliph-website-direction.md)
```

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

## Homepage — current state (all built & committed)

`index.html` order: masthead → **film-strip hero** → **interactive marquee** →
**"ماذا نفعل؟" services** → **"لماذا ألِف؟" story (4 sticky panels)** → **contact footer**.

Key pieces, all wired in `main.js`:
- **Film-strip hero:** frames scroll horizontally behind a faded glass panel holding the
  statement (with the أ drop-cap box that completes the word ألِف / capital "A" in EN).
  Sprocket perforations top/bottom, grain + vignette. Pauses on hover.
- **Marquee:** the 4 services + "ALIPH CREATIVE". Hover pauses the whole bar, each item
  scales up on hover, clicking an item jumps to that service in the "what we do" section.
- **Seamless loops** (`makeLoop()` in main.js): clones a group and uses a modulo modifier
  so wrap points are invisible — used by film strip, marquee, and the contact band.
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

## Library & About pages (built earlier, stable)

- **library.html:** horizontal **category accordion** (الكل / هويّات / محتوى / تسويق /
  فعاليّات as vertical spines). Opening one reveals the Optik year-calendar with the
  sticky year+count. فهرس/معرض (index/gallery) toggle. Rendered from the `PROJECTS` array.
- **about.html:** scattered newspaper clippings + team grid + the older footer variant.
  ⚠️ This page still uses the OLD `.footer` (footer-inner / footer-title). The new
  contact footer lives only on index.html. Unifying them is a likely next task.

## How to preview / verify

```bash
python -m http.server 8321 -d prototype
```
Or use the Browser pane: `preview_start` with name `"prototype"`.
**Note:** the Browser pane's `computer{screenshot}` tool reliably TIMES OUT in this
environment. Use Playwright instead (installed for Python) — launch chromium, `goto`
`http://localhost:8321`, `wait_for_timeout`, `page.screenshot(...)`, then Read the PNG.
Set `PYTHONIOENCODING=utf-8` when printing Arabic from Python on this Windows shell.

## Git

- Branch: `fix/restore-about-library-styles` (NOT main). Main branch is `main`.
- Latest commit: `dfc78e8 Add homepage interactivity: film strip, marquee, story, contact`.
- Working tree is clean except `.claude/settings.local.json` (local config, leave it).
- Commit only when asked. End commit messages with the Claude co-author trailer.

## What's next (user's stated plan)

> "after we finish from the home page we're gonna head for the work and about ones"

So: **homepage is essentially done** — do a final visual pass with the user, then move on
to polishing the **work (library)** and **about** pages to the same bar as the new home.
Likely concrete tasks: unify about.html's footer with the new contact footer; apply the
film/story-level polish and any interaction upgrades to work + about.

## Working style notes (from this project so far)

- The user iterates in tight rounds of specific edits and often tweaks files between turns
  (film speed, drop-cap color, button placement) — always re-read current file state
  before editing; don't assume your last version is intact.
- Copy references literally; the user pushes back when I "make my own similar version."
- Real client history exists in **photography and ads**; the studio is new to web/tech.
- All names, counts, and images in the prototype are placeholder content.
