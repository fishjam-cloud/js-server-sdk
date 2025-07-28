import { FastifyInstance, FastifyReply } from 'fastify';

import { parseError } from '../errors';
import { fishjamPlugin } from '../plugins';
import {
  GetPeerAccessQueryParams,
  peerEndpointSchema,
  LivestreamQueryParams,
  streamEndpointSchema,
  viewerEndpointSchema,
} from '../schema';

async function getRoomAccessHandler(fastify: FastifyInstance, params: GetPeerAccessQueryParams, res: FastifyReply) {
  try {
    const accessData = await fastify.fishjam.getPeerAccess(
      params.roomName,
      params.peerName,
      params.roomType,
      params.public
    );

    return accessData;
  } catch (error: unknown) {
    const [parsedError, errorCode] = parseError(error);

    res.status(errorCode).send(parsedError.detail);
  }
}

export async function rooms(fastify: FastifyInstance) {
  await fastify.register(fishjamPlugin);

  fastify.get<{ Querystring: GetPeerAccessQueryParams }, unknown>('/', { schema: peerEndpointSchema }, (req, res) =>
    getRoomAccessHandler(fastify, req.query, res)
  );

  fastify.get<{ Params: { roomName: string } }, unknown>(
    '/:roomName/broadcast-viewer-token',
    { schema: viewerEndpointSchema },
    (req, res) => createLivestreamViewerToken(fastify, req.params.roomName, res)
  );

  fastify.get<{ Params: { roomName: string } }, unknown>(
    '/:roomName/livestream-viewer-token',
    { schema: viewerEndpointSchema },
    (req, res) => createLivestreamViewerToken(fastify, req.params.roomName, res)
  );

  fastify.get<{ Querystring: LivestreamQueryParams }, unknown>(
    '/livestream',
    { schema: streamEndpointSchema },
    (req, res) => createLivestreamStreamerToken(fastify, req.query, res)
  );
}

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
