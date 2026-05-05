# 01. Environment Management

## Goal

Make runtime configuration explicit, browser-safe, and available to application
code or HTML only where needed.

## When to Configure

- Env files already exist.
- Source uses `import.meta.env`, `process.env`, or compile-time constants.
- HTML contains placeholders.
- The user asks for modes, API URLs, feature flags, or deployment config.

## Decisions

- Which modes exist?
- Which variables are safe for browser exposure?
- Should values be validated before build/server start?
- Does HTML need variable injection?

## Recommended Default

- Vite: public `VITE_` variables and `import.meta.env`.
- Webpack/Rollup/esbuild: explicit allowlisted defines.
- Use schema validation for required URLs, feature flags, and mode values.
- Keep secrets outside browser bundles.

## Tool Notes

- Vite has env loading and HTML replacement conventions built in.
- Webpack usually needs dotenv loading plus explicit define/html plugin wiring.
- Rollup and esbuild need explicit replace/define and separate HTML handling when HTML is generated.

## What to Avoid

- Do not expose all `process.env` values to the browser.
- Do not invent mode names when repo or deployment already defines them.
- Do not add validation libraries for a single optional value unless the project already uses one.

## Verification

- Invalid required env values fail early.
- Build succeeds for supported modes.
- Browser code reads expected public values.
- HTML output contains no unresolved placeholders.
