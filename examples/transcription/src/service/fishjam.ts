import { FishjamClient, FishjamConfig, RoomId, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';

export class FishjamService {
  roomId?: RoomId;
  fishjam: FishjamClient;

  constructor(config: FishjamConfig) {
    this.fishjam = new FishjamClient(config);
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

  private async makeRoom() {
    const { id: roomId } = await this.fishjam.createRoom();
    this.roomId = roomId;
  }

  private async makePeer() {
    if (!this.roomId) await this.makeRoom();
    return this.fishjam.createPeer(this.roomId!, { subscribe: { audioSampleRate: 16000 } });
  }
}
