# -*- coding: utf-8 -*-
"""Turn a flat scan of blank 35mm stock into the hero's film tile.

`recut_film.py` re-cuts an EXISTING tile. This one makes the tile in the first
place, from the agency's DaVinci scan, and the difference that matters is the
sprocket holes: in the scan they are white PIXELS, and the page needs them to
be transparency so the cream field shows through them.

Two rules carried over from recut_film.py, both learned the hard way:

  * ⚠️ Measure the holes on ALPHA, never on luminance. The bright rim around
    each hole scores as its own run, and a luma detector counted 43 holes where
    the tile had 21 — half the true pitch, and every downstream number tuned
    against a rhythm that does not exist. So this script keys alpha first and
    measures alpha afterwards.
  * ⚠️ The tile must span a WHOLE number of perforation pitches or the loop
    shows a seam once per repeat: a fraction of a pitch of extra film between
    two holes, which reads as a stutter rather than as a cut.

Output is RGBA WebP. ⚠️ Do NOT use file size to check the alpha survived — the
old tile's "near 145 KB means the alpha is gone" rule was calibrated on a
795 KB scan, and this tile is legitimately ~150 KB because its base is flat and
its edge printing has been removed. The script asserts `mode == "RGBA"` and a
plausible transparent fraction instead, which is what actually matters.
"""
import io, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = os.path.join(HERE, "davinci_edit_create_a_high_resolution_flat_scan_of_a_blank_35mm.png")
OUT = os.path.join(REPO, "prototype", "assets", "img")

FRAMES_PER_TILE = 4          # the hero lays 4 frame slots per tile
MOBILE_W = 1900              # same reasoning as film-m.webp: fewer pixels, same picture
BASE_THRESH = 150            # below this luma is film base
HOLE_THRESH = 170            # above this, inside the strip, is a sprocket hole
EDGE_INSET = 90              # the base ramps AND carries a dark rim ~50px inside; skip both


def runs(mask):
    """[(start, end)] for every True run, padded so edge-touching runs close."""
    m = np.r_[False, mask, False].astype(int)
    d = np.diff(m)
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))


def main():
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    luma = a.mean(2)
    print("scan            %dx%d" % im.size)

    # ── where the film base actually is ───────────────────────────────────
    # ⚠️ Strict, then inset. The scan's edges are SOFT — measured, the base
    # ramps from white to full density over about 30px at each side. A loose
    # threshold (mean > 0.35) put that ramp inside the tile, and because one
    # end kept a sliver of bright margin while the other kept a dark falloff,
    # the repeat showed a 10% tonal step. It looked exactly like a lighting
    # gradient across the scan; the interior profile is in fact flat to within
    # 5%, and no amount of gradient-fitting could have fixed an edge artefact.
    # Two passes: a column also spans the white margin ABOVE and BELOW the
    # strip, so no column is ever 98% base until the row range is known. Find
    # the band loosely first, then measure strictly inside it.
    base = luma < BASE_THRESH
    r0 = np.where(base.mean(1) > 0.35)[0]
    c0 = np.where(base.mean(0) > 0.35)[0]
    band_rows = slice(r0.min(), r0.max() + 1)
    band_cols = slice(c0.min(), c0.max() + 1)
    cols = np.where(base[band_rows, :].mean(0) > 0.90)[0]
    rows = np.where(base[:, band_cols].mean(1) > 0.90)[0]
    x0, x1 = cols.min() + EDGE_INSET, cols.max() - EDGE_INSET
    y0, y1 = rows.min() + EDGE_INSET, rows.max() - EDGE_INSET
    crop = a[y0:y1 + 1, x0:x1 + 1]
    cl = crop.mean(2)
    ch, cw = cl.shape
    print("film base       %dx%d at (%d,%d)" % (cw, ch, x0, y0))

    # ── alpha: holes punched out, everything else opaque ──────────────────
    # A hole is bright AND inside one of the two perforation bands. Keying on
    # brightness alone would also punch the white edge-print highlights.
    bright = cl > HOLE_THRESH
    bands = [(s, e) for s, e in runs(bright.mean(1) > 0.25) if e - s > 50]
    assert len(bands) == 2, "expected 2 perforation bands, found %d" % len(bands)
    print("perf bands      rows %s" % (bands,))

    alpha = np.full((ch, cw), 255, np.uint8)
    for s, e in bands:
        band = bright[s:e, :]
        alpha[s:e, :][band] = 0

    # ── paint out the edge printing ───────────────────────────────────────
    # ⚠️ Two reasons, and the first is the one that forces it: the scan's
    # "KODAK T-MAX 400" does NOT repeat on a regular period (measured gaps of
    # 2479 and 2590 px between blocks), so no cut width can ever make it join
    # up — the tile seam lands mid-word whatever the perforations do. The
    # second is that it is a third-party trademark, printed across the hero of
    # a commercial site, on stock the agency did not shoot.
    #
    # The bands above the top perforations and below the bottom ones are
    # rebuilt from the longest text-free stretch of the same band, so the
    # replacement is this scan's own base and grain, not a flat fill.
    edge_bands = [(0, bands[0][0]), (bands[1][1], ch)]
    rgbc = crop.astype(np.uint8).copy()
    for top, bot in edge_bands:
        if bot - top < 8:
            continue
        seg = cl[top:bot, :]
        ink = (seg < 40).mean(0) > 0.04
        clean = [(s, e) for s, e in runs(~ink) if e - s > 200]
        assert clean, "no text-free stretch found in edge band %d..%d" % (top, bot)
        s, e = max(clean, key=lambda r: r[1] - r[0])
        patch = rgbc[top:bot, s:e]
        reps = int(np.ceil(cw / float(e - s)))
        rgbc[top:bot, :] = np.tile(patch, (1, reps, 1))[:, :cw]
        print("edge band %4d..%-4d  rebuilt from clean run %d..%d (%dpx)"
              % (top, bot, s, e, e - s))
    crop = rgbc.astype(np.float32)

    # ── pitch, measured on the alpha we just made ─────────────────────────
    s, e = bands[0]
    holerow = (alpha[s:e, :] == 0).mean(0) > 0.5
    rr = runs(holerow)
    centres = np.array([(p + q) / 2.0 for p, q in rr])
    assert len(rr) >= 8, "only %d holes found in the top band" % len(rr)
    pitch = float(np.median(np.diff(centres)))
    print("holes/band      %d   pitch %.2f px (sd %.2f)"
          % (len(rr), pitch, np.diff(centres).std()))

    # ── cut a whole number of pitches ─────────────────────────────────────
    n_pitch = int(cw // pitch)
    tile_w = int(round(n_pitch * pitch))
    # start midway between two holes so the join lands on plain base, not on
    # the rim of a perforation where any error is most visible
    first_gap_mid = int(round((rr[0][1] + rr[1][0]) / 2.0))
    left = first_gap_mid % int(round(pitch))
    if left + tile_w > cw:
        tile_w -= int(round(pitch))
        n_pitch -= 1
    print("tile            %d pitches -> %dpx wide, cut from x=%d"
          % (n_pitch, tile_w, left))

    rgbf = crop[:, left:left + tile_w].astype(np.float32)
    al = alpha[:, left:left + tile_w]

    # ── level the lighting gradient across the tile ───────────────────────
    # ⚠️ The scan is lit brighter at one end than the other — measured, the
    # two ends of the cut differed by 10.1% of the base tone. Left alone the
    # repeat turns that gradient into a STEP: a vertical bar of tone once per
    # tile, which reads as a join even when the perforations line up perfectly.
    #
    # Only the broad trend is removed. The profile is smoothed over a big
    # fraction of the tile before dividing, so dust, scratches and grain — the
    # things that make it look like film — survive untouched.
    opaque = al > 200
    colsum = np.where(opaque, rgbf.mean(2), 0).sum(0)
    colcnt = opaque.sum(0)
    prof = np.where(colcnt > 0, colsum / np.maximum(colcnt, 1), np.nan)
    idx = np.arange(tile_w)
    good = ~np.isnan(prof)
    prof = np.interp(idx, idx[good], prof[good])
    # ⚠️ A polynomial fit, NOT a wrapped Gaussian blur. Wrapping the smoothing
    # treats the tile's two ends as neighbours and averages them together, so
    # the fitted profile is already continuous across the join and dividing by
    # it removes nothing — measured, the 10.1% step came back as 10.7%. The
    # whole point is to remove an END-TO-END tilt, which needs a fit that can
    # see the tilt, and a low-order polynomial is exactly that.
    fit = np.polyval(np.polyfit(idx, prof, 3), idx)
    corr = (fit.mean() / np.maximum(fit, 1e-3)).astype(np.float32)
    rgbf *= corr[None, :, None]
    rgb = np.clip(rgbf, 0, 255).astype(np.uint8)

    band_rows = slice(int(ch * 0.25), int(ch * 0.75))
    chk = np.where(opaque[band_rows], rgb[band_rows].mean(2), np.nan)
    lo = np.nanmean(chk[:, :120]); hi = np.nanmean(chk[:, -120:])
    print("seam step       %.2f -> %.2f luma (%.1f%% of base) after levelling"
          % (lo, hi, 100 * (hi - lo) / max(lo, 1)))
    assert abs(hi - lo) / max(lo, 1) < 0.02, "seam step still %.1f%%" % (100 * (hi - lo) / lo)

    out = np.dstack([rgb, al])
    tile = Image.fromarray(out, "RGBA")

    # ── verify before writing ─────────────────────────────────────────────
    frac = (al == 0).mean()
    top = runs((al[bands[0][0]:bands[0][1], :] == 0).mean(0) > 0.5)
    bot = runs((al[bands[1][0]:bands[1][1], :] == 0).mean(0) > 0.5)
    print("transparent     %.1f%%   holes top/bottom %d/%d" % (100 * frac, len(top), len(bot)))
    assert 0.03 < frac < 0.20, "alpha fraction %.3f is implausible" % frac
    assert len(top) == len(bot) == n_pitch, \
        "hole count %d/%d != %d pitches" % (len(top), len(bot), n_pitch)

    aspect = tile_w / float(ch)
    slot = aspect / FRAMES_PER_TILE
    print("aspect          %.4f   FRAME-SLOT CONSTANT = %.6f" % (aspect, slot))

    tile.save(os.path.join(OUT, "film.webp"), quality=90, method=6)
    small = tile.resize((MOBILE_W, int(round(MOBILE_W * ch / tile_w))), Image.LANCZOS)
    small.save(os.path.join(OUT, "film-m.webp"), quality=88, method=6)

    # ── the emulsion grain that rides over each frame ─────────────────────
    # `.film-frame::before` paints this at exactly the tile's scale, offset by
    # the frame's own slot, so the grain runs continuously across a group
    # instead of restarting in every frame.
    #
    # ⚠️ It MUST be regenerated whenever the tile is — it is a high-pass of the
    # film scan itself, i.e. the same grain as the surrounding base rather than
    # a generic overlay. Left over from a previous scan it is grain from a
    # different piece of film, positioned by the new frame-slot constant, and
    # the two no longer agree.
    grey = Image.fromarray(rgb, "RGB").convert("L")
    blur = grey.filter(ImageFilter.GaussianBlur(3.0))
    hp = np.asarray(grey).astype(np.float32) - np.asarray(blur).astype(np.float32)
    amp = 3.2                     # overlay blend needs the detail lifted to read
    grain = np.clip(128 + hp * amp, 0, 255).astype(np.uint8)
    gim = Image.fromarray(grain, "L").convert("RGB")
    gim.save(os.path.join(OUT, "film-grain.webp"), quality=88, method=6)
    gim.resize((MOBILE_W, int(round(MOBILE_W * ch / tile_w))), Image.LANCZOS) \
       .save(os.path.join(OUT, "film-grain-m.webp"), quality=86, method=6)
    print("grain           sd %.1f around mid-grey (higher = more texture)"
          % grain.std())

    for n in ("film.webp", "film-m.webp", "film-grain.webp", "film-grain-m.webp"):
        p = os.path.join(OUT, n)
        chk = Image.open(p)
        kb = os.path.getsize(p) / 1024
        warn = ""
        if n.startswith("film.") or n.startswith("film-m."):
            warn = "⚠️ ALPHA LOST" if chk.mode != "RGBA" else ""
        print("wrote %-18s %-5s %5dx%-5d %8.1f KB %s"
              % (n, chk.mode, chk.size[0], chk.size[1], kb, warn))
    print("\nstyle.css needs the frame-slot constant: %.6f" % slot)


if __name__ == "__main__":
    main()
