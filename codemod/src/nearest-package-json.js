import fs from 'node:fs/promises';
import path from 'node:path';

import { findUp } from 'find-up';

import { processAssert } from './logging.js';

/**
 * Path => Path
 */
const PATHS_CACHE = new Map();
/**
 * Path => JSON
 */
const MANIFEST_CACHE = new Map();

/**
 * @param {string} filePath
 * @returns {Promise<string | undefined>}
 */
export async function nearestPackageJsonPath(filePath) {
  let dir = path.dirname(filePath);

  let existing = PATHS_CACHE.get(dir);

  if (existing) {
    return existing;
  }

  let nearest = await findUp('package.json', { cwd: dir });

  PATHS_CACHE.set(dir, nearest);

  return nearest;
}

/**
 * @param {string} filePath
 * @returns {Promise<{
 *   dependencies?: Record<string, string>;
 *   devDependencies?: Record<string, string>;
 *   peerDependencies?: Record<string, string>
 * }>}
 */
export async function nearestPackageJson(filePath) {
  let manifestPath = await nearestPackageJsonPath(filePath);

  processAssert(`Could not find package.json for ${filePath}`, manifestPath);

  let existing = MANIFEST_CACHE.get(manifestPath);

  if (existing) {
    return existing;
  }

  let buffer = await fs.readFile(manifestPath);
  let str = buffer.toString();
  let json = JSON.parse(str);

  MANIFEST_CACHE.set(manifestPath, json);

  return json;
}
