import {
  FishjamConfig,
  FishjamWSNotifier,
  PeerConnected,
  PeerDisconnected,
  PeerId,
  TrackData,
} from '@fishjam-cloud/js-server-sdk';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { TRANSCRIPTION_MODEL } from '../const';

export class TranscriptionService {
  peerSessions: Map<PeerId, Session> = new Map();
  ai: GoogleGenAI;

  constructor(fishjamConfig: FishjamConfig, geminiKey: string) {
    this.ai = new GoogleGenAI({ apiKey: geminiKey });
    this.initFishjam(fishjamConfig);
  }

  private initFishjam(config: FishjamConfig) {
    const notifier = new FishjamWSNotifier(
      config,
      (error) => console.error('Fishjam websocket error: %O', error),
      (code, reason) => console.log(`Fishjam websocket closed. code: ${code}, reason: ${reason}`)
    );
    notifier.on('peerConnected', (msg) => this.handlePeerConnected(msg));
    notifier.on('peerDisconnected', (msg) => this.handlePeerDisconnected(msg));
    notifier.on('trackData', (msg) => this.handleTrackData(msg));
  }

  async handlePeerConnected(message: PeerConnected) {
    console.log('Peer connected: %O', message);
    const peerId = message.peerId as PeerId;

    const session = await this.ai.live.connect({
      model: TRANSCRIPTION_MODEL,
      config: {
        responseModalities: [Modality.TEXT],
        inputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => console.log(`Connected to Gemini Live API for peer ${peerId}.`),
        onerror: (error) => console.error(`Gemini error for peer ${peerId}: %O`, error),
        onclose: (e) =>
          console.log(`Connection to Gemini Live API for peer ${peerId} closed. code: ${e.code}, reason: ${e.reason}`),
        onmessage: (msg) => this.handleTranscription(peerId, msg),
      },
    });
    this.peerSessions.set(peerId, session);
  }

  handlePeerDisconnected(message: PeerDisconnected) {
    console.log('Peer disconnected: %O', message);
    const peerId = message.peerId as PeerId;

    const session = this.peerSessions.get(peerId);
    session?.close();

    this.peerSessions.delete(peerId);
  }

  handleTrackData(message: TrackData) {
    const { data, peerId } = message;

    const session = this.peerSessions.get(peerId as PeerId);
    session?.sendRealtimeInput({
      audio: {
        data: data.toBase64(),
        mimeType: 'audio/pcm;rate=16000',
      },
    });
  }

  handleTranscription(peerId: PeerId, msg: LiveServerMessage) {
    const transcription = msg.serverContent?.inputTranscription?.text;
    if (transcription) console.log(`Peer ${peerId} said: "${transcription}".`);
  }
}
