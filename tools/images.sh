#!/bin/sh
# Makes the responsive photo set: AVIF + WebP at 640, 1280 and 1920 wide.
# Run once per new photo; the output is committed, so the site stays no-build.
#
#   sh tools/images.sh <source.jpg> <name>
#   sh tools/images.sh ~/Downloads/wok.jpg kitchen   ->  assets/img/kitchen-{640,1280,1920}.{avif,webp}
set -e
src="$1"; name="$2"
[ -f "$src" ] && [ -n "$name" ] || { echo "usage: sh tools/images.sh <source.jpg> <name>"; exit 1; }
out="$(dirname "$0")/../assets/img"
for w in 640 1280 1920; do
  ffmpeg -hide_banner -loglevel error -y -i "$src" -vf "scale=$w:-2" \
    -frames:v 1 -c:v libsvtav1 -crf 40 -pix_fmt yuv420p "$out/$name-$w.avif"
  cwebp -quiet -q 72 -resize "$w" 0 "$src" -o "$out/$name-$w.webp"
done
ls -l "$out/$name"-*
