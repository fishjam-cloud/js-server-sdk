// @vitest-environment jsdom
/// <reference lib="dom" />
import { afterEach, describe, expect, it } from 'vitest';
import { type ReactNode, useState } from 'react';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { createCompositionEventBus, type CompositionEventSource } from '../../src/composition/eventBus';
import { CompositionEventProvider } from '../../src/composition/context';
import { useCompositionEvent } from '../../src/composition/useCompositionEvent';

afterEach(cleanup);

function wrapper(source: CompositionEventSource) {
  return ({ children }: { children: ReactNode }) => (
    <CompositionEventProvider source={source}>{children}</CompositionEventProvider>
  );
}

describe('useCompositionEvent', () => {
  it('invokes the handler with the event data when the bus emits', () => {
    const bus = createCompositionEventBus();
    const received: unknown[] = [];
    renderHook(() => useCompositionEvent('START_LIVE', (data) => received.push(data)), {
      wrapper: wrapper(bus),
    });

    act(() => bus.emit('START_LIVE', { round: 1 }));

    expect(received).toEqual([{ round: 1 }]);
  });

  it('lets a handler drive state so the template re-renders', () => {
    const bus = createCompositionEventBus();
    function Template() {
      const [live, setLive] = useState(false);
      useCompositionEvent('START_LIVE', () => setLive(true));
      return <>{live ? 'LIVE' : 'STANDBY'}</>;
    }

    const { container } = render(
      <CompositionEventProvider source={bus}>
        <Template />
      </CompositionEventProvider>
    );
    expect(container.textContent).toBe('STANDBY');

    act(() => bus.emit('START_LIVE', {}));
    expect(container.textContent).toBe('LIVE');
  });

  it('stops receiving events after the component unmounts', () => {
    const bus = createCompositionEventBus();
    const received: unknown[] = [];
    const { unmount } = renderHook(() => useCompositionEvent('E', (d) => received.push(d)), {
      wrapper: wrapper(bus),
    });

    unmount();
    act(() => bus.emit('E', { ignored: true }));

    expect(received).toEqual([]);
  });

  it('does not resubscribe across renders yet still calls the latest handler', () => {
    const inner = createCompositionEventBus();
    let subscribeCalls = 0;
    const source: CompositionEventSource = {
      subscribe(name, handler) {
        subscribeCalls += 1;
        return inner.subscribe(name, handler);
      },
    };
    const seen: number[] = [];
    const { rerender } = renderHook(
      ({ value }: { value: number }) => useCompositionEvent('E', () => seen.push(value)),
      { initialProps: { value: 1 }, wrapper: wrapper(source) }
    );

    rerender({ value: 2 });
    act(() => inner.emit('E', null));

    expect(subscribeCalls).toBe(1);
    expect(seen).toEqual([2]);
  });

  it('broadcasts one emit to every mounted hook sharing the source', () => {
    const bus = createCompositionEventBus();
    const seen: string[] = [];
    function Template({ id }: { id: string }) {
      useCompositionEvent('E', () => seen.push(id));
      return null;
    }

    render(
      <CompositionEventProvider source={bus}>
        <Template id="out1" />
        <Template id="out2" />
      </CompositionEventProvider>
    );
    act(() => bus.emit('E', null));

    expect(seen.sort()).toEqual(['out1', 'out2']);
  });

  it('throws when used outside a CompositionEventProvider', () => {
    expect(() => renderHook(() => useCompositionEvent('E', () => {}))).toThrow(/CompositionEventProvider/);
  });
});
