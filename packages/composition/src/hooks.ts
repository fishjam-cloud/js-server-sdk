import { useCallback, useSyncExternalStore } from 'react';
import { compositionStore } from './store';
import type { PeerWithStreams, VadStatus } from './types';

/**
 * All peers in the linked room, projected into composition streams. Flat list —
 * the worker is not a peer, so there is no local/remote split.
 */
export function usePeers<PeerMetadata = unknown, ServerMetadata = unknown>(): {
  peers: PeerWithStreams<PeerMetadata, ServerMetadata>[];
} {
  const peers = useSyncExternalStore(compositionStore.subscribe, compositionStore.getPeers, compositionStore.getPeers);
  return { peers: peers as PeerWithStreams<PeerMetadata, ServerMetadata>[] };
}

/**
 * The peer that owns any {@link Stream} with the given `inputId`, or `undefined`.
 */
export function usePeer<PeerMetadata = unknown, ServerMetadata = unknown>(
  inputId: string
): PeerWithStreams<PeerMetadata, ServerMetadata> | undefined {
  const getSnapshot = useCallback(() => compositionStore.getPeer(inputId), [inputId]);
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
 * Voice-activity status for the input identified by `inputId`. Defaults to
 * `'silence'` until the first VAD notification for the input arrives.
 */
export function useSpeakingState(inputId: string): VadStatus {
  const getSnapshot = useCallback(() => compositionStore.getVadStatus(inputId), [inputId]);
  return useSyncExternalStore(compositionStore.subscribe, getSnapshot, getSnapshot);
}
