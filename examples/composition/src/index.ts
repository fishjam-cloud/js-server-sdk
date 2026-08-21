import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createInterface } from 'node:readline';
import { PORT } from './const.ts';
import { peerController } from './controllers/peers.ts';
import { viewerController } from './controllers/viewers.ts';
import { CompositionService } from './service/composition.ts';
import { FishjamService } from './service/fishjam.ts';

if (!process.env.FISHJAM_ID || !process.env.FISHJAM_TOKEN) {
  throw Error('Environment variables FISHJAM_ID and FISHJAM_TOKEN are required.');
}

const fishjam = await FishjamService.create({
  fishjamId: process.env.FISHJAM_ID,
  managementToken: process.env.FISHJAM_TOKEN,
});

let composition: CompositionService | undefined;

const cleanup = async () => {
  await composition?.cleanup();
  await fishjam.cleanup();
};

try {
  composition = await CompositionService.create({
    managementToken: process.env.FISHJAM_TOKEN,
    compositionUrl: process.env.COMPOSITION_URL,
  });

  const streamer = await fishjam.createStreamerToken();
  await composition.useFishjamAssets();
  await composition.streamTo(fishjam.livestreamWhipUrl(), streamer.token);
  await fishjam.composeRoomInto(composition.url);
} catch (error) {
  console.error('failed to start composing:', error);
  await cleanup();
  process.exit(1);
}

console.log(`composing room ${fishjam.roomId} into livestream ${fishjam.livestreamId}`);
console.log('press Enter to change the scene');

const scenes = createInterface({ input: process.stdin });
let sceneIndex = 0;

scenes.on('line', async () => {
  const { layout, background } = await composition!.showScene(++sceneIndex);
  console.log(`scene: ${layout} on ${background}`);
});

const teardown = () => {
  scenes.close();
  cleanup()
    .then(() => console.log('\ndeleted the composition and its rooms'))
    .catch((error) => console.error('cleanup failed:', error))
    .finally(() => process.exit(0));
};

process.once('SIGINT', teardown);
process.once('SIGTERM', teardown);
scenes.once('SIGINT', teardown);

const app = new Hono().route('/', peerController(fishjam)).route('/', viewerController(fishjam));

serve({ fetch: app.fetch, port: PORT }, ({ port }) => {
  console.log(`peer tokens on http://localhost:${port}/peers, viewer token on http://localhost:${port}/viewer`);
});
