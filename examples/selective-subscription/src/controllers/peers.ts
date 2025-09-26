import { Elysia, t } from 'elysia';
import { FishjamService } from '../service/fishjam';

export const peerController = (fishjam: FishjamService) =>
  new Elysia()
    .get(
      '/peers',
      async () => {
        const { peer, peerToken } = await fishjam.createPeer();
        return { token: peerToken };
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
      '/subscribe_tracks',
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
