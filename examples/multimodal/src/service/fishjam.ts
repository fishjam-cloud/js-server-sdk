import { FishjamClient, FishjamConfig, RoomId, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';

export class FishjamService {
  roomId?: RoomId;
  fishjam: FishjamClient;

  private constructor(fishjam: FishjamClient) {
    this.fishjam = fishjam;
  }

  static async create(config: FishjamConfig): Promise<FishjamService> {
    const fishjam = await FishjamClient.create(config);
    return new FishjamService(fishjam);
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
    return this.fishjam.createPeer(this.roomId!);
  }
}
