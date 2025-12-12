import type { GoogleGenAI, GoogleGenAIOptions } from '@google/genai' with { 'resolution-mode': 'import' };
import fishjamSDK from '../../package.json';
import type { PeerOptionsAgentOutput } from '@fishjam-cloud/fishjam-openapi';
import type { AudioCodecParameters } from '../agent';

const SDK_NAME = 'fishjam-js-server-sdk';

/**
 * A collection of settings for Google Gemini integration.
 */
export default {
  /**
   * Creates a GoogleGenAI client.
   * This function dynamically imports the "@google/genai" module,
   * so it will only be loaded when this function is called.
   *
   * @param options Configuration for the GoogleGenAI client.
   * @returns A GoogleGenAI instance.
   */
  createClient: (options: GoogleGenAIOptions): GoogleGenAI => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenAI } = require('@google/genai');
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
  },

  /**
   * Predefined audio settings for the agent's output track,
   * configured for Gemini's 24kHz audio output.
   */
  geminiOutputAudioSettings: {
    encoding: 'pcm16',
    channels: 1,
    sampleRate: 24000,
  } as const satisfies AudioCodecParameters,

  /**
   * Predefined audio settings for subscribing to room audio,
   * configured for Gemini's 16kHz audio input.
   */
  geminiInputAudioSettings: {
    audioFormat: 'pcm16',
    audioSampleRate: 16000,
  } as const satisfies PeerOptionsAgentOutput,

  /**
   * The MIME type for the audio data sent to Gemini.
   */
  inputMimeType: 'audio/pcm;rate=16000' as const,
};
