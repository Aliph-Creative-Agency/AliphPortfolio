"""Give the ring marks torn-paper edges where the photograph was cropped.

    python resources/tear_marks.py            # writes assets/marks/mark-*-torn.webp
    python resources/tear_marks.py --debug    # also writes previews on linen

"the marks in the middle of the services rings, they all have cut straight
edges and its not good lookin, can u try and make those edges like the
edges of a torn paper, only in shape and looks not in color" — the agency,
2026-09-15.

A cut-out person is bounded by two kinds of edge: their own silhouette,
which cut_people_marks.py segments, and the FRAME — wherever the subject
ran out of the photograph the segmenter had to stop at the picture's
border, and that leaves a ruler-straight line: the bottom of all three, the
top and right of the designer's monitor, the developer's chair on the left.
This script finds those border-touching runs and tears them.

The tear is not synthesised: it is the actual deckle of the agency's own
scraps. `PROFILES` reads the torn outline of a shipped scrap along one of
its edges — how far in from a straight line the paper's edge sits at each
step along it, fibres and all — and that profile, resampled to the run's
length and scaled to the mark's size, is carved into the mark's alpha.
Where two cut edges meet at a corner the two carvings simply intersect.

"Looks not colour": the photograph's pixels are not tinted. What a torn
edge has that a cut one does not, besides the outline, is the RIM — the
lighter fibres where the paper's body shows at the break — so the few
pixels inside the new edge are pulled toward a fibre colour, strongest at
the edge, broken up by noise so it reads as fibre and not as a stroke. The
rim is the one place a paper colour touches the mark, and it is 1.5% of
its short side wide.

Sources are `prototype/assets/marks/mark-*.webp` (the cutter's output,
untouched) and the outputs are `mark-*-torn.webp` beside them — RING_MARKS
in main.js points at the torn set; point it back at the originals to undo.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
MARKS = ROOT / "prototype" / "assets" / "marks"
SCRAPS = ROOT / "prototype" / "assets" / "img"
DEBUG = "--debug" in sys.argv

AMP = 0.017       # the tear's depth: std of the waves, as a share of the
                  # mark's short side — "the effect is over done" at 0.03,
                  # which was the scraps' own deckle; a mark is not a sheet
FIBRE = 0.25      # the fibres' share of that depth (their spikes ride on the waves)
RIM = 0.007       # the fibre rim's width, same share
RIM_RGB = np.array([243, 240, 232], np.float32)
BASE = 320        # a mark's short side at which the profile is used 1:1 — the
                  # three marks are 320, 620 and 1291px short but all render
                  # in the same ~400px box, so the waves are scaled to LOOK
                  # the same size and not to be the same number of pixels
MIN_RUN = 0.06    # a border run shorter than this share of the side is not a
                  # cut edge, it is a fibre or a shoe touching the frame

# which scrap each mark tears with, so the three do not share one outline,
# and which of its cut edges are LEFT ALONE: the designer's monitor is cut
# on the right and the agency wants that edge straight ("dont do the right
# side of the screen for the graphic dev")
PROFILES = {
    "design": ("scrap-band-2.webp", {"right"}),
    "photo": ("scrap-quote.webp", set()),
    "tech": ("scrap-band-5.webp", set()),
}


def edge_profile(alpha, side):
    """Inset of the torn edge from a straight line, per step along `side`
    of a scrap ("bottom" | "top" | "left" | "right"), zero-mean, in px."""
    a = alpha > 128
    if side in ("bottom", "top"):
        cols = np.where(a.any(0))[0]
        prof = []
        for x in cols:
            ys = np.where(a[:, x])[0]
            prof.append(ys.max() if side == "bottom" else ys.min())
        prof = np.array(prof, np.float32)
        inset = prof.max() - prof if side == "bottom" else prof - prof.min()
    else:
        rows = np.where(a.any(1))[0]
        prof = []
        for y in rows:
            xs = np.where(a[y])[0]
            prof.append(xs.max() if side == "right" else xs.min())
        prof = np.array(prof, np.float32)
        inset = prof.max() - prof if side == "right" else prof - prof.min()
    # the middle 80%: the corners of a scrap curl and are not an edge's shape
    n = len(inset)
    inset = inset[n // 10: n - n // 10]
    # take out the slow lean of the scrap (it is never quite square to the
    # frame); split what is left into the WAVES of the tear and the FIBRES
    # riding on them, because they are scaled separately below
    trend = ndi.gaussian_filter1d(inset, n / 6)
    inset = inset - trend
    waves = ndi.gaussian_filter1d(inset, 5)
    return waves, inset - waves


def resample(prof, length, scale, rng):
    """`prof` read at a random phase and stretched by `scale` (a mark whose
    pixels are 4x finer than the base needs the waves 4x longer in px to
    look the same), interpolated so nothing aliases into spikes."""
    n = len(prof)
    start = rng.uniform(0, n)
    pos = (start + np.arange(length) / scale) % n
    i0 = pos.astype(int)
    t = pos - i0
    return prof[i0] * (1 - t) + prof[(i0 + 1) % n] * t


def runs(mask, min_len):
    """Start/end pairs of True runs at least min_len long."""
    out, start = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_len:
                out.append((start, i))
            start = None
    return out


def tear(rgba, prof, rng, skip=()):
    waves, fibres = prof
    H, W = rgba.shape[:2]
    alpha = rgba[..., 3].astype(np.float32)
    solid = alpha > 128
    short = min(H, W)
    scale = short / BASE
    amp = AMP * short
    rim = max(2.0, RIM * short)
    # distance from the straight border each cut edge is carved from; the
    # tear's inset is written here, then turned into alpha in one pass
    cut = np.zeros((H, W), np.float32)        # 1 = torn away
    yy, xx = np.mgrid[0:H, 0:W]
    edges = 0
    sides = [("bottom", solid[H - 1], H - 1 - yy, 0), ("top", solid[0], yy, 0),
             ("right", solid[:, W - 1], W - 1 - xx, 1), ("left", solid[:, 0], xx, 1)]
    for name, border, depth, axis in sides:
        if name in skip:
            continue
        span = W if axis == 0 else H
        for s, e in runs(border, int(MIN_RUN * span)):
            edges += 1
            pw = resample(waves, e - s, scale, rng)
            pf = resample(fibres, e - s, scale, rng)
            p = pw / (pw.std() + 1e-6) * amp + pf / (pf.std() + 1e-6) * amp * FIBRE
            p = p - p.min() + 0.15 * amp          # everything carves inward
            inset = np.zeros(span, np.float32)
            inset[s:e] = p
            # ease the run's ends to zero over 4% of the side so the tear
            # does not stop dead where the run does
            k = max(3, int(0.04 * span))
            ramp = np.minimum(1, np.minimum(np.arange(span) - s + 1, e - np.arange(span)) / k)
            inset *= np.clip(ramp, 0, 1)
            field = inset[None, :] if axis == 0 else inset[:, None]
            cut = np.maximum(cut, np.clip(field - depth + 0.5, 0, 1))
    if not edges:
        return rgba, 0
    keep = solid & (cut < 0.5)
    # a 1px soft edge, like the scraps'
    new_alpha = ndi.gaussian_filter(keep.astype(np.float32), 0.8) * 255
    new_alpha = np.minimum(new_alpha, alpha)
    # the rim: distance inward from the NEW torn edge, only along the tears
    torn_band = (cut > 0) | ndi.binary_dilation(cut > 0.5, iterations=int(rim) + 2)
    dist = ndi.distance_transform_edt(keep)
    w = np.clip(1 - dist / rim, 0, 1) * torn_band * keep
    noise = ndi.gaussian_filter(rng.random((H, W)).astype(np.float32), 1.6 * scale)
    noise = (noise - noise.mean()) / (noise.std() + 1e-6)
    w = np.clip(w * (0.75 + 0.3 * noise), 0, 1) ** 1.5 * 0.7
    rgb = rgba[..., :3].astype(np.float32)
    rgb = rgb * (1 - w[..., None]) + RIM_RGB * w[..., None]
    out = np.dstack([np.clip(rgb, 0, 255), new_alpha]).astype(np.uint8)
    return out, edges


def main():
    rng = np.random.default_rng(7)
    for key, (scrap, skip) in PROFILES.items():
        src = MARKS / ("mark-%s.webp" % key)
        rgba = np.asarray(Image.open(src).convert("RGBA"))
        salpha = np.asarray(Image.open(SCRAPS / scrap).convert("RGBA"))[..., 3]
        prof = edge_profile(salpha, "bottom")
        out, n = tear(rgba, prof, rng, skip)
        dest = MARKS / ("mark-%s-torn.webp" % key)
        Image.fromarray(out).save(dest, "WEBP", quality=88, method=6)
        print("%-7s %d cut edge(s) torn with %s  -> %s  %.0f KB"
              % (key, n, scrap, dest.name, dest.stat().st_size / 1024))
        if DEBUG:
            dbg = ROOT / "resources" / "clippings" / "debug"   # gitignored
            dbg.mkdir(exist_ok=True)
            bg = Image.new("RGBA", (out.shape[1], out.shape[0]), (217, 217, 206, 255))
            bg.alpha_composite(Image.fromarray(out))
            bg.convert("RGB").save(dbg / ("mark-%s-torn.jpg" % key), quality=85)


if __name__ == "__main__":
    main()
