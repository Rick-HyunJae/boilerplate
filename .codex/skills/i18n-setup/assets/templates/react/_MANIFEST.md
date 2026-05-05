# React Template Manifest

이 디렉토리의 파일들을 대상 프로젝트 루트에 그대로 복사한다. 기존 파일이 있으면 덮어쓰지 말고 `.new` 접미사로 보존하여 사용자에게 diff 안내.

## 복사 대상

| 출처 | 대상 | 비고 |
|---|---|---|
| `src/static/language/i18n.ts` | 동일 경로 | 진입점 |
| `src/static/language/ko/common.ts` | 동일 경로 | 시드 NS |
| `src/static/language/en/common.ts` | 동일 경로 | 미번역 placeholder |
| `src/static/language/ja/common.ts` | 동일 경로 | 미번역 placeholder |
| `src/@types/i18next.d.ts` | 동일 경로 | 타입 augmentation |
| `src/hooks/useLooseTranslation.ts` | 동일 경로 | 동적 키 wrapper |
| `.vscode/settings.json` | 동일 경로 | i18n-ally 설정 (기존과 머지) |
| `docs/I18n-Convention.md` | 동일 경로 | 컨벤션 문서 |

## 머지 대상 (덮어쓰지 말고 사용자 tsconfig/번들러 설정에 추가)

| 출처 | 대상 |
|---|---|
| `tsconfig.paths.snippet.json` | `tsconfig.json` 의 `compilerOptions.paths` |
| `webpack.alias.snippet.js` | webpack config 의 `resolve.alias` (webpack 사용 시) |
| `vite.alias.snippet.ts` | vite config 의 `resolve.alias` (vite 사용 시) |
| `package.deps.json` | `package.json` 의 `dependencies` |

## 진입점 import 추가

`src/main.tsx` 또는 `src/index.tsx` 최상단에 다음 한 줄 추가:

```ts
import '~language/i18n';
```

## CLAUDE.md 규칙 블록

`~/.claude/skills/i18n-setup/references/claude-md-rule.md` 의 블록을 프로젝트 루트 `CLAUDE.md` 끝에 append.
