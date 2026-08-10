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

## Services (three, since 2026-08-08 — relabelled 2026-08-10)

| id | Arabic | English |
|---|---|---|
| `design` | تصميم جرافيكي | Graphic Design |
| `photo` | تصوير احترافي | Professional Photography |
| `tech` | تطوير برمجيات | Software Development |

Each has three subcategories (`SUBCATS` in `main.js`). The ids are the join key across
`CATS`, `SUBCATS`, `PROJECTS[].cat`, `SERVICE_FRAMES`, `SERVICES`, `data-service` in
the markup, **and `chat-worker/src/services.js`**. Change one without the others and
classification breaks silently.

⚠️ **The 2026-08-10 rename moved labels, not ids** — and it landed in `I18N.svc1-3`
only. Five other copies had to be caught by hand: `CATS` (which had a third spelling,
`تصميم جرافيك`), `SERVICES[].tag`, the `data-i18n` fallbacks in `index.html`,
`chat-worker/src/services.js`, and two test fixtures. The keyword lists in
`services.js` keep the **short** forms on purpose — a visitor types "تصميم".

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

**A float excludes text with its MARGIN box.** A top margin reserves dead space
neither the picture nor the copy can use. A bottom margin is worse: any line box that
so much as clips it gets squeezed to the narrow side — measured, a 28px bottom margin
made the line under block 2's first picture 35% wide instead of running the column.
Both are `0` there now, and the line's own leading is the gap.

**A float only wraps text that comes *after* it in the flow.** No margin can put a
line of text *above* a float — only markup order can. That is why block 2's body is
two paragraphs with the second picture between them rather than one.

**Anything that names or counts the services must derive it from `SERVICES`.** Typed
copies have now survived two taxonomy changes and gone stale both times: the chatbot
prompt said "four services" and its off-scope reply recited the pre-August four for
weeks. The brand stamp is still wrong for the same reason (see open questions).

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

**A stray terracotta rectangle on the page is the focus ring**, not a bug —
`:focus-visible { outline: 2px solid var(--accent) }`. It appears around whatever last
took keyboard focus and has been mistaken for a stray border.

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
Deliberately unanimated.

Block 2's copy reads as one body wrapping around two floated pictures, but it is
**two paragraphs with the second picture between them** — a float only wraps what
follows it, so that is the only way to get a line of text above that picture. The
pictures float to opposite edges so the text zigzags, and both have zero block
margins so no line gets squeezed. On a phone they unfloat: a 54% float in a 342px
column leaves three or four words a line.

Per-column type sizes are **solved, not chosen** — each column's size is the one that
fills its own box:

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
6. **`wb2-rail-media` now points three ways at once.** `data-kind` is `reel` and it
   holds a `<video>`, the aspect is `9/13` (neither a reel nor a poster), and both the
   figcaption (`ملصق — ليالي رمضان`) and the paragraph under it (`w2Rail`, "الملصق
   يُقرأ من عشرة أمتار") are still poster copy. `style.css`'s mobile comment also still
   claims "a reel is 9:16 and a poster is portrait, and `data-kind` says which".
   Pick one and make the other three follow.

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

Everything on the site is still the `HOLDER` placeholder (an inline SVG data URI),
with one exception: `wb2-rail-media` is now a `<video>`. The `seed` fields on
`PROJECTS` are dead data kept on purpose — they are the shopping list.

### The reel trial — it works, and it is deliberately not in the repo

A real reel was put in `wb2-rail-media` on 2026-08-10 and **the treatment holds**:
1080×1920 H.264, 30.7s, autoplays muted and loops, and `filter: grayscale(1)` reads
on video exactly as it does on stills. `.holder > video` was already styled alongside
`.holder > img`, so no CSS was needed.

It is **not committed.** The file is 51.8 MB — past GitHub's 50 MB warning, into
every clone forever, and into the Worker asset bundle, for something that should be
served by URL. `prototype/media/` is now gitignored, the placeholder holds the slot,
and `index.html` carries a comment with the markup to restore. The source lives at
`C:\Users\Obaida\Desktop\finallllllllllll.mov`.

⚠️ **Two things are still unresolved about it.** The source is **9:16** and the holder
is **9/13**, so `object-fit: cover` crops ~23% — visibly clipping the top and bottom
of the frame. And the reel has **burnt-in titles** that land where the figcaption sits.

⚠️ **The R2 URL in the repo was the bucket root** — `https://pub-90bac6014abe49c594f8ac9c1f1899cb.r2.dev`,
no object key, which 404s. The key is recorded nowhere here; it has to come off the
Cloudflare dashboard. **`moov` is at the end of the file**, so even served correctly it
buffers fully before the first frame — remux with `-movflags +faststart` before it
goes anywhere near a visitor.

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
