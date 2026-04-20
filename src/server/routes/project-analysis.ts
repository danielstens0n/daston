import { Hono } from 'hono';
import { runProjectAnalysis } from '../../project-analysis/run.ts';

export interface ProjectAnalysisRoutesOptions {
  projectRoot: string;
}

export function createProjectAnalysisRoutes({ projectRoot }: ProjectAnalysisRoutesOptions): Hono {
  const router = new Hono();

  router.get('/', async (c) => {
    const analysis = await runProjectAnalysis(projectRoot);
    return c.json(analysis);
  });

  return router;
}
