import axios from 'axios';
import { RoomApi, PeerOptions, ViewerApi, RoomConfig, StreamerApi } from '@fishjam-cloud/fishjam-openapi';
import {
  AgentCallbacks,
  FishjamConfig,
  PeerId,
  Room,
  RoomId,
  Peer,
  ErrorEventHandler,
  CloseEventHandler,
} from './types';
import { mapException } from './exceptions/mapper';
import { getFishjamUrl } from './utils';
import { FishjamAgent, TrackId } from './agent';

/**
 * Client class that allows to manage Rooms and Peers for a Fishjam App.
 * It requires the Fishjam ID and management token that can be retrieved from the Fishjam Dashboard.
 * @category Client
 */
export class FishjamClient {
  private readonly roomApi: RoomApi;
  private readonly viewerApi: ViewerApi;
  private readonly streamerApi: StreamerApi;
  private readonly fishjamConfig: FishjamConfig;

  /**
   * Create new instance of Fishjam Client.
   *
   * Example usage:
   * ```
   * const fishjamClient = new FishjamClient({
   *   fishjamId: fastify.config.FISHJAM_ID,
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

    const fishjamUrl = getFishjamUrl(config);

    this.roomApi = new RoomApi(undefined, fishjamUrl, client);
    this.viewerApi = new ViewerApi(undefined, fishjamUrl, client);
    this.streamerApi = new StreamerApi(undefined, fishjamUrl, client);
    this.fishjamConfig = config;
  }

  /**
   * Create a new room. All peers connected to the same room will be able to send/receive streams to each other.
   */
  async createRoom(config: RoomConfig = {}): Promise<Room> {
    try {
      const response = await this.roomApi.createRoom(config);

      const {
        data: {
          data: { room },
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
      return (getAllRoomsResponse.data.data as Room[]) ?? [];
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
   * Create a new agent assigned to a room.
   */
  async createAgent(
    roomId: RoomId,
    options: PeerOptions = {},
    callbacks?: AgentCallbacks
  ): Promise<{ agent: FishjamAgent; peer: Peer }> {
    try {
      const response = await this.roomApi.addPeer(roomId, {
        type: 'agent',
        options,
      });

      const {
        data: { data },
      } = response;
      const agent = new FishjamAgent(this.fishjamConfig, data.token, callbacks);

      return { agent: agent, peer: data.peer as Peer };
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
      return getRoomResponse.data.data as Room;
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
   * Subscribe a peer to another peer - this will make all tracks from the publisher available to the subscriber.
   * Using this function only makes sense if subscribeMode is set to manual
   */
  async subscribePeer(roomId: RoomId, subscriberPeerId: PeerId, publisherPeerId: PeerId): Promise<void> {
    try {
      await this.roomApi.subscribePeer(roomId, subscriberPeerId, publisherPeerId);
    } catch (error) {
      throw mapException(error, 'peer');
    }
  }

  /**
   * Subscribe a peer to specific tracks from another peer - this will make only the specified tracks from the publisher available to the subscriber.
   * Using this function only makes sense if subscribeMode is set to manual
   */
  async subscribeTracks(roomId: RoomId, subscriberPeerId: PeerId, tracks: TrackId[]): Promise<void> {
    try {
      await this.roomApi.subscribeTracks(roomId, subscriberPeerId, { track_ids: tracks });
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
      const tokenResponse = await this.viewerApi.generateViewerToken(roomId);
      return tokenResponse.data;
    } catch (error) {
      throw mapException(error);
    }
  }

  /**
   * Creates a livestream streamer token for the given room.
   * @returns a livestream streamer token
   */
  async createLivestreamStreamerToken(roomId: RoomId) {
    try {
      const tokenResponse = await this.streamerApi.generateStreamerToken(roomId);
      return tokenResponse.data;
    } catch (error) {
      throw mapException(error);
    }
  }
}
