import { build } from 'esbuild';
import { isValidElementType } from 'react-is';
import type { Manifest } from './manifests';

const stubModule = 'module.exports = new Proxy(function stub() {}, { get: () => () => null });';

export async function smokeLoadBundle(source: string, manifest: Manifest): Promise<string[]> {
  const escaped = manifest.allowedImports.map((spec) => spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const allowedFilter = new RegExp(`^(${escaped.join('|')})$`);

  let result;
  try {
    result = await build({
      stdin: { contents: source, loader: 'js' },
      bundle: true,
      write: false,
      format: 'esm',
      logLevel: 'silent',
      plugins: [
        {
          name: 'stub-allowed-imports',
          setup(builder) {
            builder.onResolve({ filter: allowedFilter }, (args) => ({
              path: args.path,
              namespace: 'stub',
            }));
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
              contents: stubModule,
              loader: 'js',
            }));
          },
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return [`bundle could not be prepared for loading: ${message}`];
  }

  const encoded = Buffer.from(result.outputFiles[0].contents).toString('base64');
  let mod: { default?: unknown };
  try {
    mod = (await import(`data:text/javascript;base64,${encoded}`)) as { default?: unknown };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return [`bundle threw while loading: ${message}`];
  }

  if (!isValidElementType(mod.default)) {
    return ['default export is not a React component'];
  }
  return [];
}
