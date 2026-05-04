---
trigger_keywords: ['포맷', 'prettier', 'formatting']
---

# Prettier 자동 적용 규칙

prompt 에 위 키워드가 포함되거나 매칭 glob 의 파일을 편집할 때 자동 주입.

## Action

- 편집 직후 `pnpm format` (또는 `pnpm format:check` 로 검증) 실행
- CI 와 동일한 Prettier config (`.prettierrc*`) 사용
- 수동 포맷 금지 — 항상 `prettier --write` 로 일관성 유지

## Notes

- 대량 포맷 변경은 별도 commit 분리 (`chore: format`)
- 코드 리뷰 시 포맷 diff 가 의미 있는 변경을 가리지 않도록 주의
