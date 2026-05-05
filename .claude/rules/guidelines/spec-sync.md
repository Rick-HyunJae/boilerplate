---
paths:
  - "src/shared/**"
  - "src/app/**"
  - "config/**"
---

# Spec Sync Rule

`spec/` 디렉토리는 코드의 **사실(facts)** 을 기술합니다. 코드가 변경되면 대응하는 spec 도 같은 작업 단위(PR/커밋)에서 갱신해야 합니다.

## 갱신 트리거

| 변경 대상                                          | 갱신해야 할 spec                                 |
| -------------------------------------------------- | ------------------------------------------------ |
| `src/shared/api/client.ts`                         | `spec/api/client.md`                             |
| `src/shared/config/env.ts`, `config/env/index.ts` | `spec/env/config.md`                             |
| `src/app/routes/`                                  | `spec/architecture/routing.md`                   |
| `src/app/providers/`                               | `spec/architecture/providers.md`                 |
| `src/` 레이어 구조 변경                            | `spec/architecture/overview.md`, `fsd-layers.md` |
| `config/vite/vitest.config.ts`, `src/shared/test/` | `spec/testing/strategy.md`                       |

## Stale 마킹

spec 을 즉시 갱신하기 어려운 경우, 해당 spec 파일 상단에 아래 마커를 추가하고 후속 작업에서 제거합니다.

```md
> ⚠️ stale: <short-sha> — <무엇이 변경됐는지 한 줄>
```

## 새 인프라 추가 시

`src/shared/` 또는 `config/` 하위에 새 공용 모듈을 추가하면 `spec/` 에 대응 파일을 생성하고 `spec/INDEX.md` 에 등록합니다.
