import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { getManifest } from '../src/manifests';
import { scaffoldTemplate } from '../src/init';

const manifest = getManifest('v1');

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'composition-cli-init-'));
});

describe('scaffoldTemplate', () => {
  it('creates a buildable template project', async () => {
    const target = join(dir, 'my-template');
    await scaffoldTemplate(target, manifest, '1.2.3');

    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('my-template');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.scripts.build).toContain('composition-cli build');
    expect(pkg.devDependencies).toMatchObject(manifest.scaffoldDevDependencies);
    expect(pkg.devDependencies['@fishjam-cloud/composition-cli']).toBe('1.2.3');
    expect(pkg.devDependencies['@fishjam-cloud/composition']).toBe('1.2.3');

    const tsconfig = JSON.parse(await readFile(join(target, 'tsconfig.json'), 'utf8'));
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
    expect(tsconfig.compilerOptions.noEmit).toBe(true);

    const app = await readFile(join(target, 'src', 'App.tsx'), 'utf8');
    expect(app).toContain('export default function App');
    expect(app).toContain("from '@swmansion/smelter'");

    const gitignore = await readFile(join(target, '.gitignore'), 'utf8');
    expect(gitignore).toContain('node_modules');
    expect(gitignore).toContain('dist');
  });

  it('never pins a fishjam package to a hardcoded version', async () => {
    expect(Object.keys(manifest.scaffoldDevDependencies).filter((name) => name.startsWith('@fishjam-cloud/'))).toEqual(
      []
    );
  });

  it('normalizes the directory name into a valid npm package name', async () => {
    const target = join(dir, 'My Template');
    await scaffoldTemplate(target, manifest, '1.2.3');

    const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('my-template');
  });

  it('fails clearly when the target is an existing file', async () => {
    const target = join(dir, 'occupied.txt');
    await writeFile(target, 'a file, not a directory');

    await expect(scaffoldTemplate(target, manifest, '1.2.3')).rejects.toThrow();
    expect(await readFile(target, 'utf8')).toBe('a file, not a directory');
  });

  it('refuses to scaffold into a non-empty directory', async () => {
    const target = join(dir, 'occupied');
    await mkdir(target);
    await writeFile(join(target, 'keep.txt'), 'important');

    await expect(scaffoldTemplate(target, manifest, '1.2.3')).rejects.toThrow(/not empty/);
    expect(await readFile(join(target, 'keep.txt'), 'utf8')).toBe('important');
  });

  it('scaffolds into an existing empty directory', async () => {
    const target = join(dir, 'empty');
    await mkdir(target);

    await scaffoldTemplate(target, manifest, '1.2.3');
    await readFile(join(target, 'package.json'), 'utf8');
  });
});
