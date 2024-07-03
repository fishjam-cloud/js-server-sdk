import axios from 'axios';
import { RoomApi, RoomConfig, PeerOptions } from 'fishjam-openapi';
import { Room } from './types';
import { raisePossibleExceptions } from './exceptions/mapper';

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
    const response = await this.roomApi.addPeer(roomId, {
      type: 'webrtc',
      options,
    });

    raisePossibleExceptions(response.status);

    const {
      data: { data },
    } = response;

    return [data.peer, { websocketUrl: data.peer_websocket_url, websocketToken: data.token }] as const;
  }

  async createRoom(config: RoomConfig = {}) {
    const response = await this.roomApi.createRoom(config);

    raisePossibleExceptions(response.status);

    const {
      data: {
        data: {
          room: { components: _, ...room },
        },
      },
    } = response;

    return room;
  }

  async getAllRooms() {
    const getAllRoomsRepsonse = await this.roomApi.getAllRooms();

    raisePossibleExceptions(getAllRoomsRepsonse.status);

    return getAllRoomsRepsonse.data.data.map(({ components: _, ...room }) => room) ?? [];
  }

  async getRoom(roomId: string): Promise<Room> {
    const getRoomResponse = await this.roomApi.getRoom(roomId);

    raisePossibleExceptions(getRoomResponse.status, 'room');

    const { components: _, ...room } = getRoomResponse.data.data;

    return room;
  }

  async deletePeer(roomId: string, peerId: string) {
    const response = await this.roomApi.deletePeer(roomId, peerId);

    raisePossibleExceptions(response.status, 'peer');
  }

  async deleteRoom(roomId: string) {
    const response = await this.roomApi.deleteRoom(roomId);

    raisePossibleExceptions(response.status, 'room');
  }
}
