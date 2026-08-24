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

    try {
      const livestream = await fishjam.createRoom({ roomType: 'livestream' });

      return new FishjamService(fishjam, room.id, livestream.id);
    } catch (error) {
      await fishjam.deleteRoom(room.id);
      throw error;
    }
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
    const results = await Promise.allSettled([
      this.fishjam.deleteRoom(this.roomId),
      this.fishjam.deleteRoom(this.livestreamId),
    ]);
    const failure = results.find((result) => result.status === 'rejected');

    if (failure) throw failure.reason;
  }
}
