import { useContext, useEffect, useRef } from 'react';
import { CompositionEventContext } from './context';
import type { CompositionEventHandler } from './eventBus';

export function useCompositionEvent(eventName: string, handler: CompositionEventHandler): void {
  const source = useContext(CompositionEventContext);
  if (source === null) {
    throw new Error('useCompositionEvent must be used within a CompositionEventProvider');
  }

  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const unsubscribe = source.subscribe(eventName, (data) => handlerRef.current(data));
    return unsubscribe;
  }, [source, eventName]);
}
