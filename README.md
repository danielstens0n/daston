# Overview

A companion tool for Claude Code, Codex, OpenCode, and similar terminal agents — for setting a project's design theme visually from the terminal.

Still early. The idea: run `/daston` as a skill inside your agent. It prints a localhost URL that opens a minimal, Figma-like canvas where you pick fonts, colors, and tweak components.

## Flow

1. Run `/daston` — initializes and outputs a localhost URL.
2. Open the URL. A free-panning canvas loads with stock previews (button, card, table, landing page). Config is stored locally, scoped to the current folder.
3. Make theme changes. Click **Add Component** to emit a prompt you can paste into Claude or Codex (ideally auto-populated).

# Software stack

- **CLI** — Node + Commander. Single binary distributed via npm, run with `npx daston`.
- **Server** — Hono. Lightweight local HTTP layer; serves the prebuilt web bundle in production and exposes a thin API for theme, components, and prompt generation. Vite dev server proxies to it in development.
- **Frontend** — Vite + React + TanStack Router (file-based). SPA rendered into a pannable/zoomable canvas.
- **Shared types** — `src/shared/types.ts`, type-only so server code can't leak into the browser bundle.
- **Storage** — plain JSON on disk. Per-project config in `.daston/config.json` (git-ignorable); global defaults in `~/.daston/`. Schema is versioned from day one.
- **Build** — `tsup` compiles the CLI and server to `dist/`; Vite builds the web SPA to `dist/web/`. Both ship in the npm package so end users need no build step.
- **No backend service** — everything runs in the user's local Node process. No network calls beyond localhost.

# Project overview

```
daston/
├── package.json
├── tsconfig.json
├── vite.config.ts             # builds src/web/ → dist/web/
├── tsup.config.ts             # builds src/cli/ + src/server/ → dist/
├── bin/
│   └── daston.ts              # source; dist/bin/daston.js is the shipped entry
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   └── commands/
│   │       ├── init.ts
│   │       ├── init.test.ts
│   │       ├── start.ts
│   │       └── start.test.ts
│   ├── server/                # Hono
│   │   ├── index.ts           # serves dist/web/ in prod; Vite proxies in dev
│   │   ├── routes/
│   │   │   ├── theme.ts
│   │   │   ├── components.ts
│   │   │   └── prompt.ts
│   │   ├── storage.ts         # project: .daston/config.json · global: ~/.daston/
│   │   └── storage.test.ts
│   ├── web/                   # Vite + React + TanStack Router
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── tokens.css
│   │   ├── routeTree.gen.ts   # generated, gitignored
│   │   ├── routes/            # TanStack Router (file-based)
│   │   │   ├── __root.tsx
│   │   │   └── index.tsx      # mounts the canvas + chrome
│   │   ├── canvas/            # pan/zoom viewport, PreviewWrapper, TextEditLayer, interaction hooks
│   │   ├── previews/          # themed Button/Card/Table/Landing samples rendered inside the canvas
│   │   ├── sidebar/           # right-hand inspector (fields, sections, inspectors)
│   │   ├── layers/            # left-hand layers panel
│   │   ├── toolbar/           # top-of-canvas toolbar + import dialog
│   │   ├── context-menu/      # right-click menu
│   │   ├── state/             # Zustand stores (see layout below)
│   │   │   ├── editor.ts      # barrel for the editor store + selectors
│   │   │   ├── editor/        # store, mutations, selectors, history, instance defaults
│   │   │   ├── registry/      # component registry + imported-components store
│   │   │   ├── layers.ts      # layer-tree helpers (shared by editor and sidebar)
│   │   │   ├── text-edit.ts   # separate store for in-canvas text editing sessions
│   │   │   └── types.ts       # ComponentInstance + props types
│   │   └── lib/               # api client, fonts, keyboard shortcut hook, CSS utils
│   └── shared/
│       └── types.ts           # type-only; no runtime imports
└── dist/                      # published to npm
    ├── bin/daston.js          # package.json#bin target
    └── web/                   # prebuilt SPA served by Hono
```

## A note on `src/web/` layout (vs Next.js)

`src/web/` is organized by **feature**, not by role. There is no top-level
`components/` bucket; instead each surface of the app (`canvas/`, `sidebar/`,
`layers/`, `toolbar/`, `context-menu/`, `previews/`) owns its components,
CSS, hooks, and tests together. Cross-cutting pieces live in `state/` (Zustand
stores) and `lib/` (api client, fonts, keyboard shortcut hook, CSS helpers).

`routes/` only exists because TanStack Router is file-based; this is a
single-page canvas app, so `routes/index.tsx` just composes the feature
folders and `__root.tsx` is the outer layout.
