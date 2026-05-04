# 트러블슈팅

## 1. i18n-ally 가 키를 인식하지 못함

**증상**: VSCode 사이드바에 키 카운트가 0 이거나, hover 시 툴팁이 안 뜸.

**원인 / 해법**:

- `.vscode/settings.json` 에 `i18n-ally.localesPaths` 가 실제 디렉토리와 일치하는지 확인.
- `pathMatcher` 가 `{locale}/{namespace}.ts` 인지 (파일 구조 변경 시 갱신).
- `i18n-ally.namespace: true` 누락 시 NS prefix 키 인식 실패.
- `regex.usageMatch` 패턴 누락 시 코드 안에서 키 사용처 추적 안 됨.
- 변경 후 VSCode 명령어 `i18n-ally: Reload` 실행.

## 2. TypeScript 가 잘못된 키에 빨간 줄을 안 표시

**증상**: `t('common:nonexistent')` 가 오류 없이 통과.

**원인 / 해법**:

- `src/@types/i18next.d.ts` 가 `tsconfig.json` 의 `include` 또는 `typeRoots` 에 잡혀있는지 확인.
- `import { resources } from '~language/i18n';` 의 path alias 가 동작하는지 확인.
- `tsc --noEmit` 으로 직접 타입 체크.
- `i18next` 버전이 매우 낮으면 `CustomTypeOptions` 가 없을 수 있음 (>= 21.x 필요).

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": { "~language/*": ["src/static/language/*"] }
  },
  "include": ["src/**/*", "src/@types/**/*"]
}
```

## 3. 빌드 시 `Cannot find module '~language/i18n'`

**원인 / 해법**:

- TS paths 만 설정하고 webpack/vite alias 누락. 둘 다 필요.
- webpack:
  ```js
  resolve: { alias: { '~language': path.resolve(__dirname, 'src/static/language') } }
  ```
- vite:
  ```ts
  resolve: { alias: { '~language': '/src/static/language' } }
  ```

## 4. `i18n.t` 가 키를 그대로 반환함

**원인 / 해법**:

- 진입점에서 `import '~language/i18n'` 누락. `main.tsx` 최상단에 추가.
- NS 가 `init({ ns: [...] })` 에 등록되지 않음 → 신규 NS 추가 후 i18n.ts 갱신 필요. `add_namespace.py` 가 자동 처리.
- 잘못된 키 형식. `t('common:button.save')` 처럼 `<ns>:<key>`.

## 5. 언어 전환이 즉시 반영되지 않음

**원인 / 해법**:

- 컴포넌트가 `useTranslation` 을 사용하지 않고 i18n.t 를 모듈 최상단에서 호출 → 정적으로 평가되어 다시 렌더되지 않음.
- 해결: 모든 UI 텍스트는 `useTranslation` 의 t 를 사용. 외부 모듈은 함수 내부에서 i18n.t 호출.

## 6. sync_keys.py 가 어색한 위치에 키를 삽입

**원인 / 해법**:

- en/ja 파일이 prettier 등으로 ko 와 다른 스타일로 포맷됨.
- 해결: sync 후 `npx prettier --write src/static/language/` 실행.
- 또는 ko 파일의 들여쓰기/콤마 스타일을 prettier 와 일치시켜 작업.

## 7. 변수 보간이 안 됨

**원인 / 해법**:

- 변수명 불일치. ko 의 `{{count}}` 인데 호출 시 `{ Count: 1 }` 같은 대소문자 차이.
- 해결: 정확히 동일하게 `{ count: 1 }`.
- HTML 강조가 필요하면 `<Trans>` 컴포넌트 사용.

## 8. SSR 환경에서 깜빡임

이 컨벤션은 빌드 시점 번들링이라 SSR 에서 hydration mismatch 가 거의 없다. 만약 발생하면:

- `useSSR` 또는 i18next 의 `initImmediate: false` 검토.
- 서버에서 동일한 `lng` 로 init 되었는지 확인.

## 9. 한국어 원문 주석이 중복으로 쌓임

**원인**: sync_keys 를 여러 번 돌리며, en/ja 파일에 이미 있는 주석을 다시 추가.

**해법**: sync_keys 는 idempotent. 중복 주석 발견 시 버그 → 이슈 보고. 임시로 prettier 후 다시 sync.
