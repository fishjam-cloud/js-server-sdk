import type { VadStatus } from '@fishjam-cloud/js-server-sdk';

export type { VadStatus };

/**
 * State of a single fishjam track.
 * The `paused` flag mirrors the track's mute state.
 */
export type TrackState = {
  /** fishjam track id */
  id: string;
  /** mute state, read from the built-in `paused` metadata key */
  paused: boolean;
  metadata: Record<string, unknown>;
};

export type VideoTrackState = TrackState & { type: 'video' };
export type AudioTrackState = TrackState & { type: 'audio' };

/**
 * A forwarded input.
 * `inputId` is the handle a template passes to `<InputStream inputId={...} />`.
 * A stream carries at most one video and one audio track.
 */
export type Stream = {
  inputId: string;
  video?: VideoTrackState;
  audio?: AudioTrackState;
};

/**
 * A room peer projected for composition templates.
 * Streams are split by role: camera, screen share, or custom.
 * The camera stream's audio is the peer's mic.
 */
export type PeerWithStreams<PeerMetadata = unknown, ServerMetadata = unknown> = {
  id: string;
  metadata: { peer: PeerMetadata; server: ServerMetadata };
  streams: Stream[];
  cameraStream?: Stream;
  screenShareStream?: Stream;
  customStreams: Stream[];
};
