# Cut the agency's own people out of a photograph, for the centre of their
# service ring. One script, three marks, three different problems.
#
# ⚠️ THE MODEL IS PART OF THE ANSWER, not an implementation detail. Measured on
# 2026-08-24 against the same two frames:
#
#   · isnet-general-use   dropped the photographer's CAMERA. It kept the man and
#                         cut the black camera body away against the dark studio
#                         behind it — which leaves a mark that is a person in a
#                         sweater and says nothing about media production. This
#                         is the model the 2026-08-23b round used.
#   · birefnet-general-lite  kept camera, lens and strap. It is what `photo`
#                         uses now.
#   · u2net              is the only one of the three that kept the developer's
#                         MONITOR. birefnet cut it away and returned a hooded
#                         silhouette in a dark room, which at 210px is a black
#                         blob.
#
# So the model is chosen per frame, and the reason is written next to it. Try
# all three before concluding a frame cannot be cut.
#
# 🔴 NOTHING IS PASTED BACK IN. The 2026-08-23b round put the designer's monitor
# back as a stated rectangle after segmentation, and the agency's screenshot
# (`2nd pic.png` in the issues folder) shows exactly what that produced: a hard
# vertical cut down the side of the screen where the rectangle ended. Their
# instruction on 2026-08-24 was "do not add a line border as u did before". If a
# segmenter drops something the mark needs, the fix is a better frame or a
# better model — never a drawn shape.
#
# The mask is then cleaned, which matters most for the developer: his black
# hoodie against a dark room comes back with holes in it and a speck or two of
# desk floating alongside. Runs smaller than 2% of the frame are dropped, and
# background runs that never reach the border are filled — those are holes
# inside the subject, not background.
#
#   python resources/cut_people_marks.py

import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

OUT_LONG = 900          # the mark draws at 100-210px; 900 is ample at 3x

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "..", "prototype", "assets", "marks")
ISSUES = os.path.join(os.path.expanduser("~"), "Desktop", "issues")
DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")

JOBS = [
    {
        # The agency's own photographer, 2026-08-24. Replaced the cameraman cut
        # from their footage — same person's job, a much better frame.
        "src": os.path.join(ISSUES, "1st pic.jpg"),
        "out": "mark-photo.webp",
        "model": "birefnet-general-lite",   # the only one that kept the camera
    },
    {
        # 🔴 STILL NOT GOOD ENOUGH as of 2026-08-24. The head, the glasses and
        # the screen full of real code read correctly at size, but his hoodie
        # is nearly the same value as the unlit room behind it, so the lower
        # left of the silhouette comes back as a ragged mass rather than a
        # shoulder. Cropping it away takes the monitor with it. Worth another
        # pass with a matting model that returns real alpha at the edges, or a
        # differently lit frame from the agency.
        "src": os.path.join(ISSUES, "3rd pic.jpg"),
        "out": "mark-tech.webp",
        "model": "u2net",                   # the only one that kept the monitor
    },
    # 🔴 THE DESIGNER IS DELIBERATELY NOT IN THIS LIST, and re-adding him
    # without reading this will undo a working asset.
    #
    # The committed `mark-design.webp` is the 2026-08-23b cut, and it carries a
    # monitor that was painted back in by hand after segmentation. Every model
    # tried here drops it — measured on 2026-08-24, u2net returns the man and
    # his chair at 351x321 and nothing else, which at 210px is a back in a
    # jumper and says nothing about graphic design. The screen full of
    # colour-blocked layout is the only thing in that frame that names the
    # service.
    #
    # So it stands as it is: the agency's complaint of 2026-08-24 was about the
    # DEVELOPER's mark, and they did not ask for this one to change. When they
    # send a photograph of their own designer, add a job here and delete this
    # note — a real frame will not need anything pasted into it.
]


def say(s):
    """⚠️ This box's console is cp1252 and cannot render a path with anything
    outside it. Several false failures here trace to an unsanitised print()."""
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def runs(mask):
    """Every 4-connected run of True in a boolean mask."""
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    out = []
    for sy in range(h):
        row = mask[sy]
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
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] \
                            and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
                        cells.append((ny, nx))
            out.append(cells)
    return out


def clean(alpha, keep_frac=0.02):
    """Drop specks, fill holes. A background run that never reaches the border
    is enclosed by the subject, so it is a hole in the subject rather than
    ground showing through — the same reachability argument cut_mark.py uses to
    decide what the ground is."""
    a = np.asarray(alpha) > 128
    h, w = a.shape
    keep = np.zeros((h, w), bool)
    kept = 0
    for cells in runs(a):
        if len(cells) >= h * w * keep_frac:
            kept += 1
            for y, x in cells:
                keep[y, x] = True
    filled = 0
    for cells in runs(~keep):
        ys = [y for y, _ in cells]
        xs = [x for _, x in cells]
        if min(ys) > 0 and max(ys) < h - 1 and min(xs) > 0 and max(xs) < w - 1:
            filled += 1
            for y, x in cells:
                keep[y, x] = True
    return Image.fromarray(np.where(keep, 255, 0).astype(np.uint8)), kept, filled


def main():
    try:
        from rembg import new_session, remove
    except ImportError:
        say('rembg is not installed.  python -m pip install "rembg[cpu]"')
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    sessions = {}
    for job in JOBS:
        if not os.path.exists(job["src"]):
            say("MISSING  " + job["src"])
            continue
        if job["model"] not in sessions:
            sessions[job["model"]] = new_session(job["model"])
        im = Image.open(job["src"]).convert("RGB")
        alpha = remove(im, session=sessions[job["model"]],
                       post_process_mask=True).split()[3]
        alpha, kept, filled = clean(alpha)
        # one pass of blur so the cutout does not sit on the page with a
        # jagged aliased rim
        alpha = alpha.filter(ImageFilter.GaussianBlur(0.8))

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
        say("%-18s %-22s %sx%s  subject %.1f%%  runs %d  holes %d  %d bytes"
            % (job["out"], job["model"], out.width, out.height, cover,
               kept, filled, os.path.getsize(dst)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
