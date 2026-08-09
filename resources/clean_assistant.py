# -*- coding: utf-8 -*-
"""Clean resources/assistant.png into a usable launcher mark.

The supplied file has two problems:
  1. a WHITE FRINGE around every glyph — the halo left behind when artwork
     is lifted off a light background with a hard key;
  2. a black matte in the transparent area, so any residual alpha shows as
     black crud rather than nothing.

⚠️ Do NOT key on luminance alone. The mark is ink (#0F1820-ish) on white,
so a brightness threshold that removes the fringe also eats the anti-aliased
edge of every stroke and the type comes out ragged at launcher size.

The approach instead: rebuild alpha from how INK-LIKE each pixel is, then
recolour every surviving pixel to flat brand ink. That kills the white fringe
by construction — a fringe pixel is mostly white, so it gets low alpha — and
leaves the stroke edges smoothly anti-aliased.

Output: assistant-clean.png (RGBA, trimmed, square) into prototype/assets/img/.
"""
import numpy as np
from PIL import Image

SRC = r"D:\Personal\Projects\aliph-portfolio\resources\assistant.png"
OUTS = {
    r"D:\Personal\Projects\aliph-portfolio\prototype\assets\img\assistant.png": (15, 24, 32),
    # the launcher is an ink disc, so it needs the mark in cream
    r"D:\Personal\Projects\aliph-portfolio\prototype\assets\img\assistant-cream.png": (217, 217, 206),
}

im = Image.open(SRC).convert("RGBA")
a = np.asarray(im).astype(np.float32)
rgb, alpha = a[..., :3], a[..., 3]

# Where the source is already fully transparent it stays transparent.
present = alpha > 8

# "Inkiness": 1 where the pixel is dark, 0 where it is paper-white. Using the
# max channel keeps coloured fringes (they are light) out of the mark.
lum = rgb.max(axis=2)
ink = np.clip((225.0 - lum) / 175.0, 0.0, 1.0)     # white->0, ink->1

new_alpha = np.where(present, ink * 255.0, 0.0)

# Drop the dust: anything under ~12% coverage is fringe or JPEG-ish noise.
new_alpha[new_alpha < 30] = 0.0

import os
for OUT, COLOR in OUTS.items():
    out = np.zeros_like(a)
    out[..., 0], out[..., 1], out[..., 2] = COLOR
    out[..., 3] = new_alpha
    img = Image.fromarray(out.astype(np.uint8), "RGBA")

    # trim to the mark, then pad back to a square so it centres in a round button
    bbox = img.getbbox()
    img = img.crop(bbox)
    w, h = img.size
    side = max(w, h)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(img, ((side - w) // 2, (side - h) // 2))

    # the launcher paints it at ~72px; 512 is plenty and keeps the file small
    sq = sq.resize((512, 512), Image.LANCZOS)
    sq.save(OUT, optimize=True)
    print("wrote %s  %.0f KB" % (os.path.basename(OUT), os.path.getsize(OUT) / 1024))
