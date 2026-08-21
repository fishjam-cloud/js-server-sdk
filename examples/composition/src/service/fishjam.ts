import { FishjamClient } from '@fishjam-cloud/js-server-sdk';
import type { FishjamConfig, RoomId } from '@fishjam-cloud/js-server-sdk';

export class FishjamService {
  private readonly fishjam: FishjamClient;
  readonly roomId: RoomId;
  readonly livestreamId: RoomId;

  private constructor(fishjam: FishjamClient, roomId: RoomId, livestreamId: RoomId) {
    this.fishjam = fishjam;
    this.roomId = roomId;
    this.livestreamId = livestreamId;
  }

  static async create(config: FishjamConfig): Promise<FishjamService> {
    const fishjam = await FishjamClient.create(config);
    const room = await fishjam.createRoom();
    const livestream = await fishjam.createRoom({ roomType: 'livestream' });

    return new FishjamService(fishjam, room.id, livestream.id);
  }

  async createPeer() {
    return this.fishjam.createPeer(this.roomId);
  }

  async createViewerToken() {
    return this.fishjam.createLivestreamViewerToken(this.livestreamId);
  }

  async createStreamerToken() {
    return this.fishjam.createLivestreamStreamerToken(this.livestreamId);
  }

  livestreamWhipUrl() {
    return this.fishjam.livestreamWhipUrl();
  }

  async composeRoomInto(compositionUrl: string) {
    await this.fishjam.forwardRoomTracks(this.roomId, compositionUrl);
  }

  async cleanup() {
    await this.fishjam.deleteRoom(this.roomId);
    await this.fishjam.deleteRoom(this.livestreamId);
  }
}
