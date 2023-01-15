// @ts-check
import { existsSync } from 'node:fs';
import { exec } from 'node:child_process';

import pkg from './package.json' assert { type: 'json' };
import tsconfig from './tsconfig.base.json' assert { type: 'json' };

const isBuilt = existsSync(tsconfig.compilerOptions.outDir);

if (isBuilt) {
  console.log('Please set the startup file as the main file from the out folder.');
  process.exit(1);
}

const build = () => {
  exec(pkg.scripts.build.split('&&').map(cmd => `npx ${cmd.trim()}`).join(' '), console.log);
};

build();