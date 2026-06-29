/**
 * React hooks for composition templates receiving track forwardings from rooms.
 * Templates have access to a room's state (peers, tracks, voice activity).
 *
 * @packageDocumentation
 */
export { usePeers, usePeer, useRoom, useSpeakingState } from './hooks';
export type { PeerWithStreams, Stream, TrackState, VideoTrackState, AudioTrackState, VadStatus } from './types';
export { eventBus } from './eventBus';
export type { CompositionEventBus } from './eventBus';
