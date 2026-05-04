#!/usr/bin/env bash
# Scaffold a new FSD slice.
# Usage: scaffold.sh <layer> <sliceName> [segments=ui,model]

set -euo pipefail

LAYER="${1:-}"
SLICE="${2:-}"
SEGMENTS="${3:-ui,model}"

ALLOWED_LAYERS="pages widgets features entities"

if [ -z "$LAYER" ] || [ -z "$SLICE" ]; then
  echo "Usage: $0 <layer> <sliceName> [segments]" >&2
  exit 1
fi

if ! printf '%s\n' $ALLOWED_LAYERS | grep -qx "$LAYER"; then
  echo "❌ Invalid layer '$LAYER'. Allowed: $ALLOWED_LAYERS" >&2
  exit 1
fi

if ! printf '%s' "$SLICE" | grep -qE '^[a-z][a-z0-9-]*$'; then
  echo "❌ Invalid sliceName '$SLICE'. Must be kebab-case." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SLICE_DIR="$REPO_ROOT/src/$LAYER/$SLICE"
TPL_DIR="$REPO_ROOT/.claude/skills/new-fsd-slice/templates"

if [ -d "$SLICE_DIR" ]; then
  echo "❌ Slice already exists: $SLICE_DIR" >&2
  exit 1
fi

mkdir -p "$SLICE_DIR"

IFS=',' read -r -a SEG_ARR <<< "$SEGMENTS"
for seg in "${SEG_ARR[@]}"; do
  mkdir -p "$SLICE_DIR/$seg"
  case "$seg" in
    ui)    cp "$TPL_DIR/ui.tsx.tmpl"    "$SLICE_DIR/ui/${SLICE}.tsx" ;;
    model) cp "$TPL_DIR/model.ts.tmpl"  "$SLICE_DIR/model/index.ts" ;;
    *)     touch "$SLICE_DIR/$seg/.gitkeep" ;;
  esac
done

cp "$TPL_DIR/index.ts.tmpl" "$SLICE_DIR/index.ts"

echo "✅ Created slice at $SLICE_DIR"
find "$SLICE_DIR" -type f | sed "s|$REPO_ROOT/||"
