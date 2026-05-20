# widgets

페이지를 구성하는 독립적인 큰 UI 블록 레이어.

- **책임**: 여러 features를 조합해 화면의 독립적인 영역을 구성 (Header, Sidebar, ProductList 등)
- **의존 방향**: `features/`와 `shared/`만 import 가능 — `pages/`는 불가
- **슬라이스 구조**: 각 슬라이스는 `ui/`, `model/`, `api/`, `lib/` 세그먼트 + `index.ts`

자세한 규칙: [FSD 아키텍처 가이드](../../docs/development/fsd-architecture/01-layers.md)
