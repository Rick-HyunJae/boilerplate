---
trigger_keywords: ['CSS Modules', '.module.css', '.module.scss', 'className']
trigger_globs: ['src/**/*.{tsx,module.css,module.scss}']
---

# Component Style Patterns

FSD 아키텍처에서 컴포넌트에 스타일을 적용하는 방법.

## 기본 원칙

| 상황                          | 권장 방법                      |
| ----------------------------- | ------------------------------ |
| Tailwind 시스템 선택 시       | 유틸리티 클래스 (`className`)  |
| SCSS 시스템 선택 시           | CSS Modules (`.module.scss`)   |
| 전역에 적용되어야 하는 스타일 | `global.scss`에 직접 작성      |
| 키프레임·복잡한 애니메이션    | `.module.scss` 내 `@keyframes` |

## CSS Modules 패턴 (SCSS 시스템)

```
features/auth/
├── ui/
│   ├── LoginForm.tsx
│   ├── LoginForm.module.scss
│   └── index.ts
└── index.ts
```

```scss
// LoginForm.module.scss
@use '../../../../shared/styles/variables' as v;
@use '../../../../shared/styles/mixins' as m;

.form {
    display: flex;
    flex-direction: column;
    gap: v.$spacing-4;

    @include m.respond-to('md') {
        max-width: 400px;
    }
}
```

```tsx
// LoginForm.tsx
import styles from './LoginForm.module.scss';

interface LoginFormProps {
    onSubmit: (data: LoginData) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
    return <form className={styles.form}>...</form>;
}
```

## Tailwind 유틸리티 패턴

```tsx
export function LoginForm({ onSubmit }: LoginFormProps) {
    return (
        <form className="flex flex-col gap-4 md:max-w-[400px]">
            <input className="border border-gray-200 rounded px-3 py-2" />
        </form>
    );
}
```

## SCSS `@use` 경로 규칙

CSS Modules에서 `@use`는 Vite의 `@` alias를 인식하지 못합니다. **상대 경로**를 사용하세요.

```scss
// ✅ 상대 경로
@use '../../../../shared/styles/variables' as v;

// ❌ alias 미동작
@use '@/shared/styles/variables' as v;
```

슬라이스가 많아져 상대 경로가 길어지면, `config/vite/vite.base.ts`의
`css.preprocessorOptions.scss.additionalData`에 전역 주입 방식으로 전환할 수 있습니다.
단, 모든 SCSS 파일마다 파싱 비용이 발생하므로 파일 수가 많을 때 트레이드오프를 고려하세요.
