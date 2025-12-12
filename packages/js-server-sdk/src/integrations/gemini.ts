import type {
  GoogleGenAI,
  GoogleGenAIOptions,
} from '@google/genai' with { 'resolution-mode': 'import' };
import fishjamSDK from '../../package.json';
import { AudioCodecParameters } from '../agent';

/**
 * A collection of settings for Google Gemini integration.
 */
export default {
  /**
   * Creates a GoogleGenerativeAI client.
   * This function dynamically imports the "@google/genai" module,
   * so it will only be loaded when this function is called.
   *
   * @param options Configuration for the GoogleGenerativeAI client.
   * @returns A promise that resolves to a GoogleGenerativeAI instance.
   */
  createClient: async (options: GoogleGenAIOptions): Promise<GoogleGenAI> => {
    const { GoogleGenAI } = await import('@google/genai');
    const { name, version } = fishjamSDK;
    const trackingHeader = { 'X-Goog-Api-Client': `${name}/${version}` };
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
  agentTrackSettings: {
    channels: 1,
    sampleRate: 24000,
  } as AudioCodecParameters,

  /**
   * Predefined audio settings for subscribing to room audio,
   * configured for Gemini's 16kHz audio input.
   */
  outputAudioSettings: {
    channels: 1,
    sampleRate: 16000,
  } as AudioCodecParameters,

  /**
   * The MIME type for the audio data sent to Gemini.
   */
  inputMimeType: 'audio/L16;rate=16000',
};
