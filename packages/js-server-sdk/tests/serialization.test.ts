import { describe, it, expect, vi, afterEach } from 'vitest';
import { FishjamClient } from '../src/client';
import type { RoomId } from '../src/types';

const makeClient = () =>
  new FishjamClient({ fishjamId: 'https://fishjam.test/api/v1/connect/x', managementToken: 'tok' });

let capturedBody: { type: string; options: Record<string, unknown> };

const stubFetch = (responseBody: unknown) =>
  vi.fn(async (_input: unknown, init?: RequestInit) => {
    capturedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  });

const peerResponse = {
  data: {
    peer: {
      id: 'p1',
      metadata: {},
      status: 'disconnected',
      subscribeMode: 'auto',
      subscriptions: {},
      tracks: [],
      type: 'webrtc',
    },
    token: 't1',
  },
};

describe('addPeer request body serialization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createPeer sends webrtc metadata on the wire', async () => {
    vi.stubGlobal('fetch', stubFetch(peerResponse));

    await makeClient().createPeer('room-1' as RoomId, { metadata: { role: 'host' } });

    expect(capturedBody.type).toBe('webrtc');
    expect(capturedBody.options.metadata).toEqual({ role: 'host' });
  });

  it('createVapiAgent sends apiKey and callId on the wire', async () => {
    vi.stubGlobal('fetch', stubFetch(peerResponse));

    await makeClient().createVapiAgent('room-1' as RoomId, { apiKey: 'vapi-key', callId: 'call-7' });

    expect(capturedBody.type).toBe('vapi');
    expect(capturedBody.options.apiKey).toBe('vapi-key');
    expect(capturedBody.options.callId).toBe('call-7');
  });

  it('createPeer sends subscribeMode for webrtc peers', async () => {
    vi.stubGlobal('fetch', stubFetch(peerResponse));

    await makeClient().createPeer('room-1' as RoomId, { subscribeMode: 'manual' });

    expect(capturedBody.options.subscribeMode).toBe('manual');
  });
});
