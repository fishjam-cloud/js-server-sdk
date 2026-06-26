import { GoogleGenAI } from '@google/genai';
import type { GoogleGenAIOptions } from '@google/genai';
import fishjamSDK from '../../package.json';
import type { AgentOutput } from '@fishjam-cloud/fishjam-openapi';
import type { AudioCodecParameters } from '../agent.js';

const SDK_NAME = 'fishjam-js-server-sdk';

/**
 * Creates a GoogleGenAI client.
 *
 * This module is a separate entry point (`@fishjam-cloud/js-server-sdk/gemini`),
 * so `@google/genai` is only loaded when the consumer imports this module.
 *
 * Does not verify the API key against Google — use {@link createClientAndValidate}
 * or call {@link checkCredentials} afterwards for that.
 *
 * @param options Configuration for the GoogleGenAI client.
 * @returns A GoogleGenAI instance.
 */
export const createClient = (options: GoogleGenAIOptions): GoogleGenAI => {
  const trackingHeader = { 'X-Goog-Api-Client': `${SDK_NAME}/${fishjamSDK.version}` };
  const finalOptions = {
    ...options,
    httpOptions: {
      ...options.httpOptions,
      headers: {
        ...options.httpOptions?.headers,
        ...trackingHeader,
      },
    },
  };
  return new GoogleGenAI(finalOptions);
};

/**
 * Verifies the API key by making a single lightweight authenticated call
 * (`models.list`). Resolves on success, throws on a rejected key.
 *
 * Note: this catches the common cases (invalid / unauthorized / wrong-project /
 * region-blocked keys). It does not guarantee the key can use a specific Live
 * native-audio model — such model-specific rejections still surface only via the
 * `live.connect` session callbacks (`onerror`/`onclose`).
 *
 * @param client A GoogleGenAI instance, e.g. from {@link createClient}.
 */
export const checkCredentials = async (client: GoogleGenAI): Promise<void> => {
  try {
    await client.models.list();
  } catch (error) {
    throw new Error(
      'Gemini API key was rejected. Check the key and that the Gemini API is enabled for its project/region.',
      { cause: error }
    );
  }
};

/**
 * Creates a GoogleGenAI client and verifies the API key before returning it,
 * so misconfiguration fails fast.
 *
 * Throws if the key is rejected (see {@link checkCredentials}).
 *
 * @param options Configuration for the GoogleGenAI client.
 * @returns A validated GoogleGenAI instance.
 */
export const createClientAndValidate = async (options: GoogleGenAIOptions): Promise<GoogleGenAI> => {
  const client = createClient(options);
  await checkCredentials(client);
  return client;
};

/**
 * Predefined audio settings for the agent's output track,
 * configured for Gemini's 24kHz audio output.
 */
export const geminiOutputAudioSettings = {
  encoding: 'pcm16',
  channels: 1,
  sampleRate: 24000,
} as const satisfies AudioCodecParameters;

/**
 * Predefined audio settings for subscribing to room audio,
 * configured for Gemini's 16kHz audio input.
 */
export const geminiInputAudioSettings = {
  audioFormat: 'pcm16',
  audioSampleRate: 16000,
} as const satisfies AgentOutput;

/**
 * The MIME type for the audio data sent to Gemini.
 */
export const inputMimeType = 'audio/pcm;rate=16000' as const;
