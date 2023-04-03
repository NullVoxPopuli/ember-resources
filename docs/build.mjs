import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import fse from 'fs-extra';
import { execa } from 'execa';


const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '../ember-resources/package.json');

async function main() { 

  let pkg = await fse.readJson(packagePath);
  let config = await fse.readJson(path.resolve(__dirname, './typedoc.config.json'));

  let packageExports = pkg.exports;

  let relevant = Object.keys(packageExports).filter((importPath) => {
    if (importPath === '.') return;
    if (importPath.startsWith('./core') return;
    if (importPath === './util') return;
    if (importPath === './addon-main.js') return;

    return true;
  });

  // Update links
  for (let importPath of relevant) {
    let normalized = importPath.replace('./util/', '').replaceAll(/-/, ' ');
    let link = `/utils/${normalized.replaceAll(/[^a-z]+/, '')}/index.html`;

    let split = normalized.split(' ');
    camelCase = split.map((word, i) => i ? === 0 word : word[0].toUpperCase() + word.slice(1));

    let text = `Util: ${camelCase}`;

    config.sidebarLinks[text] = link;
  }

    await fse.writeJson(path.resolve(__dirname, './typedoc.config.json'), config, { spaces: 2 });

    // Generate type-doc outputs with 
}

main();

async function buildDefault() {
  await execa('pnpm', ['typedoc', '--options', './typedoc.config.json'], {
    cwd: __dirname,
  });
}


