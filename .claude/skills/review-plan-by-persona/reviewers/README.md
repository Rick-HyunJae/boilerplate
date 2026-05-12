# Plan Persona Reviewers

gstack의 `plan-{ceo,eng,design,devex}-review` skills(MIT, © 2026 Garry Tan)에서
평가 rubric을 차용해 본 프로젝트(FSD/pnpm/vitest/한국어 응답) 컨벤션에 맞게 재작성한
**derivative work**다.

`review-plan-by-persona` dispatcher(`../SKILL.md`)가 이 reviewers를 서브에이전트로 dispatch한다.

## 페르소나 카탈로그

| 디렉토리              | 관점                                     | 추천 사용 케이스                                    |
| --------------------- | ---------------------------------------- | --------------------------------------------------- |
| `plan-ceo-review/`    | 비즈니스/제품 — 범위·가치·우선순위       | 사용자 대면 신규 기능, 제품 방향 결정이 포함된 plan |
| `plan-eng-review/`    | 엔지니어링 실행 — 아키텍처·리스크·테스트 | 모든 plan의 기본값. 기술적 실행 가능성이 핵심일 때  |
| `plan-design-review/` | UI/UX — 흐름·상태·일관성·접근성          | 화면이 포함된 기능, 사용자 인터랙션이 있는 plan     |
| `plan-devex-review/`  | 개발자 경험 — API·문서·학습 곡선         | SDK·유틸리티·내부 라이브러리·API 설계가 포함된 plan |

## 공통 규약

모든 reviewer가 따르는 출력 형식·도구·언어·Severity 정의는 `_shared.md` 참조.

## 파일 구조

```
reviewers/
├── _shared.md                  # 공통 규약 (출력 형식, 도구, Severity 등)
├── plan-ceo-review/
│   └── SKILL.md
├── plan-eng-review/
│   └── SKILL.md
├── plan-design-review/
│   └── SKILL.md
└── plan-devex-review/
    ├── SKILL.md
    └── dx-hall-of-fame.md      # DX 패턴 참고 자료 (gstack 원본, MIT)
```

## 출처

gstack plan-review skills에서 rubric을 차용했다. 원본 코드를 그대로 포함하지 않으나
평가 기준·관점·용어는 원본에서 파생됐다.

- 원본 저장소: https://github.com/gptscript-ai/gstack (Garry Tan, 2026)
- 차용 시점: 2026-05
- 변경 사항: gstack 인프라(telemetry, dashboard, learnings, preamble bash 블록) 제거.
  본 프로젝트(FSD, pnpm, vitest, 한국어, Claude Code only) 환경에 맞게 rubric만 재작성.

## 라이선스 (gstack — MIT)

dx-hall-of-fame.md 및 원본 rubric 차용에 적용되는 gstack 라이선스 전문이다.

---

MIT License

Copyright (c) 2026 Garry Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
