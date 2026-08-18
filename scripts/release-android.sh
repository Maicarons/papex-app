#!/usr/bin/env bash
# release-android.sh — assemble a release AAB/APK and upload to Play / CN stores.
# Signing uses CI secrets (KEYSTORE_BASE64 / KEYSTORE_PASSWORD / KEY_ALIAS).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
cd android && ./gradlew clean bundleRelease assembleRelease
echo "Android artifacts in android/app/build/outputs/"
