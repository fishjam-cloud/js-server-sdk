export interface CompositionEventBus {
  on<T = unknown>(eventName: string, callback: (data: T) => void): () => void;
}

declare global {
  const eventBus: CompositionEventBus;
}
