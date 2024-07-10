import { Peer, RoomConfig } from 'fishjam-openapi';

export type Room = {
  id: string;
  peers: Peer[];
  config: RoomConfig;
};

export type FishjamConfig = {
  fishjamUrl: string;
  serverToken: string;
};

export type allowedNotification =
  | 'roomCreated'
  | 'roomDeleted'
  | 'roomCrashed'
  | 'peerAdded'
  | 'peerDeleted'
  | 'peerConnected'
  | 'peerDisconnected'
  | 'peerMetadataUpdated'
  | 'peerCrashed'
  | 'trackAdded'
  | 'trackRemoved'
  | 'trackMetadataUpdated';
