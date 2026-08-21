import { CompositionClient } from '@fishjam-cloud/js-server-sdk';
import type { CompositionConfig, CompositionId, RendererId } from '@fishjam-cloud/js-server-sdk';
import {
  FONT_URL,
  LOGO_RESOLUTION,
  LOGO_URL,
  OUTPUT_RESOLUTION,
  PREVIEW_OUTPUT_ID,
  TEMPLATE_BUNDLE,
} from '../const.ts';
import { LOGO_ID, SCENES, SCENE_EVENT, type Scene } from '../../template/scene.ts';

export class CompositionService {
  private readonly compositions: CompositionClient;
  readonly compositionId: CompositionId;

  private constructor(compositions: CompositionClient, compositionId: CompositionId) {
    this.compositions = compositions;
    this.compositionId = compositionId;
  }

  static async create(config: CompositionConfig): Promise<CompositionService> {
    const compositions = new CompositionClient(config);
    const { compositionId } = await compositions.createComposition();

    return new CompositionService(compositions, compositionId);
  }

  get url() {
    return this.compositions.compositionUrl(this.compositionId);
  }

  async useFishjamAssets() {
    const font = await fetch(FONT_URL);
    await this.compositions.registerFont(this.compositionId, await font.blob());
    await this.compositions.registerImage(this.compositionId, LOGO_ID as RendererId, {
      assetType: 'svg',
      url: LOGO_URL,
      resolution: LOGO_RESOLUTION,
    });
  }

  async showScene(index: number): Promise<Scene> {
    const scene = SCENES[index % SCENES.length];
    await this.compositions.sendEvent(this.compositionId, { eventName: SCENE_EVENT, data: scene });

    return scene;
  }

  async streamTo(endpointUrl: string, bearerToken: string) {
    await this.compositions.registerTemplateOutput(
      this.compositionId,
      PREVIEW_OUTPUT_ID,
      {
        type: 'whip_client',
        endpointUrl,
        bearerToken,
        video: { resolution: OUTPUT_RESOLUTION, initial: { root: { type: 'view' } } },
      },
      TEMPLATE_BUNDLE
    );
  }

  async cleanup() {
    await this.compositions.deleteComposition(this.compositionId);
  }
}
