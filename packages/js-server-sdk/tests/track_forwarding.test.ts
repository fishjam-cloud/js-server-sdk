import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompositionClient } from '../src/composition';
import { FishjamClient } from '../src/client';
import type { CompositionId, RoomId } from '../src/types';

const ROOM_ID = 'room-1' as RoomId;
const COMPOSITION_ID = 'comp-1' as CompositionId;

const stubFetch = () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forwardRoomTracks', () => {
  it('points fishjam at the composition it should feed', async () => {
    const fetch = stubFetch();
    const compositions = new CompositionClient({ managementToken: 't', compositionUrl: 'http://localhost:8000' });
    const fishjam = new FishjamClient({ fishjamId: 'http://localhost:5002', managementToken: 't' });

    await fishjam.forwardRoomTracks(ROOM_ID, compositions.compositionUrl(COMPOSITION_ID));

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toContain('/room/room-1/track_forwardings');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      compositionURL: 'http://localhost:8000/api/composition/comp-1',
    });
  });
});

describe('compositionUrl', () => {
  it('addresses a composition on the configured deployment', () => {
    const client = new CompositionClient({ managementToken: 't', compositionUrl: 'http://localhost:8000' });

    expect(client.compositionUrl(COMPOSITION_ID)).toBe('http://localhost:8000/api/composition/comp-1');
  });

  it('defaults to the production Composition API', () => {
    const client = new CompositionClient({ managementToken: 't' });

    expect(client.compositionUrl(COMPOSITION_ID)).toBe('https://rtc.fishjam.io/api/composition/comp-1');
  });
});

describe('livestreamWhipUrl', () => {
  it('derives the address from a bare Fishjam ID', () => {
    const client = new FishjamClient({ fishjamId: 'abc123', managementToken: 't' });

    expect(client.livestreamWhipUrl()).toBe('https://fishjam.io/api/v1/live/api/whip');
  });

  it('keeps the host when the Fishjam ID is a full URL', () => {
    const client = new FishjamClient({
      fishjamId: 'https://cloud.fishjam.work/api/v1/connect/abc123',
      managementToken: 't',
    });

    expect(client.livestreamWhipUrl()).toBe('https://cloud.fishjam.work/api/v1/live/api/whip');
  });
});
