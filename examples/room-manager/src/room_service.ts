import {
  FishjamClient,
  Peer,
  RoomNotFoundException,
} from "@fishjam-cloud/js-server-sdk";
import { ServerMessage } from "@fishjam-cloud/js-server-sdk/proto";
import { fastify } from "./index";

type RoomId = string;
type PeerId = string;

export type User = {
  token: string;
  peer: Peer;
};

export class RoomService {
  private readonly roomTokenMap = new Map<RoomId, [PeerId, string][]>();
  private readonly fishjamClient: FishjamClient;

  constructor(fishjamUrl: string, serverToken: string) {
    this.fishjamClient = new FishjamClient({
      fishjamUrl,
      serverToken,
    });
  }

  async findOrCreateUser(roomName: string, userId: string): Promise<User> {
    const room = await this.findOrCreateRoomInFishJam(roomName);
    const peer = room.peers.find((peer) => peer.id === userId);

    if (!peer) {
      fastify.log.info({ name: "Creating peer" });
      return await this.createPeer(roomName);
    }

    const token = this.roomTokenMap
      .get(room.id)
      ?.find(([id]) => id === userId)?.[1];

    if (!token) throw Error("Missing token for user in room");
    fastify.log.info({ name: "Peer and room exist", userId, roomName });

    return { peer, token };
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

      const userTokenPairs = this.roomTokenMap.get(roomId);
      if (!userTokenPairs) return;

      const newUserList = userTokenPairs.filter(([id]) => id !== peerId);

      this.roomTokenMap.set(roomId, newUserList);
      fastify.log.info({ name: "Peer deleted from cache", roomId, peerId });
    }

    const roomToBeRemovedId = (
      notification.roomDeleted ?? notification.roomCrashed
    )?.roomId;

    if (roomToBeRemovedId) {
      this.roomTokenMap.delete(roomToBeRemovedId);
      fastify.log.info({
        name: "Room deleted from cache",
        roomId: roomToBeRemovedId,
      });
    }
  }

  private async createPeer(roomName: string): Promise<User> {
    const [peer, { websocketToken, websocketUrl }] =
      await this.fishjamClient.createPeer(roomName, {
        enableSimulcast: fastify.config.ENABLE_SIMULCAST,
      });

    const peerWebsocketUrl =
      websocketUrl ?? fastify.config.JELLYFISH_URL + "/socket/peer/websocket";

    const user = {
      peer,
      token: websocketToken,
    };

    const userTokenPairs = this.roomTokenMap.get(roomName) ?? [];
    this.roomTokenMap.set(roomName, [
      ...userTokenPairs,
      [peer.id, websocketToken],
    ]);

    fastify.log.info({ user, peerWebsocketUrl });

    return user;
  }

  private async findOrCreateRoomInFishJam(roomName: string) {
    try {
      const room = await this.fishjamClient.getRoom(roomName);
      fastify.log.info({ name: "Room already exist in the Fishjam", room });

      return room;
    } catch (err) {
      const roomNotFound = err instanceof RoomNotFoundException;
      if (!roomNotFound) throw err;
    }

    fastify.log.info({
      name: "Creating room in the Fishjam",
      roomId: roomName,
    });

    const newRoom = await this.fishjamClient.createRoom({
      maxPeers: fastify.config.MAX_PEERS,
      roomId: roomName,
      webhookUrl: fastify.config.WEBHOOK_URL,
      peerlessPurgeTimeout: fastify?.config?.PEERLESS_PURGE_TIMEOUT,
    });

    fastify.log.info({ name: "Room created", newRoom });

    return newRoom;
  }
}
