import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ENTRY_MODULE_PATH = 'entry-point';
const USER_MODULE_PATH = 'user-component';
const PREVIEW_RUNTIME_PATH = 'preview-runtime';
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ALLOWED_USER_IMPORTS = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  PREVIEW_RUNTIME_PATH,
]);

const PREVIEW_RUNTIME_SOURCE = `import React from 'react';

class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  render() {
    if (this.state.error) {
      return React.createElement(
        'div',
        {
          style: {
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            padding: 16,
            borderRadius: 14,
            border: '1px solid #fecaca',
            background: '#fff1f2',
            color: '#881337',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          },
        },
        this.state.error,
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }) {
  return React.createElement(PreviewErrorBoundary, null, children);
}
`;

const ENTRY_SOURCE = `import React from 'react';
import { createRoot } from 'react-dom/client';
import ImportedComponent from '${USER_MODULE_PATH}';
import { ErrorBoundary } from '${PREVIEW_RUNTIME_PATH}';

const mountNode = document.getElementById('root');

if (!mountNode) {
  throw new Error('Preview root element is missing.');
}

const root = createRoot(mountNode);

root.render(
  <ErrorBoundary>
    <ImportedComponent />
  </ErrorBoundary>,
);
`;

export async function compileImportedComponent(sourceCode: string): Promise<string> {
  const result = await build({
    absWorkingDir: PACKAGE_ROOT,
    bundle: true,
    entryPoints: [ENTRY_MODULE_PATH],
    format: 'iife',
    jsx: 'automatic',
    platform: 'browser',
    target: ['es2022'],
    write: false,
    plugins: [
      {
        name: 'daston-imported-component',
        setup(pluginBuild) {
          pluginBuild.onResolve({ filter: /^entry-point$/ }, () => ({
            path: ENTRY_MODULE_PATH,
            namespace: 'daston-virtual',
          }));

          pluginBuild.onResolve({ filter: /^user-component$/ }, () => ({
            path: USER_MODULE_PATH,
            namespace: 'daston-virtual',
          }));

          pluginBuild.onResolve({ filter: /^preview-runtime$/ }, () => ({
            path: PREVIEW_RUNTIME_PATH,
            namespace: 'daston-virtual',
          }));

          pluginBuild.onResolve({ filter: /.*/ }, (args) => {
            if (args.importer !== USER_MODULE_PATH || args.namespace !== 'daston-virtual') return null;
            if (ALLOWED_USER_IMPORTS.has(args.path)) return null;
            return {
              errors: [
                {
                  text: `Unsupported import "${args.path}". Imported components may only import React.`,
                },
              ],
            };
          });

          pluginBuild.onLoad({ filter: /.*/, namespace: 'daston-virtual' }, (args) => {
            const resolveDir = PACKAGE_ROOT;
            switch (args.path) {
              case ENTRY_MODULE_PATH:
                return { contents: ENTRY_SOURCE, loader: 'tsx', resolveDir };
              case USER_MODULE_PATH:
                return { contents: sourceCode, loader: 'tsx', resolveDir };
              case PREVIEW_RUNTIME_PATH:
                return { contents: PREVIEW_RUNTIME_SOURCE, loader: 'tsx', resolveDir };
              default:
                return null;
            }
          });
        },
      },
    ],
  });

  const output = result.outputFiles[0];
  if (!output) {
    throw new Error('Compilation finished without a browser bundle.');
  }
  return output.text;
}

export function formatImportedComponentCompileError(error: unknown): string {
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const errors = (error as { errors?: Array<{ text?: string }> }).errors ?? [];
    const message = errors
      .map((entry) => entry.text)
      .filter((text): text is string => typeof text === 'string' && text.length > 0)
      .join('\n');
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Unable to compile imported component.';
}
