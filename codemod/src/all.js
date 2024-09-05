import path from 'node:path';

import { findUp } from 'find-up';
import { globby } from 'globby';

import { info, processAssert, sep, warn } from './logging.js';
import { nearestPackageJson } from './nearest-package-json.js';
import { cwd } from './utils.js';
import migrateV6ToV7 from './v6-to-v7/index.js';

/**
 * What version of ember-resources does a person have?
 * - for each major range bump, run a set of migrations for that range
 * Then change the version of ember-resources in their package.json
 */
export async function run() {
  await assertJSProject();

  let files = await gatherFiles();

  await migrateV6ToV7(files);
}

async function assertJSProject() {
  const manifestPath = await findUp('package.json');

  processAssert(`Could not find a package.json. Searched ${cwd} and upward.`, manifestPath);
}

async function gatherFiles() {
  const allPaths = await globby('**/*.{js,ts,gjs,gts}', {
    cwd,
    gitignore: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/declarations/**', '**/tmp/**'],
  });

  /**
   * Now filter
   * 1. a file's nearest package.json should have ember-resources declared
   * 2. gjs / gts files aren't greatly supported yet until
   *    https://github.com/embroider-build/content-tag/pull/75
   *    is finished.
   *
   *    For gjs/gts we'll have to do text manipulation, rather than running
   *    the files through jscodeshift (until the above PR is finished
   *    (and I make a parser for jscodeshift for gjs/gts files))
   */

  const relevantPaths = [];

  for (let filePath of allPaths) {
    let fullPath = path.join(cwd, filePath);
    let manifest = await nearestPackageJson(fullPath);

    let deps = [
      ...Object.keys(manifest.devDependencies || {}),
      ...Object.keys(manifest.dependencies || {}),
      ...Object.keys(manifest.peerDependencies || {}),
    ];

    if (deps.includes('ember-resources')) {
      relevantPaths.push(fullPath);
    }
  }

  info(
    `Found ${allPaths.length} js,ts,gjs,gts files, and filtered them down to ${relevantPaths.length} relevant files -- files within project(s) that have the "ember-resources" dependency declared.`,
  );
  sep();
  warn(
    `If you have ember-resources usage in packages that have not declared ember-resources as a (dependencies, devDependencies, or peerDependencies) entry, you'll want to fix that before running this codemod.`,
  );

  return relevantPaths;
}
