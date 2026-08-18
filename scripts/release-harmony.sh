#!/usr/bin/env bash
# release-harmony.sh — build the HarmonyOS HAP/APP via the DevEco / hvigor CLI.
# Requires a configured AGC signing profile (HARMONY_SIGN_CERT, PROFILE).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../harmony"
hvigorw assembleHap --mode module -p product=default
echo "HarmonyOS HAP in harmony/entry/build/default/outputs/"
