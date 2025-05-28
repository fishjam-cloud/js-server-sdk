import fastifyPlugin from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import {
  FishjamClient,
  PeerId,
  Room,
  RoomConfigRoomTypeEnum,
  RoomId,
  RoomNotFoundException,
  type RoomConfigVideoCodecEnum,
  type ViewerToken,
} from '@fishjam-cloud/js-server-sdk';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { RoomManagerError } from '../errors';
import { PeerAccessData } from '../schema';

type RoomType = RoomConfigRoomTypeEnum | 'livestream';

declare module 'fastify' {
  interface FastifyInstance {
    fishjam: {
      getPeerAccess: (roomName: string, peerName: string, roomType?: RoomType) => Promise<PeerAccessData>;
      handleFishjamMessage: (notification: ServerMessage) => Promise<void>;
      getLivestreamViewerToken: (roomName: string) => Promise<ViewerToken>;
    };
  }
}

export const fishjamPlugin = fastifyPlugin(async (fastify: FastifyInstance): Promise<void> => {
  if (fastify.hasDecorator('fishjam')) {
    throw new Error('The `fishjamPlugin` plugin has already been registered.');
  }

  const fishjamClient = new FishjamClient({
    fishjamUrl: fastify.config.FISHJAM_URL,
    managementToken: fastify.config.FISHJAM_MANAGEMENT_TOKEN ?? fastify.config.FISHJAM_SERVER_TOKEN ?? 'development',
  });

  const peerNameToAccessMap = new Map<string, PeerAccessData>();
  const roomNameToRoomIdMap = new Map<string, RoomId>();

  async function getPeerAccess(
    roomName: string,
    peerName: string,
    roomType: RoomType = 'full_feature'
  ): Promise<PeerAccessData> {
    const room = await findOrCreateRoomInFishjam(roomName, roomType);
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

  async function handleFishjamMessage(notification: ServerMessage): Promise<void> {
    Object.entries(notification)
      .filter(([_, value]) => value)
      .forEach(([name, value]) => {
        fastify.log.info({ [name]: value });
      });

    const peerToBeRemoved = notification.peerCrashed ?? notification.peerDeleted;

    if (peerToBeRemoved) {
      const { roomId, peerId } = peerToBeRemoved;

      const userAccess = [...peerNameToAccessMap.values()].find(
        ({ room, peer }) => room.id === roomId && peer.id === peerId
      );

      if (!userAccess) {
        fastify.log.info({ name: 'User not found in cache', userAccess });
        return;
      }

      peerNameToAccessMap.delete(userAccess.peer.name);

      fastify.log.info({ name: 'Peer deleted from cache', roomId, peerId: peerId });
    }

    const roomToBeRemovedId = (notification.roomDeleted ?? notification.roomCrashed)?.roomId;

    if (roomToBeRemovedId) {
      const roomName = roomNameToRoomIdMap.get(roomToBeRemovedId);
      if (roomName) roomNameToRoomIdMap.delete(roomName);

      const usersToRemove = [...peerNameToAccessMap.values()].filter((user) => user.room.id === roomToBeRemovedId);

      usersToRemove.forEach(({ peer }) => {
        peerNameToAccessMap.delete(peer.name);
      });

      fastify.log.info({
        name: 'Room and users deleted from cache',
        roomId: roomToBeRemovedId,
      });
    }
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

  async function findOrCreateRoomInFishjam(roomName: string, roomType: RoomType): Promise<Room> {
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
      roomType,
    });

    const newRoom = await fishjamClient.createRoom({
      maxPeers: fastify.config.MAX_PEERS,
      peerlessPurgeTimeout: fastify.config.PEERLESS_PURGE_TIMEOUT,
      videoCodec: fastify.config.ROOM_VIDEO_CODEC as RoomConfigVideoCodecEnum,
      roomType,
    });

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

  fastify.decorate('fishjam', {
    getPeerAccess,
    handleFishjamMessage,
    getLivestreamViewerToken,
  });
});
