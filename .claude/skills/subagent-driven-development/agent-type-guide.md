# Agent Type Selection Guide

`subagent-driven-development` Controller가 implementer subagent를 dispatch하기 전에 참조한다.

## Selection Priority

1. Plan에 `agent_type` 필드가 명시된 경우 → 그 값을 그대로 사용
2. 미명시 → 아래 매핑 테이블로 Controller가 추론

## Agent Type Mapping Table

| 태스크 신호 | agent_type |
|------------|------------|
| React 컴포넌트 생성/수정 | `frontend-lead` |
| FSD pages / widgets / features / entities 레이어 | `frontend-lead` |
| CSS, i18n, 라우팅, 상태관리 (Zustand/TanStack Query) | `frontend-lead` |
| 유틸 함수, 설정 파일, 타입 정의만 | `general-purpose` |
| 코드 탐색·분석만 | `Explore` |
| Spec/Quality 리뷰 역할 (subagent-driven-development 내부) | `code-reviewer` |
| 미분류 / 복합 신호 충돌 | `general-purpose` |

## Inference Rules (Controller용)

- 태스크 텍스트에 컴포넌트·레이어·UI 키워드 포함 → `frontend-lead`
- 여러 신호가 충돌하면 더 상위 레이어 agent 선택
- 새 agent 추가 시 이 파일의 매핑 테이블에만 행 추가 (다른 파일 수정 불필요)

## Availability Fallback

커스텀 agent(예: `frontend-lead`)는 `.claude/agents/<name>.md` 파일이 있어야 동작한다.
Dispatch 전에 파일 존재 여부를 확인하고, 없으면 `general-purpose`로 폴백한다.

| 선택된 agent_type | 파일 존재? | 실제 dispatch |
|------------------|-----------|--------------|
| `frontend-lead` | ✅ | `frontend-lead` |
| `frontend-lead` | ❌ | `general-purpose` (폴백) |
| `code-reviewer` | ✅ | `code-reviewer` |
| `code-reviewer` | ❌ | `general-purpose` (폴백) |
| `general-purpose` | — | `general-purpose` (내장, 항상 가능) |
| `Explore` | — | `Explore` (내장, 항상 가능) |
