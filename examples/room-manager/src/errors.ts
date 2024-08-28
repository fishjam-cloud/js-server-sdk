import { fastify } from './index';
import { FishjamBaseException } from '@fishjam-cloud/js-server-sdk';

export class RoomManagerError extends Error {
  detail: Record<string, string>;

  constructor(detail: string) {
    super(detail);
    this.name = this.constructor.name;
    this.detail = { "detail": detail };
  }
}

export function parseError(error: unknown): [RoomManagerError, number] {
  let statusCode = 500;
  let parsedError: RoomManagerError;
  fastify.log.error(error);

  if (error instanceof FishjamBaseException) {
    statusCode = error.statusCode;
    parsedError = new RoomManagerError(error.message);
    return [parsedError, statusCode];
  }

  if (error instanceof RoomManagerError) {
    parsedError = new RoomManagerError(String(error));
    return [parsedError, statusCode];
  }

  return [new RoomManagerError('Internal server error'), statusCode];
}
