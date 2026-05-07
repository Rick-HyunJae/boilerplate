---
paths:
    - 'config/env/**'
    - 'src/shared/config/**'
---

# Environment Rules

Facts about environment handling live in `config/env/index.ts` and `src/shared/config/env.ts`.
This file is only about code-time constraints.

## MUST

- Runtime code must not read `import.meta.env` directly. Use the `ENV` object from `@/shared/config/env`.
- When adding a new environment variable, add it to `config/env/index.ts` first.

```ts
// ✅
import { ENV } from '@/shared/config/env';
const baseUrl = ENV.API_BASE_URL;

// ❌ direct access
const baseUrl = import.meta.env.VITE_API_BASE_URL;
```

## New environment variable flow

1. Add the Zod field in `config/env/index.ts`
2. Add it to the `ENV` object in `src/shared/config/env.ts`
3. Update any env-related docs or comments that describe the schema
4. Add the actual values to `.env.dev` / `.env.prod`
