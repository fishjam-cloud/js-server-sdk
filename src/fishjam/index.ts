import axios from 'axios';
import { RoomApi } from '@fishjam-cloud/js-server-sdk';
import { Room } from '..';

type PeerConfig = { enableSimulcast?: boolean };
type RoomConfig = { maxPeers?: number; peerlessPurgeTimeout?: number };

type FishjamConfig = {
  fishjamUrl: string;
  serverToken: string;
} & PeerConfig &
  RoomConfig;

export class FishjamClient {
  private readonly roomApi: RoomApi;
  private readonly config: FishjamConfig;

  constructor(config: FishjamConfig) {
    const client = axios.create({
      headers: {
        Authorization: `Bearer ${config.fishjamUrl}`,
      },
    });

    this.config = config;
    this.roomApi = new RoomApi(undefined, config.fishjamUrl, client);
  }

  async createUser(roomId: string, peerConfig?: PeerConfig) {
    const {
      data: { data },
    } = await this.roomApi.addPeer(roomId, {
      type: 'webrtc',
      options: { enableSimulcast: this.config.enableSimulcast, ...peerConfig },
    });

    return data.peer;
  }

  async createRoom(roomConfig?: RoomConfig) {
    const config: RoomConfig = {
      maxPeers: this.config.maxPeers,
      peerlessPurgeTimeout: this.config.peerlessPurgeTimeout,
      ...roomConfig,
    };

    const {
      data: { data },
    } = await this.roomApi.createRoom(config);

    return data.room;
  }

  async getAllRooms() {
    const getAllRoomsRepsonse = await this.roomApi.getAllRooms();

    return getAllRoomsRepsonse.data.data ?? [];
  }

  async getRoom(roomId: string): Promise<Omit<Room, 'components'> | null> {
    const getRoomResponse = await this.roomApi.getRoom(roomId);

    return getRoomResponse.data.data;
  }

  async deletePeer(roomId: string, peerId: string) {
    await this.roomApi.deletePeer(roomId, peerId);
  }

  async deleteRoom(roomId: string) {
    await this.roomApi.deleteRoom(roomId);
  }
}
