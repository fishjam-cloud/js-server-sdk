import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompositionClient } from '../src/composition';
import { InputNotFoundException, RendererNotFoundException, UnknownException } from '../src/exceptions';
import { getCompositionUrl } from '../src/utils';
import type { CompositionId, InputId, OutputId } from '../src/types';

const COMPOSITION_ID = 'comp-1' as CompositionId;
const INPUT_ID = 'cam' as InputId;
const OUTPUT_ID = 'out-1' as OutputId;

const client = (compositionUrl?: string) => new CompositionClient({ managementToken: 'token', compositionUrl });

const stubFetch = (body: unknown, status = 200) => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

const requestBody = (fetch: ReturnType<typeof stubFetch>) => JSON.parse(fetch.mock.calls[0][1].body as string);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCompositionUrl', () => {
  it('defaults to the production Composition API', () => {
    expect(getCompositionUrl({ managementToken: 't' })).toBe('https://rtc.fishjam.io');
  });

  it('uses the configured address when given one', () => {
    expect(getCompositionUrl({ managementToken: 't', compositionUrl: 'http://localhost:8000' })).toBe(
      'http://localhost:8000'
    );
  });

  it('keeps the origin only, so paths do not end up doubled', () => {
    expect(getCompositionUrl({ managementToken: 't', compositionUrl: 'http://localhost:8000/' })).toBe(
      'http://localhost:8000'
    );
  });
});

describe('request serialisation', () => {
  it('sends the wire format snake_case while the surface stays camelCase', async () => {
    const fetch = stubFetch({});
    await client().registerOutput(COMPOSITION_ID, OUTPUT_ID, {
      type: 'whip_client',
      endpointUrl: 'https://example.com/whip',
      bearerToken: 'wt',
      video: {
        resolution: { width: 1280, height: 720 },
        initial: { root: { type: 'input_stream', inputId: 'cam' } },
      },
    });

    expect(requestBody(fetch)).toEqual({
      type: 'whip_client',
      endpoint_url: 'https://example.com/whip',
      bearer_token: 'wt',
      video: {
        resolution: { width: 1280, height: 720 },
        initial: { root: { input_id: 'cam', type: 'input_stream' } },
      },
    });
  });

  it('reads a response back into camelCase', async () => {
    stubFetch({ port: 5004 });
    const response = await client().registerInput(COMPOSITION_ID, INPUT_ID, {
      type: 'rtmp_server',
      streamKey: 'key',
    });

    expect(response).toEqual({ port: 5004 });
  });
});

describe('input variants', () => {
  it('resolves the WHIP publishing address from the route the server returned', async () => {
    stubFetch({ bearer_token: 'tok', endpoint_route: '/whip/server-chosen-route' });
    const target = await client('http://localhost:8000').registerWhipInput(COMPOSITION_ID, INPUT_ID);

    expect(target).toEqual({
      url: 'http://localhost:8000/api/composition/comp-1/whip/server-chosen-route',
      bearerToken: 'tok',
    });
  });

  it('falls back to the conventional WHIP route when the server omits it', async () => {
    stubFetch({ bearer_token: 'tok' });
    const target = await client('http://localhost:8000').registerWhipInput(COMPOSITION_ID, INPUT_ID);

    expect(target.url).toBe('http://localhost:8000/api/composition/comp-1/whip/cam');
  });

  it('keeps a caller-supplied WHIP token', async () => {
    stubFetch({ endpoint_route: '/whip/cam' });
    const target = await client().registerWhipInput(COMPOSITION_ID, INPUT_ID, { bearerToken: 'mine' });

    expect(target.bearerToken).toBe('mine');
  });

  it('throws when neither the caller nor the server provides a WHIP token', async () => {
    stubFetch({ endpoint_route: '/whip/cam' });

    await expect(client().registerWhipInput(COMPOSITION_ID, INPUT_ID)).rejects.toThrow(UnknownException);
  });

  it('sends the discriminant for each variant', async () => {
    const cases = [
      [(c: CompositionClient) => c.registerWhipInput(COMPOSITION_ID, INPUT_ID), 'whip_server'],
      [
        (c: CompositionClient) => c.registerWhepInput(COMPOSITION_ID, INPUT_ID, { endpointUrl: 'https://x/whep' }),
        'whep_client',
      ],
      [(c: CompositionClient) => c.registerMp4Input(COMPOSITION_ID, INPUT_ID, { url: 'https://x/a.mp4' }), 'mp4'],
      [(c: CompositionClient) => c.registerRtmpInput(COMPOSITION_ID, INPUT_ID, { streamKey: 'k' }), 'rtmp_server'],
    ] as const;

    for (const [register, type] of cases) {
      const fetch = stubFetch({ bearer_token: 'tok' });
      await register(client());
      expect(requestBody(fetch).type).toBe(type);
      vi.unstubAllGlobals();
    }
  });

  it('returns the durations of an MP4 input', async () => {
    stubFetch({ video_duration_ms: 1000, audio_duration_ms: 2000 });

    await expect(client().registerMp4Input(COMPOSITION_ID, INPUT_ID, { url: 'https://x/a.mp4' })).resolves.toEqual({
      videoDurationMs: 1000,
      audioDurationMs: 2000,
    });
  });
});

describe('output variants', () => {
  it('sends the discriminant for each variant', async () => {
    const whip = stubFetch({});
    await client().registerWhipOutput(COMPOSITION_ID, OUTPUT_ID, { endpointUrl: 'https://x/whip' });
    expect(requestBody(whip)).toEqual({ endpoint_url: 'https://x/whip', type: 'whip_client' });
    vi.unstubAllGlobals();

    const rtmp = stubFetch({});
    await client().registerRtmpOutput(COMPOSITION_ID, OUTPUT_ID, { url: 'rtmp://x/live' });
    expect(requestBody(rtmp)).toEqual({ url: 'rtmp://x/live', type: 'rtmp_client' });
  });
});

describe('file uploads', () => {
  it('reads a font from a path', async () => {
    const fetch = stubFetch({});
    await client().registerFont(COMPOSITION_ID, `${import.meta.dirname}/fixtures/font.ttf`);

    const form = fetch.mock.calls[0][1].body as FormData;
    expect(await (form.get('font') as Blob).text()).toBe('font-bytes');
  });

  it('accepts a Blob as it is', async () => {
    const fetch = stubFetch({});
    await client().registerFont(COMPOSITION_ID, new Blob(['inline']));

    const form = fetch.mock.calls[0][1].body as FormData;
    expect(await (form.get('font') as Blob).text()).toBe('inline');
  });

  it('uploads a template bundle alongside its output config', async () => {
    const fetch = stubFetch({});
    await client().registerTemplateOutput(
      COMPOSITION_ID,
      OUTPUT_ID,
      { type: 'whip_client', endpointUrl: 'https://example.com/whip' },
      new Blob(['bundle'])
    );

    const form = fetch.mock.calls[0][1].body as FormData;
    expect(await (form.get('template') as Blob).text()).toBe('bundle');
    expect(JSON.parse(await (form.get('config') as Blob).text())).toEqual({
      type: 'whip_client',
      endpoint_url: 'https://example.com/whip',
    });
  });
});

describe('missing resources', () => {
  const notFound = () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'gone' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetch);
  };

  it('reports a missing input rather than a missing composition', async () => {
    notFound();

    await expect(client().unregisterInput(COMPOSITION_ID, INPUT_ID)).rejects.toBeInstanceOf(InputNotFoundException);
  });

  it('reports a missing image rather than a missing composition', async () => {
    notFound();

    await expect(client().unregisterImage(COMPOSITION_ID, 'logo' as never)).rejects.toBeInstanceOf(
      RendererNotFoundException
    );
  });
});
