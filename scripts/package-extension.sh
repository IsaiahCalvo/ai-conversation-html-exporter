#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/manifest.json').version")"
OUT_DIR="$ROOT/dist"
OUT="$OUT_DIR/ai-conversation-html-exporter-$VERSION.zip"
FILES=(
  manifest.json
  background.js
  content.js
  popup.html
  popup.css
  popup.js
  viewer.html
  viewer.js
  icons/icon16.png
  icons/icon32.png
  icons/icon48.png
  icons/icon128.png
)

mkdir -p "$OUT_DIR"
rm -f "$OUT"
cd "$ROOT"
zip -q "$OUT" "${FILES[@]}"
unzip -t "$OUT" >/dev/null

for forbidden in README.md PRIVACY.md LICENSE test-viewer-node.js test-publish-background-node.js test-chatgpt-export.html test-claude-export.html test-rich-capture.html; do
  if unzip -Z1 "$OUT" | grep -Fxq "$forbidden"; then
    echo "ERROR: forbidden file packaged: $forbidden" >&2
    exit 1
  fi
done

printf '%s\n' "$OUT"
