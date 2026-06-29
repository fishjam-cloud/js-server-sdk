import { describe, it, expect } from 'vitest';
import { checkCredentials } from '../src/integrations/gemini';
import type { GoogleGenAI } from '@google/genai';

// Fake just the one method checkCredentials touches (models.list), no network / no key.
const fakeClient = (list: () => Promise<unknown>) => ({ models: { list } }) as unknown as GoogleGenAI;

describe('checkCredentials', () => {
  it('resolves when the key is accepted', async () => {
    await expect(checkCredentials(fakeClient(async () => ({})))).resolves.toBeUndefined();
  });

  it('throws a clear error wrapping the cause when verification fails', async () => {
    const cause = new Error('401 API key not valid');
    await expect(
      checkCredentials(
        fakeClient(async () => {
          throw cause;
        })
      )
    ).rejects.toMatchObject({ message: expect.stringContaining('Could not verify the Gemini API key'), cause });
  });
});
