import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { build } from 'esbuild';
import type { Manifest } from './manifests';

const DEFAULT_LOAD_TIMEOUT_MS = 5_000;

const stubModule = 'module.exports = new Proxy(function stub() {}, { get: () => () => null });';

const workerEntry = `
import { parentPort } from 'node:worker_threads';
import { isValidElementType } from 'react-is';
import * as template from 'composition-template';
parentPort.postMessage(isValidElementType(template.default));
`;

export async function smokeLoadBundle(
  source: string,
  manifest: Manifest,
  timeoutMs: number = DEFAULT_LOAD_TIMEOUT_MS
): Promise<string[]> {
  const escaped = manifest.allowedImports.map((spec) => spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const allowedFilter = new RegExp(`^(${escaped.join('|')})$`);

  let result;
  try {
    result = await build({
      stdin: {
        contents: workerEntry,
        loader: 'js',
        resolveDir: fileURLToPath(new URL('.', import.meta.url)),
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
      logLevel: 'silent',
      plugins: [
        {
          name: 'smoke-modules',
          setup(builder) {
            builder.onResolve({ filter: /^composition-template$/ }, (args) => ({
              path: args.path,
              namespace: 'template',
            }));
            builder.onLoad({ filter: /.*/, namespace: 'template' }, () => ({
              contents: source,
              loader: 'js',
            }));
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
  return loadInWorker(new URL(`data:text/javascript;base64,${encoded}`), timeoutMs);
}

function loadInWorker(bundleUrl: URL, timeoutMs: number): Promise<string[]> {
  return new Promise((resolve) => {
    const worker = new Worker(bundleUrl);
    const finish = (violations: string[]) => {
      clearTimeout(timer);
      void worker.terminate();
      resolve(violations);
    };
    const timer = setTimeout(() => {
      finish([`bundle did not finish loading within ${timeoutMs}ms; top-level code must not block the event loop`]);
    }, timeoutMs);
    worker.once('message', (isComponent: unknown) => {
      finish(isComponent ? [] : ['default export is not a React component']);
    });
    worker.once('error', (err) => {
      finish([`bundle threw while loading: ${err.message}`]);
    });
    worker.once('exit', () => {
      finish(['bundle exited before the smoke check completed']);
    });
  });
}
