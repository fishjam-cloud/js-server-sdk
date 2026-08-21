import { Hono } from 'hono';
import type { FishjamService } from '../service/fishjam.ts';

export const peerController = (fishjam: FishjamService) =>
  new Hono().get('/peers', async (c) => {
    const { peerToken } = await fishjam.createPeer();
    return c.json({ token: peerToken, fishjamId: process.env.FISHJAM_ID });
  });
