/**
 * Server-side Node.js SDK for creating and managing Fishjam rooms, peers, agents, and receiving real-time server notifications.
 *
 * @packageDocumentation
 */
export {
  PeerStatus,
  RoomConfig,
  PeerOptions,
  PeerOptionsWebRTC,
  PeerOptionsAgent,
  PeerOptionsVapi,
  VideoCodec,
  RoomType,
  ViewerToken,
  StreamerToken,
  MoqToken,
} from '@fishjam-cloud/fishjam-openapi';

export { ServerMessage } from '@fishjam-cloud/fishjam-proto';
export { FishjamWSNotifier } from './ws_notifier';
export type {
  PeerType,
  TrackType,
  Track,
  ExpectedEvents,
  IgnoredEvents,
  RoomCreated,
  RoomDeleted,
  RoomCrashed,
  PeerAdded,
  PeerDeleted,
  PeerConnected,
  PeerDisconnected,
  PeerMetadataUpdated,
  PeerCrashed,
  StreamConnected,
  StreamDisconnected,
  ViewerConnected,
  ViewerDisconnected,
  TrackAdded,
  TrackRemoved,
  TrackMetadataUpdated,
  NotificationEvents,
} from './notifications';
export { FishjamAgent } from './agent';
export type * from './agent';
export { FishjamClient } from './client';
export * from './exceptions';
export type * from './types';
