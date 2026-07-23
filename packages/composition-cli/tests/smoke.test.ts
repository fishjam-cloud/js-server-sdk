import { describe, expect, it } from 'vitest';
import { getManifest } from '../src/manifests';
import { smokeLoadBundle } from '../src/smoke';

const manifest = getManifest('v1');

describe('smokeLoadBundle', () => {
  it('accepts a bundle whose default export is a component', async () => {
    const source = `export default function App() {\n  return null;\n}\n`;

    expect(await smokeLoadBundle(source, manifest)).toEqual([]);
  });

  it('terminates a bundle that blocks the event loop at top level', async () => {
    const source = `while (true) {}\nexport default function App() {\n  return null;\n}\n`;

    const violations = await smokeLoadBundle(source, manifest, 1_000);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/did not finish loading/);
  });
});
