import { useCallback, useContext, useSyncExternalStore } from 'react';
import { CompositionEventContext } from './context';

export function useCompositionEvent<T = unknown>(eventName: string): T | undefined {
  const store = useContext(CompositionEventContext);
  if (store === null) {
    throw new Error('useCompositionEvent must be used within a CompositionEventProvider');
  }

  const getSnapshot = useCallback(() => store.getLatest(eventName), [store, eventName]);
  return useSyncExternalStore(store.subscribe, getSnapshot) as T | undefined;
}
