import Fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifySwagger from '@fastify/swagger';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import healthcheck from 'fastify-healthcheck';

import { configSchema } from './config';
import { rooms } from './routes';
import openapi from './openapi';

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
};

export const fastify = Fastify({ logger: envToLogger.development, ignoreTrailingSlash: true });

async function setupServer() {
  await fastify.register(cors, { origin: '*' });
  await fastify.register(fastifyEnv, { schema: configSchema });

  fastify.log.info({ config: fastify.config });

  fastify.addContentTypeParser(
    'application/x-protobuf',
    { parseAs: 'buffer' },
    async (_req: FastifyRequest, body: Buffer) => {
      return ServerMessage.decode(body);
    }
  );

  await fastify.register(fastifySwagger, { openapi });
  await fastify.register(healthcheck);
  await fastify.register(rooms, { prefix: '/api/rooms' });

  fastify.listen({ port: fastify.config.PORT, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

setupServer();
