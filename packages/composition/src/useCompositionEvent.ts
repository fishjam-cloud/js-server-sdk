import { useContext, useEffect, useRef } from 'react';
import { CompositionEventContext } from './context';
import type { CompositionEventHandler } from './eventBus';

export function useCompositionEvent(eventName: string, handler: CompositionEventHandler): void {
  const source = useContext(CompositionEventContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (source === null) {
      console.warn(`useCompositionEvent("${eventName}") used without a CompositionEventProvider; ignoring`);
      return;
    }
    return source.subscribe(eventName, (data) => handlerRef.current(data));
  }, [source, eventName]);
}
