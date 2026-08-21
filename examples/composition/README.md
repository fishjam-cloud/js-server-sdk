# Compositions with Fishjam

This example composes everyone in a Fishjam room into a single video and streams it to livestream viewers.
Peers join a room, their tracks are forwarded into a composition, and a template you can edit decides how
they are laid out.

## Development

To start the server you must first copy `.env.example` to `.env`.

Then you need to set the following variables:

- `FISHJAM_ID`: your Fishjam ID, which you can get at <https://fishjam.io>
- `FISHJAM_TOKEN`: your Fishjam management token, which you can get at <https://fishjam.io>
- `COMPOSITION_URL`: only when running against a deployment other than production

Once you've set up your environment variables, all you need to do is run the following command:

```bash
yarn dev
```

This bundles `template/App.tsx`, creates the room, the livestream and the composition, and then serves peer
and viewer tokens. Requires Node 23 or newer, which runs the TypeScript sources directly.

When the server is running, you can obtain peer tokens by going to <http://localhost:3000/peers>, and a
livestream viewer token from <http://localhost:3000/viewer>.

Connect peers with the [fishjam minimal-react example](https://github.com/fishjam-cloud/web-client-sdk/tree/main/examples/react-client)
and watch the composed result with a livestream viewer. Press Ctrl+C to delete the composition and its rooms.

Press Enter in the terminal to cycle the scene, which sends an event the template reacts to.

## Editing the template

`template/App.tsx` is a regular React component rendered by Smelter, using every hook the composition
package offers: `usePeers` lays out whoever is connected, `usePeer` resolves the spotlighted one,
`useSpeakingState` outlines whoever is talking, `useRoom` tells the template the room is linked, and
`eventBus` receives the scene events. Colours come from the Fishjam palette and the text is set in Inter,
uploaded at startup with `registerFont`.

Change it, restart `yarn dev`, and the new bundle is uploaded with the output.
