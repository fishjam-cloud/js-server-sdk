import { MissingFishjamIdException } from './exceptions';
import type { FishjamConfig } from './types';

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
    return `https://fishjam.io/api/v1/connect/${config.fishjamId}`;
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
