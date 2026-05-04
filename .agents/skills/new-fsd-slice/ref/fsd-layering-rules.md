# FSD Layering Rules (reference)

`SKILL.md` 가 길어지지 않도록 분리된 참고 문서. Skill 실행 중 필요 시 Read.

## Layers (high → low)

```
app → pages → widgets → features → entities → shared
```

- **High → Low import 만 허용.** 역방향 금지.
- **동일 layer cross-slice import 금지.** 조합은 상위 layer 에서.

## Slice Internals (segments)

| Segment    | Purpose                                     |
| ---------- | ------------------------------------------- |
| `ui/`      | React components                            |
| `model/`   | state, hooks, business logic                |
| `api/`     | network 호출 (use `@/shared/api/client`)    |
| `lib/`     | slice 내부 utilities                        |
| `index.ts` | **Public API** — 외부 노출 항목만 re-export |

## Public API 원칙

- 외부 import 는 항상 slice 루트 (`@/features/auth`) 만 사용.
- `@/features/auth/ui/LoginForm` 같이 내부 경로 직접 참조 금지.
- `index.ts` 는 coverage 제외 대상 (vite.config.ts 의 exclude).
