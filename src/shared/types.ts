export type ConfigSchemaVersion = 1;

export interface ThemeConfig {
  version: ConfigSchemaVersion;
  fonts: { heading: string; body: string };
  colors: Record<string, string>;
}

// Stock components the canvas can preview and the user can "Add".
export type ComponentId = 'button' | 'card' | 'table' | 'landing';

// Catalog entry for one stock component. Runtime values live in
// src/server/components-catalog.ts (this file is type-only).
export interface Component {
  id: ComponentId;
  label: string;
  description: string;
}

// Discriminated union of prompt requests. Add new kinds as new members here;
// each kind carries only the inputs it needs. The server reads the current theme
// from disk, so it isn't part of the request.
export type PromptRequest = { kind: 'add-component'; component: ComponentId } | { kind: 'apply-theme' };

export interface PromptResponse {
  kind: PromptRequest['kind'];
  prompt: string;
}
