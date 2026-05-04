#!/usr/bin/env bash
# PreToolUse hook — block direct edits to generated `.agents/` mirror.
# Claude manages `.claude/`; `.agents/` is sync-only output for Codex.

set -euo pipefail

input="$(cat)"

file_path="$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

case "$file_path" in
  .agents|.agents/*|*/.agents|*/.agents/*)
    echo "❌ Blocked: direct edits to .agents/ are not allowed." >&2
    echo "   Update .claude/ instead, then run pnpm sync:agents." >&2
    echo "   File: $file_path" >&2
    exit 2
    ;;
esac

exit 0
