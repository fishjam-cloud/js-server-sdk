import { init, parse } from 'es-module-lexer';
import type { Manifest } from './manifests';

export async function validateBundle(source: string, manifest: Manifest): Promise<string[]> {
  await init;

  let imports;
  let exports;
  try {
    [imports, exports] = parse(source);
  } catch {
    return ['bundle is not valid JavaScript (ESM)'];
  }

  const allowed = new Set(manifest.allowedImports);
  const violations: string[] = [];

  for (const imp of imports) {
    const line = lineOf(source, imp.ss);
    if (imp.d === -2) {
      violations.push(`import.meta is not allowed (line ${line})`);
    } else if (imp.n === undefined) {
      violations.push(`dynamic import with a non-literal specifier is not allowed (line ${line})`);
    } else if (!allowed.has(imp.n)) {
      violations.push(
        `import of "${imp.n}" is not allowed (line ${line}); allowed imports: ${manifest.allowedImports.join(', ')}`
      );
    }
  }

  if (!exports.some((exp) => exp.n === 'default')) {
    violations.push('bundle has no default export; templates must default-export a React component');
  }

  return violations;
}

function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}
