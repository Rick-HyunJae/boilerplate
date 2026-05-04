# Apply 모드 워크플로우

기존 프로젝트에서 코드 작성·수정 중 다국어를 자동 적용하는 절차. Claude 가 따라야 할 룰.

## 변환 대상 식별

UI 에 노출되는 모든 문자열. 다음 모두 변환 대상:

- JSX text node 의 한글·영문 라벨
- `placeholder`, `title`, `alt`, `aria-label`, `tooltip` 등 텍스트 속성
- `console.error` / 토스트 / 알림 / 에러 메시지
- 상수 파일에서 UI 에 흘러가는 라벨/메시지

**변환 제외**:

- 디버그 전용 `console.log` (개발자만 보는 것)
- 키, ID, 내부 식별자
- URL, 경로, MIME, MIME 같은 식별자
- 정규식, code snippet
- 단위 기호만 있는 문자열 (예: `'%'`, `'px'`)

## 표준 절차 (Claude 가 따를 6 단계)

### 1. NS 결정

파일 경로 도메인 우선 매핑:

| 경로 패턴 | NS |
|---|---|
| `src/views/Studio/...`, `src/components/Studio/...` | `studio` |
| `src/views/Artboard/...`, `src/components/Artboard/...` | `artboard` |
| `src/views/Deployment/...` | `deployment` |
| `src/views/Knowledge/...`, `src/components/Knowledge/...` | `knowledge` |
| 다이얼로그 / 모달 전용 | `dialogs` |
| 위 어디에도 안 맞고 전역 공통 (button.save 같은) | `common` |

해당 NS 가 프로젝트에 없으면 [scripts/add_namespace.py](../scripts/add_namespace.py) 로 먼저 생성.

### 2. 키 작명

- camelCase + 카테고리 prefix.
- 카테고리 우선순위:
  1. 전역 공통 단어 → `common.button.<verb>`, `common.unit.<unit>`
  2. 화면 섹션 → `<feature>.<section>.<item>` (예: `studio.header.toolBox.add`)
  3. 메시지 → `<feature>.messages.<event>` (예: `knowledge.messages.uploadSuccess`)
  4. 에러 → `common:errors.<code>` 또는 `<feature>:errors.<code>`

**기존 키 재사용 우선** — 새 키 만들기 전에 ko 파일에서 의미상 동일한 키 검색.

### 3. import / hook 자동 추가

컴포넌트에 `useTranslation` 미존재 시:

```tsx
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation('<ns>');   // step 1 에서 결정한 NS
  // ...
};
```

이미 있으면:

- 다른 NS 의 키도 필요 → 배열로 확장: `useTranslation(['<existing>', '<new-ns>'])`.
- 또는 그대로 두고 `t('<new-ns>:key')` 형태로 prefix 사용.

### 4. 변수 보간 식별

```tsx
// Before
<p>{`${count}개 Studio`}</p>

// After
// ko/common.ts: studioCount: '{{count}}개 Studio'
<p>{t('common:studioCount', { count })}</p>
```

```tsx
// Before — 문자열 합성
<p>{user.name + '님 환영합니다.'}</p>

// After
// ko/common.ts: welcome: '{{name}}님 환영합니다.'
<p>{t('common:welcome', { name: user.name })}</p>
```

조건부 텍스트는 키 분기로 처리:

```tsx
// Before
<p>{isOwner ? '내 그룹' : '공유 그룹'}</p>

// After
<p>{t(isOwner ? 'knowledge:group.mine' : 'knowledge:group.shared')}</p>
```

### 5. ko 파일에만 키 추가

`src/static/language/ko/<ns>.ts` 만 직접 편집. en/ja 는 절대 손대지 말 것.

```ts
// 추가 전 ko/common.ts
export default {
  button: { confirm: '확인', cancel: '취소' }
};

// 추가 후
export default {
  button: { confirm: '확인', cancel: '취소', save: '저장' }
};
```

기존 nested 구조에 맞춰 카테고리 안에 추가. 새 카테고리가 필요하면 알파벳 순으로 적절한 위치에.

### 6. 동기화 호출

작업 마무리 직전:

```bash
python ~/.claude/skills/i18n-setup/scripts/sync_keys.py <project-root>
```

→ en/ja 에 누락 키가 자동 추가되고, 키 위에 `// 한국어 원문: "..."` 주석이 붙는다.

`--check` 모드로 미리 어떤 키가 추가될지 확인 가능:

```bash
python ~/.claude/skills/i18n-setup/scripts/sync_keys.py <project-root> --check
```

## 상수 파일 변환 패턴

```tsx
// Before
const TYPES = [
  { id: 1, label: '일별' },
  { id: 2, label: '월별' }
];

// After
// ko/common.ts: calendar: { day: '일별', month: '월별' }
const TYPES = [
  { id: 1, labelKey: 'common:calendar.day' },
  { id: 2, labelKey: 'common:calendar.month' }
] as const;

// 렌더에서
{TYPES.map(t => <li key={t.id}>{tFn(t.labelKey)}</li>)}
```

## React 외부 변환 패턴

```ts
// Before — utils.ts
export const formatError = (code: string) => `에러 코드: ${code}`;

// After
import i18n from '~language/i18n';

export const formatError = (code: string) => i18n.t('common:errors.formatted', { code });
```

## 동적 키가 필요한 경우

```tsx
// Snackbar 가 임의의 메시지 코드를 받음
const Snackbar = ({ msgKey }: { msgKey: string }) => {
  const { looseT } = useLooseTranslation();
  return <div>{looseT(msgKey)}</div>;
};
```

`useLooseTranslation` 은 동적 키 전용. **정적 키에는 절대 쓰지 말 것** — 자동완성·타입체크가 사라진다.

## 자동 적용 트리거 (Claude 행동 규칙)

다음 상황에서는 사용자가 명시적으로 i18n 을 언급하지 않아도 자동으로 i18n 을 적용:

1. 새 React 컴포넌트 작성 시 — UI 텍스트는 처음부터 `t()` 로.
2. 기존 컴포넌트에 새 텍스트 추가 시 — 즉시 키 만들고 ko 에 추가.
3. 사용자가 "이 컴포넌트의 한글 표시 좀 바꿔줘" 같은 요청 — 단순 값 변경이 아닌 신규 텍스트면 키 신설.

다음 상황에서는 i18n 적용을 보류하고 한 번 묻기:

1. 디버그/로그 문자열만 있는 변경.
2. 단일 locale 파일의 값 수정 (오타 등). 이미 키가 있는 경우.
3. 매우 임시적인 prototyping 표시 (사용자가 "임시" 명시).
