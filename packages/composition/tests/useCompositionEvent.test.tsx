import { describe, it, expect } from 'vitest';
import React, { useState } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createCompositionEventBus, type CompositionEventSource } from '../src/eventBus';
import { CompositionEventProvider } from '../src/context';
import { useCompositionEvent } from '../src/useCompositionEvent';

function countingSource(): {
  source: CompositionEventSource;
  emit: (eventName: string, data: unknown) => void;
  subscribeCalls: () => number;
} {
  const inner = createCompositionEventBus();
  let count = 0;
  const source: CompositionEventSource = {
    subscribe(name, handler) {
      count += 1;
      return inner.subscribe(name, handler);
    },
  };
  return { source, emit: (name, data) => inner.emit(name, data), subscribeCalls: () => count };
}

function render(source: CompositionEventSource, element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<CompositionEventProvider source={source}>{element}</CompositionEventProvider>);
  });
  return renderer;
}

describe('useCompositionEvent', () => {
  it('invokes the handler with the event data when the bus emits', () => {
    const bus = createCompositionEventBus();
    const received: unknown[] = [];
    function Template() {
      useCompositionEvent('START_LIVE', (data) => received.push(data));
      return null;
    }

    render(bus, <Template />);
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

    const renderer = render(bus, <Template />);
    expect(renderer.toJSON() as unknown).toBe('STANDBY');

    act(() => bus.emit('START_LIVE', {}));
    expect(renderer.toJSON() as unknown).toBe('LIVE');
  });

  it('stops receiving events after the component unmounts', () => {
    const bus = createCompositionEventBus();
    const received: unknown[] = [];
    function Template() {
      useCompositionEvent('E', (d) => received.push(d));
      return null;
    }

    const renderer = render(bus, <Template />);
    act(() => renderer.unmount());
    act(() => bus.emit('E', { ignored: true }));

    expect(received).toEqual([]);
  });

  it('does not resubscribe across renders yet still calls the latest handler', () => {
    const { source, emit, subscribeCalls } = countingSource();
    const seen: number[] = [];
    function Template({ value }: { value: number }) {
      useCompositionEvent('E', () => seen.push(value));
      return null;
    }

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <CompositionEventProvider source={source}>
          <Template value={1} />
        </CompositionEventProvider>
      );
    });
    act(() => {
      renderer.update(
        <CompositionEventProvider source={source}>
          <Template value={2} />
        </CompositionEventProvider>
      );
    });

    act(() => emit('E', null));

    expect(subscribeCalls()).toBe(1);
    expect(seen).toEqual([2]);
  });

  it('broadcasts one emit to every mounted template sharing the source', () => {
    const bus = createCompositionEventBus();
    const seen: string[] = [];
    function Template({ id }: { id: string }) {
      useCompositionEvent('E', () => seen.push(id));
      return null;
    }

    render(
      bus,
      <>
        <Template id="out1" />
        <Template id="out2" />
      </>
    );
    act(() => bus.emit('E', null));

    expect(seen.sort()).toEqual(['out1', 'out2']);
  });
});
