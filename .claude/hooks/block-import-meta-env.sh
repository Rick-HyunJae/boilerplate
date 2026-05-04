#!/usr/bin/env bash
# PreToolUse hook — `import.meta.env` 직접 사용 차단.
# CLAUDE.md 규약: env 는 src/shared/config/env.ts 의 ENV 객체로만 접근.
# 입력: stdin 으로 tool input JSON 수신.
# 차단: exit 2 + stderr 메시지.

set -euo pipefail

input="$(cat)"

# Edit/Write 의 file_path + new_string/content 추출
file_path="$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
content="$(printf '%s' "$input" | grep -oE '"(new_string|content)"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 || true)"

# 대상이 src/shared/config/env.ts 면 허용 (env.ts 자체는 import.meta.env 사용 가능)
case "$file_path" in
  *src/shared/config/env.ts) exit 0 ;;
esac

# .ts/.tsx 파일이 아니면 통과
case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

if printf '%s' "$content" | grep -q 'import\.meta\.env'; then
  echo "❌ Blocked: 'import.meta.env' 직접 사용 금지." >&2
  echo "   대신 '@/shared/config/env' 의 ENV 객체를 사용하세요." >&2
  echo "   File: $file_path" >&2
  exit 2
fi

exit 0
