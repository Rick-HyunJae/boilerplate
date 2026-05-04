---
name: create-build-system
description: |
  Use when setting up a build system from scratch for a new or empty project.
  Triggers on: "빌드 시스템 세팅", "vite 세팅", "esbuild 세팅", "rollup 세팅",
  "webpack 세팅", "webpack 설정", "build system setup", "dev server 설정",
  "번들러 설정", "빌드 환경 구축", "빌드 설정 추가", "create build system",
  "setup vite", "setup webpack", "setup rollup", "setup esbuild",
  "빌드 도구 선택", "빌드 시스템 구축".
  Skip for: 기존 빌드 에러 디버깅, webpack 설정 단순 수정, 패키지 버전 업그레이드.
---

# 빌드 시스템 구축 가이드

이 Skill은 **빈 프로젝트에서 빌드 시스템을 처음 구축**할 때 사용한다.
현재 프로젝트(AI_Flow)의 webpack 설정에서 검증된 **8개 필수 기능**을 기준으로
webpack / vite / rollup / esbuild 중 하나를 선택하여 세팅한다.

---

## 사용 흐름

```
1. 빌드 도구 선택 → references/00-overview.md 읽기
2. 필요한 기능 확인 → references/0N-*.md 선택적 읽기
3. 패키지 설치 → npm install <필수 패키지>
4. Config 파일 생성 → templates/{도구}.config.template.* 복사 + 수정
5. package.json 스크립트 추가
6. tsconfig.json paths 동기화 (alias 사용 시)
7. 동작 검증 → references/09-feature-parity-checklist.md
```

---

## 8개 필수 기능 인덱스

| # | 기능 | 참조 파일 |
|---|------|---------|
| 1 | 환경 관리 (BUILD_TYPE / SERVICE_TYPE / 환경변수 주입) | `references/01-environment.md` |
| 2 | 모듈 해석 (path alias + tsconfig 동기화) | `references/02-module-resolution.md` |
| 3 | 소스 변환 (JS/TS/CSS/SCSS/HTML) | `references/03-source-transformation.md` |
| 4 | 자산 처리 (이미지/폰트/JSON) | `references/04-asset-handling.md` |
| 5 | 빌드 산출물 (출력 파일명 / 소스맵 / chunk) | `references/05-output-bundling.md` |
| 6 | 개발 서버 (HMR / HTTPS / proxy) | `references/06-dev-server.md` |
| 7 | 성능 최적화 (minify / treeshake / 사전번들 / 캐시) | `references/07-optimization.md` |
| 8 | 보안: 난독화 (폴더·파일별 선택 적용 + 옵션 프리셋) | `references/08-obfuscation.md` |
| ✓ | 검증 체크리스트 | `references/09-feature-parity-checklist.md` |

---

## 도구별 템플릿

| 도구 | 템플릿 파일 | 비고 |
|------|-----------|------|
| webpack | `templates/webpack.config.template.js` | 현재 프로젝트 기준 전체 기능 포함 |
| vite | `templates/vite.config.template.ts` | 단독 사용, 8개 기능 모두 |
| rollup | `templates/rollup.config.template.mjs` | build 전용, dev는 vite 조합 |
| esbuild | `templates/esbuild.config.template.mjs` | build 전용, dev는 vite 조합 |

---

## 주요 원칙

### Progressive Disclosure
- 이 SKILL.md만 먼저 읽는다
- 도구 미선택 시: `references/00-overview.md` 읽기
- 도구 선택 후: 해당 기능의 references만 필요한 것만 읽기
- 모든 references를 한 번에 읽지 말 것

### Self-contained 원칙
- templates의 모든 config는 외부 의존 없이 단일 파일로 완결
- 프로젝트 내부 paths.js/env.js를 import하지 않음
- 복사 → 일부 값 수정 → 즉시 사용 가능

### index.html 경로 지정
- 기본값: 프로젝트 루트 (`./index.html`)
- 각 도구마다 경로 변경 방법이 다름 → `references/03-source-transformation.md` 참조
- 사용자가 경로를 지정하면 config의 `HTML_ENTRY` 변수를 수정

### 검증된 조합 패턴
| 상황 | 권장 조합 |
|------|---------|
| 빠른 시작, 범용 | vite 단독 |
| 라이브러리 최적화 빌드 | vite(dev) + rollup(build) |
| 초고속 빌드 우선 | vite(dev) + esbuild(build) |
| 기존 webpack 유지 | webpack 단독 |

---

## 알림: 작업 시작 전 확인 사항

1. Node.js 버전 확인: `node -v` (≥ 20.x 권장)
2. 패키지 매니저 확인: npm / yarn / pnpm 중 사용 중인 것
3. TypeScript 사용 여부 확인
4. index.html 위치 확인 (루트 / src / public)
5. 환경변수 파일(.env) 존재 여부 확인
