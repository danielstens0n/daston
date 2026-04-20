import type { ComponentId, PromptRequest, PromptResponse, ThemeConfig } from '../shared/types.ts';
import { getComponent } from './components-catalog.ts';

export function renderPromptResponse(request: PromptRequest, theme: ThemeConfig): PromptResponse {
  return { kind: request.kind, prompt: renderPrompt(request, theme) };
}

export function renderPrompt(request: PromptRequest, theme: ThemeConfig): string {
  switch (request.kind) {
    case 'add-component':
      return renderAddComponent(request.component, theme);
    case 'apply-theme':
      return renderApplyTheme(theme);
  }
}

function renderAddComponent(component: ComponentId, theme: ThemeConfig): string {
  const componentEntry = getComponent(component);
  if (!componentEntry) {
    throw new Error(`Unknown component id: ${component}`);
  }
  const label = componentEntry.label.toLowerCase();
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

export function formatTheme(theme: ThemeConfig): string {
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
