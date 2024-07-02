import axios from 'axios';
import { RoomApi, RoomConfig, PeerOptions } from './openapi';
import { Room } from './types';

type FishjamConfig = {
  fishjamUrl: string;
  serverToken: string;
};

export class FishjamClient {
  private readonly roomApi: RoomApi;

  constructor(config: FishjamConfig) {
    const client = axios.create({
      headers: {
        Authorization: `Bearer ${config.serverToken}`,
      },
    });

    this.roomApi = new RoomApi(undefined, config.fishjamUrl, client);
  }

  async createPeer(roomId: string, options: PeerOptions = {}) {
    const {
      data: { data },
    } = await this.roomApi.addPeer(roomId, {
      type: 'webrtc',
      options,
    });

    return [data.peer, { websocketUrl: data.peer_websocket_url, websocketToken: data.token }] as const;
  }

  async createRoom(config: RoomConfig = {}) {
    const {
      data: {
        data: {
          room: { components: _, ...room },
        },
      },
    } = await this.roomApi.createRoom(config);

    return room;
  }

  async getAllRooms() {
    const getAllRoomsRepsonse = await this.roomApi.getAllRooms();

    return getAllRoomsRepsonse.data.data.map(({ components: _, ...room }) => room) ?? [];
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const getRoomResponse = await this.roomApi.getRoom(roomId);
    const { components: _, ...room } = getRoomResponse.data.data;

    return room;
  }

  async deletePeer(roomId: string, peerId: string) {
    await this.roomApi.deletePeer(roomId, peerId);
  }

  async deleteRoom(roomId: string) {
    await this.roomApi.deleteRoom(roomId);
  }
}
