#!/bin/bash

cd "$(dirname "$0")"

# PNG variants
magick favicon.svg -define rsvg:scan-start=all -resize 180x180 apple-touch-icon.png
magick favicon.svg -define rsvg:scan-start=all -resize 16x16 favicon-16x16.png
magick favicon.svg -define rsvg:scan-start=all -resize 32x32 favicon-32x32.png

# ICO bundle
magick favicon.svg -define rsvg:scan-start=all -resize 16x16  -background none -flatten temp-16.png
magick favicon.svg -define rsvg:scan-start=all -resize 32x32  -background none -flatten temp-32.png
magick favicon.svg -define rsvg:scan-start=all -resize 48x48  -background none -flatten temp-48.png
magick temp-16.png temp-32.png temp-48.png favicon.ico
rm -f temp-*.png

echo "✔ Favicons generated"

