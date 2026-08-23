# Cut the designer and the developer out of a photograph, for the centre of
# their service ring. The cameraman's mark is made by a DIFFERENT script —
# resources/cut_mark.py — and the difference is the whole reason this file
# exists.
#
# cut_mark.py works by REACHABILITY on a flat ground: the agency's cameraman
# arrived already cut out onto flat black, so the job there was to find which
# black pixels were the ground and which were his shirt. These two photographs
# are not cutouts. They are whole scenes — a room, a desk, a lamp, a wall, a
# whiteboard — and there is no ground to find. Nothing in cut_mark.py applies.
#
# So the subject is segmented instead (rembg / isnet-general-use), and then two
# corrections are applied that a segmenter cannot make on its own:
#
#   1. 🔴 THE MONITOR IS PUT BACK for the designer. The segmenter is right that
#      the monitor is not part of the man, and wrong about what the mark is
#      for: a man photographed from behind in a desk chair is any office
#      worker alive. The screen full of colour-blocked layout is the only thing
#      in the frame that says GRAPHIC DESIGNER, exactly as the camera rig is
#      what makes the cameraman's mark legible at 90px. It goes back in as a
#      stated rectangle, because a monitor IS a rectangle and a hand-drawn one
#      reads as a bezel rather than as a cut that went wrong.
#      ⚠️ The developer needs no such help — his iMac is between his hands and
#      the segmenter keeps it.
#
#   2. Specks are dropped. Segmentation leaves crumbs of desk and wall behind:
#      measured, two fragments of 300–900px floated beside the developer with
#      nothing attached to them, which at mark size read as dirt on the screen.
#      A run has to be 0.4% of the frame to survive.
#
# ⚠️ THE SOURCE PHOTOGRAPHS ARE AI STOCK, and this is recorded here because it
# is invisible once they are cut. The developer's whiteboard is covered in
# gibberish hand-lettering and the code on both screens is not code. The
# agency was told and asked for them anyway on 2026-08-23. The whiteboard at
# least leaves with the background — it is behind him, so the segmenter takes
# it — and the screens are 60px wide at mark size, where they read as texture.
# If the agency ever photographs their own two people, this script takes those
# instead and nothing else changes.
#
#   python resources/cut_people_marks.py

import os
import sys

import numpy as np
from PIL import Image, ImageDraw

OUT_LONG = 900          # matches mark-photo.webp; the mark draws at 88–170px

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "..", "prototype", "assets", "marks")
DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")

# The monitor in the designer frame, in that photograph's own 625x350 pixels.
# Bezel, then the stand's neck. ⚠️ The foot is deliberately NOT included: it is
# desk-coloured and sits detached under the screen, so it read as a stray
# rectangle rather than as part of the monitor.
DESIGNER_MONITOR = [
    (182, 62, 521, 240),        # bezel + screen
    (352, 240, 388, 254),       # the stand's neck
]

JOBS = [
    {
        "src": os.path.join(DESKTOP, "graphic designer.jpg"),
        "out": "mark-design.webp",
        "add": DESIGNER_MONITOR,
    },
    {
        "src": os.path.join(DESKTOP, "progrmmer.jpg"),   # the agency's spelling
        "out": "mark-tech.webp",
        "add": [],
    },
]


def say(s):
    """⚠️ This box's console is cp1252 and cannot render a filename with
    anything outside it. Three separate false failures have been traced to an
    unsanitised print(); see HANDOFF."""
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def keep_big(alpha, min_frac=0.004):
    """Drop specks. Connected runs of opaque pixels smaller than min_frac of
    the frame are cleared — they are crumbs of desk and wall, never subject."""
    from collections import deque

    a = np.asarray(alpha) > 128
    h, w = a.shape
    seen = np.zeros((h, w), bool)
    keep = np.zeros((h, w), bool)
    floor = h * w * min_frac
    dropped = 0
    for sy in range(h):
        row = a[sy]
        for sx in range(w):
            if not row[sx] or seen[sy, sx]:
                continue
            q = deque([(sy, sx)])
            seen[sy, sx] = True
            cells = [(sy, sx)]
            while q:
                y, x = q.popleft()
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
                        cells.append((ny, nx))
            if len(cells) >= floor:
                for y, x in cells:
                    keep[y, x] = True
            else:
                dropped += 1
    out = np.asarray(alpha).copy()
    out[~keep] = 0
    return Image.fromarray(out), dropped


def main():
    try:
        from rembg import new_session, remove
    except ImportError:
        say("rembg is not installed.  python -m pip install \"rembg[cpu]\"")
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    sess = new_session("isnet-general-use")

    for job in JOBS:
        if not os.path.exists(job["src"]):
            say("MISSING  " + job["src"])
            continue
        im = Image.open(job["src"]).convert("RGB")
        alpha = remove(im, session=sess, post_process_mask=True).split()[3]

        if job["add"]:
            patch = Image.new("L", im.size, 0)
            d = ImageDraw.Draw(patch)
            for box in job["add"]:
                d.rectangle(list(box), fill=255)
            alpha = Image.fromarray(
                np.maximum(np.asarray(alpha), np.asarray(patch)))

        alpha, dropped = keep_big(alpha)
        out = im.convert("RGBA")
        out.putalpha(alpha)
        box = out.getbbox()
        if not box:
            say("EMPTY    " + job["out"])
            continue
        out = out.crop(box)

        k = OUT_LONG / max(out.size)
        if k < 1:
            out = out.resize((max(1, round(out.width * k)),
                              max(1, round(out.height * k))), Image.LANCZOS)

        dst = os.path.normpath(os.path.join(OUT_DIR, job["out"]))
        out.save(dst, "WEBP", quality=90, method=6)
        cover = (np.asarray(out.split()[3]) > 128).mean() * 100
        say("%-18s %sx%s  subject %.1f%%  specks dropped %d  %d bytes"
            % (job["out"], out.width, out.height, cover, dropped,
               os.path.getsize(dst)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
