import fs from 'node:fs/promises';

import semver from 'semver';

import { assert } from '../logging.js';
import { nearestPackageJsonPath } from '../nearest-package-json.js';

/**
 * @type {Record<string, string>}
 */
const VERSIONS = {
  reactiveweb: '^1.3.0',
  'ember-modify-based-class-resource': '^1.1.0',
};

const emberResources = 'ember-resources';

/**
 * @type {Record<string, string>}
 */
const MINIMUM_REQUIREMENTS_IF_PRESENT = {
  'ember-cli-babel': '8.2.0',
  'ember-auto-import': '2.7.0',
  '@embroider/core': '3.2.1',
  '@embroider/webpack': '3.1.5',
  '@embroider/compat': '3.2.1',
};

const reactiveWeb = {
  'ember-resources/link': 'reactiveweb/link',
  'ember-resources/modifier': 'reactiveweb/resource/modifier',
  'ember-resources/service': 'reactiveweb/resource/service',
  'ember-resources/util/debounce': 'reactiveweb/debounce',
  'ember-resources/util/ember-concurrency': 'reactiveweb/ember-concurrency',
  'ember-resources/util/fps': 'reactiveweb/fps',
  'ember-resources/util/function': 'reactiveweb/function',
  'ember-resources/util/helper': 'reactiveweb/helper',
  'ember-resources/util/keep-latest': 'reactiveweb/keep-latest',
  'ember-resources/util/map': 'reactiveweb/map',
  'ember-resources/util/remote-data': 'reactiveweb/remote-data',
};

const emberModifyBasedClassResource = {
  'ember-resources/core/class-based': 'ember-modify-based-class-resource',
};

const moves = {
  'ember-resources/util/cell': 'ember-resources',
  'ember-resources/core': 'ember-resources',
  'ember-resources/core/function-based': 'ember-resources',
  // ember-resources/util/index was broken, didn't exist
};

const reactiveWebReplacements = Object.entries(reactiveWeb);
const internalReplacements = Object.entries(moves);
const emberModifyBasedClassResourceReplacements = Object.entries(emberModifyBasedClassResource);

/**
 * @param {string[]} paths
 */
export default async function migrateV6ToV7(paths) {
  let needsReactiveWeb = false;
  let needsEmberModifyBasedClassResource = false;

  /**
   * @param {string} str
   */
  function checkReactiveWeb(str) {
    let result = str;

    for (let [v6, v7] of reactiveWebReplacements) {
      result = result.replaceAll(v6, v7);
    }

    if (str !== result) {
      needsReactiveWeb = true;
    }

    return result;
  }

  /**
   * @param {string} str
   */
  function checkInternal(str) {
    let result = str;

    for (let [v6, v7] of internalReplacements) {
      result = result.replaceAll(v6, v7);
    }

    return result;
  }

  /**
   * @param {string} str
   */
  function checkModifyBasedResource(str) {
    let result = str;

    for (let [v6, v7] of emberModifyBasedClassResourceReplacements) {
      result = result.replaceAll(v6, v7);
    }

    if (str !== result) {
      needsEmberModifyBasedClassResource = true;
    }

    return result;
  }

  /**
   * Path => deps to add
   * @type {Map<string, string[]>}
   */
  const manifestChanges = new Map();

  /**
   * @param {string | undefined} manifestPath
   * @param {string} dep
   */
  function addManifestChange(manifestPath, dep) {
    // This is probably an error case, but hopefully it doesn't hapepn
    if (!manifestPath) return;

    let existing = manifestChanges.get(manifestPath);

    if (!existing) {
      manifestChanges.set(manifestPath, [dep]);

      return;
    }

    existing.push(dep);
  }

  for (let filePath of paths) {
    needsReactiveWeb = false;
    needsEmberModifyBasedClassResource = false;

    let contents = await readFile(filePath);

    /**
     * Actual migration of files' contents is here
     */
    let modified = checkReactiveWeb(contents);

    modified = checkModifyBasedResource(modified);
    modified = checkInternal(modified);

    /**
     * Queue up changes to the package.json(s)
     */
    if (needsReactiveWeb) {
      let manifestPath = await nearestPackageJsonPath(filePath);

      addManifestChange(manifestPath, 'reactiveweb');
    }

    if (needsEmberModifyBasedClassResource) {
      let manifestPath = await nearestPackageJsonPath(filePath);

      addManifestChange(manifestPath, 'ember-modify-based-class-resource');
    }

    /**
     * Save the source file
     */
    if (contents != modified) {
      await fs.writeFile(filePath, modified);
    }
  }

  await updatePackages(manifestChanges);
}

/**
 * @param {Map<string, string[]>} manifestChanges
 */
async function updatePackages(manifestChanges) {
  for (let [manifestPath, deps] of manifestChanges.entries()) {
    let str = await readFile(manifestPath);
    let json = JSON.parse(str);

    json.dependencies ||= {};
    deps.forEach((dep) => {
      let version = VERSIONS[dep];

      assert(
        `${dep} is not a valid depenedncy for this migration. Available: ${Object.keys(VERSIONS)}`,
        version,
      );

      json.dependencies[dep] = version;
    });

    // Check min versions
    //   ember-cli-babel >= 8.2.0
    //   ember-auto-import >= 2.7.0
    //   @embroider/core >= 3.2.1
    //   @embroider/webpack >= 3.1.5
    //   @embroider/compat >= 3.2.1
    //
    // Note that the min ember-source version is 3.28, and that support hasn't changed
    //
    // For v2 addons, none of the above is needed.
    let isAddonProbably = json.keywords?.includes('ember-addon') || json['ember-addon'];
    let isV2Addon = json['ember-addon']?.version >= 2;
    let mayNeedBuildUpdates = !isAddonProbably || !isV2Addon;
    let devDeps = Object.keys(json.devDependencies || {});
    let deps = Object.keys(json.dependencies || {});
    let peers = Object.keys(json.peerDependencies || {});

    if (mayNeedBuildUpdates) {
      for (let [requiredIfPresent, minVersion] of Object.entries(MINIMUM_REQUIREMENTS_IF_PRESENT)) {
        if (deps.includes(requiredIfPresent)) {
          let currentVersion = json.dependencies[requiredIfPresent];
          let parsed = semver.coerce(currentVersion);

          if (!parsed) continue;

          let isSufficient = semver.gte(parsed, minVersion);

          if (!isSufficient) {
            json.dependencies[requiredIfPresent] = `~${minVersion}`;
          }
        }

        if (devDeps.includes(requiredIfPresent)) {
          let currentVersion = json.devDependencies[requiredIfPresent];
          let parsed = semver.coerce(currentVersion);

          if (!parsed) continue;

          let isSufficient = semver.gte(parsed, minVersion);

          if (!isSufficient) {
            json.devDependencies[requiredIfPresent] = `~${minVersion}`;
          }
        }
      }
    }

    if (peers.includes(emberResources)) {
      json.peerDependencies[emberResources] =
        `${json.peerDependencies[emberResources]} || '>= 7.0.2'`;
    }

    if (devDeps.includes(emberResources)) {
      json.devDependencies[emberResources] = `^7.0.2`;
    }

    if (deps.includes(emberResources)) {
      json.dependencies[emberResources] = `^7.0.2`;
    }

    await fs.writeFile(manifestPath, JSON.stringify(json, null, 2));
  }
}

/**
 * @param {string} filePath
 */
async function readFile(filePath) {
  let buffer = await fs.readFile(filePath);

  return buffer.toString();
}
