import { useCallback, useSyncExternalStore } from 'react';
import { compositionStore } from './store';
import type { PeerWithStreams, VadStatus } from './types';

/**
 * All peers in the linked room, projected into composition streams. Flat list —
 * the worker is not a peer, so there is no local/remote split.
 */
export function usePeers<PeerMetadata = unknown, ServerMetadata = unknown>(): PeerWithStreams<
  PeerMetadata,
  ServerMetadata
>[] {
  const peers = useSyncExternalStore(compositionStore.subscribe, compositionStore.getPeers, compositionStore.getPeers);
  return peers as PeerWithStreams<PeerMetadata, ServerMetadata>[];
}

/**
 * The peer with the given `peerId`, or `undefined`.
 */
export function usePeer<PeerMetadata = unknown, ServerMetadata = unknown>(
  peerId: string
): PeerWithStreams<PeerMetadata, ServerMetadata> | undefined {
  const getSnapshot = useCallback(() => compositionStore.getPeer(peerId), [peerId]);
  const peer = useSyncExternalStore(compositionStore.subscribe, getSnapshot, getSnapshot);
  return peer as PeerWithStreams<PeerMetadata, ServerMetadata> | undefined;
}

/**
 * The linked room's id, or `undefined` when no room is linked.
 */
export function useRoom(): { id: string } | undefined {
  const roomId = useSyncExternalStore(
    compositionStore.subscribe,
    compositionStore.getRoomId,
    compositionStore.getRoomId
  );
  return roomId ? { id: roomId } : undefined;
}

/**
 * Voice-activity status for the peer identified by `peerId`: `'speech'` when any
 * of the peer's forwarded audio inputs is speaking, otherwise `'silence'`.
 */
export function useSpeakingState(peerId: string): VadStatus {
  const getSnapshot = useCallback(() => compositionStore.getVadStatus(peerId), [peerId]);
  return useSyncExternalStore(compositionStore.subscribe, getSnapshot, getSnapshot);
}
