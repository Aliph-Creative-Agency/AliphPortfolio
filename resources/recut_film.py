"""Re-cut the film tile so it repeats on a whole perforation pitch.

THE BUG THIS FIXES
------------------
`film.webp` was cropped to "22 perforation pitches" by eye. Measured, the
holes inside the tile sit 127.9px apart on average (min 119, max 140 — the
art is generated, not a scan, so it jitters), but across the tile seam the
gap was only 69.5px. Every repeat crowded two sprocket holes together: a
visible rhythm break once per period, which is what "the loop isn't
perfect" looks like.

THE CUT
-------
Crop from the RIGHT only, keeping x0 = 0. That matters: the film's own
frame windows are baked into the art and the DOM frames are laid out from
the group's left edge, so trimming the left would slide every frame off its
window by the amount trimmed. Trimming the right leaves that alignment
untouched.

The width is SEARCHED, not chosen by hand. I tried computing it from the
last two hole centres and got it wrong — the tile's final gaps are short
(95.5px against a 128px mean), so the arithmetic landed on a width whose
seam was still 30% tight. The search scores every candidate width on both
perforation rows at once and rejects any that would slice a hole in half.

⚠️ This is a CROP of the user's own pixels. No resampling, no sharpening, no
substitution — the same rule the rest of this asset was built under. Only
the `-m` phone variants resample, exactly as they already did.

⚠️ Changing the tile width changes its aspect, so the frame-slot constant in
style.css MUST be retuned to tileAspect / 4. This script prints the value.
"""
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "..", "prototype", "assets", "img")

MOBILE_W = 1900       # unchanged — a DPR-3 phone draws the tile at ~1914px
MIN_W = 4600          # don't shrink the tile more than ~20% chasing a seam


def runs_of(im, row):
    """Perforation runs (start, end) along one row, from the ALPHA channel.

    ⚠️ This read LUMINANCE via `im.convert("RGB")` and it was measuring the
    wrong thing. Dropping alpha keeps whatever RGB sits under a transparent
    pixel, and the bright rim around each hole then scores as its own run:
    the detector reported 43 "holes" where the tile has 21, so the mean gap
    came out at half the real pitch (128.5 against 258.4) and the seam was
    scored against a rhythm that does not exist. It declared the tile already
    optimal at -9.7% while the true seam was +33% — a third of a pitch of
    extra film between two perforations, once per repeat, which is precisely
    the break this script exists to remove.

    A hole IS the transparency — 8.1% of the tile, the sprockets the page
    shows through — so alpha is the ground truth and nothing else is."""
    a = np.asarray(im.convert("RGBA"))[row, :, 3]
    out, s = [], None
    for x, v in enumerate(a < 32):
        if v and s is None:
            s = x
        elif not v and s is not None:
            out.append((s, x)); s = None
    if s is not None:
        out.append((s, len(a)))
    return [r for r in out if r[1] - r[0] > 40]


def holes(im, row):
    return [(a + b) / 2 for a, b in runs_of(im, row)]


def best_width(im):
    """The crop width whose seam gap best matches the tile's own rhythm.

    Scored across BOTH perforation rows — they are ~2px out of phase, and a
    width that suits one can clip a hole on the other."""
    W, H = im.size
    rows = [runs_of(im, int(H * 0.11)), runs_of(im, int(H * 0.89))]
    stats = []
    for rs in rows:
        c = [(a + b) / 2 for a, b in rs]
        gaps = [c[i + 1] - c[i] for i in range(len(c) - 1)]
        stats.append((rs, c, sum(gaps) / len(gaps)))

    best = None
    for w in range(MIN_W, W + 1):
        score = 0
        for rs, c, mean in stats:
            # a candidate edge may not fall inside a hole
            if any(a < w < b for a, b in rs):
                score = None; break
            inside = [x for x in c if x < w]
            if len(inside) < 8:
                score = None; break
            seam = (w - inside[-1]) + c[0]
            score = max(score, abs(seam - mean) / mean)
        if score is None:
            continue
        # prefer the truest seam; break ties toward the widest tile
        key = (round(score, 4), -w)
        if best is None or key < best[0]:
            best = (key, w, score)
    return best[1], best[2]


def report(im, label):
    W, H = im.size
    for name, row in (("top", int(H * 0.11)), ("bottom", int(H * 0.89))):
        c = holes(im, row)
        gaps = [c[i + 1] - c[i] for i in range(len(c) - 1)]
        wrap = (W - c[-1]) + c[0]
        print("  %-7s %-6s holes=%2d  mean gap=%.1f  seam gap=%.1f  (%+.1f%%)"
              % (label, name, len(c), sum(gaps) / len(gaps), wrap,
                 100 * (wrap - sum(gaps) / len(gaps)) / (sum(gaps) / len(gaps))))


def main():
    master = Image.open(os.path.join(IMG, "film.webp"))
    print("before:"); report(master, "film")
    cut_w, dev = best_width(master)
    print("\nsearched width: %d px  (seam within %.1f%% of the tile's mean gap)\n"
          % (cut_w, dev * 100))

    for base in ("film", "film-shadow"):
        src = os.path.join(IMG, base + ".webp")
        im = Image.open(src)
        if im.size[0] == cut_w:
            print("%s already re-cut, skipping" % base)
            continue

        cut = im.crop((0, 0, cut_w, im.size[1]))
        cut.save(src, "WEBP", quality=92, lossless=False)
        if base == "film":
            print("after:"); report(Image.open(src), base)

        h = round(cut.size[1] * MOBILE_W / cut.size[0])
        cut.resize((MOBILE_W, h), Image.LANCZOS).save(
            os.path.join(IMG, base + "-m.webp"), "WEBP", quality=90)
        print("%-12s -> %s  and  %s-m.webp -> %s"
              % (base, cut.size, base, (MOBILE_W, h)))

    aspect = cut_w / Image.open(os.path.join(IMG, "film.webp")).size[1]
    print("\nnew tile aspect  %.6f" % aspect)
    print("style.css frame-slot constant (aspect / 4):  %.6f" % (aspect / 4))


if __name__ == "__main__":
    main()
