import { Elysia } from 'elysia';
import { peerController } from './controllers/peer';
import { FishjamService } from './fishjam';

if (!(process.env.FISHJAM_ID || process.env.FISHJAM_URL) || !process.env.FISHJAM_TOKEN) {
  throw Error('Environment variables FISHJAM_ID, FISHJAM_TOKEN are required.');
}

const fishjamConfig = {
  fishjamUrl: process.env.FISHJAM_URL,
  fishjamId: process.env.FISHJAM_ID,
  managementToken: process.env.FISHJAM_TOKEN,
};

const fishjam = new FishjamService(fishjamConfig);

const app = new Elysia().use(peerController(fishjam)).listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
