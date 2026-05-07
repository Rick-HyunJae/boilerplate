# /create-build-system

Use this command to inspect, bootstrap, or complete a frontend/CSR build
environment. It is backed by the `create-build-system` skill.

## Usage

```text
/create-build-system <what you want to build or inspect>
```

## Example Prompts

- `/create-build-system 빈 React TypeScript 프로젝트에 Vite 기반 빌드 환경 구축`
- `/create-build-system 현재 프로젝트의 빌드 환경 누락 항목 점검`
- `/create-build-system CSR 프로젝트인데 번들러 선택부터 도와줘`
- `/create-build-system 기존 webpack 프로젝트의 dev server/env/alias 구성 완성`

## Command Behavior

1. Load `.codex/skills/create-build-system/SKILL.md`.
2. Inspect the repository before asking questions:
    - `package.json`, lockfiles, package manager metadata
    - existing build configs and package scripts
    - tsconfig files, HTML entry files, source entry files
    - env files, public/static assets, test config if relevant
3. Build an internal working prompt with:
    - detected state
    - decisions made
    - missing build-environment features, grouped by priority
    - references to read
    - planned changes
    - verification commands
4. Ask only for missing choices that materially affect the setup.
5. Read only the relevant `references/*.md` files from the skill.
6. Apply the smallest project-shaped change needed to satisfy the command.
7. Verify with package-manager scripts first, direct tool commands second.

## Decision Rules

- `detect`: inspect and report, but do not mutate files.
- `bootstrap`: create the first working build path when no usable setup exists.
- `complete`: keep the current setup and fill only the missing pieces.
- If the repo already has a working build path, prefer `complete` over
  `bootstrap`.
- If multiple build tools fit, pick the one best aligned with the existing
  project shape and the request.

## Question Policy

- Ask only when the answer would change the setup.
- Prefer a single blocking question over a broad checklist.
- If a detail is missing but not blocking, record it in `Remaining Checks`.
- If a referenced card is missing or irrelevant, continue with the overview and
  checklist instead of stopping.

## Verification Order

1. Run the repository's package-manager script for the relevant task.
2. If no script exists, run the direct tool command.
3. If the requested path has multiple modes, verify the selected one first.
4. Record partial success explicitly when a later check cannot run.

## Output Format

Always finish with:

- `Detected State`
- `Decisions`
- `Applied Changes` or `Planned Changes`
- `Verification`
- `Remaining Checks`

Suggested content:

- `Detected State`: current toolchain, entry points, existing scripts, and
  missing pieces.
- `Decisions`: chosen mode, tool, and any assumptions.
- `Applied Changes` or `Planned Changes`: exact scope of edits, kept minimal.
- `Verification`: commands run and results.
- `Remaining Checks`: unresolved risks, follow-up smoke tests, or manual checks.
