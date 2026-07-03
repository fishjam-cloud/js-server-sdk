import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { build } from 'esbuild';
import type { Manifest } from './manifests';
import { validateBundle } from './validate';

export class ValidationError extends Error {
  readonly violations: string[];

  constructor(violations: string[]) {
    super(violations.join('\n'));
    this.name = 'ValidationError';
    this.violations = violations;
  }
}

export async function buildTemplate(entry: string, outfile: string, manifest: Manifest): Promise<{ bytes: number }> {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: manifest.build.format,
    target: manifest.build.target,
    jsx: manifest.build.jsx,
    jsxImportSource: manifest.build.jsxImportSource,
    external: [...manifest.allowedImports],
    logLevel: 'warning',
  });

  const bundle = result.outputFiles[0];
  const violations = await validateBundle(bundle.text, manifest);

  const bytes = bundle.contents.byteLength;
  if (bytes > manifest.maxBundleBytes) {
    violations.push(`bundle is ${bytes} bytes, which exceeds the ${manifest.maxBundleBytes} byte upload limit`);
  }

  if (violations.length > 0) {
    throw new ValidationError(violations);
  }

  await mkdir(dirname(outfile), { recursive: true });
  await writeFile(outfile, bundle.contents);
  return { bytes };
}
