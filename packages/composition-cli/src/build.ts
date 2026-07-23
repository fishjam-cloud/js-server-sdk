import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { build, formatMessages } from 'esbuild';
import type { Manifest } from './manifests';
import { smokeLoadBundle } from './smoke';
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
    outfile,
    logLevel: 'silent',
  });

  if (result.warnings.length > 0) {
    const formatted = await formatMessages(result.warnings, { kind: 'warning', color: true });
    console.error(formatted.join(''));
  }

  if (result.outputFiles.length !== 1) {
    const names = result.outputFiles.map((file) => basename(file.path)).join(', ');
    throw new ValidationError([
      `build emitted ${result.outputFiles.length} output files (${names}); templates must produce a single JS bundle`,
    ]);
  }

  const bundle = result.outputFiles[0];
  const violations = await validateBundle(bundle.text, manifest);

  const bytes = bundle.contents.byteLength;
  const maxBundleBytes = Math.max(0, manifest.maxUploadBytes - manifest.uploadOverheadReserveBytes);
  if (bytes > maxBundleBytes) {
    violations.push(
      `bundle is ${bytes} bytes; the upload limit is ${manifest.maxUploadBytes} bytes and ${manifest.uploadOverheadReserveBytes} bytes are reserved for registration config and multipart overhead, so bundles must stay under ${maxBundleBytes} bytes`
    );
  }

  if (violations.length === 0) {
    violations.push(...(await smokeLoadBundle(bundle.text, manifest)));
  }

  if (violations.length > 0) {
    throw new ValidationError(violations);
  }

  await mkdir(dirname(outfile), { recursive: true });
  await writeFile(outfile, bundle.contents);
  return { bytes };
}
