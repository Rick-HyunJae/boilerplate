---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Detect environment → Determine base → Squash commits → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Standalone Invocation

선행 산출물(plan, spec)이 없어도 항상 단독으로 동작한다. 현재 브랜치의 git 상태와 테스트 결과를 기반으로 Step 1부터 진행한다.

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Detect Environment

**Determine workspace state before presenting options:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 6 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 6 options | Provenance-based (see Step 6) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 4 options (no merge/keep-branch) | No cleanup (externally managed) |

### Step 3: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3.5: Squash Commits

feature branch의 커밋을 main에 반영하기 전에 하나로 squash한다.

```bash
BASE=$(git merge-base HEAD <base-branch>)
COUNT=$(git rev-list --count $BASE..HEAD)
COMMITS=$(git log --oneline $BASE..HEAD --reverse | sed 's/^[a-f0-9]* /- /')
BRANCH=$(git branch --show-current)
```

**커밋이 1개 이하면 skip.**

**2개 이상이면:**

브랜치명과 커밋 목록을 분석해 squash 메시지 제목을 추천한다. 추천 시 `.claude/rules/git-workflow.md`의 커밋 규칙을 적용한다:
- **허용 type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `style`, `revert`
- **제목 길이**: 50자 이내
- **`Co-Authored-By` 추가 금지**

추천 제목은 브랜치명에서 type과 설명을 추출하고, 커밋 내용을 참고해 자연스럽게 정리한다.

사용자에게 다음 형식으로 제안한다:

```
현재 브랜치에 <N>개의 커밋이 있습니다:
<commit list>

추천 squash 메시지:
<type>: <설명>
<commits>

다른 제목을 사용하려면 입력해주세요 (입력하지 않으면 위 메시지를 사용합니다):
```

사용자가 제목을 입력하면 그 제목을, 입력하지 않으면 추천 제목을 사용해 squash한다:

```bash
git reset --soft $BASE
git commit -m "<확정된 제목>
$COMMITS"
```

### Step 4: Present Options

**Normal repo and named-branch worktree — present exactly these 6 options:**

```
Implementation complete. What would you like to do?

1. Cleanup worktree, keep branch (default)
2. Merge back to <base-branch> locally
3. Push branch (no PR)
4. Create Pull Request
5. Keep everything as-is
6. Discard this work

Which option? [1]
```

**Detached HEAD — present exactly these 4 options:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch (no PR)
2. Create Pull Request (new branch + push + gh pr create)
3. Keep as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

**디폴트:** 옵션 입력이 비어있으면 Option 1(Cleanup worktree, keep branch)을 실행한다.

### Step 5: Execute Choice

#### Option 1: Cleanup Worktree, Keep Branch (Default)

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Cleanup worktree (Step 6). 브랜치는 보존한다.

Report: `Worktree cleaned. Branch <name> preserved locally. Push or merge when ready.`

#### Option 2: Merge Locally

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge first — verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>

# Only after merge succeeds: cleanup worktree (Step 6), then delete branch
```

Then: Cleanup worktree (Step 6), then delete branch:

```bash
git branch -d <feature-branch>
```

#### Option 3: Push Branch (No PR)

```bash
git push -u origin <feature-branch>
```

`gh pr create`는 호출하지 않는다.

Report: `Pushed <branch> to origin. Use Option 4 or 'gh pr create' to open a PR.`

**Do NOT clean up worktree.**

#### Option 4: Create Pull Request

upstream이 없으면 먼저 push한다:

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || git push -u origin <feature-branch>
```

그 다음 PR을 생성한다:

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

**Do NOT clean up worktree** — user needs it alive to iterate on PR feedback.

#### Option 5: Keep Everything As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 6: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then: Cleanup worktree (Step 6), then force-delete branch:
```bash
git branch -D <feature-branch>
```

### Step 6: Cleanup Workspace

**Only runs for Options 1, 2, and 6.** Options 3, 4, 5 always preserve the worktree.

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If worktree path is under `.worktrees/` or `worktrees/`:** We own cleanup.

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**Otherwise:** The host environment (harness) owns this workspace. Do NOT remove it. If your platform provides a workspace-exit tool, use it. Otherwise, leave the workspace in place.

## Quick Reference

| Option | Merge | Push | PR | Keep Worktree | Cleanup Branch |
|--------|-------|------|----|---------------|----------------|
| 1. Cleanup worktree, keep branch (default) | - | - | - | - | - |
| 2. Merge locally | yes | - | - | - | yes |
| 3. Push branch (no PR) | - | yes | - | yes | - |
| 4. Create Pull Request | - | if needed | yes | yes | - |
| 5. Keep everything as-is | - | - | - | yes | - |
| 6. Discard | - | - | - | - | yes (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" is ambiguous
- **Fix:** Present exactly 6 structured options (or 4 for detached HEAD)

**Cleaning up worktree for Options 3 or 4**
- **Problem:** Remove worktree user needs for PR iteration
- **Fix:** Only cleanup for Options 1, 2, and 6

**Deleting branch before removing worktree**
- **Problem:** `git branch -d` fails because worktree still references the branch
- **Fix:** Merge first, remove worktree, then delete branch

**Running git worktree remove from inside the worktree**
- **Problem:** Command fails silently when CWD is inside the worktree being removed
- **Fix:** Always `cd` to main repo root before `git worktree remove`

**Cleaning up harness-owned worktrees**
- **Problem:** Removing a worktree the harness created causes phantom state
- **Fix:** Only clean up worktrees under `.worktrees/` or `worktrees/`

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## 다음 단계

PR 생성 또는 merge 완료 후, 아래 스킬로 이어진다:
1. `verification-before-completion` — 최종 체크리스트 검증
2. `requesting-code-review` — 코드 리뷰 요청 (PR URL 포함)

## Red Flags

**Never:**
- squash 없이 push/merge 진행 (커밋이 2개 이상인 경우)
- 추천 메시지 없이 바로 입력 요청
- 프로젝트 commit 규칙(.claude/rules/git-workflow.md)을 무시한 squash 메시지 추천
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Remove a worktree before confirming merge success
- Clean up worktrees you didn't create (provenance check)
- Run `git worktree remove` from inside the worktree

**Always:**
- Verify tests before offering options
- Detect environment before presenting menu
- Present exactly 6 options (or 4 for detached HEAD)
- Default to Option 1 when input is empty
- Get typed confirmation for Option 6
- Clean up worktree for Options 1, 2, and 6 only
- `cd` to main repo root before worktree removal
- Run `git worktree prune` after removal
