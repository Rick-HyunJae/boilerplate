# 07. Optimization

## Goal

Use build-tool defaults and small targeted additions to keep production output
small, cache-friendly, and fast enough to build.

## When to Configure

- Production build is unminified.
- Bundle size or caching is a known concern.
- Dependency pre-bundling or cache behavior is broken.
- User asks for performance optimization.

## Decisions

- Minifier/default production mode?
- Tree-shaking compatibility?
- Dependency pre-bundling or manual chunks?
- Persistent cache or default cache?
- Bundle analysis needed?

## Recommended Default

- Use the selected tool's production defaults first.
- Add custom minifier/chunk/cache settings only for a reason.
- Keep ESM where possible for tree shaking.
- Use bundle analysis as a diagnostic, not baseline setup.

## Tool Notes

- Vite defaults cover most app optimization needs.
- Webpack production mode is strong but may need split/cache tuning.
- Rollup has strong tree shaking.
- esbuild is fast with simpler chunk controls.

## What to Avoid

- Do not add analyzer dependencies without a size/debugging reason.
- Do not hand-tune chunks before basic production build works.
- Do not optimize around imaginary bottlenecks.

## Verification

- Production build succeeds.
- JS/CSS are minified when expected.
- Chunking behavior is intentional.
- Repeat builds are reasonable for project size.
