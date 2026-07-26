"""
Turn the blue/green-screen crumple clip into a brand-palette sprite sheet.

The source is a double key:
  * blue  (0,102,246) -> the surround, becomes transparent
  * green              -> the paper's FACE, a chroma surface meant to be
                          replaced with your own artwork
Everything else is the paper stock itself (white/grey with fold shading).

We keep the shading from both surfaces and re-light it in ink + cream, then
print the alif onto the face so it creases with the paper.
"""
import io, pickle, sys
import numpy as np
from PIL import Image

INK = np.array([0x0F, 0x18, 0x20], float)
CREAM = np.array([0xD9, 0xD9, 0xCE], float)
BLUE = np.array([0, 102, 246], float)

FRAME_W, FRAME_H = 320, 450        # per-sprite cell, portrait
COLS, ROWS = 6, 4
ROTATE = Image.Transpose.ROTATE_90  # landscape sheet -> portrait plate

frames = pickle.load(open("crumple_frames.pkl", "rb"))
N = len(frames)
assert N == COLS * ROWS, N

# The alif, rasterised big once. The whole frame gets ROTATE_90'd at the end,
# so the glyph is pre-rotated the opposite way to land upright in the sprite.
GLYPH_SRC = sys.argv[1] if len(sys.argv) > 1 else "alif.png"
OUT = sys.argv[2] if len(sys.argv) > 2 else "crumple-sprite"
# the A is wide where the alif is narrow, so it needs its own fit factors
FIT_LONG, FIT_SHORT = (0.66, 0.46) if "alifA" not in GLYPH_SRC else (0.52, 0.60)
glyph = Image.open(GLYPH_SRC).convert("RGBA").transpose(Image.Transpose.ROTATE_270)


def masks(a):
    """a: HxWx3 float. -> (paper_alpha, green_mask, shade)"""
    dist_blue = np.sqrt(((a - BLUE) ** 2).sum(2))
    # soft matte so edges don't alias: fully out at <60, fully in at >120
    alpha = np.clip((dist_blue - 60.0) / 60.0, 0, 1)

    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    greenness = g - np.maximum(r, b)
    green = np.clip((greenness - 25.0) / 35.0, 0, 1) * alpha

    # luminance, used to carry every crease through into the recolour
    lum = (0.299 * r + 0.587 * g + 0.114 * b)
    return alpha, green, lum


def relight(a, alpha, green, lum):
    """Recolour into the brand palette, preserving fold shading."""
    out = np.zeros_like(a)

    # --- paper stock (non-green, inside the matte): white -> cream ---
    stock = alpha * (1 - green)
    if stock.sum() > 0:
        ref = np.percentile(lum[stock > 0.5], 82) if (stock > 0.5).any() else 255.0
        s = np.clip(lum / max(ref, 1e-3), 0, 1.35)[..., None]
        out += (CREAM * s) * stock[..., None]

    # --- the face: the green chroma surface -> a slightly deeper cream ---
    if green.sum() > 0:
        sel = green > 0.5
        ref_g = np.percentile(lum[sel], 82) if sel.any() else 255.0
        sg = np.clip(lum / max(ref_g, 1e-3), 0, 1.25)[..., None]
        out += (CREAM * 0.94 * sg) * green[..., None]

    return out, green


def print_glyph(out, green, lum, fade):
    """Lay the alif into the face, creasing it with the paper's own shading."""
    if fade <= 0 or green.max() < 0.5:
        return out
    ys, xs = np.nonzero(green > 0.5)
    if len(xs) < 50:
        return out
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    bw, bh = x1 - x0, y1 - y0
    if bw < 8 or bh < 8:
        return out

    # Fit inside the face with margin, keeping aspect. The glyph is lying on
    # its side here (see the pre-rotation above), so its long axis runs along
    # the face's width — hence the generous factor on bw, tight one on bh.
    gw, gh = glyph.size
    scale = min(bw * FIT_LONG / gw, bh * FIT_SHORT / gh)
    tw, th = max(int(gw * scale), 1), max(int(gh * scale), 1)
    gi = glyph.resize((tw, th), Image.LANCZOS)
    ga = np.zeros(out.shape[:2], float)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    px, py = cx - tw // 2, cy - th // 2
    sx0, sy0 = max(px, 0), max(py, 0)
    sx1, sy1 = min(px + tw, out.shape[1]), min(py + th, out.shape[0])
    if sx1 <= sx0 or sy1 <= sy0:
        return out
    garr = np.array(gi).astype(float)[..., 3] / 255.0
    ga[sy0:sy1, sx0:sx1] = garr[sy0 - py:sy1 - py, sx0 - px:sx1 - px]

    ga = ga * (green > 0.5) * fade
    sel = green > 0.5
    ref = np.percentile(lum[sel], 82) if sel.any() else 255.0
    shade = np.clip(lum / max(ref, 1e-3), 0.25, 1.2)[..., None]
    ink = INK * (0.55 + 0.45 * shade)      # ink still catches the folds
    return out * (1 - ga[..., None]) + ink * ga[..., None]


cells = []
for i, (t, raw) in enumerate(frames):
    a = np.array(Image.open(io.BytesIO(raw)).convert("RGB")).astype(float)
    alpha, green, lum = masks(a)
    out, green = relight(a, alpha, green, lum)
    # the print only becomes readable once the sheet is opening out
    fade = np.clip((i / (N - 1) - 0.45) / 0.35, 0, 1)
    out = print_glyph(out, green, lum, fade)

    rgba = np.dstack([np.clip(out, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA").transpose(ROTATE).resize((FRAME_W, FRAME_H), Image.LANCZOS)
    cells.append(im)
    if i in (0, 8, 16, N - 1):
        im.save(f"{OUT}-cell{i:02d}.png")

sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * ROWS), (0, 0, 0, 0))
for i, im in enumerate(cells):
    sheet.paste(im, ((i % COLS) * FRAME_W, (i // COLS) * FRAME_H), im)
sheet.save(OUT + ".webp", quality=90, method=6)
sheet.save(OUT + ".png")
print("sprite", sheet.size,
      "webp", round(len(open(OUT + '.webp','rb').read()) / 1024), "KB",
      "png", round(len(open(OUT + '.png','rb').read()) / 1024), "KB")

# contact sheet for review
cs = Image.new("RGB", (FRAME_W * COLS // 2, FRAME_H * ROWS // 2), (0xD9, 0xD9, 0xCE))
for i, im in enumerate(cells):
    small = im.resize((FRAME_W // 2, FRAME_H // 2), Image.LANCZOS)
    cs.paste(small, ((i % COLS) * FRAME_W // 2, (i // COLS) * FRAME_H // 2), small)
cs.save(OUT + "-contact.png")
print("contact", cs.size)
