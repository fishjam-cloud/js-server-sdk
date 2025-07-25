import { Peer as OpenApiPeer, RoomConfig } from '@fishjam-cloud/fishjam-openapi';

// branded types are useful for restricting where given value can be passed
declare const brand: unique symbol;
/**
 * Branded type helper
 */
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

/**
 * ID of the Room.
 * Room can be created with {@link FishjamClient.createRoom}.
 */
export type RoomId = Brand<string, 'RoomId'>;
/**
 * ID of Peer. Peer is associated with Room and can be created with {@link FishjamClient.createPeer}.
 */
export type PeerId = Brand<string, 'PeerId'>;

export type Peer = Omit<OpenApiPeer, 'id'> & { id: PeerId };

export type Room = {
  id: RoomId;
  peers: Peer[];
  config: RoomConfig;
};

export type FishjamConfig = {
  /*
   * Fishjam ID is a unique identifier for your account and environment.
   * Visit https://fishjam.io/app/ to get your Fishjam ID.
   */
  fishjamId: string;
  /*
   * @deprecated
   */
  fishjamUrl?: string;
  /*
   * Management token is a secret token authorizing to perform actions on your account.
   * Never share this token with anyone.
   * Visit https://fishjam.io/app/ to get your Management Token.
   */
  managementToken: string;
};
