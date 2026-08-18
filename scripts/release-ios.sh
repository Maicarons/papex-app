#!/usr/bin/env bash
# release-ios.sh — build and archive the iOS app (TestFlight / App Store).
# Requires a macOS runner with a valid signing certificate in the keychain.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
cd ios && pod install
xcodebuild -workspace papex.xcworkspace -scheme papex -configuration Release archive \
  -archivePath build/papex.xcarchive
echo "iOS archive at ios/build/papex.xcarchive"
