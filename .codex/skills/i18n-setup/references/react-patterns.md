# React 사용 패턴

React 프로젝트에서 i18n 을 사용하는 표준 패턴 모음. AI_Flow 의 165개 사용처에서 도출.

## A. 표준 컴포넌트 (useTranslation)

### 단일 네임스페이스

```tsx
import { useTranslation } from 'react-i18next';

const StudioHeader = () => {
  const { t } = useTranslation('studio');

  return (
    <header>
      <h1>{t('title')}</h1>            {/* studio.title */}
      <button>{t('common:button.close')}</button>  {/* common 은 fallback 으로 항상 접근 가능 */}
    </header>
  );
};
```

### 다중 네임스페이스

```tsx
const ComplexPage = () => {
  // 첫 번째가 default. 나머지는 'ns:key' 접두어 권장.
  const { t } = useTranslation(['studio', 'artboard', 'knowledge']);

  return (
    <>
      <h1>{t('title')}</h1>                       {/* studio.title */}
      <p>{t('artboard:canvas.size')}</p>
      <p>{t('knowledge:helpCenter')}</p>
    </>
  );
};
```

## B. 동적 키 (useLooseTranslation)

런타임 문자열을 키로 사용해야 할 때. Snackbar / 서버 메시지 코드 등.

```tsx
import { useLooseTranslation } from '~hooks/useLooseTranslation';

const ServerMessage = ({ msgCode }: { msgCode: string }) => {
  const { looseT } = useLooseTranslation();
  return <p>{looseT(msgCode)}</p>;  // msgCode 가 'common:errors.500' 같은 형태
};
```

- `t` 는 그대로 strict 자동완성 유지.
- `looseT` 는 string 인자 허용 (에스케이프 해치).
- 미존재 키는 기본적으로 key 자체 반환 → fallback 처리 가능.

## C. 상수 파일 패턴

```ts
// constants.ts — t() 실행 금지. 키만.
export const TAB_ITEMS = [
  { id: 1, labelKey: 'studio:tabs.layer' },
  { id: 2, labelKey: 'studio:tabs.asset' }
] as const;
```

```tsx
// TabComponent.tsx — 렌더 시점에 번역
const { t } = useTranslation();
return TAB_ITEMS.map(item => <button key={item.id}>{t(item.labelKey)}</button>);
```

## D. React 외부 (utils, axios, error handler)

```ts
import i18n from '~language/i18n';

export const getErrorMsg = (code: string) => {
  // 함수 실행 시점에 현재 언어 반영
  return i18n.t(`common:errors.${code}`);
};
```

- 모듈 최상단에서 호출 금지 (init 전에 평가될 수 있음).
- 항상 함수 내부에서 호출.

## E. 변수 보간 / HTML 강조

```ts
// ko/common.ts
{ welcome: '<em>{{name}}</em>님 환영합니다.' }
```

```tsx
import { Trans } from 'react-i18next';

<Trans i18nKey="common:welcome" values={{ name: 'rick' }} components={{ em: <em /> }} />
```

또는 단순 텍스트라면:

```tsx
{t('common:welcome', { name: 'rick' })}
```

## F. 언어 전환 + 쿠키 영속화

```ts
// routes.tsx 또는 앱 부트스트랩
import i18n from '~language/i18n';
import { cookieUtil } from '~utils/cookie';

const checkLanguageState = () => {
  const saved = cookieUtil.getCookie('locale') || 'ko';
  if (i18n.language !== saved) {
    i18n.changeLanguage(saved);
  }
};

// 사용자가 변경할 때
const onChangeLocale = (locale: 'ko' | 'en' | 'ja') => {
  i18n.changeLanguage(locale);
  cookieUtil.setCookie('locale', locale, { expires: 365 });
};
```

## G. 타입 안정성 (자동완성)

`src/@types/i18next.d.ts` 가 제대로 설정되면 IDE 가 다음을 잡아준다:

```tsx
t('common:button.save');     // ✅ OK
t('common:button.bogus');    // ❌ TS 오류
t('studio:nonExistent');     // ❌ TS 오류
```

오류가 안 잡히면 → [troubleshooting.md](./troubleshooting.md) 의 "타입 추론 누락" 섹션 참조.

## H. 권장 / 비권장

| 권장 | 비권장 |
|---|---|
| `useTranslation('feature')` 단일 NS | 컴포넌트 한 개에서 모든 NS 로드 |
| 상수에 키만 저장 후 렌더 시점 t() | 상수 모듈 최상단에서 t() 실행 |
| 변수 보간 `{{var}}` | 문자열 합치기 (`t('hello') + name`) |
| `useLooseTranslation` 의 `looseT` | 모든 곳에서 `t as any` |
| ko 만 편집 후 sync_keys.py | 언어별 따로따로 편집 |
