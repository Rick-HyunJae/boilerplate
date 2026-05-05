# Front-End 다국어(i18n) 개발 컨벤션

## 1. 기본 원칙

1. **빌드 시점 번들링 (Zero Runtime Fetch)** — 번역 리소스는 JSON Fetch 가 아니라 TypeScript 모듈(`import`)로 빌드 결과물에 포함.
2. **기능별 네임스페이스 분리** — `common`, `<feature>` 단위로 파일 분리. 협업 시 Git 충돌 차단.
3. **타입 안정성** — `.ts` + `as const` 로 TypeScript 의 키 자동완성 활용.
4. **상수 분리 원칙** — 상수 변수에는 번역값이 아닌 **'키(Key)'** 만 저장.

## 2. 디렉토리 구조

```
src/static/language/
├── i18n.ts                # i18next 초기화
├── ko/
│   ├── common.ts          # 전역 공통
│   └── <feature>.ts
├── en/                    # ko 와 1:1 일치
└── ja/
```

## 3. 코딩 패턴

### A. 표준 컴포넌트

```tsx
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation('studio');
  return <h1>{t('title')}</h1>;
};
```

### B. 동적 키 (Snackbar 등)

```tsx
import { useLooseTranslation } from '~hooks/useLooseTranslation';

const Snackbar = ({ msg }: { msg: string }) => {
  const { looseT } = useLooseTranslation();
  return <p>{looseT(msg)}</p>;
};
```

### C. 상수 파일

```ts
export const TABS = [
  { id: 1, labelKey: 'studio:tabs.layer' },
  { id: 2, labelKey: 'studio:tabs.asset' }
] as const;
```

```tsx
{TABS.map(tab => <button key={tab.id}>{t(tab.labelKey)}</button>)}
```

### D. React 외부

```ts
import i18n from '~language/i18n';

export const formatError = (code: string) =>
  i18n.t(`common:errors.${code}`);
```

## 4. 새 키 추가 워크플로우

1. `src/static/language/ko/<ns>.ts` 에 키 추가.
2. 작업 종료 직전:
   ```bash
   python ~/.claude/skills/i18n-setup/scripts/sync_keys.py .
   ```
3. en/ja 에 자동으로 누락 키와 한국어 원문 주석이 추가된다.

## 5. 새 NS 추가

```bash
python ~/.claude/skills/i18n-setup/scripts/add_namespace.py . <ns>
```

## 6. VS Code i18n-ally

`.vscode/settings.json` 의 i18n-ally 설정으로 키 자동완성·툴팁 표시. 자세한 설정은 템플릿 파일 참조.
