# daston

Visual design companion for terminal coding agents. Pairs with Claude Code, Codex, OpenCode, and friends — edit your project's fonts, colors, and components on a Figma-like canvas, then hand the changes back to the agent as prompts.

## Installation

### Global (recommended)

```bash
npm install -g daston
```

### One-off (no install)

```bash
npx daston start
```

### Project dependency

```bash
npm install --save-dev daston
```

## Quick start

From inside your app's repo:

```bash
daston init    # create .daston/config.json in this project
daston start   # boot the local server and print a localhost URL
```

Open the printed URL in a browser. You get a pannable canvas with previews of stock components (Button, Card, Table, Landing) styled with your project's theme. Edit on the canvas; the config file updates on disk.

## Commands

```bash
daston init                 # create .daston/config.json in the target project
daston start                # start the canvas and print http://127.0.0.1:<port>/
daston <cmd> --project <p>  # override the target project directory
```

### Target-project resolution

Both commands resolve "which project am I acting on?" in this order:

1. `--project <path>` if provided.
2. Nearest ancestor of the current directory whose `package.json` looks like an app (React, Vite, Next, TanStack Router, Vue, Svelte, Astro, Nuxt, Remix, …).
3. A single app package under a workspace root (reads root `package.json#workspaces`, `pnpm-workspace.yaml`, `packages/*`, `apps/*`).

If two or more apps match, daston exits and lists the candidates so you can pass `--project` explicitly.

## Agent workflow

1. Your agent (or you) runs `daston start`.
2. You open the URL and tweak fonts, colors, and component styling visually.
3. Click **Add Component** to generate a prompt describing the change. Paste it back into the agent to have it apply the change to the actual source files.

daston itself never touches your source — it only writes to `.daston/config.json`. The agent is what edits components.

## Storage

- **Per-project:** `<project>/.daston/config.json`. Schema-versioned. Safe to commit or gitignore.
- **Global defaults:** `~/.daston/` (reserved for future shared settings).

Everything runs locally in your Node process. No network calls beyond `127.0.0.1`.

## Requirements

- Node.js 20 or newer.

## Development

```bash
git clone <this repo>
cd daston
npm install
npm run build        # builds dist/ (CLI + server + web)
npm link             # makes `daston` available globally from source
```

Dev loop with hot reload:

```bash
npm run build:web    # once, to produce dist/web/
npm run dev:server   # Hono + CLI via tsx
npm run dev:web      # Vite dev server with /api proxied to Hono
```

Checks:

```bash
npm test
npm run typecheck
npm run lint
```

## Stack

- **CLI** — Node + [Commander](https://github.com/tj/commander.js), bundled with [tsup](https://tsup.egoist.dev/).
- **Server** — [Hono](https://hono.dev/) on `@hono/node-server`. Serves the built SPA and a thin `/api/{theme,components,imported-components,prompt}` surface.
- **Frontend** — [Vite](https://vitejs.dev/) + React 19 + [TanStack Router](https://tanstack.com/router) (file-based). State via [Zustand](https://zustand.docs.pmnd.rs/).
- **Storage** — plain JSON on disk, schema-versioned from day one.

Source is organized by feature (`src/web/canvas/`, `src/web/sidebar/`, `src/web/layers/`, `src/web/toolbar/`, `src/web/previews/`), not by role — each surface owns its components, CSS, and tests.

## License

ISC.
