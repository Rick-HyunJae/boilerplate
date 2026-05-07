---
paths:
    - 'src/shared/**'
    - 'src/app/**'
    - 'config/**'
---

# Spec Sync Rule

`docs/spec/` 디렉토리는 코드의 **사실(facts)** 을 기술합니다. 코드가 변경되면 대응하는 spec 도 같은 작업 단위(PR/커밋)에서 갱신해야 합니다.

## 갱신 트리거

| 변경 대상                                          | 갱신해야 할 spec                                            |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `src/shared/api/client.ts`                         | `docs/spec/api.md`                                          |
| `src/shared/config/env.ts`, `config/env/index.ts`  | `docs/spec/build.md`                                        |
| `config/vite/**`                                   | `docs/spec/build.md`                                        |
| `src/app/routes/`                                  | `docs/spec/architecture.md`                                 |
| `src/app/providers/`                               | `docs/spec/architecture.md`                                 |
| `src/` 레이어 구조 변경                            | `docs/spec/architecture.md`, `docs/spec/fsd-architecture/*` |
| `config/vite/vitest.config.ts`, `src/shared/test/` | `docs/spec/testing.md`                                      |
| `src/shared/styles/**`                             | `docs/spec/styles.md`                                       |

## Stale 마킹

spec 을 즉시 갱신하기 어려운 경우, 해당 spec 파일 상단에 아래 마커를 추가하고 후속 작업에서 제거합니다.

```md
> ⚠️ stale: <short-sha> — <무엇이 변경됐는지 한 줄>
```

## 새 인프라 추가 시

`src/shared/` 또는 `config/` 하위에 새 공용 모듈을 추가하면 `docs/spec/` 에 대응 파일을 생성하거나 기존 파일에 섹션을 추가합니다.
