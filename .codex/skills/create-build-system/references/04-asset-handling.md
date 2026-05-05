# 04. Asset Handling

## Goal

Make public and imported assets work predictably in development and production.

## When to Configure

- Source imports images, fonts, JSON, SVG, or other static files.
- Public/static files must be served directly.
- Extra deployment files must be copied into output.
- Build output has asset 404s.

## Decisions

- Public directory or source import?
- Should small assets inline?
- SVG as URL, raw text, or component?
- Are copy rules needed?

## Recommended Default

- Public directory for absolute URL assets.
- Source imports for bundled/fingerprinted assets.
- SVG as URL unless component imports are required.
- Copy only files not already covered by public directory behavior.

## Tool Notes

- Vite has public and imported asset handling built in.
- Modern webpack should prefer asset modules.
- Rollup usually needs URL/copy plugins.
- esbuild needs loader choices and sometimes separate copy handling.

## What to Avoid

- Do not duplicate public-directory copy behavior.
- Do not inline large images by default.
- Do not add SVG component tooling unless code imports SVG as components.

## Verification

- Dev server serves public assets.
- Build emits imported assets with stable paths.
- CSS font URLs resolve.
- Browser/network smoke test has no asset 404s.
