import { Elysia } from 'elysia';
export const peerController = (fishjam) => new Elysia().get('/peers', async () => {
    const { peer: _peer, peerToken } = await fishjam.createPeer();
    return { token: peerToken };
});
