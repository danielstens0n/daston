import { useEffect } from 'react';
import { useEditorStore } from '../state/editor.ts';
import { isEditableTarget, matchCombo, type Shortcut } from './match.ts';

// Canvas-level keyboard shortcuts. Mounted once from `CanvasRoute`.
// The shortcut table is declared inside the hook so each `run` can call
// `useEditorStore.getState()` directly — adding a new shortcut is a one-line
// entry in the array rather than another branch in a growing if-ladder.
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        combo: 'mod+c',
        run: () => {
          const { selectedId, copy } = useEditorStore.getState();
          if (selectedId) copy(selectedId);
        },
      },
      {
        combo: 'mod+x',
        run: () => {
          const { selectedId, cut } = useEditorStore.getState();
          if (selectedId) cut(selectedId);
        },
      },
      {
        combo: 'mod+v',
        run: () => {
          useEditorStore.getState().paste();
        },
      },
      {
        combo: 'mod+d',
        run: () => {
          const { selectedId, duplicate } = useEditorStore.getState();
          if (selectedId) duplicate(selectedId);
        },
      },
      // Delete and Backspace both map to the same action — matches Figma
      // and covers the fact that the Mac "delete" key reports as Backspace.
      {
        combo: 'delete',
        run: () => {
          const { selectedId, remove } = useEditorStore.getState();
          if (selectedId) remove(selectedId);
        },
      },
      {
        combo: 'backspace',
        run: () => {
          const { selectedId, remove } = useEditorStore.getState();
          if (selectedId) remove(selectedId);
        },
      },
    ];

    function handleKeyDown(event: KeyboardEvent) {
      // Let other handlers (e.g. a future modal) claim the event first.
      if (event.defaultPrevented) return;
      // All-or-nothing focus guard: while a sidebar input is focused the
      // browser owns every key, including ⌘D (which would bookmark the
      // page). That matches normal web behavior for focused inputs.
      if (isEditableTarget(event.target)) return;

      const match = shortcuts.find((shortcut) => matchCombo(event, shortcut.combo));
      if (!match) return;

      event.preventDefault();
      match.run();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
