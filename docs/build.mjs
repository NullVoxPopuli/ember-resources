import path from 'node:path';
import url from 'node:url';

import { execa } from 'execa';
import fse from 'fs-extra';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function main() { 
  await fse.remove(path.resolve(__dirname, './dist'));
  // In order for this to work, we must assure that there are no naming collisions.
  await buildUtils();
  await buildDefault();
}

main();

async function buildDefault() {
  await execa('pnpm', ['typedoc', '--options', './typedoc.config.json'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}

async function buildUtils() {
  await execa('pnpm', ['typedoc', '--options', './typedoc.utils.config.json'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}
