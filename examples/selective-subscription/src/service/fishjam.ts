
import { FishjamClient, FishjamConfig, FishjamWSNotifier, RoomId, PeerId, TrackId, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';

export class FishjamService {
  roomId?: RoomId;
  fishjam: FishjamClient;

  constructor(config: FishjamConfig) {
    this.fishjam = new FishjamClient(config);
    const notifier = new FishjamWSNotifier(
      config,
      (error) => console.log('WebSocket error', { error }),
      (code, reason) => console.log('WebSocket closed', { code, reason })
    );

    notifier.on('peerConnected', (msg) => this.handlePeerConnected(msg));
    notifier.on('peerDisconnected', (msg) => this.handlePeerDisconnected(msg));

    notifier.on('trackAdded', (msg) => this.handleTrackAdded(msg));
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
      console.log('Subscribe peer', { subscriberId, producerId });
      return await this.fishjam.subscribePeer(this.roomId!, subscriberId as PeerId, producerId as PeerId);
    } catch (e) {
      console.log('Subscribe peer error', { error: e });
      throw e;
    }
  }

  async subscribeTracks(subscriberId: string, tracks: string[]) {
    try {
      console.log('Subscribe tracks', { subscriberId, tracks });
      return await this.fishjam.subscribeTracks(this.roomId!, subscriberId as PeerId, tracks as TrackId[]);
    } catch (e) {
      console.log('Subscribe tracks error', { error: e });
      throw e;
    }
  }

  private async makeRoom() {
    const { id: roomId } = await this.fishjam.createRoom();
    this.roomId = roomId;
    console.log('Room created', { roomId });
  }

  private async makePeer() {
    if (!this.roomId) await this.makeRoom();
    const peer = await this.fishjam.createPeer(this.roomId!, { subscribeMode: "manual"});
    console.log('Peer created', { peerId: peer.peer.id });
    return peer;
  }

  private async makeAgent() {
    if (!this.roomId) await this.makeRoom();
    const { agent, peer } = await this.fishjam.createAgent(this.roomId!);
    console.log('Agent created', { peerId: peer.id });
    return { agent, peer };
  }

  private handlePeerConnected(message: any) {
    const {roomId, peerId, peerType} = message
    console.log('Peer connected', {peerId: peerId});
  }

  private handlePeerDisconnected(message: any) {
    const {roomId, peerId, peerType} = message
    console.log('Peer disconnected', {peerId: peerId});
  }

  private handleTrackAdded(message: any) {
    const {roomId, peerId, componentId, track} = message
    console.log('Track added', {trackId: track.id, metadata: track.metadata});
  }

  private handleTrackRemoved(message: any) {
    const {roomId, peerId, componentId, track} = message
    console.log('Track removed', {trackId: track.id, metadata: track.metadata});
  }
}
