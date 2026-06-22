export interface CompositionEventBus {
  on<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
}

export const eventBus = (globalThis as unknown as { eventBus: CompositionEventBus }).eventBus;
