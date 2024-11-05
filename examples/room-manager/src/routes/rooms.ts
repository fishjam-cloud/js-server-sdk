import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';

import { parseError } from '../errors';
import { fishjamPlugin } from '../plugins';
import { GetPeerAccessQueryParams, startRecordingSchema, queryStringPeerEndpointSchema } from '../schema';
import { httpToWebsocket, removeTrailingSlash } from '../utils';

export async function rooms(fastify: FastifyInstance) {
  await fastify.register(fishjamPlugin);

  const getRoomAccessHandler = async (roomName: string, peerName: string, res: FastifyReply) => {
    try {
      const accessData = await fastify.fishjam.getPeerAccess(roomName, peerName);
      const url = httpToWebsocket(fastify.config.FISHJAM_URL);

      // When creating a URL object from a URL without a path (e.g., `http://localhost:5002`),
      // the `href` field may contain an additional '/' at the end (`http://localhost:5002/`).
      const urlWithoutTrailingSlash = removeTrailingSlash(url);

      return { ...accessData, url: urlWithoutTrailingSlash };
    } catch (error: unknown) {
      const [parsedError, errorCode] = parseError(error);

      res.status(errorCode).send(parsedError.detail);
    }
  };

  const webhookHandler = async (req: FastifyRequest<{ Body: ServerMessage }>, res: FastifyReply) => {
    await fastify.fishjam.handleFishjamMessage(req.body);
    res.status(200).send();
  };

  fastify.get<{ Querystring: GetPeerAccessQueryParams }, unknown>(
    '/',
    { schema: queryStringPeerEndpointSchema },
    (req, res) => getRoomAccessHandler(req.query.roomName, req.query.peerName, res)
  );
  fastify.post<{ Params: { roomName: string } }>('/:roomName/start-recording', { schema: startRecordingSchema }, () => {
    throw new Error('Not yet implemented');
  });
  fastify.post<{ Body: ServerMessage }>('/webhook', webhookHandler);
}
