import { Peer, RoomConfig } from 'fishjam-openapi';

export type Room = {
  id: string;
  peers: Peer[];
  config: RoomConfig;
};
