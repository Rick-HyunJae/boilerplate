# 06. Dev Server

## Goal

Provide fast local feedback with HMR/reload, static serving, SPA fallback, HTTPS,
proxy, host, and port behavior only where needed.

## When to Configure

- App project has no dev script.
- Local routes or assets 404.
- API calls need proxying.
- Local integrations require HTTPS.
- Host/port must match team or integration conventions.

## Decisions

- Built-in dev server or separate tool?
- Port/host/open behavior?
- HTTPS required?
- Proxy paths and targets?
- SPA fallback required?

## Recommended Default

- App projects should have a dev script.
- Use built-in dev server/HMR where available.
- Bind to localhost by default.
- Add HTTPS and proxy only for known requirements.

## Tool Notes

- Vite and webpack-dev-server cover most app dev-server needs.
- Rollup and esbuild usually need pairing with Vite or another dev server for apps.

## What to Avoid

- Do not bind to `0.0.0.0` unless requested.
- Do not add proxy rules without known backend paths.
- Do not enable HTTPS just because production uses HTTPS.

## Verification

- Dev script starts.
- HMR or fast reload works.
- Public/static assets load.
- SPA deep links load the app.
- Proxy and HTTPS work when configured.
