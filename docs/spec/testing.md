---
title: 테스팅 전략
description: Vitest 환경, 커버리지 기준, 공통 유틸 사용 규칙
---

# 테스팅 전략

## 프레임워크

**Vitest** (jsdom 환경) + **Testing Library** + **jest-dom matchers**

## 커버리지 기준

Lines / Functions / Branches / Statements 모두 **80% 이상** 강제.

```bash
pnpm test:coverage   # 커버리지 포함 실행 + 임계치 검사
```

## 커버리지 제외 항목

`config/vite/vitest.config.ts` 기준:

- `src/shared/test/` — 테스트 인프라 자체
- `**/index.ts` — Public API barrel 파일
- `**/*.config.*` — 설정 파일
- `**/*.d.ts` — 타입 선언 파일

로직은 반드시 segment 파일 (`ui/`, `model/`, `api/`, `lib/`) 에 작성해야 커버리지에 포함된다.

## 공통 유틸

### setup

`src/shared/test/setup.ts` — Vitest `setupFiles` 에 자동 로드. jest-dom matchers 등 전역 설정.

### render helper

`src/shared/test/utils.tsx` — Provider 로 감싼 `render` 함수 제공.

```ts
// ✅ 이 render 사용
import { render } from '@/shared/test/utils';

// ❌ 직접 사용 금지 (Provider 누락)
import { render } from '@testing-library/react';
```

## 테스트 실행

```bash
pnpm test                                                                # watch mode
pnpm test:ui                                                             # Vitest UI
pnpm vitest --config config/vite/vitest.config.ts run <파일경로>           # 단일 파일
pnpm vitest --config config/vite/vitest.config.ts run -t "test name"      # 이름 매칭
```

## 구조 (AAA 패턴)

```ts
test('설명적인 테스트 이름', () => {
    // Arrange
    const props = { userId: '1', isActive: true };

    // Act
    const { getByText } = render(<UserCard {...props} />);

    // Assert
    expect(getByText('Active')).toBeInTheDocument();
});
```

## TDD 흐름

1. 테스트 먼저 작성 (RED — 실패 확인)
2. 최소 구현 (GREEN — 통과 확인)
3. 리팩토링 (IMPROVE — 커버리지 재확인)
