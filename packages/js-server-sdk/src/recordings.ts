import {
  RecordingsApi,
  RecordingConfigToJSON,
  RecordingDetailsResponseFromJSON,
  type RecordingConfig,
  type RecordingDetailsResponse,
} from '@fishjam-cloud/fishjam-openapi';

/**
 * Adds the one recording call the generated client does not cover: creating a recording from a
 * template bundle, which is sent as `multipart/form-data` with the config and the bundle as parts.
 */
export class RecordingsApiWithTemplates extends RecordingsApi {
  async createTemplateRecording(config: RecordingConfig, template: Blob): Promise<RecordingDetailsResponse> {
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify(RecordingConfigToJSON(config))], { type: 'application/json' }));
    body.append('template', template);

    const response = await this.request({ path: '/recordings', method: 'POST', headers: {}, body });

    return RecordingDetailsResponseFromJSON(await response.json());
  }
}
