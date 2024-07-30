import Fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { configSchema } from './config';
import fastifyEnv from '@fastify/env';
import { roomsEndpoints } from './rooms';
import { ServerMessage } from '@fishjam-cloud/js-server-sdk/proto';
import healthcheck from 'fastify-healthcheck';
import fastifySwagger from '@fastify/swagger';
import { openapi } from './opanapi';

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

export const fastify = Fastify({ logger: envToLogger.development });

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
  await fastify.register(roomsEndpoints);

  fastify.listen({ port: fastify.config.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

setupServer();
