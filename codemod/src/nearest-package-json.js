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
  const dir = path.dirname(filePath);

  const existing = PATHS_CACHE.get(dir);

  if (existing) {
    return existing;
  }

  const nearest = await findUp('package.json', { cwd: dir });

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
  const manifestPath = await nearestPackageJsonPath(filePath);

  processAssert(`Could not find package.json for ${filePath}`, manifestPath);

  const existing = MANIFEST_CACHE.get(manifestPath);

  if (existing) {
    return existing;
  }

  const buffer = await fs.readFile(manifestPath);
  const str = buffer.toString();
  const json = JSON.parse(str);

  MANIFEST_CACHE.set(manifestPath, json);

  return json;
}
