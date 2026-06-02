import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { peerController } from './controllers/peers';
import { notificationsController } from './controllers/notifications';
import { FishjamService } from './service/fishjam';

const fishjam = await FishjamService.create({
  fishjamId: process.env.FISHJAM_ID!,
  managementToken: process.env.FISHJAM_TOKEN!,
});

new Elysia()
  .use(cors())
  .use(peerController(fishjam))
  .use(notificationsController(fishjam))
  .listen({ port: 3000, idleTimeout: 60 });

console.log('🦊 Elysia is running at localhost:3000');
