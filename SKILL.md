---
name: daston
description: Start the local Daston canvas, inspect the resolved host project, and generate apply-theme or add-component prompts. Use when working on a project's visual theme, extracting styling context, or handing design changes back to a coding agent.
---

# Daston

## Purpose

Use Daston when the user wants to inspect a project's theme context, open the local design canvas, or generate a prompt that another coding agent can apply to the real source tree.

## Workflow

1. Resolve the target project first:

```bash
daston inspect --json
```

2. If resolution is ambiguous, rerun with an explicit project path:

```bash
daston inspect --project path/to/app --json
```

3. Initialize config if the project has not been set up yet:

```bash
daston init --project path/to/app
```

4. Start the canvas when the user wants a visual editing flow:

```bash
daston start --project path/to/app
```

5. Generate prompts after the theme or canvas state is ready:

```bash
daston prompt apply-theme --project path/to/app
daston prompt add-component --project path/to/app --component button
```

## Agent rules

- Prefer `--json` on `daston inspect` when you need structured resolution, framework, styling, and theme data.
- If `inspect --json` returns `ok: false` with `kind: "ambiguous"`, do not guess. Ask for `--project` or pick a path the user already specified.
- `daston` only manages `.daston/config.json` and the local canvas. It does not edit the host app's source files directly.
- Use prompt commands to hand changes back to the coding agent instead of inventing prompt text from scratch.
- Current stock component ids for `add-component`: `button`, `card`, `ellipse`, `landing`, `rectangle`, `table`, `text`, `triangle`.

## Output surfaces

- `daston inspect --json` returns target resolution, config presence, project analysis, and the resolved theme.
- `daston prompt ... --json` returns the same project context plus the generated prompt payload.
- `daston prompt ...` without `--json` prints only the prompt text, ready to paste into an agent.
