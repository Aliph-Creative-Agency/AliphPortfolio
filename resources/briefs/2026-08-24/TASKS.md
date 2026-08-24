# Round 2026-08-24 — the agency's fourteen edits

Sent as fourteen numbered screenshots plus two asset photographs, all on disk at
**`C:\Users\Obaida\Desktop\issues\`**. Unlike the last round the images are
kept, so any session can open them — but the mapping from "Nth pic" to filename
is not obvious and is recorded here.

| the agency says | file |
|---|---|
| 1st pic | `1st pic.jpg` |
| 2nd pic | `2nd pic.png` |
| 3rd pic | `3rd pic.jpg` |
| 4th pic | `4th pic.png` |
| 5th pic | `5th .png` — note the space before `.png` |
| 6th | `6th.png` |
| (unreferenced) | `7th.png` |
| 8th | `8th.png` |
| 9th | `9th.png` |
| 10th | `10th.png` |
| 11th | `11th.jpg` |
| 12th | `12th.png` |
| 13th | `13th.png` |
| 14th | `14th.png` |
| CTA assets | `start here.jpg`, `contact us.jpg` |

---

## T1 — صناعة محتوى's centre mark: a real photograph at last

`1st pic.jpg` is the agency's own photographer — beige knit sweater, checking a
camera body, studio flats and a reflector behind him. It replaces
`assets/marks/mark-photo.webp`.

⚠️ **"do not add a line border as u did before."** The previous round put the
designer's MONITOR back as a stated rectangle after segmentation, and in
`2nd pic.png` you can see what that produced: a hard vertical cut down the left
of the screen where the rectangle ended. Nothing gets a drawn edge. If the
segmenter drops something the mark needs, solve it by choosing a better frame,
not by pasting a shape over it.

## T2 — تطوير برمجيات's mark, done properly

`3rd pic.jpg` replaces `assets/marks/mark-tech.webp`. A real developer at a real
monitor with real code, dark room, whiteboard behind. The current one
(`2nd pic.png`) is the AI-stock frame with the pasted rectangle and it reads
badly at size.

## T3 — the ring is visibly sliced

🔴 The single biggest complaint. `2nd pic.png` shows the maroon Al Baydar tile
ruled with **ten evenly spaced vertical lines** — the slat boundaries.

**The bend itself is right and stays.** "the bend is good and every other aspect
but u gotta find a better solution."

**Diagnosed:** `.ring-slat` carries `opacity: var(--o)` AND `scaleX(1.012)`. The
scale was added to close antialiasing gaps by overlapping neighbours — but two
overlapping strips at opacity 0.8 composite to 0.96 in the overlap, so every
seam paints a darker band. The overlap fix and the per-slat opacity are
incompatible: one of them has to go.

**Suggested fix, not mandated:** make every slat fully opaque and bake the depth
fade into the paint instead of the compositing — a flat cream veil as a second
background layer, `linear-gradient(rgba(217,217,206,V), rgba(217,217,206,V))`
over the picture, where `V = 1 − o`. Opaque-over-opaque overlaps are invisible,
so the seams go and the fade survives.

## T4 — the صناعة محتوى ring turns too fast

Slow that ring specifically. `TURN` is currently one constant for all three.

## T5 — the ring's reels should play

Their poster frames should run like the ones in لماذا ألِف؟ and on the about
page — the `previews` module's treatment. Only `RINGS.photo` entries carry an
`open:` clip today; those are the ones with video.

## T6 — hover brings an item to the front (PC only)

"if u hover upon one item it moves to the center (the exact logic of clicking)
only for pc, since on phone u can only click." Reuse `pickAngle` + the glide.
⚠️ Gate on `(hover: hover)` — on touch `pointerenter` fires once and
`pointerleave` never does, which is already why hover-to-pause is gated.

## T7 — a ring click opens the catalog, not the work page

Remove the two-step-then-navigate entirely. A click opens the **lightbox**,
stepping through the ring's own items as a group — `5th .png` shows the target:
the overlay with `٢/٢` and a chevron. Same behaviour as every other media group
on the site.

## T8 — `4th pic.png`: the bts-29 watermark — ALREADY FIXED, cache only

✅ **Verified 2026-08-24 against the live objects with a cache-buster**:
`aliphcreative.com/assets/media/bts-29.webp` is 625×1000,
`media.aliphcreative.com/poster/bts-29.webp` is 720×1152 and `thumb/` is
600×960 — and the bottom 14% of all three was rendered and inspected: **no
`@bader.events`, no caption.** The screenshot is a stale copy on the agency's
device. No code change. Tell them to hard-refresh.

## T9 — `6th.png`: the invitation line

Move «هذه نماذج فقط — الأرشيف كامل بانتظارك.» **beside** the «كل الأعمال» oval
rather than above it, make it bigger, and shrink the oval if that is what it
takes to fit. The arrow in the screenshot runs from the text down to the space
alongside the button.

## T10 — the footer, redesigned, and the clock is gone

`8th.png` is the desktop end column; `10th.png` is the whole phone bottom.
Both: an **oversized cream ألِف mark bleeding off the bottom edge**, with the
socials and `ALIPH CREATIVE` set against it. **Neither has a clock — it is being
removed.**

🔴 **Delete the clock outright** — markup, `tickClock()`, `.contact-clock`, and
the `cClock` I18N pair.

🔴 **AND NEVER PUT `font-variant-numeric: tabular-nums` ON IDRIS SHARP.**
`7th.png` — which the agency did not reference but which shows the fault — is
that clock rendering as **six white diamonds**. Measured: with `tnum` on, all
ten Arabic-Indic digits AND the colon collapse to exactly 50.4px at 120px, a
single `.notdef` advance. The 2026-08-23b round used that uniformity as proof
the feature worked. It was proof the glyphs were all the same box.

## T11 — the hero lede, both viewports

`9th.png`: the desktop paragraph runs to three lines and the third is
**«الياء.» alone**. "either squish the width to the point where theres almost 3
full lines or only 2 big ones."

`11th.jpg`: the phone version is "a lil messy" — four lines ragging around a
floated paper أ.

## T12 — `12th.png`: the about page's way out

Make the «كل الأعمال» oval a little bigger and **remove the rule above it**
(`.ab-read { border-bottom: var(--hair) }`).

## T13 — the about page's verticals, and a new shape for the long read

`13th.png` is the fault: a 9:16 clip sitting in a mat far wider than itself,
caption stranded at the far corner. Cause: `.ab-holder` is
`width: min(100%, calc(38vh * var(--r)))` and centres inside a full-width
`.ab-media`, so the mat spans the column while the picture does not.

`14th.png` is the target: the mat **hugs the picture** — a thin even border all
round, caption directly beneath. The figure must shrink-wrap its holder.

**Then the long read changes shape.** Two rows instead of four, each holding
**two verticals side by side in the scattered style**, and only **two texts —
the first and the last** (`abLead` and `abP4`).

⚠️ **Judgement call to flag:** that leaves the 16:9 AliphxBader montage
homeless. It is the agency's own showcase piece and they asked for it by name on
2026-08-23, so it is kept as a full-width piece at the head of the section with
no card beside it. Say so when reporting — they may want it elsewhere.

## T14 — the hero's two CTAs become pinned notes

`start here.jpg` and `contact us.jpg` are white paper notes held by a red
push-pin, shot on white. Cut them out, give them a shadow, and animate them
simply on hover and on click. They replace the solid and outlined ovals in
`.hero-cta` (visible in `11th.jpg`).

⚠️ White paper on a white ground is the hard case for segmentation — the ground
and the subject are within a few levels of each other, and the only thing
separating them is the drop shadow.

---

## Standing constraints

- Static HTML/CSS/JS in `prototype/`. No framework, no build step, no npm.
- Deploy: `npx.cmd wrangler deploy` from the repo root. **Verify against a real
  version id and byte-compare both hosts with a cache-buster** — never trust
  wrangler's message, and never a plain fetch (it measures the edge cache).
- **The browser pane does not composite.** rAF, IntersectionObserver,
  `loading="lazy"`, smooth scrolling and `scrollLeft` writes are all inert, and
  **every CSS transition reads frozen at its FROM value**. To read a computed
  value honestly, inject `* { transition: none !important }` first.
- This box's console is cp1252: sanitise before printing, and read wrangler's
  output with `encoding="utf-8", errors="replace"`.
