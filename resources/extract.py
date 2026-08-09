"""Pull the annotated boxes out of the user's markup.

green  = header slot
red    = text slot
yellow = media holder
purple = splitter line

Everything is reported as a percentage of the page column, so the numbers
translate straight into CSS grid tracks and aspect ratios.
"""
import numpy as np
from PIL import Image

im = Image.open(r"C:\Users\Obaida\Desktop\Untitled.png").convert("RGB")
a = np.asarray(im).astype(int)
R, G, B = a[..., 0], a[..., 1], a[..., 2]

masks = {
    "green":  (G > 110) & (R < 110) & (B < 110),
    "red":    (R > 140) & (G < 90) & (B < 90),
    "yellow": (R > 150) & (G > 130) & (B < 120),
    "purple": (R > 90) & (B > 110) & (G < R - 35) & (G < B - 35),
}


def boxes(mask, min_w=25, min_h=8):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    out = []
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        stack = [(sy, sx)]
        seen[sy, sx] = True
        x0 = x1 = sx
        y0 = y1 = sy
        while stack:
            cy, cx = stack.pop()
            if cx < x0: x0 = cx
            if cx > x1: x1 = cx
            if cy < y0: y0 = cy
            if cy > y1: y1 = cy
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if (x1 - x0) >= min_w and (y1 - y0) >= min_h:
            out.append((x0, y0, x1, y1))
    return sorted(out, key=lambda b: (b[1], b[0]))


dark = (R < 100) & (G < 100) & (B < 100)
colsum = dark.sum(axis=0)
cand = np.where(colsum > dark.shape[0] * 0.30)[0]
PL, PR = int(cand.min()), int(cand.max())
PW = PR - PL
print("page column: x %d..%d  width %d px\n" % (PL, PR, PW))

everything = []
for name, m in masks.items():
    bs = boxes(m, min_w=(20 if name == "purple" else 25),
               min_h=(3 if name == "purple" else 8))
    print("== %s (%d) ==" % (name, len(bs)))
    for (x0, y0, x1, y1) in bs:
        w, h = x1 - x0, y1 - y0
        print("   x %5.1f%% -> %5.1f%%   w %5.1f%%   y %5d..%-5d  h %4d  | ratio w/h %.2f"
              % (100 * (x0 - PL) / PW, 100 * (x1 - PL) / PW, 100 * w / PW,
                 y0, y1, h, (w / h if h else 0)))
        everything.append((name, y0, x0, x1, y1))
    print()

print("== reading order (top to bottom) ==")
for name, y0, x0, x1, y1 in sorted(everything, key=lambda e: e[1]):
    print("  y%-6d %-7s  x %5.1f%%..%5.1f%%  h %4d" %
          (y0, name, 100 * (x0 - PL) / PW, 100 * (x1 - PL) / PW, y1 - y0))
