import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as terser from 'terser';
import { globby } from 'globby';
import esbuild from 'esbuild';
import { dir as tmpDir } from 'tmp-promise';
import { gzip } from 'gzip-cli';
import { filesize } from 'filesize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const dist = path.join(root, 'ember-resources/dist');
const packageJsonPath = path.join(root, 'ember-resources/package.json');

let packageJson;

const config = {
  bundles: {
    'index.js': {
      alias: '.',
      nest: [
        'core/class-based/index.js',
        'core/function-based/index.js',
        'core/cell.js',
        'core/use.js',
      ]
    },
    'core/use.js': {},
    'core/class-based/index.js': {},
    'core/function-based/index.js': {},
    'link.js': {},
    'service.js': {},
    'util/*.js': {},
  }
}
/**
 * 1. Create bundles
 * 2. Minify
 * 3. Find gzip + brotli sizes
 */
async function collectStats() {
  packageJson = JSON.parse((await fs.readFile(packageJsonPath)).toString());

  let { path: tmp } = await tmpDir();

  let bundlePatterns = Object.keys(config.bundles);
  let nests = Object.values(config.bundles).map(bundle => bundle.nest).flat().filter(Boolean).map(x => `/${x}`);
  let originalDistPaths = await globby(bundlePatterns.map((p) => path.join(dist, p)));
  let stats = {};

  for (let entry of originalDistPaths) {
    let name = entry.endsWith('core/index.js') ? 'core.js' : path.basename(entry);
    let outFile = path.join(tmp, name);

    await bundle(entry, outFile);
    await minify(outFile);
    await compress(outFile);

    let label = entry.replace(dist, '');

    stats[label] = await statsFor(outFile, { tmp });
  }

  // This will get posted to github as a comment, so let's use a markdown table
  let output = `_Estimated_ impact to a consuming app, depending on which bundle is imported\n\n`;

  output += '|  | js | min | min + gzip | min + brotli |\n';
  output += '|--| -- | --- | ---------- | ------------ |\n';

  let rowFor = (file, fileStats, indent = '') => {
    let { js, 'js.min': min, 'js.min.br': brotli, 'js.min.gz': gzip } = fileStats;

    return `| ${indent}${file} | ${js} | ${min} | ${gzip} | ${brotli} |\n`;
  }


  for (let [file, fileStats] of Object.entries(stats)) {
    if (nests.includes(file)) continue;

    output += rowFor(file, fileStats);

    let relativeFile = file.replace(/^\//, '');
    if (config.bundles[relativeFile]?.nest) {
      let nest = config.bundles[relativeFile].nest;

      for (let nested of nest) {
        if (stats['/' + nested]) {
          let isLast = nest.indexOf(nested) === nest.length - 1;
          let glyph = isLast ? '└── ' : '├── ';

          output += rowFor(nested, stats['/' + nested], glyph);
        }
      }
    }
  }

  console.debug(output);

  await fs.writeFile(path.join(__dirname, 'comment.txt'), output);
}

async function bundle(entry, outFile) {
  let externals = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {})
  ];

  /**
   * Utils are one file
   */
  if (entry.includes('util')) {
    await fs.copyFile(entry, outFile);
  } else {
    await esbuild.build({
      entryPoints: [entry],
      outfile: outFile,
      bundle: true,
      external: [
        ...externals,
        'ember',
        '@ember/application',
        '@ember/debug',
        '@ember/helper',
        '@ember/destroyable',
        '@ember/object',
        '@ember/runloop',
        '@ember/test',
        '@embroider/macros',
        '@glimmer/component',
        '@glimmer/tracking',
      ],
    });
  }
}

async function compress(outFile) {
  await gzip({ patterns: [`${outFile}.min`], outputExtensions: ['gz', 'br'] });
}

async function minify(filePath) {
  let { code } = await terser.minify((await fs.readFile(filePath)).toString());

  await fs.writeFile(filePath + '.min', code);
}

async function statsFor(outFile, { tmp }) {
  let result = {};

  let jsStat = await fs.stat(outFile);

  result.js = filesize(jsStat.size);

  let paths = await globby([`${outFile}.*`, `${outFile}.min`, `${outFile}.min.*`]);

  for (let filePath of paths) {
    let stat = await fs.stat(filePath);
    let key = filePath.replace(tmp, '').split('.').slice(1).join('.');

    result[key] = filesize(stat.size);
  }

  return result;
}

collectStats();
