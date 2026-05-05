# 09. Command Quality and Completion Checklist

Use this checklist before reporting `/create-build-system` work as complete.

## Command Quality

- Repository was inspected before asking questions.
- Missing information was asked only when it affected the setup.
- Mode was selected: `detect`, `bootstrap`, or `complete`.
- Tool decision was explained or existing tool was preserved.
- Only relevant references were loaded.
- No bundled examples were required.
- The prompt was shaped before editing.
- Questions were limited to blocking choices.

## Build Environment Completion

- Package manager identified.
- Framework and language identified.
- Build tool identified or chosen.
- HTML entry and source entry identified for app projects.
- Dev/build/typecheck scripts exist where appropriate.
- Env handling is explicit and browser-safe when env is used.
- Alias config is synchronized when aliases are used.
- Source transformation covers actual file types.
- Public/imported assets have predictable behavior.
- Output directory, names, sourcemaps, chunks, and base path fit deployment needs.
- Dev server covers HMR, static files, SPA fallback, HTTPS, and proxy only when needed.
- Optimization uses defaults plus justified additions.
- Obfuscation is configured only when explicitly requested.

## Verification

Prefer package-manager scripts. Use direct tool commands only when scripts do not exist.

```bash
node -v
<package-manager> -v
<package-manager> run typecheck
<package-manager> run build
<package-manager> run dev
```

Adapt command names to the project, such as `check`, `tsc`, `start`, or `preview`.

Verification order:

1. Run the most specific package-manager script first.
2. Fall back to direct tool commands only when scripts are absent.
3. Prefer one build check and one runtime smoke check over many redundant
   commands.
4. If a check cannot run, report the completed subset explicitly.

## Test Scenarios

- `/create-build-system 빈 React TypeScript 프로젝트에 Vite 기반 빌드 환경 구축`
- `/create-build-system 현재 프로젝트의 빌드 환경 누락 항목 점검`
- `/create-build-system CSR 프로젝트인데 번들러 선택부터 도와줘`
- `/create-build-system 기존 webpack 프로젝트의 dev server/env/alias 구성 완성`

## Result Format

Finish with these headings:

- `Detected State`
- `Decisions`
- `Applied Changes` or `Planned Changes`
- `Verification`
- `Remaining Checks`

Suggested section content:

- `Detected State`: toolchain, entry points, scripts, and missing gaps.
- `Decisions`: mode, tool, and assumptions made while inspecting.
- `Applied Changes` or `Planned Changes`: the exact minimal scope.
- `Verification`: commands run and whether they passed.
- `Remaining Checks`: unresolved risk, manual smoke tests, or follow-up items.
