export interface CompositionEventStore {
  subscribe(listener: () => void): () => void;
  getLatest(eventName: string): unknown;
}

export interface CompositionEventBus extends CompositionEventStore {
  emit(eventName: string, data: unknown): void;
}

export function createCompositionEventBus(): CompositionEventBus {
  const latest = new Map<string, unknown>();
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getLatest(eventName) {
      return latest.get(eventName);
    },

    emit(eventName, data) {
      latest.set(eventName, data);
      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}
