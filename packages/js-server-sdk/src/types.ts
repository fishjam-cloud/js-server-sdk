import { Peer as OpenApiPeer, RoomConfigRoomTypeEnum, RoomConfigVideoCodecEnum } from '@fishjam-cloud/fishjam-openapi';

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
  config: RoomOptions;
};

export type FishjamConfig = {
  fishjamUrl: string;
  managementToken: string;
};

export type RoomOptions = {
  /**
   * Maximum amount of peers allowed into the room
   * @type {number}
   */
  maxPeers?: number | null;
  /**
   * Duration (in seconds) after which the peer will be removed if it is disconnected. If not provided, this feature is disabled.
   * @type {number}
   */
  peerDisconnectedTimeout?: number | null;
  /**
   * Duration (in seconds) after which the room will be removed if no peers are connected. If not provided, this feature is disabled.
   * @type {number}
   */
  peerlessPurgeTimeout?: number | null;
  /**
   * The use-case of the room. If not provided, this defaults to full_feature.
   * @type {string}
   */
  roomType?: RoomConfigRoomTypeEnum | 'livestream';
  /**
   * Enforces video codec for each peer in the room
   * @type {string}
   */
  videoCodec?: RoomConfigVideoCodecEnum | null;
  /**
   * URL where Fishjam notifications will be sent
   * @type {string}
   */
  webhookUrl?: string | null;
};
