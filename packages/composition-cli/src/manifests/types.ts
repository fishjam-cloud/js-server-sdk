export interface Manifest {
  version: string;
  allowedImports: string[];
  maxUploadBytes: number;
  uploadOverheadReserveBytes: number;
  build: {
    format: 'esm';
    target: string;
    jsx: 'automatic';
    jsxImportSource: string;
  };
  scaffoldDevDependencies: Record<string, string>;
  scaffoldCliVersionDevDependencies: string[];
}
