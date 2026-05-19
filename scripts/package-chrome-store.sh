#!/usr/bin/env bash
# Builds a Chrome Web Store upload ZIP (extension code only).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")"
OUT_DIR="$ROOT/dist"
ZIP="$OUT_DIR/ai-sidebarchat-${VERSION}-chrome-store.zip"

echo "Packaging AI Sidebar Chat v${VERSION}..."

# Required extension files
for f in manifest.json rules.json browser.js providers.js api.js background.js content.js content.css \
  options.html options.js panel.html panel.js panel.css; do
  if [[ ! -f "$f" ]]; then
    echo "ERROR: Missing required file: $f" >&2
    exit 1
  fi
done

for icon in icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png; do
  if [[ ! -f "$icon" ]]; then
    echo "ERROR: Missing icon: $icon" >&2
    exit 1
  fi
done

mkdir -p "$OUT_DIR"
rm -f "$ZIP"

zip -r "$ZIP" \
  manifest.json \
  rules.json \
  browser.js \
  providers.js \
  api.js \
  background.js \
  content.js \
  content.css \
  options.html \
  options.js \
  panel.html \
  panel.js \
  panel.css \
  icons/

echo ""
echo "Created: $ZIP"
echo "Size:   $(du -h "$ZIP" | cut -f1)"
echo ""
echo "Next: Upload this ZIP at https://chrome.google.com/webstore/devconsole"
echo "Privacy policy URL: host docs/privacy-policy.html (see store/CHECKLIST.md)"
