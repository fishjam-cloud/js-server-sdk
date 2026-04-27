import TypedEmitter from 'typed-emitter';
import { EventEmitter } from 'events';
import { v4 as uuid4 } from 'uuid';

import {
  AgentRequest,
  AgentRequest_TrackData,
  AgentResponse,
  AgentResponse_TrackData,
  AgentResponse_TrackImage,
  Track as ProtoTrack,
  TrackType as ProtoTrackType,
  TrackEncoding,
} from '@fishjam-cloud/fishjam-proto';
import { AgentCallbacks, Brand, FishjamConfig, PeerId } from './types';
import { getFishjamUrl, httpToWebsocket, WithPeerId } from './utils';

const expectedEventsList = ['trackData'] as const;
/**
 * @useDeclaredType
 */
export type ExpectedAgentEvents = (typeof expectedEventsList)[number];

export type IncomingTrackData = Omit<NonNullable<AgentResponse_TrackData>, 'peerId'> & { peerId: PeerId };
export type IncomingTrackImage = NonNullable<AgentResponse_TrackImage>;
export type OutgoingTrackData = Omit<NonNullable<AgentRequest_TrackData>, 'peerId'> & { peerId: PeerId };

export type AgentTrack = Omit<ProtoTrack, 'id'> & { id: TrackId };

export type AudioCodecParameters = {
  encoding: 'opus' | 'pcm16';
  sampleRate: 16000 | 24000 | 48000;
  channels: 1;
};
export type TrackId = Brand<string, 'TrackId'>;

type PendingImageCapture = {
  resolve: (image: IncomingTrackImage) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * @inline
 */
type ResponseWithPeerId = WithPeerId<AgentResponse>;
export type AgentEvents = { [K in ExpectedAgentEvents]: (message: NonNullable<ResponseWithPeerId[K]>) => void };

export class FishjamAgent extends (EventEmitter as new () => TypedEmitter<AgentEvents>) {
  private readonly client: WebSocket;

  private resolveConnectionPromise: ((value: void | PromiseLike<void>) => void) | null = null;
  private readonly connectionPromise: Promise<void>;
  private readonly pendingImageCaptures = new Map<string, PendingImageCapture>();

  constructor(config: FishjamConfig, agentToken: string, callbacks?: AgentCallbacks) {
    super();

    const fishjamUrl = getFishjamUrl(config);
    const websocketUrl = `${httpToWebsocket(fishjamUrl)}/socket/agent/websocket`;

    this.client = new WebSocket(websocketUrl);

    this.client.binaryType = 'arraybuffer';

    this.client.onclose = (message) => {
      this.rejectPendingCaptures('WebSocket closed');
      callbacks?.onClose?.(message.code, message.reason);
    };
    this.client.onerror = (message) => callbacks?.onError?.(message);

    this.client.onmessage = (message) => this.dispatchNotification(message);
    this.client.onopen = () => this.setupConnection(agentToken);

    this.connectionPromise = new Promise<void>((resolve) => {
      this.resolveConnectionPromise = resolve;
    });
  }

  /**
   * Await Agent connection to Fishjam.
   */
  public async awaitConnected(): Promise<void> {
    return this.connectionPromise;
  }

  /**
   * Creates an outgoing audio track for the agent
   * @returns a new audio track
   */
  public createTrack(codecParameters: AudioCodecParameters, metadata: object = {}): AgentTrack {
    const track: AgentTrack = {
      id: uuid4() as TrackId,
      type: ProtoTrackType.TRACK_TYPE_AUDIO,
      metadata: JSON.stringify(metadata),
    };

    const codecParams = { ...codecParameters, encoding: toProtoEncoding(codecParameters.encoding) };
    const addTrack = AgentRequest.encode({ addTrack: { codecParams: codecParams, track: track } }).finish();

    this.client.send(addTrack);

    return track;
  }

  /**
   * Interrupt track identified by `trackId`.
   *
   * Any audio that has been sent by the agent, but not played
   * by Fishjam will be cleared and be prevented from playing.
   *
   * Audio sent after the interrupt will be played normally.
   */
  public interruptTrack(trackId: TrackId): void {
    const msg = AgentRequest.encode({ interruptTrack: { trackId: trackId } }).finish();

    this.client.send(msg);
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

  /**
   * Request a captured image from the given track
   * @param trackId - the track to capture an image from
   * @param timeoutMs - timeout in milliseconds (default: 5000)
   * @returns a promise that resolves with the captured image data
   */
  public captureImage(trackId: string, timeoutMs: number = 5000): Promise<IncomingTrackImage> {
    if (this.pendingImageCaptures.has(trackId)) {
      return Promise.reject(new Error(`captureImage already pending for track ${trackId}`));
    }

    return new Promise<IncomingTrackImage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingImageCaptures.delete(trackId);
        reject(new Error(`captureImage timed out after ${timeoutMs}ms for track ${trackId}`));
      }, timeoutMs);

      this.pendingImageCaptures.set(trackId, { resolve, reject, timer });

      const msg = AgentRequest.encode({ captureImage: { trackId } }).finish();

      try {
        this.client.send(msg);
      } catch (error) {
        clearTimeout(timer);
        this.pendingImageCaptures.delete(trackId);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.rejectPendingCaptures('Agent disconnected');
    this.client.close();
  }

  private handleTrackImageMessage({ trackImage }: AgentResponse) {
    if (!trackImage) return;

    const pending = this.pendingImageCaptures.get(trackImage.trackId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingImageCaptures.delete(trackImage.trackId);
      pending.resolve(trackImage);
    }
  }

  private rejectPendingCaptures(reason: string): void {
    for (const [trackId, { reject, timer }] of this.pendingImageCaptures) {
      clearTimeout(timer);
      reject(new Error(`${reason}: captureImage rejected for track ${trackId}`));
    }
    this.pendingImageCaptures.clear();
  }

  private dispatchNotification(message: MessageEvent) {
    try {
      const data = new Uint8Array(message.data);
      const decodedMessage = AgentResponse.decode(data);

      this.handleTrackImageMessage(decodedMessage);

      const [notification, msg] = Object.entries(decodedMessage).find(([_k, v]) => v)!;

      if (!this.isExpectedEvent(notification)) return;

      this.emit(notification, msg);
    } catch (e) {
      console.error("Couldn't decode websocket agent message", e, message);
    }
  }

  private setupConnection(agentToken: string) {
    const auth = AgentRequest.encode({ authRequest: { token: agentToken } }).finish();

    this.client.send(auth);

    if (this.resolveConnectionPromise) {
      this.resolveConnectionPromise();
      this.resolveConnectionPromise = null;
    }
  }

  private isExpectedEvent(notification: string): notification is ExpectedAgentEvents {
    return expectedEventsList.includes(notification as ExpectedAgentEvents);
  }
}

const toProtoEncoding = (encoding: AudioCodecParameters['encoding']) => {
  if (encoding === 'pcm16') return TrackEncoding.TRACK_ENCODING_PCM16;
  return TrackEncoding.TRACK_ENCODING_OPUS;
};
