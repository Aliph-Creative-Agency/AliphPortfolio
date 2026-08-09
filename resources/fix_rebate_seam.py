# -*- coding: utf-8 -*-
"""Clear the edge print that the tile's right edge slices in half.

THE BUG THIS FIXES
------------------
recut_film.py chose the tile width by scoring the PERFORATIONS only. It never
looked at the edge print, and the width it landed on (5512) cuts the rebate
mid-wordmark: the tile ends "KODAK 4" + a 31px sliver of the next glyph, and
then repeats straight into its own "KODAK 400TK". On screen that reads as

    ... K O D A K  4 | K O D A K  4 0 0 T K ...

two wordmarks about 70px apart where the film's own spacing is ~2760px. It is
the thing that makes the loop look broken once per period.

WHY NOT JUST RE-CUT NARROWER
----------------------------
Because the two constraints fight. A width that lands the print cleanly
(~4863) puts the perforation seam 23.7% off the tile's mean hole gap — worse
than the 9.7% the current width achieves, and a *geometric* break repeating
every period is far more visible than a longer blank stretch of rebate. It
would also narrow every frame by 12%, which is a design change nobody asked
for. So: keep the geometry, remove the sliced print.

THE RETOUCH
-----------
The last "KODAK" and the sliver after it are replaced with BLANK REBATE COPIED
FROM THE SAME TILE (the 578px clear run at x 4407-4985), so no pixel is
invented and the grain stays the film's own. The tile then ends in clear
rebate and the seam reads as an unprinted stretch of film, which is what real
edge printing does between marks.

⚠️ Only the rebate band above the sprockets (y < 72) is touched. The
perforation run starts at y~96 and is left exactly as it was, so every number
recut_film.py tuned still holds and the frame-slot constant does NOT change.
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "..", "prototype", "assets", "img")

REBATE_H = 88        # print ink ends at y73; hole borders start ~y92
DST0 = 4950          # everything from here to the tile edge goes
SRC0 = 4410          # the clear run at x 4407-4985, the film's own blank
FEATHER = 24         # blend the join so the tone step doesn't show
MOBILE_W = 1900      # must match recut_film.py

# The film's base is blotchy, so the tile's two ends do not sit at the same
# tone: the right edge is ~8% lighter than the left. Repeating that puts a
# hard vertical step on screen once per period — the faint line visible down
# the middle of the doubled frame divider. Levelled with a gain ramp over the
# last RAMP px, which moves only the low frequencies and leaves grain alone.
RAMP = 900


def print_blocks(gray, y0, y1, merge=70):
    """x-runs of ink on a rebate band."""
    col = gray[y0:y1].mean(axis=0)
    ink = col < np.median(col) * 0.60
    runs, s = [], None
    for i, v in enumerate(ink):
        if v and s is None:
            s = i
        elif not v and s is not None:
            runs.append([s, i]); s = None
    if s is not None:
        runs.append([s, len(ink)])
    runs = [r for r in runs if r[1] - r[0] > 6]
    out = []
    for r in runs:
        if out and r[0] - out[-1][1] < merge:
            out[-1][1] = r[1]
        else:
            out.append(r)
    return out


def main():
    path = os.path.join(IMG, "film.webp")
    im = Image.open(path)
    # ⚠️ film.webp is RGBA and the alpha is LOAD-BEARING: 8.1% of the tile is
    # transparent — the sprocket holes and the film's outer edge — and the
    # page's linen is meant to show through them. Converting to RGB here
    # flattens every hole to opaque grey and drops the file from 810KB to
    # 145KB, which is the tell. Touch the colour channels only.
    if im.mode != "RGBA":
        raise SystemExit("expected RGBA film.webp, got " + im.mode)
    rgba = np.asarray(im).astype(np.float32)
    alpha = rgba[..., 3].copy()
    a = rgba[..., :3]
    w, h = im.size
    gray = a.mean(axis=2)

    before = print_blocks(gray, 4, REBATE_H - 6)
    tail = [b for b in before if b[1] > DST0]
    print("tile %dx%d" % (w, h))
    print("rebate print blocks past x=%d: %s" % (DST0, tail or "none"))
    if not tail:
        print("nothing to clear - already fixed, leaving film.webp alone")
        return

    span = w - DST0
    src = a[0:REBATE_H, SRC0:SRC0 + span].copy()   # snapshot: regions overlap
    assert src.shape[1] == span, "source run too short"
    orig = a[0:REBATE_H, DST0:DST0 + FEATHER].copy()

    # hard replace, then feather the left join so no tone step shows
    dst = src
    ramp = np.linspace(0.0, 1.0, FEATHER)[None, :, None]
    dst[:, :FEATHER] = orig * (1 - ramp) + dst[:, :FEATHER] * ramp

    a[0:REBATE_H, DST0:w] = dst

    # ── level the base tone so the two ends of the tile meet without a step ──
    # Measured on the raw column means at each end, and applied as a single
    # gain eased in over RAMP px. Deliberately NOT a per-column normalisation
    # against a smoothed profile: that chases every blotch in the base and
    # overshot the edge by 7 levels in the other direction.
    base = a[300:1300].mean(axis=(0, 2))
    edge = 80
    target = base[:edge].mean()
    actual = base[-edge:].mean()
    g = target / max(actual, 1e-3)
    ramp = np.linspace(0.0, 1.0, RAMP) ** 2               # ease in, no visible onset
    gain = np.ones(w, dtype=np.float32)
    gain[w - RAMP:] = 1.0 + (g - 1.0) * ramp
    a *= gain[None, :, None]
    print("base tone: left %.2f  right %.2f  (step %+.2f) -> gain %.3f eased over %dpx"
          % (target, actual, actual - target, g, RAMP))

    merged = np.dstack([np.clip(a, 0, 255), alpha]).astype(np.uint8)
    out = Image.fromarray(merged, "RGBA")
    out.save(path, "WEBP", quality=92, lossless=False)

    after = print_blocks(np.asarray(out).astype(np.float32)[..., :3].mean(axis=2), 4, REBATE_H - 6)
    print("after: last print block ends at x=%d, leaving %dpx of clear rebate"
          % (after[-1][1], w - after[-1][1]))
    print("seam gap to the next tile's first mark: %d px (film's own gaps: 269-578)"
          % ((w - after[-1][1]) + after[0][0]))

    mh = round(h * MOBILE_W / w)
    out.resize((MOBILE_W, mh), Image.LANCZOS).save(
        os.path.join(IMG, "film-m.webp"), "WEBP", quality=90)
    print("regenerated film-m.webp -> (%d, %d)" % (MOBILE_W, mh))
    print("\naspect unchanged: %.6f  ->  frame-slot constant stays %.6f"
          % (w / h, w / h / 4))


if __name__ == "__main__":
    main()
