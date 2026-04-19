export type ContextMenuItem =
  | {
      kind: 'action';
      label: string;
      shortcut?: string;
      disabled?: boolean;
      onSelect: () => void;
    }
  | { kind: 'separator' };
