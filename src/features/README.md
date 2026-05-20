# features

사용자 인터랙션을 동반한 비즈니스 가치 단위 레이어.

- **책임**: 하나의 사용자 행동을 처리 (로그인, 상품 장바구니 추가 등)
- **의존 방향**: `shared/`만 import 가능 — `pages/`·`widgets/`는 불가
- **슬라이스 구조**: 각 슬라이스는 `ui/`, `model/`, `api/`, `lib/` 세그먼트 + `index.ts`

자세한 규칙: [FSD 아키텍처 가이드](../../docs/development/fsd-architecture/01-layers.md)
