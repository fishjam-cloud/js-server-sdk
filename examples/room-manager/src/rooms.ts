import { FastifyInstance } from 'fastify';
import { RoomService } from './room_service';
import axios from 'axios';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';

type Error = {
  error:
    | 'Cannot connect to the FishJam instance'
    | 'Cannot authorize with the FishJam instance'
    | 'Invalid request structure sent to the FishJam instance'
    | 'Unknown error when connecting to the FishJam instance'
    | "Room doesn't exist"
    | 'Peer limit has been reached'
    | 'Internal server error';
  cause?: unknown;
  path?: string;
  method?: string;
};

export async function roomsEndpoints(fastify: FastifyInstance) {
  const roomService = new RoomService(fastify.config.JELLYFISH_URL, fastify.config.JELLYFISH_SERVER_TOKEN);

  type Params = {
    roomId: string;
    userId: string;
  };

  fastify.get<{ Params: Params }>(
    '/api/rooms/:roomId/users/:userId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            roomId: { type: 'string' },
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              url: { type: 'string' },
            },
            required: ['token', 'url'],
          },
          410: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              path: { type: 'string' },
              method: { type: 'string' },
            },
            required: ['error'],
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              cause: { type: 'string' },
              path: { type: 'string' },
              method: { type: 'string' },
            },
            required: ['error'],
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
          url: user.url,
        };
      } catch (error: unknown) {
        const [errorMessage, code] = parseError(error);
        return reply.status(code).send(errorMessage);
      }
    }
  );

  fastify.post<{ Body: ServerMessage }>('/webhook', async (request, reply) => {
    await roomService.handleJellyfishMessage(request.body);
    return reply.status(200).send();
  });
}

function parseError(error: unknown): [Error, number] {
  let parsedError: Error;

  let errorCode = 500;

  if (axios.isAxiosError(error)) {
    let errorMessage: Error['error'];
    const statusCode = error.status ?? error.response?.status;
    if (!statusCode) {
      errorMessage = 'Cannot connect to the FishJam instance';
    } else if (statusCode === 404) {
      errorMessage = "Room doesn't exist";
    } else if (statusCode === 401) {
      errorMessage = 'Cannot authorize with the FishJam instance';
    } else if (statusCode === 400) {
      errorMessage = 'Invalid request structure sent to the FishJam instance';
    } else if (statusCode === 503) {
      errorMessage = 'Peer limit has been reached';
      errorCode = 410;
    } else {
      errorMessage = 'Unknown error when connecting to the FishJam instance';
    }

    parsedError = {
      error: errorMessage,
      path: error.config?.url,
      method: error.config?.method,
    };
  } else {
    parsedError = {
      error: 'Internal server error',
      cause: error,
    };
  }
  return [parsedError, errorCode];
}
