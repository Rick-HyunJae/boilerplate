---
name: using-git-worktrees
description: Set up isolated workspaces using git worktrees. Detect existing isolation, create worktrees if needed, run project setup, and verify clean baseline before starting work.
---

# Using Git Worktrees

## Overview

Ensure work happens in an isolated workspace. Prefer your platform's native worktree tools. Fall back to manual git worktrees only when no native tool is available.

**Core principle:** Detect existing isolation first. Then use native tools. Then fall back to git. Never fight the harness.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Standalone Invocation

선행 산출물이 없어도 항상 단독으로 동작한다. 현재 레포지토리의 git 상태를 기반으로 Step 0부터 진행한다.

## Step 0: Detect Existing Isolation

**Before creating anything, check if you are already in an isolated workspace.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules. Before concluding "already in a worktree," verify you are not in a submodule:

```bash
# If this returns a path, you're in a submodule, not a worktree — treat as normal repo
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**If `GIT_DIR != GIT_COMMON` (and not a submodule):** You are already in a linked worktree. Skip to Step 2 (Project Setup). Do NOT create another worktree.

Report with branch state:
- On a branch: "Already in isolated workspace at `<path>` on branch `<name>`."
- Detached HEAD: "Already in isolated workspace at `<path>` (detached HEAD, externally managed). Branch creation needed at finish time."

**If `GIT_DIR == GIT_COMMON` (or in a submodule):** You are in a normal repo checkout.

Has the user already indicated their worktree preference in your instructions? If not, ask for consent before creating a worktree:

> "Would you like me to set up an isolated worktree? It protects your current branch from changes."

Honor any existing declared **directory** preference without asking. **Branch name is always determined in Step 0.5 — do not skip it.** If the user declines consent, work in place and skip to Step 3.

## Step 0.5: Determine Branch Strategy

**Step 0과 Step 1 사이에 반드시 실행한다.** 이미 linked worktree 안이면(Step 0에서 skip 판정) 이 단계도 skip.

**현재 브랜치 검사:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

**분기:**

| 조건 | 동작 |
|------|------|
| `CURRENT_BRANCH ∈ {main, master, develop}` | 신규 브랜치명 결정 절차로 진행 (아래) |
| 그 외 (이미 작업 브랜치) | `BRANCH_NAME=$CURRENT_BRANCH` — 새 브랜치 생성 금지, Step 1로 진행 |

**신규 브랜치명 결정 절차 (main/master/develop에서 시작할 때):**

1. 컨텍스트(plan 파일, spec, 사용자 instructions)에서 작업 성격 추론
2. `.claude/rules/git-workflow.md`의 type 목록(`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `style`, `revert`)에서 매칭
3. 후보 형식: `<type>/<kebab-case-description>`
4. 사용자에게 확인:

   ```
   plan 분석 결과 작업 성격: <type>
   추천 브랜치명: <type>/<description>

   사용하시려면 Enter, 다른 이름을 원하시면 입력해주세요:
   ```

5. 확정된 이름을 `BRANCH_NAME`으로 설정 후 진행 방식에 따라 분기:
   - **worktree를 생성할 예정이면:** `git branch $BRANCH_NAME` (브랜치만 생성, checkout 없음 — worktree 생성 시 자동 checkout됨)
   - **worktree 없이 직접 작업하면:** `git checkout -b $BRANCH_NAME`

## Step 1: Create Isolated Workspace

**You have two mechanisms. Try them in this order.**

### 1a. Native Worktree Tools (preferred)

The user has asked for an isolated workspace (Step 0 consent). Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag. If you do, use it and skip to Step 3.

Native tools handle directory placement, branch creation, and cleanup automatically. Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage.

Only proceed to Step 1b if you have no native worktree tool available.

### 1b. Git Worktree Fallback

**Only use this if Step 1a does not apply** — you have no native worktree tool available. Create a worktree manually using git.

#### Directory Selection

Follow this priority order. Explicit user preference always beats observed filesystem state.

1. **Check your instructions for a declared worktree directory preference.** If the user has already specified one, use it without asking.

2. **Check for an existing project-local worktree directory:**
   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (hidden)
   ls -d worktrees 2>/dev/null      # Alternative
   ```
   If found, use it. If both exist, `.worktrees` wins.

3. **If there is no other guidance available**, default to `.worktrees/` at the project root.

#### Safety Verification (project-local directories only)

**MUST verify directory is ignored before creating worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:** Add to .gitignore, commit the change, then proceed.

**Why critical:** Prevents accidentally committing worktree contents to repository.

#### Create the Worktree

```bash
# Determine path based on chosen location
# For project-local: path="$LOCATION/$BRANCH_NAME"

# BRANCH_NAME must have been set in Step 0.5 — do not proceed without it
[ -z "$BRANCH_NAME" ] && { echo "Error: BRANCH_NAME not set — Step 0.5 required"; exit 1; }

# Step 0.5에서 이미 checkout한 브랜치이면 -b 없이 기존 브랜치로 worktree 생성
git worktree add "$path" "$BRANCH_NAME"
cd "$path"
```

**Sandbox fallback:** If `git worktree add` fails with a permission error (sandbox denial), tell the user the sandbox blocked worktree creation and you're working in the current directory instead. Then run setup and baseline tests in place.

## Step 2: Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## Step 3: Verify Clean Baseline

Run tests to ensure workspace starts clean:

```bash
# Use project-appropriate command
npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### Report

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in linked worktree | Skip creation (Step 0) → go to Step 2 |
| In a submodule | Treat as normal repo (Step 0 guard) |
| On main/master/develop | Step 0.5: infer type → propose name → user confirms → checkout |
| On feature/fix/refactor branch | Step 0.5: reuse current branch (BRANCH_NAME=current) |
| Native worktree tool available | Use it (Step 1a) |
| No native tool | Git worktree fallback (Step 1b) |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check instruction file, then default `.worktrees/` |
| Global path exists | Use it (backward compat) |
| Directory not ignored | Add to .gitignore + commit |
| Permission error on create | Sandbox fallback, work in place |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Fighting the harness

- **Problem:** Using `git worktree add` when the platform already provides isolation
- **Fix:** Step 0 detects existing isolation. Step 1a defers to native tools.

### Skipping detection

- **Problem:** Creating a nested worktree inside an existing one
- **Fix:** Always run Step 0 before creating anything

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > global legacy > instruction file > default

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

## 다음 단계

- 워크트리 진입 후 → `executing-plans` 또는 `subagent-driven-development` 로 plan 실행
- 브랜칭 전략·커밋 컨벤션은 `git-workflow` 스킬 참조 (또는 `.claude/rules/git-workflow.md`)

## Red Flags

**Never:**
- Create a worktree when Step 0 detects existing isolation
- Use `git worktree add` when you have a native worktree tool (e.g., `EnterWorktree`). This is the #1 mistake — if you have it, use it.
- Skip Step 1a by jumping straight to Step 1b's git commands
- Skip Step 0.5 — BRANCH_NAME must always be determined before worktree creation
- Create a new branch when already on a feature/fix/refactor branch (Step 0.5: reuse)
- Auto-infer branch name without user confirmation when on main/master/develop
- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking

**Always:**
- Run Step 0 detection first
- Prefer native tools over git fallback
- Follow directory priority: existing > global legacy > instruction file > default
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline
