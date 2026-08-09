# Aliph Portfolio — Handoff

_Updated 2026-08-09. Read this first._

**Standing rule: update this file at the end of every session.**

---

## What this is

A portfolio site for **Aliph (ألِف)**, a bilingual Arabic-first creative studio in
Jerusalem. The brand is built on the letter alif — "the point things begin from."

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
- Photography is B&W (`filter: grayscale(1)`). Texture over flatness.
- Voice: editorial broadsheet — the site behaves like an Arabic newspaper issue.

**Arabic is the primary language.** Type is tuned to Arabic; English sets longer and
is scaled down to compensate, never the other way round.

---

## Services (three, since 2026-08-08)

| id | Arabic | English |
|---|---|---|
| `design` | تصميم | Design |
| `photo` | تصوير | Film & Photography |
| `tech` | برمجة | Engineering |

Each has three subcategories (`SUBCATS` in `main.js`). The ids are the join key across
`CATS`, `SUBCATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`, `data-service` in
the markup, **and `chat-worker/src/services.js`**. Change one without the others and
classification breaks silently.

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

**A float excludes text with its MARGIN box.** A top margin reserves dead space that
neither the picture nor the copy can use; a bottom margin squeezes the first line
under the picture. And a float only wraps text that comes *after* it in the flow — no
margin can put a line above it, only markup order can.

**A `clamp()` floor is what applies on a phone**, not its vw term. At this 150% root,
`clamp(1.7rem, …)` is 40.8px at 390px wide.

**`order` is ignored for explicitly-placed grid items.** If a mobile query collapses
a grid, it must reset `grid-row` as well as `grid-column`, or the children stack on
top of each other.

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

**Screenshots:** the Browser pane's `computer{screenshot}` fails here. Use Playwright,
and scroll with real wheel events before measuring anything ScrollTrigger drives — a
`gsap.from()` sits at opacity 0 until its trigger fires.

---

## The home page

**Hero** — a film strip loops behind a cream panel. `filmLoop` in `main.js` travels
exactly one period at 34 px/s and repeats, so the restart is pixel-identical. The
film tile's aspect divided by 4 is the frame-slot constant in `style.css`
(`0.839732`); re-cut the tile and that number must change with it. The strip pauses
off screen. **It has been blamed for four bugs and caused none of them** — check the
callers first.

The headline's أ (and Latin A) are photographed paper scraps that re-cut themselves
every second or so. `splitSafe()` refuses to split a word where Arabic shaping would
break it. Only the two verbs نبدأ and تبدأ.

**لماذا ألِف؟** — three editorial blocks, laid out to the user's annotated wireframe.
Deliberately unanimated. Block 2's copy is one continuous body that wraps around two
floated pictures. Per-column type sizes are **solved, not chosen** — each column's
size is the one that fills its own box:

```bash
python resources/fit_columns.py ar
```

Re-run it whenever the copy changes length. `--why-type` on `.why` is the single
lever for the language difference (English runs longer; text area grows with the
*square* of the size, so a 1.37× overflow takes a 0.85 scale).

**ماذا نفعل؟** — three service names on one line, sized by `fitPicks()` to fill the
column exactly. Not a fixed vw: the strings differ too much between languages. Below
the names, a subcategory switcher with one media slot.

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

Two contracts not to break: `ok` and `quotaRemaining` in the health response are read
by those exact names, and the guardrail bans are curated phrase lists on purpose —
a regex for "we can" also swallows the one sentence the bot exists to say.

---

## Open questions for the studio

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
6. **`wb2-rail-media` is tagged `poster` but sized 9:16**, a reel ratio. One of the
   two is wrong.

---

## Real media — first trial done, and it did not fit

The Drive folder (`aliph website/`) holds `graphic designs`, `horizintal videos`,
`pics` (~54 JPEGs, by subject), `reels`. It resolves without signing in;
`https://drive.usercontent.google.com/download?id=…&export=download` works.

Four files were pulled and trialled in the holders. **The design work does not
crop.** Those assets are finished layouts with type baked in at 4:5 — every holder
crops them (keeping 53–80%) and the crop cuts the words. The site also grayscales
everything, so Grillit's orange goes grey.

So: the holders in لماذا ألِف؟ want **photographs**, and the design work needs its own
slot at its own ratio. The Drive is organised by *subject*; the site needs *projects*
with a title, date, service and cover. That mapping cannot be derived from the folder
names — the studio has to supply it.

Everything on the site is still the `HOLDER` placeholder (an inline SVG data URI).
Landing real media is a `src` change. The `seed` fields on `PROJECTS` are dead data
kept on purpose — they are the shopping list.

---

## Git

- Remote: `https://github.com/Aliph-Creative-Agency/AliphPortfolio.git`, branch `main`.
- `Brand/` is **not** in the repo (too large for GitHub) but is on the user's disk.
  `prototype/assets/` carries its own copies of everything the site needs.
- `resources/` **is** tracked — it holds the inputs the derived assets come from.
- End commit messages with the Claude co-author trailer.
- ⚠️ Run git from the repo root. A `git add -A` from elsewhere will happily stage a
  different repo.

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
