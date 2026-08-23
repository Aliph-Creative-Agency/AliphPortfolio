# Turn the raw captures into the sizes the profile sheet and the work-page tile
# actually ask for, and nothing else.
#
# The sheet's own CSS is the spec, not a guess:
#   .sheet-shot        aspect-ratio: 16/10   -> 1600x1000
#   .sheet-thumbs but. aspect-ratio: 16/10   -> 400x250
#   .sheet-cover       aspect-ratio: 1       -> 640x640   (drawn at <=78px)
#   .tile-img (tech)   aspect-ratio: 1.6     -> 960x600
#
# ⚠️ The phone capture is 390x844 — portrait into a 16:10 box. object-fit:cover
# would crop away everything but a vertical sliver of the middle, so it is
# LETTERBOXED onto an ink field at the sheet's own ratio instead. A phone frame
# floating on ink reads as deliberate; a hard crop of one reads as a mistake.
#
# ⚠️ The cover and the card are NOT crops of screenshot 1 any more (2026-08-23).
# A 160px square cut out of a 1440px page capture, drawn into a 270px-wide tile,
# is the "low quality covers" the agency complained about: it was upscaled AND
# it showed a fragment of a page rather than whose page it is. Each project now
# gets its client's own logo on a field of that site's dominant colour — read
# off the site (theme-color, a CSS token, or the measured page field), not
# invented. Source logos are in resources/site-logos/.

import io, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "shots")
LOGOS = os.path.join(HERE, "site-logos")
OUT = os.path.join(HERE, "..", "prototype", "assets", "shots")

BIG = (1600, 1000)
THUMB = (400, 250)
COVER = (640, 640)
CARD = (960, 600)
INK = (15, 24, 32)

SETS = {
    "queens-retreat": ["1", "2", "3", "4", "m"],
    "al-baydar": ["1", "2", "3", "4", "m"],
    "seeko-seeko": ["1", "2", "3", "m"],
}

# field: the site's dominant colour. key: a colour baked into the logo file to
# lift back out to alpha, where the logo does not ship with one.
BRAND = {
    # <meta name="theme-color"> on the invitation page
    "al-baydar": {"field": "#590505", "key": "#590505"},
    # the page's own field colour, and the tone its header sets the mark in
    "queens-retreat": {"field": "#E2D7E7", "key": None},
    # --bg in the page's stylesheet
    "seeko-seeko": {"field": "#0C0A08", "key": None},
}


def say(s):
    sys.stdout.write(str(s) + "\n")
    sys.stdout.flush()


def fit_cover(im, size):
    """Scale and centre-crop to exactly `size` — what object-fit:cover does."""
    tw, th = size
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    im = im.resize((max(1, round(sw * scale)), max(1, round(sh * scale))),
                   Image.LANCZOS)
    x = (im.width - tw) // 2
    y = (im.height - th) // 2
    return im.crop((x, y, x + tw, y + th))


def letterbox(im, size):
    tw, th = size
    sw, sh = im.size
    scale = min(tw / sw, th / sh) * 0.94        # a little air top and bottom
    im = im.resize((max(1, round(sw * scale)), max(1, round(sh * scale))),
                   Image.LANCZOS)
    field = Image.new("RGB", size, INK)
    field.paste(im, ((tw - im.width) // 2, (th - im.height) // 2))
    return field


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def load_logo(slug, key):
    """The client's mark, as RGBA with any baked-in ground lifted to alpha.

    ⚠️ Al Baydar's mark ships as flat RGB — a white letterform on its maroon
    ground, corners rounded. Dropped onto the same maroon it still shows four
    pale corner arcs, because the rounding is anti-aliased and a threshold key
    leaves that fringe behind. So the ground is UNMIXED rather than keyed: each
    pixel is read as the ground and the ink mixed by some alpha, and that alpha
    is recovered from how far the pixel travelled from the ground toward the
    ink. Anti-aliased edges come back as partial alpha, which is what they
    were, and nothing has a hard cut anywhere."""
    im = Image.open(os.path.join(LOGOS, slug + ".png")).convert("RGBA")
    if not key:
        return im
    # ⚠️ Inset first. The file's outermost 2-3 pixels are a pale rim left by the
    # rounded corners — measured at full opacity, so no alpha floor can tell
    # them from the mark, and unmixed they draw a dashed frame around the logo.
    n = max(2, round(min(im.size) * 0.012))
    im = im.crop((n, n, im.width - n, im.height - n))
    k = rgb(key)
    ink = (255, 255, 255)               # the mark itself, once unmixed
    span = sum(abs(ink[i] - k[i]) for i in range(3)) or 1
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            a = sum(abs(v - k[i]) for i, v in enumerate((r, g, b))) / span
            a = 0 if a < 0.04 else min(1.0, a)
            px[x, y] = ink + (int(round(a * 255)),)
    return im


def trim(im, floor=10):
    """Crop to the mark's own ink. The unmix leaves a few points of alpha along
    the file's border where its ground was compressed, and at cover size that
    reads as a faint dashed frame around the logo — cropping to where the ink
    actually is removes it without touching the mark."""
    a = im.getchannel("A").point(lambda v: 255 if v > floor else 0)
    box = a.getbbox()
    return im.crop(box) if box else im


def mark_on_field(logo, size, field, share):
    """The mark centred on a flat field, sized to `share` of the short edge."""
    w, h = size
    cap = int(min(w, h) * share)
    lg = trim(logo)
    lg.thumbnail((cap, cap), Image.LANCZOS)
    im = Image.new("RGB", size, rgb(field))
    im.paste(lg, ((w - lg.width) // 2, (h - lg.height) // 2), lg)
    return im


def save(im, path, q=82):
    im.save(path, "WEBP", quality=q, method=6)
    return os.path.getsize(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for slug, ids in SETS.items():
        for i, sid in enumerate(ids):
            src = os.path.join(SRC, "%s-%s.png" % (slug, sid))
            if not os.path.exists(src):
                raise SystemExit("missing capture: " + src)
            im = Image.open(src).convert("RGB")
            tall = im.height > im.width
            big = letterbox(im, BIG) if tall else fit_cover(im, BIG)
            thumb = letterbox(im, THUMB) if tall else fit_cover(im, THUMB)
            n1 = save(big, os.path.join(OUT, "%s-%d.webp" % (slug, i + 1)))
            n2 = save(thumb, os.path.join(OUT, "%s-%d-t.webp" % (slug, i + 1)), 78)
            total += n1 + n2
            say("  %-22s %6.0f KB  thumb %5.0f KB%s"
                % ("%s-%d" % (slug, i + 1), n1 / 1024, n2 / 1024,
                   "  (phone, letterboxed)" if tall else ""))
        # the client's mark on the client's colour — see BRAND above
        b = BRAND[slug]
        logo = load_logo(slug, b["key"])
        for label, size, share in (("cover", COVER, 0.62), ("card", CARD, 0.52)):
            n = save(mark_on_field(logo, size, b["field"], share),
                     os.path.join(OUT, "%s-%s.webp" % (slug, label)), 88)
            total += n
            say("  %-22s %6.0f KB  %s on %s"
                % ("%s-%s" % (slug, label), n / 1024, "logo", b["field"]))
    say("%d files, %.0f KB total" % (len(os.listdir(OUT)), total / 1024))


if __name__ == "__main__":
    main()
