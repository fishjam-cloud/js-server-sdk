import { describe, it, expect, vi } from 'vitest';
import { createCompositionEventBus } from '../src/eventBus';

describe('createCompositionEventBus', () => {
  it('returns undefined for an event with nothing emitted yet', () => {
    const bus = createCompositionEventBus();
    expect(bus.getLatest('START_LIVE')).toBeUndefined();
  });

  it('exposes the latest data emitted for an event name', () => {
    const bus = createCompositionEventBus();
    bus.emit('VOLUME', { level: 1 });
    bus.emit('VOLUME', { level: 2 });
    expect(bus.getLatest('VOLUME')).toEqual({ level: 2 });
  });

  it('tracks event names independently', () => {
    const bus = createCompositionEventBus();
    bus.emit('A', 1);
    bus.emit('B', 2);
    expect(bus.getLatest('A')).toBe(1);
    expect(bus.getLatest('B')).toBe(2);
  });

  it('returns a stable snapshot reference between emits', () => {
    const bus = createCompositionEventBus();
    bus.emit('E', { x: 1 });
    expect(bus.getLatest('E')).toBe(bus.getLatest('E'));
  });

  it('notifies every subscriber on each emit', () => {
    const bus = createCompositionEventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.subscribe(a);
    bus.subscribe(b);

    bus.emit('E', 1);
    bus.emit('E', 2);

    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('stops notifying after unsubscribe', () => {
    const bus = createCompositionEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);

    unsubscribe();
    bus.emit('E', 1);

    expect(listener).not.toHaveBeenCalled();
  });
});
