#!/usr/bin/env bash
# auto-rules-inject.sh
# UserPromptSubmit hook — prompt 키워드 매칭으로 관련 auto rule / spec 파일을 주입.
# Claude Code 는 UserPromptSubmit hook 의 stdout 을 컨텍스트에 추가한다.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RULES_AUTO="$REPO_ROOT/.claude/rules/auto"
SPEC_ROOT="$REPO_ROOT/spec"

# --- 입력 파싱 ---
INPUT="$(cat)"
PROMPT="$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('prompt', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")"

if [[ -z "$PROMPT" ]]; then
  exit 0
fi

# --- frontmatter 에서 keywords 추출 후 매칭 ---
# 파일의 trigger_keywords 라인에서 키워드를 추출해 PROMPT 와 대조
file_matches_prompt() {
  local file="$1"
  local kw_line
  kw_line="$(grep -m1 'trigger_keywords:' "$file" 2>/dev/null || echo "")"
  [[ -z "$kw_line" ]] && return 1

  # 대괄호/따옴표 제거 후 쉼표를 개행으로 변환
  local keyword
  while IFS= read -r keyword; do
    keyword="$(echo "$keyword" | tr -d "[]'\", \t")"
    [[ -z "$keyword" ]] && continue
    if echo "$PROMPT" | grep -qi "$keyword"; then
      return 0
    fi
  done < <(echo "$kw_line" | sed 's/trigger_keywords://' | tr ',' '\n')

  return 1
}

# 매칭된 파일 수집
matched_files=()

while IFS= read -r file; do
  [[ -f "$file" ]] || continue
  if file_matches_prompt "$file"; then
    matched_files+=("$file")
  fi
done < <(
  find "$RULES_AUTO" -name "*.md" 2>/dev/null
  find "$SPEC_ROOT" -name "*.md" ! -name "INDEX.md" 2>/dev/null
)

# 매칭 없으면 종료
if [[ ${#matched_files[@]} -eq 0 ]]; then
  exit 0
fi

# 중복 제거
unique_files=()
while IFS= read -r f; do
  unique_files+=("$f")
done < <(printf '%s\n' "${matched_files[@]}" | sort -u)

# 출력 (최대 5개, 토큰 가드)
MAX_FILES=5
count=0
for file in "${unique_files[@]}"; do
  [[ $count -ge $MAX_FILES ]] && break
  rel_path="${file#$REPO_ROOT/}"
  echo ""
  echo "<!-- auto-injected: $rel_path -->"
  cat "$file"
  count=$((count + 1))
done
