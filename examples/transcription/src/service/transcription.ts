import {
  FishjamConfig,
  FishjamAgent,
  FishjamWSNotifier,
  PeerConnected,
  PeerDisconnected,
  PeerId,
  IncomingTrackData,
  FishjamClient,
  RoomId,
} from '@fishjam-cloud/js-server-sdk';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { TRANSCRIPTION_MODEL } from '../const';

export class TranscriptionService {
  peerSessions: Map<PeerId, Session> = new Map();
  agents: Map<RoomId, PeerId> = new Map();
  ai: GoogleGenAI;
  fishjamConfig: FishjamConfig;
  fishjamClient: FishjamClient;

  constructor(fishjamConfig: FishjamConfig, geminiKey: string) {
    this.ai = new GoogleGenAI({ apiKey: geminiKey });
    this.fishjamConfig = fishjamConfig;
    this.fishjamClient = new FishjamClient(fishjamConfig);
    this.initFishjam();
  }

  private initFishjam() {
    const notifier = new FishjamWSNotifier(
      this.fishjamConfig,
      (error) => console.error('Fishjam websocket error: %O', error),
      (code, reason) => console.log(`Fishjam websocket closed. code: ${code}, reason: ${reason}`)
    );

    notifier.on('peerConnected', (msg) => this.handlePeerConnected(msg));
    notifier.on('peerDisconnected', (msg) => this.handlePeerDisconnected(msg));
  }

  async handlePeerConnected(message: PeerConnected) {
    console.log('Peer connected: %O', message);

    const peerId = message.peerId;
    const agentId = this.agents.get(message.roomId);

    if (agentId == peerId) return;

    if (agentId == undefined) {
      const {
        peer: { id: newAgentId },
        peerToken: agentToken,
      } = await this.fishjamClient.createPeer(message.roomId, 'agent');

      const agent = new FishjamAgent(
        this.fishjamConfig,
        agentToken,
        (error) => console.error('Fishjam agent websocket error: %O', error),
        (code, reason) => console.log(`Fishjam agent websocket closed. code: ${code}, reason: ${reason}`)
      );

      this.agents.set(message.roomId, newAgentId);

      agent.on('trackData', (msg) => this.handleTrackData(msg));
      console.log(`Agent ${newAgentId} created`);
    }

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

  async handlePeerDisconnected(message: PeerDisconnected) {
    const isAgent = this.agents.get(message.roomId) == message.peerId;
    if (isAgent) return this.handleAgentDisconnected(message);

    this.handleWebrtcPeerDisconnected(message);
  }

  async handleAgentDisconnected(message: PeerDisconnected) {
    console.log(`Agent ${message.peerId} disconnected, removing room`);

    await this.fishjamClient.deleteRoom(message.roomId);
    this.agents.delete(message.roomId);
  }

  async handleWebrtcPeerDisconnected(message: PeerDisconnected) {
    if (message.peerId) console.log('Peer disconnected: %O', message);

    const peerId = message.peerId;
    const session = this.peerSessions.get(peerId);
    session?.close();

    this.peerSessions.delete(peerId);

    const room = await this.fishjamClient.getRoom(message.roomId);
    const activePeers = room.peers.filter((peer) => peer.status == 'connected');
    if (activePeers.length == 1) {
      console.log('Last peer left room, removing agent');
      await this.fishjamClient.deletePeer(message.roomId, activePeers[0].id);
    }
  }

  handleTrackData(message: IncomingTrackData) {
    const { data, peerId } = message;

    const session = this.peerSessions.get(peerId);
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
