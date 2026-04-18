# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product concept

`daston` is a companion CLI for terminal coding agents (Claude Code, Codex, OpenCode). Users run it (intended surface: `/daston` skill inside an agent, or `npx daston`), it boots a local HTTP server, and prints a localhost URL. That URL opens a Figma-like pannable/zoomable canvas for picking fonts, colors, and tweaking stock component previews (button, card, table, landing page). "Add Component" emits a prompt the user pastes back into their agent.

Everything runs locally in the user's Node process — no network calls beyond localhost, no backend service.

## Intended architecture

Three layers in one npm package, built separately and shipped together:

- **CLI** (`src/cli/`) — Node + Commander, entry at `bin/daston.ts`. Built by `tsup` to `dist/bin/daston.js` (the `package.json#bin` target).
- **Server** (`src/server/`) — Hono. In production, serves the prebuilt SPA from `dist/web/` and exposes routes under `routes/` (`theme.ts`, `components.ts`, `prompt.ts`). In dev, the Vite dev server proxies to it.
- **Web** (`src/web/`) — Vite + React + **TanStack Router with file-based routing**. `routeTree.gen.ts` is generated and gitignored — never hand-edit it. Canvas concerns split into `canvas/` (pan/zoom, selection, rendering), `previews/` (themed component samples), `state/` (stores), `lib/api.ts` (server calls).

Two build pipelines, both shipped in the published package so end users need no build step:
- `tsup` → `dist/` (CLI + server)
- `vite build` → `dist/web/` (SPA)

## Load-bearing constraints

- **`src/shared/types.ts` is type-only.** No runtime imports, no values — this is the seam that prevents server code from leaking into the browser bundle. If you need shared runtime code, put it somewhere else and justify it.
- **Storage is plain JSON on disk, versioned from day one.** Per-project config at `.daston/config.json` (git-ignorable); global defaults at `~/.daston/`. Any schema change needs a version bump and migration path — this ships to user machines and can't assume clean state.
- **Config is scoped to the current folder** (the directory the CLI was invoked from). The server must resolve paths relative to that CWD, not to its own install location.

## Quality gates

Three commands every change should pass before being considered done:

- `npm test` — vitest. Server route tests live next to the route (`*.test.ts`), instantiate the route's Hono app via its factory against a `mkdtemp`-created project root, and exercise it via `app.request()`. No HTTP listener, no shared state between tests.
- `npm run lint` — biome (`biome.json` at the repo root). Use `npm run lint:fix` to auto-apply formatting and import-order fixes. The generated `src/web/routeTree.gen.ts` is excluded.
- `npm run typecheck` — `tsc --noEmit`. The repo runs strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, so type-cast object literals (e.g. `as ThemeConfig`) when feeding them to APIs that expect a literal-typed field.

Add tests when you add a route, a storage helper, or a non-trivial validator. Don't ship a route without at least a happy path and one rejection case.
