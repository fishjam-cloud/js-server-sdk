import { describe, it, expect, beforeEach } from 'vitest';
import { compositionStore, type CompositionEvent } from '../src/store';
import type { Room, RoomId } from '@fishjam-cloud/js-server-sdk';

const apply = (event: CompositionEvent) => compositionStore.applyNotification(event);

const track = (id: string, type: 'video' | 'audio', metadata: Record<string, unknown>) =>
  ({ id, type, metadata: JSON.stringify(metadata) }) as never;

const forwardCamera = (peerId = 'p1', inputId = 'in1') =>
  apply({
    type: 'trackForwarding',
    data: {
      roomId: 'r1',
      peerId,
      compositionUrl: 'url',
      inputId,
      videoTrack: track('v1', 'video', { type: 'camera', paused: false }),
      audioTrack: track('a1', 'audio', { type: 'camera', paused: false }),
    } as never,
  });

const forwardScreenShare = (peerId = 'p1', inputId = 'in2') =>
  apply({
    type: 'trackForwarding',
    data: {
      roomId: 'r1',
      peerId,
      compositionUrl: 'url',
      inputId,
      videoTrack: track('v2', 'video', { type: 'screenShareVideo', paused: false }),
    } as never,
  });

const peers = () => compositionStore.getSnapshot().peers;

beforeEach(() => compositionStore.seedFromRoom({ id: 'r1' as RoomId, config: {}, peers: [] }));

describe('composition store reducer', () => {
  it('peerConnected adds an empty peer', () => {
    apply({ type: 'peerConnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    expect(peers()).toHaveLength(1);
    expect(peers()[0]).toMatchObject({ id: 'p1', streams: [], customStreams: [] });
    expect(peers()[0].cameraStream).toBeUndefined();
  });

  it('peerDisconnected removes the peer and its forwarding entries', () => {
    apply({ type: 'peerConnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    forwardCamera();
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    apply({ type: 'peerDisconnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    expect(peers()).toHaveLength(0);
    expect(compositionStore.getSnapshot().vad).toEqual({});
    // forwarding table cleared: a later vad for the same key resolves to nothing
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    expect(compositionStore.getSnapshot().vad).toEqual({});
  });

  it('trackAdded before trackForwarding produces no Stream; forwarding then creates and classifies it', () => {
    apply({ type: 'peerConnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    apply({
      type: 'trackAdded',
      data: { roomId: 'r1', peerId: 'p1', track: track('v1', 'video', { type: 'camera' }) } as never,
    });
    expect(peers()[0].streams).toHaveLength(0);

    forwardCamera();
    const peer = peers()[0];
    expect(peer.streams).toHaveLength(1);
    expect(peer.cameraStream?.inputId).toBe('in1');
    expect(peer.cameraStream?.video).toMatchObject({ id: 'v1', type: 'video', paused: false });
    expect(peer.cameraStream?.audio).toMatchObject({ id: 'a1', type: 'audio' });
  });

  it('paused is read from track metadata', () => {
    apply({
      type: 'trackForwarding',
      data: {
        roomId: 'r1',
        peerId: 'p1',
        compositionUrl: 'url',
        inputId: 'in1',
        videoTrack: track('v1', 'video', { type: 'camera', paused: true }),
      } as never,
    });
    expect(peers()[0].cameraStream?.video?.paused).toBe(true);
  });

  it('trackRemoved clears one slot but keeps the other; trackForwardingRemoved drops the stream', () => {
    forwardCamera();
    apply({
      type: 'trackRemoved',
      data: { roomId: 'r1', peerId: 'p1', track: track('a1', 'audio', {}) } as never,
    });
    expect(peers()[0].cameraStream?.audio).toBeUndefined();
    expect(peers()[0].cameraStream?.video).toBeDefined();

    apply({
      type: 'trackForwardingRemoved',
      data: { roomId: 'r1', peerId: 'p1', compositionUrl: 'url', inputId: 'in1' } as never,
    });
    expect(peers()[0].streams).toHaveLength(0);
    expect(peers()[0].cameraStream).toBeUndefined();
  });

  it('VAD is keyed by (peerId, trackId) → inputId and surfaces on the audio track', () => {
    forwardCamera();
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    expect(compositionStore.getSnapshot().vad).toEqual({ in1: 'speech' });
    expect(peers()[0].cameraStream?.audio?.vadStatus).toBe('speech');
  });

  it('ignores a VAD notification for an unknown (peerId, trackId)', () => {
    forwardCamera();
    apply({
      type: 'vadNotification',
      data: { roomId: 'r1', peerId: 'p1', trackId: 'nope', status: 'speech' } as never,
    });
    expect(compositionStore.getSnapshot().vad).toEqual({});
  });

  it('peerMetadataUpdated splits into { peer, server }', () => {
    apply({ type: 'peerConnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    apply({
      type: 'peerMetadataUpdated',
      data: {
        roomId: 'r1',
        peerId: 'p1',
        peerType: 'webrtc',
        metadata: JSON.stringify({ peer: { name: 'Ada' }, server: { trusted: true } }),
      } as never,
    });
    expect(peers()[0].metadata).toEqual({ peer: { name: 'Ada' }, server: { trusted: true } });
  });

  it('normalizes notifier (string) and REST (object) metadata to the same shape', () => {
    const value = { peer: { name: 'Ada' }, server: { trusted: true } };

    apply({ type: 'peerConnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    apply({
      type: 'peerMetadataUpdated',
      data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc', metadata: JSON.stringify(value) } as never,
    });
    const fromNotifier = peers()[0].metadata;

    compositionStore.seedFromRoom({
      id: 'r1',
      config: {},
      peers: [{ id: 'p1', metadata: value, tracks: [] }],
    } as unknown as Room);
    const fromRest = peers()[0].metadata;

    expect(fromRest).toEqual(fromNotifier);
  });

  it('seedFromRoom records peers without creating streams for un-forwarded tracks', () => {
    compositionStore.seedFromRoom({
      id: 'r1',
      config: {},
      peers: [{ id: 'p1', metadata: {}, tracks: [{ id: 'v1', type: 'video', metadata: { type: 'camera' } }] }],
    } as unknown as Room);
    expect(peers()).toHaveLength(1);
    expect(peers()[0].streams).toHaveLength(0);
  });

  it('getSnapshot returns a stable reference until a mutation occurs', () => {
    const a = compositionStore.getSnapshot();
    expect(compositionStore.getSnapshot()).toBe(a);
    forwardCamera();
    const b = compositionStore.getSnapshot();
    expect(b).not.toBe(a);
    expect(compositionStore.getSnapshot()).toBe(b);
  });

  it('peerDisconnected does not clear forwarding for peers sharing an id prefix', () => {
    forwardCamera('p1', 'in1');
    forwardCamera('p10', 'in10');
    apply({ type: 'peerDisconnected', data: { roomId: 'r1', peerId: 'p1', peerType: 'webrtc' } as never });
    expect(peers().map((p) => p.id)).toEqual(['p10']);
    // p10's forwarding survives p1's disconnect: a vad for p10's audio still resolves
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p10', trackId: 'a1', status: 'speech' } as never });
    expect(compositionStore.getSnapshot().vad).toEqual({ in10: 'speech' });
  });

  it('trackMetadataUpdated updates a forwarded audio track in place', () => {
    forwardCamera();
    expect(peers()[0].cameraStream?.audio?.paused).toBe(false);
    apply({
      type: 'trackMetadataUpdated',
      data: { roomId: 'r1', peerId: 'p1', track: track('a1', 'audio', { type: 'camera', paused: true }) } as never,
    });
    expect(peers()[0].cameraStream?.audio?.paused).toBe(true);
    expect(peers()[0].cameraStream?.video?.paused).toBe(false);
  });

  it('classifies camera, screenShare, and custom streams independently', () => {
    forwardCamera('p1', 'in1');
    forwardScreenShare('p1', 'in2');
    apply({
      type: 'trackForwarding',
      data: {
        roomId: 'r1',
        peerId: 'p1',
        compositionUrl: 'url',
        inputId: 'in3',
        videoTrack: track('v3', 'video', { type: 'whiteboard' }),
      } as never,
    });
    const peer = peers()[0];
    expect(peer.streams).toHaveLength(3);
    expect(peer.cameraStream?.inputId).toBe('in1');
    expect(peer.screenShareStream?.inputId).toBe('in2');
    expect(peer.customStreams.map((s) => s.inputId)).toEqual(['in3']);
  });

  it('trackForwardingRemoved drops only the removed input, leaving the peer other stream routable', () => {
    forwardCamera('p1', 'in1');
    forwardScreenShare('p1', 'in2');
    apply({
      type: 'trackForwardingRemoved',
      data: { roomId: 'r1', peerId: 'p1', compositionUrl: 'url', inputId: 'in1' } as never,
    });
    const peer = peers()[0];
    expect(peer.cameraStream).toBeUndefined();
    expect(peer.screenShareStream?.inputId).toBe('in2');
    // in1's forwarding entries are cleared: a vad for its audio no longer resolves
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    expect(compositionStore.getSnapshot().vad).toEqual({});
  });

  it('keeps an unchanged peer reference stable when another peer mutates (structural sharing)', () => {
    forwardCamera('p1', 'in1');
    forwardCamera('p2', 'in2');
    const p1Before = compositionStore.getPeers().find((p) => p.id === 'p1');

    // a mutation scoped to p2 must not re-derive p1
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p2', trackId: 'a1', status: 'speech' } as never });
    const after = compositionStore.getPeers();
    expect(after.find((p) => p.id === 'p1')).toBe(p1Before);
    expect(after.find((p) => p.id === 'p2')).not.toBe(p1Before);
  });

  it('getPeer returns a stable reference until that peer changes', () => {
    forwardCamera('p1', 'in1');
    forwardCamera('p2', 'in2');
    const a = compositionStore.getPeer('in1');

    // unrelated commit on p2 → p1 reference unchanged
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p2', trackId: 'a1', status: 'speech' } as never });
    expect(compositionStore.getPeer('in1')).toBe(a);

    // commit on p1 → new reference
    apply({ type: 'vadNotification', data: { roomId: 'r1', peerId: 'p1', trackId: 'a1', status: 'speech' } as never });
    expect(compositionStore.getPeer('in1')).not.toBe(a);
  });

  it('notifies subscribers on mutation and stops after unsubscribe', () => {
    let calls = 0;
    const unsubscribe = compositionStore.subscribe(() => calls++);
    forwardCamera();
    expect(calls).toBe(1);
    unsubscribe();
    apply({ type: 'peerConnected', data: { roomId: 'r1', peerId: 'p2', peerType: 'webrtc' } as never });
    expect(calls).toBe(1);
  });
});
