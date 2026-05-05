# 03. Source Transformation

## Goal

Transform only the source types the project actually uses: JS/TS, JSX/TSX, CSS,
CSS Modules, SCSS, PostCSS/Tailwind, and HTML entry wiring.

## When to Configure

- The project has source files without a working transform.
- HTML entry is missing or disconnected from source entry.
- CSS/SCSS/Tailwind imports fail.
- TypeScript exists but typecheck/build scripts are missing.

## Decisions

- Framework plugin/preset required?
- TypeScript typecheck only, declaration output, or both?
- Which style formats are in use?
- Which HTML and source entries should be connected?

## Recommended Default

- Use official framework plugins where available.
- Keep transpilation and typechecking separate.
- Use `.module.css` or `.module.scss` for CSS Modules.
- Do not add style tooling until imports/config prove it is needed.

## Tool Notes

- Vite handles TS/JSX/CSS defaults; Sass is needed only for SCSS.
- Webpack needs explicit loaders and loader order.
- Rollup needs plugins for TypeScript/Babel and CSS.
- esbuild handles TS/JSX quickly but may need help for advanced CSS/HTML.

## What to Avoid

- Do not install both Babel and another TS transpiler unless the project needs both.
- Do not add Tailwind/PostCSS config when no styles use it.
- Do not create a second HTML entry when one already exists.

## Verification

- Build compiles source entry.
- Typecheck passes when TypeScript is used.
- CSS and SCSS imports work when present.
- Built HTML references generated JS/CSS assets correctly.
