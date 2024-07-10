import { Peer, RoomConfig } from 'fishjam-openapi';
import { ServerMessage } from './proto';

export type Room = {
  id: string;
  peers: Peer[];
  config: RoomConfig;
};

export type FishjamConfig = {
  fishjamUrl: string;
  serverToken: string;
};

export type NotificationEvents = {
  roomCreated: (message: ServerMessage) => void;
  roomDeleted: (message: ServerMessage) => void;
  roomCrashed: (message: ServerMessage) => void;
  peerAdded: (message: ServerMessage) => void;
  peerDeleted: (message: ServerMessage) => void;
  peerConnected: (message: ServerMessage) => void;
  peerDisconnected: (message: ServerMessage) => void;
  peerMetadataUpdated: (message: ServerMessage) => void;
  peerCrashed: (message: ServerMessage) => void;
  trackAdded: (message: ServerMessage) => void;
  trackRemoved: (message: ServerMessage) => void;
  trackMetadataUpdated: (message: ServerMessage) => void;
};
