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
