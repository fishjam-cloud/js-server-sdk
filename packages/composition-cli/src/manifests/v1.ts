import type { Manifest } from './types';

export const v1: Manifest = {
  version: 'v1',
  allowedImports: [
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    '@swmansion/smelter',
    '@fishjam-cloud/composition',
  ],
  maxBundleBytes: 1_000_000,
  build: {
    format: 'esm',
    target: 'esnext',
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  scaffoldDevDependencies: {
    '@fishjam-cloud/composition': '0.29.0-rc.2',
    '@swmansion/smelter': '0.3.0',
    '@types/react': '^18.3.0',
    react: '^18.3.1',
    typescript: '^5.6.0',
  },
};
