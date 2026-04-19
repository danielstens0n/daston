import { Hono } from 'hono';
import type {
  CreateImportedComponentRequest,
  ImportedComponentDefinition,
  ImportedLibraryComponentId,
  UpdateImportedComponentRequest,
} from '../../shared/types.ts';
import {
  compileImportedComponent,
  formatImportedComponentCompileError,
} from '../imported-components-compiler.ts';
import { getImportedLibraryComponent, IMPORTED_LIBRARY_COMPONENTS } from '../imported-components-library.ts';
import {
  readImportedComponentsConfig,
  writeImportedComponentsConfig,
} from '../imported-components-storage.ts';

export interface ImportedComponentsRoutesOptions {
  projectRoot: string;
}

export function createImportedComponentsRoutes({ projectRoot }: ImportedComponentsRoutesOptions): Hono {
  const router = new Hono();

  router.get('/library', (c) => c.json({ components: IMPORTED_LIBRARY_COMPONENTS }));

  router.get('/', async (c) => {
    const config = await readImportedComponentsConfig(projectRoot);
    return c.json({ definitions: config.definitions });
  });

  router.get('/:id', async (c) => {
    const definition = await findDefinition(projectRoot, c.req.param('id'));
    if (!definition) return c.json({ error: 'unknown imported component' }, 404);
    return c.json(definition);
  });

  router.post('/', async (c) => {
    const body = await c.req.json().catch(() => null);
    const request = parseCreateImportedComponentRequest(body);
    if (!request) return c.json({ error: 'invalid imported component payload' }, 400);

    const config = await readImportedComponentsConfig(projectRoot);
    const source = resolveDefinitionSource(request);
    if (!source) return c.json({ error: 'unknown library component' }, 400);

    const compiled = await compileImportedComponent(source.sourceCode).then(
      (compiledCode) => ({ ok: true as const, compiledCode }),
      (error: unknown) => ({ ok: false as const, error: formatImportedComponentCompileError(error) }),
    );
    if (!compiled.ok) return c.json({ error: compiled.error }, 400);

    const now = new Date().toISOString();
    const definition: ImportedComponentDefinition = {
      id: nextImportedDefinitionId(config.definitions),
      label: source.label,
      sourceKind: source.sourceKind,
      libraryId: source.libraryId,
      sourceCode: source.sourceCode,
      compiledCode: compiled.compiledCode,
      compileStatus: 'ready',
      compileError: null,
      createdAt: now,
      updatedAt: now,
    };

    await writeImportedComponentsConfig(projectRoot, {
      ...config,
      definitions: [...config.definitions, definition],
    });

    return c.json(definition, 201);
  });

  router.put('/:id', async (c) => {
    const body = await c.req.json().catch(() => null);
    const request = parseUpdateImportedComponentRequest(body);
    if (!request) return c.json({ error: 'invalid imported component payload' }, 400);

    const config = await readImportedComponentsConfig(projectRoot);
    const index = config.definitions.findIndex((definition) => definition.id === c.req.param('id'));
    if (index < 0) return c.json({ error: 'unknown imported component' }, 404);

    const current = config.definitions[index];
    if (!current) return c.json({ error: 'unknown imported component' }, 404);

    const source = resolveUpdatedDefinitionSource(current, request);
    if (!source) return c.json({ error: 'unknown library component' }, 400);

    const compiled = await compileImportedComponent(source.sourceCode).then(
      (compiledCode) => ({ ok: true as const, compiledCode }),
      (error: unknown) => ({ ok: false as const, error: formatImportedComponentCompileError(error) }),
    );
    if (!compiled.ok) return c.json({ error: compiled.error }, 400);

    const next: ImportedComponentDefinition = {
      ...current,
      label: source.label,
      sourceKind: source.sourceKind,
      libraryId: source.libraryId,
      sourceCode: source.sourceCode,
      compiledCode: compiled.compiledCode,
      compileStatus: 'ready',
      compileError: null,
      updatedAt: new Date().toISOString(),
    };
    const definitions = config.definitions.slice();
    definitions[index] = next;

    await writeImportedComponentsConfig(projectRoot, {
      ...config,
      definitions,
    });

    return c.json(next);
  });

  router.delete('/:id', async (c) => {
    const config = await readImportedComponentsConfig(projectRoot);
    const definitions = config.definitions.filter((definition) => definition.id !== c.req.param('id'));
    if (definitions.length === config.definitions.length)
      return c.json({ error: 'unknown imported component' }, 404);
    await writeImportedComponentsConfig(projectRoot, {
      ...config,
      definitions,
    });
    return c.body(null, 204);
  });

  router.post('/:id/revalidate', async (c) => {
    const config = await readImportedComponentsConfig(projectRoot);
    const index = config.definitions.findIndex((definition) => definition.id === c.req.param('id'));
    if (index < 0) return c.json({ error: 'unknown imported component' }, 404);
    const current = config.definitions[index];
    if (!current) return c.json({ error: 'unknown imported component' }, 404);

    const compiled = await compileImportedComponent(current.sourceCode).then(
      (compiledCode) => ({ ok: true as const, compiledCode }),
      (error: unknown) => ({ ok: false as const, error: formatImportedComponentCompileError(error) }),
    );

    const next: ImportedComponentDefinition = compiled.ok
      ? {
          ...current,
          compiledCode: compiled.compiledCode,
          compileStatus: 'ready',
          compileError: null,
          updatedAt: new Date().toISOString(),
        }
      : {
          ...current,
          compiledCode: '',
          compileStatus: 'error',
          compileError: compiled.error,
          updatedAt: new Date().toISOString(),
        };

    const definitions = config.definitions.slice();
    definitions[index] = next;
    await writeImportedComponentsConfig(projectRoot, {
      ...config,
      definitions,
    });

    return c.json(next);
  });

  router.get('/:id/preview', async (c) => {
    const definition = await findDefinition(projectRoot, c.req.param('id'));
    if (!definition) return c.html(renderPreviewHtml(null, 'Imported component not found.'), 404);
    const error =
      definition.compileStatus === 'error'
        ? (definition.compileError ?? 'This imported component failed to compile.')
        : null;
    return c.html(renderPreviewHtml(definition.compiledCode, error));
  });

  return router;
}

async function findDefinition(projectRoot: string, id: string): Promise<ImportedComponentDefinition | null> {
  const config = await readImportedComponentsConfig(projectRoot);
  return config.definitions.find((definition) => definition.id === id) ?? null;
}

function parseCreateImportedComponentRequest(input: unknown): CreateImportedComponentRequest | null {
  if (!isObject(input) || typeof input.sourceKind !== 'string') return null;
  if (input.sourceKind === 'library') {
    if (!isImportedLibraryComponentId(input.libraryId)) return null;
    if ('label' in input && typeof input.label !== 'string') return null;
    const base = { sourceKind: 'library' as const, libraryId: input.libraryId };
    return typeof input.label === 'string' ? { ...base, label: input.label } : base;
  }
  if (input.sourceKind === 'paste') {
    if (typeof input.label !== 'string' || typeof input.sourceCode !== 'string') return null;
    return {
      sourceKind: 'paste',
      label: input.label,
      sourceCode: input.sourceCode,
    };
  }
  return null;
}

function parseUpdateImportedComponentRequest(input: unknown): UpdateImportedComponentRequest | null {
  if (!isObject(input)) return null;
  if ('label' in input && input.label !== undefined && typeof input.label !== 'string') return null;
  if ('sourceCode' in input) {
    if (typeof input.sourceCode !== 'string') return null;
    const base = { sourceKind: 'paste' as const, sourceCode: input.sourceCode };
    return typeof input.label === 'string' ? { ...base, label: input.label } : base;
  }
  if ('libraryId' in input) {
    if (!isImportedLibraryComponentId(input.libraryId)) return null;
    const base = { sourceKind: 'library' as const, libraryId: input.libraryId };
    return typeof input.label === 'string' ? { ...base, label: input.label } : base;
  }
  return null;
}

function resolveDefinitionSource(request: CreateImportedComponentRequest) {
  if (request.sourceKind === 'paste') {
    return {
      label: request.label.trim(),
      sourceKind: 'paste' as const,
      libraryId: null,
      sourceCode: request.sourceCode,
    };
  }
  const component = getImportedLibraryComponent(request.libraryId);
  if (!component) return null;
  return {
    label: request.label?.trim() || component.label,
    sourceKind: 'library' as const,
    libraryId: component.id,
    sourceCode: component.sourceCode,
  };
}

function resolveUpdatedDefinitionSource(
  current: ImportedComponentDefinition,
  request: UpdateImportedComponentRequest,
) {
  if ('sourceCode' in request) {
    return {
      label: request.label?.trim() || current.label,
      sourceKind: 'paste' as const,
      libraryId: null,
      sourceCode: request.sourceCode,
    };
  }
  const component = getImportedLibraryComponent(request.libraryId);
  if (!component) return null;
  return {
    label: request.label?.trim() || component.label,
    sourceKind: 'library' as const,
    libraryId: component.id,
    sourceCode: component.sourceCode,
  };
}

function nextImportedDefinitionId(definitions: ImportedComponentDefinition[]): string {
  const next = definitions.reduce((max, definition) => {
    const match = /^imported-def-(\d+)$/.exec(definition.id);
    const value = match ? Number.parseInt(match[1] ?? '', 10) : 0;
    return Math.max(max, Number.isNaN(value) ? 0 : value);
  }, 0);
  return `imported-def-${next + 1}`;
}

function renderPreviewHtml(compiledCode: string | null, error: string | null): string {
  const escapedBundle = (compiledCode ?? '').replaceAll('</script>', '<\\/script>');
  const escapedError = error ? JSON.stringify(error) : 'null';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #root {
        width: 100%;
        height: 100%;
        margin: 0;
      }

      body {
        overflow: hidden;
        background: transparent;
      }

      #root {
        box-sizing: border-box;
      }

      .preview-error {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 16px;
        border-radius: 14px;
        border: 1px solid #fecaca;
        background: #fff1f2;
        color: #881337;
        font: 13px/1.5 Inter, system-ui, sans-serif;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const initialError = ${escapedError};
      const root = document.getElementById('root');

      function showError(message) {
        if (!root) return;
        root.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'preview-error';
        box.textContent = message;
        root.appendChild(box);
      }

      if (initialError) {
        showError(initialError);
      }

      window.addEventListener('error', (event) => {
        if (event.error instanceof Error) {
          showError(event.error.message);
          return;
        }
        if (typeof event.message === 'string' && event.message.length > 0) {
          showError(event.message);
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
        if (reason) showError(reason);
      });
    </script>
    ${error ? '' : `<script>${escapedBundle}</script>`}
  </body>
</html>`;
}

function isImportedLibraryComponentId(value: unknown): value is ImportedLibraryComponentId {
  return IMPORTED_LIBRARY_COMPONENTS.some((component) => component.id === value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
