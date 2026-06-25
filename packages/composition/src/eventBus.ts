export interface CompositionEventBus {
  on<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
}

declare global {
  // eslint-disable-next-line no-var
  var eventBus: CompositionEventBus;
}

export const eventBus = globalThis.eventBus;
