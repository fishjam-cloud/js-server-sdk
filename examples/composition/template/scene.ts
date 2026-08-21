export type Scene = {
  layout: 'tiles' | 'speaker' | 'pip';
  background: string;
  heading: string;
};

const CREAM = '#FCF6E7FF';
const CORAL = '#ED716DFF';
const BLUE = '#38B5DCFF';

export const SCENES: Scene[] = [
  { layout: 'tiles', background: CREAM, heading: CORAL },
  { layout: 'pip', background: CREAM, heading: CORAL },
  { layout: 'speaker', background: CREAM, heading: CORAL },
];

export const TICKER_TEXT = 'COMPOSITION DEMO   ///   press Enter to change the scene   ///';

export const SPEAKING_COLOR = BLUE;
export const SHADOW_COLOR = '#00000026';
export const FONT_FAMILY = 'Inter';
export const LOGO_ID = 'fish';
export const SCENE_EVENT = 'SCENE';
