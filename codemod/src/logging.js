import { styleText } from 'node:util';

/**
 * @param {string} msg
 */
export function error(msg) {
  console.error(styleText('red', msg));
}

/**
 * @param {string} msg
 * @param {unknown} condition
 */
export function processAssert(msg, condition) {
  if (!condition) {
    error(msg);

    process.exit(1);
  }
}

/**
 * @param {string} msg
 * @param {unknown} condition
 */
export function assert(msg, condition) {
  if (!condition) {
    throw msg;
  }
}

/**
 * @param {string} msg
 */
export function info(msg) {
  console.info(msg);
}

/**
 * @param {string} msg
 */
export function warn(msg) {
  console.info(styleText('yellow', msg));
}

export function sep() {
  console.info('');
}
