// @ts-check

const path = require('node:path');
const { mkdirSync, existsSync } = require('node:fs');
const { Compression } = require('bundlemon-utils');

/** @typedef {import("bundlemon/lib/main/types").Config} Config */

const packagePath = path.join(__dirname, 'ember-resources');
const manifest = require(path.join(packagePath, 'package.json'));

const jsFiles = Object.values(manifest.exports)
  .map(distFile => distFile.replace(/^\.\/dist\//, ''))
  .filter(distFile => distFile !== 'addon-main.cjs')
  .filter(distFile => distFile !== 'index.js')
  .filter(distFile => !distFile.includes('core/'));

/** @type {Config} */
module.exports = {
  baseDir: path.join(__dirname, './ember-resources/dist'),
  groups: [
    { path: 'index.bundled.js', friendlyName: 'index.js' },
  ],
  files: jsFiles.map(distFile => ({ path: distFile })),
  defaultCompression: Compression.Brotli,
  includeCommitMessage: true,
  reportOutput: [
    ['json', { fileName: 'bundlemon.json' }],
    ['github', { checkRun: true, commitStatus: true, prComment: true }],
  ],
};
