import {
  Peer as OpenApiPeer,
  PeerType as OpenApiPeerType,
  RoomConfig,
  TrackType as OpenApiTrackType,
} from '@fishjam-cloud/fishjam-openapi';

// branded types are useful for restricting where given value can be passed
declare const brand: unique symbol;
/**
 * Branded type helper
 */
export type Brand<T, TBrand extends string> = T & { [brand]: TBrand };

/**
 * Replaces the types of fields in `T` whose names appear in `M`, leaving the rest untouched.
 * Produces a flat object type (single mapped type, no `Omit & {...}` chain) so editor hover
 * displays the resulting properties directly.
 *
 * Keys present in `M` but not in `T` are ignored — only fields that already exist on `T`
 * are overridden, so a shared override map can be reused across multiple source types.
 *
 * `undefined` is re-added to the override when the original field allowed it, so optional
 * fields on generated proto types (e.g. `peerId?: string | undefined`) remain assignable
 * from `undefined` under `exactOptionalPropertyTypes`.
 */
export type Override<T, M> = {
  [K in keyof T]: K extends keyof M ? (undefined extends T[K] ? M[K] | undefined : M[K]) : T[K];
};

/**
 * ID of the Room.
 * Room can be created with {@link FishjamClient.createRoom}.
 */
export type RoomId = Brand<string, 'RoomId'>;
/**
 * ID of Peer. Peer is associated with Room and can be created with {@link FishjamClient.createPeer}.
 */
export type PeerId = Brand<string, 'PeerId'>;

export type Peer = Override<OpenApiPeer, { id: PeerId }>;

/**
 * Peer type as emitted by {@link FishjamWSNotifier}. Matches the REST API's `PeerType`,
 * with the addition of `'unspecified'` for messages whose peer type is not set on the wire.
 */
export type PeerType = OpenApiPeerType | 'unspecified';

/**
 * Track type as emitted by {@link FishjamWSNotifier}. Matches the REST API's `TrackType`,
 * with the addition of `'unspecified'` for messages whose track type is not set on the wire.
 */
export type TrackType = OpenApiTrackType | 'unspecified';

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
   * Management token is a secret token authorizing to perform actions on your account.
   * Never share this token with anyone.
   * Visit https://fishjam.io/app/ to get your Management Token.
   */
  managementToken: string;
};

// Websocket event handlers
export type ErrorEventHandler = (msg: Event) => void;
export type CloseEventHandler = (code: number, reason: string) => void;

export type AgentCallbacks = {
  onError?: ErrorEventHandler;
  onClose?: CloseEventHandler;
};
