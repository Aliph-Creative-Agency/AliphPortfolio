# SUPERSEDED 2026-08-27 by resources/replace_bts29.py. DO NOT RUN THIS.
#
# The agency answered the watermark themselves: instead of a frame to cut
# they supplied a clean vertical master of the same clip, so bts-29 went back
# to a true 9:16 and the 10% this script sacrificed came back with it. Kept on
# disk because it is the whole recipe if a burnt-in handle ever needs cutting
# again -- the measurement of where the ink actually sits, and the four-object
# rule that a partial swap breaks -- and both of those outlive the clip.
#
# Crop the burnt-in handle off bts-29, everywhere it lives.
#
# The clip is a re-post: `@bader.events` and a line of Arabic are burnt into
# the bottom of the frame by whatever exported it, so the about page was
# carrying another account's watermark down its own reading column. The agency
# drew a line above it on 2026-08-23b and asked for the frame to stop there.
#
# ⚠️ MEASURED, not eyeballed. The handle's ink runs from 90.5% to 94.3% of the
# frame's height; cropping at the drawn line (~95%) would have left the tops of
# the letters. KEEP is 0.90, which clears both the handle and the caption with
# a little air, and costs 10% of a 9:16 clip whose subject sits in the top 80%.
#
# ⚠️ FOUR OBJECTS, not one. A piece of media on this site exists as a local
# poster, and on R2 as a clip, a poster and a thumb. Crop one and the others
# still carry the handle — and the thumb is what the archive draws, so the
# watermark would survive in the one place it is most visible.
#
# ⚠️ The clip is RE-ENCODED here, unlike the 2026-08-23 import which could
# remux. A crop rewrites the picture, so there is no faststart-only path. It
# goes back at CRF 23, which lands within a few percent of the 1.85 Mbps the
# source carried.
#
#   python resources/crop_bts29.py            # derive only
#   python resources/crop_bts29.py --upload   # derive, then put on R2

import os
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "thumb-cache", "import")
LOCAL = os.path.join(ROOT, "prototype", "assets", "media")
OUT = os.path.join(HERE, "thumb-cache", "crop")

NAME = "bts-29"
KEEP = 0.90                 # of the original height
LOCAL_LONG = 1000           # what about_media.py writes
THUMB_W = 600               # what thumb_media.py writes
BUCKET = "aliph-media"


def say(s):
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def even(n):
    """H.264 needs even dimensions in both axes."""
    return int(n) - (int(n) % 2)


def main():
    os.makedirs(OUT, exist_ok=True)
    src_mp4 = os.path.join(CACHE, NAME + ".mp4")
    if not os.path.exists(src_mp4):
        say("MISSING  " + src_mp4)
        return 1

    # ── the clip ────────────────────────────────────────────────────────
    import json
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "json", src_mp4],
        capture_output=True, text=True, check=True).stdout)
    w = probe["streams"][0]["width"]
    h = probe["streams"][0]["height"]
    ch = even(h * KEEP)
    dst_mp4 = os.path.join(OUT, NAME + ".mp4")
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", src_mp4,
         "-vf", "crop=%d:%d:0:0" % (even(w), ch),
         "-c:v", "libx264", "-crf", "23", "-preset", "slow",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-c:a", "copy", dst_mp4], check=True)
    say("%-22s %dx%d  %d bytes" % (NAME + ".mp4", even(w), ch,
                                   os.path.getsize(dst_mp4)))

    # ── the poster, from the clip's own first frame ─────────────────────
    still = Image.open(os.path.join(CACHE, NAME + ".webp")).convert("RGB")
    sw, sh = still.size
    still = still.crop((0, 0, sw, int(round(sh * KEEP))))

    # R2's poster keeps the clip's own pixels
    dst_poster = os.path.join(OUT, NAME + ".poster.webp")
    still.save(dst_poster, "WEBP", quality=86, method=6)
    say("%-22s %dx%d  %d bytes" % (NAME + ".poster.webp", still.width,
                                   still.height, os.path.getsize(dst_poster)))

    # R2's thumb is width-capped — the archive lays out in columns
    thumb = still.copy()
    if thumb.width > THUMB_W:
        k = THUMB_W / thumb.width
        thumb = thumb.resize((THUMB_W, round(thumb.height * k)), Image.LANCZOS)
    dst_thumb = os.path.join(OUT, NAME + ".thumb.webp")
    thumb.save(dst_thumb, "WEBP", quality=82, method=6)
    say("%-22s %dx%d  %d bytes" % (NAME + ".thumb.webp", thumb.width,
                                   thumb.height, os.path.getsize(dst_thumb)))

    # the LOCAL copy the about page paints
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

    if "--upload" not in sys.argv:
        say("")
        say("derived only. re-run with --upload to put them on R2.")
        return 0

    for key, path in ((("video/%s.mp4" % NAME), dst_mp4),
                      (("poster/%s.webp" % NAME), dst_poster),
                      (("thumb/%s.webp" % NAME), dst_thumb)):
        # ⚠️ encoding + errors, NOT bare text=True. wrangler draws its output
        # with box characters, and this box's default console codec is cp1252
        # — decoding its stdout without saying so raises UnicodeDecodeError in
        # subprocess's reader THREAD, which surfaces as a traceback with no
        # obvious connection to the upload and after the object has already
        # gone up. Three separate false failures on this machine trace to the
        # same codec; see HANDOFF.
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
