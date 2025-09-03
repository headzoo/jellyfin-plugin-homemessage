#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 {major|minor|build|revision} \"Change log message\"" >&2
  exit 1
fi

PART="$1"; shift
MSG="$*"

if [[ ! "$PART" =~ ^(major|minor|build|revision)$ ]]; then
  echo "Error: bump part must be one of: major | minor | build | revision" >&2
  exit 1
fi

PLUGIN_YAML="build.yaml"
CSPROJ="Jellyfin.Plugin.HomeMessage/Jellyfin.Plugin.HomeMessage.csproj"

[[ -f "$PLUGIN_YAML" ]] || { echo "Error: $PLUGIN_YAML not found." >&2; exit 1; }

# Extract current 4-part version (handles quoted/unquoted)
line=$(grep -E '^version:' "$PLUGIN_YAML" | head -1 || true)
[[ -n "$line" ]] || { echo "Error: 'version:' not found in $PLUGIN_YAML" >&2; exit 1; }
current=$(sed -E 's/.*version:[[:space:]]*"([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)".*/\1/;t;s/.*version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+).*/\1/' <<<"$line")
[[ "$current" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "Error: bad version format: $current" >&2; exit 1; }

IFS='.' read -r MAJOR MINOR BUILD REVISION <<<"$current"

case "$PART" in
  major)    ((MAJOR++)); MINOR=0; BUILD=0; REVISION=0 ;;
  minor)    ((MINOR++)); BUILD=0; REVISION=0 ;;
  build)    ((BUILD++));  REVISION=0 ;;
  revision) ((REVISION++)) ;;
esac

newver="$MAJOR.$MINOR.$BUILD.$REVISION"
echo "Bumping version: $current -> $newver"
echo "Changelog: $MSG"

# Update version in build.yaml (quoted or unquoted)
if grep -qE '^version:\s*"' "$PLUGIN_YAML"; then
  sed -i -E 's/^version:\s*"[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+"/version: "'"$newver"'"/' "$PLUGIN_YAML"
else
  sed -i -E 's/^version:\s*([0-9]+\.){3}[0-9]+/version: '"$newver"'/' "$PLUGIN_YAML"
fi

# Replace changelog block with the provided message
# (assumes 'changelog:' is at or near end; safe to delete to EOF and append)
if grep -qE '^changelog:' "$PLUGIN_YAML"; then
  sed -i -E '/^changelog:/,$d' "$PLUGIN_YAML"
fi
{
  echo 'changelog: >'
  # indent each line of $MSG for YAML block scalar
  while IFS= read -r line; do
    printf '  %s\n' "$line"
  done <<< "$MSG"
} >> "$PLUGIN_YAML"

# Optional: sync <Version> in csproj if present
if [[ -f "$CSPROJ" ]]; then
  if grep -qE '<Version>[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+</Version>' "$CSPROJ"; then
    sed -i -E 's|<Version>[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+</Version>|<Version>'"$newver"'</Version>|' "$CSPROJ"
  else
    # Insert into first <PropertyGroup> if no Version element exists
    awk -v ver="$newver" '
      BEGIN{done=0}
      /<PropertyGroup>/ && !done { print; print "    <Version>" ver "</Version>"; done=1; next }
      { print }
    ' "$CSPROJ" > "$CSPROJ.tmp" && mv "$CSPROJ.tmp" "$CSPROJ"
  fi
  git add "$CSPROJ"
fi

git add "$PLUGIN_YAML"
git commit -m "chore(release): v$newver – $MSG"

tag="v$newver"
git tag -a "$tag" -m "$MSG"
git push origin HEAD
git push origin "$tag"

# Create GitHub release with the message as notes
if command -v gh >/dev/null 2>&1; then
  gh release create "$tag" --title "$tag" --notes "$MSG"
else
  origin_url=$(git remote get-url origin)
  if [[ "$origin_url" =~ github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$ ]]; then
    owner="${BASH_REMATCH[1]}"
    repo="${BASH_REMATCH[2]}"
    token="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
    if [[ -n "${token}" ]]; then
      # minimal JSON (escape quotes in MSG)
      body=$(printf '%s' "$MSG" | sed 's/"/\\"/g')
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
