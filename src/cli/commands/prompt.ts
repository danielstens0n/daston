import { COMPONENTS, isComponentId } from '../../server/components-catalog.ts';
import { renderPromptResponse } from '../../server/prompt.ts';
import type { PromptRequest } from '../../shared/types.ts';
import { writeJson } from '../output.ts';
import { loadProjectContextOrReport } from '../project-context.ts';

interface PromptCommandOptions {
  project?: string | undefined;
  json?: boolean | undefined;
}

export type PromptApplyThemeOptions = PromptCommandOptions;

export interface PromptAddComponentOptions extends PromptCommandOptions {
  component: string;
}

export async function promptApplyTheme(opts: PromptApplyThemeOptions): Promise<void> {
  await emitPrompt({ kind: 'apply-theme' }, opts);
}

export async function promptAddComponent(opts: PromptAddComponentOptions): Promise<void> {
  if (!isComponentId(opts.component)) {
    const message = `Unknown component id "${opts.component}". Expected one of: ${COMPONENTS.map((c) => c.id).join(', ')}`;
    if (opts.json) {
      writeJson({ ok: false, kind: 'invalid_component', message });
    } else {
      process.stderr.write(`${message}\n`);
    }
    process.exitCode = 1;
    return;
  }

  await emitPrompt({ kind: 'add-component', component: opts.component }, opts);
}

async function emitPrompt(request: PromptRequest, opts: PromptCommandOptions): Promise<void> {
  const context = await loadProjectContextOrReport(opts);
  if (!context) return;
  const prompt = renderPromptResponse(request, context.theme);
  if (opts.json) {
    writeJson({ ok: true, ...context, prompt });
    return;
  }

  process.stdout.write(`${prompt.prompt}\n`);
}
