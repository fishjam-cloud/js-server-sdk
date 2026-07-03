# js-server-sdk

Fishjam JavaScript/TypeScript server SDK — a Yarn (Berry, v4) workspace.

## Cursor Cloud specific instructions

Node (via nvm) and Corepack/Yarn are pre-installed; the startup script runs `yarn install`. Non-obvious notes:

- Use Corepack-managed Yarn; if `yarn` is not found, run `corepack enable` and ensure the nvm Node bin is on `PATH`.
- Validated commands: `yarn build`, `yarn typecheck`, `yarn lint:check` (all pass). There is no unit-test script; the SDK is exercised through consuming repos (e.g. `room-manager`).
