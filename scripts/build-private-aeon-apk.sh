#!/usr/bin/env bash
# Build the owner-private offline Aeon Circuit: The Silent Wake Android APK.
# Keeps all private story files and compiled APKs strictly inside .gitignore'd paths.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f frontend/public/assets/aeon/story/campaign.json ]] || [[ ! -f frontend/public/assets/aeon/story/opening-world-review-candidate.json ]]; then
  echo "Compiling private Director's Cut v2 campaign bundle..."
  node frontend/narrative-tools/build_full_campaign.mjs
fi

echo "Running private campaign release preflight..."
node frontend/narrative-tools/preflight_private_campaign.mjs frontend/public/assets/aeon --release

echo "Assembling owner-private offline APK..."
gradle -p android :app:assembleDebug -PaeonOfflineBuild=true --no-daemon --max-workers=2

APK_SRC="android/app/build/outputs/apk/debug/app-debug.apk"
mkdir -p private-export
cp "$APK_SRC" private-export/Aeon-Circuit-The-Silent-Wake.apk
bash android/ci/verify-offline-aeon-apk.sh private-export/Aeon-Circuit-The-Silent-Wake.apk

echo "Offline APK ready at: private-export/Aeon-Circuit-The-Silent-Wake.apk"
