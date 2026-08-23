# The about page's behind-the-scenes stills and poster frames, as LOCAL assets.
#
# ⚠️ The rule this follows (open question 13): every page except the work
# archive paints its own images out of prototype/assets/, and only video that
# has to stream comes off R2. That split is the only reason the home page
# stayed up the day r2.dev went dark and took the work page with it — so the
# about page's stills and posters are committed here, and only the clips it can
# play are fetched from the bucket.
#
# Sizes come from the page: an .ab-media holder is at most half the text
# measure, ~640 CSS px, and a clipping is a third of the collage. 1000px on the
# long edge is comfortably over both at 2x without carrying the archive's 1600.
#
#   python resources/about_media.py

import io, os, sys, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "prototype", "assets", "media")
CACHE = os.path.join(HERE, "thumb-cache", "about")
R2 = "https://media.aliphcreative.com"
LONG = 1000
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}

# what the about page paints, and where the bucket keeps it
WANT = [
    ("bts-01", "img/bts-01.webp"),               # the still the agency named
    ("bts-26", "img/bts-26.webp"),
    ("bts-27", "img/bts-27.webp"),
    ("bts-montage", "poster/bts-montage.webp"),  # the AliphxBader cut
    ("bts-28", "poster/bts-28.webp"),
    ("bts-29", "poster/bts-29.webp"),
    ("bts-30", "poster/bts-30.webp"),
    ("bts-31", "poster/bts-31.webp"),
]


def say(s):
    sys.stdout.write(str(s) + "\n")
    sys.stdout.flush()


def main():
    os.makedirs(CACHE, exist_ok=True)
    total = 0
    for name, key in WANT:
        src = os.path.join(CACHE, key.replace("/", "__"))
        if not os.path.exists(src) or os.path.getsize(src) < 2048:
            with urllib.request.urlopen(
                    urllib.request.Request(R2 + "/" + key, headers=UA), timeout=60) as f:
                b = f.read()
            # ⚠️ size, not existence — a 200 with an error page in it has been
            # written out as a media file on this project before
            if len(b) < 2048:
                raise SystemExit("suspiciously small: %s (%d bytes)" % (key, len(b)))
            open(src, "wb").write(b)
        im = Image.open(src).convert("RGB")
        w0, h0 = im.size
        im.thumbnail((LONG, LONG), Image.LANCZOS)
        dst = os.path.join(OUT, name + ".webp")
        im.save(dst, "WEBP", quality=80, method=6)
        n = os.path.getsize(dst)
        total += n
        say("  %-14s %4d x %-4d -> %4d x %-4d  %5.0f KB  (ratio %.4f)"
            % (name, w0, h0, im.width, im.height, n / 1024, im.width / im.height))
    say("%d files, %.0f KB" % (len(WANT), total / 1024))


if __name__ == "__main__":
    main()
