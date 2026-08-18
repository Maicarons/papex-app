#!/usr/bin/env bash
#
# sync-i18n.sh — Pull the zh/en dictionaries from the Papex web repo so the
# mobile client reuses the same keys. Only the `common/auth/papers/library/
# messages/settings/errors` namespaces consumed by the app are merged.
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${PAPEX_I18N_SRC:-../papex/src/i18n}"
DST="${ROOT_DIR}/src/lib/i18n/locales"

if [ ! -d "${SRC}" ]; then
  echo "Papex i18n source not found at ${SRC}; set PAPEX_I18N_SRC to the papex repo i18n dir."
  exit 1
fi

mkdir -p "${DST}"
for ns in common auth papers library messages settings errors; do
  for lang in zh en; do
    src_file="${SRC}/${lang}/${ns}.json"
    if [ -f "${src_file}" ]; then
      cp "${src_file}" "${DST}/${lang}.${ns}.json"
      echo "synced ${lang}.${ns}"
    fi
  done
done

echo "i18n sync complete. Validate keys with the i18n integrity test."
