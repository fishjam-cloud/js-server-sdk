import { describe, it, expect, vi } from 'vitest';
import { createCompositionEventBus } from '../../src/composition/eventBus';

describe('createCompositionEventBus', () => {
  it('delivers an emitted event to a subscriber with its data', () => {
    const bus = createCompositionEventBus();
    const received: unknown[] = [];
    bus.subscribe('START_LIVE', (data) => received.push(data));

    bus.emit('START_LIVE', { round: 1 });

    expect(received).toEqual([{ round: 1 }]);
  });

  it('broadcasts a single emit to every subscriber of that name', () => {
    const bus = createCompositionEventBus();
    const calls: string[] = [];
    bus.subscribe('E', () => calls.push('a'));
    bus.subscribe('E', () => calls.push('b'));

    bus.emit('E', null);

    expect(calls.sort()).toEqual(['a', 'b']);
  });

  it('only notifies handlers registered for the emitted name', () => {
    const bus = createCompositionEventBus();
    const other: unknown[] = [];
    bus.subscribe('OTHER', (d) => other.push(d));

    bus.emit('START_LIVE', {});

    expect(other).toEqual([]);
  });

  it('stops delivering after the returned unsubscribe is called', () => {
    const bus = createCompositionEventBus();
    const received: unknown[] = [];
    const unsubscribe = bus.subscribe('E', (d) => received.push(d));

    unsubscribe();
    bus.emit('E', { ignored: true });

    expect(received).toEqual([]);
  });

  it('is a no-op when emitting with no subscribers', () => {
    const bus = createCompositionEventBus();
    expect(() => bus.emit('NOBODY_LISTENING', { x: 1 })).not.toThrow();
  });

  it('isolates a throwing handler so siblings still run', () => {
    const bus = createCompositionEventBus();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const calls: string[] = [];
    bus.subscribe('E', () => {
      throw new Error('boom');
    });
    bus.subscribe('E', () => calls.push('survivor'));

    expect(() => bus.emit('E', null)).not.toThrow();

    expect(calls).toEqual(['survivor']);
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });

  it('isolates a rejecting async handler so siblings still run', async () => {
    const bus = createCompositionEventBus();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const calls: string[] = [];
    bus.subscribe('E', async () => {
      throw new Error('boom');
    });
    bus.subscribe('E', () => calls.push('survivor'));

    expect(() => bus.emit('E', null)).not.toThrow();
    expect(calls).toEqual(['survivor']);

    await Promise.resolve();
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });
});
