import type {
  Room,
  VadStatus,
  PeerConnected,
  PeerDisconnected,
  PeerMetadataUpdated,
  TrackAdded,
  TrackForwarding,
  TrackForwardingRemoved,
  TrackMetadataUpdated,
  TrackRemoved,
  VadNotification,
} from '@fishjam-cloud/js-server-sdk';
import type { AudioTrackState, PeerWithStreams, Stream, VideoTrackState } from './types';

/**
 * Discriminated notifier event accepted by {@link CompositionStore.applyNotification}.
 * Each `FishjamWSNotifier` listener maps to one of these variants.
 */
export type CompositionEvent =
  | { type: 'peerConnected'; data: PeerConnected }
  | { type: 'peerDisconnected'; data: PeerDisconnected }
  | { type: 'peerMetadataUpdated'; data: PeerMetadataUpdated }
  | { type: 'trackAdded'; data: TrackAdded }
  | { type: 'trackRemoved'; data: TrackRemoved }
  | { type: 'trackMetadataUpdated'; data: TrackMetadataUpdated }
  | { type: 'trackForwarding'; data: TrackForwarding }
  | { type: 'trackForwardingRemoved'; data: TrackForwardingRemoved }
  | { type: 'vadNotification'; data: VadNotification };

/**
 * Complete snapshot of a linked room's state at a given moment.
 */
export type RoomSnapshot = {
  peers: PeerWithStreams[];
  roomId?: string;
  /** per-`inputId` voice activity, consumed by `useSpeakingState`. */
  vad: Record<string, VadStatus>;
};

type Metadata = Record<string, unknown>;

type InternalTrack = { id: string; metadata: Metadata };

type InternalStream = {
  inputId: string;
  video?: InternalTrack;
  audio?: InternalTrack;
};

type InternalPeer = {
  id: string;
  metadata: { peer: unknown; server: unknown };
  tracks: Map<string, InternalTrack>;
  streams: Map<string, InternalStream>;
};

const EMPTY_SNAPSHOT: RoomSnapshot = { peers: [], vad: {} };

const assertNever = (event: never): never => {
  throw new Error(`Unhandled composition event: ${JSON.stringify(event)}`);
};

const normalizeMetadata = (raw: string | object | null | undefined): Metadata => {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Metadata) : {};
    } catch {
      return {};
    }
  }
  return raw as Metadata;
};

const splitMetadata = (raw: string | object | null | undefined): { peer: unknown; server: unknown } => {
  const obj = normalizeMetadata(raw);
  return { peer: obj.peer, server: obj.server };
};

const roleOf = (stream: InternalStream): 'camera' | 'screenShare' | 'custom' => {
  const type = stream.video?.metadata.type ?? stream.audio?.metadata.type;
  if (type === 'camera') return 'camera';
  if (type === 'screenShare') return 'screenShare';
  return 'custom';
};

class CompositionStore {
  private peers = new Map<string, InternalPeer>();
  private roomId: string | undefined;
  /** trackId -> inputId, used to resolve VAD/metadata events to a stream. */
  private forwarding = new Map<string, string>();
  private vad = new Map<string, VadStatus>();

  private listeners = new Set<() => void>();
  private cachedSnapshot: RoomSnapshot | null = EMPTY_SNAPSHOT;

  readonly subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  readonly getSnapshot = (): RoomSnapshot => {
    if (this.cachedSnapshot === null) this.cachedSnapshot = this.buildSnapshot();
    return this.cachedSnapshot;
  };

  // -- backward-facing feed API ------------------------------------------------

  reset(): void {
    this.peers.clear();
    this.forwarding.clear();
    this.vad.clear();
    this.roomId = undefined;
    this.commit();
  }

  seedFromRoom(room: Room): void {
    this.peers.clear();
    this.forwarding.clear();
    this.vad.clear();
    this.roomId = room.id;

    for (const peer of room.peers) {
      const internal: InternalPeer = {
        id: peer.id,
        metadata: splitMetadata(peer.metadata),
        tracks: new Map(),
        streams: new Map(),
      };
      for (const track of peer.tracks ?? []) {
        if (!track.id) continue;
        internal.tracks.set(track.id, { id: track.id, metadata: normalizeMetadata(track.metadata) });
      }
      this.peers.set(peer.id, internal);
    }
    this.commit();
  }

  applyNotification(event: CompositionEvent): void {
    switch (event.type) {
      case 'peerConnected':
        this.onPeerConnected(event.data);
        break;
      case 'peerDisconnected':
        this.onPeerDisconnected(event.data);
        break;
      case 'peerMetadataUpdated':
        this.onPeerMetadataUpdated(event.data);
        break;
      case 'trackAdded':
        this.onTrackAdded(event.data);
        break;
      case 'trackRemoved':
        this.onTrackRemoved(event.data);
        break;
      case 'trackMetadataUpdated':
        this.onTrackMetadataUpdated(event.data);
        break;
      case 'trackForwarding':
        this.onTrackForwarding(event.data);
        break;
      case 'trackForwardingRemoved':
        this.onTrackForwardingRemoved(event.data);
        break;
      case 'vadNotification':
        this.onVadNotification(event.data);
        break;
      default:
        assertNever(event);
    }
    this.commit();
  }

  // -- reducer ---------------------------------------------------------------

  private ensurePeer(peerId: string): InternalPeer {
    let peer = this.peers.get(peerId);
    if (!peer) {
      peer = { id: peerId, metadata: { peer: undefined, server: undefined }, tracks: new Map(), streams: new Map() };
      this.peers.set(peerId, peer);
    }
    return peer;
  }

  private onPeerConnected(data: PeerConnected): void {
    this.ensurePeer(data.peerId);
  }

  private onPeerDisconnected(data: PeerDisconnected): void {
    const peer = this.peers.get(data.peerId);
    if (peer) {
      for (const inputId of peer.streams.keys()) this.vad.delete(inputId);
    }
    this.peers.delete(data.peerId);
    for (const key of this.forwarding.keys()) {
      if (key.startsWith(`${data.peerId}:`)) this.forwarding.delete(key);
    }
  }

  private onPeerMetadataUpdated(data: PeerMetadataUpdated): void {
    this.ensurePeer(data.peerId).metadata = splitMetadata(data.metadata);
  }

  private onTrackAdded(data: TrackAdded): void {
    if (!data.peerId || !data.track) return;
    const peer = this.ensurePeer(data.peerId);
    peer.tracks.set(data.track.id, { id: data.track.id, metadata: normalizeMetadata(data.track.metadata) });
  }

  private onTrackMetadataUpdated(data: TrackMetadataUpdated): void {
    if (!data.peerId || !data.track) return;
    const peer = this.peers.get(data.peerId);
    if (!peer) return;
    const metadata = normalizeMetadata(data.track.metadata);
    peer.tracks.set(data.track.id, { id: data.track.id, metadata });

    const inputId = this.forwarding.get(`${data.peerId}:${data.track.id}`);
    if (!inputId) return;
    const stream = peer.streams.get(inputId);
    if (!stream) return;
    if (stream.video?.id === data.track.id) stream.video = { id: data.track.id, metadata };
    if (stream.audio?.id === data.track.id) stream.audio = { id: data.track.id, metadata };
  }

  private onTrackRemoved(data: TrackRemoved): void {
    if (!data.peerId || !data.track) return;
    const peer = this.peers.get(data.peerId);
    if (!peer) return;
    peer.tracks.delete(data.track.id);

    const key = `${data.peerId}:${data.track.id}`;
    const inputId = this.forwarding.get(key);
    this.forwarding.delete(key);
    if (!inputId) return;
    const stream = peer.streams.get(inputId);
    if (!stream) return;
    if (stream.video?.id === data.track.id) stream.video = undefined;
    if (stream.audio?.id === data.track.id) stream.audio = undefined;
  }

  private onTrackForwarding(data: TrackForwarding): void {
    const peer = this.ensurePeer(data.peerId);
    const stream: InternalStream = peer.streams.get(data.inputId) ?? { inputId: data.inputId };

    if (data.videoTrack) {
      stream.video = { id: data.videoTrack.id, metadata: normalizeMetadata(data.videoTrack.metadata) };
      this.forwarding.set(`${data.peerId}:${data.videoTrack.id}`, data.inputId);
      peer.tracks.set(data.videoTrack.id, stream.video);
    }
    if (data.audioTrack) {
      stream.audio = { id: data.audioTrack.id, metadata: normalizeMetadata(data.audioTrack.metadata) };
      this.forwarding.set(`${data.peerId}:${data.audioTrack.id}`, data.inputId);
      peer.tracks.set(data.audioTrack.id, stream.audio);
    }
    peer.streams.set(data.inputId, stream);
  }

  private onTrackForwardingRemoved(data: TrackForwardingRemoved): void {
    const peer = this.peers.get(data.peerId);
    this.vad.delete(data.inputId);
    if (!peer) return;
    peer.streams.delete(data.inputId);
    for (const [key, inputId] of this.forwarding) {
      if (inputId === data.inputId && key.startsWith(`${data.peerId}:`)) this.forwarding.delete(key);
    }
  }

  private onVadNotification(data: VadNotification): void {
    const inputId = this.forwarding.get(`${data.peerId}:${data.trackId}`);
    if (!inputId) return;
    this.vad.set(inputId, data.status);
  }

  // -- snapshot --------------------------------------------------------------

  private commit(): void {
    this.cachedSnapshot = null;
    for (const cb of this.listeners) cb();
  }

  private buildSnapshot(): RoomSnapshot {
    const vad: Record<string, VadStatus> = {};
    for (const [inputId, status] of this.vad) vad[inputId] = status;

    const peers = Array.from(this.peers.values()).map((peer) => this.derivePeer(peer, vad));
    return { peers, roomId: this.roomId, vad };
  }

  private derivePeer(peer: InternalPeer, vad: Record<string, VadStatus>): PeerWithStreams {
    const streams: Stream[] = [];
    const customStreams: Stream[] = [];
    let cameraStream: Stream | undefined;
    let screenShareStream: Stream | undefined;

    for (const internal of peer.streams.values()) {
      const video: VideoTrackState | undefined = internal.video
        ? {
          id: internal.video.id,
          paused: Boolean(internal.video.metadata.paused),
          metadata: internal.video.metadata,
          type: 'video',
        }
        : undefined;
      const audio: AudioTrackState | undefined = internal.audio
        ? {
          id: internal.audio.id,
          paused: Boolean(internal.audio.metadata.paused),
          metadata: internal.audio.metadata,
          type: 'audio',
          ...(vad[internal.inputId] !== undefined ? { vadStatus: vad[internal.inputId] } : {}),
        }
        : undefined;

      const stream: Stream = { inputId: internal.inputId, video, audio };
      streams.push(stream);

      const role = roleOf(internal);
      if (role === 'camera') cameraStream = stream;
      else if (role === 'screenShare') screenShareStream = stream;
      else customStreams.push(stream);
    }

    return { id: peer.id, metadata: peer.metadata, streams, cameraStream, screenShareStream, customStreams };
  }
}

/** Module-level singleton shared by the hooks and the worker feed API. */
export const compositionStore = new CompositionStore();
