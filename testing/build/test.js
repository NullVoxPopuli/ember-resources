'use strict';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import { assert } from 'chai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const addonPath = path.join(__dirname, '..', '..', 'ember-resources');

async function main() {
  await build();

  let expected = await getExpected();
  let actual = await listFiles();

  expected.sort();
  actual.sort();

  console.debug({ expected, actual });

  assert.deepEqual(actual, expected);
}

async function build() {
  if (process.env.CI) {
    await execa('pnpm', ['run', 'build:js'], {
      cwd: addonPath,
      preferLocal: true,
      stdio: 'inherit',
    });

    return;
  }

  await execa('pnpm', ['run', 'build:js'], { cwd: addonPath, preferLocal: true });
}

async function getExpected() {
  let expectedFile = await fs.readFile(path.join(__dirname, 'expected-output-files.txt'));
  let expected = expectedFile.toString().split('\n');

  return expected.filter(Boolean);
}

async function listFiles(ofDir = path.join(addonPath, 'dist')) {
  let read = await fs.readdir(ofDir, { withFileTypes: true });

  // tslib has a hash that we can't know ahead of time
  // and it provides decorator support
  return read
    .filter(Boolean)
    .filter((file) => !file.name.startsWith('tslib'))
    .map((item) => item.name);
}

main();
