import { MissingFishjamIdException, MissingManagementTokenException } from './exceptions';
import type { FishjamConfig } from './types';

export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
};

export const validateFishjamConfig = (config: FishjamConfig): void => {
  if (!config?.fishjamId) throw new MissingFishjamIdException();
  if (!config?.managementToken) throw new MissingManagementTokenException();
};

export const getFishjamUrl = (config: FishjamConfig) => {
  if (!config.fishjamId) throw new MissingFishjamIdException();

  try {
    return new URL(config.fishjamId).href;
  } catch {
    return `https://fishjam.io/api/v1/connect/${config.fishjamId}`;
  }
};
