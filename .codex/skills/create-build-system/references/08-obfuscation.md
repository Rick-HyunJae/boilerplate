# 08. Obfuscation

## Goal

Apply JavaScript obfuscation only when source protection is explicitly required,
without breaking runtime behavior or slowing every build unnecessarily.

## When to Configure

- The user explicitly asks for obfuscation or source protection.
- The project has a known sensitive client-side module.
- Production-only protection is acceptable.

## Decisions

- Is minification enough?
- Which files are included/excluded?
- Which strength level balances risk and build time?
- How will the obfuscated path be smoke-tested?

## Recommended Default

- Disabled unless requested.
- Target selected source files, not dependencies or the whole app.
- Start with medium strength.
- Production-only unless explicitly requested otherwise.

## Tool Notes

- Vite/Rollup can use Rollup-compatible plugins.
- Webpack can use an obfuscator plugin/loader.
- esbuild usually needs a post-build step for selected output files.

## What to Avoid

- Do not obfuscate dependencies by default.
- Do not enable aggressive self-defending options without a clear need.
- Do not combine public sourcemaps with source-protection goals.

## Verification

- Normal build still works.
- Obfuscated build succeeds.
- Only intended files are obfuscated.
- App smoke test passes after obfuscation.
