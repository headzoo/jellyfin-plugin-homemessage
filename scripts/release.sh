#!/usr/bin/env bash
set -euo pipefail

PART="${1:-}"
MSG="${2-}"   # optional; defaults later

if [[ ! "$PART" =~ ^(major|minor|build|revision)$ ]]; then
  echo "Usage: $0 {major|minor|build|revision} [\"Change log message\"]" >&2
  exit 1
fi

# ---- logo config (override with: LOGO_URL=... ./release.sh minor "msg") ----
LOGO_URL="${LOGO_URL:-https://headzoo.github.io/jellyfin-plugin-homemessage/logo.png}"
LOGO_MD="![HomeMessage logo](${LOGO_URL})"

PLUGIN_YAML="build.yaml"
CSPROJ="Jellyfin.Plugin.HomeMessage/Jellyfin.Plugin.HomeMessage.csproj"

[[ -f "$PLUGIN_YAML" ]] || { echo "Error: $PLUGIN_YAML not found."; exit 1; }

# --- read current X.Y.Z.W from build.yaml (handles spaces + quotes) ---
ver_line="$(grep -E '^[[:space:]]*version:' "$PLUGIN_YAML" | head -1 || true)"
[[ -n "$ver_line" ]] || { echo "Error: 'version:' not found in $PLUGIN_YAML"; exit 1; }

current="$(
  sed -E '
    s/.*version:[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)".*/\1/;t;
    s/.*version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).*/\1/;t;
    s/.*/INVALID/
  ' <<<"$ver_line"
)"
[[ "$current" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Bad version format in build.yaml: $current"; exit 1; }

IFS='.' read -r MAJOR MINOR BUILD REVISION <<<"$current"

# --- bump (force base-10 to avoid octal pitfalls like 08/09) ---
case "$PART" in
  major)    MAJOR=$((10#$MAJOR + 1)); MINOR=0; BUILD=0; REVISION=0 ;;
  minor)    MINOR=$((10#$MINOR + 1)); BUILD=0; REVISION=0 ;;
  build)    BUILD=$((10#$BUILD + 1)); REVISION=0 ;;
  revision) REVISION=$((10#$REVISION + 1)) ;;
esac

newver="${MAJOR}.${MINOR}.${BUILD}.${REVISION}"
tag="v${newver}"
[[ -n "${MSG}" ]] || MSG="Release ${tag}"

# Notes shown on GitHub release + baked into build.yaml changelog
# (message + blank line + markdown image)
NOTES="$(printf "%s\n\n%s\n" "$MSG" "$LOGO_MD")"

echo "Current version: $current"
echo "Bump: $PART  ->  New version: $newver"
echo "Changelog (first lines):"
printf "%s\n" "$NOTES" | sed -n '1,5p'

# --- update version in build.yaml (preserve quoting style) ---
if grep -qE '^[[:space:]]*version:[[:space:]]*"' "$PLUGIN_YAML"; then
  sed -i -E 's/^([[:space:]]*version:[[:space:]]*)"[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+"/\1"'"$newver"'"/' "$PLUGIN_YAML"
else
  sed -i -E 's/^([[:space:]]*version:[[:space:]]*)([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/\1'"$newver"'/' "$PLUGIN_YAML"
fi

# --- replace (or add) changelog block without touching other keys ---
tmpfile="$(mktemp)"
awk -v msg="$NOTES" '
  BEGIN { inlog=0; printed=0 }
  /^[[:space:]]*changelog:/ {
    print "changelog: >"
    n = split(msg, lines, /\n/);
    for (i=1; i<=n; i++) print "  " lines[i];
    inlog=1; printed=1; next
  }
  inlog && /^[A-Za-z0-9_-]+:/ { inlog=0 }
  !inlog { print }
  END {
    if (!printed) {
      print "changelog: >"
      n = split(msg, lines, /\n/);
      for (i=1; i<=n; i++) print "  " lines[i];
    }
  }
' "$PLUGIN_YAML" > "$tmpfile"
mv "$tmpfile" "$PLUGIN_YAML"

# --- sync <Version> in csproj if present ---
if [[ -f "$CSPROJ" ]]; then
  if grep -qE '<Version>[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+</Version>' "$CSPROJ"; then
    sed -i -E 's|<Version>[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+</Version>|<Version>'"$newver"'</Version>|' "$CSPROJ"
  else
    awk -v ver="$newver" '
      BEGIN{done=0}
      /<PropertyGroup>/ && !done { print; print "    <Version>" ver "</Version>"; done=1; next }
      { print }
    ' "$CSPROJ" > "$CSPROJ.tmp" && mv "$CSPROJ.tmp" "$CSPROJ"
  fi
  git add "$CSPROJ"
fi

git add "$PLUGIN_YAML"

echo "----- Diff preview -----"
git --no-pager diff --cached || true
echo "------------------------"

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "[DRY_RUN] Skipping commit & tag"
  exit 0
fi

git commit -m "chore(release): v$newver – $MSG"

# fail early if tag exists
if git rev-parse "$tag" >/dev/null 2>&1; then
  echo "Error: tag $tag already exists. Delete it or choose a different bump." >&2
  exit 1
fi

git tag -a "$tag" -m "$MSG"
git push origin HEAD
git push origin "$tag"

# --- create GitHub release with notes = NOTES (message + logo) ---
if command -v gh >/dev/null 2>&1; then
  gh release create "$tag" --title "$tag" --notes "$NOTES"
else
  origin_url="$(git remote get-url origin)"
  if [[ "$origin_url" =~ github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$ ]]; then
    owner="${BASH_REMATCH[1]}"; repo="${BASH_REMATCH[2]}"
    token="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
    if [[ -n "$token" ]]; then
      # Escape JSON-sensitive chars and newlines
      body=$(printf '%s' "$NOTES" \
        | sed ':a;N;$!ba;s/\\/\\\\/g; s/"/\\"/g; s/\r//g; s/\n/\\n/g')
      curl -sS -X POST \
        -H "Authorization: Bearer $token" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/$owner/$repo/releases" \
        -d "{\"tag_name\":\"$tag\",\"name\":\"$tag\",\"body\":\"$body\",\"draft\":false,\"prerelease\":false}" >/dev/null
      echo "Release $tag created via API."
    else
      echo "Tag pushed. Set GH_TOKEN/GITHUB_TOKEN or install gh to auto-create the release." >&2
    fi
  else
    echo "Could not parse owner/repo from origin URL; skipping release creation." >&2
  fi
fi

echo "Done. New version: $newver (tag $tag)"
