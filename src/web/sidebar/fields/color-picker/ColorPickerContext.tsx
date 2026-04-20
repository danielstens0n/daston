import { createContext, type ReactNode, useContext } from 'react';

export type ColorPickerSession = {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
};

const ColorPickerContext = createContext<ColorPickerSession | null>(null);

export function ColorPickerProvider({
  session,
  children,
}: {
  session: ColorPickerSession;
  children: ReactNode;
}) {
  return <ColorPickerContext.Provider value={session}>{children}</ColorPickerContext.Provider>;
}

export function useColorPickerSession(): ColorPickerSession {
  const session = useContext(ColorPickerContext);
  if (!session) {
    throw new Error('ColorPicker must be used inside ColorPickerProvider');
  }
  return session;
}
