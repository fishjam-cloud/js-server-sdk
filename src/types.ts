import { Peer, RoomConfig } from './openapi';

export type Room = {
  id: string;
  peers: Peer[];
  config: RoomConfig;
};
