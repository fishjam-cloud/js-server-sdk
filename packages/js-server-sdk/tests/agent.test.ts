import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAgentWebsocketUrl } from '../src/utils';
import { FishjamAgent } from '../src/agent';

describe('getAgentWebsocketUrl', () => {
  it('swaps the peer socket suffix for the agent one when peer_websocket_url is present', () => {
    expect(
      getAgentWebsocketUrl({ fishjamId: 'test-id', managementToken: 't' }, 'wss://media-node/socket/peer/websocket')
    ).toBe('wss://media-node/socket/agent/websocket');
  });

  it('normalizes an http(s) peer_websocket_url to ws(s)', () => {
    expect(
      getAgentWebsocketUrl(
        { fishjamId: 'test-id', managementToken: 't' },
        'http://localhost:5000/socket/peer/websocket'
      )
    ).toBe('ws://localhost:5000/socket/agent/websocket');
  });

  it('prepends https:// when the server returns a scheme-less peer_websocket_url', () => {
    expect(
      getAgentWebsocketUrl(
        { fishjamId: 'test-id', managementToken: 't' },
        'cloud.fishjam.work/api/v1/connect/abc123/socket/peer/websocket'
      )
    ).toBe('wss://cloud.fishjam.work/api/v1/connect/abc123/socket/agent/websocket');
  });

  it('preserves a path prefix while swapping the suffix', () => {
    expect(
      getAgentWebsocketUrl(
        { fishjamId: 'test-id', managementToken: 't' },
        'wss://host/tenant-123/socket/peer/websocket'
      )
    ).toBe('wss://host/tenant-123/socket/agent/websocket');
  });

  it('falls back to deriving from a plain fishjamId when peer_websocket_url is absent', () => {
    expect(getAgentWebsocketUrl({ fishjamId: 'test-id', managementToken: 't' })).toBe(
      'wss://fishjam.io/api/v1/connect/test-id/socket/agent/websocket'
    );
  });

  it('falls back to deriving from a full Fishjam URL when peer_websocket_url is absent', () => {
    expect(
      getAgentWebsocketUrl({ fishjamId: 'http://localhost:4000/api/v1/connect/local-id', managementToken: 't' })
    ).toBe('ws://localhost:4000/api/v1/connect/local-id/socket/agent/websocket');
  });
});

type MessageLike = { data: Uint8Array | ArrayBuffer };

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  binaryType = 'blob';
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessage: ((event: MessageLike) => void) | null = null;
  close = vi.fn();

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send() {}
}

const config = { fishjamId: 'test-id', managementToken: 'test-token' };

describe('FishjamAgent connection', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('connects to the agent socket derived from peer_websocket_url', () => {
    new FishjamAgent(config, 'token', undefined, 'wss://media-node/socket/peer/websocket');
    expect(FakeWebSocket.instances.at(-1)?.url).toBe('wss://media-node/socket/agent/websocket');
  });

  it('resolves awaitConnected once the socket opens', async () => {
    const agent = new FishjamAgent(config, 'token');
    FakeWebSocket.instances.at(-1)?.onopen?.();
    await expect(agent.awaitConnected()).resolves.toBeUndefined();
  });

  it('rejects awaitConnected when the socket closes before connecting', async () => {
    const agent = new FishjamAgent(config, 'token');
    FakeWebSocket.instances.at(-1)?.onclose?.({ code: 1006, reason: 'not found' });
    await expect(agent.awaitConnected()).rejects.toThrow(/closed before connecting/);
  });
});
