---
trigger_keywords: ['환경변수', 'VITE_', '.env', '난독화', 'obfuscate', 'ENABLE_MOCK', 'import.meta.env']
trigger_globs: ['config/env/**', 'src/shared/config/**']
---

# Environment Rules

사실(스키마, 파일 위치, 빌드 모드별 차이) → [spec/env/config.md](/spec/env/config.md)
이 파일은 코드 작성 시 따라야 할 제약입니다.

## MUST

- **런타임에서 `import.meta.env` 직접 접근 금지.** `@/shared/config/env` 의 `ENV` 객체만 사용.
- 새 환경변수 추가 시 반드시 `config/env/index.ts` 에 먼저 추가.

```ts
// ✅
import { ENV } from '@/shared/config/env';
const baseUrl = ENV.API_BASE_URL;

// ❌ 직접 접근
const baseUrl = import.meta.env.VITE_API_BASE_URL;
```

## 새 환경변수 추가 절차

1. `config/env/index.ts` 에 Zod 필드 추가
2. `src/shared/config/env.ts` 의 `ENV` 객체에 추가
3. `spec/env/config.md` 스키마 표 갱신
4. `.env.dev` / `.env.prod` 실제 값 추가
