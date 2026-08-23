# Brief — 2026-08-23

The user's reference material for the round that follows the 2026-08-22 build.
Everything here is either a file they made or a faithful redraw of a sketch
they pasted into chat.

⚠️ **A pasted image cannot be forwarded between sessions.** The two sketches
below are redraws, made from the originals while they were on screen, and are
the only record of them. The photographs are the user's own files, copied off
the Desktop unchanged.

## The sketches

| file | what it says |
|---|---|
| `layout-desktop.svg` | The DESKTOP layout for ماذا نفعل؟: banner across the top, the ring large on the left, the three services stacked as a list on the right with the active one underlined, the item's description under the ring, and **all work** at the right below the service list. |
| `ring-tilt.svg` | What "tilted" was supposed to mean. The ring's **plane** is tilted — a band seen from above, like Saturn's — but the media item stands **upright** through it. |

### The correction `ring-tilt.svg` makes, in one line

`.ring` currently carries `rotateX(-14deg)`, which tilts every item with the
plane. The sketch wants the orbit elliptical and the pictures square to the
eye, so the tilt has to be undone **per item** — the item's transform ends with
a `rotateX(+tilt)` after it is placed on the ring.

## The centre marks

The ring turns around a mark that stands for the service. The user wants
photographic cutouts rather than the drawn SVG icons that are on the site now.

| file | verdict |
|---|---|
| `mark-photo-abdallah-cutout.jpg` | ✅ **Use this.** A real cutout of the agency's own cameraman, from their own footage. 1049×1620, subject already isolated on flat black — key the black out to alpha. |
| `mark-design-stock.jpg` | 🔴 **AI stock, and it shows.** 625×343, a generic figure at a monitor. Low resolution for a centre mark. |
| `mark-tech-stock.jpg` | 🔴 **AI stock, and it shows badly** — the whiteboard lettering and the code on screen are both gibberish, which is the giveaway at any size. |

⚠️ The two stock images are the wrong material for this site twice over: they
are generated art in a section otherwise built entirely from the agency's own
work, and they are not cutouts, so they cannot sit at the centre of a ring the
way the cameraman can. **The better answer is to cut the other two marks from
the agency's own BTS footage** — 19 BTS clips are already on R2 and four more
arrived in the `new bts` folder — so all three marks are real people in one
visual language. Raised with the user; their call.

## Other

`screenshot-020059.png` — a full screen capture the user took at 02:00 on
2026-08-23, copied across in case it is wanted. Not identified.
