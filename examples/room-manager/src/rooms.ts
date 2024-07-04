import { FastifyInstance } from "fastify";
import { RoomService } from "./room_service";
import { ServerMessage } from "@fishjam-cloud/js-server-sdk/proto";
import { parseError } from "./utils";
import { peerEndpointSchema, QueryParams } from "./schema";

export async function roomsEndpoints(fastify: FastifyInstance) {
  const roomService = new RoomService(
    fastify.config.JELLYFISH_URL,
    fastify.config.JELLYFISH_SERVER_TOKEN
  );

  fastify.get<{ Params: QueryParams }>(
    "/api/rooms/:roomId/users/:userId",
    { schema: peerEndpointSchema },
    async (request, reply) => {
      const { roomId, userId } = request.params;
      try {
        const user = await roomService.findOrCreateUser(roomId, userId);
        return {
          token: user.token,
        };
      } catch (error: unknown) {
        const [errorMessage, code] = parseError(error);
        return reply.status(code).send(errorMessage);
      }
    }
  );

  fastify.post<{ Body: ServerMessage }>("/webhook", async (request, reply) => {
    await roomService.handleJellyfishMessage(request.body);
    return reply.status(200).send();
  });
}
