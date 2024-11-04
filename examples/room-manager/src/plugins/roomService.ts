import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { RoomService } from '../roomService';

declare module 'fastify' {
  interface FastifyInstance {
    roomService: RoomService;
  }
}

export const roomServicePlugin = fp(async (fastify: FastifyInstance): Promise<void> => {
  if (fastify.hasDecorator('roomService')) {
    throw new Error(
      'A `roomService` decorator has already been registered, please ensure you are not registering multiple instances of this plugin'
    );
  }
  const roomService = new RoomService(fastify.config.FISHJAM_URL, fastify.config.FISHJAM_SERVER_TOKEN);
  fastify.decorate('roomService', roomService);
});
