import { MissingFishjamIdException } from './exceptions';
import type { FishjamConfig } from './types';

export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
};

export const getFishjamUrl = (config: FishjamConfig) => {
  if (!config.fishjamId || !config.fishjamUrl) throw new MissingFishjamIdException();

  return config.fishjamUrl ?? `https://fishjam.io/api/v1/connect/${config.fishjamId}`;
};
