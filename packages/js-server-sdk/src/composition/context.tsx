import { createContext, type PropsWithChildren, type ReactElement } from 'react';
import type { CompositionEventSource } from './eventBus';

export const CompositionEventContext = createContext<CompositionEventSource | null>(null);

export function CompositionEventProvider({
  source,
  children,
}: PropsWithChildren<{ source: CompositionEventSource }>): ReactElement {
  return <CompositionEventContext.Provider value={source}>{children}</CompositionEventContext.Provider>;
}
