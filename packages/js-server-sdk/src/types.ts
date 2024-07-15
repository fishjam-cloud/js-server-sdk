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
