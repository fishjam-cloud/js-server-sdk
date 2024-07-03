import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { fastify } from './index';
import { FishjamClient, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';

type RoomId = string;
type PeerId = string;

type UserId = string;
type RoomName = string;

export type User = {
  token: string;
  peerId: PeerId;
  url: string;
};

type Room = {
  users: Record<UserId, User>;
  roomId: RoomId;
};

export class RoomService {
  private readonly cache = new Map<RoomName, Room>();
  private readonly fishjamClient: FishjamClient;
  private readonly tls: boolean;

  constructor(fishjamUrl: string, serverToken: string) {
    this.fishjamClient = new FishjamClient({
      fishjamUrl,
      serverToken,
    });
    this.tls = fishjamUrl.includes('https');
  }

  async findOrCreateUser(roomName: string, userId: string): Promise<User> {
    const room = await this.findOrCreateRoom(roomName);

    if (room.users[userId]) {
      fastify.log.info({ name: 'Peer and room exist', userId, roomName });

      return room.users[userId];
    } else {
      fastify.log.info({ name: 'Creating peer' });

      const peerData = await this.createPeer(roomName, room.roomId);

      fastify.log.info({ name: 'Adding peer to cache' });

      room.users[userId] = peerData;

      return peerData;
    }
  }

  async handleJellyfishMessage(notification: ServerMessage) {
    Object.entries(notification)
      .filter(([name, value]) => value)
      .forEach(([name, value]) => {
        fastify.log.info({ [name]: value });
      });

    // todo add peer deleted
    if (notification.peerCrashed) {
      const { roomId, peerId } = notification.peerCrashed;

      const roomData = await this.getRoomFromCache(roomId);
      if (!roomData) return;

      const userId = Object.entries(roomData.users).find(([_, data]) => data.peerId === peerId)?.[0];
      if (userId) {
        delete roomData.users[userId];
        fastify.log.info({ name: 'Peer deleted from cache', roomId, peerId });
      }
    }

    const roomDeletedOrCrashed = notification.roomDeleted || notification.roomCrashed;

    if (roomDeletedOrCrashed) {
      this.cache.delete(roomDeletedOrCrashed.roomId);
      fastify.log.info({
        name: 'Room deleted from cache',
        roomId: roomDeletedOrCrashed.roomId,
      });
    }
  }

  private async findOrCreateRoom(roomName: string): Promise<Room> {
    if (!this.cache.has(roomName)) {
      const roomId = await this.findOrCreateRoomInFishJam(roomName);
      this.cache.set(roomName, { users: {}, roomId });
    }
    return this.cache.get(roomName)!;
  }

  private async getRoomFromCache(roomName: string): Promise<Room | null> {
    return this.cache.get(roomName) || null;
  }

  private async createPeer(roomName: string, url: string): Promise<User> {
    const [peer, { websocketToken, websocketUrl }] = await this.fishjamClient.createPeer(roomName, {
      enableSimulcast: fastify.config.ENABLE_SIMULCAST,
    });

    const peerWebsocketUrl = websocketUrl ?? fastify.config.JELLYFISH_URL + '/socket/peer/websocket';

    const user = {
      peerId: peer.id,
      token: websocketToken,
      url: `${this.tls ? 'wss' : 'ws'}://${peerWebsocketUrl}`,
    };

    fastify.log.info({ user, peerWebsocketUrl });

    return user;
  }

  private async findOrCreateRoomInFishJam(roomName: string): Promise<RoomId> {
    // Check if the room exists in the application.
    // This may happen when someone creates a room outside of this application
    // or when the room was created in the previous run of the application.
    try {
      const room = await this.fishjamClient.getRoom(roomName);
      fastify.log.info({ name: 'Room already exist in the FishJam', room });

      return room.id;
    } catch (err) {
      const roomNotFound = err instanceof RoomNotFoundException;
      if (!roomNotFound) throw err;
    }

    fastify.log.info({
      name: 'Creating room in the FishJam',
      roomId: roomName,
    });

    const newRoom = await this.fishjamClient.createRoom({
      maxPeers: fastify.config.MAX_PEERS,
      roomId: roomName,
      webhookUrl: fastify.config.WEBHOOK_URL,
      peerlessPurgeTimeout: fastify?.config?.PEERLESS_PURGE_TIMEOUT,
    });

    fastify.log.info({ name: 'Room created', newRoom });

    return newRoom.id;
  }
}
