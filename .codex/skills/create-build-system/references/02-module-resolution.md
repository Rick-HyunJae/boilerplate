# 02. Module Resolution

## Goal

Keep imports readable while ensuring the bundler, TypeScript, tests, and IDE
resolve the same paths.

## When to Configure

- Existing imports use aliases.
- Source has deep relative imports that the setup should standardize.
- TypeScript paths exist but bundler aliases are missing, or the reverse.
- Tests fail because aliases are not mapped.

## Decisions

- Single root alias or multiple domain aliases?
- Alias prefix: `@`, `~`, `#`, or existing convention?
- Source of truth: tsconfig paths, bundler config, or shared config?
- Do tests/storybook/lint/node scripts need the same mapping?

## Recommended Default

- App projects: `@/* -> src/*`.
- Libraries: minimize internal aliases and prefer package exports for public boundaries.
- Keep tsconfig and bundler aliases synchronized.

## Tool Notes

- Vite: `resolve.alias`, optionally tsconfig-paths plugin.
- Webpack: `resolve.alias` plus tsconfig paths.
- Rollup: alias plugin plus tsconfig paths.
- esbuild: native alias or plugin/tsconfig-aware resolver depending on version/tooling.

## What to Avoid

- Do not create many aliases before the folder structure is stable.
- Do not choose an alias that collides with a package name.
- Do not update only TypeScript or only the bundler.

## Verification

- Typecheck passes.
- Build resolves an alias import.
- Tests resolve aliases when tests exist.
- IDE go-to-definition works for alias imports.
