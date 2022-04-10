import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as terser from 'terser';
import { globby } from 'globby';
import esbuild from 'esbuild';
import { dir as tmpDir } from 'tmp-promise';
import { gzip } from 'gzip-cli';
import filesize from 'filesize';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const dist = path.join(root, 'ember-resources/dist');

const bundlePatterns = ['core/index.js', 'util/*.js'];

/**
 * 1. Create bundles
 * 2. Minify
 * 3. Find gzip + brotli sizes
 */
async function collectStats() {
  let { path: tmp } = await tmpDir();

  let paths = await globby(bundlePatterns.map((p) => path.join(dist, p)));
  let stats = {};
  let sources = {};

  for (let entry of paths) {
    let name = entry.endsWith('core/index.js') ? 'core.js' : path.basename(entry);
    let outFile = path.join(tmp, name);

    sources[outFile] = entry;

    await esbuild.build({
      entryPoints: [entry],
      outfile: outFile,
      minify: true,
    });

    let { code: minified } = await terser.minify((await fs.readFile(outFile)).toString());

    await fs.writeFile(outFile + '.min', minified);
    await gzip({ patterns: [`${tmp}/*.min`], outputExtensions: ['gz', 'br'] });

    let sourceFile = sources[outFile];
    let label = sourceFile.replace(dist, '');

    stats[label] = {};

    let jsStat = await fs.stat(sourceFile);

    stats[label].js = filesize(jsStat.size);

    let paths = await globby([`${outFile}.*`, `${outFile}.min`, `${outFile}.min.*`]);

    for (let filePath of paths) {
      let stat = await fs.stat(filePath);
      let key = filePath.replace(tmp, '').split('.').slice(1).join('.');

      stats[label][key] = filesize(stat.size);
    }
  }

  // This will get posted to github as a comment, so let's use a markdown table
  let output = '|  | js | min | min + gzip | min + brotli |\n';

  output += '|--| -- | --- | ---------- | ------------ |\n';

  for (let [file, fileStats] of Object.entries(stats)) {
    let { js, 'js.min': min, 'js.min.br': brotli, 'js.min.gz': gzip } = fileStats;

    output += `| ${file} | ${js} | ${min} | ${gzip} | ${brotli} |\n`;
  }

  console.debug(output);

  await fs.writeFile(path.join(__dirname, 'comment.txt'), output);
}

collectStats();
