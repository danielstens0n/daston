import type { ComponentInstance } from './types.ts';

export function componentTypeLabel(type: ComponentInstance['type']): string {
  switch (type) {
    case 'card':
      return 'Card';
    case 'button':
      return 'Button';
    case 'table':
      return 'Table';
    case 'landing':
      return 'Landing page';
    case 'imported':
      return 'Imported';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
