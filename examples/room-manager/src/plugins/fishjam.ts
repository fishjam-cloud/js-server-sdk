import fastifyPlugin from 'fastify-plugin';
import { type FastifyInstance } from 'fastify';
import { FishjamClient, Room, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { RoomManagerError } from '../errors';
import { PeerAccessData } from '../schema';

declare module 'fastify' {
  interface FastifyInstance {
    fishjam: {
      getPeerAccess: (roomName: string, username: string) => Promise<PeerAccessData>;
      handleFishjamMessage: (notification: ServerMessage) => Promise<void>;
    };
  }
}

export const fishjamPlugin = fastifyPlugin(async (fastify: FastifyInstance): Promise<void> => {
  if (fastify.hasDecorator('fishjam')) {
    throw new Error('The `fishjamPlugin` plugin has already been registered.');
  }

  const fishjamClient = new FishjamClient({
    fishjamUrl: fastify.config.FISHJAM_URL,
    managementToken: fastify.config.FISHJAM_SERVER_TOKEN,
  });

  const peerNameToAccessMap = new Map<string, PeerAccessData>();
  const roomNameToRoomIdMap = new Map<string, string>();

  async function getPeerAccess(roomName: string, username: string): Promise<PeerAccessData> {
    const room = await findOrCreateRoomInFishjam(roomName);
    const peerAccess = peerNameToAccessMap.get(username);

    const peer = room.peers.find((peer) => peer.id === peerAccess?.peer.id);

    fastify.log.info({
      name: 'Got room',
      roomName,
      roomId: room.id,
      peers: room.peers,
    });

    if (!peer) {
      fastify.log.info({ name: 'Creating peer' });
      return createPeer(roomName, username);
    }

    if (!peerAccess?.peerToken) throw new RoomManagerError('Missing peer token in room');

    fastify.log.info({ name: 'Peer and room exist', username, roomName });

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

    if (!roomId) throw new RoomManagerError('Room not found');

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

  async function findOrCreateRoomInFishjam(roomName: string): Promise<Room> {
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
    });

    const newRoom = await fishjamClient.createRoom({
      maxPeers: fastify.config.MAX_PEERS,
      webhookUrl: fastify.config.WEBHOOK_URL,
      peerlessPurgeTimeout: fastify.config.PEERLESS_PURGE_TIMEOUT,
    });

    roomNameToRoomIdMap.set(roomName, newRoom.id);

    fastify.log.info({ name: 'Room created', newRoom });

    return newRoom;
  }

  fastify.decorate('fishjam', { getPeerAccess, handleFishjamMessage });
});
