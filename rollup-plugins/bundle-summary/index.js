/* eslint-disable no-console */
const gzipSize = require('gzip-size');
const brotliSize = require('brotli-size');
const chalk = require('chalk');
const prettyBytes = require('pretty-bytes');

module.exports = {};

module.exports.summary = function () {
  return {
    name: 'rollup-plugin-bundle-summary',
    generateBundle(options, bundle) {
      statsForDeprecations(bundle);
      statsForV5(bundle);
    },
  };
};

function statsForV5(bundle) {
  console.log('');
  console.log('Stats for v5');
  console.log('Minimum impact to bundle');
  statsWithFilter(bundle, (assetPath) => assetPath.startsWith('core/'));

  console.log('');
  console.log('If all utils are used');
  statsWithFilter(bundle, (assetPath) => assetPath.startsWith('util/'));
}

function statsForDeprecations(bundle) {
  console.log('');
  console.log('To be removed in v5');
  statsWithFilter(bundle, (assetPath) => assetPath.includes('deprecated'));
}

function statsWithFilter(bundle, filterCallback) {
  const assets = Object.keys(bundle);
  let totalSize = 0;
  let totalGzip = 0;
  let totalBrotli = 0;
  let breakdownOutput = '';

  for (const asset of assets) {
    if (!filterCallback(asset)) continue;

    // Skip TS and map files, as they aren't what impact
    // the end users
    if (asset.endsWith('.ts') || asset.endsWith('.map')) continue;

    let bundleAsset = bundle[asset];

    // Empty (types only file, for example)
    if (bundleAsset.code.length < 2) continue;

    const output = bundleAsset.type === 'chunk' ? bundleAsset.code : bundleAsset.source;
    const size = new TextEncoder().encode(output).length;
    const gzip = gzipSize.sync(output);
    const brotli = brotliSize.sync(output);

    breakdownOutput += `  ${asset}: ${chalk.cyan(prettyBytes(size))}\n`;

    totalSize += size;
    totalGzip += gzip;
    totalBrotli += brotli;
  }

  const output = `${prettyBytes(totalSize)} → ${prettyBytes(totalGzip)} ${chalk.green(
    '(gzip)'
  )} → ${prettyBytes(totalBrotli)} ${chalk.green('(brotli)')}`;

  console.log(chalk.yellow(output));
  console.log(breakdownOutput);
}
