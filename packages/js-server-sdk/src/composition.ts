import {
  Configuration,
  CompositionsApi,
  EventsApi,
  InputsApi,
  OutputsApi,
  RenderersApi,
  type CreateCompositionRequest,
  type ImageSpec,
  type Mp4Input,
  type RegisterInput,
  type RegisterInputResponse,
  type RegisterOutput,
  type SendCompositionEventRequest,
  type UnregisterInput,
  type UnregisterOutput,
  type UnregisterRenderer,
  type RtmpInput,
  type RtmpOutput,
  type UpdateOutputRequest,
  type WhepInput,
  type WhipInput,
  type WhipOutput,
} from '@fishjam-cloud/composition-openapi';
import { UnknownException } from './exceptions';
import { mapException } from './exceptions/mapper';
import type {
  Composition,
  CompositionConfig,
  CompositionId,
  InputId,
  Mp4InputDurations,
  OutputId,
  RendererId,
  WhipInputTarget,
} from './types';
import { getCompositionUrl, toBlob } from './utils';

/**
 * Client class that allows to manage compositions, the real-time video compositing sessions
 * of a Fishjam App. It requires the management token that can be retrieved from the Fishjam
 * Dashboard, the same one used by {@link FishjamClient}.
 *
 * Example usage:
 * ```
 * const compositionClient = new CompositionClient({
 *   managementToken: fastify.config.FISHJAM_MANAGEMENT_TOKEN,
 * });
 * ```
 * @category Client
 */
export class CompositionClient {
  private readonly compositionsApi: CompositionsApi;
  private readonly eventsApi: EventsApi;
  private readonly inputsApi: InputsApi;
  private readonly outputsApi: OutputsApi;
  private readonly renderersApi: RenderersApi;
  private readonly baseUrl: string;

  constructor(config: CompositionConfig) {
    this.baseUrl = getCompositionUrl(config);

    const apiConfig = new Configuration({
      basePath: this.baseUrl,
      headers: { Authorization: `Bearer ${config.managementToken}` },
    });

    this.compositionsApi = new CompositionsApi(apiConfig);
    this.eventsApi = new EventsApi(apiConfig);
    this.inputsApi = new InputsApi(apiConfig);
    this.outputsApi = new OutputsApi(apiConfig);
    this.renderersApi = new RenderersApi(apiConfig);
  }

  /**
   * Create a new composition. Inputs registered on it are composed into the scenes its outputs render.
   */
  async createComposition(config: CreateCompositionRequest = {}): Promise<Composition> {
    try {
      return (await this.compositionsApi.createComposition({ createCompositionRequest: config })) as Composition;
    } catch (error) {
      throw await mapException(error);
    }
  }

  /**
   * The address of a composition, as other services refer to it. Fishjam needs it to forward a
   * room's tracks with {@link FishjamClient.forwardRoomTracks}.
   */
  compositionUrl(compositionId: CompositionId): string {
    return new URL(`/api/composition/${compositionId}`, this.baseUrl).href;
  }

  /**
   * Start a composition created with `autostart` disabled. Its outputs begin producing audio and video.
   */
  async startComposition(compositionId: CompositionId): Promise<void> {
    try {
      await this.compositionsApi.start({ compositionId });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Reset a composition, tearing down its scene while keeping the composition itself alive.
   */
  async resetComposition(compositionId: CompositionId): Promise<void> {
    try {
      await this.compositionsApi.reset({ compositionId });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Delete an existing composition. Its inputs and outputs are torn down with it.
   */
  async deleteComposition(compositionId: CompositionId): Promise<void> {
    try {
      await this.compositionsApi.deleteComposition({ compositionId });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Register a media source on a composition. Prefer the variant methods, such as
   * {@link CompositionClient.registerWhipInput}, which return what that input type produces.
   */
  async registerInput(
    compositionId: CompositionId,
    inputId: InputId,
    input: RegisterInput
  ): Promise<RegisterInputResponse> {
    try {
      return await this.inputsApi.registerInput({ compositionId, inputId, registerInput: input });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Register an input that a WHIP publisher pushes media into.
   * @returns the address and token to publish with, see {@link WhipInputTarget}
   */
  async registerWhipInput(
    compositionId: CompositionId,
    inputId: InputId,
    options: Omit<WhipInput, 'type'> = {}
  ): Promise<WhipInputTarget> {
    const { bearerToken, endpointRoute } = await this.registerInput(compositionId, inputId, {
      ...options,
      type: 'whip_server',
    });

    const token = bearerToken ?? options.bearerToken;
    if (!token) {
      throw new UnknownException({
        message: `Registering WHIP input "${inputId}" returned no bearer token, so it cannot be published to`,
      });
    }

    const route = endpointRoute ?? `/whip/${encodeURIComponent(inputId)}`;
    return { url: `${this.compositionUrl(compositionId)}${route}`, bearerToken: token };
  }

  /**
   * Register an input that pulls media from a WHEP endpoint.
   */
  async registerWhepInput(
    compositionId: CompositionId,
    inputId: InputId,
    options: Omit<WhepInput, 'type'>
  ): Promise<void> {
    await this.registerInput(compositionId, inputId, { ...options, type: 'whep_client' });
  }

  /**
   * Register an input that plays an MP4 file.
   * @returns how much media the file holds, see {@link Mp4InputDurations}
   */
  async registerMp4Input(
    compositionId: CompositionId,
    inputId: InputId,
    options: Omit<Mp4Input, 'type'>
  ): Promise<Mp4InputDurations> {
    const { videoDurationMs, audioDurationMs } = await this.registerInput(compositionId, inputId, {
      ...options,
      type: 'mp4',
    });

    return { videoDurationMs: videoDurationMs ?? undefined, audioDurationMs: audioDurationMs ?? undefined };
  }

  /**
   * Register an input that an RTMP publisher pushes media into. The stream key identifies the
   * input; the address to publish to belongs to the composition, not to this call.
   */
  async registerRtmpInput(
    compositionId: CompositionId,
    inputId: InputId,
    options: Omit<RtmpInput, 'type'>
  ): Promise<void> {
    await this.registerInput(compositionId, inputId, { ...options, type: 'rtmp_server' });
  }

  /**
   * Unregister an input. Scenes referencing it stop receiving its media.
   */
  async unregisterInput(compositionId: CompositionId, inputId: InputId, options: UnregisterInput = {}): Promise<void> {
    try {
      await this.inputsApi.unregisterInput({ compositionId, inputId, unregisterInput: options });
    } catch (error) {
      throw await mapException(error, 'input');
    }
  }

  /**
   * Register an output, the destination the composed result is sent to, carrying the scene to render.
   */
  async registerOutput(compositionId: CompositionId, outputId: OutputId, output: RegisterOutput): Promise<void> {
    try {
      await this.outputsApi.registerOutput({ compositionId, outputId, registerOutput: output });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Register an output rendering a template bundle, as built by `@fishjam-cloud/composition-cli`.
   * The bundle is either a `Blob` or a path to read it from; never pass a path taken from
   * untrusted input, since its contents are uploaded.
   */
  async registerTemplateOutput(
    compositionId: CompositionId,
    outputId: OutputId,
    config: RegisterOutput,
    template: Blob | string
  ): Promise<void> {
    try {
      await this.outputsApi.registerTemplateOutput({
        compositionId,
        outputId,
        config,
        template: await toBlob(template),
      });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Register an output sending the composed result to a WHIP endpoint.
   */
  async registerWhipOutput(
    compositionId: CompositionId,
    outputId: OutputId,
    options: Omit<WhipOutput, 'type'>
  ): Promise<void> {
    await this.registerOutput(compositionId, outputId, { ...options, type: 'whip_client' });
  }

  /**
   * Register an output sending the composed result to an RTMP endpoint.
   */
  async registerRtmpOutput(
    compositionId: CompositionId,
    outputId: OutputId,
    options: Omit<RtmpOutput, 'type'>
  ): Promise<void> {
    await this.registerOutput(compositionId, outputId, { ...options, type: 'rtmp_client' });
  }

  /**
   * Unregister an output. It stops producing audio and video.
   */
  async unregisterOutput(
    compositionId: CompositionId,
    outputId: OutputId,
    options: UnregisterOutput = {}
  ): Promise<void> {
    try {
      await this.outputsApi.unregisterOutput({ compositionId, outputId, unregisterOutput: options });
    } catch (error) {
      throw await mapException(error, 'output');
    }
  }

  /**
   * Replace the scene an output renders.
   */
  async updateOutput(compositionId: CompositionId, outputId: OutputId, update: UpdateOutputRequest): Promise<void> {
    try {
      await this.outputsApi.updateOutput({ compositionId, outputId, updateOutputRequest: update });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Ask an output to emit a keyframe, so a viewer joining mid-stream renders a full picture sooner.
   */
  async requestKeyframe(compositionId: CompositionId, outputId: OutputId): Promise<void> {
    try {
      await this.outputsApi.requestKeyframe({ compositionId, outputId });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Register an image that scenes can reference by its renderer ID.
   */
  async registerImage(compositionId: CompositionId, imageId: RendererId, image: ImageSpec): Promise<void> {
    try {
      await this.renderersApi.registerImage({ compositionId, imageId, imageSpec: image });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Register a font that scenes can render text with. The font is either a `Blob` or a path
   * to read it from; never pass a path taken from untrusted input, since its contents are uploaded.
   */
  async registerFont(compositionId: CompositionId, font: Blob | string): Promise<void> {
    try {
      await this.renderersApi.registerFont({ compositionId, font: await toBlob(font) });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }

  /**
   * Unregister a previously registered image.
   */
  async unregisterImage(
    compositionId: CompositionId,
    imageId: RendererId,
    options: UnregisterRenderer = {}
  ): Promise<void> {
    try {
      await this.renderersApi.unregisterImage({ compositionId, imageId, unregisterRenderer: options });
    } catch (error) {
      throw await mapException(error, 'renderer');
    }
  }

  /**
   * Deliver an event to the templates rendered by the composition's outputs.
   */
  async sendEvent(compositionId: CompositionId, event: SendCompositionEventRequest): Promise<void> {
    try {
      await this.eventsApi.sendCompositionEvent({ compositionId, sendCompositionEventRequest: event });
    } catch (error) {
      throw await mapException(error, 'composition');
    }
  }
}
