# i18n 코어 컨벤션

이 컨벤션은 AI_Flow 프로젝트의 i18n 시스템에서 도출된 일반화 규칙이다. 프레임워크 무관하게 공통.

## 1. 기본 원칙

1. **빌드 시점 번들링 (Zero Runtime Fetch)** — 번역 리소스는 JSON Fetch 가 아니라 TS 모듈 import 로 번들에 포함.
2. **기능별 네임스페이스 분리** — `common`, `<feature1>`, `<feature2>` 단위로 파일 분리. 협업 시 Git 충돌 최소화.
3. **타입 안정성** — 리소스 파일은 `.ts` + (선택) `as const`. TypeScript 의 키 자동완성을 적극 활용.
4. **상수 분리 원칙** — 상수에는 번역값이 아닌 **'키(Key)'** 만 저장. 렌더링 시점에 번역.

## 2. 디렉토리 구조

```
src/static/language/         (React)  또는  src/i18n/  (Vue/Vanilla)
├── i18n.ts                  # 진입점 (수동 import + 등록)
├── ko/
│   ├── common.ts            # 전역 공통 (버튼, 단위, 에러 메시지)
│   ├── <feature1>.ts
│   └── <feature2>.ts
├── en/                      # ko 와 파일명·키 구조 1:1 일치
└── ja/
```

## 3. 리소스 파일 작성 규칙

- 확장자 `.ts` (JSON 금지).
- nested object 사용. 카테고리별로 묶어서 작성:

```typescript
// ko/common.ts
export default {
    button: {
        confirm: '확인',
        cancel: '취소',
        save: '저장',
    },
    basicText: {
        required: '필수',
        optional: '선택',
    },
    unit: {
        count: '개',
        case: '건',
    },
    messages: {
        saveSuccess: '성공적으로 저장되었습니다.',
    },
} as const; // 자동완성·타입체크용. 선택이지만 권장.
```

- en/ja 파일은 동일 키 구조를 유지하고, 키 위에 `// 한국어 원문: "..."` 주석을 둔다 (sync_keys.py 가 자동 삽입).

```typescript
// en/common.ts
export default {
    button: {
        // 한국어 원문: "확인"
        confirm: 'OK',
        // 한국어 원문: "취소"
        cancel: 'Cancel',
    },
} as const;
```

## 4. 키 작명 규칙

- **camelCase**.
- **카테고리 prefix** — `button.<verb>`, `messages.<event>`, `header.<section>.<item>`, `views.<page>.<part>`.
- 의미 단위로 재사용 가능한 키는 `common` NS 로 모은다. 화면 전용은 해당 feature NS.
- 단순 문자열은 평탄하게(`title: '...'`), 묶음은 nested.

## 5. 변수 보간

```typescript
// ko/common.ts
{
  studioCount: '{{count}}개 Studio',
  groupCreate: '{{user_name}} 님이 {{group}} Knowledge Group을 생성했습니다.'
}
```

호출:

```ts
t('common:studioCount', { count: 12 });
t('common:groupCreate', { user_name: 'rick', group: 'Sales' });
```

- 사용할 변수 이름은 ko/en/ja 모두 동일해야 한다.
- HTML 강조 등 마크업이 필요하면 `<em>{{user_name}}</em>` 처럼 인라인 HTML 사용 후 `<Trans>` 컴포넌트로 렌더 (또는 `dangerouslySetInnerHTML`).

## 6. 사용 안 하는 i18next 기능 (현재 컨벤션)

- `as const` 외 plural / context — 미사용. 필요하면 추후 도입하되, 도입 시 컨벤션 문서를 갱신.

## 7. 초기화 설정 (i18n.ts)

```typescript
i18n.use(<binding>).init({
  resources,
  lng: 'ko',
  fallbackLng: ['ko', 'en'],
  supportedLngs: ['ko', 'en', 'ja'],
  ns: ['common', /* feature NS 들 */],
  defaultNS: 'common',
  fallbackNS: 'common',
  debug: false
});
```

## 8. 언어 전환 / 영속화

- 언어 전환: `i18n.changeLanguage(locale)`.
- 사용자 설정 저장: 쿠키(`locale`) 또는 localStorage.
- 앱 진입 시 저장값 읽어 `i18n.language` 와 다르면 `changeLanguage` 호출.

## 9. 타입 안정성 (TypeScript)

`src/@types/i18next.d.ts` 또는 `src/types/<binding>.d.ts` 에서 module augmentation:

```typescript
import 'i18next';
import { resources } from '~language/i18n';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: (typeof resources)['ko']; // ko 구조를 기준으로 추론
    }
}
```

→ 잘못된 키에 IDE 가 빨간 줄을 표시.

## 10. IDE 통합 (i18n-ally)

`.vscode/settings.json` 핵심 설정:

```json
{
    "i18n-ally.localesPaths": ["src/static/language"],
    "i18n-ally.sourceLanguage": "ko",
    "i18n-ally.displayLanguage": "ko",
    "i18n-ally.keystyle": "nested",
    "i18n-ally.enabledParsers": ["js", "ts", "json"],
    "i18n-ally.namespace": true,
    "i18n-ally.pathMatcher": "{locale}/{namespace}.ts",
    "i18n-ally.readonly": true,
    "i18n-ally.regex.usageMatch": ["\\bt\\(['\"]({key})['\"]\\)", "['\"`]([\\w\\-]+:(?!\\/)[\\w\\.\\-]+)['\"`]"]
}
```

- 패턴 A: `t('키')` 호출 감지.
- 패턴 B: 상수 파일의 `'ns:key'` 문자열 감지.

## 11. 절대 금지

- ❌ 상수 파일에서 `t()` 즉시 실행 (초기화 시점 문제).
- ❌ JSON 리소스 + 런타임 fetch.
- ❌ 키 구조 언어별 불일치.
- ❌ 한국어 외 언어를 source 로 사용 (현재 컨벤션은 ko 가 source).
