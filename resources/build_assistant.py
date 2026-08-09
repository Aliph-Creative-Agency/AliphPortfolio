# -*- coding: utf-8 -*-
"""Build the assistant launcher's two layers.

The launcher is a ring of type that TURNS around a double-alif mark that
stays STILL, with no disc behind either — so they have to be two separate
transparent images, not the one composite in resources/assistant.png.

  resources/text-with-background.jpg -> assets/img/assistant-ring{,-cream}.png
  resources/double-aliph.png         -> assets/img/assistant-mark{,-cream}.png

⚠️ Key on INKINESS, not on luminance thresholding. Both sources are ink on
white; a hard brightness cut eats the anti-aliased edge of every stroke and
the type comes out ragged at 100px. Rebuilding alpha from how ink-like each
pixel is keeps the edges smooth and removes the white halo by construction.

⚠️ The ring must be trimmed to a SQUARE centred on the ring itself, or it
will wobble when it rotates — CSS spins around the box centre, not the
artwork's centre.
"""
import os
import numpy as np
from PIL import Image

RES = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(RES, "..", "prototype", "assets", "img")

INK = (15, 24, 32)
CREAM = (217, 217, 206)


def lift(path, size, pad=0.0):
    """Ink-on-white -> straight alpha, trimmed and squared.

    ⚠️ Composite onto WHITE, and honour any alpha the source already carries.
    double-aliph.png is RGBA whose *transparent* pixels are black, so a plain
    .convert("RGB") drops it onto black, every pixel reads as ink and the mark
    comes out as a solid rectangle. Flattening onto white keeps the cutout
    reading as paper; multiplying by the source alpha keeps the torn edge.
    """
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    src = a[..., 3] / 255.0
    flat = a[..., :3] * src[..., None] + 255.0 * (1.0 - src[..., None])

    lum = flat.max(axis=2)
    alpha = np.clip((235.0 - lum) / 185.0, 0.0, 1.0) * 255.0
    alpha *= src                                 # never invent ink in a hole
    alpha[alpha < 26] = 0.0                      # drop paper speckle

    rgba = np.zeros(a.shape[:2] + (4,), dtype=np.float32)
    rgba[..., 3] = alpha
    img = Image.fromarray(rgba.astype(np.uint8), "RGBA")

    bbox = img.getbbox()
    if bbox is None:
        raise SystemExit("nothing survived the key in " + path)
    img = img.crop(bbox)
    alpha = np.asarray(img)[..., 3]

    w, h = img.size
    side = int(max(w, h) * (1.0 + pad))
    sq = Image.new("L", (side, side), 0)
    sq.paste(Image.fromarray(alpha), ((side - w) // 2, (side - h) // 2))
    return sq.resize((size, size), Image.LANCZOS)


def emit(mask, name, color):
    out = np.zeros(mask.size[::-1] + (4,), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = color
    out[..., 3] = np.asarray(mask)
    p = os.path.join(OUT, name)
    Image.fromarray(out, "RGBA").save(p, optimize=True)
    print("  %-28s %.0f KB" % (name, os.path.getsize(p) / 1024))


ring = lift(os.path.join(RES, "text-with-background.jpg"), 512)
mark = lift(os.path.join(RES, "double-aliph.png"), 512)

print("assistant launcher layers:")
emit(ring, "assistant-ring.png", INK)
emit(ring, "assistant-ring-cream.png", CREAM)
emit(mark, "assistant-mark.png", INK)
emit(mark, "assistant-mark-cream.png", CREAM)
