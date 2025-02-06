import axios from 'axios';
import { RoomApi, RoomConfig, PeerOptions, Peer } from '@fishjam-cloud/fishjam-openapi';
import { FishjamConfig, Room } from './types';
import { raiseExceptions } from './exceptions/mapper';

/**
 * Client class that allows to manage Rooms and Peers for Fishjam App.
 * It requires Fishjam URL and management token that can be retrieved from Fishjam Dashboard.
 * @category Client
 */
export class FishjamClient {
  private readonly roomApi: RoomApi;

  constructor(config: FishjamConfig) {
    const client = axios.create({
      headers: {
        Authorization: `Bearer ${config.managementToken}`,
      },
    });

    this.roomApi = new RoomApi(undefined, config.fishjamUrl, client);
  }

  /**
   * Create new room. All peers connected to same room will be able to send/receive streams to each other
   */
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

  /**
   * Delete existing room. All peers connected to this room will be disconnected and removed.
   * @param roomId
   */
  async deleteRoom(roomId: string): Promise<void> {
    await this.roomApi.deleteRoom(roomId).catch((error) => raiseExceptions(error, 'room'));
  }

  /**
   * Get list of all existing rooms.
   */
  async getAllRooms(): Promise<Room[]> {
    const getAllRoomsRepsonse = await this.roomApi.getAllRooms().catch(raiseExceptions);
    return getAllRoomsRepsonse.data.data.map(({ components: _, ...room }) => room) ?? [];
  }

  /**
   * Create new peer assigned to room
   * @param roomId
   * @param options
   * @returns
   */
  async createPeer(roomId: string, options: PeerOptions = {}): Promise<{ peer: Peer; peerToken: string }> {
    const response = await this.roomApi
      .addPeer(roomId, {
        type: 'webrtc',
        options,
      })
      .catch(raiseExceptions);

    const {
      data: { data },
    } = response;

    return { peer: data.peer, peerToken: data.token };
  }

  /**
   * Get details about given room
   * @param roomId
   * @returns
   */
  async getRoom(roomId: string): Promise<Room> {
    const getRoomResponse = await this.roomApi.getRoom(roomId).catch((error) => raiseExceptions(error, 'room'));
    const { components: _, ...room } = getRoomResponse.data.data;
    return room;
  }

  /**
   * Delete peer - this will also disconnect peer from room
   * @param roomId
   * @param peerId
   */
  async deletePeer(roomId: string, peerId: string): Promise<void> {
    await this.roomApi.deletePeer(roomId, peerId).catch((error) => raiseExceptions(error, 'peer'));
  }

  /**
   * Refresh peer token for already existing peer.
   * If  already created peer was not connected to room for more than 24 hours, token will became invalid. This method can be used to generate new peer_token for existing peer.
   * @param roomId
   * @param peerId
   * @returns refreshed peer token
   */
  async refreshPeerToken(roomId: string, peerId: string): Promise<string> {
    const refreshTokenResponse = await this.roomApi
      .refreshToken(roomId, peerId)
      .catch((error) => raiseExceptions(error, 'peer'));
    return refreshTokenResponse.data.data.token;
  }
}
