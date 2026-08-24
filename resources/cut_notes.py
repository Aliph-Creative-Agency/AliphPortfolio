"""Cut the agency's two pinned-paper photographs out of their white ground.

    python resources/cut_notes.py

Writes `prototype/assets/img/note-start.webp` and `note-contact.webp` — the
hero's two calls to action since 2026-08-24, which used to be a solid oval and
an outlined one.

Sources are the agency's own stock frames, `start here.jpg` and `contact
us.jpg`, in `resources/notes/`. Both are a white sheet held by a red push-pin,
photographed on white.

🔴 WHITE PAPER ON A WHITE GROUND IS THE HARD CASE, and the two frames do NOT
behave the same way.

  · `contact us.jpg` cuts cleanly with `birefnet-general-lite` straight off the
    file. The sheet is tilted and curled, so its own cast shadow separates it
    from the ground all the way round.

  · `start here.jpg` does NOT. The sheet is square to the camera and lies flat,
    and along its TOP edge — the edge nearest the pin — the paper and the ground
    are within about three levels of each other with no shadow between them.
    Measured on the raw file: the ground is a flat 255 and the sheet reads
    229–237, but the top edge fades into 250–253 before it gets there. Every
    model tried takes that for background: `u2net` and `isnet-general-use`
    return a 0.6% mask (nothing at all), and `birefnet-general-lite` returns
    43% — the sheet with its whole top edge bitten away in a ragged line, which
    is worse than no cut, because it looks like a torn photograph rather than
    like a failure.

    ⚠️ Upscaling does not help. 612px, 1024px and 1400px all produced the same
    bite; the information is not missing, the CONTRAST is.

    So the frame is STRETCHED before it is segmented and the resulting mask is
    applied to the ORIGINAL pixels: [238, 255] is mapped onto [0, 255], which
    turns a three-level difference into a forty-level one and leaves the ground
    the only thing still at 255. The segmenter then finds the sheet whole.
    ⚠️ The stretch is thrown away — it exists to be looked at by the model, not
    to be shipped. Shipping it would post a note that is grey rather than
    white, and grey paper on a cream page reads as a rendering fault.

    ⚠️ The floor matters and it is a narrow window: at 225 the top edge is
    still partly eaten; at 244 the model starts taking the CAST SHADOW along
    the bottom as part of the subject, which puts a grey fringe under the note.
    232 and 238 both come out clean and 238 is used.

⚠️ NO LINE BORDER IS ADDED TO EITHER, and that is an explicit instruction from
2026-08-24: "do not add a line border as u did before". The round before this
one put the designer's monitor back as a drawn rectangle after segmentation and
the hard edge showed. If a cut loses something, the answer is a better frame or
a better mask, never a shape pasted over the top. The drop shadow these notes
need is drawn in CSS, where it can follow the hover.
"""

import gc
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(__file__).resolve().parent / "notes"
OUT = ROOT / "prototype" / "assets" / "img"

# The long edge the mask is computed at. birefnet works at 1024 internally, so
# feeding it much more than that buys nothing but time.
WORK = 1024
# The long edge that ships. The note is drawn 190-300 CSS px wide, so 700 is
# comfortably past 2x on the widest of those.
SHIP = 700

JOBS = [
    # key,        file,              stretch floor (None = segment as shot)
    ("start",   "start here.jpg",   238),
    ("contact", "contact us.jpg",   None),
]


def sane(s):
    """This box's console is cp1252 and cannot print a filename with a curly
    quote in it, let alone Arabic. Every print goes through here."""
    return str(s).encode("ascii", "replace").decode()


def cut(path, floor, session):
    im = Image.open(path).convert("RGB")
    scale = WORK / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    elif scale > 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)

    if floor is None:
        looked_at = im
    else:
        a = np.asarray(im).astype(np.float32)
        a = np.clip((a - floor) * (255.0 / (255 - floor)), 0, 255)
        looked_at = Image.fromarray(a.astype(np.uint8))

    mask = np.asarray(remove(looked_at, session=session).split()[-1])
    cov = float((mask > 128).mean())

    # ⚠️ A mask that covers almost nothing is the failure mode these frames
    # actually produce — u2net returns 0.6% on both of them and writes a file
    # that is 99% transparent. A directory listing cannot tell that apart from
    # a good cut, so it is checked here rather than by eye.
    if not 0.15 < cov < 0.85:
        raise SystemExit(
            "%s: mask covers %.1f%% of the frame, which is not a sheet of paper"
            % (sane(path.name), cov * 100)
        )

    out = im.convert("RGBA")
    out.putalpha(Image.fromarray(mask))
    return out, cov


def main():
    for key, name, floor in JOBS:
        # ⚠️ A FRESH SESSION PER FRAME, and it is not tidiness. onnxruntime
        # raises `[ONNXRuntimeError] : 1 : FAIL : bad allocation` on the SECOND
        # predict of a reused birefnet session on this box — the first cut
        # writes its file and the run then dies, which reads exactly like a
        # problem with the second source. It is not; it is the arena. Building
        # the session again costs about a second and nothing else.
        session = new_session("birefnet-general-lite")
        path = SRC / name
        if not path.exists():
            raise SystemExit("missing source: " + sane(path))
        cut_img, cov = cut(path, floor, session)

        # Trim to the ink. The stock frames carry a wide white margin that is
        # now transparent, and a button sized from the FILE would be mostly
        # empty box with a small note in the middle of it.
        box = cut_img.split()[-1].getbbox()
        cut_img = cut_img.crop(box)

        if max(cut_img.size) > SHIP:
            s = SHIP / max(cut_img.size)
            cut_img = cut_img.resize(
                (round(cut_img.width * s), round(cut_img.height * s)), Image.LANCZOS)

        dest = OUT / ("note-%s.webp" % key)
        cut_img.save(dest, "WEBP", quality=92, method=6)
        print(sane("%-8s %-16s stretch=%-4s coverage=%.3f  %sx%s  %d KB"
                   % (key, name, floor, cov, cut_img.width, cut_img.height,
                      dest.stat().st_size // 1024)))
        del session
        gc.collect()


if __name__ == "__main__":
    main()
