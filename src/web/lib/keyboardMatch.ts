// Declarative keyboard shortcut helpers. The hook in
// `useKeyboardShortcuts.ts` pairs a list of `Shortcut`s with a single
// window-level `keydown` listener; everything here is pure so it can be
// unit-tested without a DOM.

export type Shortcut = {
  // Combo syntax: plus-separated tokens, lowercase. Modifier tokens may
  // appear in any order; the final token is the key. Recognized tokens:
  //   - `mod`   → metaKey on macOS, ctrlKey elsewhere (both accepted)
  //   - `shift` → shiftKey
  //   - `alt`   → altKey / optionKey
  // The key itself is matched case-insensitively against `event.key` with
  // aliases `delete` → `"Delete"` and `backspace` → `"Backspace"`.
  combo: string;
  run: () => void;
};

type ParsedCombo = {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
};

function parseCombo(combo: string): ParsedCombo {
  const tokens = combo.toLowerCase().split('+');
  const modifiers = new Set(tokens.slice(0, -1));
  const key = tokens[tokens.length - 1] ?? '';
  return {
    mod: modifiers.has('mod'),
    shift: modifiers.has('shift'),
    alt: modifiers.has('alt'),
    key,
  };
}

// Normalize `event.key` so combo strings can spell out friendly aliases.
// `event.key` preserves case (Shift+a → `"A"`), so we lowercase before
// comparing.
function normalizeKey(eventKey: string): string {
  return eventKey.toLowerCase();
}

export function matchCombo(event: KeyboardEvent, combo: string): boolean {
  // Ignore key-repeats (held keys should not spam destructive shortcuts)
  // and IME composition (the composed-text key events are intermediate).
  if (event.repeat || event.isComposing) return false;

  const parsed = parseCombo(combo);
  const mod = event.metaKey || event.ctrlKey;
  if (mod !== parsed.mod) return false;
  if (event.shiftKey !== parsed.shift) return false;
  if (event.altKey !== parsed.alt) return false;
  return normalizeKey(event.key) === parsed.key;
}

// True when the event originated from a field where the user is plausibly
// typing. The window-level shortcut listener uses this as an all-or-nothing
// guard: if the user is in a text input we do not preventDefault, so the
// browser's own bindings (including ⌘D → bookmark) stay in effect — that
// matches web convention and keeps our guard a single line.
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches('input, textarea, [contenteditable=""], [contenteditable="true"]');
}

// Surfaces that should keep canvas-level shortcuts from firing while the user
// interacts with them (e.g. modal shells where focus may land on a button).
export function isShortcutBlockTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('[data-canvas-shortcuts-block]'));
}
