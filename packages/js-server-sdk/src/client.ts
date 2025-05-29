import axios from 'axios';
import { RoomApi, PeerOptions, ViewerApi, RoomConfigRoomTypeEnum } from '@fishjam-cloud/fishjam-openapi';
import { FishjamConfig, PeerId, Room, RoomId, Peer, RoomOptions } from './types';
import { mapException } from './exceptions/mapper';

/**
 * Client class that allows to manage Rooms and Peers for a Fishjam App.
 * It requires the Fishjam URL and management token that can be retrieved from the Fishjam Dashboard.
 * @category Client
 */
export class FishjamClient {
  private readonly roomApi: RoomApi;
  private readonly viewerApi: ViewerApi;

  /**
   * Create new instance of Fishjam Client.
   *
   * Example usage:
   * ```
   * const fishjamClient = new FishjamClient({
   *   fishjamUrl: fastify.config.FISHJAM_URL,
   *   managementToken: fastify.config.FISHJAM_MANAGEMENT_TOKEN,
   * });
   * ```
   */
  constructor(config: FishjamConfig) {
    const client = axios.create({
      headers: {
        Authorization: `Bearer ${config.managementToken}`,
      },
    });

    this.roomApi = new RoomApi(undefined, config.fishjamUrl, client);
    this.viewerApi = new ViewerApi(undefined, config.fishjamUrl, client);
  }

  /**
   * Create a new room. All peers connected to the same room will be able to send/receive streams to each other.
   */
  async createRoom(config: RoomOptions = {}): Promise<Room> {
    try {
      // TODO: remove after changing type broadcaster to livestream in Fishjam
      const parsedRoomType = config.roomType == 'livestream' ? RoomConfigRoomTypeEnum.Broadcaster : config.roomType;
      const response = await this.roomApi.createRoom({ ...config, roomType: parsedRoomType });

      const {
        data: {
          data: {
            room: { components: _, ...room },
          },
        },
      } = response;

      return room as Room;
    } catch (error) {
      throw mapException(error);
    }
  }

  /**
   * Delete an existing room. All peers connected to this room will be disconnected and removed.
   */
  async deleteRoom(roomId: RoomId): Promise<void> {
    try {
      await this.roomApi.deleteRoom(roomId);
    } catch (error) {
      throw mapException(error, 'room');
    }
  }

  /**
   * Get a list of all existing rooms.
   */
  async getAllRooms(): Promise<Room[]> {
    try {
      const getAllRoomsResponse = await this.roomApi.getAllRooms();
      return getAllRoomsResponse.data.data.map(({ components: _, ...room }) => room as Room) ?? [];
    } catch (error) {
      throw mapException(error);
    }
  }

  /**
   * Create a new peer assigned to a room.
   */
  async createPeer(roomId: RoomId, options: PeerOptions = {}): Promise<{ peer: Peer; peerToken: string }> {
    try {
      const response = await this.roomApi.addPeer(roomId, {
        type: 'webrtc',
        options,
      });

      const {
        data: { data },
      } = response;

      return { peer: data.peer as Peer, peerToken: data.token };
    } catch (error) {
      throw mapException(error);
    }
  }

  /**
   * Get details about a given room.
   */
  async getRoom(roomId: RoomId): Promise<Room> {
    try {
      const getRoomResponse = await this.roomApi.getRoom(roomId);
      const { components: _, ...room } = getRoomResponse.data.data;
      return room as Room;
    } catch (error) {
      throw mapException(error, 'room');
    }
  }

  /**
   * Delete a peer - this will also disconnect the peer from the room.
   */
  async deletePeer(roomId: RoomId, peerId: PeerId): Promise<void> {
    try {
      await this.roomApi.deletePeer(roomId, peerId);
    } catch (error) {
      throw mapException(error, 'peer');
    }
  }

  /**
   * Refresh the peer token for an already existing peer.
   * If an already created peer has not been connected to the room for more than 24 hours, the token will become invalid. This method can be used to generate a new peer token for the existing peer.
   * @returns refreshed peer token
   */
  async refreshPeerToken(roomId: RoomId, peerId: PeerId): Promise<string> {
    try {
      const refreshTokenResponse = await this.roomApi.refreshToken(roomId, peerId);
      return refreshTokenResponse.data.data.token;
    } catch (error) {
      throw mapException(error, 'peer');
    }
  }

  /**
   * Creates a livestream viewer token for the given room.
   * @returns a livestream viewer token
   */
  async createLivestreamViewerToken(roomId: RoomId) {
    try {
      const tokenResponse = await this.viewerApi.generateToken(roomId);
      return tokenResponse.data;
    } catch (error) {
      throw mapException(error);
    }
  }
}
