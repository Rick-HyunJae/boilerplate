---
trigger_keywords: ['vitest', '테스트', 'coverage', '커버리지', '@testing-library']
trigger_globs: ['**/*.test.tsx', '**/*.test.ts', 'src/shared/test/**']
---

# Testing Rules

사실(프레임워크, 커버리지 기준, 유틸) → [spec/testing/strategy.md](/spec/testing/strategy.md)
이 파일은 코드 작성 시 따라야 할 제약입니다.

## MUST

- **`render` 는 반드시 `@/shared/test/utils` 에서 import.** `@testing-library/react` 직접 import 금지.
- 커버리지 80% 미만은 CI 실패. 로직은 반드시 segment 파일에 위치.
- 테스트 이름은 동작을 설명하는 문장으로 (`renders ...`, `returns ... when ...`, `throws ... if ...`).

```ts
// ✅
import { render, screen } from '@/shared/test/utils';

// ❌
import { render } from '@testing-library/react';
```

## AAA 패턴 준수

```ts
test('비활성 사용자는 버튼이 disabled 상태여야 한다', () => {
  // Arrange
  const props = { userId: '1', isActive: false }

  // Act
  render(<UserCard {...props} />)

  // Assert
  expect(screen.getByRole('button')).toBeDisabled()
})
```

## 커버리지 제외 확인

`**/index.ts` 는 제외됨 → barrel 에 로직 넣지 말 것.
