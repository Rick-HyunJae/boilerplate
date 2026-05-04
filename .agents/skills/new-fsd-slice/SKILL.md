---
name: new-fsd-slice
description: FSD layer 에 신규 slice 를 scaffold — ui/model/api/lib segments + index.ts barrel 자동 생성. "slice 추가", "new feature", "widget 만들" 등 키워드 시 사용.
trigger: 'slice 추가|new feature|widget 만들|page 추가|새 feature'
scope: project
---

# new-fsd-slice

Feature-Sliced Design layer 에 새 slice 를 일관된 구조로 생성합니다.

## When to use

- 사용자가 신규 feature/widget/page/entity 를 추가해달라고 요청
- 기존 slice 구조를 따르고 싶을 때

## Inputs

| Field     | Example                                       | Required |
| --------- | --------------------------------------------- | -------- |
| layer     | `features` / `widgets` / `pages` / `entities` | ✅       |
| sliceName | `auth-login` (kebab-case)                     | ✅       |
| segments  | `ui,model,api` (default: `ui,model`)          | ⬜       |

## Steps

1. **Validate**: layer 가 허용 목록에 있는지, sliceName 이 kebab-case 인지 확인
2. **Scaffold**: `scripts/scaffold.sh <layer> <sliceName> [segments]` 실행
3. **Templates**: `templates/` 의 `.tmpl` 을 segment 파일로 복사
4. **Public API**: `index.ts` 를 항상 생성 (re-export 포함)
5. **Verify**:
    - `pnpm lint` — Public API 위반 없는지
    - `pnpm test` — 기존 테스트 영향 없는지
6. **Report**: 생성된 파일 트리를 사용자에게 표시

## Reference

- Layer 규칙 상세: [`ref/fsd-layering-rules.md`](./ref/fsd-layering-rules.md)
- 위반 검출은 [`../../agents/fsd-boundary-checker.md`](../../agents/fsd-boundary-checker.md) agent 사용
