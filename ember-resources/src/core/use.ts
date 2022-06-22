// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { INTERNAL } from './function-based/types';

import type { ResourceFunction } from './function-based/types';

interface Descriptor {
  initializer: () => unknown;
}

type ResourceInitializer = {
  [INTERNAL]: true;
} & ResourceFunction<unknown>;

/**
 * The `@use` decorator has two responsibilities
 *    - abstract away the underlying reactivity configuration (invokeHelper)
 *       - by doing this, we get destruction-association properly cofigured so that
 *         when the host class is destroyed, if the resource has a destructor, it
 *         will be called during destruction
 *    - allows the return value of the resource to be "the" value of the property.
 *
 *
 * This `@use` decorator is needed for function-resources, and *not* needed for class-based
 * resources (for now).
 *
 * @example
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * class MyClass {
 *   @use data = resource(() => {
 *     return 2;
 *   });
 * }
 *
 * (new MyClass()).data === 2
 * ```
 */
export function use(_prototype: object, key: string, descriptor?: Descriptor): void {
  if (!descriptor) return;

  assert(`@use can only be used with string-keys`, typeof key === 'string');

  let caches = new WeakMap<object, any>();

  let { initializer } = descriptor;

  // https://github.com/pzuraq/ember-could-get-used-to-this/blob/master/addon/index.js
  return {
    get(this: object) {
      let cache = caches.get(this);

      if (!cache) {
        let fn = initializer.call(this);

        assert(
          `Expected initialized value under @use to have used the \`resource\` wrapper function`,
          isResourceInitializer(fn)
        );

        cache = invokeHelper(this, fn);
        caches.set(this as object, cache);
        associateDestroyableChild(this, cache);
      }

      return getValue(cache);
    },
  } as unknown as void /* Thanks TS. */;
}

function isResourceInitializer(obj: unknown): obj is ResourceInitializer {
  return typeof obj === 'function' && obj !== null && INTERNAL in obj;
}
