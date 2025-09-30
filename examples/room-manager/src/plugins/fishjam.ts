import fastifyPlugin from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import {
  FishjamClient,
  PeerId,
  Room,
  RoomConfig,
  RoomConfigRoomTypeEnum,
  RoomId,
  RoomNotFoundException,
  type RoomConfigVideoCodecEnum,
  type ViewerToken,
} from '@fishjam-cloud/js-server-sdk';
import { RoomManagerError } from '../errors';
import { LivestreamData, PeerAccessData } from '../schema';

declare module 'fastify' {
  interface FastifyInstance {
    fishjam: {
      getPeerAccess: (
        roomName: string,
        peerName: string,
        roomType?: RoomConfigRoomTypeEnum,
        isPublic?: boolean
      ) => Promise<PeerAccessData>;
      getLivestreamViewerToken: (roomName: string) => Promise<ViewerToken>;
      getLivestreamStreamerToken: (roomName: string, isPublic: boolean) => Promise<LivestreamData>;
    };
  }
}

export const fishjamPlugin = fastifyPlugin(async (fastify: FastifyInstance): Promise<void> => {
  if (fastify.hasDecorator('fishjam')) {
    throw new Error('The `fishjamPlugin` plugin has already been registered.');
  }

  const fishjamClient = new FishjamClient({
    fishjamId: fastify.config.FISHJAM_ID,
    managementToken: fastify.config.FISHJAM_MANAGEMENT_TOKEN,
  });

  const peerNameToAccessMap = new Map<string, PeerAccessData>();
  const roomNameToRoomIdMap = new Map<string, RoomId>();

  async function getPeerAccess(
    roomName: string,
    peerName: string,
    roomType: RoomConfigRoomTypeEnum = 'conference',
    isPublic: boolean = false
  ): Promise<PeerAccessData> {
    const config: RoomConfig = {
      maxPeers: fastify.config.MAX_PEERS,
      videoCodec: fastify.config.ROOM_VIDEO_CODEC as RoomConfigVideoCodecEnum,
      roomType,
      public: isPublic,
    };
    const room = await findOrCreateRoomInFishjam(roomName, config);
    const peerAccess = peerNameToAccessMap.get(peerName);

    const peer = room.peers.find((peer) => peer.id === peerAccess?.peer.id);

    fastify.log.info({
      name: 'Got room',
      roomName,
      roomId: room.id,
      peers: room.peers,
    });

    if (!peer) {
      fastify.log.info({ name: 'Creating peer' });
      return createPeer(roomName, peerName);
    }

    await ensurePeerIsDisconnected(room.id, peer.id);

    if (!peerAccess?.peerToken) throw new RoomManagerError('Missing peer token in room');

    peerAccess.peerToken = await fishjamClient.refreshPeerToken(room.id, peer.id);

    fastify.log.info({ name: 'Peer and room exist', peerName, roomName });

    return peerAccess;
  }

  async function createPeer(roomName: string, peerName: string): Promise<PeerAccessData> {
    const roomId = roomNameToRoomIdMap.get(roomName);

    if (!roomId) throw new RoomManagerError('Room not found', 404);

    const { peer, peerToken } = await fishjamClient.createPeer(roomId, {
      enableSimulcast: fastify.config.ENABLE_SIMULCAST,
      metadata: { username: peerName },
    });

    const peerAccess = {
      peer: { id: peer.id, name: peerName },
      room: { id: roomId, name: roomName },
      peerToken,
    };

    peerNameToAccessMap.set(peerName, peerAccess);

    fastify.log.info('Created peer', { peerName, ...peerAccess });

    return peerAccess;
  }

  async function findOrCreateRoomInFishjam(roomName: string, roomConfig: RoomConfig): Promise<Room> {
    const roomId = roomNameToRoomIdMap.get(roomName);

    if (roomId) {
      try {
        const room = await fishjamClient.getRoom(roomId);
        fastify.log.info({ name: 'Room already exist in Fishjam', room });

        return room;
      } catch (err) {
        const roomNotFound = err instanceof RoomNotFoundException;
        if (!roomNotFound) throw err;
        fastify.log.info({ name: 'Room not found', roomId: roomId });
      }
    }

    fastify.log.info({
      name: 'Creating room in Fishjam',
      roomId,
      roomName,
      ...roomConfig,
    });

    const newRoom = await fishjamClient.createRoom(roomConfig);

    roomNameToRoomIdMap.set(roomName, newRoom.id);

    fastify.log.info({ name: 'Room created', newRoom });

    return newRoom;
  }

  async function ensurePeerIsDisconnected(roomId: RoomId, peerId: PeerId) {
    const room = await fishjamClient.getRoom(roomId);
    const isPeerConnected = room.peers.some((peer) => peer.id === peerId && peer.status === 'connected');

    if (isPeerConnected) {
      throw new RoomManagerError('Peer is already connected', 409);
    }
  }

  function getLivestreamViewerToken(roomName: string) {
    const roomId = roomNameToRoomIdMap.get(roomName);
    if (!roomId) throw new RoomManagerError('Room not found', 404);

    return fishjamClient.createLivestreamViewerToken(roomId);
  }

  async function getLivestreamStreamerToken(roomName: string, isPublic: boolean): Promise<LivestreamData> {
    const room = await findOrCreateRoomInFishjam(roomName, { roomType: 'livestream', public: isPublic });
    const { token: streamerToken } = await fishjamClient.createLivestreamStreamerToken(room.id);

    return { streamerToken, room: { id: room.id, name: roomName } };
  }

  fastify.decorate('fishjam', {
    getPeerAccess,
    getLivestreamViewerToken,
    getLivestreamStreamerToken,
  });
});
