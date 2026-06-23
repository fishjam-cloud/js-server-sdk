import axios, { RawAxiosResponseHeaders } from 'axios';
import {
  MoQApi,
  RoomsApi,
  ViewersApi,
  RoomConfig,
  CredentialsApi,
  StreamersApi,
  PeerOptionsWebRTC,
  PeerOptionsVapi,
  PeerOptionsAgent,
  MoqAccessConfig,
} from '@fishjam-cloud/fishjam-openapi';
import type { AgentCallbacks, FishjamConfig, PeerId, Room, RoomId, Peer } from './types';
import { mapException } from './exceptions/mapper';
import { getFishjamUrl } from './utils';
import { FishjamAgent, TrackId } from './agent';
import packageJson from '../package.json';

/**
 * Client class that allows to manage Rooms and Peers for a Fishjam App.
 * It requires the Fishjam ID and management token that can be retrieved from the Fishjam Dashboard.
 * @category Client
 */
export class FishjamClient {
  private readonly moqApi: MoQApi;
  private readonly roomApi: RoomsApi;
  private readonly viewerApi: ViewersApi;
  private readonly streamerApi: StreamersApi;
  private readonly credentialsApi: CredentialsApi;
  private readonly fishjamConfig: FishjamConfig;
  private deprecationWarningShown: boolean = false;

  /**
   * Create new instance of Fishjam Client.
   *
   * Does not verify credentials against the backend — use
   * {@link FishjamClient.create} or call
   * {@link FishjamClient.checkCredentials} afterwards for that.
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
        'x-fishjam-api-client': `js-server/${packageJson.version}`,
      },
    });

    client.interceptors.response.use((response) => {
      this.handleDeprecationHeader(response.headers);
      return response;
    });

    const fishjamUrl = getFishjamUrl(config);

    this.moqApi = new MoQApi(undefined, fishjamUrl, client);
    this.roomApi = new RoomsApi(undefined, fishjamUrl, client);
    this.viewerApi = new ViewersApi(undefined, fishjamUrl, client);
    this.streamerApi = new StreamersApi(undefined, fishjamUrl, client);
    this.credentialsApi = new CredentialsApi(undefined, fishjamUrl, client);
    this.fishjamConfig = config;
  }

  /**
   * Async factory: constructs a client and verifies credentials against
   * the backend.
   *
   * Throws {@link InvalidFishjamCredentialsException} when the
   * `fishjamId` / `managementToken` pair is rejected by the backend.
   *
   * Example:
   * ```
   * const client = await FishjamClient.create({
   *   fishjamId: process.env.FISHJAM_ID!,
   *   managementToken: process.env.FISHJAM_MANAGEMENT_TOKEN!,
   * });
   * ```
   */
  static async create(config: FishjamConfig): Promise<FishjamClient> {
    const client = new FishjamClient(config);
    await client.checkCredentials();
    return client;
  }

  /**
   * Verifies the configured credentials by making a single lightweight
   * call to the Fishjam backend. Resolves on success, throws
   * {@link InvalidFishjamCredentialsException} on 401/404 from the backend,
   * otherwise rethrows the standard mapped exception.
   */
  async checkCredentials(): Promise<void> {
    try {
      await this.credentialsApi.validateCredentials();
    } catch (error) {
      throw mapException(error);
    }
  }

  private handleDeprecationHeader(headers: RawAxiosResponseHeaders): void {
    try {
      const deprecationHeader = headers['x-fishjam-api-deprecated'];
      if (!deprecationHeader || this.deprecationWarningShown) return;
      const deprecationStatus = JSON.parse(deprecationHeader as string);

      if (deprecationStatus.status === 'unsupported') {
        console.error(deprecationStatus.message);
      } else if (deprecationStatus.status === 'deprecated') {
        console.warn(deprecationStatus.message);
      }
      this.deprecationWarningShown = true;
    } catch {
      // ignore parsing errors
    }
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
  async createPeer(roomId: RoomId, options: PeerOptionsWebRTC = {}): Promise<{ peer: Peer; peerToken: string }> {
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
    options: PeerOptionsAgent = {},
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
      await agent.awaitConnected();

      return { agent: agent, peer: data.peer as Peer };
    } catch (error) {
      throw mapException(error);
    }
  }

  /**
   * Create a new VAPI agent assigned to a room.
   */
  async createVapiAgent(roomId: RoomId, options: PeerOptionsVapi): Promise<{ peer: Peer }> {
    try {
      const response = await this.roomApi.addPeer(roomId, {
        type: 'vapi',
        options,
      });

      const {
        data: { data },
      } = response;

      return { peer: data.peer as Peer };
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

  /**
   * Creates MoQ access.
   * @returns connection details containing the relay URL with the JWT embedded as a `?jwt=` query parameter, and the token itself
   */
  async createMoqAccess(config?: MoqAccessConfig) {
    try {
      const accessResponse = await this.moqApi.createMoqAccess(config);
      return accessResponse.data;
    } catch (error) {
      throw mapException(error);
    }
  }
}
