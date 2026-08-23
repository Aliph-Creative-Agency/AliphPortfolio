# The 2026-08-23 import: the agency's `new bts` folder and the digital ads
# inside it, derived and put on R2.
#
# ⚠️ THE SOURCE FILENAMES ARE CDN HASHES. Instagram and Facebook hand a file
# back as `565753077_18066765746366841_...jpg.jpeg` or `AQMYvkc0_6tMd...mp4`,
# and Arabic names strip to nothing through a slug function — which is how an
# earlier import produced `copy-of-1` and `copy-of-2`. Everything here is named
# on the way in: the clips and stills continue the `bts-NN` run the 2026-08-16
# import started (it ends at bts-25 plus bts-montage), and the ads are named
# after their campaign the way `design-grillit-*` is named after its client.
#
# ⚠️ The four clips are already H.264 at 1-3 Mbps and 720x1280, so they take a
# faststart REMUX and no re-encode: `-c copy` moves the moov atom to the front
# and does not touch a pixel. Check `codec_name` before assuming that of any
# other import — the 2026-08-16 batch was HEVC and had to be re-encoded.
#
# ⚠️ `Copy of AliphxBader_BTS.mp4` is deliberately NOT imported. It is the 4K
# master of the 65s montage, and its web derivative is already on the bucket as
# video/bts-montage.mp4 from the 2026-08-16 import — same 65.1s length. A
# second copy under a new key would be the same film twice.
#
#   python resources/import_bts.py           # derive only
#   python resources/import_bts.py --upload  # derive, then put on R2

import glob, json, os, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.expanduser(r"~\Desktop\new bts")
OUT = os.path.join(HERE, "thumb-cache", "import")     # gitignored
FFDIR = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet",
                     "Packages",
                     "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
                     "ffmpeg-9.0-full_build", "bin")
FFMPEG = os.path.join(FFDIR, "ffmpeg.exe")            # not on PATH on this box
BUCKET = "aliph-media"
ACCOUNT = "6c60bd775004cfa0082f768c356c7242"

LONG = 1600      # the archive size, same as every other still on the bucket
THUMB = 600      # the tile derivative — see thumb_media.py for why


def say(s):
    sys.stdout.write(str(s).encode("ascii", "replace").decode() + "\n")
    sys.stdout.flush()


def still(src, name, out):
    im = Image.open(src).convert("RGB")
    w0, h0 = im.size
    im.thumbnail((LONG, LONG), Image.LANCZOS)
    big = os.path.join(out, name + ".webp")
    im.save(big, "WEBP", quality=82, method=6)
    th = im.copy()
    if th.width > THUMB:
        th = th.resize((THUMB, max(1, round(th.height * THUMB / th.width))), Image.LANCZOS)
    small = os.path.join(out, name + ".thumb.webp")
    th.save(small, "WEBP", quality=76, method=6)
    say("  %-22s %d x %d -> %d x %d  %.0f KB (+%.0f KB thumb)"
        % (name, w0, h0, im.width, im.height,
           os.path.getsize(big) / 1024, os.path.getsize(small) / 1024))
    return {"name": name, "w": im.width, "h": im.height,
            "r": round(im.width / im.height, 4), "big": big, "thumb": small}


def clip(src, name, out):
    mp4 = os.path.join(out, name + ".mp4")
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", src,
                    "-c", "copy", "-movflags", "+faststart", mp4], check=True)
    png = os.path.join(out, name + ".poster.png")
    subprocess.run([FFMPEG, "-y", "-v", "error", "-i", src, "-frames:v", "1",
                    "-ss", "0.6", png], check=True)
    im = Image.open(png).convert("RGB")
    w, h = im.size
    im.thumbnail((LONG, LONG), Image.LANCZOS)
    poster = os.path.join(out, name + ".webp")
    im.save(poster, "WEBP", quality=80, method=6)
    th = im.copy()
    if th.width > THUMB:
        th = th.resize((THUMB, max(1, round(th.height * THUMB / th.width))), Image.LANCZOS)
    small = os.path.join(out, name + ".thumb.webp")
    th.save(small, "WEBP", quality=76, method=6)
    os.remove(png)
    # ⚠️ moov before mdat, or nothing plays until the whole file has arrived.
    head = open(mp4, "rb").read(400000)
    if not (0 <= head.find(b"moov") < head.find(b"mdat")):
        raise SystemExit("faststart failed on " + name)
    say("  %-22s %d x %d  %.1f MB  poster %.0f KB"
        % (name, w, h, os.path.getsize(mp4) / 1e6, os.path.getsize(poster) / 1024))
    return {"name": name, "w": w, "h": h, "r": round(w / h, 4),
            "video": mp4, "poster": poster, "thumb": small}


def upload(key, path, ctype):
    subprocess.run(
        ["npx.cmd", "wrangler", "r2", "object", "put", BUCKET + "/" + key,
         "--file", path, "--content-type", ctype,
         "--cache-control", "public, max-age=31536000, immutable", "--remote"],
        cwd=ROOT, check=True,
        env=dict(os.environ, CLOUDFLARE_ACCOUNT_ID=ACCOUNT),
        stdout=subprocess.DEVNULL)


def main():
    os.makedirs(OUT, exist_ok=True)
    puts = []      # (key, path, content-type)
    rows = {"design": [], "bts": []}

    # ── the digital ads ──
    # One campaign, «حقك تعرف حقك», for مكاتب خدمات الرفاه الاجتماعي — القدس.
    # ⚠️ img/design-newmat-27 and -28 on the bucket are the same two layouts at
    # 1280px from the 2026-08-16 import; these are the 4500px masters, so they
    # supersede them. The old keys are left in place and referenced by nothing.
    ads = sorted(glob.glob(os.path.join(SRC, "digital adds", "*")))
    say("digital ads: %d" % len(ads))
    for i, f in enumerate(ads, 1):
        r = still(f, "design-haqqak-%d" % i, OUT)
        puts.append(("img/%s.webp" % r["name"], r["big"], "image/webp"))
        puts.append(("thumb/%s.webp" % r["name"], r["thumb"], "image/webp"))
        rows["design"].append(r)

    # ── the behind-the-scenes stills ──
    stills = sorted(glob.glob(os.path.join(SRC, "*.jpeg")))
    say("bts stills: %d" % len(stills))
    for i, f in enumerate(stills):
        r = still(f, "bts-%02d" % (26 + i), OUT)
        puts.append(("img/%s.webp" % r["name"], r["big"], "image/webp"))
        puts.append(("thumb/%s.webp" % r["name"], r["thumb"], "image/webp"))
        rows["bts"].append(r)

    # ── the behind-the-scenes clips ──
    clips = [f for f in sorted(glob.glob(os.path.join(SRC, "*.mp4")))
             if "AliphxBader" not in f]        # see the header
    say("bts clips: %d" % len(clips))
    for i, f in enumerate(clips):
        r = clip(f, "bts-%02d" % (28 + i), OUT)
        puts.append(("video/%s.mp4" % r["name"], r["video"], "video/mp4"))
        puts.append(("poster/%s.webp" % r["name"], r["poster"], "image/webp"))
        puts.append(("thumb/%s.webp" % r["name"], r["thumb"], "image/webp"))
        rows["bts"].append(r)

    open(os.path.join(OUT, "import.json"), "w", encoding="utf-8").write(
        json.dumps(rows, ensure_ascii=False, indent=1, default=str))
    say("%d objects to put" % len(puts))

    if "--upload" in sys.argv:
        for i, (key, path, ctype) in enumerate(puts, 1):
            upload(key, path, ctype)
            say("  %2d/%d  %s" % (i, len(puts), key))
        say("uploaded %d" % len(puts))


if __name__ == "__main__":
    main()
