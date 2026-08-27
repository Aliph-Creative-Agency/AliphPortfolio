# -*- coding: utf-8 -*-
# Swap bts-29 for the clean vertical master the agency supplied.
#
# The old bts-29 was a re-post with `@bader.events` and a line of Arabic burnt
# into the bottom of the frame. The agency drew a line above it on 2026-08-23b,
# asked again on 2026-08-24, and on 2026-08-27 answered it themselves: not a
# crop to apply, but a REPLACEMENT FILE — already vertical, already clean,
# 654x1162 (9:16 to within a pixel), 4.80s.
#
# That is why `crop_bts29.py` is history now and this script is not a variant
# of it. The crop cost 10% of the frame and forced a re-encode; the replacement
# costs neither.
#
# ⚠️ FOUR OBJECTS, not one — the same warning crop_bts29.py carries. A piece of
# media on this site exists as a local poster under prototype/assets/media, and
# on R2 as a clip, a poster and a thumb. Replace one and the others still show
# the old frame — and the thumb is what the archive draws, so a partial swap
# leaves the watermark in the most visible place of all.
#
# ⚠️ THE AUDIO COMES OFF. The supplied file carries a 128 kbps AAC track and
# nothing on this site plays sound. It is dropped in the remux, which costs
# nothing.
#
# ⚠️ REMUX, NOT RE-ENCODE, and that is import_bts.py's rule rather than this
# script's preference: every other BTS clip on the bucket is the master's own
# picture in a faststart container. `crop_bts29.py` re-encoded only because a
# crop rewrites the picture and leaves no remux path. There is no crop here, so
# there is no reason to touch the pixels.
#   ⚠️ It is a BIG master: 7.1 Mbps for 4.8s, so ~4.3 MB against the 1.14 MB
#   the cropped re-encode put on the bucket. That is the trade the agency asked
#   for on 2026-08-27 when they had the page's previews put back to masters. If
#   they want it smaller, one `-c:v libx264 -crf 23` here is the whole change.
#
# ⚠️ THE RATIO CHANGES BACK. The crop made bts-29 0.625 and about.html states
# that per clip; the replacement is a true 0.562 like its four neighbours. This
# script rewrites that one attribute so the holder cannot go stale against the
# file.
#
#   python resources/replace_bts29.py            # derive only
#   python resources/replace_bts29.py --upload   # derive, then put on R2

import io
import json
import os
import re
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOCAL = os.path.join(ROOT, "prototype", "assets", "media")
OUT = os.path.join(HERE, "thumb-cache", "replace")
ABOUT = os.path.join(ROOT, "prototype", "about.html")

NAME = "bts-29"
SRC = os.path.join(
    os.path.expanduser("~"), "Desktop", "new bts",
    "AQNfQpohlL1Mvecj4xFHntkS_cuPNT1zjtBcTAn7ivDk7-buQ3vT5y33XZpXj_fna2LMQe6"
    "ujrr9UWrejy3D7GW_3GVXIqXuh0Tsu3g.mp4")
LOCAL_LONG = 1000           # what about_media.py writes
THUMB_W = 600               # what thumb_media.py writes
BUCKET = "aliph-media"


def say(s):
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def main():
    os.makedirs(OUT, exist_ok=True)
    if not os.path.exists(SRC):
        say("MISSING  " + SRC)
        return 1

    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,duration", "-of", "json", SRC],
        capture_output=True, text=True, check=True).stdout)["streams"][0]
    w, h = probe["width"], probe["height"]
    say("source  %dx%d  ratio %.4f  %.2fs  %d bytes"
        % (w, h, w / h, float(probe.get("duration", 0)), os.path.getsize(SRC)))

    # -- the clip: the master's own picture, no audio, faststart -----------
    dst_mp4 = os.path.join(OUT, NAME + ".mp4")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", SRC,
         "-c:v", "copy", "-an", "-movflags", "+faststart", dst_mp4], check=True)
    say("%-22s %dx%d  %d bytes" % (NAME + ".mp4", w, h,
                                   os.path.getsize(dst_mp4)))

    # -- the poster, the clip's own first frame at the clip's own pixels ---
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", dst_mp4, "-frames:v", "1",
         "-f", "image2pipe", "-vcodec", "png", "-"],
        capture_output=True, check=True).stdout
    still = Image.open(io.BytesIO(raw)).convert("RGB")

    dst_poster = os.path.join(OUT, NAME + ".poster.webp")
    still.save(dst_poster, "WEBP", quality=86, method=6)
    say("%-22s %dx%d  %d bytes" % (NAME + ".poster.webp", still.width,
                                   still.height, os.path.getsize(dst_poster)))

    # R2's thumb is width-capped -- the archive lays out in columns
    thumb = still.copy()
    if thumb.width > THUMB_W:
        k = THUMB_W / thumb.width
        thumb = thumb.resize((THUMB_W, round(thumb.height * k)), Image.LANCZOS)
    dst_thumb = os.path.join(OUT, NAME + ".thumb.webp")
    thumb.save(dst_thumb, "WEBP", quality=82, method=6)
    say("%-22s %dx%d  %d bytes" % (NAME + ".thumb.webp", thumb.width,
                                   thumb.height, os.path.getsize(dst_thumb)))

    # -- the LOCAL copy the about page paints ------------------------------
    local = still.copy()
    k = LOCAL_LONG / max(local.size)
    if k < 1:
        local = local.resize((round(local.width * k), round(local.height * k)),
                             Image.LANCZOS)
    dst_local = os.path.join(LOCAL, NAME + ".webp")
    local.save(dst_local, "WEBP", quality=86, method=6)
    say("%-22s %dx%d  %d bytes  ratio %.4f  <- assets/media"
        % (NAME + ".webp", local.width, local.height,
           os.path.getsize(dst_local), local.width / local.height))

    # -- and the holder's stated ratio -------------------------------------
    ratio = "%.3f" % (w / h)
    html = io.open(ABOUT, encoding="utf-8").read()
    pat = re.compile(
        r'(data-film="%s\.mp4".*?<div class="ab-holder" style="--r:)([0-9.]+)(")'
        % re.escape(NAME), re.S)
    m = pat.search(html)
    if not m:
        say("NOT FOUND  the ab-holder for " + NAME + " in about.html")
        return 1
    if m.group(2) != ratio:
        html = pat.sub(lambda x: x.group(1) + ratio + x.group(3), html, count=1)
        tmp = ABOUT + ".tmp"
        io.open(tmp, "w", encoding="utf-8", newline="").write(html)
        os.replace(tmp, ABOUT)
        say("about.html   --r:%s -> --r:%s" % (m.group(2), ratio))
    else:
        say("about.html   --r already %s" % ratio)

    if "--upload" not in sys.argv:
        say("")
        say("derived only. re-run with --upload to put them on R2.")
        return 0

    for key, path in ((("video/%s.mp4" % NAME), dst_mp4),
                      (("poster/%s.webp" % NAME), dst_poster),
                      (("thumb/%s.webp" % NAME), dst_thumb)):
        # -- encoding + errors, NOT bare text=True. wrangler draws its output
        # with box characters and this box's console codec is cp1252; decoding
        # without saying so raises in subprocess's reader THREAD, after the
        # object has already gone up. See crop_bts29.py and HANDOFF.
        r = subprocess.run(
            ["npx.cmd", "wrangler", "r2", "object", "put",
             "%s/%s" % (BUCKET, key), "--file", path, "--remote"],
            capture_output=True, text=True,
            encoding="utf-8", errors="replace")
        ok = r.returncode == 0
        say("%-8s %s" % ("PUT" if ok else "FAIL", key))
        if not ok:
            say((r.stderr or r.stdout).strip()[:400])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
