---
name: create-build-system
description: |
  Use primarily when invoked by the `/create-build-system` command to inspect,
  design, create, or complete a frontend/CSR build environment. This skill is
  command-backed: prefer explicit command invocation over broad phrase matching.
  Do not use for narrow existing-config bug fixes, dependency upgrades, CI log
  debugging, or one-line tweaks to an already working build setup.
---

# Build System Setup

This skill supports the `/create-build-system` command. Treat the command input
as the user's build-environment request, then inspect the repository, construct a
project-shaped task prompt, load only the needed references, and bring the build
environment to a verified state.

## Non-Goals

- Do not use this skill for narrow config fixes, dependency upgrades, CI log
  debugging, or single-file tweaks.
- Do not replace a working build setup when the request is only to complete or
  inspect it.
- Do not introduce parallel tooling unless the repository facts make it
  necessary.

## Modes

- **detect**: Inspect the project and report current build-environment state.
- **bootstrap**: Establish the initial build environment for a new or mostly empty frontend/CSR project.
- **complete**: Add missing build-environment pieces while preserving working configuration.

Infer the mode from command input and repository state.

- `detect`: report the current state without changing files.
- `bootstrap`: create the first working build path for a new or nearly empty
  frontend/CSR project.
- `complete`: preserve the existing toolchain and add only missing pieces.

Ask only for choices that cannot be discovered and materially affect the result.
If a choice is discoverable from the repo, read first and do not ask.

## Input Contract

Discover before asking. Treat these fields by priority:

- Required to decide the setup:
  - `project_type`
  - `framework`
  - `language`
  - `package_manager`
  - `build_tool`
  - `html_entry`
- Required only when the request or repo facts make them relevant:
  - `needs_dev_server`
  - `needs_alias`
  - `needs_env`
  - `needs_assets`
  - `needs_obfuscation`
- Ask only when the answer changes the setup and cannot be inferred safely:
  - mode choice
  - tool choice when repo facts are ambiguous
  - entry point choice when multiple candidates exist
  - opt-in features such as obfuscation or HTTPS

| Field | Examples | How to infer |
|---|---|---|
| `project_type` | `app`, `library` | package metadata, entry files, command input |
| `framework` | `react`, `vue`, `svelte`, `vanilla` | dependencies and source files |
| `language` | `ts`, `js` | tsconfig, source extensions, dependencies |
| `package_manager` | `pnpm`, `npm`, `yarn`, `bun` | lockfiles, `packageManager`, Volta |
| `build_tool` | `vite`, `webpack`, `rollup`, `esbuild`, `undecided` | config files and scripts |
| `html_entry` | `index.html`, `public/index.html`, custom | repo files and build config |
| `needs_dev_server` | boolean | app vs library, command input |
| `needs_alias` | boolean | imports, tsconfig paths |
| `needs_env` | boolean | env files, runtime config usage |
| `needs_assets` | boolean | public/imported assets |
| `needs_obfuscation` | boolean | explicit source-protection request |

Defaults:

- Frontend app with no strong constraint: Vite.
- Library package: Rollup, or Vite library mode if already Vite-shaped.
- Speed-first build with a separate dev workflow: esbuild.
- Existing webpack or legacy loader/plugin needs: webpack.
- App alias when needed: `@/* -> src/*`.
- Obfuscation: disabled unless explicitly requested.

Decision rules:

- If the repository already has a working build tool, prefer it in `complete`
  mode.
- If the repository has no working build path, prefer the simplest tool that
  satisfies the request.
- If the request emphasizes dev-server DX and HTML entry wiring, prefer Vite.
- If the request emphasizes distribution output for a package, prefer Rollup.
- If the request emphasizes raw speed and the dev server is external, consider
  esbuild.

## Prompt Construction

Before editing, construct the working prompt internally from:

- Command input and any explicit user constraints.
- Repo-detected state for the input contract fields.
- Mode selection: `detect`, `bootstrap`, or `complete`.
- Chosen build tool or reason for asking the user.
- References needed for missing features.
- Planned verification commands, preferring package scripts.

Use this prompt shape:

```md
Detected State:
Decisions:
Needed References:
Planned Changes:
Verification:
Open Questions:
```

If `Open Questions` is empty, proceed. If not, ask only those questions.

Question policy:

- Ask only when the answer materially changes the build setup.
- Prefer one short question over a broad questionnaire.
- If a detail is missing but not blocking, record it in `Remaining Checks`
  instead of asking.

## Reference Loading

Read `references/00-overview.md` when choosing a tool or deciding mode. Then
load only the feature cards needed for the gaps.

If a referenced file is missing, unreadable, or clearly irrelevant to the
detected request, fall back to the overview and the final checklist instead of
blocking on the missing card.

| Feature | Reference |
|---|---|
| Env/runtime config | `references/01-environment.md` |
| Alias/module paths | `references/02-module-resolution.md` |
| TS/JSX/CSS/HTML transform | `references/03-source-transformation.md` |
| Public/imported assets | `references/04-asset-handling.md` |
| Output/chunks/sourcemaps | `references/05-output-bundling.md` |
| Dev server/proxy/HTTPS | `references/06-dev-server.md` |
| Minify/tree shaking/cache | `references/07-optimization.md` |
| Source obfuscation | `references/08-obfuscation.md` |
| Final verification/reporting | `references/09-feature-parity-checklist.md` |

## Execution Rules

- Do not rely on bundled examples; this skill intentionally has none.
- Prefer existing project conventions over generic build-tool defaults.
- Add the smallest configuration that satisfies the command request.
- Keep app and library concerns separate.
- Verify before reporting completion.
- Treat "smallest" as preserving the current toolchain, avoiding duplicate
  paths, and changing only the config/files required by the request.

## Result Format

Finish with:

- `Detected State`
- `Decisions`
- `Applied Changes` or `Planned Changes` for detect-only mode
- `Verification`
- `Remaining Checks`

Suggested content:

- `Detected State`: current tool, framework, language, entry points, and
  existing scripts.
- `Decisions`: mode, selected tool, and any asked/assumed choices.
- `Applied Changes` or `Planned Changes`: config or files touched, kept minimal.
- `Verification`: scripts run and whether they passed.
- `Remaining Checks`: known gaps, assumptions, or follow-up smoke tests.
