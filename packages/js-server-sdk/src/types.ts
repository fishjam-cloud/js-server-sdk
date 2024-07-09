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
