import { Elysia } from 'elysia';
import { peerController } from './controllers/peers';
import { FishjamService } from './service/fishjam';
import { MultimodalService } from './service/multimodal';

if (!process.env.FISHJAM_ID || !process.env.FISHJAM_TOKEN || !process.env.GEMINI_API_KEY) {
  throw Error('Environment variables FISHJAM_ID, FISHJAM_TOKEN and GEMINI_API_KEY are required.');
}

const fishjamConfig = {
  fishjamId: process.env.FISHJAM_ID,
  managementToken: process.env.FISHJAM_TOKEN,
};

const fishjam = new FishjamService(fishjamConfig);

new MultimodalService(fishjamConfig, process.env.GEMINI_API_KEY);

const app = new Elysia().use(peerController(fishjam)).listen(3000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
