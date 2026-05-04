---
trigger_keywords: ['Tailwind', 'SCSS', 'Sass', 'PostCSS', '@theme']
trigger_globs: ['src/shared/styles/**', 'src/**/*.{css,scss}']
---

# Style System

CSR 보일러플레이트의 스타일 시스템. **Tailwind CSS v4** 와 **SCSS (Dart Sass)** 를 모두 준비하고,
개발자가 `src/main.tsx` import 주석 처리로 선택합니다.

## 스타일 파일 구조

```
src/shared/styles/
├── index.css          # Tailwind v4 진입점 (CSS-first config, @theme)
├── global.scss        # SCSS 전역 스타일 진입점
├── _variables.scss    # SCSS 변수 ($color-*, $font-*, $spacing-*, $breakpoint-*)
├── _mixins.scss       # SCSS mixin (respond-to, text-ellipsis, sr-only)
└── _reset.scss        # CSS 리셋 (SCSS 전용; Tailwind는 preflight 내장)
```

## 시스템 선택 방법

`src/main.tsx`에서 하나의 import만 활성화:

```tsx
// Tailwind 선택 (기본값)
import '@/shared/styles/index.css';

// SCSS 선택 (Tailwind import를 주석 처리 후)
// import '@/shared/styles/global.scss';
```

## Tailwind CSS v4

| 항목      | 내용                                                            |
| --------- | --------------------------------------------------------------- |
| 패키지    | `tailwindcss`, `@tailwindcss/vite`                              |
| 통합 방식 | Vite 플러그인 (`@tailwindcss/vite`) — PostCSS 파이프라인 미통과 |
| 설정 방식 | CSS-first: `index.css`의 `@theme` 블록                          |
| 리셋      | `@import "tailwindcss"`에 preflight 내장                        |
| 설정 파일 | 없음 (v4에서 `tailwind.config.js` 불필요)                       |

## SCSS (Dart Sass)

| 항목             | 내용                                                          |
| ---------------- | ------------------------------------------------------------- |
| 패키지           | `sass` (Dart Sass)                                            |
| 통합 방식        | Vite 내장 SCSS 전처리기                                       |
| 컴파일러 API     | sass 1.85+ 기본값으로 modern compiler 사용 (별도 설정 불필요) |
| 전역 변수·믹스인 | `@use './variables' as *` 방식 (additionalData 주입 미사용)   |

## PostCSS / autoprefixer

| 항목         | 내용                                                        |
| ------------ | ----------------------------------------------------------- |
| 설정 파일    | `postcss.config.ts` (프로젝트 루트, Vite 자동 감지)         |
| 적용 대상    | SCSS에서 생성된 CSS (Tailwind v4는 PostCSS 파이프라인 우회) |
| browserslist | `package.json` `browserslist` 필드로 통합 관리 권장         |
