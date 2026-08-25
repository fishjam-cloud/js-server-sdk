import { Hono } from 'hono';
import type { FishjamService } from '../service/fishjam.ts';

export const viewerController = (fishjam: FishjamService) =>
  new Hono().get('/viewer', async (c) => {
    const { token } = await fishjam.createViewerToken();
    return c.json({ token, fishjamId: process.env.FISHJAM_ID });
  });
