import { Elysia } from 'elysia';
import { peerController } from './controllers/peers';
import { FishjamService } from './service/fishjam';
import { TranscriptionService } from './service/transcription';

if (!(process.env.FISHJAM_ID || process.env.FISHJAM_URL) || !process.env.FISHJAM_TOKEN || !process.env.GEMINI_API_KEY) {
  throw Error('Environment variables FISHJAM_ID, FISHJAM_TOKEN and GEMINI_API_KEY are required.');
}

const fishjamConfig = {
  fishjamUrl: process.env.FISHJAM_URL,
  fishjamId: process.env.FISHJAM_ID,
  managementToken: process.env.FISHJAM_TOKEN,
};

const fishjam = new FishjamService(fishjamConfig);

new TranscriptionService(fishjamConfig, process.env.GEMINI_API_KEY);

const app = new Elysia().use(peerController(fishjam)).listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
