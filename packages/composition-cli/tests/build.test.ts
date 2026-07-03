import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationError, buildTemplate } from '../src/build';
import { getManifest } from '../src/manifests';
import { validateBundle } from '../src/validate';

const manifest = getManifest('v1');

const appTsx = `import { Text, View } from '@swmansion/smelter';
import { formatTitle } from './title';

export default function App() {
  return (
    <View>
      <Text style={{ fontSize: 40 }}>{formatTitle('hello')}</Text>
    </View>
  );
}
`;

const titleTs = `export function formatTitle(name: string): string {
  return name.toUpperCase();
}
`;

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'composition-cli-test-'));
  await mkdir(join(dir, 'src'));
  await writeFile(join(dir, 'src', 'App.tsx'), appTsx);
  await writeFile(join(dir, 'src', 'title.ts'), titleTs);
});

describe('buildTemplate', () => {
  it('produces a single valid ESM bundle with relative imports inlined', async () => {
    const outfile = join(dir, 'dist', 'App.js');
    const { bytes } = await buildTemplate(join(dir, 'src', 'App.tsx'), outfile, manifest);

    const output = await readFile(outfile, 'utf8');
    expect(bytes).toBeGreaterThan(0);
    expect(output).toContain('toUpperCase');
    expect(output).not.toContain('./title');
    expect(await validateBundle(output, manifest)).toEqual([]);
  });

  it('keeps allowed imports external instead of inlining them', async () => {
    const outfile = join(dir, 'dist', 'App.js');
    await buildTemplate(join(dir, 'src', 'App.tsx'), outfile, manifest);

    const output = await readFile(outfile, 'utf8');
    expect(output).toMatch(/from\s+["']@swmansion\/smelter["']/);
    expect(output).toMatch(/from\s+["']react\/jsx-runtime["']/);
  });

  it('rejects a bundle that ends up containing import.meta', async () => {
    await writeFile(
      join(dir, 'src', 'App.tsx'),
      `export default function App() {\n  return <>{import.meta.url}</>;\n}\n`
    );

    await expect(buildTemplate(join(dir, 'src', 'App.tsx'), join(dir, 'dist', 'App.js'), manifest)).rejects.toThrow(
      ValidationError
    );
  });

  it('rejects a bundle exceeding the size limit', async () => {
    const tinyManifest = { ...manifest, maxBundleBytes: 16 };

    await expect(buildTemplate(join(dir, 'src', 'App.tsx'), join(dir, 'dist', 'App.js'), tinyManifest)).rejects.toThrow(
      /16/
    );
  });

  it('does not write the outfile when validation fails', async () => {
    const tinyManifest = { ...manifest, maxBundleBytes: 16 };
    const outfile = join(dir, 'dist', 'App.js');

    await expect(buildTemplate(join(dir, 'src', 'App.tsx'), outfile, tinyManifest)).rejects.toThrow();
    await expect(readFile(outfile, 'utf8')).rejects.toThrow();
  });
});
