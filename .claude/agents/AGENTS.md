# Project Agents Index

Project scope 에 정의된 sub-agent 모음. User scope agent (planner, code-reviewer 등) 와는 **이름 충돌 없이 보완** 관계.

## Available Agents

현재 프로젝트 전용 agent 는 없다. 필요한 경우 이 디렉토리에 새 agent 를 추가하고 `.codex/agents/` 에도 동일하게 반영한다.

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
