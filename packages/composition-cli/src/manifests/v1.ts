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
  maxUploadBytes: 1_000_000,
  uploadOverheadReserveBytes: 50_000,
  build: {
    format: 'esm',
    target: 'esnext',
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  scaffoldDevDependencies: {
    '@swmansion/smelter': '0.3.0',
    '@types/react': '^18.3.0',
    react: '^18.3.1',
    typescript: '^5.6.0',
  },
  scaffoldCliVersionDevDependencies: ['@fishjam-cloud/composition', '@fishjam-cloud/composition-cli'],
};
