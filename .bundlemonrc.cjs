// @ts-check

const path = require('node:path');
const { mkdirSync, existsSync } = require('node:fs');
const { Compression } = require('bundlemon-utils');

/** @typedef {import("bundlemon/lib/main/types").Config} Config */

const packagePath = path.join(__dirname, 'ember-resources');
const manifest = require(path.join(packagePath, 'package.json'));

const jsFiles = Object.values(manifest.exports);

/** @type {Config} */
module.exports = {
  baseDir: path.join(__dirname, './ember-resources/dist'),
  files: jsFiles.map(distFile => ({ path: distFile }),
  defaultCompression: Compression.Brotli,
  includeCommitMessage: true,
  reportOutput: [
    ['json', { fileName: 'dist/bundlemon.json' }],
    ['github', { checkRun: true, commitStatus: true, prComment: true }],
  ],
};
