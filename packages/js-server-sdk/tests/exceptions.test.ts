import { describe, it, expect } from 'vitest';
import { ResponseError, FetchError } from '@fishjam-cloud/fishjam-openapi';
import { mapException } from '../src/exceptions/mapper';
import {
  BadRequestException,
  FishjamBaseException,
  FishjamNotFoundException,
  InvalidFishjamCredentialsException,
  PeerNotFoundException,
  QuotaExceededException,
  RoomNotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnknownException,
} from '../src/exceptions';

const responseError = (status: number, body?: Record<string, string>) =>
  new ResponseError(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('mapException status mapping', () => {
  it.each([
    [400, BadRequestException],
    [402, QuotaExceededException],
    [401, UnauthorizedException],
    [503, ServiceUnavailableException],
    [418, UnknownException],
  ] as const)('maps %i to %o', async (status, exceptionClass) => {
    const mapped = await mapException(responseError(status, { detail: 'boom' }));
    expect(mapped).toBeInstanceOf(exceptionClass);
  });

  it.each([
    ['credentials', InvalidFishjamCredentialsException],
    ['peer', PeerNotFoundException],
    ['room', RoomNotFoundException],
    [undefined, FishjamNotFoundException],
  ] as const)('maps 404 with entity %s to %o', async (entity, exceptionClass) => {
    const mapped = await mapException(responseError(404, { detail: 'missing' }), entity);
    expect(mapped).toBeInstanceOf(exceptionClass);
  });
});

describe('mapException error contents', () => {
  it('exposes status code, message and body detail', async () => {
    const mapped = (await mapException(responseError(400, { detail: 'bad room config' }))) as FishjamBaseException;

    expect(mapped.statusCode).toBe(400);
    expect(mapped.message).toBe('Request failed with status code 400');
    expect(mapped.details).toBe('bad room config');
  });

  it('falls back to body errors field', async () => {
    const mapped = (await mapException(responseError(400, { errors: 'invalid payload' }))) as FishjamBaseException;

    expect(mapped.details).toBe('invalid payload');
  });

  it('tolerates an unparseable body', async () => {
    const mapped = (await mapException(responseError(503))) as FishjamBaseException;

    expect(mapped.statusCode).toBe(503);
    expect(mapped.details).toBe('Unknown error');
  });
});

describe('mapException non-response errors', () => {
  it('maps FetchError (network failure) to UnknownException with statusCode 500', async () => {
    const mapped = (await mapException(new FetchError(new Error('connect ECONNREFUSED')))) as FishjamBaseException;

    expect(mapped).toBeInstanceOf(UnknownException);
    expect(mapped.statusCode).toBe(500);
    expect(mapped.message).toBe('connect ECONNREFUSED');
    expect(mapped.details).toBe('connect ECONNREFUSED');
  });

  it('passes non-SDK errors through unchanged', async () => {
    const plain = new Error('not ours');

    await expect(mapException(plain)).resolves.toBe(plain);
  });
});
