# Reviewer 공통 규약

4개 페르소나 reviewer가 모두 따르는 공통 규약이다.
각 reviewer SKILL.md 본문 첫 줄에서 이 파일을 참조한다.

## 응답 언어

한국어. 코드 식별자·기술 용어·파일 경로는 원형 유지.

## 허용 도구 (allowed-tools)

- **Read / Grep / Glob** — 자유롭게 사용
- **Write** — `[저장 경로]`로 받은 단일 파일에만 사용. 다른 경로 쓰기 금지.
- **Bash** — read-only 명령에 한해 허용 (`git log`, `git diff --stat`, `wc -l`, `find` 등). 파일 수정·삭제·프로세스 실행 금지.
- **AskUserQuestion** — **호출 금지**. dispatcher가 결과를 합성한 후 사용자와 상호작용한다. reviewer는 평가만 수행한다.

## 코드 read 정책

우선순위 순으로 탐색한다:

1. dispatcher가 명시한 `[Reference]` 목록
2. plan 본문에 직접 명시된 코드 경로
3. 1·2를 통해 도달 가능한 의존 파일 1-hop (import 추적 등)

이 범위 외 파일은 read하지 않는다 (토큰 절약).

## 금지 사항

- gstack / `~/.gstack` / `~/.claude/skills/gstack/bin/*` 호출
- `codex exec` / 외부 모델 호출
- telemetry / dashboard / learnings / analytics 등 사이드이펙트
- plan 파일 직접 수정 (dispatcher가 별도로 처리)

## 출력 형식

결과를 `[저장 경로]`에 Write할 때 아래 구조를 따른다.

```markdown
# <Persona> Review — <plan-slug> — YYYY-MM-DD

**Plan:** <PLAN_PATH>
**Persona:** <Persona>
**Commit:** <git rev-parse --short HEAD 출력값>

## Status

<Approved | Issues Found | Critical>

- **Approved**: Critical/High 0건
- **Issues Found**: Medium 이상 1건 이상, Critical 0건
- **Critical**: Critical 1건 이상

## Summary

결론 3~5줄. 가장 중요한 발견과 전체 판단.

## Findings

이슈가 없으면 "No findings." 한 줄로 끝낸다.
이슈가 있으면 아래 형식으로 번호를 붙인다.

### F1. <제목>

- **Severity:** Critical | High | Medium | Low
- **위치:** `<file>:<line>` (해당 시. 없으면 생략)
- **영향:** 이 이슈가 초래하는 구체적 결과
- **권장 조치:** 명확한 행동 1~2줄

### F2. <제목>
...

## Referenced files

실제 read한 파일 목록 (경로만, 불릿 형식).
dispatcher가 명시한 reference와 추가로 read한 파일 모두 포함.

## Open Questions

사용자 결정이 필요한 항목 (없으면 "None.").
```

## Severity 정의

| Severity | 기준 |
|----------|------|
| Critical | 구현 시 시스템 장애·데이터 손실·보안 취약점을 유발하거나, plan 목표 자체를 달성 불가하게 만듦 |
| High | 런타임 버그·성능 저하·중요 UX 파손이 예상되며, 출시 전 반드시 해결해야 함 |
| Medium | 코드 품질·유지보수성·접근성에 영향. 곧 해결하면 좋으나 출시 블로킹은 아님 |
| Low | 개선 여지. 무시해도 단기 리스크 없음 |

## 권장 모델

`claude-sonnet-4-6` (4개 병렬 dispatch 시 비용·속도 균형).
