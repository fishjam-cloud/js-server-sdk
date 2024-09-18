import axios from 'axios';
import { RoomApi, RoomConfig, PeerOptions, Peer } from '@fishjam-cloud/fishjam-openapi';
import { FishjamConfig, Room } from './types';
import { raiseExceptions } from './exceptions/mapper';

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

  async createParticipant(
    roomId: string,
    options: PeerOptions = {}
  ): Promise<{ participant: Peer; participantToken: string }> {
    const response = await this.roomApi
      .addPeer(roomId, {
        type: 'webrtc',
        options,
      })
      .catch(raiseExceptions);

    const {
      data: { data },
    } = response;

    return { participant: data.peer, participantToken: data.token };
  }

  async createRoom(config: RoomConfig = {}): Promise<Room> {
    const response = await this.roomApi.createRoom(config).catch(raiseExceptions);

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
    const getAllRoomsRepsonse = await this.roomApi.getAllRooms().catch(raiseExceptions);
    return getAllRoomsRepsonse.data.data.map(({ components: _, ...room }) => room) ?? [];
  }

  async getRoom(roomId: string): Promise<Room> {
    const getRoomResponse = await this.roomApi.getRoom(roomId).catch((error) => raiseExceptions(error, 'room'));
    const { components: _, ...room } = getRoomResponse.data.data;
    return room;
  }

  async deleteParticipant(roomId: string, participantId: string): Promise<void> {
    await this.roomApi.deletePeer(roomId, participantId).catch((error) => raiseExceptions(error, 'participant'));
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.roomApi.deleteRoom(roomId).catch((error) => raiseExceptions(error, 'room'));
  }
}
