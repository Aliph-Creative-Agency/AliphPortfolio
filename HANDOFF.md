# Aliph Portfolio — Handoff

_Updated 2026-08-16. Read this first._

> ## 🟢 State on 2026-08-16: committed, pushed, and DEPLOYED
>
> `5d53d5c` — the boss's copy, the service rename, the new DaVinci film strip
> and its emulsion wash, the linen and scroll-gap fixes, the footer wordmark,
> the about page's service repetition removed, and the inline-preview system —
> is on `main`, pushed, and live. See _Session 2026-08-16 (second round)_.
>
> **Verified live, not assumed**: every changed asset compared byte-for-byte
> against the local copy on both hosts, and three pages loaded in a real
> browser with **0 console errors, 0 4xx and 0 broken images**. The work page
> pulls from `media.aliphcreative.com` again — ⚠️ that outage is over.
>
> ⚠️ **Right after a deploy the custom domain can serve stale assets for a
> minute or two** — `film-m.webp` and `film-grain.webp` came back at their old
> lengths on `aliphcreative.com` while `workers.dev` already had the new ones.
> It resolves itself (assets are `max-age=0, must-revalidate`); a cache-buster
> query shows the true origin if you need to check during that window.
>
> Deploy is not automatic: `npx.cmd wrangler deploy` from the repo root, and
> pushing to GitHub does nothing.
>
> 🔴 **The four tech projects and their grey screenshots are now PUBLIC.** The
> agency was told twice and chose to ship. They remain the most visible piece
> of invented content on the site — see open question 14.
>
> ✅ **R2 carries the media, on `media.aliphcreative.com` since 2026-08-16.**
> Bucket `aliph-media` on the agency's account, base URL
> `https://media.aliphcreative.com`. Four prefixes:
> `img/` 63 WebP · `video/` 13 web-ready MP4 · `poster/` 13 frames ·
> `master/` 5 full-quality originals. Every object verified readable at the
> right length and content-type.
>
> 🔴 **One object is still missing: `master/horizontal-maqasid.mp4`.** It is
> 384 MiB and `wrangler r2 object put` refuses anything over **300 MiB**. Its
> *web* version is up and playing — only the master needs a drag-and-drop into
> the R2 dashboard, which has no such cap. Nothing on the site is broken by it.
>
> 🔴 **`r2.dev` is switched OFF and now answers 401.** The custom domain
> replaced it, and the two changes are not independent: the moment public
> access came off the `r2.dev` URL, **the deployed site's work page went to 401
> on every image, poster and film**, because `main.js` still named the old
> host. The constant is flipped in the repo — but that fix is **not deployed**,
> so the live site is broken for R2 media until it is. See _Moving media to a
> custom domain_.
>
> **Still fabricated, still not shippable:** block 1's paragraph, the three
> block titles, and — newly back on the page — the four **tech projects and
> their screenshots**. The sheet that displays them is real; its contents are
> invented. See open question 1.

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

**Model-generated data is plausible in every local detail and still wrong.** A
70-row table read out of file metadata was retyped from a truncated terminal
view: **47 of the 70 rows came back with invented filenames, dates and ratios**,
all correctly formatted, all fake. Nothing looked wrong on inspection and only a
line-by-line diff against the generator caught it. Never retype generated data —
splice it in with a script that asserts the anchor, asserts the row count, and
re-reads the file to diff it afterwards.

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

**`?flat=1` is a diagnostic**, not a design option. The linen is a
viewport-sized fixed layer with `mix-blend-mode: multiply` above everything,
and a blend cannot be composited as a plain layer — the GPU reads the backdrop
back for every affected pixel. On a mid-range phone that can cost a
re-composite of the whole viewport per scroll frame, which would surface as
stutter in anything moving underneath, including the carousel. `?flat=1` drops
the blend at matched apparent strength so only the COST differs. If the
reported jitter goes with it, the blend is the cause; if it stays, the linen is
ruled out.

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

## Moving media to a custom domain — DONE 2026-08-16, except the deploy

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

🔴 **The deploy is the only step left, and it is urgent:** `npx.cmd wrangler
deploy` from the repo root. Until it runs, the deployed site still names the
dead `r2.dev` host and every piece of media on the work page 401s.

⚠️ **The bucket has no CORS policy, and that is fine — don't "fix" it.** A
cross-origin `fetch()` for a media object fails; `<img>` and `<video>` with a
plain `src` do not need CORS and are unaffected. Nothing in `main.js` fetches
media — the lightbox builds a `<video>` element. Only add a CORS policy if
something starts reading media bytes from script.

## Open questions for the agency

1. ~~The لماذا ألِف؟ copy is mine, not the studio's.~~ ✅ **Resolved
   2026-08-16** — the boss's copy doc replaced the hero paragraph, block 1's
   title and body, block 2's title, and all six subcategory descriptions.
   `fit_columns.py` was re-run: Arabic 26.4px, English 20.7px.
   ⚠️ **The ENGLISH of everything that came out of that doc is still mine** —
   the doc is Arabic only — so the English needs the sign-off the Arabic has
   now had. That is the remaining half of this question, not the whole of it.
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
10. ~~Five Drive videos never downloaded.~~ **Resolved 2026-08-16** — all six
    are in. Five were recovered past the scan interstitial; `الف للتوكتوك` was
    a dead Drive file and the agency supplied it by hand.
11. **The 938 MB of camera originals are not on R2** — only the web
    derivatives the site serves. Say if the masters should be archived there
    too. ⚠️ They live in a **temp folder** that Windows can clear; the Drive is
    the only other copy.
12. ~~A custom domain for the media.~~ **Resolved 2026-08-16** —
    `media.aliphcreative.com` is live, all 89 objects verified over it, edge
    caching confirmed, and `r2.dev` is switched off. Only the deploy is
    outstanding.
13. **The home page still serves its own images from the repo**, not R2 — they
    were already committed and working, and churning them buys nothing. The
    work page is the only R2 consumer. Worth unifying if one address is wanted.
    ⚠️ This is now also what kept the home page working while `r2.dev` went
    dark: only the work page broke.
14. **Do the tech projects get real content?** Four entries and their
    screenshots are invented, and they are now on the work page behind a
    profile sheet that presents them as real. Needs titles, dates, write-ups
    and actual screenshots — or the section comes back off.
15. **Does the whole-site paper texture ship?** Built and switchable at
    `?paper=1`, deliberately not enabled. The hero panel and the two banner
    headlines carry it either way.
16. **`master/horizontal-maqasid.mp4` is not in the bucket.** 384 MiB against
    wrangler's 300 MiB single-upload cap; needs a dashboard drag-and-drop. The
    web version is up and playing, so nothing is broken meanwhile.

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

It was **never committed** — 51.8 MB, past GitHub's 50 MB warning and into every
clone forever, for something that should be served by URL. `prototype/media/` is
gitignored and is now **empty**; that reel lives on R2 as
`video/reels-finallllllllllll.mp4` like the rest.

⚠️ **The 9/13 crop is fixed** — the holder that caused it is gone and every
carousel slide is a true 9:16, so a reel now plays uncropped. **The burnt-in
titles are still there**, and with the figcaption gone they no longer collide with
anything, but they will still read as part of the page rather than part of the film.

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
| `cut_paper.py` | Cuts the three paper tiles out of the agency's crumpled-paper scan. Picks each crop's origin by measuring where the wrap is least visible, and curves before blending — see _Crumpled paper_. |
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
