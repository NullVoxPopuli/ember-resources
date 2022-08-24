// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { setOwner } from '@ember/application';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities } from '@ember/helper';

import type { Cache, Destructor, InternalFunctionResourceConfig, ResourceFunction } from './types';
import type Owner from '@ember/owner';

/**
 * Note, a function-resource receives on object, hooks.
 *    We have to build that manually in this helper manager
 */
class FunctionResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: Owner) {}

  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(config: InternalFunctionResourceConfig) {
    let { definition: fn } = config;
    /**
     * We have to copy the `fn` in case there are multiple
     * usages or invocations of the function.
     *
     * This copy is what we'll ultimately work with and eventually
     * destroy.
     */
    let thisFn = fn.bind(null);
    let previousFn: object;

    let cache = createCache(() => {
      if (previousFn) {
        destroy(previousFn);
      }

      let currentFn = thisFn.bind(null);

      setOwner(currentFn, this.owner);

      associateDestroyableChild(thisFn, currentFn);
      previousFn = currentFn;

      let maybeValue = currentFn({
        on: {
          cleanup: (destroyer: Destructor) => {
            registerDestructor(currentFn, destroyer);
          },
        },
      });

      return maybeValue;
    });

    return { fn: thisFn, cache };
  }

  getValue({ cache }: { fn: ResourceFunction; cache: Cache }) {
    let maybeValue = getValue(cache);

    if (typeof maybeValue === 'function') {
      return maybeValue();
    }

    return maybeValue;
  }

  getDestroyable({ fn }: { fn: ResourceFunction }) {
    return fn;
  }
}

export const ResourceManagerFactory = (owner: Owner) => new FunctionResourceManager(owner);
