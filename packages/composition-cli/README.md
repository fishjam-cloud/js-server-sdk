# @fishjam-cloud/composition-cli

CLI for building [Fishjam](https://fishjam.io) composition template bundles.

A composition template is a React component that defines a video composition layout. The platform runs it server-side and keeps the composition output in sync with the component for the lifetime of the output. This CLI scaffolds template projects and compiles them into the single-file bundle the platform accepts, validating the result locally so upload errors are caught at build time.

## Usage

Scaffold a new template project:

```bash
npx @fishjam-cloud/composition-cli init my-template
cd my-template
npm install
```

Build the template into an uploadable bundle:

```bash
npm run build
```

This compiles `src/App.tsx` into `dist/App.js` and validates it against the platform contract. Upload the bundle as the `template` field when registering a composition output.

## Commands

### `composition-cli init <dir>`

Creates a template project: `package.json` with the supported dependency versions, `tsconfig.json`, and a hello-world `src/App.tsx`.

### `composition-cli build [entry]`

Bundles the template (default entry `src/App.tsx`) and validates the output.

| Option               | Default       | Description                            |
| -------------------- | ------------- | -------------------------------------- |
| `-o, --out <file>`   | `dist/App.js` | Output bundle path                     |
| `--target <version>` | `v1`          | Platform template version to build for |

The build fails (and writes no output) if the bundle violates the platform contract:

- Only these imports may remain external: `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `@swmansion/smelter`, `@fishjam-cloud/composition`. Everything else is bundled in.
- No `import.meta` and no dynamic imports with non-literal specifiers.
- The default export must be a React component.
- The bundle must fit within the platform upload limit, including headroom for request overhead.

The build also loads the bundle once (with platform-provided packages stubbed out) to verify it evaluates cleanly — module-level code in your template runs during this check.

## Writing templates

Templates default-export a React component built from [`@swmansion/smelter`](https://smelter.dev) components. Room state and events are available through [`@fishjam-cloud/composition`](https://www.npmjs.com/package/@fishjam-cloud/composition) hooks:

```tsx
import { InputStream, Rescaler, Tiles } from '@swmansion/smelter';
import { usePeers } from '@fishjam-cloud/composition';

export default function App() {
  const peers = usePeers();
  return (
    <Tiles>
      {peers.flatMap((peer) =>
        peer.cameraStream ? (
          <Rescaler key={peer.cameraStream.inputId}>
            <InputStream inputId={peer.cameraStream.inputId} />
          </Rescaler>
        ) : (
          []
        )
      )}
    </Tiles>
  );
}
```

## License

Licensed under the [Apache License, Version 2.0](./LICENSE).
