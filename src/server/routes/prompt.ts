import { Hono } from 'hono';
import type { ComponentId, PromptRequest, PromptResponse, ThemeConfig } from '../../shared/types.ts';
import { getComponent, isComponentId } from '../components-catalog.ts';
import { readThemeConfig } from '../storage.ts';

// Generates copy-pasteable prompts for the user's coding agent.
// Single endpoint discriminated by `kind` in the body — see PromptRequest in shared/types.ts.

export interface PromptRoutesOptions {
  projectRoot: string;
}

export function createPromptRoutes({ projectRoot }: PromptRoutesOptions): Hono {
  const router = new Hono();

  router.post('/', async (c) => {
    // .catch(() => null) so invalid JSON returns 400 instead of bubbling to a 500.
    const body = await c.req.json().catch(() => null);
    const request = parsePromptRequest(body);
    if (!request) return c.json({ error: 'invalid prompt request' }, 400);

    // Theme is the source of truth on disk; always read fresh so prompts reflect the latest state.
    const theme = await readThemeConfig(projectRoot);
    const prompt = renderPrompt(request, theme);

    const response: PromptResponse = { kind: request.kind, prompt };
    return c.json(response);
  });

  return router;
}

function parsePromptRequest(input: unknown): PromptRequest | null {
  if (!isObject(input)) return null;
  switch (input.kind) {
    case 'add-component':
      if (!isComponentId(input.component)) return null;
      return { kind: 'add-component', component: input.component };
    case 'apply-theme':
      return { kind: 'apply-theme' };
    default:
      return null;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function renderPrompt(request: PromptRequest, theme: ThemeConfig): string {
  switch (request.kind) {
    case 'add-component':
      return renderAddComponent(request.component, theme);
    case 'apply-theme':
      return renderApplyTheme(theme);
  }
}

function renderAddComponent(component: ComponentId, theme: ThemeConfig): string {
  // Lowercase for inline use ("a button component" / "a landing page component").
  // The `?? component` fallback is dead code (parsePromptRequest already validated
  // the id via isComponentId), but it lets us avoid a non-null assertion.
  const label = (getComponent(component)?.label ?? component).toLowerCase();
  return [
    `Please add a ${label} component to my project, styled with this theme:`,
    '',
    formatTheme(theme),
    '',
    "Match my project's existing component conventions (framework, file layout, styling approach) and place the file somewhere that fits the current structure.",
  ].join('\n');
}

function renderApplyTheme(theme: ThemeConfig): string {
  return [
    'Please update my project to use the following design theme:',
    '',
    formatTheme(theme),
    '',
    "Apply these via the project's existing theming mechanism (CSS variables, Tailwind config, design tokens — whatever's already in use). Don't change component logic, only styling.",
  ].join('\n');
}

function formatTheme(theme: ThemeConfig): string {
  // Sorted for stable output — easier to diff prompts during dev.
  const colorLines = Object.entries(theme.colors)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  - ${name}: ${value}`);
  const colorsBlock = colorLines.length > 0 ? colorLines.join('\n') : '  (none configured)';
  return [
    `- Heading font: ${theme.fonts.heading}`,
    `- Body font: ${theme.fonts.body}`,
    '- Colors:',
    colorsBlock,
  ].join('\n');
}
