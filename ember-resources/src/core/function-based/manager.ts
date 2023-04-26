// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';
// @ts-ignore
import { invokeHelper } from '@ember/helper';
// @ts-ignore
import { capabilities as helperCapabilities } from '@ember/helper';

import { INTERNAL } from './types';

import type {
  Cache,
  Destructor,
  InternalFunctionResourceConfig,
  Reactive,
  ResourceFunction,
} from './types';
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
    let usableCache = new WeakMap<object, unknown>();

    let cache = createCache(() => {
      if (previousFn) {
        destroy(previousFn);
      }

      let currentFn = thisFn.bind(null);

      associateDestroyableChild(thisFn, currentFn);
      previousFn = currentFn;

      const use = <Value = unknown>(usable: Value): Reactive<Value> => {
        assert(
          `Expected the resource's \`use(...)\` utility to have been passed an object, but a \`${typeof usable}\` was passed.`,
          typeof usable === 'object'
        );
        assert(
          `Expected the resource's \`use(...)\` utility to have been passed a truthy value, instead was passed: ${usable}.`,
          usable
        );
        assert(
          `Expected the resource's \`use(...)\` utility to have been passed another resource, but something else was passed.`,
          INTERNAL in usable
        );

        let previousCache = usableCache.get(usable);

        if (previousCache) {
          destroy(previousCache);
        }

        let cache = invokeHelper(this.owner, usable);

        associateDestroyableChild(currentFn, cache as object);

        usableCache.set(usable, cache);

        return {
          get current() {
            let cache = usableCache.get(usable);

            return getValue(cache);
          },
        };
      };

      let maybeValue = currentFn({
        on: {
          cleanup: (destroyer: Destructor) => {
            registerDestructor(currentFn, destroyer);
          },
        },
        use,
        owner: this.owner,
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
