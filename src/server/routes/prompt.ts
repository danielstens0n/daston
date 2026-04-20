import { Hono } from 'hono';
import type { PromptRequest } from '../../shared/types.ts';
import { isComponentId } from '../components-catalog.ts';
import { renderPromptResponse } from '../prompt.ts';
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
    const response = renderPromptResponse(request, theme);
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
