export type ConfigSchemaVersion = 1;

export interface ThemeConfig {
  version: ConfigSchemaVersion;
  fonts: { heading: string; body: string };
  colors: Record<string, string>;
}

// Stock components / primitives the canvas can preview and the user can add.
export type ComponentId =
  | 'button'
  | 'card'
  | 'ellipse'
  | 'landing'
  | 'rectangle'
  | 'table'
  | 'text'
  | 'triangle';

export type ImportedComponentsSchemaVersion = 1;
export type ImportedComponentSourceKind = 'library' | 'paste';
export type ImportedComponentCompileStatus = 'ready' | 'error';
export type ImportedLibraryComponentId = 'stats-card' | 'pricing-panel';

// Catalog entry for one stock component. Runtime values live in
// src/server/components-catalog.ts (this file is type-only).
export interface Component {
  id: ComponentId;
  label: string;
  description: string;
}

export interface ImportedLibraryComponent {
  id: ImportedLibraryComponentId;
  label: string;
  description: string;
}

export interface ImportedComponentDefinition {
  id: string;
  label: string;
  sourceKind: ImportedComponentSourceKind;
  libraryId: ImportedLibraryComponentId | null;
  sourceCode: string;
  compiledCode: string;
  compileStatus: ImportedComponentCompileStatus;
  compileError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportedComponentsConfig {
  version: ImportedComponentsSchemaVersion;
  definitions: ImportedComponentDefinition[];
}

export type CreateImportedComponentRequest =
  | {
      sourceKind: 'library';
      libraryId: ImportedLibraryComponentId;
      label?: string;
    }
  | {
      sourceKind: 'paste';
      label: string;
      sourceCode: string;
    };

export type UpdateImportedComponentRequest =
  | {
      label?: string;
      sourceKind?: 'library';
      libraryId: ImportedLibraryComponentId;
    }
  | {
      label?: string;
      sourceKind?: 'paste';
      sourceCode: string;
    };

// Discriminated union of prompt requests. Add new kinds as new members here;
// each kind carries only the inputs it needs. The server reads the current theme
// from disk, so it isn't part of the request.
export type PromptRequest = { kind: 'add-component'; component: ComponentId } | { kind: 'apply-theme' };

export interface PromptResponse {
  kind: PromptRequest['kind'];
  prompt: string;
}

export type AnalysisConfidence = 'high' | 'medium' | 'low';

export interface AnalysisSource {
  path: string;
  kind: 'package_json' | 'config' | 'router' | 'stylesheet' | 'tailwind' | 'font_file' | 'other';
}

export interface AnalysisFact<T = unknown> {
  id: string;
  value: T;
  confidence: AnalysisConfidence;
  sources: AnalysisSource[];
}

export type DetectedFrameworkKind = 'react' | 'next' | 'tanstack-router' | 'unknown';

export interface ThemeSeed {
  fonts: { heading: string | null; body: string | null };
  colors: Record<string, string>;
}

export interface ProjectAnalysis {
  projectRoot: string;
  facts: AnalysisFact[];
  framework: { kind: DetectedFrameworkKind; confidence: AnalysisConfidence };
  styling: {
    tailwind: boolean;
    cssVariables: boolean;
    confidence: AnalysisConfidence;
  };
  themeSeed: ThemeSeed;
}
