import { describe, expect, it } from 'vitest';
import { getManifest } from '../src/manifests';
import { validateBundle } from '../src/validate';

const manifest = getManifest('v1');

const validBundle = `import { useState } from 'react';
import { jsx } from 'react/jsx-runtime';
import { View } from '@swmansion/smelter';
import { usePeers } from '@fishjam-cloud/composition';
function App() {
  const [on] = useState(false);
  usePeers();
  return jsx(View, {});
}
export { App as default };
`;

describe('validateBundle', () => {
  it('accepts a bundle importing only allowed modules', async () => {
    expect(await validateBundle(validBundle, manifest)).toEqual([]);
  });

  it('accepts a dynamic import with a literal allowed specifier', async () => {
    const source = `export default function App() {}\nimport('react');\n`;
    expect(await validateBundle(source, manifest)).toEqual([]);
  });

  it('rejects a relative import', async () => {
    const source = `import { helper } from './helper.js';\nexport default function App() {}\n`;
    const violations = await validateBundle(source, manifest);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('./helper.js');
  });

  it('rejects an absolute import', async () => {
    const source = `import '/etc/passwd';\nexport default function App() {}\n`;
    expect(await validateBundle(source, manifest)).toHaveLength(1);
  });

  it('rejects an unlisted bare import', async () => {
    const source = `import _ from 'lodash';\nexport default function App() {}\n`;
    const violations = await validateBundle(source, manifest);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('lodash');
  });

  it('rejects a deep subpath of an allowed package', async () => {
    const source = `import 'react/cjs/react.development.js';\nexport default function App() {}\n`;
    expect(await validateBundle(source, manifest)).toHaveLength(1);
  });

  it('rejects URL-scheme specifiers', async () => {
    for (const spec of ['npm:react', 'node:fs', 'https://example.com/mod.js', 'data:text/javascript,']) {
      const source = `import '${spec}';\nexport default function App() {}\n`;
      expect(await validateBundle(source, manifest), spec).toHaveLength(1);
    }
  });

  it('rejects import.meta', async () => {
    const source = `export default function App() {\n  return import.meta.url;\n}\n`;
    const violations = await validateBundle(source, manifest);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('import.meta');
  });

  it('rejects a dynamic import with a non-literal specifier', async () => {
    const source = `const name = 'react';\nimport(name);\nexport default function App() {}\n`;
    const violations = await validateBundle(source, manifest);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('dynamic');
  });

  it('rejects source that is not valid JavaScript', async () => {
    const violations = await validateBundle('import { from;;;', manifest);
    expect(violations).toHaveLength(1);
  });

  it('rejects a bundle without a default export', async () => {
    const source = `import { View } from '@swmansion/smelter';\nexport function App() {}\n`;
    const violations = await validateBundle(source, manifest);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('default export');
  });

  it('collects all violations instead of stopping at the first', async () => {
    const source = `import _ from 'lodash';\nimport './helper.js';\nexport function App() {}\n`;
    expect(await validateBundle(source, manifest)).toHaveLength(3);
  });

  it('reports the line of a violation', async () => {
    const source = `import { View } from '@swmansion/smelter';\nimport _ from 'lodash';\nexport default function App() {}\n`;
    const violations = await validateBundle(source, manifest);
    expect(violations[0]).toContain('line 2');
  });
});
