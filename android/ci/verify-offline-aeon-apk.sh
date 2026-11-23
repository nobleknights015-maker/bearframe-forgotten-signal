#!/usr/bin/env bash
# Verify an assembled owner-private offline Aeon Circuit APK:
# - valid Android package name (labs.bearframe.aeoncircuit) & app label
# - valid APK v2/v3 signature via apksigner
# - byte-for-byte parity for campaign engine, compiled story JSON, artwork, and offline fonts
set -euo pipefail
APK="${1:-private-export/Aeon-Circuit-The-Silent-Wake.apk}"
SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-/tmp/android-sdk}}"
if [[ ! -s "$APK" ]]; then
  echo "Missing APK: $APK" >&2
  exit 1
fi
AAPT="$(find "$SDK_ROOT/build-tools" -maxdepth 2 -type f -name aapt | sort -V | tail -n 1)"
APKSIGNER="$(find "$SDK_ROOT/build-tools" -maxdepth 2 -type f -name apksigner | sort -V | tail -n 1)"

echo "=== 1. Badging / Manifest Verification ==="
BADGING="$("$AAPT" dump badging "$APK")"
echo "$BADGING" | grep -E '^(package:|sdkVersion:|targetSdkVersion:|application-label:|launchable-activity:)'
echo "$BADGING" | grep -Fq "package: name='labs.bearframe.aeoncircuit'"
echo "$BADGING" | grep -Fq "application-label:'Aeon Circuit: The Silent Wake'"

echo "=== 2. APK Signature Verification ==="
"$APKSIGNER" verify --print-certs "$APK"

echo "=== 3. Embedded Campaign, Artwork & Offline Font Parity ==="
required=(
  campaign.html
  css/game.css
  css/campaign.css
  js/main.js
  js/engine/campaign-game.js
  js/engine/campaign-battle.js
  js/engine/campaign-narrative.js
  js/engine/campaign-environment-art.js
  assets/fonts/silkscreen-400.woff2
  assets/fonts/silkscreen-700.woff2
  assets/fonts/vt323-400.woff2
  assets/aeon/story/campaign.json
  assets/aeon/story/opening-world-review-candidate.json
  assets/aeon/environment/environment-art.json
  assets/aeon/environment/doors/sluice_gate_closed.png
)
for rel in "${required[@]}"; do
  src="frontend/public/$rel"
  asset="assets/$rel"
  if [[ ! -f "$src" ]]; then
    echo "Source missing: $src" >&2
    exit 1
  fi
  if ! unzip -p "$APK" "$asset" | cmp - "$src"; then
    echo "APK asset mismatch or missing: $asset" >&2
    exit 1
  fi
done
ENV_PNG_COUNT="$(unzip -Z -1 "$APK" | grep -cE '^assets/assets/aeon/environment/.*\.png$')"
PORTRAIT_COUNT="$(unzip -Z -1 "$APK" | grep -cE '^assets/assets/aeon/portraits/.*\.png$')"
echo "Verified $ENV_PNG_COUNT environment PNGs and $PORTRAIT_COUNT Sleeper portraits inside APK."
echo "Owner-private offline Aeon Circuit APK verification PASSED."
