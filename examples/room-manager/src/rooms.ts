import { FastifyInstance } from 'fastify';
import { RoomService } from './room_service';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { parseError } from './utils';
import { peerEndpointSchema, QueryParams } from './schema';
import { startRecording } from './startRecording';

export async function roomsEndpoints(fastify: FastifyInstance) {
  const websocketUrl = `${fastify.config.FISHJAM_URL}/socket/peer/websocket`;
  const roomService = new RoomService(fastify.config.FISHJAM_URL, fastify.config.FISHJAM_SERVER_TOKEN);

  fastify.get<{ Params: QueryParams }>(
    '/api/rooms/:roomName/users/:username',
    { schema: peerEndpointSchema },
    async (req, res) => {
      const {
        params: { roomName, username },
      } = req;
      try {
        const user = await roomService.findOrCreateUser(roomName, username);
        return { ...user, url: websocketUrl };
      } catch (error: unknown) {
        const [errorMessage, code] = parseError(error);
        return res.status(code).send(errorMessage);
      }
    }
  );

  await fastify.register(startRecording);

  fastify.post<{ Body: ServerMessage }>('/webhook', async (req, res) => {
    await roomService.handleJellyfishMessage(req.body);
    return res.status(200).send();
  });
}
