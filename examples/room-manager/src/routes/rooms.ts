import { FastifyInstance, FastifyReply } from 'fastify';

import { parseError } from '../errors';
import { fishjamPlugin } from '../plugins';
import { GetPeerAccessQueryParams, queryStringPeerEndpointSchema } from '../schema';
import { httpToWebsocket, removeTrailingSlash } from '../utils';

async function getRoomAccessHandler(fastify: FastifyInstance, params: GetPeerAccessQueryParams, res: FastifyReply) {
  try {
    const accessData = await fastify.fishjam.getPeerAccess(params.roomName, params.peerName, params.roomType);
    const url = httpToWebsocket(fastify.config.FISHJAM_URL);

    // When creating a URL object from a URL without a path (e.g., `http://localhost:5002`),
    // the `href` field may contain an additional '/' at the end (`http://localhost:5002/`).
    const urlWithoutTrailingSlash = removeTrailingSlash(url);

    return { ...accessData, url: urlWithoutTrailingSlash };
  } catch (error: unknown) {
    const [parsedError, errorCode] = parseError(error);

    res.status(errorCode).send(parsedError.detail);
  }
}

async function createBroadcastViewerToken(fastify: FastifyInstance, roomName: string, res: FastifyReply) {
  try {
    return await fastify.fishjam.getBroadcastViewerToken(roomName);
  } catch (error: unknown) {
    const [parsedError, errorCode] = parseError(error);

    res.status(errorCode).send(parsedError.detail);
  }
}

export async function rooms(fastify: FastifyInstance) {
  await fastify.register(fishjamPlugin);

  fastify.get<{ Querystring: GetPeerAccessQueryParams }, unknown>(
    '/',
    { schema: queryStringPeerEndpointSchema },
    (req, res) => getRoomAccessHandler(fastify, req.query, res)
  );

  fastify.get<{ Params: { roomName: string } }, unknown>('/:roomName/broadcast-viewer-token', (req, res) =>
    createBroadcastViewerToken(fastify, req.params.roomName, res)
  );
}
