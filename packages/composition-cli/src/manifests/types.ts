export interface Manifest {
  version: string;
  allowedImports: string[];
  maxBundleBytes: number;
  build: {
    format: 'esm';
    target: string;
    jsx: 'automatic';
    jsxImportSource: string;
  };
  scaffoldDevDependencies: Record<string, string>;
}
