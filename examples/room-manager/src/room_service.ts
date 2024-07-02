import axios from 'axios';

import { type Room as RemoteRoom, type Peer as RemoteUser, RoomApi, FishjamClient } from '@fishjam-cloud/js-server-sdk';

import type {
  ServerMessage,
  ServerMessage_PeerCrashed,
  ServerMessage_PeerDeleted,
  ServerMessage_RoomCrashed,
  ServerMessage_RoomDeleted,
} from '@fishjam-cloud/js-server-sdk/proto';

import config from './config';

type RoomId = string;
type UserId = string;
type PeerId = string;

interface User {
  peerId: PeerId;
  token: string;
  url: string;
}

interface Room {
  roomId: RoomId;
  users: Map<UserId, User>;
}

export class RoomService {
  private readonly rooms = new Map<RoomId, Room>();
  private readonly fishjamClient: FishjamClient = new FishjamClient({
    fishjamUrl: config.fishjamUrl,
    serverToken: config.serverToken,
  });
  private readonly tls: boolean;

  constructor() {
    this.tls = config.fishjamUrl.startsWith('https');
  }

  async findOrCreateUser(roomId: string, userId: string): Promise<User> {
    const room = await this.findOrCreateRoom(roomId);
    let user = room.users.get(userId);

    // make sure the user exists on the Fishjam server as well
    const remoteUser = user ? await this.findRemoteUser(roomId, user.peerId) : null;

    if (user && remoteUser) {
      console.log({ message: 'The user already exists', roomId, userId, peerId: user.peerId });
    } else {
      user = await this.createUser(roomId);

      console.log({ message: 'Added the user to the existing room', roomId, userId, peerId: user.peerId });

      room.users.set(userId, user);
    }

    return user;
  }

  handleFishjamMessage(notification: ServerMessage): void {
    Object.entries(notification)
      .filter(([_key, value]) => value)
      .forEach(([key, value]) => {
        const roomId = value.roomId;
        const stringified = JSON.stringify({ [key]: value });

        console.log({ message: `Got a server notification: ${stringified}`, roomId });
      });

    const peerDownNotification = notification.peerDisconnected ?? notification.peerCrashed;

    if (peerDownNotification) {
      this.handlePeerDown(peerDownNotification);
    }

    const roomDownNotification = notification.roomDeleted ?? notification.roomCrashed;

    if (roomDownNotification) {
      this.handleRoomDown(roomDownNotification);
    }
  }

  private async findOrCreateRoom(roomId: string): Promise<Room> {
    let room = this.rooms.get(roomId);
    const remoteRoom = await this.findRemoteRoom(roomId);

    if (!(room && remoteRoom)) {
      await this.findOrCreateRoomInFishjam(roomId);

      room = { roomId, users: new Map() };

      this.rooms.set(roomId, room);
    }

    return room;
  }

  private async createUser(roomId: string): Promise<User> {
    const [peer, { websocketToken, websocketUrl }] = await this.fishjamClient.createPeer(roomId, {
      enableSimulcast: config.enableSimulcast,
    });

    const peerWebsocketUrl = websocketUrl ?? config.fishjamUrl + '/socket/peer/websocket';

    const user = {
      peerId: peer.id,
      token: websocketToken,
      url: `${this.tls ? 'wss' : 'ws'}://${peerWebsocketUrl}`,
    };

    console.log({ message: 'User created', roomId, peerId: peer.id });

    return user;
  }

  private async findOrCreateRoomInFishjam(roomId: string): Promise<void> {
    try {
      // Check if the room exists in the application.
      // This may happen when someone creates a room outside of this application
      // or when the room was created in the previous run of the application.
      const room = await this.fishjamClient.getRoom(roomId);

      if (room) {
        console.warn({ message: 'Room already exists in Fishjam', roomId });

        return;
      }

      console.log({ message: 'Creating a room in Fishjam', roomId });

      const optionalConfig = {
        maxPeers: config.maxPeers,
        peerlessPurgeTimeout: config.peerlessPurgeTimeout,
      };

      await this.fishjamClient.createRoom({ roomId, webhookUrl: config.webhookUrl, ...optionalConfig });

      console.log({ message: 'Room created', roomId });
    } catch (error) {
      const stringified = JSON.stringify(error);

      console.error({ message: `Failed to create room in Fishjam due to ${stringified}`, roomId });

      throw error;
    }
  }

  private async findRemoteRoom(roomId: string) {
    return await this.fishjamClient.getRoom(roomId);
  }

  private async findRemoteUser(roomId: string, peerId: string): Promise<RemoteUser | null> {
    const room = await this.fishjamClient.getRoom(roomId);

    return room?.peers.find((peer) => peer.id === peerId) ?? null;
  }

  private handlePeerDown(notification: ServerMessage_PeerDeleted | ServerMessage_PeerCrashed): void {
    const { roomId, peerId } = notification;

    const roomData = this.rooms.get(roomId);

    if (!roomData) {
      console.warn({ message: 'Got a peer down notification for a non-tracked room, ignoring', roomId, peerId });

      return;
    }

    const userId = Array.from(roomData.users.entries()).find(([_userId, user]) => user.peerId === peerId)?.[0];

    if (userId) {
      roomData.users.delete(userId);

      console.log({ message: 'Removed the peer from the room', roomId, userId, peerId });
    } else {
      console.warn({
        message: 'Got a peer down notification for a non-tracked user, ignoring',
        roomId,
        peerId,
      });
    }
  }

  private handleRoomDown(notification: ServerMessage_RoomDeleted | ServerMessage_RoomCrashed): void {
    const { roomId } = notification;

    this.rooms.delete(roomId);

    console.log({ message: 'Room down', roomId });
  }
}
