# TODO

Lightweight, Linear-inspired issue tracker for `daston`. Single file, git-ignored — local to your checkout.

## Labels

- `bug` — something broken or incorrect
- `feature` — new user-facing capability
- `improvement` — refinement of existing behavior
- `infra` — tooling, build, CI, release
- `docs` — documentation
- `chore` — cleanup, dependency bumps, maintenance

Multiple labels are fine (comma-separated).

## Conventions

- Each issue is an H3 with an ID and title: `### DAS-1 — Short title`
- Issues live under one of three H2 status sections: **Backlog**, **In Progress**, **Done**
- Every issue has `**Labels:**` and `**Description:**`. `**Comments:**` is optional and grows over time.
- Comments are dated bullets in ISO format: `- _2026-04-19_: note`
- To open a new issue, bump the **Next ID** counter below, then add the issue under **Backlog**.
- Move an issue between sections as its status changes; keep its ID stable.

**Next ID:** DAS-16

---

## Backlog

### DAS-15 — Right-click context menu on components

**Labels:** feature

**Description:** Right-clicking a component on the canvas should open a custom dropdown context menu (suppressing the native browser menu via `event.preventDefault()` on `contextmenu`) with the standard canvas actions: Copy, Cut, Paste, Duplicate, Delete. Menu items should map to the existing store actions (`copy` / `cut` / `paste` / `duplicate` / `remove` in `src/web/state/editor.ts`) that already back the keyboard shortcuts registered in `src/web/keyboard/useKeyboardShortcuts.ts`, so behavior stays consistent between mouse and keyboard. Right-clicking an unselected instance should select it first, then open the menu. The menu needs to be rendered in a portal with fixed positioning (same pattern as `NumberField`'s preset dropdown) so it escapes the canvas's pan/zoom transform, dismiss on outside click / Escape / scroll, and flip its anchor when it would overflow the viewport. Later passes can add entries like "Bring to front" / "Send to back" once z-ordering lands (see DAS-4).

### DAS-14 — Shared theme by default with per-instance opt-out toggle

**Labels:** feature

**Description:** Today every `ComponentInstance` carries its own copy of fill/border/shadow/text-color/layout props in `src/web/state/types.ts`, so editing one card in the sidebar only changes that card. Change the default behavior so all instances on the canvas share a single theme — editing fill/border/shadow/text colors on one component updates every other instance of the same type (and arguably across types, where the shared sections overlap). The shared values likely live alongside the existing theme config (`src/server/storage.ts` + `readThemeConfig`/`writeThemeConfig`) rather than per-instance, with `ComponentInstance` only storing position/size and any genuinely instance-local overrides.

Add a per-instance "Detach from theme" toggle, surfaced in the sidebar (probably as a header on each shared section in `src/web/sidebar/sections/` — Fill, Border, Shadow, TextColor). Toggling it copies the current shared value onto the instance and switches subsequent edits to be local. Toggling it back drops the override and re-syncs to the shared theme. Layout (width/height/position) stays per-instance regardless. Needs a storage migration (bump `SCHEMA_VERSION` in `storage.ts`) since existing `.daston/config.json` files won't have the shared theme block, and needs the sidebar selector hooks in `src/web/state/editor.ts` to read shared-vs-overridden values without re-rendering everything when one instance is edited.

### DAS-13 — `/daston` skill auto-boots server + web and pre-fills theme from project styles

**Labels:** feature

**Description:** Today `bin/daston.ts start` is stubbed and the `/daston` skill doesn't exist. Two pieces of behavior to ship together:

1. **Instant boot.** Invoking the `/daston` skill (or running `npx daston`) should pick available ports for both the Hono server and the Vite-built SPA, start them, and print/open the localhost URL — no flags, no manual port choice. `createServer({ projectRoot })` already takes a project root; `start` needs to wire it up against `process.cwd()`, serve `dist/web/` in production (the TODO already noted in CLAUDE.md), and fall back to the next free port if the default is taken. The skill itself lives outside this repo but should be specified here so the implementations stay in sync.
2. **Theme pre-fill from project styles.** When the skill is invoked, the host agent (Claude Code / Codex / OpenCode) should scan the user's project for existing styles and themes — Tailwind config, CSS custom properties, design-token files, shadcn theme, etc. — and seed `.daston/config.json` (via `writeThemeConfig`) so the canvas opens with the project's real fonts and colors instead of `defaultThemeConfig`. Needs a defined detection order (which file wins when multiple are present), a "detected" vs "user-edited" distinction so re-running the skill doesn't clobber manual tweaks, and a fallback to defaults when nothing is detected. The detection logic itself probably belongs in the agent skill rather than the CLI, but the CLI/server need an endpoint or import path the skill can write through.

### DAS-8 — System clipboard / cross-document paste

**Labels:** feature

**Description:** The current clipboard (`src/web/state/editor.ts#clipboard`) is in-memory only — pasting only works within the same browser tab, and reloading the page wipes the clipboard. Add a serialization format for `ComponentInstance` and write/read it via `navigator.clipboard` so users can copy between tabs, paste after reload, and potentially paste from other sources. Needs permission handling, a stable schema version on the serialized payload, and a fallback path when the browser rejects the async clipboard API.

### DAS-7 — Multi-select and marquee selection

**Labels:** feature

**Description:** Extend the editor store's `selectedId: string | null` to a `selectedIds: Set<string>` so the user can select multiple instances at once (shift-click to extend, drag-rectangle on empty canvas for marquee). Every action that acts on the selection — copy/cut/paste/duplicate/delete (`src/web/keyboard/useKeyboardShortcuts.ts`), sidebar rendering (`src/web/sidebar/Sidebar.tsx`), and `PreviewWrapper`'s selection outline — needs to handle a set instead of a single id. Paste still needs to cascade, but from the bounding box of the pasted group rather than a single `lastPasteId`.

### DAS-6 — Custom component import from the toolbar

**Labels:** feature

**Description:** Add a "+" button to the floating toolbar (`src/web/toolbar/CanvasToolbar.tsx`, with a new entry in `src/web/toolbar/catalog.ts`) that opens a picker for bringing non-stock components onto the canvas. Two intended sources: (1) a curated library like shadcn/ui, where the user picks from a list and the component is registered + previewed; (2) "paste custom code," where the user drops in a React component source and it gets rendered on the canvas. Needs design work on where the imported component definitions live (new store slice? new storage file under `.daston/`?), how they extend `ComponentId` / `ComponentInstance` without breaking the closed-union assumptions in CLAUDE.md, and how custom code is safely evaluated in the browser (sandboxing, dependency resolution for shadcn primitives, etc.). Likely prerequisite for treating daston as a real design tool rather than a fixed-catalog demo.

### DAS-5 — Implement preview bodies for the remaining stock components

**Labels:** feature

**Description:** Today `Card` is the only component with a rendered preview body; `button`, `table`, and `landing` exist in the catalog (`src/server/components-catalog.ts`) and in the floating toolbar (`src/web/toolbar/catalog.ts`) but their toolbar buttons are disabled. Grow `ComponentInstance` in `src/web/state/types.ts` from a single-member union into a real union, add a preview body per type under `src/web/previews/`, a per-type inspector under `src/web/sidebar/inspectors/`, a `PreviewBody` dispatch case in `src/web/routes/index.tsx`, a `renderInspector` case in `src/web/sidebar/Sidebar.tsx`, and an `addInstance` branch in `src/web/state/editor.ts`. Flip `enabled: true` and drop the "coming soon" tooltip in `src/web/toolbar/catalog.ts`. When the union reaches 2+ members, add the `default: const _: never = ...` branches flagged in CLAUDE.md.

### DAS-4 — Layers sidebar listing every canvas instance

**Labels:** feature

**Description:** Add a "Layers" panel (either a new left-side sidebar or a collapsible section on the existing right sidebar) that lists every `ComponentInstance` in the editor store. Each row shows the instance's type + id (and later a user-editable name), clicking a row selects the instance (reuses `useEditorStore.getState().select`), and the currently selected instance is highlighted with `--color-selection`. Later passes: drag to reorder (z-index), rename inline, delete from the row. Driven by `useInstanceIds()` so the layer list stays in sync without prop-drilling.

## In Progress

_(none)_

## Done

### DAS-1 — Figma-style keyboard shortcuts for components

**Labels:** feature

**Description:** Support common Figma shortcuts on the canvas for manipulating component instances: copy (⌘C), paste (⌘V), cut (⌘X), duplicate (⌘D), and delete (⌫ / Del). Shortcuts should act on the currently selected instance(s) and place duplicates at a small offset from the source, matching Figma's behavior. Needs to play nicely with focus — shortcuts should not fire while typing in sidebar inputs.

**Comments:**

- _2026-04-19_: Added `remove`/`duplicate`/`copy`/`cut`/`paste` actions on the editor store, an internal `clipboard` + `lastPasteId` for Figma-style paste cascade, and a declarative `useKeyboardShortcuts` hook wired into `CanvasRoute`. Focus guard bails out entirely when a sidebar input is focused so the browser keeps its defaults there. Multi-select, system clipboard, undo/redo, and ⌘D-repeats-last-transform are tracked as DAS-7..DAS-9 & DAS-11; arrow-key nudge shipped as DAS-10.

### DAS-10 — Arrow-key nudge for the selected instance

**Labels:** feature

**Description:** When the canvas has focus and an instance is selected, arrow keys should move the selection by 1px (and 10px with Shift held) — matching Figma/Sketch. Reuse `useKeyboardShortcuts` (`src/web/keyboard/useKeyboardShortcuts.ts`) with new `arrowup`/`arrowdown`/`arrowleft`/`arrowright` combos that call `useEditorStore.getState().move`. Respect the `isEditableTarget` guard so arrow keys in sidebar inputs still work normally.

**Comments:**

- _2026-04-19_: Implemented 1px / Shift+10px nudge and integration tests in `src/web/keyboard/useKeyboardShortcuts.test.tsx`.

### DAS-9 — Undo/redo history for canvas mutations

**Labels:** feature

**Description:** Add history tracking to the editor store so `⌘Z` / `⌘⇧Z` undo and redo canvas mutations (add, move, resize, updateProps, remove, duplicate, cut, paste). Likely shape: a `past` / `future` stack of state snapshots (or diffs), cleared on major state resets. Register the `mod+z` and `mod+shift+z` shortcuts via `useKeyboardShortcuts`. Consider which mutations should coalesce (e.g. consecutive moves) so a drag doesn't produce dozens of undo entries.

**Comments:**

- _2026-04-19_: When history exists, wire undo/redo only through this issue (`mod+z` / `mod+shift+z` in `useKeyboardShortcuts`) — no separate keyboard-only ticket.
- _2026-04-19_: Added snapshot-based `past` / `future` history in `src/web/state/editor.ts`, plus drag/resize batching so pointer gestures collapse to one undo step instead of one entry per frame.

### DAS-2 — Replace number field arrow pickers with click-to-open dropdowns

**Labels:** improvement

**Description:** `src/web/sidebar/fields/NumberField.tsx` currently renders a native `<input type="number">`, which shows browser spinner arrows. Match Figma's behavior instead: on click, open a dropdown of sensible preset values for the field (with the current value highlighted). Typing should still work for arbitrary values. Applies everywhere `NumberField` is used via the shared sections (Layout, Border, Shadow).

**Comments:**

- _2026-04-19_: Implemented `type="text"` + range-derived presets, portal menu with fixed positioning, `flushSync` on Escape-before-blur so draft reset isn’t overwritten by `onBlur`.

### DAS-3 — Standardize highlight/selection color across the app

**Labels:** improvement

**Description:** Use the light blue selection color from `PreviewWrapper` (`--color-selection` / `#60a5fa` in `src/web/tokens.css`) as the canonical highlight color everywhere in the UI — sidebar active states, focused inputs, hover affordances, and any other accent treatments. Audit existing styles and replace ad-hoc blues/grays with the shared token so the whole app shares one visual language for "selected" and "active."

**Comments:**

- _2026-04-19_: Added `--color-chrome-focus` (alias of `--color-selection`), documented chrome vs preview tokens in `tokens.css`, unified sidebar field focus with canvas/dialog chrome, `::selection` styling, `src/shared/chrome-colors.ts` for TS/server hex aligned with tokens, and replaced hardcoded blues in `editor.ts` + `imported-components-library.ts`.
