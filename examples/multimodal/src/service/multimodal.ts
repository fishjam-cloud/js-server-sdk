import {
  FishjamAgent,
  FishjamConfig,
  FishjamWSNotifier,
  FishjamClient,
  PeerConnected,
  PeerDisconnected,
  PeerId,
  RoomId,
  TrackAdded,
  TrackRemoved,
  TrackId,
  IncomingTrackData,
  IncomingTrackImage,
} from '@fishjam-cloud/js-server-sdk';
import GeminiIntegration from '@fishjam-cloud/js-server-sdk/gemini';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { MULTIMODAL_MODEL, CAPTURE_INTERVAL_MS } from '../const';

type AgentState = {
  agent: FishjamAgent;
  outputTrackId: TrackId;
};

export class MultimodalService {
  peerSessions: Map<PeerId, Session> = new Map();
  agents: Map<RoomId, AgentState> = new Map();
  videoTracks: Map<RoomId, Set<TrackId>> = new Map();
  captureIntervals: Map<RoomId, ReturnType<typeof setInterval>> = new Map();
  ai: GoogleGenAI;
  fishjamConfig: FishjamConfig;
  fishjamClient: FishjamClient;

  constructor(fishjamConfig: FishjamConfig, geminiKey: string) {
    this.ai = GeminiIntegration.createClient({ apiKey: geminiKey });
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
    notifier.on('trackAdded', (msg) => this.handleTrackAdded(msg));
    notifier.on('trackRemoved', (msg) => this.handleTrackRemoved(msg));
  }

  async handlePeerConnected(message: PeerConnected) {
    if (message.peerType === 2) return;

    console.log('Peer connected: %O', message);

    const peerId = message.peerId;
    const agentState = this.agents.get(message.roomId);

    if (agentState && peerId === (agentState as { agent: FishjamAgent }).agent.constructor.name) return;

    if (agentState == undefined) {
      const {
        peer: { id: newAgentId },
        agent,
      } = await this.fishjamClient.createAgent(
        message.roomId,
        { output: GeminiIntegration.geminiInputAudioSettings },
        {
          onClose: (code, reason) => console.log(`Fishjam agent websocket closed. code: ${code}, reason: ${reason}`),
          onError: (error) => console.error('Fishjam agent websocket error: %O', error),
        }
      );

      const outputTrack = agent.createTrack(GeminiIntegration.geminiOutputAudioSettings);

      this.agents.set(message.roomId, { agent, outputTrackId: outputTrack.id });
      this.videoTracks.set(message.roomId, new Set());

      agent.on('trackData', (msg) => this.handleTrackData(msg));
      agent.on('trackImage', (msg) => this.handleTrackImage(message.roomId, msg));

      this.startImageCapture(message.roomId);

      console.log(`Agent ${newAgentId} created`);
    }

    const session = await this.ai.live.connect({
      model: MULTIMODAL_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onopen: () => console.log(`Connected to Gemini Live API for peer ${peerId}.`),
        onerror: (error) => console.error(`Gemini error for peer ${peerId}: %O`, error),
        onclose: (e) =>
          console.log(`Connection to Gemini Live API for peer ${peerId} closed. code: ${e.code}, reason: ${e.reason}`),
        onmessage: (msg) => this.handleGeminiMessage(message.roomId, peerId, msg),
      },
    });
    this.peerSessions.set(peerId, session);
  }

  async handlePeerDisconnected(message: PeerDisconnected) {
    const agentState = this.agents.get(message.roomId);
    if (agentState) {
      // Check if the disconnecting peer is the agent itself
      const room = await this.fishjamClient.getRoom(message.roomId);
      const isAgent = room.peers.every((peer) => peer.id !== message.peerId);
      if (isAgent) return this.handleAgentDisconnected(message);
    }

    this.handleWebrtcPeerDisconnected(message);
  }

  handleAgentDisconnected(message: PeerDisconnected) {
    console.log(`Agent ${message.peerId} disconnected`);

    this.stopImageCapture(message.roomId);
    this.agents.delete(message.roomId);
    this.videoTracks.delete(message.roomId);
  }

  async handleWebrtcPeerDisconnected(message: PeerDisconnected) {
    console.log('Peer disconnected: %O', message);

    const peerId = message.peerId;
    const session = this.peerSessions.get(peerId);
    session?.close();
    this.peerSessions.delete(peerId);

    const room = await this.fishjamClient.getRoom(message.roomId);
    const activePeers = room.peers.filter((peer) => peer.status === 'connected');
    if (activePeers.length === 1) {
      console.log('Last peer left room, removing agent');
      this.stopImageCapture(message.roomId);
      await this.fishjamClient.deletePeer(message.roomId, activePeers[0].id);
    }
  }

  handleTrackAdded(message: TrackAdded) {
    if (!message.track || message.track.type !== 1) return; // 2 = TRACK_TYPE_VIDEO

    const trackId = message.track.id as TrackId;
    const tracks = this.videoTracks.get(message.roomId);
    if (tracks) {
      tracks.add(trackId);
      console.log(`Video track ${trackId} added in room ${message.roomId}`);
    }
  }

  handleTrackRemoved(message: TrackRemoved) {
    if (!message.track) return;

    const trackId = message.track.id as TrackId;
    const tracks = this.videoTracks.get(message.roomId);
    if (tracks) {
      tracks.delete(trackId);
      console.log(`Video track ${trackId} removed from room ${message.roomId}`);
    }
  }

  handleTrackData(message: IncomingTrackData) {
    const { data, peerId } = message;
    const session = this.peerSessions.get(peerId);

    session?.sendRealtimeInput({
      audio: {
        data: data.toBase64(),
        mimeType: GeminiIntegration.inputMimeType,
      },
    });
  }

  handleTrackImage(roomId: RoomId, message: IncomingTrackImage) {
    const { contentType, data } = message;

    for (const [peerId, session] of this.peerSessions) {
      session.sendRealtimeInput({
        media: {
          data: Buffer.from(data).toString('base64'),
          mimeType: contentType,
        },
      });
    }
  }

  handleGeminiMessage(roomId: RoomId, peerId: PeerId, msg: LiveServerMessage) {
    const agentState = this.agents.get(roomId);
    if (!agentState) return;

    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData;
    if (audioData?.data) {
      const buffer = Buffer.from(audioData.data, 'base64');
      agentState.agent.sendData(agentState.outputTrackId, new Uint8Array(buffer));
    }

    const transcription = msg.serverContent?.inputTranscription?.text;
    if (transcription) console.log(`Peer ${peerId} said: "${transcription}".`);
  }

  private startImageCapture(roomId: RoomId) {
    const interval = setInterval(() => {
      const agentState = this.agents.get(roomId);
      const tracks = this.videoTracks.get(roomId);

      if (!agentState || !tracks || tracks.size === 0) return;

      for (const trackId of tracks) {
        console.log('Sending image capture request for track', trackId);
        agentState.agent.captureImage(trackId);
      }
    }, CAPTURE_INTERVAL_MS);

    this.captureIntervals.set(roomId, interval);
  }

  private stopImageCapture(roomId: RoomId) {
    const interval = this.captureIntervals.get(roomId);
    if (interval) {
      clearInterval(interval);
      this.captureIntervals.delete(roomId);
    }
  }
}
