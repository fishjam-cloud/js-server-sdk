import { FishjamClient, Room, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { fastify } from './index';
import { User } from './schema';
import { RoomManagerError } from './errors';

export class RoomService {
  private readonly participantNameToParticipantMap = new Map<string, User>();
  private readonly roomNameToRoomIdMap = new Map<string, string>();
  private readonly fishjamClient: FishjamClient;

  constructor(fishjamUrl: string, serverToken: string) {
    this.fishjamClient = new FishjamClient({
      fishjamUrl,
      serverToken,
    });
  }

  async getParticipantToken(roomName: string, username: string): Promise<User> {
    const room = await this.findOrCreateRoomInFishjam(roomName);
    const user = this.participantNameToParticipantMap.get(username);

    const participant = room.peers.find((participant) => participant.id === user?.peer.id);

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

    if (!user?.token) throw new RoomManagerError('Missing token for participant in room');

    user.peer = participant;

    this.participantNameToParticipantMap.set(username, user);

    fastify.log.info({ name: 'Participant and room exist', username, roomName });

    return user;
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

      const user = [...this.participantNameToParticipantMap.values()].find(
        (user) => user.room.id === roomId && user.peer.id === participantId
      );

      if (!user) {
        fastify.log.info({ name: 'User not found in cache', user });
        return;
      }

      this.participantNameToParticipantMap.delete(user.username);

      fastify.log.info({ name: 'Peer deleted from cache', roomId, participantId });
    }

    const roomToBeRemovedId = (notification.roomDeleted ?? notification.roomCrashed)?.roomId;

    if (roomToBeRemovedId) {
      this.roomNameToRoomIdMap.delete(roomToBeRemovedId);

      const usersToRemove = [...this.participantNameToParticipantMap.values()].filter(
        (user) => user.room.id === roomToBeRemovedId
      );

      usersToRemove.forEach((user) => {
        this.participantNameToParticipantMap.delete(user.username);
      });

      fastify.log.info({
        name: 'Room and users deleted from cache',
        roomId: roomToBeRemovedId,
      });
    }
  }

  private async createParticipant(roomName: string, username: string): Promise<User> {
    const roomId = this.roomNameToRoomIdMap.get(roomName);

    if (!roomId) throw new RoomManagerError('Room not found');

    const { peer, token } = await this.fishjamClient.createPeer(roomId, {
      enableSimulcast: fastify.config.ENABLE_SIMULCAST,
      metadata: { username },
    });

    const user = {
      username,
      room: { id: roomId, name: roomName },
      peer,
      token,
    };

    this.participantNameToParticipantMap.set(username, user);

    fastify.log.info('Created user', { username, user });

    return user;
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
