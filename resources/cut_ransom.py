"""Cut the ransom-note letter clippings out of the two contact sheets.

INPUT   resources/ransom arb.png, resources/ransom eng.png
        1536x1024 each, 16 torn paper scraps in two rows of eight, shot on
        a pure black (0,0,0) background.
OUTPUT  prototype/assets/img/ransom/{ar,en}-NN.webp, alpha-cut.

⚠️ THE TRAP: a plain luminance key erases half the set. Several scraps are
BLACK PAPER with a light letter on them, so their interior sits within a few
levels of the background. Keying on brightness alone deletes them, or worse,
punches holes through the middle of the ones it keeps.

What actually separates them: the background is EXACTLY 0, while paper — even
black paper — carries grain and never is. So the mask is a very low threshold,
and the holes it leaves inside dark scraps are then closed by filling every
row between its outermost mask pixels. Torn edges survive that because the
outermost pixel per row IS the tear; only interior gaps get filled.

⚠️ These scraps introduce red, purple, brown and blue-ruled paper. The site's
palette is ink + cream only, with terracotta reserved. That is a real conflict
and it is the user's call, not a mechanical one — the script cuts all 16 and
the page picks from whichever subset is listed in main.js.
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "prototype", "assets", "img", "ransom")

SHEETS = {"ar": "ransom arb.png", "en": "ransom eng.png"}
BG_MAX = 6          # anything above this is paper, not background
MIN_AREA = 4000     # ignore specks
TARGET_H = 420      # ~1.4em at a DPR-3 phone; see main.js for display size
PAD = 2             # keep a hair of the tear's outer fibres


def mask_of(arr):
    """True where paper, False where the black backdrop."""
    lum = arr[:, :, :3].mean(axis=2)
    return lum > BG_MAX


def bands(present, gap=12):
    """Runs of True in a 1-D projection, merged across small gaps."""
    runs, start, blanks = [], None, 0
    for i, v in enumerate(present):
        if v:
            if start is None:
                start = i
            blanks = 0
        elif start is not None:
            blanks += 1
            if blanks > gap:
                runs.append((start, i - blanks + 1)); start = None
    if start is not None:
        runs.append((start, len(present)))
    return runs


def solidify(m):
    """Close the holes a dark scrap leaves, without eating its torn edge.

    Fills each row between its first and last paper pixel. The extremes are
    the tear itself, so the silhouette is preserved; only interior dropouts
    (black paper reading as background) get filled."""
    out = m.copy()
    for y in range(m.shape[0]):
        xs = np.flatnonzero(m[y])
        if xs.size:
            out[y, xs[0]:xs[-1] + 1] = True
    # same again down the columns, and keep only what BOTH agree on, so a
    # single stray speck on a row cannot smear the whole row opaque
    col = m.copy()
    for x in range(m.shape[1]):
        ys = np.flatnonzero(m[:, x])
        if ys.size:
            col[ys[0]:ys[-1] + 1, x] = True
    return out & col


def main():
    os.makedirs(OUT, exist_ok=True)
    for lang, fname in SHEETS.items():
        im = Image.open(os.path.join(HERE, fname)).convert("RGB")
        arr = np.asarray(im)
        m = mask_of(arr)

        n = 0
        for y0, y1 in bands(m.any(axis=1)):
            row = m[y0:y1]
            for x0, x1 in bands(row.any(axis=0)):
                sub = row[:, x0:x1]
                if sub.sum() < MIN_AREA:
                    continue
                ys = np.flatnonzero(sub.any(axis=1))
                yy0, yy1 = ys[0], ys[-1] + 1
                sub = sub[yy0:yy1]

                box = (max(0, x0 - PAD), max(0, y0 + yy0 - PAD),
                       min(arr.shape[1], x1 + PAD), min(arr.shape[0], y0 + yy1 + PAD))
                crop = im.crop(box)
                alpha = solidify(mask_of(np.asarray(crop)))

                out = crop.convert("RGBA")
                a = np.asarray(out).copy()
                a[:, :, 3] = (alpha * 255).astype(np.uint8)
                chip = Image.fromarray(a, "RGBA")

                w = round(chip.width * TARGET_H / chip.height)
                chip = chip.resize((w, TARGET_H), Image.LANCZOS)
                n += 1
                chip.save(os.path.join(OUT, "%s-%02d.webp" % (lang, n)),
                          "WEBP", quality=88, method=6)
        print("%s: %d clippings" % (lang, n))

    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print("%d files, %.0f KB total, %.1f KB each"
          % (len(os.listdir(OUT)), total / 1024,
             total / 1024 / max(1, len(os.listdir(OUT)))))


if __name__ == "__main__":
    main()
