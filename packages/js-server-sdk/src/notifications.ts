import {
  ServerMessage,
  ServerMessage_PeerType,
  TrackType as ProtoTrackType,
  Track as ProtoTrack,
} from '@fishjam-cloud/fishjam-proto';
import { Override, PeerId, PeerType, RoomId, TrackType } from './types';

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

export const expectedEventsList = [
  'roomCreated',
  'roomDeleted',
  'roomCrashed',
  'peerAdded',
  'peerDeleted',
  'peerConnected',
  'peerDisconnected',
  'peerMetadataUpdated',
  'peerCrashed',
  'streamerConnected',
  'streamerDisconnected',
  'viewerConnected',
  'viewerDisconnected',
  'trackAdded',
  'trackRemoved',
  'trackMetadataUpdated',
  'channelAdded',
  'channelRemoved',
] as const;

export type ExpectedEvents = (typeof expectedEventsList)[number];

/**
 * `ServerMessage` oneof members that are intentionally NOT emitted to users.
 * Grouped with a brief rationale so the classification stays reviewable.
 * Mirrors the Python SDK's `IGNORED_NOTIFICATIONS` partition (FCE-3215).
 */
export const ignoredEventsList = [
  // Handshake / request-side — never inbound notifications.
  'authenticated',
  'authRequest',
  'subscribeRequest',
  'subscribeResponse',
  // Currently unsurfaced server notifications — no consumer demand yet.
  'trackForwarding',
  'trackForwardingRemoved',
  'vadNotification',
  // Webhook-only transport wrapper; the WebSocket notifier never receives it.
  'notificationBatch',
  // Deprecated
  'streamConnected',
  'streamDisconnected',
  'hlsPlayable',
  'hlsUploaded',
  'hlsUploadCrashed',
  'componentCrashed',
] as const;

export type IgnoredEvents = (typeof ignoredEventsList)[number];

/**
 * Field-level overrides applied to every notification payload: branded ID types
 * and the user-facing enums replace their raw protobuf counterparts. {@link Override}
 * only swaps keys that exist on the source type, so a single map covers all variants.
 *
 * @inline
 */
type NotificationOverrides = {
  roomId: RoomId;
  peerId: PeerId;
  peerType: PeerType;
  track: Track | undefined;
};

/** @inline */
type Notification<K extends keyof ServerMessage> = Override<NonNullable<ServerMessage[K]>, NotificationOverrides>;

/**
 * @inline
 */
export type Notifications = {
  roomCreated: Notification<'roomCreated'>;
  roomDeleted: Notification<'roomDeleted'>;
  roomCrashed: Notification<'roomCrashed'>;
  peerAdded: Notification<'peerAdded'>;
  peerDeleted: Notification<'peerDeleted'>;
  peerConnected: Notification<'peerConnected'>;
  peerDisconnected: Notification<'peerDisconnected'>;
  peerMetadataUpdated: Notification<'peerMetadataUpdated'>;
  peerCrashed: Notification<'peerCrashed'>;
  streamerConnected: Notification<'streamerConnected'>;
  streamerDisconnected: Notification<'streamerDisconnected'>;
  viewerConnected: Notification<'viewerConnected'>;
  viewerDisconnected: Notification<'viewerDisconnected'>;
  trackAdded: Notification<'trackAdded'>;
  trackRemoved: Notification<'trackRemoved'>;
  trackMetadataUpdated: Notification<'trackMetadataUpdated'>;
  channelAdded: Notification<'channelAdded'>;
  channelRemoved: Notification<'channelRemoved'>;
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
export type StreamerConnected = Notifications['streamerConnected'];
export type StreamerDisconnected = Notifications['streamerDisconnected'];
export type ViewerConnected = Notifications['viewerConnected'];
export type ViewerDisconnected = Notifications['viewerDisconnected'];
export type TrackAdded = Notifications['trackAdded'];
export type TrackRemoved = Notifications['trackRemoved'];
export type TrackMetadataUpdated = Notifications['trackMetadataUpdated'];
export type ChannelAdded = Notifications['channelAdded'];
export type ChannelRemoved = Notifications['channelRemoved'];

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
