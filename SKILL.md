---
name: daston
description: Launch the local Daston design canvas and read or write the project's theme, stock components, imported components, and agent prompts via its HTTP API. Use when the user wants to visually edit their project's theme, inspect what the canvas has stored, or generate a prompt that applies the canvas state back to the real source tree.
---

# Daston

Daston is a local design canvas for a user's project. It runs entirely on `127.0.0.1`, persists state under `.daston/` inside the project, and exposes a small HTTP API that agents read and write. The CLI only exists to boot the server — everything else is HTTP.

## Install

Daston must be available as an executable. Check in this order:

```bash
daston --version           # globally installed
npx -y daston --version    # no install
```

If neither works, install it:

```bash
npm install -g daston                  # preferred for agent use
npm install --save-dev daston          # inside the user's project
```

## Quick start

```bash
daston
# Daston canvas ready at http://127.0.0.1:3847/
# Project: /path/to/app
# Press Ctrl+C to stop
```

Running `daston` with no arguments resolves the target app, seeds `.daston/config.json` on first boot if missing, picks a free port, starts the server, and opens the canvas in the user's default browser.

Flags:

| Flag | Effect |
|---|---|
| `--project <path>` | Target a specific app directory (use this in monorepos). |
| `--port <number>` | Pin a port instead of the default dynamic pick. |
| `--no-open` | Print the URL but do not auto-open the browser. Use this when running Daston as a background process. |

Extract the URL from stdout with a regex: `http://127\.0\.0\.1:\d+/`. Do not hardcode the port. If the user already has a Daston server running for this project, reuse its URL instead of starting another.

## HTTP API

Every resource the canvas works with is available as JSON over HTTP at the URL printed by `daston`. In the examples below, replace `$URL` with that value.

### Theme — `/api/theme`

```bash
curl $URL/api/theme
# => { "version": 1, "fonts": { "heading": ..., "body": ... }, "colors": {...} }

curl -X PATCH $URL/api/theme \
  -H "content-type: application/json" \
  -d '{"colors":{"brand":"#ff6a3d"}}'

curl -X PUT $URL/api/theme \
  -H "content-type: application/json" \
  -d '{"version":1,"fonts":{...},"colors":{...}}'
```

`PATCH` merges at the fonts / colors level (colors merge by key); `PUT` replaces the whole theme. Invalid payloads return 400.

### Stock components — `/api/components`

```bash
curl $URL/api/components           # full catalog
curl $URL/api/components/button    # single entry
```

Read-only. Current stock component ids: `button`, `card`, `ellipse`, `landing`, `rectangle`, `table`, `text`, `triangle`.

### Imported components — `/api/imported-components`

Per-project user components, stored in `.daston/imported-components.json`.

```bash
curl $URL/api/imported-components              # { definitions: [...] }
curl $URL/api/imported-components/library      # catalog of importable library sources
curl $URL/api/imported-components/:id          # single definition
curl $URL/api/imported-components/:id/preview  # standalone HTML preview for the canvas
```

Create from the built-in library (fetch `/library` first to discover valid `libraryId` values):

```bash
curl -X POST $URL/api/imported-components \
  -H "content-type: application/json" \
  -d '{"sourceKind":"library","libraryId":"<id>"}'
```

Create from pasted TSX source:

```bash
curl -X POST $URL/api/imported-components \
  -H "content-type: application/json" \
  -d '{"sourceKind":"paste","label":"My Button","sourceCode":"export default ..."}'
```

Update, delete, or re-compile:

```bash
curl -X PUT    $URL/api/imported-components/:id -d '...'
curl -X DELETE $URL/api/imported-components/:id
curl -X POST   $URL/api/imported-components/:id/revalidate
```

### Project analysis — `/api/project-analysis`

```bash
curl $URL/api/project-analysis
# => framework, styling (tailwind / css variables), detected fonts, theme seed
```

Read-only. Useful when deciding whether the host project uses Tailwind vs. CSS variables before generating edits.

### Prompts — `/api/prompt`

```bash
curl -X POST $URL/api/prompt \
  -H "content-type: application/json" \
  -d '{"kind":"apply-theme"}'

curl -X POST $URL/api/prompt \
  -H "content-type: application/json" \
  -d '{"kind":"add-component","component":"card"}'
```

Returns `{ kind, prompt }`. Hand the `prompt` string back to the user's coding agent (or act on it yourself) to actually edit the project source.

## Agent rules

- Daston never edits the host app's source tree. It only manages `.daston/` and returns prompts from `POST /api/prompt`. Use that endpoint to generate change instructions; apply them as a separate step.
- Always read the URL from Daston's stdout — port is dynamic.
- Before creating an imported component from the library, fetch `/api/imported-components/library` so you use a valid `libraryId`.
- If `/api/theme` still matches the seed returned by `/api/project-analysis`, the user hasn't touched the canvas yet. Ask them to tweak it before you generate prompts.
- Prefer reading `/api/theme` and `/api/components` over inferring state from the filesystem — the canvas is the source of truth while it is running.
