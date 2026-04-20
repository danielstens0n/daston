import { createContext, type ReactNode, useContext } from 'react';

const InstanceIdContext = createContext<string | null>(null);

export function InstanceIdProvider({ id, children }: { id: string; children: ReactNode }) {
  return <InstanceIdContext.Provider value={id}>{children}</InstanceIdContext.Provider>;
}

export function useInstanceId(): string {
  const id = useContext(InstanceIdContext);
  if (id === null) {
    throw new Error('useInstanceId must be used inside an InstanceIdProvider');
  }
  return id;
}
