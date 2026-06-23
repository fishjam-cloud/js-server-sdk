import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compositionStore, type CompositionEvent } from '../src/store';
import { usePeers, usePeer, useRoom, useSpeakingState } from '../src/hooks';
import type { PeerWithStreams } from '../src/types';

const apply = (event: CompositionEvent) => compositionStore.applyNotification(event);
const render = (component: FunctionComponent) => renderToStaticMarkup(createElement(component));

const forwardCamera = () =>
  apply({
    type: 'trackForwarding',
    data: {
      roomId: 'r1',
      peerId: 'p1',
      compositionUrl: 'url',
      inputId: 'in1',
      videoTrack: { id: 'v1', type: 'video', metadata: JSON.stringify({ type: 'camera' }) },
      audioTrack: { id: 'a1', type: 'audio', metadata: JSON.stringify({ type: 'camera' }) },
    } as never,
  });

beforeEach(() => compositionStore.reset());

describe('composition hooks', () => {
  it('usePeers reflects the current store state', () => {
    const Probe: FunctionComponent = () =>
      createElement(
        'div',
        null,
        usePeers()
          .peers.map((p) => p.id)
          .join(',')
      );
    expect(render(Probe)).toBe('<div></div>');
    forwardCamera();
    expect(render(Probe)).toBe('<div>p1</div>');
  });

  it('usePeer selects the peer owning the inputId', () => {
    const Probe: FunctionComponent = () => createElement('div', null, usePeer('in1')?.id ?? 'none');
    expect(render(Probe)).toBe('<div>none</div>');
    forwardCamera();
    expect(render(Probe)).toBe('<div>p1</div>');
  });

  it('useRoom reflects the linked room', () => {
    const Probe: FunctionComponent = () => createElement('div', null, useRoom()?.id ?? 'none');
    expect(render(Probe)).toBe('<div>none</div>');
    compositionStore.seedFromRoom({ id: 'r1', config: {}, peers: [] } as never);
    expect(render(Probe)).toBe('<div>r1</div>');
  });

  it('useSpeakingState tracks VAD per input', () => {
    const Probe: FunctionComponent = () => createElement('div', null, String(useSpeakingState('in1')));
    forwardCamera();
    expect(render(Probe)).toBe('<div>silence</div>');
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    expect(render(Probe)).toBe('<div>speech</div>');
  });

  it('flows the metadata generics through the return types', () => {
    expectTypeOf<ReturnType<typeof usePeers<{ name: string }, { trusted: boolean }>>>().toEqualTypeOf<{
      peers: PeerWithStreams<{ name: string }, { trusted: boolean }>[];
    }>();
    expectTypeOf<ReturnType<typeof usePeer<{ name: string }>>>().toEqualTypeOf<
      PeerWithStreams<{ name: string }, unknown> | undefined
    >();
  });
});
