import type {
  AnalysisConfidence,
  AnalysisFact,
  DetectedFrameworkKind,
  ProjectAnalysis,
  ThemeSeed,
} from '../shared/types.ts';
import { detectCssTokens } from './detectors/css-tokens.ts';
import { detectFontsFromLayout } from './detectors/fonts-from-layout.ts';
import { detectNextAndRouter } from './detectors/next-and-router.ts';
import { detectPackageJson } from './detectors/package-json.ts';
import { detectTailwind } from './detectors/tailwind.ts';

function hasFact(facts: AnalysisFact[], id: string): boolean {
  return facts.some((f) => f.id === id);
}

function factValue<T>(facts: AnalysisFact[], id: string): T | undefined {
  return facts.find((f) => f.id === id)?.value as T | undefined;
}

function resolveFramework(facts: AnalysisFact[]): {
  kind: DetectedFrameworkKind;
  confidence: AnalysisConfidence;
} {
  const next = hasFact(facts, 'framework.next_dep');
  const tanstack = hasFact(facts, 'framework.tanstack_router_dep');
  const react = hasFact(facts, 'framework.react_dep');
  const nextApp = factValue<string>(facts, 'router.next_app_dir');
  const nextPages = factValue<string>(facts, 'router.next_pages_dir');
  const tanstackDir = factValue<string>(facts, 'router.tanstack_routes_dir');

  if (next || nextApp || nextPages) {
    return { kind: 'next', confidence: 'high' };
  }
  if (tanstack && (tanstackDir || hasFact(facts, 'bundler.vite_config'))) {
    return { kind: 'tanstack-router', confidence: tanstackDir ? 'high' : 'medium' };
  }
  if (tanstack) {
    return { kind: 'tanstack-router', confidence: 'medium' };
  }
  if (react) {
    return { kind: 'react', confidence: 'high' };
  }
  return { kind: 'unknown', confidence: 'low' };
}

function resolveStyling(facts: AnalysisFact[]): {
  tailwind: boolean;
  cssVariables: boolean;
  confidence: AnalysisConfidence;
} {
  const tailwindDep = hasFact(facts, 'styling.tailwind_dep');
  const tailwindCfg = hasFact(facts, 'tailwind.config_present');
  const cssTok = hasFact(facts, 'css.token_values');

  const tailwind = tailwindDep || tailwindCfg;
  const cssVariables = cssTok || false;
  let confidence: AnalysisConfidence = 'low';
  if (tailwind && cssVariables) confidence = 'high';
  else if (tailwind || cssVariables) confidence = 'medium';

  return { tailwind, cssVariables, confidence };
}

export async function runProjectAnalysis(projectRoot: string): Promise<ProjectAnalysis> {
  const facts: AnalysisFact[] = [];
  const push = (f: AnalysisFact) => {
    facts.push(f);
  };

  const themeSeed: ThemeSeed = {
    fonts: { heading: null, body: null },
    colors: {},
  };

  await detectPackageJson(projectRoot, push);
  await detectNextAndRouter(projectRoot, push);
  await detectTailwind(projectRoot, push, themeSeed);
  await detectCssTokens(projectRoot, push, themeSeed);
  await detectFontsFromLayout(projectRoot, push, themeSeed);

  const framework = resolveFramework(facts);
  const styling = resolveStyling(facts);

  return {
    projectRoot,
    facts,
    framework: { kind: framework.kind, confidence: framework.confidence },
    styling: {
      tailwind: styling.tailwind,
      cssVariables: styling.cssVariables,
      confidence: styling.confidence,
    },
    themeSeed,
  };
}
