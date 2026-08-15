# Cut the agency's crumpled-paper scan into three tiles, one per use.
#
# Three separate crops, from three non-overlapping regions of the sheet, at the
# agency's request: the same paper appearing in the hero, in the headlines and
# behind the whole page would read as one repeated stamp rather than as a
# material. Different creases each time.
#
# Two things are done to every crop:
#
# 1. MADE TILEABLE. The scan is a photograph of one sheet and its edges do not
#    meet. Anywhere the texture repeats — the page layer especially — a raw
#    crop shows a hard grid. Fixed by overlap-blending: take a crop slightly
#    larger than the tile and cross-fade the surplus band back over the
#    opposite edge, so left continues into right and top into bottom.
#
# 2. LIFTED TOWARD WHITE. These are multiply overlays. The scan averages 63%
#    grey, which multiplied over the whole page would drop it two stops — the
#    creases are what should show, not the paper's own tone. Pulling the mean
#    up to ~80% keeps the flats nearly untouched and lets the folds do the
#    work.

import os
import numpy as np
from PIL import Image

SRC = (r"D:\Personal\Projects\aliph-portfolio\resources"
       r"\Free_crumpled_paper_texture_for_layers_(2978651767).jpg")
OUT = r"D:\Personal\Projects\aliph-portfolio\prototype\assets\img"

# (name, left, top, tile size, crease strength)
#
# The sheet is 2848x4272 and each tile needs its own size PLUS the overlap band
# to cut from, so the footprint is 1400 for a 1200 tile. That leaves room for
# exactly three non-overlapping regions — top-left, middle-right, bottom-left —
# which is what these are. An earlier set at 1500 ran off the right edge and
# the assert below caught it.
#
# `gamma` lifts the mid-tones toward white BEFORE the crease strength is
# applied, which separates the two things that were fighting each other: how
# bright the flat paper is, and how dark the folds are. Below 1 it pushes the
# flats to white while leaving the creases where they are — so a tile can be
# high-contrast without being dark overall.
CROPS = [
    # the hero panel — a calm area, mostly broad folds
    ("paper-panel", 10, 10, 1200, 0.62, 1.0),
    # ⚠️ The headlines need FAR more contrast than the other two, and the
    # reason is easy to underestimate: the texture is clipped to the LETTERS,
    # so almost all of the tile is thrown away and each stroke shows only a
    # small patch. A curve that reads beautifully across a whole panel is
    # invisible inside a letterform — measured twice, and both first attempts
    # were rejected as "almost not visible".
    # So: a hard gamma to bring the folds out, and a small background-size in
    # the CSS so a stroke crosses several of them.
    #
    # ⚠️ But strength stays LOW, and that is the balance this took three passes
    # to find. The tile is multiplied into the cream, so how dark the creases
    # go decides what colour the letters end up: at 0.92 the deepest folds hit
    # 20/255 and the type stopped being cream at all — it read as grey paper on
    # ink. The flats have to stay near white so the cream survives, and only
    # the folds may darken. Contrast comes from the gamma, not from depth.
    ("paper-title", 1440, 1440, 1200, 0.42, 0.55),
    # the whole page — the softest of the three, since it covers everything
    ("paper-page", 10, 2860, 1200, 0.46, 1.0),
]
BLEND_FRAC = 6          # overlap band = tile / 6


def tileable(f, n, b):
    """Cross-fade the surplus band back over the opposite edge, both axes."""
    rx = np.linspace(0, 1, b, dtype=np.float32)[None, :]
    a = f[:, :n].copy()
    a[:, :b] = a[:, :b] * rx + f[:, n:n + b] * (1 - rx)
    ry = np.linspace(0, 1, b, dtype=np.float32)[:, None]
    out = a[:n, :].copy()
    out[:b, :] = out[:b, :] * ry + a[n:n + b, :] * (1 - ry)
    return out


def main():
    src = Image.open(SRC).convert("L")
    w, h = src.size
    report = []

    for name, x0, y0, n, strength, gamma in CROPS:
        b = n // BLEND_FRAC

        # ── choose where to cut ──
        # The overlap blend guarantees the tile is CONTINUOUS across the wrap,
        # but not that the wrap is inconspicuous: if the join happens to land
        # along a strong fold, that fold repeats at every tile boundary and
        # reads as a grid. Nothing is wrong with the pixels — the cut is just
        # in a bad place.
        # So try a few nearby origins and keep whichever puts the join in the
        # quietest part of the sheet. Measured, not guessed: the score is how
        # the join ranks among every other join in the resulting tile.
        best = None
        for dx in (0, 90, 180):
            for dy in (0, 90, 180):
                x, y = x0 + dx, y0 + dy
                if x + n + b > w or y + n + b > h:
                    continue
                g = np.asarray(src.crop((x, y, x + n + b, y + n + b)), np.float32)
                lo, hi = np.percentile(g, [1, 99])
                g = np.clip((g - lo) / max(hi - lo, 1e-6), 0, 1) ** gamma
                g = 1.0 - (1.0 - g) * strength
                t = np.clip(tileable(g * 255.0, n, b), 0, 255)
                cs = np.abs(np.diff(t, axis=1)).mean(axis=0)
                rs = np.abs(np.diff(t, axis=0)).mean(axis=1)
                score = max((cs < np.abs(t[:, -1] - t[:, 0]).mean()).mean(),
                            (rs < np.abs(t[-1, :] - t[0, :]).mean()).mean())
                if best is None or score < best[0]:
                    best = (score, x, y)
        assert best, "%s: no candidate origin fits on the sheet" % name
        _, x, y = best

        f = np.asarray(src.crop((x, y, x + n + b, y + n + b)), np.float32)

        # ⚠️ CURVE FIRST, THEN BLEND. Doing it the other way round put a
        # visible seam in the title tile: the cross-fade leaves a tiny residual
        # difference across the join, and a hard contrast curve applied
        # afterwards amplifies exactly that difference into a line. Curving the
        # source first means the blend is the last thing to touch the pixels,
        # so whatever it matches stays matched.
        lo, hi = np.percentile(f, [1, 99])
        f = np.clip((f - lo) / max(hi - lo, 1e-6), 0, 1)
        # gamma < 1 drives the flats toward white and leaves the folds behind
        f = f ** gamma
        # then cap how dark a crease is allowed to get
        f = 1.0 - (1.0 - f) * strength

        tile = np.clip(tileable(f * 255.0, n, b), 0, 255)

        img = Image.fromarray(tile.astype(np.uint8), "L")
        path = os.path.join(OUT, name + ".webp")
        img.save(path, "WEBP", quality=86, method=6)

        # ── is the join visible? ──
        # ⚠️ Compared against the DISTRIBUTION of every other join, not against
        # the mean step. A crease-heavy texture has a very skewed step
        # distribution — most pixel pairs are flat paper and a few are folds —
        # so the mean is tiny and any join that happens to land near a crease
        # looks like an outlier against it. That false-flagged a tile that was
        # structurally seamless by construction.
        # The honest question is whether the wrap join is unremarkable among
        # all the joins in the image, so: how does it rank?
        a = np.asarray(img, np.float32)
        col_steps = np.abs(np.diff(a, axis=1)).mean(axis=0)   # per column pair
        row_steps = np.abs(np.diff(a, axis=0)).mean(axis=1)
        seam_x = np.abs(a[:, -1] - a[:, 0]).mean()
        seam_y = np.abs(a[-1, :] - a[0, :]).mean()
        pct_x = (col_steps < seam_x).mean() * 100
        pct_y = (row_steps < seam_y).mean() * 100
        ok = pct_x < 99.5 and pct_y < 99.5
        report.append((name, path, ok))
        print("%-12s %5.0f KB  %dx%d  mean %.0f  min %.0f  "
              "join ranks %.1f%% / %.1f%% of all joins  %s"
              % (name, os.path.getsize(path) / 1e3, n, n, a.mean(), a.min(),
                 pct_x, pct_y, "seamless" if ok else "!! SEAM"))

    bad = [r for r in report if not r[-1]]
    print("\n%d tiles, %d with a visible seam" % (len(report), len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
