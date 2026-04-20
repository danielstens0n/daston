// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { InstanceIdProvider, useInstanceId } from './InstanceIdContext.tsx';

describe('useInstanceId', () => {
  it('throws when used outside InstanceIdProvider', () => {
    expect(() => renderHook(() => useInstanceId())).toThrow(
      /useInstanceId must be used inside an InstanceIdProvider/,
    );
  });

  it('returns the id from the provider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <InstanceIdProvider id="preview-42">{children}</InstanceIdProvider>
    );
    const { result } = renderHook(() => useInstanceId(), { wrapper });
    expect(result.current).toBe('preview-42');
  });
});
