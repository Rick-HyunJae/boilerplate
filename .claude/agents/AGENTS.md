# Project Agents Index

Project scope 에 정의된 sub-agent 모음. User scope agent (planner, code-reviewer 등) 와는 **이름 충돌 없이 보완** 관계.

## Available Agents

| Agent                                             | Trigger                             | Output                | Model |
| ------------------------------------------------- | ----------------------------------- | --------------------- | ----- |
| [fsd-boundary-checker](./fsd-boundary-checker.md) | import 변경 또는 신규 slice 추가 시 | FSD layer 위반 리포트 | haiku |

## Selection Rules

1. **신규 slice/feature 추가** → User scope `planner` 로 plan → 작성 후 `fsd-boundary-checker`
2. **import 경로 변경 이후** → `fsd-boundary-checker` 자동 호출 권장
3. **일반 코드 리뷰** → User scope `code-reviewer` 사용 (project 에서 재정의 X)

## Frontmatter 표준

각 agent 파일 상단에 다음 필드 필수:

```yaml
---
name: <kebab-case>
description: <한 줄 설명, when-to-use 명시>
model: <haiku | sonnet | opus>
tools: [Read, Grep, Glob, Bash, ...]
---
```

## Naming Convention

- `fsd-*` : FSD layer/slice 관련
- `csr-*` : CSR/React 런타임 관련
- User scope agent 와 동일 이름 금지
