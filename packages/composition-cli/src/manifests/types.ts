export interface Manifest {
  version: string;
  allowedImports: string[];
  maxUploadBytes: number;
  build: {
    format: 'esm';
    target: string;
    jsx: 'automatic';
    jsxImportSource: string;
  };
  scaffoldDevDependencies: Record<string, string>;
}
