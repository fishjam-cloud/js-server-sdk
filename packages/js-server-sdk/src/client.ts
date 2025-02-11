import axios from 'axios';
import { RoomApi, RoomConfig, PeerOptions } from '@fishjam-cloud/fishjam-openapi';
import { FishjamConfig, PeerId, Room, RoomId, Peer } from './types';
import { raiseExceptions } from './exceptions/mapper';

/**
 * Client class that allows to manage Rooms and Peers for a Fishjam App.
 * It requires the Fishjam URL and management token that can be retrieved from the Fishjam Dashboard.
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
   * Create a new room. All peers connected to the same room will be able to send/receive streams to each other.
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

    return room as Room;
  }

  /**
   * Delete an existing room. All peers connected to this room will be disconnected and removed.
   * @param roomId
   */
  async deleteRoom(roomId: RoomId): Promise<void> {
    await this.roomApi.deleteRoom(roomId).catch((error) => raiseExceptions(error, 'room'));
  }

  /**
   * Get a list of all existing rooms.
   */
  async getAllRooms(): Promise<Room[]> {
    const getAllRoomsRepsonse = await this.roomApi.getAllRooms().catch(raiseExceptions);
    return getAllRoomsRepsonse.data.data.map(({ components: _, ...room }) => room as Room) ?? [];
  }

  /**
   * Create a new peer assigned to a room.
   * @param roomId
   * @param options
   * @returns
   */
  async createPeer(roomId: RoomId, options: PeerOptions = {}): Promise<{ peer: Peer; peerToken: string }> {
    const response = await this.roomApi
      .addPeer(roomId, {
        type: 'webrtc',
        options,
      })
      .catch(raiseExceptions);

    const {
      data: { data },
    } = response;

    return { peer: data.peer as Peer, peerToken: data.token };
  }

  /**
   * Get details about a given room.
   * @param roomId
   * @returns
   */
  async getRoom(roomId: RoomId): Promise<Room> {
    const getRoomResponse = await this.roomApi.getRoom(roomId).catch((error) => raiseExceptions(error, 'room'));
    const { components: _, ...room } = getRoomResponse.data.data;
    return room as Room;
  }

  /**
   * Delete a peer - this will also disconnect the peer from the room.
   * @param roomId
   * @param peerId
   */
  async deletePeer(roomId: RoomId, peerId: PeerId): Promise<void> {
    await this.roomApi.deletePeer(roomId, peerId).catch((error) => raiseExceptions(error, 'peer'));
  }

  /**
   * Refresh the peer token for an already existing peer.
   * If an already created peer has not been connected to the room for more than 24 hours, the token will become invalid. This method can be used to generate a new peer token for the existing peer.
   * @param roomId
   * @param peerId
   * @returns refreshed peer token
   */
  async refreshPeerToken(roomId: RoomId, peerId: PeerId): Promise<string> {
    const refreshTokenResponse = await this.roomApi
      .refreshToken(roomId, peerId)
      .catch((error) => raiseExceptions(error, 'peer'));
    return refreshTokenResponse.data.data.token;
  }
}
