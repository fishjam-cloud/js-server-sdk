import type { Manifest } from './types';
import { v1 } from './v1';

export type { Manifest } from './types';

const manifests: Record<string, Manifest> = { v1 };

export const DEFAULT_TARGET = 'v1';

export function getManifest(target: string): Manifest {
  const manifest = manifests[target];
  if (!manifest) {
    const available = Object.keys(manifests).join(', ');
    throw new Error(`Unknown target "${target}". Available targets: ${available}`);
  }
  return manifest;
}
