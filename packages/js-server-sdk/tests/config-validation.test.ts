import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CredentialsApi } from '@fishjam-cloud/fishjam-openapi';
import { FishjamClient } from '../src/client';
import { InvalidFishjamCredentialsException, MissingFishjamIdException } from '../src/exceptions';
import type { FishjamConfig } from '../src/types';

const VALID_CONFIG: FishjamConfig = { fishjamId: 'fjm_test', managementToken: 'tok_test' };

const axiosError = (status: number, detail = 'error') => ({
  isAxiosError: true,
  request: { path: 'https://fish.jam/api/v1/connect/fishjam_id/validate' },
  message: `Request failed with status code ${status}`,
  code: 'ERR_BAD_REQUEST',
  response: { status, data: { detail } },
});

describe('FishjamClient constructor sync validation', () => {
  it('throws MissingFishjamIdException when fishjamId is empty', () => {
    expect(() => new FishjamClient({ fishjamId: '', managementToken: 'tok' })).toThrow(MissingFishjamIdException);
  });

  it('does not throw when both fields are provided', () => {
    expect(() => new FishjamClient(VALID_CONFIG)).not.toThrow();
  });
});

describe('FishjamClient live credential checks (mocked)', () => {
  const spy = () => vi.spyOn(CredentialsApi.prototype, 'validateCredentials');
  let validateSpy: ReturnType<typeof spy>;

  beforeEach(() => {
    validateSpy = spy();
  });

  afterEach(() => {
    validateSpy.mockRestore();
  });

  it('FishjamClient.create rejects with InvalidFishjamCredentialsException on 404', async () => {
    validateSpy.mockRejectedValueOnce(axiosError(404, 'Fishjam not found'));

    await expect(FishjamClient.create(VALID_CONFIG)).rejects.toThrow(InvalidFishjamCredentialsException);
  });

  it('FishjamClient.create resolves and pings backend once on success', async () => {
    validateSpy.mockResolvedValueOnce({ data: {} } as never);

    const client = await FishjamClient.create(VALID_CONFIG);

    expect(client).toBeInstanceOf(FishjamClient);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  it('checkCredentials throws InvalidFishjamCredentialsException on 404', async () => {
    validateSpy.mockRejectedValueOnce(axiosError(404, 'Fishjam not found'));

    const client = new FishjamClient(VALID_CONFIG);
    await expect(client.checkCredentials()).rejects.toThrow(InvalidFishjamCredentialsException);
  });

  it('checkCredentials resolves on success', async () => {
    validateSpy.mockResolvedValueOnce({ data: {} } as never);

    const client = new FishjamClient(VALID_CONFIG);
    await expect(client.checkCredentials()).resolves.toBeUndefined();
  });
});
