import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { execa } from 'execa';
import fse from 'fs-extra';


const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '../ember-resources/package.json');

async function main() { 

  let pkg = await fse.readJson(packagePath);
  let config = await fse.readJson(path.resolve(__dirname, './typedoc.config.json'));

  let packageExports = pkg.exports;

  let relevant = Object.keys(packageExports).filter((importPath) => {
    if (importPath === '.') return;
    if (importPath.startsWith('./core')) return;
    if (importPath === './util') return;
    if (importPath === './addon-main.js') return;
    if (importPath.includes('cell')) return;

    return true;
  });

  let expectedOutputPath = {};

  // Clear links
  config.sidebarLinks = {};

  // Update links
  for (let importPath of relevant) {
    let normalized = importPath.replace('./util/', '').replace('./', '').replaceAll(/-/g, ' ');
    let split = normalized.split(' ');
    let camelCase = split.map((word, i) => i === 0 ? word : word[0].toUpperCase() + word.slice(1)).join('');
    let outputPath = `/utils/${camelCase}`;

    expectedOutputPath[importPath] = outputPath;

    let link = `${outputPath}/index.html`;


    config.sidebarLinks[camelCase] = link;
  }

  // manual overrides because reasons 
  // Default is an index.html for all exports, which may not be ideal
  config.sidebarLinks['link'] = '/utils/link/functions/link.html';
  config.sidebarLinks['service'] = '/utils/service/functions/service.html';
  config.sidebarLinks['map'] = '/utils/map/functions/map.html';
  config.sidebarLinks['helper'] = '/utils/helper/functions/helper.html';
  delete config.sidebarLinks['function'];
  config.sidebarLinks['trackedFunction'] = '/utils/function/functions/trackedFunction.html';
  config.sidebarLinks['emberConcurrency'] = '/utils/emberConcurrency/functions/trackedTask.html';
  config.sidebarLinks['debounce'] = '/utils/debounce/functions/debounce.html';
  config.sidebarLinks['keepLatest'] = '/utils/keepLatest/functions/keepLatest.html';
  config.sidebarLinks['remoteData'] = '/utils/remoteData/functions/RemoteData.html';

  await fse.writeJson(path.resolve(__dirname, './typedoc.config.json'), config, { spaces: 2 });

  await buildDefault();

  // Generate type-doc outputs with 
  for (let [importPath, outputPath] of Object.entries(expectedOutputPath)) {
    let configCopy = { ...config };

    configCopy.entryPoints = [
      path.resolve('../ember-resources/src', importPath + '.ts'),
    ];
    configCopy.tsconfig = path.resolve(path.join(__dirname, '../ember-resources/tsconfig.json'));
    configCopy.navigationLinks = {};
    configCopy.navigationLinks['Back to ember-resources'] = '/index.html';
    configCopy.navigationLinks['GitHub'] = 'https://github.com/NullVoxPopuli/ember-resources';
    configCopy.sidebarLinks = {};
    configCopy.sidebarLinks['Back to ember-resources'] = '/index.html';
    configCopy.readme = 'none';
    configCopy.customCss = path.resolve(path.join(__dirname, './custom.css'));
    delete configCopy.json;
    configCopy.out = path.join(__dirname, `dist/${outputPath}`);
    configCopy.cleanOutputDir = false;

    let configLocation = `/tmp/ember-resources-docs/${outputPath}/`;

    await fse.ensureDir(configLocation);
    await fse.writeJson(path.join(configLocation, 'typedoc.config.json'), configCopy, { spaces: 2 });

    await build(configLocation);
  }
}

main();

async function buildDefault() {
  await execa('pnpm', ['typedoc', '--options', './typedoc.config.json'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}

async function build(configLocation) {
  await execa('pnpm', ['typedoc', '--options', path.join(configLocation, './typedoc.config.json')], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}
