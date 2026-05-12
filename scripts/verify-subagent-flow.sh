#!/usr/bin/env bash
# Verifies that the subagent branch/worktree flow changes are correct.
# Part A: grep-based doc checks.
# Part B: isolated git scenario replay.

set -eo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FAILURES=0

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
pass() { echo "PASS  $1"; }
fail() { echo "FAIL  $1"; FAILURES=$((FAILURES + 1)); }

check() {
  local label="$1" file="$2" pattern="$3"
  if grep -q "$pattern" "$REPO_ROOT/$file"; then
    pass "$label"
  else
    fail "$label  (missing '$pattern' in $file)"
  fi
}

# ─────────────────────────────────────────────
# Part A — Document change verification
# ─────────────────────────────────────────────
echo ""
echo "=== Part A: Document checks ==="

check "guard section present"     ".claude/rules/git-workflow.md"                             "서브에이전트 작업 가드"
check "guard: git push blocked"   ".claude/rules/git-workflow.md"                             "git push"
check "guard: gh pr blocked"      ".claude/rules/git-workflow.md"                             "gh pr create"
check "pipeline: start steps"     "CLAUDE.md"                                                 "시작 전 필수 단계"
check "pipeline: default end"     "CLAUDE.md"                                                 "종료 시 디폴트 동작"
check "step 0.5 defined"          ".claude/skills/using-git-worktrees/SKILL.md"               "Step 0.5: Determine Branch Strategy"
check "directory-only consent"    ".claude/skills/using-git-worktrees/SKILL.md"               "Honor any existing declared"
check "branch name guard"         ".claude/skills/using-git-worktrees/SKILL.md"               "BRANCH_NAME not set"
check "quick-ref: main branch"    ".claude/skills/using-git-worktrees/SKILL.md"               "On main/master/develop"
check "quick-ref: feature branch" ".claude/skills/using-git-worktrees/SKILL.md"               "On feature/fix/refactor branch"
check "option 1 is default"       ".claude/skills/finishing-a-development-branch/SKILL.md"    "Cleanup worktree, keep branch (default)"
check "default prompt [1]"        ".claude/skills/finishing-a-development-branch/SKILL.md"    "Which option? \[1\]"
check "push-only option"          ".claude/skills/finishing-a-development-branch/SKILL.md"    "Push branch (no PR)"
check "create-pr option"          ".claude/skills/finishing-a-development-branch/SKILL.md"    "Create Pull Request"
check "step6 options 1,2,6"       ".claude/skills/finishing-a-development-branch/SKILL.md"    "Options 1, 2, and 6"

# ─────────────────────────────────────────────
# Part B — Git scenario replay (isolated temp repo)
# ─────────────────────────────────────────────
echo ""
echo "=== Part B: Git scenario replay ==="

TMP=$(mktemp -d -t subagent-flow-XXXX)
trap 'rm -rf "$TMP"' EXIT

# --- Set up bare remote + working repo ---
git init -q --bare "$TMP/origin.git"
git init -q -b main "$TMP/repo"
pushd "$TMP/repo" > /dev/null

git config user.email "ci@test"
git config user.name "CI"
git remote add origin "$TMP/origin.git"

mkdir -p .worktrees
echo ".worktrees/" > .gitignore
git add .gitignore
git commit -q -m "chore: init"
git push -q -u origin main

# ── H1: main → new branch + worktree ──────────
echo ""
echo "--- H1: branch + worktree creation from main ---"

CURRENT=$(git branch --show-current)
if [ "$CURRENT" = "main" ]; then
  # Step 0.5 simulation: main → propose new branch, user confirms
  # worktree를 생성할 예정이므로 git branch만 (checkout 없이) — worktree가 checkout 담당
  git branch feat/payment-validation
  git worktree add -q ".worktrees/feat-payment-validation" feat/payment-validation
  if [ -d ".worktrees/feat-payment-validation" ]; then
    pass "H1: worktree directory created"
  else
    fail "H1: worktree directory missing"
  fi
  # main에 그대로 있어야 함 (checkout은 worktree 내부에서)
  BRANCH_AFTER=$(git branch --show-current)
  if [ "$BRANCH_AFTER" = "main" ]; then
    pass "H1: main branch unchanged (worktree owns checkout)"
  else
    fail "H1: unexpected branch ($BRANCH_AFTER)"
  fi
  # worktree 내부에서 올바른 브랜치인지 확인
  WORKTREE_BRANCH=$(git -C ".worktrees/feat-payment-validation" branch --show-current)
  if [ "$WORKTREE_BRANCH" = "feat/payment-validation" ]; then
    pass "H1: worktree is on correct branch"
  else
    fail "H1: worktree on wrong branch ($WORKTREE_BRANCH)"
  fi
else
  fail "H1: precondition failed — expected main, got $CURRENT"
fi

# ── H2: 3 commits → squash to 1 ───────────────
echo ""
echo "--- H2: multi-commit squash ---"

pushd ".worktrees/feat-payment-validation" > /dev/null
for n in 1 2 3; do
  echo "$n" > "f${n}.txt"
  git add "f${n}.txt"
  git commit -q -m "feat: step $n"
done

BASE=$(git merge-base HEAD main)
COUNT_BEFORE=$(git rev-list --count "$BASE..HEAD")

git reset -q --soft "$BASE"
git commit -q -m "feat: payment validation"

COUNT_AFTER=$(git rev-list --count "$BASE..HEAD")

if [ "$COUNT_BEFORE" = "3" ]; then
  pass "H2: had 3 commits before squash"
else
  fail "H2: expected 3 commits before squash, got $COUNT_BEFORE"
fi
if [ "$COUNT_AFTER" = "1" ]; then
  pass "H2: squashed to 1 commit"
else
  fail "H2: expected 1 commit after squash, got $COUNT_AFTER"
fi
popd > /dev/null

# ── H3: Option 1 — cleanup worktree, keep branch ──
echo ""
echo "--- H3: Option 1 — worktree removed, branch preserved ---"

git worktree remove ".worktrees/feat-payment-validation"
git worktree prune

if git branch --list "feat/payment-validation" | grep -q "feat"; then
  pass "H3: branch preserved after worktree removal"
else
  fail "H3: branch was deleted along with worktree"
fi
if [ ! -d ".worktrees/feat-payment-validation" ]; then
  pass "H3: worktree directory removed"
else
  fail "H3: worktree directory still exists"
fi

# ── H4: Option 3 — push dry-run (no PR) ───────
echo ""
echo "--- H4: Option 3 — push only (dry-run) ---"

if git push --dry-run -u origin feat/payment-validation > /dev/null 2>&1; then
  pass "H4: dry-run push succeeded"
else
  fail "H4: dry-run push failed"
fi

REMOTE_BEFORE=$(git ls-remote origin "refs/heads/feat/payment-validation" 2>/dev/null || true)
if [ -z "$REMOTE_BEFORE" ]; then
  pass "H4: no actual ref pushed to remote (dry-run confirmed)"
else
  fail "H4: dry-run unexpectedly pushed to remote"
fi

# ── H5: Option 4 — real push to bare remote ───
echo ""
echo "--- H5: Option 4 — real push to bare remote ---"

git push -q -u origin feat/payment-validation
REMOTE_REF=$(git ls-remote origin "refs/heads/feat/payment-validation" 2>/dev/null || true)
if echo "$REMOTE_REF" | grep -q "feat"; then
  pass "H5: branch ref arrived on remote"
else
  fail "H5: ref not found on remote after push"
fi

# ── F1: already on feature branch → reuse, no new branch ──
echo ""
echo "--- F1: reuse existing feature branch ---"

git checkout -q feat/payment-validation
CURRENT_F=$(git branch --show-current)

# Step 0.5 simulation: not in {main,master,develop} → reuse, no new branch
case "$CURRENT_F" in
  main|master|develop)
    fail "F1: branch reset to base branch unexpectedly ($CURRENT_F)"
    ;;
  *)
    pass "F1: still on feature branch ($CURRENT_F)"
    ;;
esac

BRANCH_COUNT_BEFORE=$(git branch --list | wc -l | tr -d ' ')
# Simulate: "Step 0.5 says reuse — do NOT run git checkout -b"
# Only a worktree would be created; trying to add same branch again should fail gracefully
git worktree add -q ".worktrees/feat-rerun" feat/payment-validation 2>/dev/null \
  && fail "F1: same-branch double-add should not succeed" \
  || pass "F1: double-add of same branch correctly rejected"

BRANCH_COUNT_AFTER=$(git branch --list | wc -l | tr -d ' ')
if [ "$BRANCH_COUNT_BEFORE" = "$BRANCH_COUNT_AFTER" ]; then
  pass "F1: no new branch was created"
else
  fail "F1: branch count changed ($BRANCH_COUNT_BEFORE → $BRANCH_COUNT_AFTER)"
fi

popd > /dev/null  # back to TMP root

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo ""
echo "════════════════════════════════════"
if [ "$FAILURES" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "FAILED: $FAILURES check(s) did not pass"
  exit 1
fi
