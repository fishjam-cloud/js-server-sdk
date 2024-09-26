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
    const participantAccess = this.participantNameToAccessMap.get(username);

    const participant = room.peers.find((participant) => participant.id === participantAccess?.participant.id);

    fastify.log.info({
      name: 'Got room',
      roomName,
      roomId: room.id,
      participants: room.peers,
    });

    if (!participant) {
      fastify.log.info({ name: 'Creating participant' });
      return await this.createParticipant(roomName, username);
    }

    if (!participantAccess?.participantToken) throw new RoomManagerError('Missing participant token in room');

    participantAccess.participant = { id: participant.id, name: username };

    this.participantNameToAccessMap.set(username, participantAccess);

    fastify.log.info({ name: 'Participant and room exist', username, roomName });

    return participantAccess;
  }

  async handleJellyfishMessage(notification: ServerMessage): Promise<void> {
    Object.entries(notification)
      .filter(([_, value]) => value)
      .forEach(([name, value]) => {
        fastify.log.info({ [name]: value });
      });

    const participantToBeRemoved = notification.peerCrashed ?? notification.peerDeleted;

    if (participantToBeRemoved) {
      const { roomId, peerId: participantId } = participantToBeRemoved;

      const userAccess = [...this.participantNameToAccessMap.values()].find(
        ({ room, participant }) => room.id === roomId && participant.id === participantId
      );

      if (!userAccess) {
        fastify.log.info({ name: 'User not found in cache', userAccess });
        return;
      }

      this.participantNameToAccessMap.delete(userAccess.participant.name);

      fastify.log.info({ name: 'Peer deleted from cache', roomId, participantId });
    }

    const roomToBeRemovedId = (notification.roomDeleted ?? notification.roomCrashed)?.roomId;

    if (roomToBeRemovedId) {
      this.roomNameToRoomIdMap.delete(roomToBeRemovedId);

      const usersToRemove = [...this.participantNameToAccessMap.values()].filter(
        (user) => user.room.id === roomToBeRemovedId
      );

      usersToRemove.forEach(({ participant }) => {
        this.participantNameToAccessMap.delete(participant.name);
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

    const { participant, participantToken } = await this.fishjamClient.createParticipant(roomId, {
      enableSimulcast: fastify.config.ENABLE_SIMULCAST,
      metadata: { username: peerName },
    });

    const participantAccess = {
      participant: { id: participant.id, name: peerName },
      room: { id: roomId, name: roomName },
      participantToken,
    };

    this.participantNameToAccessMap.set(peerName, participantAccess);

    fastify.log.info('Created participant', { peerName, ...participantAccess });

    return participantAccess;
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
