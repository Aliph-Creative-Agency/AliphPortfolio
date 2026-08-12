# Aliph Portfolio — Handoff

_Updated 2026-08-12. Read this first._

> ## 🔴 State on 2026-08-12: R2 is live and the work page is full. NOT COMMITTED.
>
> The 2026-08-11 why-section rebuild **is** committed (`40fa851`). Today's work
> is not: eight phone/chrome edits, the gallery wall re-hung dark, and the whole
> media archive on the work page. Nothing is deployed — pushing to GitHub does
> not deploy; that is `npx.cmd wrangler deploy` from the repo root.
>
> ✅ **R2 is solved and no longer a blocker.** The bucket is `aliph-media` on the
> agency's account, public access is ON, and the base URL is
> `https://pub-0b1a78477e8542a28db190d86f861426.r2.dev`. **77 objects, 404 MB**,
> every one verified readable at that address with the right length and
> content-type: `img/` 63 WebP, `video/` 7 faststart MP4, `poster/` 7 frames.
> All seven videos were remuxed `moov`-first before upload.
>
> ⚠️ **The old bucket-root URL in this file was a different bucket** and is dead.
> The one above is the only live base.
>
> ⚠️ **r2.dev is not a production CDN.** Cloudflare rate-limits it and says so.
> A custom domain (`media.aliphcreative.com`) is the real answer before launch.
>
> **Still fabricated, still not shippable:** block 1's paragraph and the three
> block titles. The work page no longer carries invented project entries — it
> shows the media itself, which is what the agency asked for.

**Standing rule: update this file at the end of every session.**

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

**`film.webp` is RGBA and the alpha is load-bearing** — 8% of it is transparent, the
sprocket holes the page shows through. Flattening it to RGB drops the file from
~810 KB to ~145 KB, which is the tell. It must say `RGBA`.

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
(**`0.826630`** since the 2026-08-11 re-cut); re-cut the tile and that number must
change with it. The strip pauses off screen. **It has been blamed for four bugs and
caused none of them** — check the callers first.

🔴 **`recut_film.py` was scoring the wrong feature until 2026-08-11, and it is the
reason the loop looked broken for weeks.** Its perforation detector read
*luminance* through `im.convert("RGB")`, which drops alpha and leaves the bright
rim around each hole scoring as its own run: it counted **43 holes where the tile
has 21**, so the mean pitch came out at half the truth (128.5 against 258.4) and
the seam was graded against a rhythm that does not exist. It pronounced the tile
already optimal at −9.7% while the real seam was **+33%** — a third of a pitch of
extra film between two perforations, once per repeat.

A hole *is* the transparency (8.1% of the tile), so **alpha is the only ground
truth**; the detector reads it now. Re-cut to 5426px (86px off the right), the
seam is **−0.4% top / +0.0% bottom**, and the constant moved 0.839732 → 0.826630.
`film-shadow.webp` and both `-m` variants were regenerated with it; all four are
still RGBA and `film.webp` is 795 KB, nowhere near the ~145 KB that means the
alpha is gone.

The lesson generalises past this file: **measure the thing itself, not a proxy
that happens to correlate.** Two scripts had been tuned against that phantom
rhythm, and both looked like they were working.

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

Three things about it that are easy to get wrong, all of them measured:

- ⚠️ **The two percentages resolve against different bases.** `padding-inline` on
  the track resolves against the parent's width; a slide's `flex-basis` resolves
  against the *content* box that padding just shrank. Writing `flex: 0 0
  var(--reel-w)` looks right and gives you **a third of a third** — 125px in a
  1188px track. The slide is `flex: 0 0 100%`, because the padding has already
  made the content box exactly one slide wide.
- ⚠️ **`scrollLeft` is negative under RTL** and its origin differs between
  engines. Everything is measured with `getBoundingClientRect` centre-to-centre
  and moved with `scrollBy`, which takes a visual delta — neither needs
  `dirSign()`. Verified: after "next", the centred slide is 0.1px off centre and
  `scrollLeft` is −468.
- ⚠️ **`behavior: "auto"` is not "instant".** It means "defer to CSS
  `scroll-behavior`", which this track sets to `smooth` — so the reduced-motion
  branch animated exactly like the other one and the setting did nothing. It is
  `"instant"` now.

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

## The work page (2026-08-12)

One continuous run of **the media itself** — no titles, no captions, no profile
sheet. The agency's call: show the work now, organise it into named projects
later. `PROJECTS` is still in `main.js` and is what the sheet will read when
those exist.

- **70 items**: 9 design pieces, 54 photographs, 7 films. Categories render
  `all` / `design` / `photo`; **`tech` is skipped because it has no media** —
  the software work is sites and systems and there is no screenshot of one in
  the Drive. A spine opening onto an empty panel reads as broken.
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
- **Film is inert until asked for.** The tile shows a ~25 KB poster frame; only
  a click swaps in a `<video>` and fetches any of the 28–84 MB behind it. Seven
  muted loops on one screen is the exact load the phone pass spent a week
  removing.
- The **فهرس / معرض toggle is `hidden`**, not deleted. An index is a list of
  titles and there are none yet; it rendered a column of bare dates. It comes
  back with the project names.

### The R2 pipeline (2026-08-12)

Everything derives from the cached Drive originals, which are **still on disk**
at `…\58773dc5-…\scratchpad\orig` (64 files, 938 MB) and `…\videos` (12 files).
⚠️ **5 of those 12 "videos" are ~2.4 KB of Google interstitial HTML, not media**
— failed downloads that look like files. They are skipped by size. Only 7 reels
and horizontal videos actually came down.

Scripts are in this session's scratchpad and are worth keeping together:
`prep_video.py` (faststart remux + probe), `build_index.py` (EXIF dates),
`posters.py`, `upload_r2.py`, `verify_r2.py`, `splice_media.py`.

⚠️ **`wrangler r2 object put` needs `CLOUDFLARE_ACCOUNT_ID` set explicitly.**
This login reaches two accounts and stops to ask otherwise — which is a hard
failure non-interactively, and publishes into the personal account if answered
wrong. Same reasoning as the pin in `wrangler.toml`.

⚠️ **r2.dev 403s a request carrying a scripting library's default user-agent.**
It is Cloudflare bot protection, and it looks exactly like "public access is
disabled" — all 70 objects reported 403 while being perfectly readable. Send a
browser UA from any verification script. A check that fails for *every* item is
more likely broken than the thing it checks.

## Open questions for the agency

1. **The لماذا ألِف؟ copy is mine, not the studio's.** It is deliberately about
   method, but an earlier pass invented studio history and that reads as true.
   **Do not ship it.** Real copy will not be the same length — re-run `fit_columns.py`.
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
6. ~~`wb2-rail-media` points three ways at once.~~ **Resolved 2026-08-11** — the
   element and all three of its contradictory labels went with the rebuild.
7. **The carousel is showing photographs, not reels.** It is built for 9:16 video
   and the agency has reels; they are on R2's side of the line, so the eight
   slides are portrait photographs at 2:3 cropped ~16% on the width. Landing the
   real reels is a `src` change per slide, nothing more — edit the **eight slides
   in `index.html`**, never the clones, which are built from them at runtime.
   ⚠️ Three of the eight (`portraits-46/47/48`) are frames from one session and
   read as near-duplicates, which is most visible at the wrap where 6 and 0 flank
   7 together. Worth swapping when the reels land.
8. **Which work goes on the gallery wall?** The twelve tiles are a curated
   composition, not a feed — the shapes are fixed and the pictures were chosen to
   fill them. Swapping a photograph is one `src`; changing how many there are
   means re-tiling both the 12×12 and the 6×11 fields.
9. **The nine design pieces have no date**, and the archive shows them undated
   at the end of the run. Their PNGs carry no EXIF at all — this is checked,
   not missing. Either the agency supplies dates, or they stay as they are.
10. **Five Drive videos never downloaded.** The cache holds Google's error page
    instead of the file for `المقاصد`, `tone-colored-1`, `كونكت-معدل`,
    `einar-edited-final` and `الف-للتوكتوك`. Worth a retry if any of them matter.
11. **The 938 MB of camera originals are not on R2** — only the web
    derivatives the site serves. Say if the masters should be archived there too.
12. **A custom domain for the media.** `r2.dev` is rate-limited by design and
    Cloudflare says not to ship production on it.
13. **The home page still serves its own images from the repo**, not R2 — they
    were already committed and working, and churning them buys nothing. The
    work page is the only R2 consumer. Worth unifying if one address is wanted.

---

## Real media — first trial done, and it did not fit

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

⚠️ One Drive filename carried a **broken UTF-16 surrogate** and one console print
killed the whole run. Sanitise names before printing: this box's console is
cp1252 and cannot render Arabic at all — `.encode("ascii","replace")` any name
before logging it, or the script dies with a `UnicodeEncodeError` that looks
like a download failure and is not.

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

Four files were pulled and trialled in the holders. **The design work does not
crop.** Those assets are finished layouts with type baked in at 4:5 — every holder
crops them (keeping 53–80%) and the crop cuts the words. (The second half of that
finding has since expired: the site no longer grayscales, so Grillit's orange stays
orange. **The crop is still fatal**, and it was always the bigger of the two.)

So: the holders in لماذا ألِف؟ want **photographs**, and the design work needs its own
slot at its own ratio. The Drive is organised by *subject*; the site needs *projects*
with a title, date, service and cover. That mapping cannot be derived from the folder
names — the studio has to supply it.

⚠️ **That paragraph is now half-expired.** The home page carries real photographs
throughout — block 1's still, the carousel's eight slides and the gallery wall's
nine tiles. `HOLDER` (an inline SVG data URI) is still what `setHolder()` paints
when an item has no `src`, which is everything the **library and about pages**
show. The `seed` fields on `PROJECTS` are dead data kept on purpose — they are the
shopping list.

### The reel trial — it works, and it is deliberately not in the repo

A real reel was put in `wb2-rail-media` on 2026-08-10 and **the treatment holds**:
1080×1920 H.264, 30.7s, autoplays muted and loops. `.holder > video` was already
styled alongside `.holder > img`, so no CSS was needed. (It was trialled under the
old grayscale grade and read correctly there too, for whatever that is now worth.)

It is **not committed.** The file is 51.8 MB — past GitHub's 50 MB warning, into
every clone forever, and into the Worker asset bundle, for something that should be
served by URL. `prototype/media/` is gitignored. The source lives at
`C:\Users\Obaida\Desktop\finallllllllllll.mov`.

⚠️ **The 9/13 crop is fixed** — the holder that caused it is gone and every
carousel slide is a true 9:16, so a reel now plays uncropped. **The burnt-in
titles are still there**, and with the figcaption gone they no longer collide with
anything, but they will still read as part of the page rather than part of the film.

### Decided 2026-08-10: video lives on R2, at full quality

**Compression is off the table** — the studio's position is that the work has to be
shown at the quality it was made at, and that is a brand call, not a technical one.
So: R2 for video, long term, uncompressed.

That also settles a constraint that had no other answer. **Cloudflare Workers static
assets cap a single file at 25 MiB**, so a 51.8 MB reel cannot ship in the site
bundle whatever anyone thinks about repo size. R2 is not the convenient option here,
it is the only one.

~~⚠️ The R2 URL already in the repo was the bucket root —
`https://pub-90bac6014abe49c594f8ac9c1f1899cb.r2.dev`~~ **Dead — that was a
different bucket.** ✅ **Resolved 2026-08-12:** the live base is
`https://pub-0b1a78477e8542a28db190d86f861426.r2.dev` on bucket `aliph-media`,
and 77 objects are on it. See the banner at the top.

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

⚠️ Two harmless differences that will show up if you diff the files and should not
be mistaken for quality loss: the `.mp4` is **8 KB larger** (the relocated index
needs 32-bit offsets), and **3 of 1477 audio packets** differ where ffmpeg
re-split the last ~0.07s into uniform 1024-sample packets. Total sample count is
identical and the reel plays muted anyway.

⚠️ **A rail loop and a showcase piece are different assets.** The rail box is
474×685 CSS px; a 1080×1920 master is downscaled by the browser to fill it, so the
extra pixels cost bandwidth and are never seen *in that slot*. That is an argument
for a second, smaller derivative for the loop — **not** for degrading the master,
which is what full-screen or lightbox playback should serve. If the work is only
ever shown in a holder this size, the derivative is free quality-wise; if it is ever
opened full-screen, the master has to be there too.

Before blaming markup for a video that will not play, check the container:

```bash
python -c "import struct;d=open('prototype/media/wb2-rail-reel.mov','rb').read();i=0
while i+8<=len(d):
    s,t=struct.unpack('>I',d[i:i+4])[0],d[i+4:i+8].decode('latin1');print(t,s)
    i+=s if s>=8 else len(d)
print('bytes',len(d),'moov at',d.find(b'moov'))"
```

That is how a **truncated** copy was caught here: an interrupted copy left 9,354,776
bytes of a file whose own `mdat` declared 54,265,568, with no `moov` at all. It looked
identical to a wrong `src` — `error.code === 4`, empty cream box.

---

## The scripts in `resources/`

Every derived asset comes from one of these, and the source art sits beside it. They
are the record of *how* something was made — rerun them rather than hand-editing the
output.

| script | what it does |
|---|---|
| `fit_columns.py` | Solves each why-column's body size so its copy fills its box. Run it whenever the copy changes length: `python resources/fit_columns.py ar` |
| `comment_tool.py` | Splits a source file into code segments and comment spans (string- and regex-aware). Used to rewrite comments without touching code, and to prove code is byte-identical afterwards. |
| `recut_film.py` | Re-cuts the film tile so it repeats on a whole perforation pitch. Prints the frame-slot constant `style.css` needs. |
| `fix_rebate_seam.py` | Clears the edge print the tile's right edge slices, and levels the base-tone step across the seam. |
| `build_assistant.py` | Lifts the launcher's ring and double-alif mark out of the studio's artwork into transparent PNGs. |
| `cut_ransom.py` | Cuts the 16 torn paper scraps per language for the headline letters. |
| `build_crumple.py` | Bakes the dropcap's 24-frame sprite from the crumple clip. |
| `extract.py` | Pulls the wireframe's colour-coded boxes out as percentages of the page column. |

⚠️ Several of these **overwrite their output in place**. Back the file up before
rerunning, and check the result's mode and size — a film file near 145 KB has lost
its alpha.

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
