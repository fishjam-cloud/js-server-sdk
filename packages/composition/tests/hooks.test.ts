import { describe, it, expect, beforeEach, expectTypeOf } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compositionStore, type CompositionEvent } from '../src/store';
import { usePeers, usePeer, useRoom, useSpeakingState } from '../src/hooks';
import type { PeerWithStreams } from '../src/types';
import { PeerId, RoomId } from '@fishjam-cloud/js-server-sdk';

const apply = (event: CompositionEvent) => compositionStore.applyNotification(event);
const render = (component: FunctionComponent) => renderToStaticMarkup(createElement(component));

const forwardCamera = () =>
  apply({
    type: 'trackForwarding',
    data: {
      roomId: 'r1' as RoomId,
      peerId: 'p1' as PeerId,
      compositionUrl: 'url',
      inputId: 'in1',
      videoTrack: { id: 'v1', type: 'video', metadata: JSON.stringify({ type: 'camera' }) },
      audioTrack: { id: 'a1', type: 'audio', metadata: JSON.stringify({ type: 'camera' }) },
    },
  });

beforeEach(() => compositionStore.seedFromRoom({ id: 'r1' as RoomId, config: {}, peers: [] }));

describe('composition hooks', () => {
  it('usePeers reflects the current store state', () => {
    const Probe: FunctionComponent = () =>
      createElement(
        'div',
        null,
        usePeers()
          .map((p) => p.id)
          .join(',')
      );
    expect(render(Probe)).toBe('<div></div>');
    forwardCamera();
    expect(render(Probe)).toBe('<div>p1</div>');
  });

  it('usePeer selects the peer by id', () => {
    const Probe: FunctionComponent = () => createElement('div', null, usePeer('p1')?.id ?? 'none');
    expect(render(Probe)).toBe('<div>none</div>');
    forwardCamera();
    expect(render(Probe)).toBe('<div>p1</div>');
  });

  it('useRoom reflects the linked room', () => {
    const Probe: FunctionComponent = () => createElement('div', null, useRoom()?.id ?? 'none');
    compositionStore.reset();
    expect(render(Probe)).toBe('<div>none</div>');
    compositionStore.seedFromRoom({ id: 'r1', config: {}, peers: [] } as never);
    expect(render(Probe)).toBe('<div>r1</div>');
  });

  it('useSpeakingState tracks VAD per peer', () => {
    const Probe: FunctionComponent = () => createElement('div', null, String(useSpeakingState('p1')));
    forwardCamera();
    expect(render(Probe)).toBe('<div>silence</div>');
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    expect(render(Probe)).toBe('<div>speech</div>');
  });

  it('flows the metadata generics through the return types', () => {
    expectTypeOf<ReturnType<typeof usePeers<{ name: string }, { trusted: boolean }>>>().toEqualTypeOf<
      PeerWithStreams<{ name: string }, { trusted: boolean }>[]
    >();
    expectTypeOf<ReturnType<typeof usePeer<{ name: string }>>>().toEqualTypeOf<
      PeerWithStreams<{ name: string }, unknown> | undefined
    >();
  });
});
