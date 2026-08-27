#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
# preview/ — the small copy of every reel the page plays by itself
# ══════════════════════════════════════════════════════════════════════════
# Written 2026-08-26. Until then `data-preview` pointed at `video/`, the
# masters, and the masters are 16.8-79.2 MB each — one of them a 50fps
# 23 Mbps camera file. The ring turns a new piece to the front every 5.25s and
# the carousel advances on its own, so a visitor who never touches anything
# still pulls several. Measured over the thirteen files the page can autoplay:
# 442.6 MB -> 19.6 MB, 95.6% smaller.
#
# THE RULES THIS ENCODE MUST KEEP:
#   · SAME DURATION, to the frame. The lightbox opens the master at the
#     preview's own currentTime, so a derivative that is even a second short
#     hands the overlay a timestamp past its end. Verified after every run.
#   · No audio. Nothing on this site plays sound.
#   · 540 on the long-ish side: a ring item draws at ~200 CSS px and a
#     carousel slide at ~350, so 540 covers a DPR-2 phone with room over.
#   · faststart, or the first frame waits for the whole moov atom.
#
# ⚠️ The UA is not optional: Cloudflare answers ffmpeg's default User-Agent
# with 403 on the media bucket, which looks exactly like a missing file.
#
# Usage:  bash resources/make_previews.sh [outdir]
# Then:   CLOUDFLARE_ACCOUNT_ID=6c60bd775004cfa0082f768c356c7242 \
#           npx.cmd wrangler r2 object put aliph-media/preview/<name>.mp4 \
#           --file=<outdir>/<name>.mp4 --remote --content-type=video/mp4
#
# The list is every file named by a `data-preview` in index.html or about.html
# plus every `open:` in RINGS. Add to it when a reel joins one of those.

set -u
OUT="${1:-preview-out}"
mkdir -p "$OUT"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
SRC="https://media.aliphcreative.com/video"

FILES="bts-28 bts-29 bts-30 bts-31 bts-montage
reels-alif-tuktuk reels-child-section-final reels-connect-edited
reels-copy-of-bader-4 reels-dardashat reels-draft2-show
reels-einar-edited reels-finallllllllllll"

for f in $FILES; do
  [ -s "$OUT/$f.mp4" ] && { echo "SKIP $f"; continue; }
  echo "=== $f"
  ffmpeg -y -hide_banner -loglevel error -user_agent "$UA" -i "$SRC/$f.mp4" \
    -an -vf "scale=w=540:h=960:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=25" \
    -c:v libx264 -profile:v main -crf 30 -maxrate 700k -bufsize 1400k -preset veryfast \
    -movflags +faststart "$OUT/$f.mp4" || { echo "  FAILED"; continue; }
  o=$(ffprobe -v error -user_agent "$UA" -show_entries format=duration -of csv=p=0 "$SRC/$f.mp4")
  n=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$f.mp4")
  awk -v o="$o" -v n="$n" 'BEGIN { d = o - n; if (d < 0) d = -d;
    printf "  %.2fs vs %.2fs — %s\n", o, n, (d > 0.1 ? "🔴 DURATION DRIFT" : "ok") }'
done
echo "ALL DONE"
