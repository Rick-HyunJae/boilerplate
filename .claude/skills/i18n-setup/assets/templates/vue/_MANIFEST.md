# Vue Template Manifest

vue-i18n@9 (Composition API) 기반.

## 복사 대상

| 출처                            | 대상      |
| ------------------------------- | --------- |
| `src/i18n/index.ts`             | 동일 경로 |
| `src/i18n/{ko,en,ja}/common.ts` | 동일 경로 |
| `src/types/vue-i18n.d.ts`       | 동일 경로 |
| `.vscode/settings.json`         | 머지      |

## 진입점 (main.ts)

```ts
import { createApp } from 'vue';
import App from './App.vue';
import i18n from './i18n';

createApp(App).use(i18n).mount('#app');
```

## 컴포넌트 사용

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<template>
    <button>{{ t('common.button.save') }}</button>
</template>
```

## 의존성

`vue-i18n@^9.0.0`. `package.deps.json` 참조.
