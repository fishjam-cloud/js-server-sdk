/* eslint-disable */
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "jellyfish";

/** Defines any type of message passed between JF and server client */
export interface ServerMessage {
  roomCrashed?: ServerMessage_RoomCrashed | undefined;
  peerConnected?: ServerMessage_PeerConnected | undefined;
  peerDisconnected?: ServerMessage_PeerDisconnected | undefined;
  peerCrashed?: ServerMessage_PeerCrashed | undefined;
  componentCrashed?: ServerMessage_ComponentCrashed | undefined;
  authenticated?: ServerMessage_Authenticated | undefined;
  authRequest?: ServerMessage_AuthRequest | undefined;
  subscribeRequest?: ServerMessage_SubscribeRequest | undefined;
  subscribeResponse?: ServerMessage_SubscribeResponse | undefined;
  roomCreated?: ServerMessage_RoomCreated | undefined;
  roomDeleted?: ServerMessage_RoomDeleted | undefined;
  metricsReport?: ServerMessage_MetricsReport | undefined;
  hlsPlayable?: ServerMessage_HlsPlayable | undefined;
  hlsUploaded?: ServerMessage_HlsUploaded | undefined;
  hlsUploadCrashed?: ServerMessage_HlsUploadCrashed | undefined;
  peerMetadataUpdated?: ServerMessage_PeerMetadataUpdated | undefined;
  trackAdded?: ServerMessage_TrackAdded | undefined;
  trackRemoved?: ServerMessage_TrackRemoved | undefined;
  trackMetadataUpdated?: ServerMessage_TrackMetadataUpdated | undefined;
}

/** Defines message groups for which client can subscribe */
export enum ServerMessage_EventType {
  EVENT_TYPE_UNSPECIFIED = 0,
  EVENT_TYPE_SERVER_NOTIFICATION = 1,
  EVENT_TYPE_METRICS = 2,
  UNRECOGNIZED = -1,
}

export function serverMessage_EventTypeFromJSON(object: any): ServerMessage_EventType {
  switch (object) {
    case 0:
    case "EVENT_TYPE_UNSPECIFIED":
      return ServerMessage_EventType.EVENT_TYPE_UNSPECIFIED;
    case 1:
    case "EVENT_TYPE_SERVER_NOTIFICATION":
      return ServerMessage_EventType.EVENT_TYPE_SERVER_NOTIFICATION;
    case 2:
    case "EVENT_TYPE_METRICS":
      return ServerMessage_EventType.EVENT_TYPE_METRICS;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ServerMessage_EventType.UNRECOGNIZED;
  }
}

export function serverMessage_EventTypeToJSON(object: ServerMessage_EventType): string {
  switch (object) {
    case ServerMessage_EventType.EVENT_TYPE_UNSPECIFIED:
      return "EVENT_TYPE_UNSPECIFIED";
    case ServerMessage_EventType.EVENT_TYPE_SERVER_NOTIFICATION:
      return "EVENT_TYPE_SERVER_NOTIFICATION";
    case ServerMessage_EventType.EVENT_TYPE_METRICS:
      return "EVENT_TYPE_METRICS";
    case ServerMessage_EventType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

/** Defines types of tracks being published by peers and component */
export enum ServerMessage_TrackType {
  TRACK_TYPE_UNSPECIFIED = 0,
  TRACK_TYPE_VIDEO = 1,
  TRACK_TYPE_AUDIO = 2,
  UNRECOGNIZED = -1,
}

export function serverMessage_TrackTypeFromJSON(object: any): ServerMessage_TrackType {
  switch (object) {
    case 0:
    case "TRACK_TYPE_UNSPECIFIED":
      return ServerMessage_TrackType.TRACK_TYPE_UNSPECIFIED;
    case 1:
    case "TRACK_TYPE_VIDEO":
      return ServerMessage_TrackType.TRACK_TYPE_VIDEO;
    case 2:
    case "TRACK_TYPE_AUDIO":
      return ServerMessage_TrackType.TRACK_TYPE_AUDIO;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ServerMessage_TrackType.UNRECOGNIZED;
  }
}

export function serverMessage_TrackTypeToJSON(object: ServerMessage_TrackType): string {
  switch (object) {
    case ServerMessage_TrackType.TRACK_TYPE_UNSPECIFIED:
      return "TRACK_TYPE_UNSPECIFIED";
    case ServerMessage_TrackType.TRACK_TYPE_VIDEO:
      return "TRACK_TYPE_VIDEO";
    case ServerMessage_TrackType.TRACK_TYPE_AUDIO:
      return "TRACK_TYPE_AUDIO";
    case ServerMessage_TrackType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

/** Notification sent when a room crashes */
export interface ServerMessage_RoomCrashed {
  roomId: string;
}

/** Notification sent when a peer is added */
export interface ServerMessage_PeerAdded {
  roomId: string;
  peerId: string;
}

/** Notification sent when a peer is removed */
export interface ServerMessage_PeerDeleted {
  roomId: string;
  peerId: string;
}

/** Notification sent when a peer connects */
export interface ServerMessage_PeerConnected {
  roomId: string;
  peerId: string;
}

/** Notification sent when a peer disconnects from JF */
export interface ServerMessage_PeerDisconnected {
  roomId: string;
  peerId: string;
}

/** Notification sent when a peer crashes */
export interface ServerMessage_PeerCrashed {
  roomId: string;
  peerId: string;
  reason: string;
}

/** Notification sent when a component crashes */
export interface ServerMessage_ComponentCrashed {
  roomId: string;
  componentId: string;
}

/** Response sent by JF, confirming successfull authentication */
export interface ServerMessage_Authenticated {
}

/** Request sent by client, to authenticate to JF server */
export interface ServerMessage_AuthRequest {
  token: string;
}

/** Request sent by client to subsribe for certain message type */
export interface ServerMessage_SubscribeRequest {
  eventType: ServerMessage_EventType;
}

/** Response sent by JF, confirming subscription for message type */
export interface ServerMessage_SubscribeResponse {
  eventType: ServerMessage_EventType;
}

/** Notification sent when a room is created */
export interface ServerMessage_RoomCreated {
  roomId: string;
}

/** Notification sent when a room is deleted */
export interface ServerMessage_RoomDeleted {
  roomId: string;
}

/** Message containing WebRTC metrics from JF */
export interface ServerMessage_MetricsReport {
  metrics: string;
}

/** Notification sent when the HLS stream becomes available in a room */
export interface ServerMessage_HlsPlayable {
  roomId: string;
  componentId: string;
}

/** Notification sent when the HLS recording is successfully uploded to AWS S3 */
export interface ServerMessage_HlsUploaded {
  roomId: string;
}

/** Notification sent when the upload of HLS recording to AWS S3 fails */
export interface ServerMessage_HlsUploadCrashed {
  roomId: string;
}

/** Notification sent when peer updates its metadata */
export interface ServerMessage_PeerMetadataUpdated {
  roomId: string;
  peerId: string;
  metadata: string;
}

/** Describes a media track */
export interface ServerMessage_Track {
  id: string;
  type: ServerMessage_TrackType;
  metadata: string;
}

/** Notification sent when peer or component adds new track */
export interface ServerMessage_TrackAdded {
  roomId: string;
  peerId?: string | undefined;
  componentId?: string | undefined;
  track: ServerMessage_Track | undefined;
}

/** Notification sent when a track is removed */
export interface ServerMessage_TrackRemoved {
  roomId: string;
  peerId?: string | undefined;
  componentId?: string | undefined;
  track: ServerMessage_Track | undefined;
}

/** Notification sent when metadata of a multimedia track is updated */
export interface ServerMessage_TrackMetadataUpdated {
  roomId: string;
  peerId?: string | undefined;
  componentId?: string | undefined;
  track: ServerMessage_Track | undefined;
}

function createBaseServerMessage(): ServerMessage {
  return {
    roomCrashed: undefined,
    peerConnected: undefined,
    peerDisconnected: undefined,
    peerCrashed: undefined,
    componentCrashed: undefined,
    authenticated: undefined,
    authRequest: undefined,
    subscribeRequest: undefined,
    subscribeResponse: undefined,
    roomCreated: undefined,
    roomDeleted: undefined,
    metricsReport: undefined,
    hlsPlayable: undefined,
    hlsUploaded: undefined,
    hlsUploadCrashed: undefined,
    peerMetadataUpdated: undefined,
    trackAdded: undefined,
    trackRemoved: undefined,
    trackMetadataUpdated: undefined,
  };
}

export const ServerMessage = {
  encode(message: ServerMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomCrashed !== undefined) {
      ServerMessage_RoomCrashed.encode(message.roomCrashed, writer.uint32(10).fork()).ldelim();
    }
    if (message.peerConnected !== undefined) {
      ServerMessage_PeerConnected.encode(message.peerConnected, writer.uint32(18).fork()).ldelim();
    }
    if (message.peerDisconnected !== undefined) {
      ServerMessage_PeerDisconnected.encode(message.peerDisconnected, writer.uint32(26).fork()).ldelim();
    }
    if (message.peerCrashed !== undefined) {
      ServerMessage_PeerCrashed.encode(message.peerCrashed, writer.uint32(34).fork()).ldelim();
    }
    if (message.componentCrashed !== undefined) {
      ServerMessage_ComponentCrashed.encode(message.componentCrashed, writer.uint32(42).fork()).ldelim();
    }
    if (message.authenticated !== undefined) {
      ServerMessage_Authenticated.encode(message.authenticated, writer.uint32(50).fork()).ldelim();
    }
    if (message.authRequest !== undefined) {
      ServerMessage_AuthRequest.encode(message.authRequest, writer.uint32(58).fork()).ldelim();
    }
    if (message.subscribeRequest !== undefined) {
      ServerMessage_SubscribeRequest.encode(message.subscribeRequest, writer.uint32(66).fork()).ldelim();
    }
    if (message.subscribeResponse !== undefined) {
      ServerMessage_SubscribeResponse.encode(message.subscribeResponse, writer.uint32(74).fork()).ldelim();
    }
    if (message.roomCreated !== undefined) {
      ServerMessage_RoomCreated.encode(message.roomCreated, writer.uint32(82).fork()).ldelim();
    }
    if (message.roomDeleted !== undefined) {
      ServerMessage_RoomDeleted.encode(message.roomDeleted, writer.uint32(90).fork()).ldelim();
    }
    if (message.metricsReport !== undefined) {
      ServerMessage_MetricsReport.encode(message.metricsReport, writer.uint32(98).fork()).ldelim();
    }
    if (message.hlsPlayable !== undefined) {
      ServerMessage_HlsPlayable.encode(message.hlsPlayable, writer.uint32(106).fork()).ldelim();
    }
    if (message.hlsUploaded !== undefined) {
      ServerMessage_HlsUploaded.encode(message.hlsUploaded, writer.uint32(114).fork()).ldelim();
    }
    if (message.hlsUploadCrashed !== undefined) {
      ServerMessage_HlsUploadCrashed.encode(message.hlsUploadCrashed, writer.uint32(122).fork()).ldelim();
    }
    if (message.peerMetadataUpdated !== undefined) {
      ServerMessage_PeerMetadataUpdated.encode(message.peerMetadataUpdated, writer.uint32(130).fork()).ldelim();
    }
    if (message.trackAdded !== undefined) {
      ServerMessage_TrackAdded.encode(message.trackAdded, writer.uint32(138).fork()).ldelim();
    }
    if (message.trackRemoved !== undefined) {
      ServerMessage_TrackRemoved.encode(message.trackRemoved, writer.uint32(146).fork()).ldelim();
    }
    if (message.trackMetadataUpdated !== undefined) {
      ServerMessage_TrackMetadataUpdated.encode(message.trackMetadataUpdated, writer.uint32(154).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomCrashed = ServerMessage_RoomCrashed.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerConnected = ServerMessage_PeerConnected.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.peerDisconnected = ServerMessage_PeerDisconnected.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.peerCrashed = ServerMessage_PeerCrashed.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.componentCrashed = ServerMessage_ComponentCrashed.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.authenticated = ServerMessage_Authenticated.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.authRequest = ServerMessage_AuthRequest.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.subscribeRequest = ServerMessage_SubscribeRequest.decode(reader, reader.uint32());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.subscribeResponse = ServerMessage_SubscribeResponse.decode(reader, reader.uint32());
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.roomCreated = ServerMessage_RoomCreated.decode(reader, reader.uint32());
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.roomDeleted = ServerMessage_RoomDeleted.decode(reader, reader.uint32());
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.metricsReport = ServerMessage_MetricsReport.decode(reader, reader.uint32());
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.hlsPlayable = ServerMessage_HlsPlayable.decode(reader, reader.uint32());
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.hlsUploaded = ServerMessage_HlsUploaded.decode(reader, reader.uint32());
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.hlsUploadCrashed = ServerMessage_HlsUploadCrashed.decode(reader, reader.uint32());
          continue;
        case 16:
          if (tag !== 130) {
            break;
          }

          message.peerMetadataUpdated = ServerMessage_PeerMetadataUpdated.decode(reader, reader.uint32());
          continue;
        case 17:
          if (tag !== 138) {
            break;
          }

          message.trackAdded = ServerMessage_TrackAdded.decode(reader, reader.uint32());
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.trackRemoved = ServerMessage_TrackRemoved.decode(reader, reader.uint32());
          continue;
        case 19:
          if (tag !== 154) {
            break;
          }

          message.trackMetadataUpdated = ServerMessage_TrackMetadataUpdated.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage {
    return {
      roomCrashed: isSet(object.roomCrashed) ? ServerMessage_RoomCrashed.fromJSON(object.roomCrashed) : undefined,
      peerConnected: isSet(object.peerConnected)
        ? ServerMessage_PeerConnected.fromJSON(object.peerConnected)
        : undefined,
      peerDisconnected: isSet(object.peerDisconnected)
        ? ServerMessage_PeerDisconnected.fromJSON(object.peerDisconnected)
        : undefined,
      peerCrashed: isSet(object.peerCrashed) ? ServerMessage_PeerCrashed.fromJSON(object.peerCrashed) : undefined,
      componentCrashed: isSet(object.componentCrashed)
        ? ServerMessage_ComponentCrashed.fromJSON(object.componentCrashed)
        : undefined,
      authenticated: isSet(object.authenticated)
        ? ServerMessage_Authenticated.fromJSON(object.authenticated)
        : undefined,
      authRequest: isSet(object.authRequest) ? ServerMessage_AuthRequest.fromJSON(object.authRequest) : undefined,
      subscribeRequest: isSet(object.subscribeRequest)
        ? ServerMessage_SubscribeRequest.fromJSON(object.subscribeRequest)
        : undefined,
      subscribeResponse: isSet(object.subscribeResponse)
        ? ServerMessage_SubscribeResponse.fromJSON(object.subscribeResponse)
        : undefined,
      roomCreated: isSet(object.roomCreated) ? ServerMessage_RoomCreated.fromJSON(object.roomCreated) : undefined,
      roomDeleted: isSet(object.roomDeleted) ? ServerMessage_RoomDeleted.fromJSON(object.roomDeleted) : undefined,
      metricsReport: isSet(object.metricsReport)
        ? ServerMessage_MetricsReport.fromJSON(object.metricsReport)
        : undefined,
      hlsPlayable: isSet(object.hlsPlayable) ? ServerMessage_HlsPlayable.fromJSON(object.hlsPlayable) : undefined,
      hlsUploaded: isSet(object.hlsUploaded) ? ServerMessage_HlsUploaded.fromJSON(object.hlsUploaded) : undefined,
      hlsUploadCrashed: isSet(object.hlsUploadCrashed)
        ? ServerMessage_HlsUploadCrashed.fromJSON(object.hlsUploadCrashed)
        : undefined,
      peerMetadataUpdated: isSet(object.peerMetadataUpdated)
        ? ServerMessage_PeerMetadataUpdated.fromJSON(object.peerMetadataUpdated)
        : undefined,
      trackAdded: isSet(object.trackAdded) ? ServerMessage_TrackAdded.fromJSON(object.trackAdded) : undefined,
      trackRemoved: isSet(object.trackRemoved) ? ServerMessage_TrackRemoved.fromJSON(object.trackRemoved) : undefined,
      trackMetadataUpdated: isSet(object.trackMetadataUpdated)
        ? ServerMessage_TrackMetadataUpdated.fromJSON(object.trackMetadataUpdated)
        : undefined,
    };
  },

  toJSON(message: ServerMessage): unknown {
    const obj: any = {};
    if (message.roomCrashed !== undefined) {
      obj.roomCrashed = ServerMessage_RoomCrashed.toJSON(message.roomCrashed);
    }
    if (message.peerConnected !== undefined) {
      obj.peerConnected = ServerMessage_PeerConnected.toJSON(message.peerConnected);
    }
    if (message.peerDisconnected !== undefined) {
      obj.peerDisconnected = ServerMessage_PeerDisconnected.toJSON(message.peerDisconnected);
    }
    if (message.peerCrashed !== undefined) {
      obj.peerCrashed = ServerMessage_PeerCrashed.toJSON(message.peerCrashed);
    }
    if (message.componentCrashed !== undefined) {
      obj.componentCrashed = ServerMessage_ComponentCrashed.toJSON(message.componentCrashed);
    }
    if (message.authenticated !== undefined) {
      obj.authenticated = ServerMessage_Authenticated.toJSON(message.authenticated);
    }
    if (message.authRequest !== undefined) {
      obj.authRequest = ServerMessage_AuthRequest.toJSON(message.authRequest);
    }
    if (message.subscribeRequest !== undefined) {
      obj.subscribeRequest = ServerMessage_SubscribeRequest.toJSON(message.subscribeRequest);
    }
    if (message.subscribeResponse !== undefined) {
      obj.subscribeResponse = ServerMessage_SubscribeResponse.toJSON(message.subscribeResponse);
    }
    if (message.roomCreated !== undefined) {
      obj.roomCreated = ServerMessage_RoomCreated.toJSON(message.roomCreated);
    }
    if (message.roomDeleted !== undefined) {
      obj.roomDeleted = ServerMessage_RoomDeleted.toJSON(message.roomDeleted);
    }
    if (message.metricsReport !== undefined) {
      obj.metricsReport = ServerMessage_MetricsReport.toJSON(message.metricsReport);
    }
    if (message.hlsPlayable !== undefined) {
      obj.hlsPlayable = ServerMessage_HlsPlayable.toJSON(message.hlsPlayable);
    }
    if (message.hlsUploaded !== undefined) {
      obj.hlsUploaded = ServerMessage_HlsUploaded.toJSON(message.hlsUploaded);
    }
    if (message.hlsUploadCrashed !== undefined) {
      obj.hlsUploadCrashed = ServerMessage_HlsUploadCrashed.toJSON(message.hlsUploadCrashed);
    }
    if (message.peerMetadataUpdated !== undefined) {
      obj.peerMetadataUpdated = ServerMessage_PeerMetadataUpdated.toJSON(message.peerMetadataUpdated);
    }
    if (message.trackAdded !== undefined) {
      obj.trackAdded = ServerMessage_TrackAdded.toJSON(message.trackAdded);
    }
    if (message.trackRemoved !== undefined) {
      obj.trackRemoved = ServerMessage_TrackRemoved.toJSON(message.trackRemoved);
    }
    if (message.trackMetadataUpdated !== undefined) {
      obj.trackMetadataUpdated = ServerMessage_TrackMetadataUpdated.toJSON(message.trackMetadataUpdated);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage>, I>>(base?: I): ServerMessage {
    return ServerMessage.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage>, I>>(object: I): ServerMessage {
    const message = createBaseServerMessage();
    message.roomCrashed = (object.roomCrashed !== undefined && object.roomCrashed !== null)
      ? ServerMessage_RoomCrashed.fromPartial(object.roomCrashed)
      : undefined;
    message.peerConnected = (object.peerConnected !== undefined && object.peerConnected !== null)
      ? ServerMessage_PeerConnected.fromPartial(object.peerConnected)
      : undefined;
    message.peerDisconnected = (object.peerDisconnected !== undefined && object.peerDisconnected !== null)
      ? ServerMessage_PeerDisconnected.fromPartial(object.peerDisconnected)
      : undefined;
    message.peerCrashed = (object.peerCrashed !== undefined && object.peerCrashed !== null)
      ? ServerMessage_PeerCrashed.fromPartial(object.peerCrashed)
      : undefined;
    message.componentCrashed = (object.componentCrashed !== undefined && object.componentCrashed !== null)
      ? ServerMessage_ComponentCrashed.fromPartial(object.componentCrashed)
      : undefined;
    message.authenticated = (object.authenticated !== undefined && object.authenticated !== null)
      ? ServerMessage_Authenticated.fromPartial(object.authenticated)
      : undefined;
    message.authRequest = (object.authRequest !== undefined && object.authRequest !== null)
      ? ServerMessage_AuthRequest.fromPartial(object.authRequest)
      : undefined;
    message.subscribeRequest = (object.subscribeRequest !== undefined && object.subscribeRequest !== null)
      ? ServerMessage_SubscribeRequest.fromPartial(object.subscribeRequest)
      : undefined;
    message.subscribeResponse = (object.subscribeResponse !== undefined && object.subscribeResponse !== null)
      ? ServerMessage_SubscribeResponse.fromPartial(object.subscribeResponse)
      : undefined;
    message.roomCreated = (object.roomCreated !== undefined && object.roomCreated !== null)
      ? ServerMessage_RoomCreated.fromPartial(object.roomCreated)
      : undefined;
    message.roomDeleted = (object.roomDeleted !== undefined && object.roomDeleted !== null)
      ? ServerMessage_RoomDeleted.fromPartial(object.roomDeleted)
      : undefined;
    message.metricsReport = (object.metricsReport !== undefined && object.metricsReport !== null)
      ? ServerMessage_MetricsReport.fromPartial(object.metricsReport)
      : undefined;
    message.hlsPlayable = (object.hlsPlayable !== undefined && object.hlsPlayable !== null)
      ? ServerMessage_HlsPlayable.fromPartial(object.hlsPlayable)
      : undefined;
    message.hlsUploaded = (object.hlsUploaded !== undefined && object.hlsUploaded !== null)
      ? ServerMessage_HlsUploaded.fromPartial(object.hlsUploaded)
      : undefined;
    message.hlsUploadCrashed = (object.hlsUploadCrashed !== undefined && object.hlsUploadCrashed !== null)
      ? ServerMessage_HlsUploadCrashed.fromPartial(object.hlsUploadCrashed)
      : undefined;
    message.peerMetadataUpdated = (object.peerMetadataUpdated !== undefined && object.peerMetadataUpdated !== null)
      ? ServerMessage_PeerMetadataUpdated.fromPartial(object.peerMetadataUpdated)
      : undefined;
    message.trackAdded = (object.trackAdded !== undefined && object.trackAdded !== null)
      ? ServerMessage_TrackAdded.fromPartial(object.trackAdded)
      : undefined;
    message.trackRemoved = (object.trackRemoved !== undefined && object.trackRemoved !== null)
      ? ServerMessage_TrackRemoved.fromPartial(object.trackRemoved)
      : undefined;
    message.trackMetadataUpdated = (object.trackMetadataUpdated !== undefined && object.trackMetadataUpdated !== null)
      ? ServerMessage_TrackMetadataUpdated.fromPartial(object.trackMetadataUpdated)
      : undefined;
    return message;
  },
};

function createBaseServerMessage_RoomCrashed(): ServerMessage_RoomCrashed {
  return { roomId: "" };
}

export const ServerMessage_RoomCrashed = {
  encode(message: ServerMessage_RoomCrashed, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_RoomCrashed {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_RoomCrashed();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_RoomCrashed {
    return { roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "" };
  },

  toJSON(message: ServerMessage_RoomCrashed): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_RoomCrashed>, I>>(base?: I): ServerMessage_RoomCrashed {
    return ServerMessage_RoomCrashed.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_RoomCrashed>, I>>(object: I): ServerMessage_RoomCrashed {
    const message = createBaseServerMessage_RoomCrashed();
    message.roomId = object.roomId ?? "";
    return message;
  },
};

function createBaseServerMessage_PeerAdded(): ServerMessage_PeerAdded {
  return { roomId: "", peerId: "" };
}

export const ServerMessage_PeerAdded = {
  encode(message: ServerMessage_PeerAdded, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== "") {
      writer.uint32(18).string(message.peerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_PeerAdded {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_PeerAdded();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_PeerAdded {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : "",
    };
  },

  toJSON(message: ServerMessage_PeerAdded): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== "") {
      obj.peerId = message.peerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_PeerAdded>, I>>(base?: I): ServerMessage_PeerAdded {
    return ServerMessage_PeerAdded.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_PeerAdded>, I>>(object: I): ServerMessage_PeerAdded {
    const message = createBaseServerMessage_PeerAdded();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? "";
    return message;
  },
};

function createBaseServerMessage_PeerDeleted(): ServerMessage_PeerDeleted {
  return { roomId: "", peerId: "" };
}

export const ServerMessage_PeerDeleted = {
  encode(message: ServerMessage_PeerDeleted, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== "") {
      writer.uint32(18).string(message.peerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_PeerDeleted {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_PeerDeleted();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_PeerDeleted {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : "",
    };
  },

  toJSON(message: ServerMessage_PeerDeleted): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== "") {
      obj.peerId = message.peerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_PeerDeleted>, I>>(base?: I): ServerMessage_PeerDeleted {
    return ServerMessage_PeerDeleted.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_PeerDeleted>, I>>(object: I): ServerMessage_PeerDeleted {
    const message = createBaseServerMessage_PeerDeleted();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? "";
    return message;
  },
};

function createBaseServerMessage_PeerConnected(): ServerMessage_PeerConnected {
  return { roomId: "", peerId: "" };
}

export const ServerMessage_PeerConnected = {
  encode(message: ServerMessage_PeerConnected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== "") {
      writer.uint32(18).string(message.peerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_PeerConnected {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_PeerConnected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_PeerConnected {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : "",
    };
  },

  toJSON(message: ServerMessage_PeerConnected): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== "") {
      obj.peerId = message.peerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_PeerConnected>, I>>(base?: I): ServerMessage_PeerConnected {
    return ServerMessage_PeerConnected.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_PeerConnected>, I>>(object: I): ServerMessage_PeerConnected {
    const message = createBaseServerMessage_PeerConnected();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? "";
    return message;
  },
};

function createBaseServerMessage_PeerDisconnected(): ServerMessage_PeerDisconnected {
  return { roomId: "", peerId: "" };
}

export const ServerMessage_PeerDisconnected = {
  encode(message: ServerMessage_PeerDisconnected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== "") {
      writer.uint32(18).string(message.peerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_PeerDisconnected {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_PeerDisconnected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_PeerDisconnected {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : "",
    };
  },

  toJSON(message: ServerMessage_PeerDisconnected): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== "") {
      obj.peerId = message.peerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_PeerDisconnected>, I>>(base?: I): ServerMessage_PeerDisconnected {
    return ServerMessage_PeerDisconnected.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_PeerDisconnected>, I>>(
    object: I,
  ): ServerMessage_PeerDisconnected {
    const message = createBaseServerMessage_PeerDisconnected();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? "";
    return message;
  },
};

function createBaseServerMessage_PeerCrashed(): ServerMessage_PeerCrashed {
  return { roomId: "", peerId: "", reason: "" };
}

export const ServerMessage_PeerCrashed = {
  encode(message: ServerMessage_PeerCrashed, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== "") {
      writer.uint32(18).string(message.peerId);
    }
    if (message.reason !== "") {
      writer.uint32(26).string(message.reason);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_PeerCrashed {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_PeerCrashed();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.reason = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_PeerCrashed {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : "",
      reason: isSet(object.reason) ? globalThis.String(object.reason) : "",
    };
  },

  toJSON(message: ServerMessage_PeerCrashed): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== "") {
      obj.peerId = message.peerId;
    }
    if (message.reason !== "") {
      obj.reason = message.reason;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_PeerCrashed>, I>>(base?: I): ServerMessage_PeerCrashed {
    return ServerMessage_PeerCrashed.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_PeerCrashed>, I>>(object: I): ServerMessage_PeerCrashed {
    const message = createBaseServerMessage_PeerCrashed();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? "";
    message.reason = object.reason ?? "";
    return message;
  },
};

function createBaseServerMessage_ComponentCrashed(): ServerMessage_ComponentCrashed {
  return { roomId: "", componentId: "" };
}

export const ServerMessage_ComponentCrashed = {
  encode(message: ServerMessage_ComponentCrashed, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.componentId !== "") {
      writer.uint32(18).string(message.componentId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_ComponentCrashed {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_ComponentCrashed();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.componentId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_ComponentCrashed {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      componentId: isSet(object.componentId) ? globalThis.String(object.componentId) : "",
    };
  },

  toJSON(message: ServerMessage_ComponentCrashed): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.componentId !== "") {
      obj.componentId = message.componentId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_ComponentCrashed>, I>>(base?: I): ServerMessage_ComponentCrashed {
    return ServerMessage_ComponentCrashed.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_ComponentCrashed>, I>>(
    object: I,
  ): ServerMessage_ComponentCrashed {
    const message = createBaseServerMessage_ComponentCrashed();
    message.roomId = object.roomId ?? "";
    message.componentId = object.componentId ?? "";
    return message;
  },
};

function createBaseServerMessage_Authenticated(): ServerMessage_Authenticated {
  return {};
}

export const ServerMessage_Authenticated = {
  encode(_: ServerMessage_Authenticated, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_Authenticated {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_Authenticated();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): ServerMessage_Authenticated {
    return {};
  },

  toJSON(_: ServerMessage_Authenticated): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_Authenticated>, I>>(base?: I): ServerMessage_Authenticated {
    return ServerMessage_Authenticated.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_Authenticated>, I>>(_: I): ServerMessage_Authenticated {
    const message = createBaseServerMessage_Authenticated();
    return message;
  },
};

function createBaseServerMessage_AuthRequest(): ServerMessage_AuthRequest {
  return { token: "" };
}

export const ServerMessage_AuthRequest = {
  encode(message: ServerMessage_AuthRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.token !== "") {
      writer.uint32(10).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_AuthRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_AuthRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.token = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_AuthRequest {
    return { token: isSet(object.token) ? globalThis.String(object.token) : "" };
  },

  toJSON(message: ServerMessage_AuthRequest): unknown {
    const obj: any = {};
    if (message.token !== "") {
      obj.token = message.token;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_AuthRequest>, I>>(base?: I): ServerMessage_AuthRequest {
    return ServerMessage_AuthRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_AuthRequest>, I>>(object: I): ServerMessage_AuthRequest {
    const message = createBaseServerMessage_AuthRequest();
    message.token = object.token ?? "";
    return message;
  },
};

function createBaseServerMessage_SubscribeRequest(): ServerMessage_SubscribeRequest {
  return { eventType: 0 };
}

export const ServerMessage_SubscribeRequest = {
  encode(message: ServerMessage_SubscribeRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.eventType !== 0) {
      writer.uint32(8).int32(message.eventType);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_SubscribeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_SubscribeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_SubscribeRequest {
    return { eventType: isSet(object.eventType) ? serverMessage_EventTypeFromJSON(object.eventType) : 0 };
  },

  toJSON(message: ServerMessage_SubscribeRequest): unknown {
    const obj: any = {};
    if (message.eventType !== 0) {
      obj.eventType = serverMessage_EventTypeToJSON(message.eventType);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_SubscribeRequest>, I>>(base?: I): ServerMessage_SubscribeRequest {
    return ServerMessage_SubscribeRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_SubscribeRequest>, I>>(
    object: I,
  ): ServerMessage_SubscribeRequest {
    const message = createBaseServerMessage_SubscribeRequest();
    message.eventType = object.eventType ?? 0;
    return message;
  },
};

function createBaseServerMessage_SubscribeResponse(): ServerMessage_SubscribeResponse {
  return { eventType: 0 };
}

export const ServerMessage_SubscribeResponse = {
  encode(message: ServerMessage_SubscribeResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.eventType !== 0) {
      writer.uint32(8).int32(message.eventType);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_SubscribeResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_SubscribeResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_SubscribeResponse {
    return { eventType: isSet(object.eventType) ? serverMessage_EventTypeFromJSON(object.eventType) : 0 };
  },

  toJSON(message: ServerMessage_SubscribeResponse): unknown {
    const obj: any = {};
    if (message.eventType !== 0) {
      obj.eventType = serverMessage_EventTypeToJSON(message.eventType);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_SubscribeResponse>, I>>(base?: I): ServerMessage_SubscribeResponse {
    return ServerMessage_SubscribeResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_SubscribeResponse>, I>>(
    object: I,
  ): ServerMessage_SubscribeResponse {
    const message = createBaseServerMessage_SubscribeResponse();
    message.eventType = object.eventType ?? 0;
    return message;
  },
};

function createBaseServerMessage_RoomCreated(): ServerMessage_RoomCreated {
  return { roomId: "" };
}

export const ServerMessage_RoomCreated = {
  encode(message: ServerMessage_RoomCreated, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_RoomCreated {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_RoomCreated();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_RoomCreated {
    return { roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "" };
  },

  toJSON(message: ServerMessage_RoomCreated): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_RoomCreated>, I>>(base?: I): ServerMessage_RoomCreated {
    return ServerMessage_RoomCreated.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_RoomCreated>, I>>(object: I): ServerMessage_RoomCreated {
    const message = createBaseServerMessage_RoomCreated();
    message.roomId = object.roomId ?? "";
    return message;
  },
};

function createBaseServerMessage_RoomDeleted(): ServerMessage_RoomDeleted {
  return { roomId: "" };
}

export const ServerMessage_RoomDeleted = {
  encode(message: ServerMessage_RoomDeleted, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_RoomDeleted {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_RoomDeleted();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_RoomDeleted {
    return { roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "" };
  },

  toJSON(message: ServerMessage_RoomDeleted): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_RoomDeleted>, I>>(base?: I): ServerMessage_RoomDeleted {
    return ServerMessage_RoomDeleted.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_RoomDeleted>, I>>(object: I): ServerMessage_RoomDeleted {
    const message = createBaseServerMessage_RoomDeleted();
    message.roomId = object.roomId ?? "";
    return message;
  },
};

function createBaseServerMessage_MetricsReport(): ServerMessage_MetricsReport {
  return { metrics: "" };
}

export const ServerMessage_MetricsReport = {
  encode(message: ServerMessage_MetricsReport, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.metrics !== "") {
      writer.uint32(10).string(message.metrics);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_MetricsReport {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_MetricsReport();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.metrics = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_MetricsReport {
    return { metrics: isSet(object.metrics) ? globalThis.String(object.metrics) : "" };
  },

  toJSON(message: ServerMessage_MetricsReport): unknown {
    const obj: any = {};
    if (message.metrics !== "") {
      obj.metrics = message.metrics;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_MetricsReport>, I>>(base?: I): ServerMessage_MetricsReport {
    return ServerMessage_MetricsReport.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_MetricsReport>, I>>(object: I): ServerMessage_MetricsReport {
    const message = createBaseServerMessage_MetricsReport();
    message.metrics = object.metrics ?? "";
    return message;
  },
};

function createBaseServerMessage_HlsPlayable(): ServerMessage_HlsPlayable {
  return { roomId: "", componentId: "" };
}

export const ServerMessage_HlsPlayable = {
  encode(message: ServerMessage_HlsPlayable, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.componentId !== "") {
      writer.uint32(18).string(message.componentId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_HlsPlayable {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_HlsPlayable();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.componentId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_HlsPlayable {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      componentId: isSet(object.componentId) ? globalThis.String(object.componentId) : "",
    };
  },

  toJSON(message: ServerMessage_HlsPlayable): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.componentId !== "") {
      obj.componentId = message.componentId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_HlsPlayable>, I>>(base?: I): ServerMessage_HlsPlayable {
    return ServerMessage_HlsPlayable.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_HlsPlayable>, I>>(object: I): ServerMessage_HlsPlayable {
    const message = createBaseServerMessage_HlsPlayable();
    message.roomId = object.roomId ?? "";
    message.componentId = object.componentId ?? "";
    return message;
  },
};

function createBaseServerMessage_HlsUploaded(): ServerMessage_HlsUploaded {
  return { roomId: "" };
}

export const ServerMessage_HlsUploaded = {
  encode(message: ServerMessage_HlsUploaded, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_HlsUploaded {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_HlsUploaded();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_HlsUploaded {
    return { roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "" };
  },

  toJSON(message: ServerMessage_HlsUploaded): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_HlsUploaded>, I>>(base?: I): ServerMessage_HlsUploaded {
    return ServerMessage_HlsUploaded.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_HlsUploaded>, I>>(object: I): ServerMessage_HlsUploaded {
    const message = createBaseServerMessage_HlsUploaded();
    message.roomId = object.roomId ?? "";
    return message;
  },
};

function createBaseServerMessage_HlsUploadCrashed(): ServerMessage_HlsUploadCrashed {
  return { roomId: "" };
}

export const ServerMessage_HlsUploadCrashed = {
  encode(message: ServerMessage_HlsUploadCrashed, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_HlsUploadCrashed {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_HlsUploadCrashed();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_HlsUploadCrashed {
    return { roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "" };
  },

  toJSON(message: ServerMessage_HlsUploadCrashed): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_HlsUploadCrashed>, I>>(base?: I): ServerMessage_HlsUploadCrashed {
    return ServerMessage_HlsUploadCrashed.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_HlsUploadCrashed>, I>>(
    object: I,
  ): ServerMessage_HlsUploadCrashed {
    const message = createBaseServerMessage_HlsUploadCrashed();
    message.roomId = object.roomId ?? "";
    return message;
  },
};

function createBaseServerMessage_PeerMetadataUpdated(): ServerMessage_PeerMetadataUpdated {
  return { roomId: "", peerId: "", metadata: "" };
}

export const ServerMessage_PeerMetadataUpdated = {
  encode(message: ServerMessage_PeerMetadataUpdated, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== "") {
      writer.uint32(18).string(message.peerId);
    }
    if (message.metadata !== "") {
      writer.uint32(26).string(message.metadata);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_PeerMetadataUpdated {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_PeerMetadataUpdated();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.metadata = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_PeerMetadataUpdated {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : "",
      metadata: isSet(object.metadata) ? globalThis.String(object.metadata) : "",
    };
  },

  toJSON(message: ServerMessage_PeerMetadataUpdated): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== "") {
      obj.peerId = message.peerId;
    }
    if (message.metadata !== "") {
      obj.metadata = message.metadata;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_PeerMetadataUpdated>, I>>(
    base?: I,
  ): ServerMessage_PeerMetadataUpdated {
    return ServerMessage_PeerMetadataUpdated.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_PeerMetadataUpdated>, I>>(
    object: I,
  ): ServerMessage_PeerMetadataUpdated {
    const message = createBaseServerMessage_PeerMetadataUpdated();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? "";
    message.metadata = object.metadata ?? "";
    return message;
  },
};

function createBaseServerMessage_Track(): ServerMessage_Track {
  return { id: "", type: 0, metadata: "" };
}

export const ServerMessage_Track = {
  encode(message: ServerMessage_Track, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }
    if (message.metadata !== "") {
      writer.uint32(26).string(message.metadata);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_Track {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_Track();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.metadata = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_Track {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      type: isSet(object.type) ? serverMessage_TrackTypeFromJSON(object.type) : 0,
      metadata: isSet(object.metadata) ? globalThis.String(object.metadata) : "",
    };
  },

  toJSON(message: ServerMessage_Track): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.type !== 0) {
      obj.type = serverMessage_TrackTypeToJSON(message.type);
    }
    if (message.metadata !== "") {
      obj.metadata = message.metadata;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_Track>, I>>(base?: I): ServerMessage_Track {
    return ServerMessage_Track.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_Track>, I>>(object: I): ServerMessage_Track {
    const message = createBaseServerMessage_Track();
    message.id = object.id ?? "";
    message.type = object.type ?? 0;
    message.metadata = object.metadata ?? "";
    return message;
  },
};

function createBaseServerMessage_TrackAdded(): ServerMessage_TrackAdded {
  return { roomId: "", peerId: undefined, componentId: undefined, track: undefined };
}

export const ServerMessage_TrackAdded = {
  encode(message: ServerMessage_TrackAdded, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== undefined) {
      writer.uint32(18).string(message.peerId);
    }
    if (message.componentId !== undefined) {
      writer.uint32(26).string(message.componentId);
    }
    if (message.track !== undefined) {
      ServerMessage_Track.encode(message.track, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_TrackAdded {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_TrackAdded();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.componentId = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.track = ServerMessage_Track.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_TrackAdded {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : undefined,
      componentId: isSet(object.componentId) ? globalThis.String(object.componentId) : undefined,
      track: isSet(object.track) ? ServerMessage_Track.fromJSON(object.track) : undefined,
    };
  },

  toJSON(message: ServerMessage_TrackAdded): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== undefined) {
      obj.peerId = message.peerId;
    }
    if (message.componentId !== undefined) {
      obj.componentId = message.componentId;
    }
    if (message.track !== undefined) {
      obj.track = ServerMessage_Track.toJSON(message.track);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_TrackAdded>, I>>(base?: I): ServerMessage_TrackAdded {
    return ServerMessage_TrackAdded.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_TrackAdded>, I>>(object: I): ServerMessage_TrackAdded {
    const message = createBaseServerMessage_TrackAdded();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? undefined;
    message.componentId = object.componentId ?? undefined;
    message.track = (object.track !== undefined && object.track !== null)
      ? ServerMessage_Track.fromPartial(object.track)
      : undefined;
    return message;
  },
};

function createBaseServerMessage_TrackRemoved(): ServerMessage_TrackRemoved {
  return { roomId: "", peerId: undefined, componentId: undefined, track: undefined };
}

export const ServerMessage_TrackRemoved = {
  encode(message: ServerMessage_TrackRemoved, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== undefined) {
      writer.uint32(18).string(message.peerId);
    }
    if (message.componentId !== undefined) {
      writer.uint32(26).string(message.componentId);
    }
    if (message.track !== undefined) {
      ServerMessage_Track.encode(message.track, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_TrackRemoved {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_TrackRemoved();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.componentId = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.track = ServerMessage_Track.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_TrackRemoved {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : undefined,
      componentId: isSet(object.componentId) ? globalThis.String(object.componentId) : undefined,
      track: isSet(object.track) ? ServerMessage_Track.fromJSON(object.track) : undefined,
    };
  },

  toJSON(message: ServerMessage_TrackRemoved): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== undefined) {
      obj.peerId = message.peerId;
    }
    if (message.componentId !== undefined) {
      obj.componentId = message.componentId;
    }
    if (message.track !== undefined) {
      obj.track = ServerMessage_Track.toJSON(message.track);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_TrackRemoved>, I>>(base?: I): ServerMessage_TrackRemoved {
    return ServerMessage_TrackRemoved.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_TrackRemoved>, I>>(object: I): ServerMessage_TrackRemoved {
    const message = createBaseServerMessage_TrackRemoved();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? undefined;
    message.componentId = object.componentId ?? undefined;
    message.track = (object.track !== undefined && object.track !== null)
      ? ServerMessage_Track.fromPartial(object.track)
      : undefined;
    return message;
  },
};

function createBaseServerMessage_TrackMetadataUpdated(): ServerMessage_TrackMetadataUpdated {
  return { roomId: "", peerId: undefined, componentId: undefined, track: undefined };
}

export const ServerMessage_TrackMetadataUpdated = {
  encode(message: ServerMessage_TrackMetadataUpdated, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.roomId !== "") {
      writer.uint32(10).string(message.roomId);
    }
    if (message.peerId !== undefined) {
      writer.uint32(18).string(message.peerId);
    }
    if (message.componentId !== undefined) {
      writer.uint32(26).string(message.componentId);
    }
    if (message.track !== undefined) {
      ServerMessage_Track.encode(message.track, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerMessage_TrackMetadataUpdated {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerMessage_TrackMetadataUpdated();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.roomId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.componentId = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.track = ServerMessage_Track.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerMessage_TrackMetadataUpdated {
    return {
      roomId: isSet(object.roomId) ? globalThis.String(object.roomId) : "",
      peerId: isSet(object.peerId) ? globalThis.String(object.peerId) : undefined,
      componentId: isSet(object.componentId) ? globalThis.String(object.componentId) : undefined,
      track: isSet(object.track) ? ServerMessage_Track.fromJSON(object.track) : undefined,
    };
  },

  toJSON(message: ServerMessage_TrackMetadataUpdated): unknown {
    const obj: any = {};
    if (message.roomId !== "") {
      obj.roomId = message.roomId;
    }
    if (message.peerId !== undefined) {
      obj.peerId = message.peerId;
    }
    if (message.componentId !== undefined) {
      obj.componentId = message.componentId;
    }
    if (message.track !== undefined) {
      obj.track = ServerMessage_Track.toJSON(message.track);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerMessage_TrackMetadataUpdated>, I>>(
    base?: I,
  ): ServerMessage_TrackMetadataUpdated {
    return ServerMessage_TrackMetadataUpdated.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ServerMessage_TrackMetadataUpdated>, I>>(
    object: I,
  ): ServerMessage_TrackMetadataUpdated {
    const message = createBaseServerMessage_TrackMetadataUpdated();
    message.roomId = object.roomId ?? "";
    message.peerId = object.peerId ?? undefined;
    message.componentId = object.componentId ?? undefined;
    message.track = (object.track !== undefined && object.track !== null)
      ? ServerMessage_Track.fromPartial(object.track)
      : undefined;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
