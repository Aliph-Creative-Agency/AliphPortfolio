"""Cut the testimonial scraps out of their ground.

    python resources/cut_scraps.py            # writes the webp files
    python resources/cut_scraps.py --debug    # also writes masks/previews

Writes `prototype/assets/img/scrap-*.webp` — every piece of torn paper the
testimonials are set on since 2026-09-14. Sources are the agency's own
frames in `resources/clippings/` (they replaced the 2026-09-13 pair, whose
dummy print had to be cleared; these are blank):

    title-sheet.jpeg   the masthead sheet of the home-page cutting
    quote-sheet.png    the column sheet under it
    footer-sheet.png   the sheet over the desktop rotor, on a green ground
    band-scraps.png    FIVE scraps on one green ground, for the phone stripe

The cut is the same flood fill cut_clippings.py used: the ground is flat
(a gradient of ~10 levels across the frame, measured), the torn edge is a
closed outline of white fibres over a shadow, so every pixel within `tol`
of the border colour that is CONNECTED to the border is ground; the rest,
holes filled, is paper. The off-white sheets need a tight tolerance (the
paper is 245/239/228 against a 237/236/228 ground — 0 apart in blue) and
the green ones can take a loose one. birefnet is not involved: on the
2026-09-13 pair it returned 40% of a card, calling the print and the
photograph "not the object", and these frames never needed a model.

⚠️ The title sheet is the one that still needs CLEARING. It came over as a
JPEG with the ghost of its old headline still in the paper — a blotchy
"WORLD TODAY" at ~10 levels under the paper — and live type over a ghost
reads as a palimpsest. Inside the torn edge (and off the tape) the paper is
rebuilt the way the old cutter rebuilt it: a shading field from the pixels
that are paper (normalised convolution, so the ghost never enters the
average) plus the sheet's own grain borrowed from clean pixels a fixed
offset away. The other three are shipped as shot.

The band scraps are split into components and scaled to ONE HEIGHT —
"imagine a horizontal line above and below and fit them between the 2
lines" — so the stripe's cards are all the same height and only their
widths differ. Each keeps its own aspect and its own SAFE box.

Prints, per file, the SAFE box: the largest rectangle of plain paper
inside the torn edge and off the tape, as percentages of the shipped file.
style.css / main.js position the type inside that box; re-run and re-copy
if a source changes.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(__file__).resolve().parent / "clippings"
OUT = ROOT / "prototype" / "assets" / "img"
DEBUG = "--debug" in sys.argv

SHIP = 1400      # long edge that ships for the single sheets (~600 CSS px slot)
BAND_H = 420     # every band scrap ships this tall (a ~150 CSS px card, 2x+)
EDGE = 26        # px inside the outline that count as torn edge, not paper

# key, file, flood tolerance, tape bbox (x0,y0,x1,y1) in source px or None,
# clear the paper (title sheet only), split into components (band only)
JOBS = [
    ("title",  "title-sheet.jpeg", 6,  (0, 0, 330, 270),  True,  False),
    ("quote",  "quote-sheet.png",  6,  (1100, 0, 1780, 280), False, False),
    ("footer", "footer-sheet.png", "green", None,         False, False),
    ("band",   "band-scraps.png",  "green", None,         False, True),
]
# the footer sheet's two tapes, both kept as shot, both off the safe box
FOOTER_TAPES = [(1380, 0, 1902, 340), (0, 500, 430, 827)]


def sane(s):
    return str(s).encode("ascii", "replace").decode()


def lum_of(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def box_mask(shape, boxes):
    m = np.zeros(shape, bool)
    for x0, y0, x1, y1 in boxes or []:
        m[y0:y1, x0:x1] = True
    return m


def flood(rgb, tol):
    """Paper mask: everything that is not ground connected to the border.
    `tol` is a distance from the border colour for the off-white grounds,
    or the string "green" for the two green frames — there the ground and
    its SHADOW under the scrap are both green (G-B 32..43, luminance under
    ~175) while paper, tape and fibres are warm (G-B 7..21) or bright, so
    the ground is found by colour and the shadow goes with it. A distance
    tolerance kept the shadow as paper and it shipped as an olive rim."""
    f = ndi.gaussian_filter(rgb.astype(np.float32), (0.8, 0.8, 0))
    if tol == "green":
        near = ((f[..., 1] - f[..., 2]) > 26) & (lum_of(f) < 190)
    else:
        border = np.concatenate([f[:6].reshape(-1, 3), f[-6:].reshape(-1, 3),
                                 f[:, :6].reshape(-1, 3), f[:, -6:].reshape(-1, 3)])
        near = (np.abs(f - border.mean(0)) < tol).all(-1)
    lab, _ = ndi.label(near)
    touching = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    paper = ~np.isin(lab, list(touching))
    return ndi.binary_fill_holes(paper)


def defringe(rgb, mask):
    """Pull the ground out of the outline. A torn edge is fibres over ground
    at partial coverage, so its pixels are a MIX of paper and green; in the
    outer few px of the mask the green share is read off G-B (paper ~14,
    ground ~34), that share of the ground colour is subtracted, and the
    alpha becomes the coverage. Returns rgb, coverage (1 = opaque)."""
    f = rgb.astype(np.float32)
    ground = np.concatenate([f[:6].reshape(-1, 3), f[-6:].reshape(-1, 3),
                             f[:, :6].reshape(-1, 3), f[:, -6:].reshape(-1, 3)]).mean(0)
    band = mask & ~ndi.binary_erosion(mask, iterations=4)
    gb = f[..., 1] - f[..., 2]
    t = np.clip((gb - 16) / (34 - 16), 0, 0.9) * band
    out = np.clip((f - t[..., None] * ground) / (1 - t)[..., None], 0, 255)
    return out.astype(np.uint8), 1 - t


def components(mask, min_px=20000):
    lab, n = ndi.label(mask)
    out = []
    for i, sl in enumerate(ndi.find_objects(lab), start=1):
        if sl is None:
            continue
        m = lab == i
        if m.sum() < min_px:
            continue
        out.append(m)
    return out


def soft_alpha(mask):
    a = ndi.gaussian_filter(mask.astype(np.float32), 1.0)
    return (np.clip(a, 0, 1) * 255).astype(np.uint8)


def field(rgb, weight, sigma):
    """Normalised convolution: a blur of rgb that only counts `weight` pixels."""
    w = ndi.gaussian_filter(weight.astype(np.float32), sigma)
    out = np.empty_like(rgb, dtype=np.float32)
    for c in range(3):
        out[..., c] = ndi.gaussian_filter(rgb[..., c] * weight, sigma) / np.maximum(w, 1e-6)
    return out, w


def clear_ghost(rgb, paper, tape):
    """Rebuild the paper inside the torn edge: field + borrowed grain.
    Everything inside is replaced, because the ghost is everywhere; what
    varies is only which pixels are trusted to DESCRIBE the paper."""
    rgbf = rgb.astype(np.float32)
    lum = lum_of(rgbf)
    interior = ndi.binary_erosion(paper, iterations=EDGE) & ~tape
    # the ghost is ~10 levels under the paper and its halo a few over it
    ghost = ndi.binary_dilation(interior & ((lum < 232) | (lum > 247)), iterations=3)
    clean = interior & ~ghost
    fine, wf = field(rgbf, clean, 22)
    coarse, _ = field(rgbf, clean, 90)
    t = np.clip(wf / 0.08, 0, 1)[..., None]
    shade = fine * t + coarse * (1 - t)

    resid = rgbf - ndi.gaussian_filter(rgbf, (6, 6, 0))
    source = clean & ~ndi.binary_dilation(ghost, iterations=8)
    grain = np.zeros_like(rgbf)
    filled = np.zeros(paper.shape, bool)
    for k in (40, 80, 130, 200, 300, 440):
        for dy, dx in ((0, k), (0, -k), (k, 0), (-k, 0), (k, k), (-k, -k), (k, -k), (-k, k)):
            ok = np.roll(np.roll(source, dy, 0), dx, 1)
            take = interior & ~filled & ok
            if not take.any():
                continue
            grain[take] = np.roll(np.roll(resid, dy, 0), dx, 1)[take]
            filled |= take
    synth = np.clip(shade + grain, 0, 255)
    f = ndi.gaussian_filter(interior.astype(np.float32), 2.5)[..., None]
    return (rgbf * (1 - f) + synth * f).astype(np.uint8), interior


def safe_box(ok, box):
    """Largest axis-aligned rectangle of `ok` inside `box`, as % insets of
    the box. The maximal-rectangle sweep: a histogram per row, a stack per
    histogram, O(h*w)."""
    x0, y0, x1, y1 = box
    ok = ok[y0:y1, x0:x1]
    h, w = ok.shape
    heights = np.zeros(w, int)
    best = (0, (0, 0, 0, 0))
    for y in range(h):
        heights = np.where(ok[y], heights + 1, 0)
        stack = []
        for x in range(w + 1):
            cur = heights[x] if x < w else 0
            start = x
            while stack and stack[-1][1] > cur:
                sx, sh = stack.pop()
                area = sh * (x - sx)
                if area > best[0]:
                    best = (area, (sx, y - sh + 1, x, y + 1))
                start = sx
            stack.append((start, cur))
    lx, ty, rx, by = best[1]
    return (100 * lx / w, 100 * ty / h, 100 * (w - rx) / w, 100 * (h - by) / h)


def ship(name, rgb, mask, plain, size_to, coverage=None):
    """Crop to the mask, resize, save, print the safe box."""
    alpha = soft_alpha(mask)
    if coverage is not None:
        alpha = (alpha * coverage).astype(np.uint8)
    im = Image.fromarray(rgb).convert("RGBA")
    im.putalpha(Image.fromarray(alpha))
    box = im.split()[-1].getbbox()
    sb = safe_box(plain, box)
    im = im.crop(box)
    im = im.resize(size_to(im.size), Image.LANCZOS)
    dest = OUT / ("scrap-%s.webp" % name)
    im.save(dest, "WEBP", quality=82, method=6)
    print("%-9s %dx%d  %3.0f KB  safe  L %.1f%%  T %.1f%%  R %.1f%%  B %.1f%%"
          % (dest.name, im.width, im.height, dest.stat().st_size / 1024, *sb))
    if DEBUG:
        dbg = SRC / "debug"
        dbg.mkdir(exist_ok=True)
        bg = Image.new("RGBA", im.size, (110, 110, 110, 255))
        bg.alpha_composite(im)
        bg.convert("RGB").save(dbg / ("%s-preview.jpg" % name), quality=85)
    return sb


def by_long_edge(size):
    s = min(1.0, SHIP / max(size))
    return (round(size[0] * s), round(size[1] * s))


def by_height(size):
    s = BAND_H / size[1]
    return (round(size[0] * s), BAND_H)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for key, name, tol, tape_box, do_clear, split in JOBS:
        rgb = np.asarray(Image.open(SRC / name).convert("RGB"))
        paper = flood(rgb, tol)
        parts = components(paper) if split else [paper]
        if split:
            # reading order: rows by centre y, then by x
            cy = lambda m: ndi.center_of_mass(m)[0]
            parts.sort(key=lambda m: (round(cy(m) / 300), ndi.center_of_mass(m)[1]))
        print("%s  mask %.1f%%  %d piece(s)" % (sane(name), paper.mean() * 100, len(parts)))
        tapes = [tape_box] if tape_box else (FOOTER_TAPES if key == "footer" else [])
        tape = box_mask(paper.shape, tapes)
        for i, m in enumerate(parts):
            out, cov = rgb, None
            plain = ndi.binary_erosion(m, iterations=EDGE) & ~tape
            if do_clear:
                out, plain = clear_ghost(rgb, m, tape)
            if tol == "green":
                out, cov = defringe(rgb, m)
            ship("%s-%d" % (key, i + 1) if split else key, out, m, plain,
                 by_height if split else by_long_edge, cov)
            if DEBUG:
                dbg = SRC / "debug"
                dbg.mkdir(exist_ok=True)
                Image.fromarray((m * 255).astype(np.uint8)).save(dbg / ("%s-%d-mask.png" % (key, i)))


if __name__ == "__main__":
    main()
