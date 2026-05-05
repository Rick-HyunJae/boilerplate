# 00. Command Overview and Tool Selection

## Goal

Guide `/create-build-system` from a user request and repository facts to a
complete, minimal build-environment task.

## Command Prompt Structure

Construct this internal prompt before editing:

```md
Detected State:
- project_type:
- framework:
- language:
- package_manager:
- build_tool:
- html_entry:
- existing_scripts:

Decisions:
- mode:
- tool:
- required_features:

Needed References:
- references/...

Planned Changes:
- ...

Verification:
- ...

Open Questions:
- ...
```

Proceed only when `Open Questions` is empty or answered.

## Mode Selection

- `detect`: use when the request is inspection-only or the user explicitly
  wants current-state reporting.
- `bootstrap`: use when the repo has no meaningful build setup yet.
- `complete`: use when a build tool exists and the task is to fill gaps without
  replacing the setup.
- When in doubt, prefer `complete` if the current toolchain already works.

## Tool Selection

- Choose **Vite** for most frontend/CSR apps.
- Choose **webpack** when the project already depends on webpack conventions or legacy loaders/plugins.
- Choose **Rollup** for library output control or existing Rollup projects.
- Choose **esbuild** for speed-first build flows when dev-server needs are separate.
- Keep the existing tool when completing a working but incomplete setup.

## Implementation Checklist

- Detect before deciding.
- Preserve existing conventions and scripts.
- Load only references for missing features.
- Avoid adding parallel tooling that duplicates an existing build path.
- Keep implementation minimal for the selected mode.
- Prefer package-manager scripts for verification.

## What to Avoid

- Do not pick a tool only because the user mentioned it casually if repo facts contradict it.
- Do not replace an existing working toolchain during `complete` mode.
- Do not add library-build complexity to app-only projects.
- Do not add dev-server configuration to build-only libraries unless requested.
- Do not ask for details that can be read from the repository.
- Do not introduce parallel toolchains unless the request or repo state makes
  them necessary.

## Reference Loading

- Load the overview first.
- Load only the feature card that matches the missing gap.
- If a feature card is missing, continue with the overview and checklist.
- If the request is narrow, do not read unrelated cards just because they exist.

## Verification

- The selected mode and tool are explicitly reported.
- The implementation scope maps to detected gaps.
- Verification commands match local scripts or installed tools.
- The final result uses the report format in `09-feature-parity-checklist.md`.
