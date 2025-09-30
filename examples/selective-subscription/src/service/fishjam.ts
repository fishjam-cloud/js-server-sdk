
import { FishjamClient, FishjamConfig, FishjamWSNotifier, RoomId, PeerId, TrackId, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';

export class FishjamService extends EventTarget {
  roomId?: RoomId;
  fishjam: FishjamClient;

  constructor(config: FishjamConfig) {
    super();
    this.fishjam = new FishjamClient(config);
    const notifier = new FishjamWSNotifier(config, () => {}, () => {});

    notifier.on('peerConnected', (msg) => this.emit('peerConnected', msg));
    notifier.on('peerDisconnected', (msg) => this.emit('peerDisconnected', msg));
    notifier.on('trackAdded', (msg) => this.emit('trackAdded', msg));
    notifier.on('trackRemoved', (msg) => this.emit('trackRemoved', msg));
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

  async subscribePeer(subscriberId: string, producerId: string) {
    return await this.fishjam.subscribePeer(this.roomId!, subscriberId as PeerId, producerId as PeerId);
  }

  async subscribeTracks(subscriberId: string, tracks: string[]) {
    return await this.fishjam.subscribeTracks(this.roomId!, subscriberId as PeerId, tracks as TrackId[]);
  }

  private async makeRoom() {
    const { id: roomId } = await this.fishjam.createRoom();
    this.roomId = roomId;
  }

  private async makePeer() {
    if (!this.roomId) await this.makeRoom();
    return await this.fishjam.createPeer(this.roomId!, { subscribeMode: "manual" });
  }

  private emit(type: string, data: any) {
    const event = new CustomEvent('notification', {
      detail: { type, data, timestamp: new Date().toISOString() }
    });
    this.dispatchEvent(event);
  }
}
