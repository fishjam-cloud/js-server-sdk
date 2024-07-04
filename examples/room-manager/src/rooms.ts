import { FastifyInstance } from 'fastify';
import { RoomService } from './room_service';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { parseError } from './utils';
import { peerEndpointSchema, QueryParams } from './schema';

export async function roomsEndpoints(fastify: FastifyInstance) {
  const roomService = new RoomService(fastify.config.JELLYFISH_URL, fastify.config.JELLYFISH_SERVER_TOKEN);

  fastify.get<{ Params: QueryParams }>(
    '/api/rooms/:roomName/users/:username',
    { schema: peerEndpointSchema },
    async (req, res) => {
      const {
        params: { roomName, username },
      } = req;
      try {
        const user = await roomService.findOrCreateUser(roomName, username);
        return user;
      } catch (error: unknown) {
        const [errorMessage, code] = parseError(error);
        return res.status(code).send(errorMessage);
      }
    }
  );

  fastify.post<{ Body: ServerMessage }>('/webhook', async (req, res) => {
    await roomService.handleJellyfishMessage(req.body);
    return res.status(200).send();
  });
}
