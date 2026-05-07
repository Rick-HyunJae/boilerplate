# Vanilla Template Manifest

i18next only (framework binding 없음). 어떤 프레임워크에도 종속되지 않는 가장 가벼운 형태.

## 복사 대상

| 출처                            | 대상                                   |
| ------------------------------- | -------------------------------------- |
| `src/i18n/index.ts`             | 동일 경로                              |
| `src/i18n/translator.ts`        | 동일 경로 (글로벌 t() + DOM 갱신 헬퍼) |
| `src/i18n/{ko,en,ja}/common.ts` | 동일 경로                              |

## 진입점

```ts
// src/main.ts
import { initI18n, t, applyTranslations, onLanguageChange } from './i18n/translator';

await initI18n();
applyTranslations(); // [data-i18n] 속성 가진 모든 노드 번역
```

## HTML 사용

```html
<button data-i18n="common:button.save">저장</button> <input data-i18n-attr="placeholder:common:emptySet.noResult" />
```

## 의존성

`i18next@^22.4.11`. `package.deps.json` 참조.
