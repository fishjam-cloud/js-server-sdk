/**
 * Server-side Node.js SDK for creating and managing Fishjam rooms, peers, agents, and receiving real-time server notifications.
 *
 * @packageDocumentation
 */
import type { PeerOptionsWebRTC, PeerOptionsAgent, PeerOptionsVapi } from '@fishjam-cloud/fishjam-openapi';

export type PeerOptions = PeerOptionsWebRTC | PeerOptionsAgent | PeerOptionsVapi;

export {
  PeerStatus,
  RoomConfig,
  PeerOptionsWebRTC,
  PeerOptionsAgent,
  PeerOptionsVapi,
  VideoCodec,
  RoomType,
  ViewerToken,
  StreamerToken,
  MoqAccess,
  MoqAccessConfig,
  RecordingConfig,
  RecordingSource,
} from '@fishjam-cloud/fishjam-openapi';

export type {
  AudioChannels,
  AudioMixingStrategy,
  AudioScene,
  AudioSceneInput,
  BoxShadow,
  Component,
  CreateCompositionRequest,
  EasingFunction,
  EasingFunctionBounce,
  EasingFunctionCubicBezier,
  EasingFunctionLinear,
  HorizontalAlign,
  Image,
  ImageSpec,
  ImageSpecAuto,
  ImageSpecGif,
  ImageSpecJpeg,
  ImageSpecPng,
  ImageSpecSvg,
  InputStream,
  Mp4Input,
  OpusEncoderPreset,
  OutputEndCondition,
  OutputRtmpClientAudioOptions,
  OutputRtmpClientVideoOptions,
  OutputWhipAudioOptions,
  OutputWhipVideoOptions,
  Overflow,
  RegisterInput,
  RegisterInputResponse,
  RegisterOutput,
  RescaleMode,
  Rescaler,
  Resolution,
  RtmpInput,
  RtmpOutput,
  SendCompositionEventRequest,
  Text,
  TextStyle,
  TextWeight,
  TextWrapMode,
  Tiles,
  Transition,
  UnregisterInput,
  UnregisterOutput,
  UnregisterRenderer,
  UpdateOutputRequest,
  VerticalAlign,
  VideoScene,
  View,
  ViewDirection,
  WhepInput,
  WhipAudioEncoderOptions,
  WhipAudioEncoderOptionsAny,
  WhipAudioEncoderOptionsOpus,
  WhipInput,
  WhipOutput,
} from '@fishjam-cloud/composition-openapi';

export { ServerMessage } from '@fishjam-cloud/fishjam-proto';
export { FishjamWSNotifier } from './ws_notifier';
export { decodeServerNotifications, verifyWebhookSignature } from './webhook';
export type {
  Track,
  ServerNotification,
  ExpectedEvents,
  IgnoredEvents,
  RoomCreated,
  RoomDeleted,
  RoomCrashed,
  PeerAdded,
  PeerDeleted,
  PeerConnected,
  PeerDisconnected,
  PeerMetadataUpdated,
  PeerCrashed,
  StreamerConnected,
  StreamerDisconnected,
  ViewerConnected,
  ViewerDisconnected,
  TrackAdded,
  TrackRemoved,
  TrackMetadataUpdated,
  TrackForwarding,
  TrackForwardingRemoved,
  VadNotification,
  ChannelAdded,
  ChannelRemoved,
  RecordingStatusChanged,
  NotificationEvents,
} from './notifications';
export { FishjamAgent } from './agent';
export type * from './agent';
export { FishjamClient } from './client';
export { CompositionClient } from './composition';
export * from './exceptions';
export type * from './types';
