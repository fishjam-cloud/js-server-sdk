import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { v4 as uuid4 } from 'uuid';

import {
  AgentRequest,
  AgentRequest_TrackData,
  AgentResponse,
  AgentResponse_TrackData,
  Track as ProtoTrack,
  TrackType as ProtoTrackType,
  TrackEncoding,
} from '@fishjam-cloud/fishjam-proto';
import { Brand, FishjamConfig } from './types';
import { getFishjamUrl, httpToWebsocket } from './utils';
import { CloseEventHandler, ErrorEventHandler } from './types';

export type ExpectedAgentEvents = 'authenticated' | 'trackData';

const expectedEventsList: ReadonlyArray<ExpectedAgentEvents> = ['authenticated', 'trackData'] as const;

export type IncomingTrackData = AgentResponse_TrackData;
export type OutgoingTrackData = AgentRequest_TrackData;
export type AgentTrack = ProtoTrack;
export type TrackType = 'audio' | 'video';
export type AudioCodecParameters = {
  encoding: 'opus' | 'pcm16';
  sampleRate: 16000 | 24000 | 48000;
  channels: 1;
};
export type TrackId = Brand<string, 'TrackId'>;

export type AgentEvents = { [K in ExpectedAgentEvents]: (message: NonNullable<AgentResponse[K]>) => void };

export class FishjamAgent extends (EventEmitter as new () => TypedEmitter<AgentEvents>) {
  private readonly client: WebSocket;

  constructor(config: FishjamConfig, agentToken: string, onError: ErrorEventHandler, onClose: CloseEventHandler) {
    super();

    const fishjamUrl = getFishjamUrl(config);
    const websocketUrl = `${httpToWebsocket(fishjamUrl)}/socket/agent/websocket`;

    this.client = new WebSocket(websocketUrl);

    this.client.onerror = (message) => onError(message);
    this.client.onclose = (message) => onClose(message.code, message.reason);
    this.client.onmessage = (message) => this.dispatchNotification(message);
    this.client.onopen = () => this.setupConnection(agentToken);
  }

  /**
   * Creates an outgoing audio track for the agent
   * @returns a new audio track
   */
  public createTrack(codecParameters: AudioCodecParameters, metadata: object = {}): AgentTrack {
    const track: AgentTrack = {
      id: uuid4(),
      type: ProtoTrackType.TRACK_TYPE_AUDIO,
      metadata: JSON.stringify(metadata),
    };

    const codecParams = { ...codecParameters, encoding: toProtoEncoding(codecParameters.encoding) };
    const addTrack = AgentRequest.encode({ addTrack: { codecParams: codecParams, track: track } }).finish();

    this.client.send(addTrack);

    return track;
  }

  /**
   * Deletes an outgoing audio track for the agent
   */
  public deleteTrack(trackId: TrackId): void {
    const removeTrack = AgentRequest.encode({ removeTrack: { trackId: trackId } }).finish();

    this.client.send(removeTrack);
  }

  /**
   * Send audio data for the given track
   */
  public sendData(trackId: TrackId, data: Uint8Array): void {
    const trackData = AgentRequest.encode({ trackData: { trackId: trackId, data: data } }).finish();

    this.client.send(trackData);
  }

  private dispatchNotification(message: MessageEvent) {
    try {
      const decodedMessage = AgentResponse.decode(message.data);
      const [[notification, msg]] = Object.entries(decodedMessage).filter(([_k, v]) => v != null);

      if (!this.isExpectedEvent(notification)) return;

      this.emit(notification, msg);
    } catch (e) {
      console.error("Couldn't decode websocket agent message.");
      console.error(e);
      console.error(message);
    }
  }

  private setupConnection(agentToken: string) {
    const auth = AgentRequest.encode({ authRequest: { token: agentToken } }).finish();

    this.client.send(auth);
  }

  private isExpectedEvent(notification: string): notification is ExpectedAgentEvents {
    return expectedEventsList.includes(notification as ExpectedAgentEvents);
  }
}

const toProtoEncoding = (encoding: AudioCodecParameters['encoding']) => {
  if (encoding === 'pcm16') return TrackEncoding.TRACK_ENCODING_PCM16;
  return TrackEncoding.TRACK_ENCODING_OPUS;
};
