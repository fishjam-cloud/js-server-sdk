import {
  ServerMessage,
  ServerMessage_PeerType,
  TrackType as ProtoTrackType,
  Track as ProtoTrack,
} from '@fishjam-cloud/fishjam-proto';
import { WithPeerId, WithRoomId } from './utils';

/**
 * Peer type as emitted by {@link FishjamWSNotifier}. Matches the REST API's `PeerType`,
 * with the addition of `'unspecified'` for messages whose peer type is not set on the wire.
 */
export type PeerType = 'webrtc' | 'agent' | 'vapi' | 'unspecified';

/**
 * Track type as emitted by {@link FishjamWSNotifier}. Matches the REST API's `TrackType`,
 * with the addition of `'unspecified'` for messages whose track type is not set on the wire.
 */
export type TrackType = 'audio' | 'video' | 'unspecified';

/**
 * Track payload embedded in {@link TrackAdded}, {@link TrackRemoved}, {@link TrackMetadataUpdated}.
 */
export type Track = {
  id: string;
  type: TrackType;
  metadata: string;
};

const peerTypeMap: Record<ServerMessage_PeerType, PeerType> = {
  [ServerMessage_PeerType.PEER_TYPE_UNSPECIFIED]: 'unspecified',
  [ServerMessage_PeerType.PEER_TYPE_WEBRTC]: 'webrtc',
  [ServerMessage_PeerType.PEER_TYPE_AGENT]: 'agent',
  [ServerMessage_PeerType.PEER_TYPE_VAPI]: 'vapi',
  [ServerMessage_PeerType.UNRECOGNIZED]: 'unspecified',
};

const trackTypeMap: Record<ProtoTrackType, TrackType> = {
  [ProtoTrackType.TRACK_TYPE_UNSPECIFIED]: 'unspecified',
  [ProtoTrackType.TRACK_TYPE_VIDEO]: 'video',
  [ProtoTrackType.TRACK_TYPE_AUDIO]: 'audio',
  [ProtoTrackType.UNRECOGNIZED]: 'unspecified',
};

export type ExpectedEvents =
  | 'roomCreated'
  | 'roomDeleted'
  | 'roomCrashed'
  | 'peerAdded'
  | 'peerDeleted'
  | 'peerConnected'
  | 'peerDisconnected'
  | 'peerMetadataUpdated'
  | 'peerCrashed'
  | 'streamConnected'
  | 'streamDisconnected'
  | 'viewerConnected'
  | 'viewerDisconnected'
  | 'trackAdded'
  | 'trackRemoved'
  | 'trackMetadataUpdated';

/**
 * `ServerMessage` oneof members that are intentionally NOT emitted to users.
 * Grouped with a brief rationale so the classification stays reviewable.
 * Mirrors the Python SDK's `IGNORED_NOTIFICATIONS` partition (FCE-3215).
 */
export type IgnoredEvents =
  // Handshake / request-side — never inbound notifications.
  | 'authenticated'
  | 'authRequest'
  | 'subscribeRequest'
  | 'subscribeResponse'
  // Currently unsurfaced server notifications — no consumer demand yet.
  | 'channelAdded'
  | 'channelRemoved'
  | 'trackForwarding'
  | 'trackForwardingRemoved'
  | 'vadNotification'
  | 'streamerConnected'
  | 'streamerDisconnected'
  | 'hlsPlayable'
  | 'hlsUploaded'
  | 'hlsUploadCrashed'
  | 'componentCrashed';

export const ignoredEventsList: ReadonlyArray<IgnoredEvents> = [
  'authenticated',
  'authRequest',
  'subscribeRequest',
  'subscribeResponse',
  'channelAdded',
  'channelRemoved',
  'trackForwarding',
  'trackForwardingRemoved',
  'vadNotification',
  'streamerConnected',
  'streamerDisconnected',
  'hlsPlayable',
  'hlsUploaded',
  'hlsUploadCrashed',
  'componentCrashed',
] as const;

/**
 * @inline
 */
type MessageWithIds = WithPeerId<WithRoomId<ServerMessage>>;

type WithMappedPeerType<T> = Omit<T, 'peerType'> & { peerType: PeerType };
type WithMappedTrack<T> = Omit<T, 'track'> & { track: Track | undefined };

/**
 * @inline
 */
export type Notifications = {
  roomCreated: NonNullable<MessageWithIds['roomCreated']>;
  roomDeleted: NonNullable<MessageWithIds['roomDeleted']>;
  roomCrashed: NonNullable<MessageWithIds['roomCrashed']>;
  peerAdded: WithMappedPeerType<NonNullable<MessageWithIds['peerAdded']>>;
  peerDeleted: WithMappedPeerType<NonNullable<MessageWithIds['peerDeleted']>>;
  peerConnected: WithMappedPeerType<NonNullable<MessageWithIds['peerConnected']>>;
  peerDisconnected: WithMappedPeerType<NonNullable<MessageWithIds['peerDisconnected']>>;
  peerMetadataUpdated: WithMappedPeerType<NonNullable<MessageWithIds['peerMetadataUpdated']>>;
  peerCrashed: WithMappedPeerType<NonNullable<MessageWithIds['peerCrashed']>>;
  streamConnected: NonNullable<MessageWithIds['streamConnected']>;
  streamDisconnected: NonNullable<MessageWithIds['streamDisconnected']>;
  viewerConnected: NonNullable<MessageWithIds['viewerConnected']>;
  viewerDisconnected: NonNullable<MessageWithIds['viewerDisconnected']>;
  trackAdded: WithMappedTrack<NonNullable<MessageWithIds['trackAdded']>>;
  trackRemoved: WithMappedTrack<NonNullable<MessageWithIds['trackRemoved']>>;
  trackMetadataUpdated: WithMappedTrack<NonNullable<MessageWithIds['trackMetadataUpdated']>>;
};

export type RoomCreated = Notifications['roomCreated'];
export type RoomDeleted = Notifications['roomDeleted'];
export type RoomCrashed = Notifications['roomCrashed'];
export type PeerAdded = Notifications['peerAdded'];
export type PeerDeleted = Notifications['peerDeleted'];
export type PeerConnected = Notifications['peerConnected'];
export type PeerDisconnected = Notifications['peerDisconnected'];
export type PeerMetadataUpdated = Notifications['peerMetadataUpdated'];
export type PeerCrashed = Notifications['peerCrashed'];
export type StreamConnected = Notifications['streamConnected'];
export type StreamDisconnected = Notifications['streamDisconnected'];
export type ViewerConnected = Notifications['viewerConnected'];
export type ViewerDisconnected = Notifications['viewerDisconnected'];
export type TrackAdded = Notifications['trackAdded'];
export type TrackRemoved = Notifications['trackRemoved'];
export type TrackMetadataUpdated = Notifications['trackMetadataUpdated'];

export const expectedEventsList: ReadonlyArray<ExpectedEvents> = [
  'roomCreated',
  'roomDeleted',
  'roomCrashed',
  'peerAdded',
  'peerDeleted',
  'peerConnected',
  'peerDisconnected',
  'peerMetadataUpdated',
  'peerCrashed',
  'streamConnected',
  'streamDisconnected',
  'viewerConnected',
  'viewerDisconnected',
  'trackAdded',
  'trackRemoved',
  'trackMetadataUpdated',
] as const;

export const peerEventsWithPeerType = new Set<ExpectedEvents>([
  'peerAdded',
  'peerDeleted',
  'peerConnected',
  'peerDisconnected',
  'peerMetadataUpdated',
  'peerCrashed',
]);

export const trackEvents = new Set<ExpectedEvents>(['trackAdded', 'trackRemoved', 'trackMetadataUpdated']);

const mapTrack = (track: ProtoTrack | undefined): Track | undefined =>
  track && { id: track.id, type: trackTypeMap[track.type], metadata: track.metadata };

export const mapNotification = (event: ExpectedEvents, msg: unknown): unknown => {
  if (peerEventsWithPeerType.has(event)) {
    const peerMsg = msg as { peerType: ServerMessage_PeerType };
    return { ...peerMsg, peerType: peerTypeMap[peerMsg.peerType] };
  }
  if (trackEvents.has(event)) {
    const trackMsg = msg as { track: ProtoTrack | undefined };
    return { ...trackMsg, track: mapTrack(trackMsg.track) };
  }
  return msg;
};

export type NotificationEvents = { [K in ExpectedEvents]: (message: Notifications[K]) => void };
