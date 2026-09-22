import { afterEach, describe, expect, it, vi } from 'vitest';
import { FishjamClient } from '../src/client';
import { BadRequestException } from '../src/exceptions';
import type { RecordingId } from '../src/types';

const COMPOSITION_URL = 'https://rtc.fishjam.test/api/composition/comp-1';

const client = () => new FishjamClient({ fishjamId: 'https://fishjam.test/api/v1/connect/x', managementToken: 'tok' });

const templateRecording = {
  id: 'rec-1',
  status: 'active',
  files: [],
  source: { compositionURL: COMPOSITION_URL, resolution: { width: 1920, height: 1080 }, audio: false },
};

const stubFetch = (body: unknown, status = 201) => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createTemplateRecording', () => {
  it('uploads the bundle alongside the recording config', async () => {
    const fetch = stubFetch({ data: templateRecording });

    const recording = await client().createTemplateRecording(
      { source: { compositionURL: COMPOSITION_URL, resolution: { width: 1920, height: 1080 }, audio: false } },
      new Blob(['bundle'])
    );

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/recordings$/);
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBeUndefined();

    const form = init.body as FormData;
    expect(await (form.get('template') as Blob).text()).toBe('bundle');
    expect(JSON.parse(await (form.get('config') as Blob).text())).toEqual({
      source: { compositionURL: COMPOSITION_URL, resolution: { width: 1920, height: 1080 }, audio: false },
    });

    expect(recording.id).toBe('rec-1');
    expect(recording.status).toBe('active');
  });

  it('reads the bundle from a path', async () => {
    const fetch = stubFetch({ data: templateRecording });

    await client().createTemplateRecording(
      { source: { compositionURL: COMPOSITION_URL } },
      `${import.meta.dirname}/fixtures/template.js`
    );

    const form = fetch.mock.calls[0][1].body as FormData;
    expect(await (form.get('template') as Blob).text()).toBe('export default () => null;\n');
    expect(JSON.parse(await (form.get('config') as Blob).text())).toEqual({
      source: { compositionURL: COMPOSITION_URL },
    });
  });

  it('throws BadRequestException when the server rejects the bundle', async () => {
    stubFetch({ errors: 'the template has no default export' }, 400);

    await expect(
      client().createTemplateRecording({ source: { compositionURL: COMPOSITION_URL } }, new Blob(['bundle']))
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('reading a template recording', () => {
  it('parses the source the server echoes back', async () => {
    stubFetch({ data: templateRecording }, 200);

    const recording = await client().getRecording('rec-1' as RecordingId);

    expect(recording.source).toEqual({
      compositionURL: COMPOSITION_URL,
      resolution: { width: 1920, height: 1080 },
      audio: false,
    });
  });
});
