<img src="../../.github/images/fishjam-card.png" width="100%">

# @fishjam-cloud/composition

React hooks and an event bus for building **Fishjam composition templates** — server-side
[Smelter](https://smelter.dev) scenes that mix the tracks forwarded from a Fishjam room into a single
composed output stream (for broadcasting, recording, HLS, etc.).

A template is a plain React component. It uses [`@swmansion/smelter`](https://smelter.dev) components for
layout (`View`, `Tiles`, `InputStream`, …) and the hooks from this package to read the live state of the
linked room. Fishjam forwards each room track to the composition as a Smelter input; this package keeps a
store of that room state up to date and re-renders your template as peers, tracks and voice-activity change.

## Installation

Templates are normally scaffolded with the companion CLI `@fishjam-cloud/composition-cli`, which wires up
this package, `@swmansion/smelter` and React for you:

```bash
npx @fishjam-cloud/composition-cli init my-template
cd my-template
npm install
```

To add it to an existing template project:

```bash
npm install @fishjam-cloud/composition @swmansion/smelter react
```

`react` (>= 18) is a peer dependency.

## A minimal template

A template must **default-export a React component**. Compose the forwarded inputs with Smelter components
and drive the layout from the room state returned by the hooks:

```tsx
import { InputStream, Tiles, Text, View } from '@swmansion/smelter';
import { usePeers } from '@fishjam-cloud/composition';

export default function App() {
  const peers = usePeers();

  if (peers.length === 0) {
    return (
      <View style={{ backgroundColor: '#0b1020ff' }}>
        <Text style={{ fontSize: 48, color: '#ffffff' }}>Waiting for participants…</Text>
      </View>
    );
  }

  return (
    <Tiles style={{ backgroundColor: '#0b1020ff' }}>
      {peers
        .filter((peer) => peer.cameraStream)
        .map((peer) => (
          <InputStream key={peer.id} inputId={peer.cameraStream!.inputId} />
        ))}
    </Tiles>
  );
}
```

The `inputId` on a stream is the handle you pass to Smelter's `<InputStream inputId={…} />` — it identifies
the forwarded track inside the composition.

## Reacting to peers and events

The store is fed by the composition host from the room's Fishjam notifications (peers connecting and
disconnecting, tracks being forwarded or removed, metadata and voice-activity updates). The hooks read it
through React's `useSyncExternalStore`, so your template re-renders automatically whenever the room changes —
you never subscribe to raw events yourself.

### Hooks

- **`usePeers<PeerMetadata, ServerMetadata>(): PeerWithStreams[]`** — every peer in the linked room. The
  composition worker is not a peer, so this is a flat list.
- **`usePeer(peerId): PeerWithStreams | undefined`** — a single peer by id.
- **`useRoom(): { id: string } | undefined`** — the linked room's id, or `undefined` before a room is linked.
- **`useSpeakingState(peerId): 'speech' | 'silence'`** — voice-activity for a peer, useful for
  active-speaker layouts and highlighting.

Each `PeerWithStreams` splits a peer's forwarded inputs by role so you don't have to inspect track metadata
yourself:

```tsx
peer.cameraStream;      // camera video + microphone audio (Stream | undefined)
peer.screenShareStream; // screen-share video/audio (Stream | undefined)
peer.customStreams;     // any other forwarded streams (Stream[])
peer.streams;           // all of the above, flat (Stream[])
peer.metadata;          // { peer: PeerMetadata; server: ServerMetadata }
```

A `Stream` carries at most one `video` and one `audio` track (`{ inputId, video?, audio? }`); each track
exposes a `paused` flag mirroring its mute state, plus its `metadata`. Pass the metadata generics to
`usePeers`/`usePeer` to type `peer.metadata` for your app.

An active-speaker example:

```tsx
import { InputStream, View } from '@swmansion/smelter';
import { useSpeakingState } from '@fishjam-cloud/composition';

function Tile({ peerId, inputId }: { peerId: string; inputId: string }) {
  const speaking = useSpeakingState(peerId) === 'speech';
  return (
    <View style={{ borderWidth: speaking ? 4 : 0, borderColor: '#22c55e' }}>
      <InputStream inputId={inputId} />
    </View>
  );
}
```

### Custom events

Beyond room state, the host can push application-defined events into the running composition. Subscribe with
the global `eventBus`; `on` returns an unsubscribe function:

```tsx
import { eventBus } from '@fishjam-cloud/composition';

const off = eventBus.on<{ layout: string }>('setLayout', (data) => {
  // react to a custom event, e.g. switch layouts
});
```

### Host integration (`./core`)

The `@fishjam-cloud/composition/core` entry point exposes `compositionStore` and the `CompositionStoreFeed`
interface (`seedFromRoom`, `applyNotification`, `reset`). This is the surface the **composition host** uses to
feed the store from `FishjamWSNotifier` events — template authors do not need it.

## Building and bundling

Templates are bundled with `@fishjam-cloud/composition-cli`:

```bash
npm run build   # runs `composition-cli build`
```

The CLI bundles your entry (default `src/App.tsx`) with esbuild into a single ESM file at `dist/App.js` and
validates it against the platform contract:

- the bundle must **default-export a React component**;
- only these imports are allowed: `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`,
  `@swmansion/smelter`, `@fishjam-cloud/composition` (they are provided by the runtime, so they stay external
  and out of your bundle);
- no `import.meta` or dynamic imports with a non-literal specifier;
- the bundle must load without blocking the event loop, and stay under the upload size limit.

Upload the built `dist/App.js` as the `template` field when registering a composition output. See
`@fishjam-cloud/composition-cli` for the full CLI reference.

## How it connects to Fishjam

The bundled template runs inside a server-side Smelter worker (the composition host). When a composition
output is registered for a room, Fishjam forwards the room's tracks to that worker as Smelter inputs and
streams the room's notifications to it. The host seeds and updates `compositionStore` from those
notifications, your template reads the state through the hooks and lays the inputs out with Smelter
components, and Smelter renders the result into a single composed output stream.

## License

Licensed under the [Apache-2.0](./LICENSE) license.

## Fishjam is created by Software Mansion

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with experience in building web and mobile apps. We are Core React Native Contributors and experts in dealing with all kinds of React Native issues. We can help you build your next dream product – [Hire us](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=js-server-readme).

[![Software Mansion](https://logo.swmansion.com/logo?color=white&variant=desktop&width=200&tag=react-client)](https://swmansion.com/contact/projects?utm_source=fishjam&utm_medium=js-server-readme)
