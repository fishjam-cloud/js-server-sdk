
import { FishjamClient, FishjamConfig, FishjamWSNotifier, RoomId, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';

function logEvent(event: string, details: object) {
  console.log(`[${new Date().toISOString()}] ${event}:`, JSON.stringify(details, null, 2));
}

export class FishjamService {
  roomId?: RoomId;
  fishjam: FishjamClient;

  constructor(config: FishjamConfig) {
    this.fishjam = new FishjamClient(config);
    const notifier = new FishjamWSNotifier(
      config,
      (error) => logEvent('WebSocket error', { error }),
      (code, reason) => logEvent('WebSocket closed', { code, reason })
    );

    notifier.on('peerConnected', (msg) => this.handlePeerConnected(msg));
    notifier.on('peerDisconnected', (msg) => this.handlePeerDisconnected(msg));
    notifier.on('trackAdded', (msg) => this.handleIncomingTrack(msg));
    notifier.on('trackRemoved', (msg) => this.handleTrackRemoved(msg));
  }

  async createPeer() {
    try {
      return await this.makePeer();
    } catch (e) {
      if (e instanceof RoomNotFoundException) {
        await this.makeRoom();
        return this.makePeer();
      }
      throw e;
    }
  }

  async createAgent() {
    try {
      return await this.makePeer();
    } catch (e) {
      if (e instanceof RoomNotFoundException) {
        await this.makeRoom();
        return this.makePeer();
      }
      throw e;
    }
  }

  async subscribePeer(subscriberId: string, producerId: string) {
    try {
      logEvent('Subscribe peer', { subscriberId, producerId });
      return await this.fishjam.subscribePeer(this.roomId, subscriberId, producerId);
    } catch (e) {
      logEvent('Subscribe peer error', { error: e });
      throw e;
    }
  }

  async subscribeTracks(subscriberId: string, tracks: string[]) {
    try {
      logEvent('Subscribe tracks', { subscriberId, tracks });
      return await this.fishjam.subscribeTracks(this.roomId, subscriberId, tracks);
    } catch (e) {
      logEvent('Subscribe tracks error', { error: e });
      throw e;
    }
  }

  private async makeRoom() {
    const { id: roomId } = await this.fishjam.createRoom();
    this.roomId = roomId;
    logEvent('Room created', { roomId });
  }

  private async makePeer() {
    if (!this.roomId) await this.makeRoom();
    const peer = await this.fishjam.createPeer(this.roomId!, { subscribeMode: "manual"});
    logEvent('Peer created', { peerId: peer.peer.id });
    return peer;
  }

  private handlePeerConnected(message: any) {
    logEvent('Peer connected', message);
  }

  private handlePeerDisconnected(message: any) {
    logEvent('Peer disconnected', message);
  }

  private handleIncomingTrack(message: any) {
    logEvent('Track added', message);
  }

  private handleTrackRemoved(message: any) {
    logEvent('Track removed', message);
  }
}
