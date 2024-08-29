import { fastify } from './index';
import { FishjamBaseException } from '@fishjam-cloud/js-server-sdk';

export class RoomManagerError extends Error {
  detail: Record<string, string>;

  constructor(errorMessage: string) {
    super(errorMessage);
    this.name = this.constructor.name;
    this.detail = { "error": errorMessage };
  }
}

const isRoomManagerError = (err: unknown): err is RoomManagerError => err instanceof RoomManagerError;

export function parseError(error: unknown): [RoomManagerError, number] {
  let statusCode = 500;
  let parsedError: RoomManagerError;
  fastify.log.error(error);

  if (error instanceof FishjamBaseException) {
    statusCode = error.statusCode;
    parsedError = new RoomManagerError(error.message);
    return [parsedError, statusCode];
  }


  if (isRoomManagerError(error)) {
    return [error, statusCode];
  }

  return [new RoomManagerError('Internal server error'), statusCode];
}
