# Spec: Subagent Agent Type Selection Framework

**Date:** 2026-05-10  
**Status:** Approved  
**Scope:** `.claude/skills/subagent-driven-development/` 문서 수정

---

## Goal

`subagent-driven-development` 스킬이 implementer subagent를 dispatch할 때, 태스크 성격에 맞는 agent type을 선택할 수 있도록 범용 선택 프레임워크를 도입한다. 현재는 항상 `general-purpose`만 사용하지만, `frontend-lead` 등 도메인 특화 agent를 활용하면 FSD 규칙, React 패턴, i18n 등 전문 지식이 구현에 자동 반영된다.

---

## Affected Files

| 파일 | 유형 | 변경 내용 |
|------|------|----------|
| `agent-type-guide.md` | 신규 | 매핑 테이블 + 추론 규칙 |
| `SKILL.md` | 수정 | Agent Type Selection 섹션, Prompt Templates 항목, Red Flags 항목 추가 |
| `implementer-prompt.md` | 수정 | `[agent_type]` 플레이스홀더 + 선택 방법 주석 |

---

## Design

### 1. `agent-type-guide.md` (신규)

Agent type 선택의 단일 진실 공급원(Single Source of Truth). Controller가 implementer subagent를 dispatch하기 전에 참조한다.

**선택 우선순위:**
1. Plan에 `agent_type` 필드가 명시된 경우 → 그 값을 그대로 사용
2. 미명시 → 매핑 테이블 기반으로 Controller가 추론

**매핑 테이블:**

| 태스크 신호 | agent_type |
|------------|------------|
| React 컴포넌트 생성/수정 | `frontend-lead` |
| FSD pages / widgets / features / entities 레이어 | `frontend-lead` |
| CSS, i18n, 라우팅, 상태관리 (Zustand/TanStack Query) | `frontend-lead` |
| 유틸 함수, 설정 파일, 타입 정의만 | `general-purpose` |
| 코드 탐색·분석만 | `Explore` |
| 미분류 / 복합 신호 충돌 | `general-purpose` |

**추론 규칙 (Controller용):**
- 태스크 텍스트에 컴포넌트·레이어·UI 키워드 포함 → `frontend-lead`
- 여러 신호가 충돌하면 더 상위 레이어 agent 선택
- 새 agent 추가 시 이 파일의 매핑 테이블에만 행 추가 (다른 파일 수정 불필요)

---

### 2. `SKILL.md` 수정

**추가 섹션 — "Agent Type Selection"** (Model Selection 섹션 뒤에 삽입):

```markdown
## Agent Type Selection

태스크마다 implementer subagent의 agent_type을 결정한다.
선택 기준은 `./agent-type-guide.md` 참조.

**우선순위:**
1. Plan에 `agent_type` 명시 → 그대로 사용
2. 미명시 → Controller가 태스크 내용으로 추론
```

**Prompt Templates 섹션** — `./agent-type-guide.md` 항목 추가.

**Red Flags 섹션** — 다음 항목 추가:
```
- agent_type 확인 없이 무조건 general-purpose dispatch (agent-type-guide 확인 필수)
```

---

### 3. `implementer-prompt.md` 수정

Task tool 헤더의 `general-purpose`를 `[agent_type]` 플레이스홀더로 교체하고, 선택 방법 주석을 추가한다.

**변경 전:**
```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
```

**변경 후:**
```
# [agent_type] 결정 방법:
#   1. Plan에 agent_type 명시 → 그 값 사용
#   2. 미명시 → ./agent-type-guide.md의 매핑 테이블로 추론
#   예: frontend 태스크 → frontend-lead, 유틸/설정 태스크 → general-purpose
Task tool ([agent_type]):
  description: "Implement Task N: [task name]"
```

---

## Out of Scope

- `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`는 변경하지 않는다. 리뷰어는 도메인 전문성보다 코드 독해력이 중요하므로 `general-purpose`가 적합하다.
- `writing-plans` 스킬에 `agent_type` 필드 추가는 별도 작업으로 분리한다. 이번 스펙은 문서 수정 범위만 다룬다.

---

## Success Criteria

- [ ] `agent-type-guide.md`를 읽으면 어떤 태스크에 어떤 agent를 써야 하는지 명확히 알 수 있다
- [ ] `SKILL.md`만 읽어도 agent type 선택이 필요하다는 사실을 인지할 수 있다
- [ ] `implementer-prompt.md` 템플릿이 특정 agent type에 종속되지 않는다
- [ ] 새 agent 추가 시 `agent-type-guide.md`만 수정하면 된다
