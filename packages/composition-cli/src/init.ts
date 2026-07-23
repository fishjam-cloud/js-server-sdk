import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Manifest } from './manifests';

const scaffoldTsconfig = {
  compilerOptions: {
    target: 'ESNext',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    jsx: 'react-jsx',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
  },
  include: ['src'],
};

const scaffoldApp = `import { Text, View } from '@swmansion/smelter';

export default function App() {
  return (
    <View style={{ backgroundColor: '#0b1020ff' }}>
      <Text style={{ fontSize: 64, color: '#ffffff' }}>Hello from composition-cli</Text>
    </View>
  );
}
`;

const scaffoldGitignore = `node_modules/
dist/
`;

export async function scaffoldTemplate(dir: string, manifest: Manifest, cliVersion: string): Promise<string[]> {
  await ensureEmpty(dir);

  const pkg = {
    name: packageNameFrom(dir),
    version: '0.0.1',
    private: true,
    type: 'module',
    scripts: {
      build: 'composition-cli build',
      typecheck: 'tsc --noEmit',
    },
    devDependencies: sortKeys({
      ...manifest.scaffoldDevDependencies,
      '@fishjam-cloud/composition-cli': cliVersion,
    }),
  };

  const files: Array<[string, string]> = [
    ['package.json', `${JSON.stringify(pkg, null, 2)}\n`],
    ['tsconfig.json', `${JSON.stringify(scaffoldTsconfig, null, 2)}\n`],
    ['.gitignore', scaffoldGitignore],
    [join('src', 'App.tsx'), scaffoldApp],
  ];

  await mkdir(join(dir, 'src'), { recursive: true });
  for (const [name, content] of files) {
    await writeFile(join(dir, name), content);
  }
  return files.map(([name]) => join(dir, name));
}

async function ensureEmpty(dir: string): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw err;
  }
  if (entries.length > 0) {
    throw new Error(`directory ${dir} is not empty`);
  }
}

function packageNameFrom(dir: string): string {
  const name = basename(dir)
    .toLowerCase()
    .replace(/[^a-z0-9-._~]/g, '-')
    .replace(/^[-._]+/, '');
  return name.length > 0 ? name : 'composition-template';
}

function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}
