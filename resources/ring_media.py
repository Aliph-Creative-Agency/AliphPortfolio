# Pull the ماذا نفعل ring's own copies of archive media into prototype/assets.
#
# ⚠️ THE RING PAINTS FROM assets/, NOT FROM R2 — open question 13, and the same
# rule about_media.py follows. Everything but the work archive keeps a local
# copy, which is the only reason the home page stayed up the day r2.dev went
# dark and took the work page with it. So a piece cannot join the ring by being
# on the bucket; it has to be committed here.
#
# The ring is a CURATED SAMPLE, not a feed. This script pulls only what the
# ring names, so adding a piece is: put its key in WANT, run this, add the line
# to RINGS in main.js. Three steps, deliberately — the archive is the thing
# that grows on its own.
#
# Size: a ring item is drawn at most ~340 CSS px wide (a 4:5 design piece in a
# 540px-tall window at the 0.34-of-height area rule), so 1080 is the archive's
# own width and 900 is over 2x at the largest the ring ever draws. The existing
# nine Grillit/Shawarma copies are 1080x1350; these match so the ring's items
# do not silently disagree about resolution.
#
#   python resources/ring_media.py

import io
import os
import sys
import urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "prototype", "assets", "media")
R2 = "https://media.aliphcreative.com"
LONG = 1350

# ⚠️ A REAL User-Agent, and it is not optional. r2.dev and the custom domain
# both sit behind bot protection that answers a scripting library's default UA
# with 403 — which looks exactly like "public access is disabled" and sent a
# whole round of diagnosis into settings that were already correct. See
# HANDOFF, _Things that will bite you_.
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}

# The three «حقك تعرف حقك» ads for مكاتب خدمات الرفاه الاجتماعي — القدس,
# imported to the bucket on 2026-08-23 and put on the ring on 2026-08-23b.
WANT = [
    ("design-haqqak-1.webp", "img/design-haqqak-1.webp"),
    ("design-haqqak-2.webp", "img/design-haqqak-2.webp"),
    ("design-haqqak-3.webp", "img/design-haqqak-3.webp"),
]


def say(s):
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, key in WANT:
        url = R2 + "/" + key
        try:
            rq = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(rq, timeout=60) as r:
                raw = r.read()
        except Exception as e:
            say("FAIL     %s  %s" % (name, e))
            continue
        # ⚠️ A 200 and some bytes is not proof you got the picture. Open it.
        try:
            im = Image.open(io.BytesIO(raw))
            im.load()
        except Exception as e:
            say("NOT AN IMAGE  %s  %d bytes  %s" % (name, len(raw), e))
            continue
        im = im.convert("RGB")
        k = LONG / max(im.size)
        if k < 1:
            im = im.resize((round(im.width * k), round(im.height * k)),
                           Image.LANCZOS)
        dst = os.path.join(OUT, name)
        im.save(dst, "WEBP", quality=86, method=6)
        say("%-26s %sx%s  %d bytes" % (name, im.width, im.height,
                                       os.path.getsize(dst)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
