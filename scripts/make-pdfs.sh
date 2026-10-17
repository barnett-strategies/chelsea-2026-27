#!/bin/bash
# make-pdfs.sh — renders the pitch maps and printable teamsheets to real PDF
# files via headless Chrome, so the site serves downloadable PDFs rather than
# an HTML page with a print button.
#
# Run after `node generate.js`. Chrome is required (it is installed on this Mac).

set -u
REPO="/Users/christopherbarnett/Projects/chelsea-2026-27"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$REPO" || exit 1

if [ ! -x "$CHROME" ]; then
  echo "make-pdfs: Chrome not found at $CHROME — skipping PDF generation" >&2
  exit 0
fi

mkdir -p pdf
made=0
for f in *-pitch.html *-print.html; do
  [ -e "$f" ] || continue
  out="pdf/${f%.html}.pdf"
  # Only re-render when the HTML is newer than the PDF.
  if [ -f "$out" ] && [ "$out" -nt "$f" ]; then continue; fi
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
            --print-to-pdf="$REPO/$out" "file://$REPO/$f" >/dev/null 2>&1
  if [ -f "$out" ]; then made=$((made+1)); fi
done

echo "make-pdfs: wrote/refreshed $made PDF(s) in pdf/"
