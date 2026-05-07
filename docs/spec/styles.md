---
title: 스타일 시스템
description: Tailwind v4 / SCSS 듀얼 셋업과 컴포넌트 스타일 적용 패턴
---

# 스타일 시스템

CSR 보일러플레이트의 스타일 시스템. **Tailwind CSS v4** 와 **SCSS (Dart Sass)** 를 모두 준비하고, 개발자가 `src/main.tsx` import 주석 처리로 선택한다.

## 스타일 파일 구조

```
src/shared/styles/
├── index.css          # Tailwind v4 진입점 (CSS-first config, @theme)
├── global.scss        # SCSS 전역 스타일 진입점
├── _variables.scss    # SCSS 변수 ($color-*, $font-*, $spacing-*, $breakpoint-*)
├── _mixins.scss       # SCSS mixin (respond-to, text-ellipsis, sr-only)
└── _reset.scss        # CSS 리셋 (SCSS 전용; Tailwind 는 preflight 내장)
```

## 시스템 선택 방법

`src/main.tsx` 에서 하나의 import 만 활성화한다.

```tsx
// Tailwind 선택 (기본값)
import '@/shared/styles/index.css';

// SCSS 선택 (Tailwind import 를 주석 처리 후)
// import '@/shared/styles/global.scss';
```

## Tailwind CSS v4

| 항목      | 내용                                                            |
| --------- | --------------------------------------------------------------- |
| 패키지    | `tailwindcss`, `@tailwindcss/vite`                              |
| 통합 방식 | Vite 플러그인 (`@tailwindcss/vite`) — PostCSS 파이프라인 미통과 |
| 설정 방식 | CSS-first: `index.css` 의 `@theme` 블록                         |
| 리셋      | `@import "tailwindcss"` 에 preflight 내장                       |
| 설정 파일 | 없음 (v4 에서 `tailwind.config.js` 불필요)                      |

## SCSS (Dart Sass)

| 항목             | 내용                                                          |
| ---------------- | ------------------------------------------------------------- |
| 패키지           | `sass` (Dart Sass)                                            |
| 통합 방식        | Vite 내장 SCSS 전처리기                                       |
| 컴파일러 API     | sass 1.85+ 기본값으로 modern compiler 사용 (별도 설정 불필요) |
| 전역 변수·믹스인 | `@use './variables' as *` 방식 (`additionalData` 주입 미사용) |

## PostCSS / autoprefixer

| 항목         | 내용                                                          |
| ------------ | ------------------------------------------------------------- |
| 설정 파일    | `postcss.config.ts` (프로젝트 루트, Vite 자동 감지)           |
| 적용 대상    | SCSS 에서 생성된 CSS (Tailwind v4 는 PostCSS 파이프라인 우회) |
| browserslist | `package.json` `browserslist` 필드로 통합 관리 권장           |

---

## 컴포넌트 스타일 적용 패턴

FSD 아키텍처에서 컴포넌트에 스타일을 적용하는 방법.

### 기본 원칙

| 상황                          | 권장 방법                      |
| ----------------------------- | ------------------------------ |
| Tailwind 시스템 선택 시       | 유틸리티 클래스 (`className`)  |
| SCSS 시스템 선택 시           | CSS Modules (`.module.scss`)   |
| 전역에 적용되어야 하는 스타일 | `global.scss` 에 직접 작성     |
| 키프레임·복잡한 애니메이션    | `.module.scss` 내 `@keyframes` |

### CSS Modules 패턴 (SCSS 시스템)

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

### Tailwind 유틸리티 패턴

```tsx
export function LoginForm({ onSubmit }: LoginFormProps) {
    return (
        <form className="flex flex-col gap-4 md:max-w-[400px]">
            <input className="border border-gray-200 rounded px-3 py-2" />
        </form>
    );
}
```

### SCSS `@use` 경로 규칙

CSS Modules 에서 `@use` 는 Vite 의 `@` alias 를 인식하지 못한다. **상대 경로**를 사용한다.

```scss
// ✅ 상대 경로
@use '../../../../shared/styles/variables' as v;

// ❌ alias 미동작
@use '@/shared/styles/variables' as v;
```

슬라이스가 많아져 상대 경로가 길어지면, `config/vite/vite.base.ts` 의 `css.preprocessorOptions.scss.additionalData` 에 전역 주입 방식으로 전환할 수 있다. 단, 모든 SCSS 파일마다 파싱 비용이 발생하므로 파일 수가 많을 때 트레이드오프를 고려한다.
