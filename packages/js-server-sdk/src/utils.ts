import { readFile } from 'node:fs/promises';
import { MissingFishjamIdException } from './exceptions';
import type { CompositionConfig, FishjamConfig } from './types';

const FISHJAM_URL = 'https://fishjam.io';

export const httpToWebsocket = (httpUrl: string) => {
  const url = new URL(httpUrl);

  // note that this will handle http as well as https
  url.protocol = url.protocol.replace('http', 'ws');
  return url.href;
};

export const getFishjamUrl = (config: FishjamConfig) => {
  if (!config.fishjamId) throw new MissingFishjamIdException();

  try {
    return new URL(config.fishjamId).href;
  } catch {
    return `${FISHJAM_URL}/api/v1/connect/${config.fishjamId}`;
  }
};

const AGENT_SOCKET_PATH = '/socket/agent/websocket';

export const getAgentWebsocketUrl = (config: FishjamConfig, peerWebsocketUrl?: string): string => {
  if (peerWebsocketUrl) {
    // The server may return the address without a scheme (e.g. `host/socket/peer/websocket`).
    const url = new URL(peerWebsocketUrl.includes('://') ? peerWebsocketUrl : `https://${peerWebsocketUrl}`);
    url.protocol = url.protocol.replace('http', 'ws');
    url.pathname = url.pathname.replace(/\/socket\/peer\/websocket$/, AGENT_SOCKET_PATH);
    return url.href;
  }
  return `${httpToWebsocket(getFishjamUrl(config))}${AGENT_SOCKET_PATH}`;
};

const COMPOSITION_URL = 'https://rtc.fishjam.io';

export const getCompositionUrl = (config: CompositionConfig) =>
  new URL(config.compositionUrl ?? COMPOSITION_URL).origin;

export const toBlob = async (file: Blob | string): Promise<Blob> =>
  typeof file === 'string' ? new Blob([await readFile(file)]) : file;

export const getLivestreamWhipUrl = (config: FishjamConfig) =>
  `${new URL(getFishjamUrl(config)).origin}/api/v1/live/api/whip`;
