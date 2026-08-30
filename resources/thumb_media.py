# Phone- and tile-sized derivatives of the archive, for the work page's grid.
#
# The archive serves the SAME 1600px file to the lightbox and to a tile drawn
# ~180 CSS px wide on a phone. A browser decodes an image at its intrinsic size
# however small it is drawn, so the work page was carrying 22.9 megapixels of
# decoded texture for 24 visible tiles — the same failure the film strip and
# the carousel have both already paid for once.
#
# So: one extra derivative per archive item, width-capped, under `thumb/` on
# the same bucket. The tile shows it; the lightbox still opens the full file,
# because that is the one place the work is meant to be seen at size.
#
# ⚠️ WIDTH-capped, not long-edge. The archive is a COLUMN layout: a tile's
# width is set by the column and its height follows from its own ratio, so the
# width is the only dimension that decides how much detail is thrown away. A
# long-edge cap would under-serve a landscape photograph and over-serve a reel.
#
#   python resources/thumb_media.py           # derive only
#   python resources/thumb_media.py --upload  # derive, then put on R2
#
# ⚠️ CLOUDFLARE_ACCOUNT_ID must be set for the upload: this login reaches two
# accounts and wrangler stops to ask otherwise, which is a hard failure
# non-interactively and publishes into the wrong account if answered wrong.

import io, json, os, re, subprocess, sys, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "thumb-cache")        # gitignored
OUT = os.path.join(CACHE, "out")
R2 = "https://media.aliphcreative.com"
BUCKET = "aliph-media"
ACCOUNT = "6c60bd775004cfa0082f768c356c7242"

WIDTH = 600          # covers a 270px desktop tile at 2x and a 180px phone tile at 3x
QUALITY = 76
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}


def say(s):
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def media_rows():
    """MEDIA out of main.js. It is generated and never hand-edited, so reading
    it back is the only way to stay in step with what the page asks for."""
    s = io.open(os.path.join(ROOT, "prototype", "main.js"), encoding="utf-8").read()
    i = s.index("const MEDIA = [")
    blk = s[i:s.index("\n];", i)]
    rows = []
    for r in re.findall(r"\{([^{}]*)\}", blk):
        d = dict((k, v.strip('"')) for k, v in
                 re.findall(r'(\w+)\s*:\s*("(?:[^"]*)"|[\w.\-]+)', r))
        rows.append(d)
    return rows


def keys():
    """Every object the tiles actually paint: a still by its own name, a film
    by its poster frame."""
    out = []
    for m in media_rows():
        out.append("poster/" + m["p"] if m.get("v") else "img/" + m["f"])
    return out


def fetch(key):
    """⚠️ Check the SIZE, not just that a file appeared. A 200 and bytes on
    disk has meant an error page here before."""
    dst = os.path.join(CACHE, key.replace("/", "__"))
    if os.path.exists(dst) and os.path.getsize(dst) > 2048:
        return dst
    req = urllib.request.Request(R2 + "/" + key, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as f:
        b = f.read()
    if len(b) < 2048:
        raise SystemExit("suspiciously small: %s (%d bytes)" % (key, len(b)))
    os.makedirs(CACHE, exist_ok=True)
    open(dst, "wb").write(b)
    return dst


def derive(src, dst):
    im = Image.open(src).convert("RGB")
    if im.width > WIDTH:
        im = im.resize((WIDTH, max(1, round(im.height * WIDTH / im.width))),
                       Image.LANCZOS)
    im.save(dst, "WEBP", quality=QUALITY, method=6)
    return im.size


# 🔴 NOT `immutable` — see the long note on the same function in
# resources/import_bts.py. These keys are replaced in place too, and a year of
# declared immutability is what left a replaced clip serving its old bytes from
# the edge for a week without any probe noticing.
def upload(key, path):
    subprocess.run(
        ["npx.cmd", "wrangler", "r2", "object", "put", BUCKET + "/" + key,
         "--file", path, "--content-type", "image/webp",
         "--cache-control", "public, max-age=86400", "--remote"],
        cwd=ROOT, check=True,
        env=dict(os.environ, CLOUDFLARE_ACCOUNT_ID=ACCOUNT),
        stdout=subprocess.DEVNULL)


def main():
    os.makedirs(OUT, exist_ok=True)
    ks = keys()
    say("%d archive objects" % len(ks))
    src_bytes = out_bytes = 0
    src_px = out_px = 0
    made = []
    for k in ks:
        src = fetch(k)
        name = k.split("/", 1)[1]
        dst = os.path.join(OUT, name)
        w, h = derive(src, dst)
        with Image.open(src) as im0:
            src_px += im0.width * im0.height
        out_px += w * h
        src_bytes += os.path.getsize(src)
        out_bytes += os.path.getsize(dst)
        made.append(("thumb/" + name, dst))
    say("bytes  %.1f MB -> %.1f MB" % (src_bytes / 1e6, out_bytes / 1e6))
    say("pixels %.1f MP -> %.1f MP" % (src_px / 1e6, out_px / 1e6))

    if "--upload" in sys.argv:
        for i, (key, path) in enumerate(made, 1):
            upload(key, path)
            say("  %3d/%d  %s" % (i, len(made), key))
        say("uploaded %d" % len(made))


if __name__ == "__main__":
    main()
