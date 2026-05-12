---
name: git-workflow
description: Git workflow rules - branching strategy, commit conventions, PR process, and collaborative development standards
type: workflow
---

# Git Workflow Rules

프로젝트 Git 워크플로우 결정사항. 세부 방법론(Merge/Rebase, 충돌 해결, Branch 관리)은 `@git-workflow` 스킬 참조.

## 브랜칭 전략: GitHub Flow

```
main (항상 배포 가능)
  ├── feature/<description>
  ├── fix/<description>
  ├── hotfix/<description>
  ├── refactor/<description>
  └── docs/<description>
```

- `main` 직접 커밋 금지 — Feature 브랜치 + PR 필수
- Feature 브랜치는 `main`에서 생성, 리뷰 + CI 통과 후 merge

## 커밋 메시지

형식: `<type>: <description>` (50자 이내, 명령형)

허용된 type: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `style`, `revert`

- Body는 "왜"를 설명 ("무엇을"은 코드로 표현됨)
- `Co-Authored-By` 라인 추가 금지 (전역 설정에서 비활성화됨)

## PR 프로세스

**Title:** `<type>(<scope>): <description>`

**Description 템플릿:**

```markdown
## What

변경 사항 간단 설명

## Why

동기 및 컨텍스트 설명

## How

주요 구현 세부사항

## Testing

- [ ] 단위 테스트 추가/수정
- [ ] 통합 테스트 추가/수정
- [ ] 수동 테스트 완료

## Checklist

- [ ] 코드 스타일 가이드 준수
- [ ] 자체 리뷰 완료
- [ ] 복잡한 로직에 주석 추가
- [ ] 문서 업데이트
- [ ] 테스트 로컬에서 통과
- [ ] 관련 이슈 링크

Closes #123
```

## Worktree 설정

프로젝트 로컬 worktree 디렉토리: `.worktrees/` (`.gitignore`에 포함됨)

Worktree 설정 절차는 `@using-git-worktrees` 스킬 실행.

## 안티패턴

| 금지                          | 올바른 방법                        |
| ----------------------------- | ---------------------------------- |
| `main`에 직접 커밋            | Feature 브랜치 + PR                |
| `.env` 커밋                   | `.gitignore` 추가, 환경변수 사용   |
| 모호한 커밋 메시지 ("update") | `fix(api): resolve race condition` |
| 큰 PR (1000줄+)               | 작은 PR로 분할                     |
| 공개 브랜치 force push        | `git revert` 사용                  |
| 장기 브랜치 (수주)            | 단기 브랜치 + 자주 merge           |

## 서브에이전트 작업 가드

다음은 서브에이전트가 사용자 명시 요청 없이 실행하면 안 되는 동작이다:

- `git push` (모든 형태 — `-u`, `--force` 포함)
- `gh pr create` / GitHub API를 통한 PR 생성
- `git checkout -b` (main/master/develop 브랜치 위에서)

위 동작은 반드시 사용자에게 다음을 사전 확인한 후 진행한다:

1. 어떤 브랜치에서 어떤 동작을 실행할지
2. remote 영향 범위 (origin 변경 여부)
3. 결과적으로 남는 git 상태

사전 확인이 없는 자동 실행은 본 규칙 위반이다.

## 관련 문서

- `@git-workflow` — 세부 방법론 (Merge/Rebase, 충돌 해결, Branch 관리)
- `@using-git-worktrees` — 격리 공간 설정 절차
- `docs/development/development-workflow.md` — 전체 개발 파이프라인
