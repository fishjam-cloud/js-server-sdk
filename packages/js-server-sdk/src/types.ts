import { Peer as OpenApiPeer, RoomConfig } from '@fishjam-cloud/fishjam-openapi';

// branded types are useful for restricting where given value can be passed
declare const brand: unique symbol;
/**
 * Branded type
 */
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

export type RoomId = Brand<string, 'RoomId'>;
export type PeerId = Brand<string, 'PeerId'>;

export type Peer = Omit<OpenApiPeer, 'id'> & { id: PeerId };

export type Room = {
  id: RoomId;
  peers: Peer[];
  config: RoomConfig;
};

export type FishjamConfig = {
  fishjamUrl: string;
  managementToken: string;
};
