export interface CompositionEventBus {
  on<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
}

declare global {
  var eventBus: CompositionEventBus;
}

export const eventBus = globalThis.eventBus;
