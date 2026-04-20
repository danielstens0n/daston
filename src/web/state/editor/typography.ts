import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentInstance, TypographyValues } from '../types.ts';
import { useUpdateProps } from './selectors.ts';
import { useEditorStore } from './store.ts';

export type TypographyScopeId =
  | 'card-title'
  | 'card-body'
  | 'button-label'
  | 'table-header'
  | 'table-body'
  | 'landing-heading'
  | 'landing-body';

function readTypography(
  instance: ComponentInstance | undefined,
  scope: TypographyScopeId,
): TypographyValues | null {
  if (!instance) return null;
  switch (scope) {
    case 'card-title': {
      if (instance.type !== 'card') return null;
      const p = instance.props;
      return {
        font: p.titleFont,
        fontSize: p.titleFontSize,
        fontWeight: p.titleFontWeight,
        italic: p.titleItalic,
        decoration: p.titleDecoration,
      };
    }
    case 'card-body': {
      if (instance.type !== 'card') return null;
      const p = instance.props;
      return {
        font: p.bodyFont,
        fontSize: p.bodyFontSize,
        fontWeight: p.bodyFontWeight,
        italic: p.bodyItalic,
        decoration: p.bodyDecoration,
      };
    }
    case 'button-label': {
      if (instance.type !== 'button') return null;
      const p = instance.props;
      return {
        font: p.labelFont,
        fontSize: p.labelFontSize,
        fontWeight: p.labelFontWeight,
        italic: p.labelItalic,
        decoration: p.labelDecoration,
      };
    }
    case 'table-header': {
      if (instance.type !== 'table') return null;
      const p = instance.props;
      return {
        font: p.headerFont,
        fontSize: p.headerFontSize,
        fontWeight: p.headerFontWeight,
        italic: p.headerItalic,
        decoration: p.headerDecoration,
      };
    }
    case 'table-body': {
      if (instance.type !== 'table') return null;
      const p = instance.props;
      return {
        font: p.bodyFont,
        fontSize: p.bodyFontSize,
        fontWeight: p.bodyFontWeight,
        italic: p.bodyItalic,
        decoration: p.bodyDecoration,
      };
    }
    case 'landing-heading': {
      if (instance.type !== 'landing') return null;
      const p = instance.props;
      return {
        font: p.headingFont,
        fontSize: p.headingFontSize,
        fontWeight: p.headingFontWeight,
        italic: p.headingItalic,
        decoration: p.headingDecoration,
      };
    }
    case 'landing-body': {
      if (instance.type !== 'landing') return null;
      const p = instance.props;
      return {
        font: p.bodyFont,
        fontSize: p.bodyFontSize,
        fontWeight: p.bodyFontWeight,
        italic: p.bodyItalic,
        decoration: p.bodyDecoration,
      };
    }
    default: {
      const _exhaustive: never = scope;
      return _exhaustive;
    }
  }
}

export function buildTypographyPartial(
  scope: TypographyScopeId,
  patch: Partial<TypographyValues>,
): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  const prefix = (() => {
    switch (scope) {
      case 'card-title':
        return 'title';
      case 'card-body':
        return 'body';
      case 'button-label':
        return 'label';
      case 'table-header':
        return 'header';
      case 'table-body':
        return 'body';
      case 'landing-heading':
        return 'heading';
      case 'landing-body':
        return 'body';
      default: {
        const _e: never = scope;
        return _e;
      }
    }
  })();

  if (patch.font !== undefined) out[`${prefix}Font`] = patch.font;
  if (patch.fontSize !== undefined) out[`${prefix}FontSize`] = patch.fontSize;
  if (patch.fontWeight !== undefined) out[`${prefix}FontWeight`] = patch.fontWeight;
  if (patch.italic !== undefined) out[`${prefix}Italic`] = patch.italic;
  if (patch.decoration !== undefined) out[`${prefix}Decoration`] = patch.decoration;

  return Object.keys(out).length > 0 ? out : null;
}

export type TypographyScopeResult = {
  values: TypographyValues;
  onChange: (patch: Partial<TypographyValues>) => void;
  /** When set, wire a Text color row (card/button/table scopes). */
  color?: string;
  onColorChange?: (value: string) => void;
};

function readLinkedTextColor(
  instance: ComponentInstance | undefined,
  scope: TypographyScopeId,
): string | undefined {
  if (!instance) return undefined;
  switch (scope) {
    case 'card-title':
      return instance.type === 'card' ? instance.props.titleColor : undefined;
    case 'card-body':
      return instance.type === 'card' ? instance.props.bodyColor : undefined;
    case 'button-label':
      return instance.type === 'button' ? instance.props.textColor : undefined;
    case 'table-header':
      return instance.type === 'table' ? instance.props.headerTextColor : undefined;
    case 'table-body':
      return instance.type === 'table' ? instance.props.bodyTextColor : undefined;
    default:
      return undefined;
  }
}

export function useTypographyScope(id: string, scope: TypographyScopeId): TypographyScopeResult | null {
  const snapshot = useEditorStore(
    useShallow((state) => {
      const instance = state.instances.find((i) => i.id === id);
      const typography = readTypography(instance, scope);
      if (!typography) return null;
      const color = readLinkedTextColor(instance, scope);
      return [
        typography.font,
        typography.fontSize,
        typography.fontWeight,
        typography.italic,
        typography.decoration,
        color,
      ] as const;
    }),
  );
  const updateProps = useUpdateProps(id);
  const onChange = useMemo(
    () => (patch: Partial<TypographyValues>) => {
      const mapped = buildTypographyPartial(scope, patch);
      if (mapped) updateProps(mapped);
    },
    [scope, updateProps],
  );
  const onColorChange = useMemo(() => {
    switch (scope) {
      case 'card-title':
        return (value: string) => updateProps({ titleColor: value });
      case 'card-body':
        return (value: string) => updateProps({ bodyColor: value });
      case 'button-label':
        return (value: string) => updateProps({ textColor: value });
      case 'table-header':
        return (value: string) => updateProps({ headerTextColor: value });
      case 'table-body':
        return (value: string) => updateProps({ bodyTextColor: value });
      default:
        return undefined;
    }
  }, [scope, updateProps]);
  if (!snapshot) return null;
  const [font, fontSize, fontWeight, italic, decoration, color] = snapshot;
  const values: TypographyValues = { font, fontSize, fontWeight, italic, decoration };
  const result: TypographyScopeResult = {
    values,
    onChange,
  };
  if (color !== undefined) {
    result.color = color;
    if (onColorChange !== undefined) {
      result.onColorChange = onColorChange;
    }
  }
  return result;
}
