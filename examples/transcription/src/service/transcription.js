import { FishjamAgent, FishjamWSNotifier, FishjamClient } from '@fishjam-cloud/js-server-sdk';
import { GoogleGenAI, Modality } from '@google/genai';
import { TRANSCRIPTION_MODEL } from '../const';
export class TranscriptionService {
  constructor(fishjamConfig, geminiKey) {
    this.peerSessions = new Map();
    this.ai = new GoogleGenAI({ apiKey: geminiKey });
    this.fishjamConfig = fishjamConfig;
    this.fishjamClient = new FishjamClient(fishjamConfig);
    this.initFishjam();
  }
  initFishjam() {
    const notifier = new FishjamWSNotifier(
      this.fishjamConfig,
      (error) => console.error('Fishjam websocket error: %O', error),
      (code, reason) => console.log(`Fishjam websocket closed. code: ${code}, reason: ${reason}`)
    );
    notifier.on('peerConnected', (msg) => this.handlePeerConnected(msg));
    notifier.on('peerDisconnected', (msg) => this.handlePeerDisconnected(msg));
  }
  async handlePeerConnected(message) {
    console.log('Peer connected: %O', message);
    const peerId = message.peerId;
    const { peerToken: agentToken } = await this.fishjamClient.createPeer(message.roomId, 'agent');
    const agent = new FishjamAgent(
      this.fishjamConfig,
      agentToken,
      (error) => console.error('Fishjam agent websocket error: %O', error),
      (code, reason) => console.log(`Fishjam agent websocket closed. code: ${code}, reason: ${reason}`)
    );
    agent.on('trackData', (msg) => this.handleTrackData(msg));
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
  handlePeerDisconnected(message) {
    console.log('Peer disconnected: %O', message);
    const peerId = message.peerId;
    const session = this.peerSessions.get(peerId);
    session?.close();
    this.peerSessions.delete(peerId);
  }
  handleTrackData(message) {
    const { data, peerId } = message;
    const session = this.peerSessions.get(peerId);
    session?.sendRealtimeInput({
      audio: {
        data: data.toBase64(),
        mimeType: 'audio/pcm;rate=16000',
      },
    });
  }
  handleTranscription(peerId, msg) {
    const transcription = msg.serverContent?.inputTranscription?.text;
    if (transcription) console.log(`Peer ${peerId} said: "${transcription}".`);
  }
}
