# 05. Output and Bundling

## Goal

Produce deployable output with the expected directory, cache-safe filenames,
sourcemap policy, chunk strategy, and base path.

## When to Configure

- No build output exists.
- Deployment expects a specific output directory or base path.
- Production filenames need hashes.
- Sourcemap policy is undefined.
- Bundles are too large or caching behavior matters.

## Decisions

- Output directory: `dist`, `build`, or custom?
- Hash filenames in production?
- Sourcemaps per mode?
- Manual chunks or tool defaults?
- Root path, subpath, or CDN base?

## Recommended Default

- Use existing deployment outDir; otherwise `dist`.
- Hash production JS/CSS/assets.
- Use sourcemaps deliberately for production.
- Start with tool default chunking unless caching/size justifies customization.

## Tool Notes

- Vite configures output through `build` and Rollup output options.
- Webpack uses `output`, `devtool`, and optimization settings.
- Rollup uses `output.dir` and filename patterns.
- esbuild uses `outdir`, name patterns, splitting, and sourcemap options.

## What to Avoid

- Do not change outDir without checking deployment assumptions.
- Do not disable hashes for production unless deployment requires stable names.
- Do not overfit manual chunks before measuring.

## Verification

- Build emits HTML/JS/CSS/assets in expected outDir.
- Production names are cache-safe when required.
- Sourcemaps match policy.
- Runtime asset paths work through the intended server/base path.
