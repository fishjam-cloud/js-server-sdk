import {
  Configuration,
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
  type Middleware,
  RecordingsApi,
  RecordingConfig,
} from '@fishjam-cloud/fishjam-openapi';
import type { AgentCallbacks, FishjamConfig, PeerId, Recording, RecordingId, Room, RoomId, Peer } from './types';
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
  private readonly recordingsApi: RecordingsApi;
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
    const deprecationMiddleware: Middleware = {
      post: async ({ response }) => {
        this.handleDeprecationHeader(response.headers);
        return response;
      },
    };

    const apiConfig = new Configuration({
      basePath: getFishjamUrl(config),
      headers: {
        Authorization: `Bearer ${config.managementToken}`,
        'x-fishjam-api-client': `js-server/${packageJson.version}`,
      },
      middleware: [deprecationMiddleware],
    });

    this.moqApi = new MoQApi(apiConfig);
    this.roomApi = new RoomsApi(apiConfig);
    this.viewerApi = new ViewersApi(apiConfig);
    this.streamerApi = new StreamersApi(apiConfig);
    this.credentialsApi = new CredentialsApi(apiConfig);
    this.recordingsApi = new RecordingsApi(apiConfig);
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
      throw await mapException(error, 'credentials');
    }
  }

  private handleDeprecationHeader(headers: Headers): void {
    try {
      const deprecationHeader = headers.get('x-fishjam-api-deprecated');
      if (!deprecationHeader || this.deprecationWarningShown) return;
      const deprecationStatus = JSON.parse(deprecationHeader);

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
      const { data } = await this.roomApi.createRoom({ roomConfig: config });
      return data.room as Room;
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Delete an existing room. All peers connected to this room will be disconnected and removed.
   */
  async deleteRoom(roomId: RoomId): Promise<void> {
    try {
      await this.roomApi.deleteRoom({ roomId });
    } catch (error) {
      throw await mapException(error, 'room');
    }
  }

  /**
   * Get a list of all existing rooms.
   */
  async getAllRooms(): Promise<Room[]> {
    try {
      const { data } = await this.roomApi.getAllRooms();
      return (data as Room[]) ?? [];
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Create a new peer assigned to a room.
   */
  async createPeer(roomId: RoomId, options: PeerOptionsWebRTC = {}): Promise<{ peer: Peer; peerToken: string }> {
    try {
      const { data } = await this.roomApi.addPeer({
        roomId,
        peerConfig: { type: 'webrtc', options },
      });

      return { peer: data.peer as Peer, peerToken: data.token };
    } catch (error) {
      throw await mapException(error);
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
      const { data } = await this.roomApi.addPeer({
        roomId,
        peerConfig: { type: 'agent', options },
      });

      const agent = new FishjamAgent(this.fishjamConfig, data.token, callbacks, data.peer_websocket_url);
      await agent.awaitConnected();

      return { agent: agent, peer: data.peer as Peer };
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Create a new VAPI agent assigned to a room.
   */
  async createVapiAgent(roomId: RoomId, options: PeerOptionsVapi): Promise<{ peer: Peer }> {
    try {
      const { data } = await this.roomApi.addPeer({
        roomId,
        peerConfig: { type: 'vapi', options },
      });

      return { peer: data.peer as Peer };
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Get details about a given room.
   */
  async getRoom(roomId: RoomId): Promise<Room> {
    try {
      const { data } = await this.roomApi.getRoom({ roomId });
      return data as Room;
    } catch (error) {
      throw await mapException(error, 'room');
    }
  }

  /**
   * Delete a peer - this will also disconnect the peer from the room.
   */
  async deletePeer(roomId: RoomId, peerId: PeerId): Promise<void> {
    try {
      await this.roomApi.deletePeer({ roomId, id: peerId });
    } catch (error) {
      throw await mapException(error, 'peer');
    }
  }

  /**
   * Subscribe a peer to another peer - this will make all tracks from the publisher available to the subscriber.
   * Using this function only makes sense if subscribeMode is set to manual
   */
  async subscribePeer(roomId: RoomId, subscriberPeerId: PeerId, publisherPeerId: PeerId): Promise<void> {
    try {
      await this.roomApi.subscribePeer({ roomId, id: subscriberPeerId, peerId: publisherPeerId });
    } catch (error) {
      throw await mapException(error, 'peer');
    }
  }

  /**
   * Subscribe a peer to specific tracks from another peer - this will make only the specified tracks from the publisher available to the subscriber.
   * Using this function only makes sense if subscribeMode is set to manual
   */
  async subscribeTracks(roomId: RoomId, subscriberPeerId: PeerId, tracks: TrackId[]): Promise<void> {
    try {
      await this.roomApi.subscribeTracks({
        roomId,
        id: subscriberPeerId,
        subscribeTracksRequest: { track_ids: tracks },
      });
    } catch (error) {
      throw await mapException(error, 'peer');
    }
  }

  /**
   * Refresh the peer token for an already existing peer.
   * If an already created peer has not been connected to the room for more than 24 hours, the token will become invalid. This method can be used to generate a new peer token for the existing peer.
   * @returns refreshed peer token
   */
  async refreshPeerToken(roomId: RoomId, peerId: PeerId): Promise<string> {
    try {
      const { data } = await this.roomApi.refreshToken({ roomId, id: peerId });
      return data.token;
    } catch (error) {
      throw await mapException(error, 'peer');
    }
  }

  /**
   * Creates a livestream viewer token for the given room.
   * @returns a livestream viewer token
   */
  async createLivestreamViewerToken(roomId: RoomId) {
    try {
      return await this.viewerApi.generateViewerToken({ roomId });
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Creates a livestream streamer token for the given room.
   * @returns a livestream streamer token
   */
  async createLivestreamStreamerToken(roomId: RoomId) {
    try {
      return await this.streamerApi.generateStreamerToken({ roomId });
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Creates MoQ access.
   * @returns connection details containing the relay URL with the JWT embedded as a `?jwt=` query parameter, and the token itself
   */
  async createMoqAccess(config?: MoqAccessConfig) {
    try {
      return await this.moqApi.createMoqAccess({ moqAccessConfig: config });
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Create a new recording. Capturing starts synchronously, so the returned recording is `active`.
   */
  async createRecording(config: RecordingConfig): Promise<Recording> {
    try {
      const { data } = await this.recordingsApi.createRecording({ recordingConfig: config });
      return data as Recording;
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Get details about a given recording.
   */
  async getRecording(recordingId: RecordingId): Promise<Recording> {
    try {
      const { data } = await this.recordingsApi.getRecording({ recordingId });
      return data as Recording;
    } catch (error) {
      throw await mapException(error, 'recording');
    }
  }

  /**
   * Get a list of all recordings, optionally filtered by metadata.
   * Returns recordings whose metadata contains all the given key-value pairs.
   */
  async getAllRecordings(metadata?: Record<string, unknown>): Promise<Recording[]> {
    // the API expects the deepObject query format (`metadata[key]=value`), but the generated
    // client serializes the filter keys at the top level, so prefix them here
    const metadataQuery = metadata
      ? Object.fromEntries(Object.entries(metadata).map(([key, value]) => [`metadata[${key}]`, value]))
      : undefined;

    try {
      const { data } = await this.recordingsApi.listRecordings({ metadata: metadataQuery });
      return (data as Recording[]) ?? [];
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * Stop an active recording. Finalization is asynchronous: the recording stays `active` until
   * the capture is finalized, then becomes `finished`. Stopping a recording that is no longer active is a no-op.
   */
  async stopRecording(recordingId: RecordingId): Promise<Recording> {
    try {
      const { data } = await this.recordingsApi.stopRecording({ recordingId });
      return data as Recording;
    } catch (error) {
      throw await mapException(error, 'recording');
    }
  }

  /**
   * Delete a recording. Its stored media is removed asynchronously.
   * A recording that is still `active` cannot be deleted — stop it first or wait for it to finish.
   */
  async deleteRecording(recordingId: RecordingId): Promise<void> {
    try {
      await this.recordingsApi.deleteRecording({ recordingId });
    } catch (error) {
      throw await mapException(error, 'recording');
    }
  }
}
