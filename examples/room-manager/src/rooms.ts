import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RoomService } from './room_service';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import { participantEndpointSchema, QueryParams, startRecordingSchema } from './schema';
import { parseError } from './errors';

const removeTrailingSlash = (href: string) => (href.endsWith('/') ? href.slice(0, -1) : href);

const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');

  return url.href;
};

export async function roomsEndpoints(fastify: FastifyInstance) {
  const url = httpToWebsocket(fastify.config.FISHJAM_URL);

  // When creating a URL object from a URL without a path (e.g., `http://localhost:5002`),
  // the `href` field may contain an additional '/' at the end (`http://localhost:5002/`).
  const websocketUrl = removeTrailingSlash(url);
  const roomService = new RoomService(fastify.config.FISHJAM_URL, fastify.config.FISHJAM_SERVER_TOKEN);

  const getRoomAccessHandler = async (
    { query: { roomName, participantName } }: FastifyRequest<{ Querystring: QueryParams }>,
    res: FastifyReply
  ) => {
    try {
      const accessData = await roomService.getParticipantAccess(roomName, participantName);
      return { ...accessData, url: websocketUrl };
    } catch (error: unknown) {
      const [parsedError, errorCode] = parseError(error);
      return res.status(errorCode).send(parsedError.detail);
    }
  };

  const startRecordingHandler = async (req: FastifyRequest<{ Params: { roomName: string } }>, res: FastifyReply) => {
    throw new Error('Not yet implemented');
  };

  const webhookHandler = async (req: FastifyRequest<{ Body: ServerMessage }>, res: FastifyReply) => {
    await roomService.handleJellyfishMessage(req.body);
    return res.status(200).send();
  };

  fastify.get<{ Querystring: QueryParams }, unknown>('/', { schema: participantEndpointSchema }, getRoomAccessHandler);
  fastify.post<{ Params: { roomName: string } }>(
    '/:roomName/start-recording',
    { schema: startRecordingSchema },
    startRecordingHandler
  );
  fastify.post<{ Body: ServerMessage }>('/webhook', webhookHandler);
}
