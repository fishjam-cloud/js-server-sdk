#!/usr/bin/env node
import { Command } from 'commander';
import pkg from '../package.json';
import { ValidationError, buildTemplate } from './build';
import { scaffoldTemplate } from './init';
import { DEFAULT_TARGET, getManifest } from './manifests';

const program = new Command();

program.name('composition-cli').description('Build and scaffold Fishjam composition templates').version(pkg.version);

program
  .command('build')
  .description('Bundle a template and validate it against the platform contract')
  .argument('[entry]', 'template entry file', 'src/App.tsx')
  .option('-o, --out <file>', 'output bundle path', 'dist/App.js')
  .option('--target <version>', 'platform template version to build for', DEFAULT_TARGET)
  .action(async (entry: string, options: { out: string; target: string }) => {
    try {
      const manifest = getManifest(options.target);
      const { bytes } = await buildTemplate(entry, options.out, manifest);
      console.log(`${options.out} (${bytes} bytes, target ${manifest.version})`);
    } catch (err) {
      fail(err);
    }
  });

program
  .command('init')
  .description('Scaffold a new template project')
  .argument('<dir>', 'directory to create the template project in')
  .option('--target <version>', 'platform template version to build for', DEFAULT_TARGET)
  .action(async (dir: string, options: { target: string }) => {
    try {
      const manifest = getManifest(options.target);
      const files = await scaffoldTemplate(dir, manifest, pkg.version);
      for (const file of files) {
        console.log(`created ${file}`);
      }
      console.log(`\nNext steps:\n  cd ${dir}\n  npm install\n  npm run build`);
    } catch (err) {
      fail(err);
    }
  });

function fail(err: unknown): void {
  if (err instanceof ValidationError) {
    console.error('Bundle failed validation:');
    for (const violation of err.violations) {
      console.error(`  - ${violation}`);
    }
  } else {
    console.error(err instanceof Error ? err.message : String(err));
  }
  process.exitCode = 1;
}

await program.parseAsync(process.argv);
process.exit(process.exitCode ?? 0);
