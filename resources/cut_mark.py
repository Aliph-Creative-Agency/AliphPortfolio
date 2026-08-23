# Turn a cutout-on-flat-ground photograph into a transparent WebP for the
# centre of a service ring.
#
# 🔴 A COLOUR KEY WOULD DESTROY THIS PICTURE. The supplied cutout is the
# agency's cameraman on flat black — and he is wearing a black shirt. Keying
# "near black" to alpha eats the shirt and leaves a floating head and two arms.
#
# So the ground is found by REACHABILITY, not by colour: near-ground pixels are
# grouped into connected runs, and a run is ground if it reaches the border —
# or if it is big enough that nothing else it could be. The shirt is black and
# never reaches the border, because the man's own outline separates it. This is
# the difference between "which pixels look like the ground" and "which pixels
# ARE the ground", and only the second one is true.
#
# The size rule is what clears the pocket of background enclosed between his
# arm, the rig and his body, which no path reaches from outside. Measured on
# this frame the pocket is 49,703px and the next enclosed run is 3,904 — a 13x
# gap, so 1% of the frame sits comfortably between them.
#
# The edge is then feathered by one pass so the cutout does not sit on the page
# with a jagged aliased rim.
#
#   python resources/cut_mark.py <in.jpg> <out.webp> [--ground 0,0,0] [--tol 2]

import os, sys
from collections import deque
from PIL import Image, ImageFilter

OUT_LONG = 900          # the mark is drawn at 58-116px; 900 is ample at 3x


def say(s):
    sys.stdout.write(str(s) + "\n")
    sys.stdout.flush()


def ground_mask(im, ground, tol):
    """Alpha mask: 0 where the flat ground is, 255 on the subject."""
    w, h = im.size
    px = im.load()
    gr, gg, gb = ground
    near = bytearray(w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b = px[x, y]
            near[row + x] = 1 if (abs(r - gr) + abs(g - gg) + abs(b - gb)) <= tol * 3 else 0

    big = int(w * h * 0.01)
    out = bytearray([255]) * (w * h)
    seen = bytearray(w * h)
    for start in range(w * h):
        if not near[start] or seen[start]:
            continue
        seen[start] = 1
        run = [start]
        q = deque([start])
        edge = False
        while q:
            i = q.popleft()
            x, y = i % w, i // w
            if x == 0 or y == 0 or x == w - 1 or y == h - 1:
                edge = True
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny * w + nx
                    if near[j] and not seen[j]:
                        seen[j] = 1
                        run.append(j)
                        q.append(j)
        if edge or len(run) >= big:
            for i in run:
                out[i] = 0

    a = Image.new("L", (w, h))
    a.putdata(list(out))
    return a


def main():
    src, dst = sys.argv[1], sys.argv[2]
    ground = (0, 0, 0)
    tol = 2
    if "--ground" in sys.argv:
        ground = tuple(int(v) for v in sys.argv[sys.argv.index("--ground") + 1].split(","))
    if "--tol" in sys.argv:
        tol = int(sys.argv[sys.argv.index("--tol") + 1])

    im = Image.open(src).convert("RGB")
    say("in  %dx%d  ground=%s tol=%d" % (im.width, im.height, ground, tol))
    a = ground_mask(im, ground, tol)

    inked = sum(a.histogram()[1:]) / float(im.width * im.height)
    say("subject covers %.1f%% of the frame" % (inked * 100))
    # ⚠️ A sanity check, not decoration. 🔴 A LOOSE TOLERANCE EATS THE SUBJECT:
    # at tol=46 the fill walked straight out of the ground and into his black
    # shirt — they touch with no edge between them — and left a floating head
    # and two arms, at a plausible-looking 22.6% coverage. The default of 2
    # keeps the shirt (its darkest pixels sum to ~20 against a ground of
    # exactly 0) and reads 60%. Anything far outside that band is a leak.
    if not 0.25 < inked < 0.92:
        raise SystemExit("implausible coverage - the fill leaked or found nothing")

    a = a.filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(a)
    out = out.crop(a.point(lambda v: 255 if v > 8 else 0).getbbox())
    out.thumbnail((OUT_LONG, OUT_LONG), Image.LANCZOS)
    out.save(dst, "WEBP", quality=88, method=6, lossless=False)
    say("out %dx%d  %.0f KB  %s" % (out.width, out.height,
                                    os.path.getsize(dst) / 1024, dst))


if __name__ == "__main__":
    main()
