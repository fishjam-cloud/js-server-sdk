import axios from 'axios';
import { RoomApi, RoomConfig, PeerOptions, Peer } from 'fishjam-openapi';
import { FishjamConfig, Room } from './types';
import { raisePossibleExceptions } from './exceptions/mapper';

export class FishjamClient {
  private readonly roomApi: RoomApi;

  constructor(config: FishjamConfig) {
    const client = axios.create({
      validateStatus: (status) => [200, 201, 400, 401, 404, 503].includes(status),
      headers: {
        Authorization: `Bearer ${config.serverToken}`,
      },
    });

    this.roomApi = new RoomApi(undefined, config.fishjamUrl, client);
  }

  async createPeer(roomId: string, options: PeerOptions = {}): Promise<{ peer: Peer; token: string }> {
    const response = await this.roomApi.addPeer(roomId, {
      type: 'webrtc',
      options,
    });

    raisePossibleExceptions(response.status);

    const {
      data: { data },
    } = response;

    return { peer: data.peer, token: data.token };
  }

  async createRoom(config: RoomConfig = {}): Promise<Room> {
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

  async getAllRooms(): Promise<Room[]> {
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

  async deletePeer(roomId: string, peerId: string): Promise<void> {
    const response = await this.roomApi.deletePeer(roomId, peerId);

    raisePossibleExceptions(response.status, 'peer');
  }

  async deleteRoom(roomId: string): Promise<void> {
    const response = await this.roomApi.deleteRoom(roomId);

    raisePossibleExceptions(response.status, 'room');
  }
}
