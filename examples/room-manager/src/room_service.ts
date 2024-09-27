import { FishjamClient, Room, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { fastify } from './index';
import type { ParticipantAccessData } from './schema';
import { RoomManagerError } from './errors';

export class RoomService {
  private readonly participantNameToAccessMap = new Map<string, ParticipantAccessData>();
  private readonly roomNameToRoomIdMap = new Map<string, string>();
  private readonly fishjamClient: FishjamClient;

  constructor(fishjamUrl: string, managementToken: string) {
    this.fishjamClient = new FishjamClient({
      fishjamUrl,
      managementToken,
    });
  }

  async getParticipantAccess(roomName: string, username: string): Promise<ParticipantAccessData> {
    const room = await this.findOrCreateRoomInFishjam(roomName);
    const peerAccess = this.participantNameToAccessMap.get(username);

    const peer = room.peers.find((peer) => peer.id === peerAccess?.peer.id);

    fastify.log.info({
      name: 'Got room',
      roomName,
      roomId: room.id,
      peers: room.peers,
    });

    if (!peer) {
      fastify.log.info({ name: 'Creating peer' });
      return await this.createParticipant(roomName, username);
    }

    if (!peerAccess?.peerToken) throw new RoomManagerError('Missing peer token in room');

    peerAccess.peer = { id: peer.id, name: username };

    this.participantNameToAccessMap.set(username, peerAccess);

    fastify.log.info({ name: 'Peer and room exist', username, roomName });

    return peerAccess;
  }

  async handleJellyfishMessage(notification: ServerMessage): Promise<void> {
    Object.entries(notification)
      .filter(([_, value]) => value)
      .forEach(([name, value]) => {
        fastify.log.info({ [name]: value });
      });

    const participantToBeRemoved = notification.peerCrashed ?? notification.peerDeleted;

    if (participantToBeRemoved) {
      const { roomId, peerId } = participantToBeRemoved;

      const userAccess = [...this.participantNameToAccessMap.values()].find(
        ({ room, peer }) => room.id === roomId && peer.id === peerId
      );

      if (!userAccess) {
        fastify.log.info({ name: 'User not found in cache', userAccess });
        return;
      }

      this.participantNameToAccessMap.delete(userAccess.peer.name);

      fastify.log.info({ name: 'Peer deleted from cache', roomId, peerId: peerId });
    }

    const roomToBeRemovedId = (notification.roomDeleted ?? notification.roomCrashed)?.roomId;

    if (roomToBeRemovedId) {
      this.roomNameToRoomIdMap.delete(roomToBeRemovedId);

      const usersToRemove = [...this.participantNameToAccessMap.values()].filter(
        (user) => user.room.id === roomToBeRemovedId
      );

      usersToRemove.forEach(({ peer }) => {
        this.participantNameToAccessMap.delete(peer.name);
      });

      fastify.log.info({
        name: 'Room and users deleted from cache',
        roomId: roomToBeRemovedId,
      });
    }
  }

  private async createParticipant(roomName: string, peerName: string): Promise<ParticipantAccessData> {
    const roomId = this.roomNameToRoomIdMap.get(roomName);

    if (!roomId) throw new RoomManagerError('Room not found');

    const { peer, peerToken } = await this.fishjamClient.createParticipant(roomId, {
      enableSimulcast: fastify.config.ENABLE_SIMULCAST,
      metadata: { username: peerName },
    });

    const peerAccess = {
      peer: { id: peer.id, name: peerName },
      room: { id: roomId, name: roomName },
      peerToken,
    };

    this.participantNameToAccessMap.set(peerName, peerAccess);

    fastify.log.info('Created peer', { peerName, ...peerAccess });

    return peerAccess;
  }

  private async findOrCreateRoomInFishjam(roomName: string): Promise<Room> {
    const roomId = this.roomNameToRoomIdMap.get(roomName);

    if (roomId) {
      try {
        const room = await this.fishjamClient.getRoom(roomId);
        fastify.log.info({ name: 'Room already exist in the Fishjam', room });

        return room;
      } catch (err) {
        const roomNotFound = err instanceof RoomNotFoundException;
        if (!roomNotFound) throw err;
      }
    }

    fastify.log.info({
      name: 'Creating room in the Fishjam',
      roomId,
      roomName,
    });

    const newRoom = await this.fishjamClient.createRoom({
      maxPeers: fastify.config.MAX_PEERS,
      webhookUrl: fastify.config.WEBHOOK_URL,
      peerlessPurgeTimeout: fastify.config.PEERLESS_PURGE_TIMEOUT,
    });

    this.roomNameToRoomIdMap.set(roomName, newRoom.id);

    fastify.log.info({ name: 'Room created', newRoom });

    return newRoom;
  }
}
