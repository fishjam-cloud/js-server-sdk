import type { FishjamConfig } from './types';

export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
};

export const getFishjamUrl = (config: FishjamConfig) =>
  config.fishjamUrl ?? `https://fishjam.io/api/v1/connect/${config.fishjamId}`;
