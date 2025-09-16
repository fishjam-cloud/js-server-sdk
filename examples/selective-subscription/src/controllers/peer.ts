import { Elysia, t } from 'elysia';
import { FishjamService } from '../fishjam';

export const peerController = (fishjam: FishjamService) =>
  new Elysia()
    .post(
      '/peers',
      async () => {
        const { peer, peerToken } = await fishjam.createPeer();
        return { peerId: peer.id, peerToken };
      },
    )
    .post(
      '/subscribe_peer',
      async ({ query: { subId, prodId } }) => {
        await fishjam.subscribePeer(subId, prodId);
        return { status: 'ok' };
      },
      {
        query: t.Object({
          subId: t.String(),
          prodId: t.String(),
        }),
      },
    )
    .post(
      '/subscribe-tracks',
      async ({ query: { subId, tracks } }) => {
        await fishjam.subscribeTracks(subId, tracks.split(','));
        return { status: 'ok' };
      },
      {
        query: t.Object({
          subId: t.String(),
          tracks: t.String(),
        }),
      },
    );
