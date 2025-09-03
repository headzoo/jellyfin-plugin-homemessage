#!/usr/bin/env bash
set -euo pipefail

WATCH="/var/www/jellyfin-plugin-homemessage/Jellyfin.Plugin.HomeMessage/bin/Debug/net8.0"
CMD=(/usr/bin/jellyfin --datadir "$HOME/.config/jellyfin" --cachedir "$HOME/.cache/jellyfin" --webdir /usr/share/jellyfin/web)

"${CMD[@]}" & JPID=$!

inotifywait -m -r -e close_write,create,delete,move --format '%w%f' "$WATCH" |
while read -r file; do
  case "$file" in
    *.dll|*.deps.json|*.runtimeconfig.json)
      echo "Change detected: $file — restarting Jellyfin…"
      kill "$JPID" 2>/dev/null || true
      wait "$JPID" 2>/dev/null || true
      "${CMD[@]}" & JPID=$!
      ;;
  esac
done
