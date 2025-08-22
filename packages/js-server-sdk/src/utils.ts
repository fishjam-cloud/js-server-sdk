import { MissingFishjamIdException } from './exceptions';
import type { FishjamConfig, PeerId } from './types';

export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
};

export const getFishjamUrl = (config: FishjamConfig) => {
  if (!config.fishjamId && !config.fishjamUrl) throw new MissingFishjamIdException();

  return config.fishjamUrl ?? `https://fishjam.io/api/v1/connect/${config.fishjamId}`;
};

export type WithPeerId<T> = {
  [P in keyof T]: NonNullable<T[P]> extends { peerId: string }
    ? Omit<NonNullable<T[P]>, 'peerId'> & { peerId: PeerId }
    : T[P];
};
