import { FastifyInstance, FastifyReply } from 'fastify';

import { parseError } from '../errors';
import { fishjamPlugin } from '../plugins';
import { LivestreamQueryParams, streamEndpointSchema, viewerEndpointSchema } from '../schema';

async function createLivestreamViewerToken(fastify: FastifyInstance, roomName: string, res: FastifyReply) {
  try {
    return await fastify.fishjam.getLivestreamViewerToken(roomName);
  } catch (error: unknown) {
    const [parsedError, errorCode] = parseError(error);

    res.status(errorCode).send(parsedError.detail);
  }
}

async function createLivestreamStreamerToken(
  fastify: FastifyInstance,
  params: LivestreamQueryParams,
  res: FastifyReply
) {
  try {
    return await fastify.fishjam.getLivestreamStreamerToken(params.roomName, params.public);
  } catch (error: unknown) {
    const [parsedError, errorCode] = parseError(error);

    res.status(errorCode).send(parsedError.detail);
  }
}

export async function streams(fastify: FastifyInstance) {
  await fastify.register(fishjamPlugin);

  fastify.get<{ Querystring: LivestreamQueryParams }, unknown>('/', { schema: streamEndpointSchema }, (req, res) =>
    createLivestreamStreamerToken(fastify, req.query, res)
  );

  fastify.get<{ Params: { roomName: string } }, unknown>(
    '/:roomName/livestream-viewer-token',
    { schema: viewerEndpointSchema },
    (req, res) => createLivestreamViewerToken(fastify, req.params.roomName, res)
  );
}
