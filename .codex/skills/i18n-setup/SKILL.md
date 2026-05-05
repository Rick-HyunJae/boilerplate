---
name: i18n-setup
description: |
  Bootstrap an i18n system (React / Vue / Vanilla JS) into a project using the AI_Flow convention
  (i18next + TypeScript bundling + per-namespace files + i18n-ally), and assist during ongoing
  development by extracting hardcoded strings into t() calls and keeping ko/en/ja files in sync.

  TRIGGER when the user says any of:
  - "i18n 세팅", "다국어 환경 구축", "translation setup", "다국어 추가"
  - "translate this component", "하드코딩 문자열 다국어로", "다국어로 변경"
  - "새 네임스페이스 추가", "namespace 추가"
  - "ko/en/ja 동기화", "다국어 동기화", "translation sync"
  - "setup vue-i18n", "i18next vanilla", "react i18n"

  SKIP for trivial value-only edits to existing translations (typo fixes in a single locale file).
---

# i18n-setup

이 skill 은 두 가지 모드로 동작한다.

- **setup 모드** — 신규 프로젝트에 i18n 환경 1회 구축
- **apply 모드** — 기존 프로젝트에서 코드 작성·수정 중 다국어 적용

호출 시 사용자의 요청에서 모드를 자동 판별한다. 애매하면 한 번 묻고 진행.

## 어느 모드로 들어갈지 판별

**setup 모드 신호** — 프로젝트에 `i18next` 의존성이 없거나, `src/static/language/` (또는 동등 경로) 가 존재하지 않거나, 사용자가 "세팅 / 구축 / setup / bootstrap" 표현 사용.

**apply 모드 신호** — 프로젝트에 이미 i18n 인프라가 있고, 사용자가 "이 컴포넌트 / 이 파일 / 하드코딩 / 추가 / 동기화" 표현 사용.

```bash
# 빠른 판정 — package.json 에 i18next 가 있는지
test -f package.json && grep -q '"i18next"' package.json && echo APPLY || echo SETUP
```

---

## setup 모드 워크플로우

대상: 신규 프로젝트(또는 i18n 이 전혀 없는 프로젝트).

### 1. 프레임워크 결정

- 사용자가 명시 → 그대로 사용.
- 미명시 → `package.json` 의 dependencies 로 판별.
  - `react`, `react-dom` → React (1순위, AI_Flow 정밀 복제본)
  - `vue` → Vue (vue-i18n 9, Composition API)
  - 둘 다 없음 → Vanilla JS (i18next only)

### 2. 템플릿 복사

- 디렉토리: `~/.claude/skills/i18n-setup/assets/templates/<framework>/`
- 대상 프로젝트 루트에 그대로 복사. **기존 파일은 절대 덮어쓰지 말고**, 충돌 시 `.new` 접미사로 보존 후 사용자에게 diff 안내.

복사할 파일 목록은 각 template 의 `_MANIFEST.md` 를 참조.

### 3. 의존성 설치

각 template 의 `package.deps.json` 의 `dependencies` / `devDependencies` 를 사용자의 package.json 에 머지 → `npm i`.

### 4. Build / TS alias 통합

- React: `tsconfig.paths.snippet.json` 의 `~language/*` paths 를 사용자 tsconfig 에 머지. webpack/vite 사용 여부 자동 감지 후 해당 alias snippet 적용.
- Vue: 동일 (alias `~i18n`).
- Vanilla: alias 불필요 (상대 경로 사용).

### 5. 진입점 import 추가

- React: `src/main.tsx` 또는 `src/index.tsx` 최상단에 `import '~language/i18n';` 추가.
- Vue: `app.use(i18n)` 한 줄을 main.ts 에 추가.
- Vanilla: HTML 진입점에서 `import './i18n'`.

### 6. 프로젝트 CLAUDE.md 에 i18n 규칙 블록 주입

[references/claude-md-rule.md](references/claude-md-rule.md) 의 블록을 프로젝트 루트 `CLAUDE.md` 끝에 append (없으면 새로 생성).

### 7. Verification

- `npx tsc --noEmit` 무오류
- 시드 컴포넌트에서 `t('common:button.save')` 가 ko 로 렌더
- `i18n.changeLanguage('en')` 후 영문으로 전환
- VSCode i18n-ally 사이드바에 ko/en/ja 키 카운트 동일

---

## apply 모드 워크플로우

대상: 이미 i18n 이 깔린 프로젝트에서 새 UI 작성, 하드코딩 발견, 키 추가.

### 새 컴포넌트 / 화면 작성 시

1. **NS 결정** — 파일 경로 도메인 우선. 예: `src/views/Studio/...` → `studio` NS, `src/components/Knowledge/...` → `knowledge`. 공통 라벨이면 `common`.
2. **키 작명** — camelCase + 카테고리 prefix (`button.save`, `messages.saveSuccess`, `header.toolBox.add`). 기존 키와 의미 충돌 시 재사용.
3. **import 자동 추가** — 컴포넌트에 `useTranslation` 미존재 시 `import { useTranslation } from 'react-i18next';` + `const { t } = useTranslation('<ns>');` 삽입.
4. **변수 보간** — 동적 부분은 `{{var}}` 로 추출 후 `t('ns:key', { var })`.
5. **ko 파일에만 키 추가** — `src/static/language/ko/<ns>.ts` 를 편집.
6. **마지막에 동기화 호출**
   ```bash
   python ~/.claude/skills/i18n-setup/scripts/sync_keys.py <project-root>
   ```
   → en/ja 파일에 누락 키 + `// 한국어 원문: "..."` 주석 자동 삽입.

### 기존 코드의 하드코딩 문자열을 다국어로 변환 시

```bash
python ~/.claude/skills/i18n-setup/scripts/scan_hardcoded.py <project-root>
```

- 1차: 정규식으로 JSX text/속성/단순 한글 리터럴 리포트.
- 2차: 리포트를 보고 Claude 가 NS·키 결정·import 추가·변수 보간 처리. 정규식이 못 잡는 템플릿 리터럴·조건부 문자열은 컨텍스트 추론으로 처리.
- 3차: ko 추가 → `sync_keys.py` 로 마무리.

자세한 변환 규칙은 [references/apply-workflow.md](references/apply-workflow.md).

### 새 네임스페이스 추가 시

```bash
python ~/.claude/skills/i18n-setup/scripts/add_namespace.py <project-root> <ns-name>
```

- ko/en/ja 에 빈 `<ns>.ts` 생성.
- `i18n.ts` 의 import 라인 + resources 객체 + `ns` 배열 자동 갱신.

---

## 참고 문서

- [references/conventions.md](references/conventions.md) — 코어 컨벤션 (네임스페이스, 키 작명, as const, 변수 보간)
- [references/react-patterns.md](references/react-patterns.md) — `useTranslation` / `useLooseTranslation` / 외부 i18n.t / 상수 키 패턴
- [references/apply-workflow.md](references/apply-workflow.md) — 코드 작성 중 자동 적용 룰
- [references/sync-rules.md](references/sync-rules.md) — ko 기준 동기화 + 한국어 원문 주석 컨벤션
- [references/claude-md-rule.md](references/claude-md-rule.md) — 프로젝트 CLAUDE.md 에 주입할 규칙 블록
- [references/troubleshooting.md](references/troubleshooting.md) — i18n-ally 인식 실패, 타입 추론 누락, alias 누락

## 참고 스크립트

- [scripts/sync_keys.py](scripts/sync_keys.py) — ko 기준 다국어 동기화
- [scripts/scan_hardcoded.py](scripts/scan_hardcoded.py) — 하드코딩 문자열 탐지
- [scripts/add_namespace.py](scripts/add_namespace.py) — 새 NS 추가
