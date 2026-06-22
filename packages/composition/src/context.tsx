import { createContext, type PropsWithChildren, type ReactElement } from 'react';
import type { CompositionEventStore } from './eventBus';

export const CompositionEventContext = createContext<CompositionEventStore | null>(null);

export function CompositionEventProvider({
  store,
  children,
}: PropsWithChildren<{ store: CompositionEventStore }>): ReactElement {
  return <CompositionEventContext.Provider value={store}>{children}</CompositionEventContext.Provider>;
}
