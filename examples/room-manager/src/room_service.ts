import {
  FishjamClient,
  Peer,
  RoomNotFoundException,
} from "@fishjam-cloud/js-server-sdk";
import { ServerMessage } from "@fishjam-cloud/js-server-sdk/proto";
import { fastify } from "./index";

interface User {
  username: string;
  room: { id: string; name: string };
  token: string;
  peer: Peer;
}

export class RoomService {
  private readonly usernameToUserMap = new Map<string, User>();
  private readonly roomNameToRoomIdMap = new Map<string, string>();
  private readonly fishjamClient: FishjamClient;

  constructor(fishjamUrl: string, serverToken: string) {
    this.fishjamClient = new FishjamClient({
      fishjamUrl,
      serverToken,
    });
  }

  async findOrCreateUser(roomName: string, username: string): Promise<User> {
    const room = await this.findOrCreateRoomInFishJam(roomName);
    const user = this.usernameToUserMap.get(username);

    const peer = room.peers.find((peer) => peer.id === user?.peer.id);

    fastify.log.info({
      name: "Got room",
      roomName,
      roomId: room.id,
      peers: room.peers,
    });

    if (!peer) {
      fastify.log.info({ name: "Creating peer" });
      return await this.createPeer(roomName, username);
    }

    if (!user?.token) throw Error("Missing token for user in room");

    user.peer = peer;

    this.usernameToUserMap.set(username, user);

    fastify.log.info({ name: "Peer and room exist", username, roomName });

    return user;
  }

  async handleJellyfishMessage(notification: ServerMessage) {
    Object.entries(notification)
      .filter(([_, value]) => value)
      .forEach(([name, value]) => {
        fastify.log.info({ [name]: value });
      });

    const peerToBeRemoved =
      notification.peerCrashed ?? notification.peerDeleted;

    if (peerToBeRemoved) {
      const { roomId, peerId } = peerToBeRemoved;

      const user = [...this.usernameToUserMap.values()].find(
        (user) => user.room.id === roomId && user.peer.id === peerId
      );

      if (!user) {
        fastify.log.info({ name: "User not found in cache", user });
        return;
      }

      this.usernameToUserMap.delete(user.username);

      fastify.log.info({ name: "Peer deleted from cache", roomId, peerId });
    }

    const roomToBeRemovedId = (
      notification.roomDeleted ?? notification.roomCrashed
    )?.roomId;

    if (roomToBeRemovedId) {
      this.roomNameToRoomIdMap.delete(roomToBeRemovedId);

      const usersToRemove = [...this.usernameToUserMap.values()].filter(
        (user) => user.room.id === roomToBeRemovedId
      );

      usersToRemove.forEach((user) => {
        this.usernameToUserMap.delete(user.username);
      });

      fastify.log.info({
        name: "Room and users deleted from cache",
        roomId: roomToBeRemovedId,
      });
    }
  }

  private async createPeer(roomName: string, username: string): Promise<User> {
    const roomId = this.roomNameToRoomIdMap.get(roomName);

    if (!roomId) throw Error("Room not found");

    const [peer, { websocketToken }] = await this.fishjamClient.createPeer(
      roomId,
      {
        enableSimulcast: fastify.config.ENABLE_SIMULCAST,
      }
    );

    const user = {
      username,
      room: { id: roomId, name: roomName },
      peer,
      token: websocketToken,
    };

    this.usernameToUserMap.set(username, user);

    fastify.log.info("Created user", { username, user });

    return user;
  }

  private async findOrCreateRoomInFishJam(roomName: string) {
    const roomId = this.roomNameToRoomIdMap.get(roomName);

    if (roomId) {
      try {
        const room = await this.fishjamClient.getRoom(roomName);
        fastify.log.info({ name: "Room already exist in the Fishjam", room });

        return room;
      } catch (err) {
        const roomNotFound = err instanceof RoomNotFoundException;
        if (!roomNotFound) throw err;
      }
    }

    fastify.log.info({
      name: "Creating room in the Fishjam",
      roomId,
      roomName,
    });

    const newRoom = await this.fishjamClient.createRoom({
      maxPeers: fastify.config.MAX_PEERS,
      webhookUrl: fastify.config.WEBHOOK_URL,
      peerlessPurgeTimeout: fastify?.config?.PEERLESS_PURGE_TIMEOUT,
    });

    this.roomNameToRoomIdMap.set(roomName, newRoom.id);

    fastify.log.info({ name: "Room created", newRoom });

    return newRoom;
  }
}
