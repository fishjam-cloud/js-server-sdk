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
  TrackType,
} from '@fishjam-cloud/js-server-sdk';
import type { PeerWithStreams, Stream } from './types';

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

type InternalTrack = { id: string; metadata: Metadata; inputId?: string; type: TrackType };

type InternalPeer = {
  id: string;
  metadata: { peer: unknown; server: unknown };
  tracks: Map<string, InternalTrack>;
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

const roleOf = (stream: Stream): 'camera' | 'screenShare' | 'custom' => {
  const type = stream.video?.metadata.type ?? stream.audio?.metadata.type;
  if (type === 'camera' || type === 'microphone') return 'camera';
  if (type === 'screenShareVideo' || type === 'screenShareAudio') return 'screenShare';
  return 'custom';
};

class CompositionStore {
  private peers = new Map<string, InternalPeer>();
  private roomId: string | undefined;
  /** trackId -> inputId, used to resolve VAD/metadata events to a stream. */
  private vad = new Map<string, VadStatus>();

  private listeners = new Set<() => void>();
  private cachedSnapshot: RoomSnapshot | null = EMPTY_SNAPSHOT;
  private cachedPeers: PeerWithStreams[] = EMPTY_SNAPSHOT.peers;

  readonly subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  readonly getSnapshot = (): RoomSnapshot => {
    if (this.cachedSnapshot === null) {
      this.cachedSnapshot = { peers: this.cachedPeers, roomId: this.roomId, vad: this.vadRecord() };
    }
    return this.cachedSnapshot;
  };

  readonly getPeers = (): PeerWithStreams[] => this.cachedPeers;

  readonly getPeer = (inputId: string): PeerWithStreams | undefined =>
    this.getPeers().find((peer) => peer.streams.some((stream) => stream.inputId === inputId));

  readonly getRoomId = (): string | undefined => this.roomId;

  readonly getVadStatus = (inputId: string): VadStatus => this.vad.get(inputId) ?? 'silence';

  // -- backward-facing feed API ------------------------------------------------

  reset(): void {
    this.peers.clear();
    this.vad.clear();
    this.roomId = undefined;
    this.cachedSnapshot = null;
    this.cachedPeers = [];

    this.commit();
  }

  seedFromRoom(room: Room): void {
    this.peers.clear();
    this.vad.clear();
    this.roomId = room.id;

    for (const peer of room.peers) {
      const internal: InternalPeer = {
        id: peer.id,
        metadata: splitMetadata(peer.metadata),
        tracks: new Map(),
      };
      for (const track of peer.tracks ?? []) {
        if (!track.id) continue;
        internal.tracks.set(track.id, { id: track.id, metadata: normalizeMetadata(track.metadata), type: track.type! });
      }
      this.peers.set(peer.id, internal);
    }

    this.rebuildPeers();
    this.commit();
  }

  applyNotification(event: CompositionEvent): void {
    if (event.data.roomId !== this.roomId) return;

    let changed: boolean;
    switch (event.type) {
      case 'peerConnected':
        changed = this.onPeerConnected(event.data);
        break;
      case 'peerDisconnected':
        changed = this.onPeerDisconnected(event.data);
        break;
      case 'peerMetadataUpdated':
        changed = this.onPeerMetadataUpdated(event.data);
        break;
      case 'trackAdded':
        changed = this.onTrackAdded(event.data);
        break;
      case 'trackRemoved':
        changed = this.onTrackRemoved(event.data);
        break;
      case 'trackMetadataUpdated':
        changed = this.onTrackMetadataUpdated(event.data);
        break;
      case 'trackForwarding':
        changed = this.onTrackForwarding(event.data);
        break;
      case 'trackForwardingRemoved':
        changed = this.onTrackForwardingRemoved(event.data);
        break;
      case 'vadNotification':
        changed = this.onVadNotification(event.data);
        break;
      default:
        return assertNever(event);
    }
    if (changed) this.commit();
  }

  private ensurePeer(peerId: string): InternalPeer {
    let peer = this.peers.get(peerId);
    if (!peer) {
      peer = { id: peerId, metadata: { peer: undefined, server: undefined }, tracks: new Map() };
      this.peers.set(peerId, peer);
    }
    return peer;
  }

  private onPeerConnected(data: PeerConnected): boolean {
    if (this.peers.has(data.peerId)) return false;
    this.ensurePeer(data.peerId);
    this.replacePeer(data.peerId);
    return true;
  }

  private onPeerDisconnected(data: PeerDisconnected): boolean {
    const peer = this.peers.get(data.peerId);
    if (!peer) return false;

    for (const { inputId } of peer.tracks.values()) if (inputId) this.vad.delete(inputId);
    this.peers.delete(data.peerId);

    this.replacePeer(data.peerId);
    return true;
  }

  private onPeerMetadataUpdated(data: PeerMetadataUpdated): boolean {
    this.ensurePeer(data.peerId).metadata = splitMetadata(data.metadata);
    this.replacePeer(data.peerId);
    return true;
  }

  private onTrackAdded(data: TrackAdded): boolean {
    if (!data.peerId || !data.track) return false;

    const peer = this.ensurePeer(data.peerId);
    peer.tracks.set(data.track.id, {
      id: data.track.id,
      metadata: normalizeMetadata(data.track.metadata),
      type: data.track.type,
    });
    this.replacePeer(data.peerId);
    return true;
  }

  private onTrackMetadataUpdated(data: TrackMetadataUpdated): boolean {
    if (!data.peerId || !data.track) return false;

    const peer = this.peers.get(data.peerId);
    if (!peer) return false;

    const metadata = normalizeMetadata(data.track.metadata);
    const inputId = peer.tracks.get(data.track.id)?.inputId;
    peer.tracks.set(data.track.id, { id: data.track.id, metadata, type: data.track.type, inputId });

    this.replacePeer(data.peerId);
    return true;
  }

  private onTrackRemoved(data: TrackRemoved): boolean {
    if (!data.peerId || !data.track) return false;

    const peer = this.peers.get(data.peerId);
    if (!peer) return false;
    if (!peer.tracks.delete(data.track.id)) return false;

    this.replacePeer(data.peerId);
    return true;
  }

  private onTrackForwarding(data: TrackForwarding): boolean {
    const peer = this.ensurePeer(data.peerId);

    if (data.videoTrack) {
      peer.tracks.set(data.videoTrack.id, {
        id: data.videoTrack.id,
        metadata: normalizeMetadata(data.videoTrack.metadata),
        inputId: data.inputId,
        type: data.videoTrack.type,
      });
    }
    if (data.audioTrack) {
      peer.tracks.set(data.audioTrack.id, {
        id: data.audioTrack.id,
        metadata: normalizeMetadata(data.audioTrack.metadata),
        inputId: data.inputId,
        type: data.audioTrack.type,
      });
    }
    this.replacePeer(data.peerId);
    return true;
  }

  private onTrackForwardingRemoved(data: TrackForwardingRemoved): boolean {
    let changed = this.vad.delete(data.inputId);
    const peer = this.peers.get(data.peerId);
    if (!peer) {
      if (changed) this.cachedSnapshot = null;
      return changed;
    }

    for (const track of peer.tracks.values()) {
      if (track.inputId === data.inputId) {
        track.inputId = undefined;
        changed = true;
      }
    }

    if (changed) this.replacePeer(data.peerId);
    return changed;
  }

  private onVadNotification(data: VadNotification): boolean {
    const peer = this.peers.get(data.peerId);
    if (!peer) return false;

    const track = peer.tracks.get(data.trackId);
    if (!track || !track.inputId) return false;
    if (this.vad.get(track.inputId) === data.status) return false;

    this.vad.set(track.inputId, data.status);
    this.replacePeer(data.peerId);
    return true;
  }

  private commit(): void {
    for (const cb of this.listeners) cb();
  }

  /**
   * Update `cachedPeers` array, reusing every other peer's reference.
   */
  private replacePeer(peerId: string): void {
    const internal = this.peers.get(peerId);
    const next = this.cachedPeers.slice();
    const idx = next.findIndex((peer) => peer.id === peerId);
    if (!internal) {
      if (idx >= 0) next.splice(idx, 1);
    } else if (idx >= 0) {
      next[idx] = this.derivePeer(internal, this.vadRecord());
    } else {
      next.push(this.derivePeer(internal, this.vadRecord()));
    }
    this.cachedPeers = next;
    this.cachedSnapshot = null;
  }

  private rebuildPeers(): void {
    const vad = this.vadRecord();
    this.cachedPeers = Array.from(this.peers.values(), (peer) => this.derivePeer(peer, vad));
    this.cachedSnapshot = null;
  }

  private vadRecord(): Record<string, VadStatus> {
    const vad: Record<string, VadStatus> = {};
    for (const [inputId, status] of this.vad) vad[inputId] = status;
    return vad;
  }

  private derivePeer(peer: InternalPeer, vad: Record<string, VadStatus>): PeerWithStreams {
    const streams = new Map<string, Stream>();
    let cameraStream: Stream | undefined;
    let screenShareStream: Stream | undefined;
    const customStreams: Stream[] = [];

    for (const track of peer.tracks.values()) {
      if (!track.inputId) continue;
      const stream: Stream = streams.get(track.inputId) || { inputId: track.inputId };
      if (track.type === 'audio')
        stream.audio = {
          id: track.id,
          paused: Boolean(track.metadata.paused),
          metadata: track.metadata,
          type: 'audio',
          vadStatus: vad[track.inputId],
        };
      else
        stream.video = {
          id: track.id,
          paused: Boolean(track.metadata.paused),
          metadata: track.metadata,
          type: 'video',
        };
      streams.set(track.inputId, stream);
    }

    for (const stream of streams.values()) {
      const role = roleOf(stream);
      switch (role) {
        case 'camera':
          cameraStream = stream;
          break;
        case 'screenShare':
          screenShareStream = stream;
          break;
        default:
          customStreams.push(stream);
      }
    }

    return {
      id: peer.id,
      metadata: peer.metadata,
      streams: Array.from(streams.values()),
      cameraStream,
      screenShareStream,
      customStreams,
    };
  }
}

export const compositionStore = new CompositionStore();
