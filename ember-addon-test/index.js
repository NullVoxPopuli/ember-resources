#!/usr/bin/env node

import path from 'node:path';
import * as url from 'url';
import { execa } from 'execa';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const bin = path.join(__dirname, 'node_modules', '.bin', 'vite');
const config = path.join(__dirname, 'vite.config.ts');
const entry = path.join(__dirname, 'index.html');

console.log({ entry });

execa(bin, ['--config', config, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: 'inherit',
});
