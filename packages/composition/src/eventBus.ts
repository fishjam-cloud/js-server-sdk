export type CompositionEventHandler = (data: unknown) => void;

export interface CompositionEventSource {
  subscribe(eventName: string, handler: CompositionEventHandler): () => void;
}

export interface CompositionEventBus extends CompositionEventSource {
  emit(eventName: string, data: unknown): void;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return value != null && typeof (value as { then?: unknown }).then === 'function';
}

export function createCompositionEventBus(): CompositionEventBus {
  const handlers = new Map<string, Set<CompositionEventHandler>>();

  return {
    subscribe(eventName, handler) {
      let set = handlers.get(eventName);
      if (set === undefined) {
        set = new Set();
        handlers.set(eventName, set);
      }
      set.add(handler);

      return () => {
        const current = handlers.get(eventName);
        if (current === undefined) return;
        current.delete(handler);
        if (current.size === 0) handlers.delete(eventName);
      };
    },

    emit(eventName, data) {
      const set = handlers.get(eventName);
      if (set === undefined) return;
      for (const handler of [...set]) {
        try {
          const result = handler(data) as unknown;
          if (isThenable(result)) {
            Promise.resolve(result).catch((error) =>
              console.error(`Composition event handler for "${eventName}" rejected`, error)
            );
          }
        } catch (error) {
          console.error(`Composition event handler for "${eventName}" threw`, error);
        }
      }
    },
  };
}
