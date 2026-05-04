---
trigger_keywords: ['import 순서', 'import-order', '임포트 순서', 'import type']
---

# Import Order Rules

## 그룹 순서 (그룹 사이 빈 줄 1개)

1. **외부 라이브러리** — React 관련도 높을수록 위
2. **UI import** — FSD 상위 → 하위 (pages → widgets → features → entities → shared)
3. **유틸 import** — FSD 상위 → 하위
4. **타입 import** — `import type` 만
5. **스타일 import** — `import styles from './styles.module.css'`

## 전체 예시

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { AuthForm } from '@/features/auth';
import { Button } from '@/shared/ui';

import { ENV } from '@/shared/config/env';
import { apiClient } from '@/shared/api';

import type { User } from '@/entities/user';

import styles from './styles.module.css';
```

## 그룹 내 type import

값과 타입을 함께 가져올 경우 인라인 형식 사용: `import { Button, type ButtonProps } from '@/shared/ui'`.
타입만 있을 경우 `import type` 구문 사용.
