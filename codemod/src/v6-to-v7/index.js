import fs from 'node:fs/promises';

import semver from 'semver';

import { assert } from '../logging.js';
import { nearestPackageJsonPath } from '../nearest-package-json.js';
import { changeImportPaths, changeNamedImport } from './imports.js';
import { emberModifyBasedClassResource, moves, reactiveWeb } from './replacements.js';

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
    const result = changeImportPaths(str, reactiveWeb);

    if (str !== result) {
      needsReactiveWeb = true;
    }

    return result;
  }

  /**
   * @param {string} str
   */
  function checkInternal(str) {
    const result = changeImportPaths(str, moves);

    return result;
  }

  /**
   * @param {string} str
   */
  function checkModifyBasedResource(str) {
    let result = changeImportPaths(str, emberModifyBasedClassResource);

    /**
     * Examples
     *   import { Resource } from 'ember-resources';
     *   import { resource, Resource } from 'ember-resources';
     *   import { Resource, use } from 'ember-resources';
     */
    result = changeNamedImport(
      result,
      'Resource',
      emberResources,
      'ember-modify-based-class-resource',
    );

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

    const existing = manifestChanges.get(manifestPath);

    if (!existing) {
      manifestChanges.set(manifestPath, [dep]);

      return;
    }

    existing.push(dep);
  }

  for (const filePath of paths) {
    needsReactiveWeb = false;
    needsEmberModifyBasedClassResource = false;

    const contents = await readFile(filePath);

    /**
     * Actual migration of files' contents is here
     */
    let modified = checkReactiveWeb(contents);

    modified = checkInternal(modified);
    modified = checkModifyBasedResource(modified);

    /**
     * Queue up changes to the package.json(s)
     */
    if (needsReactiveWeb) {
      const manifestPath = await nearestPackageJsonPath(filePath);

      addManifestChange(manifestPath, 'reactiveweb');
    }

    if (needsEmberModifyBasedClassResource) {
      const manifestPath = await nearestPackageJsonPath(filePath);

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
  for (const [manifestPath, deps] of manifestChanges.entries()) {
    const str = await readFile(manifestPath);
    const json = JSON.parse(str);

    json.dependencies ||= {};
    deps.forEach((dep) => {
      const version = VERSIONS[dep];

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
    const isAddonProbably = json.keywords?.includes('ember-addon') || json['ember-addon'];
    const isV2Addon = json['ember-addon']?.version >= 2;
    const mayNeedBuildUpdates = !isAddonProbably || !isV2Addon;
    const listOf = {
      devDeps: Object.keys(json.devDependencies || {}),
      deps: Object.keys(json.dependencies || {}),
      peers: Object.keys(json.peerDependencies || {}),
    };

    if (mayNeedBuildUpdates) {
      for (const [requiredIfPresent, minVersion] of Object.entries(
        MINIMUM_REQUIREMENTS_IF_PRESENT,
      )) {
        if (listOf.deps.includes(requiredIfPresent)) {
          const currentVersion = json.dependencies[requiredIfPresent];
          const parsed = semver.coerce(currentVersion);

          if (!parsed) continue;

          const isSufficient = semver.gte(parsed, minVersion);

          if (!isSufficient) {
            json.dependencies[requiredIfPresent] = `~${minVersion}`;
          }
        }

        if (listOf.devDeps.includes(requiredIfPresent)) {
          const currentVersion = json.devDependencies[requiredIfPresent];
          const parsed = semver.coerce(currentVersion);

          if (!parsed) continue;

          const isSufficient = semver.gte(parsed, minVersion);

          if (!isSufficient) {
            json.devDependencies[requiredIfPresent] = `~${minVersion}`;
          }
        }
      }
    }

    if (listOf.peers.includes(emberResources)) {
      json.peerDependencies[emberResources] =
        `${json.peerDependencies[emberResources]} || '>= 7.0.2'`;
    }

    if (listOf.devDeps.includes(emberResources)) {
      json.devDependencies[emberResources] = `^7.0.2`;
    }

    if (listOf.deps.includes(emberResources)) {
      json.dependencies[emberResources] = `^7.0.2`;
    }

    await fs.writeFile(manifestPath, JSON.stringify(json, null, 2));
  }
}

/**
 * @param {string} filePath
 */
async function readFile(filePath) {
  const buffer = await fs.readFile(filePath);

  return buffer.toString();
}
