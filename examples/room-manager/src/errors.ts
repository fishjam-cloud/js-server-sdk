import { fastify } from './index';
import { FishjamBaseException } from '@fishjam-cloud/js-server-sdk';

export class RoomManagerError extends Error {
  detail: Record<string, string>;
  statusCode: number;

  constructor(errorMessage: string, statusCode = 500) {
    super(errorMessage);
    this.name = this.constructor.name;
    this.detail = { error: errorMessage };
    this.statusCode = statusCode;
  }
}

const isRoomManagerError = (err: unknown): err is RoomManagerError => err instanceof RoomManagerError;

export function parseError(error: unknown): [RoomManagerError, number] {
  let parsedError: RoomManagerError;
  fastify.log.error(error);

  if (error instanceof FishjamBaseException) {
    parsedError = new RoomManagerError(error.message);
    return [parsedError, error.statusCode];
  }

  if (isRoomManagerError(error)) {
    return [error, error.statusCode];
  }

  return [new RoomManagerError('Internal server error'), 500];
}
