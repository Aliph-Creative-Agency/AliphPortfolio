# Aliph Portfolio — Session Handoff

_Last updated: 2026-08-09 (session 10). Read this first when starting a new session._

> **Standing rule from the user: update this file at the end of every session.**
> Not only when asked — it is part of finishing the work.

## Session 10 (2026-08-09) — five reported bugs, and three more found underneath

The user reported five things off one screenshot set. All five are fixed; three
further bugs surfaced while fixing them. Everything below is verified across
**3 pages × 2 viewports × 2 languages — 0 JS errors, 0 broken images, 0
horizontal overflow, 0 overlaps, 0 empty i18n nodes.**

### 🔴 The launcher's mark was a solid rectangle — a black-on-black composite

`double-aliph.png` is **RGBA whose transparent region is black**. `lift()` in
`build_assistant.py` did `.convert("RGB")`, which composites onto black, so the
entire frame keyed as ink and emitted a filled slab (1.8 KB).

**Composite onto WHITE and multiply by the source alpha.** Both fixes are one
line each and the mark came back at 16 KB. ⚠️ Any future art dropped into
`resources/` may carry the same shape — never `.convert("RGB")` a PNG that
might have alpha.

⚠️ **It was also less than half scale.** Measured against the studio's own
composite (`resources/assistant.png`), the mark is **64.8% of the ring's
height**; the CSS gave it a 28% box. Because the glyph runs the full height of
its square PNG, that percentage *is* the rendered height. Now 65% / inset
17.5%.

⚠️ **`syncLauncherInk()` ran BEFORE the launcher was in the DOM.** Off the
document it measures 0×0 and hits its own `if (!b.width) return`, so the first
paint was never sampled — an ink ring sat on the ink film strip until the first
scroll. Moved after `appendChild`, plus a re-sample on `fonts.ready`.

### 🔴 Two dangling selectors in `aliph-chat.css`, left from the SVG launcher

```css
.aliph-chat[dir="ltr"]        /* ← no block; the comment under it is stripped */
/* comment */
.ac-ring, .ac-mark { … }
```

parses as `.aliph-chat[dir="ltr"] .ac-ring, .ac-mark { … }` — so the **ring only
got its absolute positioning in English**. The second instance was worse:
`.aliph-chat[dir="ltr"] .aliph-chat.is-open` can never match, so **the
full-screen chat panel on phones never applied at all.** Both removed.

⚠️ I also nearly shipped a third of these by leaving orphaned comment text
after a closed `*/`. There is now a cheap check worth re-running after any CSS
edit — it catches all of them:

```bash
python -c "import io,re;s=io.open('prototype/style.css',encoding='utf-8').read();t=re.sub(r'/\*.*?\*/','',s,flags=re.S);print(t.count('{'),t.count('}'),s.count('/*'),s.count('*/'))"
```

Braces and comment markers must balance, and the browser's parsed rule count
(`document.styleSheets[i].cssRules`) must equal the source brace count — 411
for `style.css`, 69 for `aliph-chat.css` today.

### 🔴 The film strip stopped because a killed tween is still truthy

Hovering a `.svc-pick` called `filmLoop.focus()`, which did `tween.kill()`
**without nulling the handle**. `blur()` → `run()` then early-returned because
the hero was off screen. Scrolling back ran `setVisible(true)`, which saw
`tween` as truthy and called `.resume()` — and **`resume()` does not revive a
killed tween** (verified in the page: `isActive` stays `false`). The strip was
dead for the rest of the visit.

Every kill now goes through `stop()`, which nulls the handle. **The session-9
note that this hover binding "costs nothing" was wrong** — it cost the whole
loop, and the binding is now removed: the strip is three screens above the
picks and the glide drove nothing anyone could see. `filmLoop.focus()` remains
for whenever something near the hero wants it.

⚠️ That module has now been suspected four times and been innocent three. The
cause has been, in order: a yoyo timeline, `resize` on the address bar, the art
itself, and now a dangling tween handle. **Check the callers first.**

### 🔴 The tile seam sliced the edge print — and I nearly destroyed the alpha

`recut_film.py` picked the tile width by scoring **perforations only**. 5512px
cuts the rebate mid-wordmark, so the tile ended `KODAK 4` + a 31px sliver and
repeated straight into its own `KODAK 400TK` — two wordmarks ~70px apart where
the film's own spacing is ~2760px.

Re-cutting narrower does **not** work: the width that lands the print cleanly
(~4863) puts the perforation seam **23.7%** off the mean hole gap, against
9.7% today, and narrows every frame by 12%. `resources/fix_rebate_seam.py`
keeps the geometry and clears the sliced print instead, filling from the
film's own 578px blank run. It also levels an **8% base-tone step** across the
seam (the faint vertical line in the user's screenshot) with a gain eased over
900px. Result: print gap 1222px, tone step +3.22 → −0.16, perforation seam
unchanged at −9.7%, aspect unchanged so **the frame-slot constant stays
0.839732**.

⚠️⚠️ **`film.webp` is RGBA and the alpha is LOAD-BEARING** — 8.1% of the tile
is transparent (the sprocket holes and the outer edge) and the page's linen
shows through it. My first pass did `.convert("RGB")` and flattened every hole
to opaque grey. **The tell is the file size: 810 KB → 145 KB.** If a film file
ever lands near 145 KB, the alpha is gone. Check with:

```bash
python -c "from PIL import Image;im=Image.open('prototype/assets/img/film.webp');print(im.mode,im.size)"
```

It must say `RGBA`. Same for `film-m.webp`.

### ماذا نفعل؟ — measured, not eyeballed

The user: *"completely messed up distribution wise, a lot of spaces, too big
elements… the services titles should all be centered, and make the dots
between them bigger."* All measured before and after:

| | was | now |
|---|---|---|
| section height | 826px | **591px** |
| "كل الأعمال" oval | 482 × 219px | **269 × 103px** |
| void, description → button | 165px | **74px** |
| pick / dot type | 97.3 / 33.3px | **74.2 / 39.7px** |

The oval was `width: 100%; aspect-ratio: 2.2` — bigger than the headline above
it. The stage was 58.5% at 5:4 (the wireframe's numbers), which put a 714×571
picture beside ~200px of copy; it is now `1fr 1fr` at 16:10. `justify-content`
went `space-between` → **center**, which is what the user meant by centred: the
dots now sit between the words instead of marooned in 300px of cream.

⚠️ **This overrides the session-9 wireframe measurements for this section.**
The implementation matched the wireframe and the user rejected the result.

### The phone view — four separate faults

1. 🔴 **`.wb2` stacked its two columns on top of each other** — 342×440px of
   overlap. The desktop rules pin both children to `grid-row: 1`, and the
   mobile query reset only `grid-column`. ⚠️ `order` cannot rescue this:
   **order is ignored for explicitly-placed grid items.** Now resets
   `grid-row: auto` too.
2. 🔴 **The open menu's footer was 608px wide inside a 390px overlay**, which
   put the language pill fully off-screen (`left: -127px`) — you could not
   switch language from the menu on a phone — and clipped the last social.
   `.nav-foot` now stacks and `.nav-socials` wraps.
3. **The service picks wrapped**, stranding تصميم alone on a line. ⚠️ The
   cause is that **a `clamp()` FLOOR wins on a phone, not its vw term**:
   `clamp(1.7rem, 5.8vw, 5rem)` is 40.8px at 390px because 1.7rem is 40.8px at
   this 150% root. Only the floor is lowered in the mobile rule — ⚠️ keep the
   **same vw term**, because a steeper one made the names *bigger* at 900px
   than at 1000px.
4. The switcher's button is centred when stacked, which also keeps it clear of
   the corner launcher.

⚠️ **English still wraps to two lines below 900px and that is correct** —
"Film & Photography" cannot set beside two more names at headline scale on a
phone. Arabic holds one line at every width.

### Also done

- **The rule under the hero headline is gone** on the user's instruction —
  markup, CSS and its `gsap.from` reveal. The hairline above `.hero-meta` is a
  different element and was left.

### Still open — unchanged from session 9

The لماذا ألِف؟ copy is still mine and still **must not ship** (it invents
studio history); channel management still has no home in the three-service
taxonomy; the stamp still names the old four services; the coloured
ransom-scrap question is still unanswered; the media holders are still
`HOLDER`; the fonts are still 5.2 MB and still blocked on the 29LT licence.
**Chatbot stage 3 is still the next real piece of work** — see session 9.

⚠️ `prototype/index.html`'s static `heroMeta3` still reads
*"هويّات · تسويق · فعاليّات · تقنيّة"* — the pre-2026-08 four. `I18N` overwrites
it with the three on load, so nothing is visibly wrong, but it is stale
markup and would show if JS ever failed.

## Session 9 (2026-08-08) — three services, and the home page remodelled

The user supplied a hand-drawn wireframe (`Untitled.png` on their desktop) and
was explicit: **"stick with the layout i gave u, its the most important part of
this editing session."** Hero and footer unchanged; everything between them was
rebuilt. Reference is still the Miranda broadsheet.

### 🔴 The wireframe is drawn as the ARABIC/RTL rendering

Read this before touching either section. The drawing is labelled in English,
which makes it look LTR — it isn't. Proof: it puts the example stage on the
left and its description on the right, which is exactly what the *old* slider
already did under RTL (`.sl-text` is DOM-first, so it lands right).

**So: whatever is first in the DOM appears on the RIGHT.** Anything the drawing
places on the left has to be DOM-*last*. I got `why-outro` and `svc-demo`
backwards on the first pass and had to flip both. Verified by measuring the
distance from each element to the viewport edges, not by eye — every
composition now matches the drawing on the correct side, and mirrors in EN.

### The new order — the marquee is GONE

`hero → لماذا ألِف؟ → ماذا نفعل؟ → footer`. The two middle sections swapped, so
the work now shows up in the first screens. **The marquee was dropped on the
user's instruction** — markup, CSS, `MQ_ITEMS`, `buildMarqueeSource`, `MQ_SPEED`
and `mqTween` are all deleted. `makeLoop` stays: the contact band still uses it.

⚠️ **The services↔film-strip hover sync is now invisible.** It was the marquee's
job, and "ماذا نفعل؟" is three screens below the strip. The code is still there
on `.svc-pick` (harmless, and the hero is unchanged) but nobody will see it fire.

### 🔴 Nothing in the two new sections is animated — on purpose

The user: *"we're not animating anything in the new modeled sections for now."*
So the scatter-parallax module, the four sticky story panels, the slider's ink
wipe and the services-cell reveal are all **deleted**, not disabled. The banners
above the sections still rise (page furniture, not section content).

⚠️ **The banner reveal looks broken in headless and isn't.** `gsap.from(...)`
with a ScrollTrigger leaves `opacity: 0` until the trigger fires, and it never
fires if you (a) screenshot full-page, or (b) read it through the Browser pane
while the pane isn't displayed — a non-compositing tab doesn't run rAF, so the
tween sits at progress 0 forever. I chased this as a bug. **Scroll the page with
real wheel events first**, then read: it's `1`.

### The three services — تصميم · تصوير · برمجة

| id | Arabic | English | was |
|---|---|---|---|
| `design` | تصميم | Design | `identity`, plus the printed/posted half of `creative` |
| `photo` | تصوير | Film & Photography | the shooting half of `creative`, plus `events` |
| `tech` | برمجة | Engineering | `tech` (id kept — cheapest possible churn) |

The user picked these names. **`tech` deliberately keeps its id** so the four
profile sheets, `PROJECTS[].profile` and the chat worker didn't all move.

All **23 projects were recategorised by primary deliverable, not by old service
name** (`resources`-free script in the session scratchpad): a signage-and-print
event is design work; a campaign whose deliverable is the footage is photo work.
Lands 10 design / 9 photo / 4 tech. `events` is gone as a service — event work
is now classified by what was actually delivered.

**Subcategories are new and are what the switcher steps through** — `SUBCATS` in
`main.js`, 3 per service (شعارات · مطبوعات · ملصقات / ريلز · فيديو أفقي · صور
ثابتة / بورتفوليو · صفحات هبوط · تطبيقات). Each carries its own `desc`, which is
the wireframe's "description of category and subcategory".

⚠️ **The film strip is still 4 frames** — it's matched to the film tile, whose
width is one group. Photography takes two of the four slots.
`SERVICE_FRAMES = { design: 0, photo: 1, tech: 3 }`.

⚠️ **`chat-worker/src/services.js` was rewritten to match** and **67/67 tests
pass**. Three test expectations encoded the old taxonomy and were updated.
**But dropping `creative` removed the only service that covered *running* an
account** — the three new ones describe what gets made, not who posts it. Social
keywords (انستغرام / سوشيال / instagram / posts) are parked on `photo` with a
comment. **Ask the studio whether they still take channel management** — if they
do, it has no name anywhere on the site now.

### The media holders — `setHolder()` in `main.js`

One component per slot, and **it can become a `<video>`, not just an `<img>`**.
The Drive has 4 horizontal videos (55–384 MB) and 9 reels, and the wireframe
asks for both by name.

⚠️ Videos are `preload="none"`, poster-first, `muted/loop/playsinline`, and
**only play while on screen** (`playWhenVisible`). Four autoplaying videos would
undo every phone fix from session 8 by themselves. `data-kind` on each holder
records which format the real asset should be, so the Drive hand-off knows what
belongs where.

### 🔴 The layout spec is an ANNOTATED wireframe — measure it, don't eyeball it

After two rejected passes the user re-saved `Untitled.png` with the slots
colour-coded: **green = header, red = text, yellow = media, purple = splitter.**
That file is the spec. `scratchpad/extract.py` pulls the boxes out by colour
(flood-fill connected components) and prints every one as a percentage of the
page column — which translates straight into grid tracks. **Do that instead of
estimating; three of my four estimates were wrong by more than 15 points.**

Measured, normalised to the section's content width:

| slot | width | aspect | I had guessed |
|---|---|---|---|
| block 1 film | 69.2% | 3:2 | stretched to text height |
| block 2 rail | 39.9% | 9:16 | 25% |
| block 2 pic 1 | 54.3% of its region | 1:1 | 24% |
| block 2 pic 2 | 56.7% of its region | 7:6 | 28% |
| block 3 centre | **44.6%** | 4:7 | **20%** |
| switcher stage | 58.5% | 5:4 | 58% at 3:2 |

Block 3's centre cut is **the widest element in its block**, not the narrowest.
Gutters are **0.5–1.1% horizontal** (~10px) and **4–9px vertical** — the rules
and column edges do the separating, not whitespace.

⚠️ **The titles deliberately MOVE between blocks**: block 1's sits in the narrow
right column, block 2's spans the left region, block 3's runs full width **and
is centred**. The user called this out specifically — *"notice how i change the
places of the titles, match that dont force them to one side."* Do not
normalise them.

Blocks 2 and 3 also carry **a hairline running out of the headline to the
column edge** (block 3 gets one on both sides, since it is centred). The title
text stays a **bare text node** — no wrapper span — because `applyI18n` writes
`textContent` and would delete one; pseudo-elements survive that.

**Spacing is one token, `--why-gap`** (`clamp(1rem, 2.2vw, 1.9rem)`): title to
body, media to text, and the air above and below every splitter. Splitters are
2px; every media holder carries `--media-line`, deliberately the same hairline
as a splitter.

⚠️ **Two layout ideas were tried and REVERTED on the user's instruction** —
don't reintroduce them thinking they're improvements:
- **block 3 as CSS multicol** (one body flowing round the centre cut), and
- **block 2 as floats** (one body wrapping both pictures).

Both were attempts at *"the text areas are supposed to be connected."* The user
undid each. Block 2 is three rows (text|pic, wide line, pic|text) and block 3
is a three-column grid, exactly as drawn.

⚠️ **Headline sizes come from the green boxes, not from taste.** Block 3's box
is 95.8% wide × 136 tall, which is a **single ~158px line**. Block 1's is 29%
wide × 155 tall — two lines at ~90px in a 400px column. These are Miranda-scale
headlines; anything smaller reads as a subhead and the user will reject it.

### 🔴 Three measurement traps, all of which produced confident wrong answers

1. **`align-items: stretch` + `aspect-ratio` resolves the width FROM the
   stretched height.** Block 1's film came out **1140px wide inside a 936px
   track** and silently walked off spec. The media must never stretch —
   `align-self: start` on every holder. The text columns still stretch.
2. **An `fr` track has an automatic min-content floor**, so longer copy pushes
   a track wider than its fraction. `min-width: 0` on every grid child pins it.
3. **You cannot measure "is this box full" with `getBoundingClientRect()`.**
   A stretched `<p>` is always exactly as tall as its row, so every column
   reported 100% full while block 3 was visibly **13%** inked. Use
   `document.createRange().selectNodeContents(el).getBoundingClientRect()` —
   the inked extent. `scratchpad/fit.py` does this and is the tool to re-run
   after any copy change.

⚠️ Also: **wait for `document.fonts.ready` before measuring.** 5 MB of OTF lands
after first paint and the numbers move between runs until it does.

### 🔴🔴 `var(--display)` DOES NOT EXIST — the tokens are `--font-display` etc.

The user spotted it: *"i noticed u stopped using our fonts."* Five rules in the
remodelled sections said `font-family: var(--display)`. The real tokens are
**`--font-display` / `--font-body` / `--font-latin`**.

⚠️ This failed **silently and plausibly**, which is why it survived a whole
round of review. `font-family` is an *inherited* property, so an undefined
custom property is invalid-at-computed-value-time and the element **inherits**
— every headline quietly rendered in Idris **Flat Regular** (the body face)
instead of Idris **Sharp ExtraBold**. It looks like a font, just the wrong one,
and the services picks looked thin for the same reason rather than because
they needed a weight.

**This is the exact `--terra` bug from session 6.** Second time. If anything
looks slightly off-brand, `grep -n "var(--[a-z-]*)" style.css` and check every
token resolves before touching anything else.

### The wireframe's own numbers for the buttons and the picks

| element | width | ratio |
|---|---|---|
| about oval | 29.9% of its column | 2.6 : 1 |
| work oval | fills its text column | 2.2 : 1 |
| service pick | ~29% each, spread | ink height ~14% of page width |

⚠️ **Three of my CSS replacements silently didn't match and I didn't assert.**
The block-3 multicol, the button sizes and one hero rule all reported success
and changed nothing, and I only found out by measuring. **Every scripted edit
to this repo must `assert old in s`** — `str.replace` on a miss is a no-op that
looks like a success.

### The launcher — a ring that turns around a mark that doesn't

The user supplied `resources/assistant.png` (composite), then
`resources/text-with-background.jpg` (the ring alone). `resources/double-aliph.png`
is the centre mark. `resources/build_assistant.py` lifts both into four
transparent PNGs (ink + cream of each) in `assets/img/`.

⚠️ **Key on INKINESS, not luminance.** Both sources are ink on white; a
brightness threshold that clears the white halo also eats the anti-aliased
edge of every stroke and the type goes ragged at 100px. Rebuilding alpha from
how ink-like each pixel is removes the halo by construction.

⚠️ **The ring must be trimmed to a square centred on the ring**, or it wobbles
as it turns — CSS rotates about the box centre, not the artwork's centre.

⚠️ **There is no disc any more** (the user's call), and the disc was what made
the launcher legible over cream hero, ink banners, ink story panels and the
ink footer alike. Two mitigations, both load-bearing: `syncLauncherInk()` swaps
both layers to cream over anything in `DARK_UNDER`, and each layer carries a
hairline drop-shadow in the *opposite* tone because the launcher sits **on the
hero/section boundary at rest** and can be half on each. Remove either and the
button disappears on some part of some page.

⚠️ The ring art is bilingual and baked, so **the rim no longer switches with
the language** — that is the trade for using the studio's own artwork instead
of the SVG `textPath` that was there before.

### Filling the boxes — per-column type, not one global size

The user, three times: *"the entire box should be filled with the targeted
text… mainly size"* and *"more text, and making it a lil bigger, also having
multiple paragraphs helps."*

A broadsheet does **not** set every column at one size. Each column has a fixed
measure and a fixed depth (the picture beside it), so the type is tuned per
column until the copy lands flush. Those per-column sizes live together in
`style.css` under the `.wb-col` rule and are derived from measured ink-vs-box.
**Retune them whenever the copy length changes** — `fit.py` prints exactly what
to change. Current state: every column **94–105% full**, every slot within
2.5 points of the wireframe.

⚠️ They are tuned for **Arabic**, which is the primary language. English runs
noticeably longer at the same size, so EN columns overshoot their pictures a
little. That is the right trade, but don't "fix" the Arabic to suit English.

### What the earlier compaction pass fixed (the user pushed back twice)

First render was rejected: *"ur leaving a lot of empty spaces… it should be
compact"* and *"make them bigger they're supposed to be like newspaper
headlines."* Both were right, and the cause was **not** spacing:

1. **A picture with a fixed `aspect-ratio` beside a short column sets the row
   height, and the leftover is a cream void as tall as the picture.** The fix is
   `align-items: stretch` + `height: 100%` on the holder so the *text* sets the
   row and the picture crops to it. Voids went from 250–350px down to **0–13px**.
2. **There wasn't enough copy.** A broadsheet fills its columns; four lines
   beside a 400px photo can't. All five `why` paragraphs were lengthened.
3. **Headlines were subheads.** They now span the full column at
   `clamp(1.9rem, 5vw, 4.6rem)` — **72px on desktop** — above the body, not
   beside it. The ordinals (٠١–٠٣) and eyebrows were removed: **not in the
   wireframe**, and the user asked for them gone.

Net: `.why` **2440px → 1751px**, page 5721 → 4921, with more text than before.

⚠️ **Block 2 uses an explicit grid, NOT floats.** Floats were the obvious answer
for "text wrapping a picture" and they were wrong: both figures ended up on the
same side of one tall float, so `clear` pushed the second below every paragraph
and opened a hole a picture tall. `.wb-flow` is now
`grid-template-areas: "p1 m1" / "pull pull" / "m2 p2"` — the zigzag is a *placed*
layout and the areas mirror with the language on their own.
(`float: inline-start/end` *is* valid, unlike `transform-origin: inline-start` —
that isn't, see the session-6 note. Floats were dropped for layout reasons.)

⚠️ **The lead block's grid is on `.wb-lead .wb-body`, not `.wb-lead`** — the
headline was lifted into its own full-width `.wb-head`. The mobile rule still
targeted `.wb-lead` and silently left block 1 **two columns on a phone**: a
180px text gutter beside a 130px sliver of picture. Caught only by screenshotting
the phone viewport. If a block won't collapse, check which element owns the grid.

### The hero is UNCHANGED except for one deletion

A round of hero changes (narrower panel, bigger dropcap, bigger meta) was built
and then **reverted on the user's instruction**. The only thing that stayed is
the removal of the eyebrow — *"استوديو إبداعي — القدس، جبل الزيتون"* and its
rule are gone from `index.html`, and `.hero-eyebrow` is gone from the CSS.

⚠️ The `heroEyebrow` key is still in `I18N` and is now **unreferenced**. Left in
deliberately in case it comes back; delete it if you're doing an orphan sweep.

⚠️ Worth knowing if it is ever revisited: the panel content only just fits. The
upsizing overflowed it top and bottom (`justify-content: center` splits the
overflow in two, so it clips at *both* ends and looks like a crop rather than
an overflow). Anything that grows the dropcap, the paragraph or the meta needs
the rule margins and panel padding reduced to pay for it.

### Verified

0 JS errors, 0 broken images, 0 external images, 0 horizontal overflow, 0 empty
i18n nodes — **across all 3 pages × 2 viewports × 2 languages (12 runs)**. The
switcher steps all 3 subcategories in all 3 services. `chat-worker` 67/67.
Every wireframe slot within 2.5 points; every text box 89–107% inked.

⚠️ Still true from session 8: **`computer{screenshot}` in the Browser pane fails
here** ("pane is not displayed"). Use Playwright, and scroll with real wheel
events before measuring anything ScrollTrigger drives.

### Left open from this session

1. **The copy in لماذا ألِف؟ is mine, not the studio's — and there is now a
   LOT of it.** The user said *"u can write whatever now since we're gonna
   change whats written later."* Filling the wireframe's columns took roughly
   4× the original volume, so the section is ~20 paragraphs of placeholder.
   ⚠️ Most of it is about **method** on purpose, but the first pass invented
   studio history (a room, a camera, a founding anecdote, "we say no more often
   than anyone expects of a studio in its second year"). That reads as true.
   **Do not ship it.** When the real copy lands it will not be the same length,
   so re-run `fit.py` and retune the per-column type sizes.
2. **Channel management has no home** in the three-service taxonomy (above).
3. **The stamp still names the old FOUR services** — and now it's two taxonomies
   out of date. See the section further down; it needs re-cutting from the
   Illustrator source.
4. The ransom-scrap palette question from session 8 is still unanswered.
5. **The media holders are all still `HOLDER`.** Every slot now has a measured
   size and a `data-kind` (`video` / `poster` / `still` / `reel`) saying what
   format belongs in it, so the Drive hand-off has a shopping list. Landing the
   real media is a `src` change — but see the note above about re-running
   `fit.py` afterwards, because real captions and real copy will not be the
   length the current type sizes were tuned against.

### ⏭️ NEXT: chatbot stage 3 — the user now has Google Cloud access

Stages 1 and 2 are built and `chat-worker` is green. Stage 3 is wiring a real
model in, and it is **blocked only on the key**. Two things to get right:

1. **The key must never be pasted into the repo, a file, or this chat.** It goes
   in as a Worker secret, which is write-only from the CLI and never readable
   afterwards:
   ```
   cd chat-worker && npx wrangler secret put GEMINI_API_KEY
   ```
   ⚠️ `wrangler.toml` `[vars]` is **plaintext and committed** — a key there is a
   key on GitHub. Secrets are a different mechanism; don't confuse them.
2. **Where the key comes from decides the SDK.** Google AI Studio
   (`aistudio.google.com`) issues a plain Gemini API key and is the simple path;
   Vertex AI inside Google Cloud uses a service account and a different
   endpoint. The plan assumed the AI Studio style. If they've provisioned Vertex
   instead, `src/model.js` needs the Vertex client, not just a key swap.

Then: `respond()` in `src/model.js` is the seam — the guardrails already run on
both sides of it, so nothing else in the Worker moves. Flip `ALLOW_STUB` to
`"0"` (plan §11) so a missing key becomes a 503 instead of keyword matching
served to a real visitor as if it were the assistant. Finally set
`CONFIG.endpoint` / `CONFIG.health` in `prototype/chat/aliph-chat.js`, which are
`null` today — that is the single line that connects the widget to the Worker.

## Session 8 (2026-08-06) — three phone bugs, and the stock images are gone

The user reported: very laggy on phone but not PC, the film strip no longer
looping, and the chat launcher huge on phone. Plus: drop the stock images and
keep bare media holders. All four done and measured.

### 🔴 The film strip "stopped looping" because of the address bar

This is the one worth remembering. `resize` fired on **every** collapse and
re-show of the phone's browser chrome — height changed, width identical — and
the debounced handler rebuilt the film strip and the marquee on each one. A
rebuild tears down the strip's DOM, rebuilds it and re-seeds `x`, so the strip
visibly **snapped back to its start every time you scrolled**. Reads exactly as
"it isn't looping any more."

The handler is now **width-only** (`main.js`, bottom of file). Neither loop
depends on viewport height. Measured: height-only resize → **0** rebuilds
(was 1 per event), real width change → still rebuilds.

⚠️ The loop itself was never broken. Sampling `x` in headless showed a clean
34 px/s at both viewports the whole time. If someone reports the loop dead
again, check what is calling `rebuild()` before touching `filmLoop`.

### 🔴 71 MB of texture for a strip 390px wide

The biggest phone cost on the site, and **invisible in the file sizes.**
`film.webp` and `film-shadow.webp` are both **5697×1641**. A browser decodes an
image at its intrinsic size no matter how small it is painted, so those two
cost **~71 MB of RGBA** — on a phone that draws them into a strip ~390px wide.
On disk they are only 798 KB + 210 KB, which is why this never showed up in a
payload audit.

Added `film-m.webp` / `film-shadow-m.webp` at **1900px**, swapped in under
`@media (max-width: 900px)`. Same pixels, fewer of them — a resolution variant,
**not** a re-render and not a substitution of the art. 1900 rather than the
~638px the tile actually draws at, because a DPR-3 phone renders that tile at
~1914 device px and sizing to the CSS width would look soft exactly where most
people see it. **~71 MB → ~8 MB.** Desktop keeps the full-size files (`--pitch`
is ~2433px there).

`Fabric.jpg` (1920×1313, 2.4 MB, ~9.6 MB decoded) → **`fabric.webp`**
(1100×752, 372 KB, ~3.2 MB decoded), swapped everywhere including the chat
widget. Safe at every call site: all 10 uses set `background-size` explicitly
and the largest is 1100px, so nothing is upscaled. This was the cheapest big
win flagged in session 6 and is now done.

### The stock images are gone — `HOLDER` in `main.js`

Every `picsum.photos` URL is replaced by one inline-SVG data URI (`HOLDER`,
top of `main.js`; the 15 static ones in `index.html`/`about.html` carry the
same string). **Third-party hosts on the home page went from picsum + jsdelivr
to jsdelivr alone**; 37 holders render, 0 broken images.

⚠️ It is an `<img>`, deliberately, **not a `<div>`**. Every image on the site is
styled through `img` selectors — `object-fit`, the grayscale grade, sizing —
and swapping the element type silently drops all of it. This way the markup,
the alt text and the cascade are already what they will be when real
photographs land: **the only thing that changes then is the src.**
Don't reintroduce an external placeholder service, and don't use `src=""` —
that re-requests the document.

`#sheetCover` / `#sheetShot` in `library.html` are seeded with the same holder,
which closes the last two `broken-image` findings from the session-6 audit.
**All three pages now report 0 JS errors, 0 broken images, 0 external images**
at both viewports.

⚠️ `Fabric.jpg` is now unreferenced but **kept on purpose** — it is the source
`fabric.webp` is derived from, and `Brand/` is no longer tracked. Delete it
only if you are sure the brand folder is still on disk.

### The chat launcher was 105.6px on a 390px screen

`html { font-size: 150% }` means **1rem is 24px**, so the launcher's `4.4rem`
was 105.6px — over a quarter of the width of a phone, and about double what a
corner launcher should be. There *was* already a `@media (max-width: 560px)`
block in `aliph-chat.css`, but it only made the **open panel** full-screen; the
launcher had no mobile sizing at all.

Now `--ac-launch`, 4.4rem desktop → **3rem (72px) at ≤560px**. Verified 106px →
72px. The rim label is sized in viewBox units so it shrank with the disc and
became texture rather than a word; its font-size is scaled back up in the same
block rather than dropping the outer ring, which is the user's explicit design.

### Where the payload stands now (measured, phone viewport)

```
font         5210 KB   ← 83% of the page, and untouched
image         839 KB   (was ~3600 KB)
script        143 KB
stylesheet     72 KB
document       20 KB
total        6283 KB   (was ~8.9 MB)
```

**The fonts are now the whole story.** Four raw OTFs at ~1.3 MB each,
`format("opentype")`, no WOFF2, no subsetting. `font-display: swap` is already
set on all four, so they don't block first paint — but 5.2 MB still crosses a
mobile connection and four OTFs still get parsed. ⚠️ **Still blocked on the
licence question** (plan: ask before converting — 29LT is a commercial foundry
and the kit may already exist). This is the single remaining lever on phone
performance and it is the user's call, not a mechanical fix.

### How the site deploys (found the hard way, 2026-08-06)

**The site is a Cloudflare Worker serving `prototype/` as static assets**, at
`aliphcreative.ceo-6c6.workers.dev`. There was **no deploy config in the repo**
— it had been deployed by some out-of-band route — so `wrangler.toml` at the
repo root is new. `npx wrangler deploy` from the repo root ships the site;
from `chat-worker/` it ships the chat backend. Two configs, two deployables,
run wrangler from the one you mean.

⚠️ **Pushing to GitHub does NOT redeploy.** This cost a whole exchange: a bug
report came in against a build that was two commits stale, and both of the
reported bugs were already fixed in code that had never been deployed. Verify
before debugging a phone report — fetch the live asset and grep it:

```bash
curl -s https://aliphcreative.ceo-6c6.workers.dev/main.js | grep -c pauseOffscreen
```

A cache-buster query (`?v=123`) rules out edge cache; `CF-Cache-Status: HIT`
on a stale file is not proof of a stale deploy, an absent code marker is.

Worth doing when someone gets to it: connect **Workers Builds** to the repo so
`main` deploys itself. The account subdomain `ceo-6c6` identifies which
Cloudflare account owns it — a Worker's `*.workers.dev` middle segment is
account-level, so two Workers in one account always share it. That is the
fastest way to tell whether you are looking at the right account.

### Second pass, same day — the oval button, and idle animation

**The oval button clipped its own label.** `.oval-swap` had `width: 100%` and
**both** faces (`.ob-label`, `.ob-arrow`) were `position: absolute` — so
nothing in it contributed intrinsic width, the button never grew past its
`min-width` (150px on a phone, 86px of which is padding), and `overflow:
hidden` sliced the text at both ends. "تعرّف على ألِف" rendered as
"ـرّف على أَلِ". The label is in flow now and is what sizes the swap; only the
arrow stays absolute. ⚠️ The override **must sit after `.ob-face`** — same
specificity, so source order decides, and above it the label stays absolute
and the swap goes back to 0px. I made exactly that mistake first.

**The three loops now stop when they're off screen.** The marquee, the contact
band and the film strip ran continuously forever, each retransforming a
composited layer every frame while you were scrolled a page and a half past
them. `pauseOffscreen()` (an IntersectionObserver, `rootMargin: 150px`) pauses
rather than kills, so `x` survives and nothing jumps on the way back.
⚠️ `filmLoop.setVisible()` also gates `run()`, or a hover-blur restarts the
strip while it is off screen. ⚠️ `rebuildLoops()` makes *new* tweens and a new
tween plays on creation, so it re-checks visibility after building.

**`syncMenuBtn` ran a hit test every scroll frame.** `elementsFromPoint` forces
a synchronous layout flush plus a full hit test, then `closest()` walks an
8-selector list per element returned. Now spaced to ~100ms with a trailing
sync when scrolling stops — five of every six hit tests gone, and the burger
inverting 100ms later is imperceptible. The trailing call is load-bearing:
without it the button can be left wrong wherever the scroll happens to stop.

⚠️ **I could not reproduce the phone jank locally and did not pretend to.**
Headless Chromium held a flat 60fps through a hard scroll even at 6× CPU
throttle, with the linen blend, the section blends, `will-change`,
ScrollTrigger and the image grade each disabled in turn — all six runs were
identical. CPU throttling does not throttle the GPU, and a phone's limit is
compositing and memory bandwidth. **This machine cannot measure the bug.** The
fixes above are the defensible ones; the phone is the only instrument that can
confirm them.

Still untouched and still suspect if it persists: `body::before` is a **fixed,
full-viewport, `mix-blend-mode: multiply`** layer at `z-index: 5`, which
prevents the compositor's fast scroll path. Left alone deliberately — swapping
multiply for normal blending is *not* visually neutral (over the ink story
panels a light linen at normal blend turns into a grey haze instead of
vanishing), so it needs a design decision, not a perf patch.

### The Drive was opened and audited (2026-08-06)

The user asked me to look. ⚠️ **The Drive MCP connector returns nothing for
this folder** — `parentId = '15r6-…'` comes back empty even though the folder
resolves by id and is shared "anyone with the link". Read it with the headless
browser instead (`/browse`, then `$B text` per folder).

`aliph website/` holds four subfolders and no loose files:

| folder | contents |
|---|---|
| `graphic designs` | 9 PNGs — Grillit (جريلت) + shawarma variants |
| `horizintal videos` | 4 videos, 55–384 MB |
| `reels` | 9 vertical videos |
| `pics` → 10 subfolders | ~54 JPEGs, 3.5–52 MB each, straight off the cameras |

**The photography itself is exactly right** — big, uncropped, unexported.
**The organisation is not:** it is sorted by *subject* (`food`, `portraits`,
`students`, `idk category`), and the site's archive is organised by *project*,
each needing a title, a date, a service and a cover. That mapping cannot be
derived from the folder names.

Three of the four services have almost nothing: **identities** has only
Grillit, **events** has nothing identified, and **tech** has **zero
screenshots** (the profile sheets need them and `Queen retreat` is photos of
the retreat, not the portal). The 13 videos have no slot anywhere on the site.

The full brief of what to send back was given to the user on 2026-08-06:
one folder per project named `YYYY-MM — name` with `cover` + numbered extras
(+ a `screens/` subfolder for sites), one sheet row per project, ≥3 projects
per service, ~15 loose studio shots, originals not exports, colour not B&W.

### Third pass, same day — the film tile, the contacts, the language pill

**🔴 "The loop isn't perfect" was the TILE, not the tween.** Worth reading
before anyone touches `filmLoop` again — that module has now been suspected
twice and been innocent twice.

The tween is exact: `--pitch` equals the group width to the pixel at every
viewport, constant 34 px/s, no discontinuity. What was wrong is the art.
Measured on **both** perforation rows of `film.webp`:

| | inside the tile | across the seam |
|---|---|---|
| sprocket gap | 127.9 px | **69.5 px** |

Every repeat crowded two perforations almost on top of each other — one visible
rhythm break per period. The old crop ("22 perforation pitches", by eye) simply
did not land on a whole pitch.

`resources/recut_film.py` re-cuts it. Two things in there are load-bearing:

- ⚠️ **It crops from the RIGHT only, x0 stays 0.** The film's frame windows are
  baked into the art and the DOM frames are laid out from the group's left
  edge, so trimming the left slides every frame off its window by the amount
  trimmed.
- ⚠️ **It SEARCHES for the width instead of deriving it.** I derived it by hand
  first, assuming the tile's final gaps matched the mean — they are 95.5px, so
  the computed width still left the seam 30% tight. The search scores every
  candidate against both rows and rejects any that would slice a hole.

**5697 → 5512px. Seam now within 9.7% of the tile's own mean gap**, which is
inside the art's natural jitter (119–140px), so it reads as just another gap.
That is the ceiling for this asset — the jitter is why session 6 concluded the
art is generated, not scanned.

⚠️ **Re-cropping the tile changes its aspect, so the frame-slot constant in
`style.css` must be retuned to `tileAspect / 4`.** Now `0.839732` (was
`0.8679`). The script prints the value. Verified after: pitch == group width
exactly and the scan renders at 0.9999 stretch, both viewports.

**Phone and WhatsApp are now DIFFERENT numbers** (studio-confirmed
2026-08-06). Display `052-874-5090` for the phone on all three pages;
WhatsApp is `+972594097725`. The chat widget grew its own `whatsappLabel` —
⚠️ anything still reusing `phoneLabel` for the WhatsApp row is now a bug.
The `tel:`/`wa.me` targets stay E.164; only the label is the local form.

**The language pill is `position: fixed`**, not absolute, so it rides down the
page with the burger instead of scrolling away with the masthead; `top` centres
it on the burger's centre line. It takes the same `.on-dark` inversion.
⚠️ **Sampled separately from the burger** — they are at opposite corners and
are regularly over different sections at once (verified at 30% scroll, where
the pill is over ink and the burger is not). ⚠️ `body.nav-open` hides the
masthead copy, or the fixed pill floats above the overlay and you see two.
`syncMenuBtn()` now drives both through a shared `overDark(el)` helper.

### The hero's أ is a ransom-note clipping now (merged from `visual/ransom-hero`)

The أ of **نبدأ** and **تبدأ**, and the Latin **A** of "st**a**rt", are replaced
by the studio's own photographed paper scraps, and they keep re-cutting
themselves. ⚠️ **Only those two verbs** — الأشياء and ألِف were ruled out by the
user; don't add them back.

**The word is split three ways, `[before][letter][after]`** — the user's idea,
and better than the per-character split I proposed: less markup, the headline
stays readable text, and it doesn't fight `.line-mask`'s padding.

⚠️ **ARABIC SHAPING is the hazard here.** Pulling a letter into its own element
can force its neighbours into isolated forms and visibly break the word. It is
safe in these two for a specific reason, not luck: the letter before the أ is
**د**, which never joins forward, so that أ already rendered isolated —
measured, whole 90.25px vs split 90.27px. `splitSafe()` in `main.js` enforces
the rule rather than trusting it, so a future copy change that puts the أ after
a joining letter (ب ت ن س ع …) leaves that word **whole** instead of shattered.
⚠️ It exempts Latin, which has no joining at all — the Arabic rule was silently
rejecting "start" until that was added.

**The art:** `resources/ransom {arb,eng}.png`, 16 torn scraps per language on a
pure-black backdrop, cut by `resources/cut_ransom.py` to
`prototype/assets/img/ransom/{ar,en}-NN.webp` (320px tall, ~16 KB each).

⚠️ **The extraction trap:** a plain luminance key erases half the set. Several
scraps are **black paper with a light letter**, so their interior sits within a
few levels of the backdrop — keying on brightness deletes them or punches holes
through the ones it keeps. What separates them is that the backdrop is exactly
`0` and paper never is. So: very low threshold, then close the holes by filling
each row *and* each column between its outermost paper pixels and keeping only
what both agree on. The torn silhouette survives because the outermost pixel in
a row **is** the tear.

**The cycle** (`ransomCycle` in `main.js`): each chip swaps scrap and angle
every **0.65–1.5s**. Hard cuts, not tweens — paper doesn't ease from one piece
into another, and a cross-fade reads as a slideshow.
- ⚠️ **Each chip needs its own randomised timer.** Sharing one made both letters
  flip in lockstep, which instantly reads as a mechanism. Verified: 0
  simultaneous swaps across a 20s window.
- ⚠️ **Every scrap in a ring is preloaded when the chip is built.** A swap that
  has to fetch shows a hole where the letter was — the one frame of this that
  looks broken rather than deliberate. Verified 0 blank frames.
- Rings are **5 of the 16**, sliced differently per load: a visit pulls ~10
  files, not 32, and still varies between visits.
- Paused when the hero leaves the viewport, same rule as the loops. Static
  under `prefers-reduced-motion`.
- The letter stays in the DOM as a visually-hidden span, so the headline still
  reads correctly to a screen reader and copy-pastes as نبدأ. A 404 falls back
  to showing the real letter.

⚠️ **These scraps break the palette.** The set includes red, purple, brown and
blue-ruled paper; the system is ink + cream only with terracotta reserved. All
16 are in use deliberately — a ransom note that matches isn't one, and the
standing rule is to use the studio's art as given. **Raised with the user and
not yet settled.** Restricting it is a one-line change: shorten the ring pool
in `main.js`.

### The film's cast shadow is OFF (2026-08-08)

`.film-scroll::before` used to paint `film-shadow.webp` under the film and above
the hero's cream, so it read only through the sprocket holes. Removed on
request. ⚠️ **It did more than halo the holes — it darkened the whole base.**
Without it the strip reads slate-grey and crisper instead of near-black and
deep. `film-shadow.webp` / `-m` stay on disk and are still re-cut by
`recut_film.py`; the CSS comment says exactly how to restore the rule. Verified
0 requests for either file at both viewports.

### Open, and waiting on the user (2026-08-06)

1. ✅ **The services changed to three — DONE 2026-08-08.** تصميم · تصوير ·
   برمجة, with three subcategories each. See session 9 at the top of this file.
2. ✅ **Animated ransom-note أ — DONE 2026-08-08**, merged from
   `visual/ransom-hero`. See the section above.
3. **Whether the coloured scraps stay** (red / purple / brown / blue-ruled)
   against the ink-and-cream rule. Raised, not answered.

## Session 7 (2026-08-05) — chatbot stage 2: the Worker + guardrails

`chat-worker/` at the repo root is new and is **the whole session**. Nothing
in `prototype/` was touched. Plan §11 stage 2 is now ✅; the plan file carries
the detail, this is the orientation.

**It is a separate deployable** (plan §4) — the prototype has no build step and
must keep it that way. Cloudflare Worker, two routes:

```
GET  /api/health   { ok, quotaRemaining, model, stub, durableRateLimit, … }
POST /api/chat     { messages[], lang }   header: X-Aliph-Session
```

**The order of operations is the design:**

```
CORS → validate → rate limit → PRE-FILTER → model → POST-FILTER
```

Pre-filters run before the model so a pricing question or a jailbreak attempt
costs no quota and can't depend on the model behaving. The post-filter runs
after it because the model is the one component here that can't be trusted to
hold a rule. All seven of plan §5's rules are enforced in code.

**The model is a keyword stub, not a classifier.** `respond()` in
`src/model.js` is the seam — stage 3 adds Gemini beside it and nothing else in
the Worker moves, because the guardrails already run on both sides of that
call. The stub exists so the flow and the filters are testable without a key.

**67 tests, ~150ms, no key / no network / no wrangler** — the fetch handler
runs under plain Node and the rate limiter falls back to an in-isolate Map:

```bash
cd chat-worker && npm test
```

⚠️ **Traps hit this session, all three worth keeping:**

1. **A Worker entry module may only export the default handler and Durable
   Object classes.** `export const VERSION` made workerd refuse to boot
   (*"Incorrect type for map entry 'VERSION'"*). Node imports it happily, so
   **the test suite cannot catch this class of error** — run `wrangler dev`
   once before shipping any `index.js` change.
2. **Arabic clitic stripping is greedy and will eat real letters.** A chain of
   optional single letters (`^(?:و|ف)?(?:ب|ك|ل)?(?:ال)?`) turns `وكم` into
   `م`. Strip only the conjunction and the **article** — never a lone
   preposition.
3. **`\d` is ASCII-only in JS regex**, so `٢٠٠٠ شيكل` is invisible to a price
   detector until `norm()` has folded the Arabic-Indic digits. The post-filter
   tests both the raw and the normalised copy.

**Two contracts not to break:**

- `ok` and `quotaRemaining` in the health response are read *by those exact
  names* in `prototype/chat/aliph-chat.js` → `probe()`. Renaming either sends
  every visitor to the contact card, silently.
- `ALLOW_STUB = "1"` in `wrangler.toml` is **stage-2 only**. Stage 3 flips it
  to `"0"`, after which a missing key is a 503 rather than keyword matching
  served to a real visitor as if it were the assistant.

**The guardrail bans are curated phrase lists, not patterns — on purpose.**
`/we can\b/` also swallows *"we can put you in touch with the team"*, the one
sentence this bot exists to say. And describing a service ("we do visual
identities") is **not** a feasibility read; job #1 in plan §9 is answering
questions about the four services. Only capability or commitment *about the
visitor's project* is banned. Same reasoning for `كم`: bare, it is "how much"
and "how many" both, and it lands on `كم يستغرق` (how long) as often as on
money — so it's a weak signal needing a second one, while `بكم`/`قديش` fire
alone.

`chat-worker/src/services.js` **must stay in sync with `CATS` in
`prototype/main.js`.** Its `examples` and `kw` lists are placeholders I wrote,
not the studio's — plan §3 is explicit that placeholder examples produce
placeholder classification, and that's plan §10.1's first ask.

Stage 3 (Gemini) is blocked on §10.4 — who owns the key. Stage 4 (lead email)
needs §10.3 — confirmed contact details. Stage 5 (the adversarial pass) is not
optional and not a formality.

## Session 6 (2026-08-05) — measurement pass; one bug fixed, one big finding

Two commits landed on `main`, and a large visual branch was built and then
**deleted on the user's instruction**. Read the deletion note before assuming
anything from this session exists in the tree.

### What is actually on `main` now

| commit | what |
|---|---|
| `b5c9504` | Restore the focus rings killed by an undefined `--terra` |
| `c64a68f` | Revert "Drop the services-strip ordinals" — **the ٠١–٠٤ ordinals are BACK** |

The ordinals were dropped in session 5 and restored in session 6, so the strip is
a two-column grid with `.sc-idx` on the far edge again. `c64a68f` reverted the
documentation along with the code, so the rest of this file is already
consistent with that — the sections describing `.sc-idx` as present are correct.

### The `--terra` bug (fixed, `b5c9504`)

`style.css` referenced `var(--terra)` seven times. `--terra` is defined **only**
in `preview/site-demo.html` — a document loaded into a sandboxed iframe on an
opaque origin, which cannot reach the parent stylesheet. A `var()` naming an
undefined custom property is invalid at computed-value time, so the shorthand's
longhands fall back to `unset` and `outline-style` lands on its initial `none`.
All seven selectors are **more specific** than the global `:focus-visible`, so
they won the cascade and then evaluated to nothing.

Keyboard focus was invisible on every archive tile, every index row, the sheet
thumbnails, and **both modal close buttons** — the only way out of a dialog.
Two others (`.asvc-index`, the `◦` marker on `.lib-list-row.has-profile`) were
`color:` and had been rendering inherited ink instead of terracotta.

All seven now use `var(--accent)` — same `#BB5C39`, and the palette's single
accent token rather than a second alias. **Don't reintroduce `--terra`.**

⚠️ **Verifying focus on this site needs the containers open.** `.sheet-close`,
`.wv-close` and `.lib-list-row` are `display: none` at rest, and `.focus()` is a
no-op on a hidden element, so a naive probe reports a false negative. Switch to
the فهرس view and open both modals first. I reported these three as still broken
once because of exactly this.

### ⚠️⚠️ The film strip is AI-generated art, not a scan

This is the most important thing in this file. `resources/ready.png` has been
described here as "the scanned 35mm film strip" since session 2. **It is not a
scan.** Measured against ISO 1007:

| | `ready.png` | real 35mm |
|---|---|---|
| perforation pitch | **5.40 mm**, jittering 34–67px between holes | 4.7498 mm, ±0.01 mm |
| perforation width | **2.32 mm** | 1.981 mm |
| edge print | **"KODAK 400TK"** | `400TMY` / `TMY-2` / `5053 TMY` |
| source size | **1536×1024** | — |

Machine-punched film does not jitter. "400TK" is not a Kodak stock code.
1536×1024 is a generation size. The 4× upscale in `upscalled.png` locked the
wrong geometry in, and `film.webp` inherits all of it.

The user's standing rule is "reuse their art as-is, don't substitute" — **that
rule does not protect this asset**, because they did not make it and have said
so once they saw the measurements. They approved replacing it. A replacement was
built and then deleted with the branch (see below); the recipe is recoverable.

If it gets rebuilt: the user's stated preference was **cut it to real spec**
(35.00mm width, 38.00mm frame advance = 8 perforations, KS-1870 holes at
2.794 × 1.981mm, pitch held at exactly 38.00/8 so the tile seams) with the real
emulsion grain high-passed out of their own scan so the surface stays their
material — **and hunt a genuine photographic scan as a backup**. Also: their own
negatives are the ideal source and they are a photography-rooted studio.
⚠️ Put **Aliph's own name** in the rebate, not a manufacturer's — printing a live
trademark across a commercial studio's hero is a liability with nothing to gain.

### The deleted branch — `visual/broadsheet-furniture`, tip `8d0d04d`

A full visual pass was built on this branch and the user then asked for it to be
deleted outright, declining a saved patch. It is unreferenced but **still in the
reflog for ~90 days**:

```bash
git checkout -b recovered 8d0d04d
```

It contained: the spec-cut film strip + `resources/build_film.py` that generates
it, a press-furniture CSS system (tapered rule from the logo's real baseline
terminal, Scotch rule, dinkus, end-mark, masthead dateline, running folio,
register marks, halftone screen), removal of the `overflow: hidden` that was the
mechanical cause of the flatness, four distinct story-panel compositions, and
several mobile fixes. **None of it is on `main`.** After GC it is gone.

### Measurements taken this session (still true of `main`)

These were the deliverable of a detector pass and are worth not re-deriving:

- **`impeccable` detector: 4 warnings, 0 errors.** Two are `em-dash-overuse`
  (advisory, and a **false positive** — the rule targets English AI cadence, but
  most hits are Arabic label separators like `القدس — جبل الزيتون`). Two are
  `broken-image` on `library.html:88` and `:103` — `#sheetCover` / `#sheetShot`
  have no `src`; true, but both sit in a `display:none` sheet that JS fills
  before opening. Neither has an `onerror`.
- **Focus visibility: 0 failures / 50 focusable elements**, all three pages,
  after `b5c9504`.
- **Alt text: 0 missing** across 108 images.
- **Heading outline: no level skips anywhere.** But `library.html` and
  `about.html` have **no `h1`**, and library has an **empty `<h2>`**.
- **Touch targets: 0 fail WCAG 2.2 AA (24×24).** 5–7 per page miss the 44×44
  comfort target; smallest is the library `فهرس/معرض` toggle at 34×38.
- **Motion: 3 distinct curves, no overshoot, no runaway durations.** Coherent.
- **Reduced motion genuinely works** — verified behaviourally, not grepped: the
  film halts (dx = 0.0) and content stays at opacity 1. Unreduced runs at
  34 px/s, matching the documented figure.
- **No horizontal overflow** at any viewport.

### 🔴 The biggest open issue: `index.html` costs 8.9 MB to paint

```
font          5210 KB   four raw .otf at ~1.3 MB each, format("opentype")
image         3600 KB   Fabric.jpg alone is 2413 KB
script         208 KB
stylesheet      70 KB
```

Two assets are **~90% of the payload**:

1. **`Fabric.jpg` is 1920×1313 at 2.4 MB**, but it is never tiled larger than
   **1100px** (most uses are 900px) and it is a multiply overlay at 10–20%
   opacity. Resizing to its real tile size and converting to WebP should take it
   to roughly 60 KB with no visible change. This is the cheapest big win on the
   site and nothing depends on the current dimensions.
2. **5.2 MB of uncompressed OTF**, served `format("opentype")`. No WOFF2, no
   subsetting. ⚠️ **Ask before converting** — 29LT is a commercial foundry and
   the licence may already include a proper webfont kit; converting the desktop
   OTFs locally can breach some foundry licences. This is the user's call, not
   a mechanical fix.

For scale: `film.webp` is 817 KB, so **Fabric.jpg alone is three times the film
strip**. Optimising the film before these two is optimising the wrong asset.

### Also still open (found by review, not fixed)

- `.services-strip` declares `role="tablist"` / `role="tab"` / `aria-selected`
  with **no `aria-controls`, no `role="tabpanel"`, no roving tabindex and no
  arrow-key handler.** A half-declared ARIA contract is worse than plain buttons.
- Every `picsum` `<img>` is `alt=""` with **no `onerror`**, so a rate-limited
  load — which the notes below say happens constantly — gives a page of empty
  rectangles with no recovery and nothing announced.
- The home page has **no primary CTA above 700vh**; the only conversion path is
  a `mailto:` in the footer.
- `library.html` has no banner and no heading, so arriving from "كل الأعمال"
  lands on a bare grid.
- `transform-origin: inline-start` / `inline-end` appear in `style.css` and are
  **not valid keywords** — both silently fall back to 50%, so the slider progress
  bar grows from its own centre rather than the leading edge.

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

### Service taxonomy (changed 2026-08-08 — THREE services)

| id | Arabic | English |
|---|---|---|
| `design` | تصميم | Design |
| `photo` | تصوير | Film & Photography |
| `tech` | برمجة | Engineering |

⚠️ **This replaced the four-service taxonomy** (`identity` / `creative` /
`events` / `tech`) that stood from 2026-08-02. Session 9 above has the mapping
and the reasoning; anything below this line describing four services is a record
of what was true then, not of the site now.

The user chose these names themselves; don't rename them. The ids are the join
key across `CATS`, `SUBCATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`,
`data-service` on the home page's service picks, **and
`chat-worker/src/services.js`** — changing one without the others silently
breaks classification and the film-strip sync.

Each service now also has **three subcategories** (`SUBCATS` in `main.js`), which
is what the home page's example switcher steps through.

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
  ready.png                the hero film strip, bg already transparent
                           ⚠️ NOT a scan — AI-generated, see session 6 above
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
chat-worker/               the chatbot backend — a SEPARATE deployable
  src/index.js             routes; the order of operations is the design
  src/guardrails.js        pure, testable; plan §5 lives here
  src/model.js             the seam — keyword stub today, Gemini at stage 3
  src/ratelimit.js         Durable Object, memory fallback
  src/services.js          ⚠️ must stay in sync with CATS in main.js
  test/                    67 cases; no key, no network, no wrangler
.claude/launch.json   preview server config, name "prototype", port 8321
aliph-chatbot-spec.md the user's chatbot brief (superseded by the plan)
HANDOFF.md            this file
memory/               auto-memory (see aliph-website-direction.md)
```

### Derived assets in `prototype/assets/img/` (regenerable with PIL)

| File | How it was made | Notes |
|---|---|---|
| `film.webp` | ⚠️ **built from generated art — see session 6.** `resources/upscalled.png` (user's 4× upscale of ready.png, 6144×4096, **alpha flattened by their upscaler**) → alpha transplanted from `ready.png`'s alpha scaled 4× LANCZOS → cropped to the film band `(y 1175–2816)` at **exactly 22 perforation pitches** → 5697×1641, WebP q92 | 0.78MB. **Their pixels, untouched** — only alpha restore + crop. |
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
rejected it: **reuse their art as-is.** (That rule stands for everything they
actually made — but see session 6: the film strip is not one of those things.) The pipeline above only restores alpha their
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

`index.html` order (**remodelled 2026-08-08, see session 9**): masthead →
**film-strip hero** → **"لماذا ألِف؟" (3 editorial blocks)** → **"ماذا نفعل؟"
(service picker + subcategory switcher)** → **contact footer**.

⚠️ The marquee is **gone**, the story's 4 sticky panels are **gone**, and the
two middle sections **swapped order**. Neither new section animates. Sections
below that describe the marquee, the sticky panels, the scatter clusters or the
latest-work slider are a record of the old page.

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
- **`.sc-num` became `.sc-idx`** on the home services strip — same award-strip
  look, but it prints the ordinal ٠١–٠٤ instead of a project count. The
  `applyI18n` selector was updated to match.
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
**Stages 1 and 2 are built.** Stage 1 is the widget
(`prototype/chat/aliph-chat.{js,css}`, loaded by all three pages): seal
launcher bottom-corner, ink/cream panel, contact-card fallback, AR/EN mirroring
the site. Stage 2 is `chat-worker/` — see session 7 above. **The two are not
connected yet**; that is stage 3's single line of config.

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

Stages 3–5 are blocked on plan §10 — service examples, voice samples, confirmed
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
   is sorted, real media replaces the `HOLDER` data URI everywhere: the five
   sites in `main.js` plus the 15 static ones in `index.html`/`about.html`.
   The `seed` fields on `PROJECTS`, `FILM_FRAMES` and `SERVICES` are now unused
   by any render — they are just labels waiting for a real path.
   ⚠️ **Read the Drive audit in session 8 before planning that work**: the
   folder is sorted by subject, not by project, and three of the four services
   have almost nothing in it.
2. **Library still needs a polish pass** to the same bar as home — the accordion
   mechanics work but it hasn't had a design round since the year sections came
   out, and the panels now have a lot of empty top-left space in the grid view.
3. **The tech `profile` copy and the about service copy are placeholder** — good
   Arabic in the brand voice, but written by me, not by the studio. Real project
   facts (clients, stacks, dates) need confirming before this goes anywhere near
   a client.
4. Only `tech` projects have profile sheets. If the user wants them for the
   other three services, it's data-only — add a `profile` block.
5. The chatbot is at **stage 2 of 5** — widget and Worker both built, not yet
   connected to each other or to a model. See session 7 and plan §11.
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
- **`.sc-idx` ordinals (٠١–٠٤) on the services strip.** The craft floor treats
  section numbers as a default to refuse unless the sequence carries
  information — and four services are not a sequence. They were kept because
  removing them is a design decision for the user, not a polish fix. **Worth
  raising with them.**

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

- **Remote: `origin` → https://github.com/Aliph-Creative-Agency/AliphPortfolio.git**
  ⚠️ Moved 2026-08-06 from the old `AliphCreaitve/` org (note the typo in the
  old name). GitHub still redirects pushes, so a stale remote *works* and only
  prints a warning — easy to miss for months. The local remote was repointed.
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
