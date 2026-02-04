import { Elysia } from 'elysia';
import { FishjamService } from '../service/fishjam';

export const peerController = (fishjam: FishjamService) =>
  new Elysia().get('/peers', async () => {
    const { peer: _peer, peerToken } = await fishjam.createPeer();
    return { token: peerToken };
  });
