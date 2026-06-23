import { useSyncExternalStore } from 'react';
import { compositionStore } from './store';
import type { PeerWithStreams, VadStatus } from './types';

const useSnapshot = () =>
  useSyncExternalStore(compositionStore.subscribe, compositionStore.getSnapshot, compositionStore.getSnapshot);

/**
 * All peers in the linked room, projected into composition streams. Flat list —
 * the worker is not a peer, so there is no local/remote split.
 */
export function usePeers<PeerMetadata = unknown, ServerMetadata = unknown>(): {
  peers: PeerWithStreams<PeerMetadata, ServerMetadata>[];
} {
  const snapshot = useSnapshot();
  return { peers: snapshot.peers as PeerWithStreams<PeerMetadata, ServerMetadata>[] };
}

/**
 * The peer that owns any {@link Stream} with the given `inputId`, or `undefined`.
 */
export function usePeer<PeerMetadata = unknown, ServerMetadata = unknown>(
  inputId: string
): PeerWithStreams<PeerMetadata, ServerMetadata> | undefined {
  const snapshot = useSnapshot();
  const peer = snapshot.peers.find((p) => p.streams.some((s) => s.inputId === inputId));
  return peer as PeerWithStreams<PeerMetadata, ServerMetadata> | undefined;
}

/**
 * The linked room's id, or `undefined` when no room is linked.
 */
export function useRoom(): { id: string } | undefined {
  const snapshot = useSnapshot();
  if (!snapshot.roomId) return undefined;
  return { id: snapshot.roomId };
}

/**
 * Voice-activity status for the input identified by `inputId`. Defaults to
 * `'silence'` until the first VAD notification for the input arrives.
 */
export function useSpeakingState(inputId: string): VadStatus {
  const snapshot = useSnapshot();
  return snapshot.vad[inputId] ?? 'silence';
}
