import { FastifyInstance } from "fastify";
import { RoomService } from "./room_service";
import { ServerMessage } from "@fishjam-cloud/js-server-sdk/proto";
import { parseError } from "./utils";

export async function roomsEndpoints(fastify: FastifyInstance) {
  const roomService = new RoomService(
    fastify.config.JELLYFISH_URL,
    fastify.config.JELLYFISH_SERVER_TOKEN
  );

  type Params = {
    roomId: string;
    userId: string;
  };

  fastify.get<{ Params: Params }>(
    "/api/rooms/:roomId/users/:userId",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            roomId: { type: "string" },
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              token: { type: "string" },
              url: { type: "string" },
            },
            required: ["token", "url"],
          },
          410: {
            type: "object",
            properties: {
              error: { type: "string" },
              path: { type: "string" },
              method: { type: "string" },
            },
            required: ["error"],
          },
          500: {
            type: "object",
            properties: {
              error: { type: "string" },
              cause: { type: "string" },
              path: { type: "string" },
              method: { type: "string" },
            },
            required: ["error"],
          },
        },
      },
    },
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
