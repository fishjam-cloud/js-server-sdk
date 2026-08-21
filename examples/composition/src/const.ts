import type { OutputId, RendererId } from '@fishjam-cloud/js-server-sdk';

export const PORT = 3000;

export const PREVIEW_OUTPUT_ID = 'preview' as OutputId;

export const FONT_ID = 'inter' as RendererId;

export const FONT_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf';

export const LOGO_URL = 'https://fishjam.swmansion.com/favicon.svg';

export const LOGO_RESOLUTION = { width: 200, height: 200 };

export const OUTPUT_RESOLUTION = { width: 1280, height: 720 };

export const TEMPLATE_BUNDLE = new URL('../dist/template.js', import.meta.url).pathname;
