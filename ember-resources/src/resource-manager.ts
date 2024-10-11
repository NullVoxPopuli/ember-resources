// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';
// @ts-ignore
import { invokeHelper } from '@ember/helper';
// @ts-ignore
import { capabilities as helperCapabilities } from '@ember/helper';
import { dependencySatisfies, importSync, macroCondition } from '@embroider/macros';

import { ReadonlyCell } from './cell.ts';
import { CURRENT, INTERNAL } from './types.ts';

import type {
  Destructor,
  InternalFunctionResourceConfig,
  Reactive,
  ResourceFunction,
} from './types.ts';
import type Owner from '@ember/owner';

let getOwner: (context: unknown) => Owner | undefined;
let setOwner: (context: unknown, owner: Owner) => void;

if (macroCondition(dependencySatisfies('ember-source', '>=4.12.0'))) {
  // In no version of ember where `@ember/owner` tried to be imported did it exist
  // if (macroCondition(false)) {
  // Using 'any' here because importSync can't lookup types correctly
  getOwner = (importSync('@ember/owner') as any).getOwner;
  setOwner = (importSync('@ember/owner') as any).setOwner;
} else {
  // Using 'any' here because importSync can't lookup types correctly
  getOwner = (importSync('@ember/application') as any).getOwner;
  setOwner = (importSync('@ember/application') as any).setOwner;
}

/**
 * Note, a function-resource receives on object, hooks.
 *    We have to build that manually in this helper manager
 */
class FunctionResourceManager {
  capabilities: ReturnType<typeof helperCapabilities> = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: Owner) {}

  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(config: InternalFunctionResourceConfig): {
    fn: InternalFunctionResourceConfig['definition'];
    cache: ReturnType<typeof invokeHelper>;
  } {
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
    let usableCache = new WeakMap<object, ReturnType<typeof invokeHelper>>();
    let owner = this.owner;

    let cache = createCache(() => {
      if (previousFn) {
        destroy(previousFn);
      }

      let currentFn = thisFn.bind(null);

      associateDestroyableChild(thisFn, currentFn);
      previousFn = currentFn;

      let maybeValue = currentFn({
        on: {
          cleanup: (destroyer: Destructor) => {
            registerDestructor(currentFn, destroyer);
          },
        },
        use: (usable) => {
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed an object, but a \`${typeof usable}\` was passed.`,
            typeof usable === 'object',
          );
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed a truthy value, instead was passed: ${usable}.`,
            usable,
          );
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed another resource, but something else was passed.`,
            INTERNAL in usable,
          );

          let previousCache = usableCache.get(usable);

          if (previousCache) {
            destroy(previousCache);
          }

          let nestedCache = invokeHelper(cache, usable);

          associateDestroyableChild(currentFn, nestedCache as object);

          usableCache.set(usable, nestedCache);

          return new ReadonlyCell<any>(() => {
            let cache = usableCache.get(usable);

            assert(`Cache went missing while evaluating the result of a resource.`, cache);

            return getValue(cache);
          });
        },
        owner: this.owner,
      });

      return maybeValue;
    });

    setOwner(cache, owner);

    return { fn: thisFn, cache };
  }

  getValue({ cache }: { fn: ResourceFunction; cache: ReturnType<typeof invokeHelper> }) {
    let maybeValue = getValue(cache);

    if (typeof maybeValue === 'function') {
      return maybeValue();
    }

    if (isReactive(maybeValue)) {
      return maybeValue[CURRENT];
    }

    return maybeValue;
  }

  getDestroyable({ fn }: { fn: ResourceFunction }) {
    return fn;
  }
}

function isReactive<Value>(maybe: unknown): maybe is Reactive<Value> {
  return typeof maybe === 'object' && maybe !== null && CURRENT in maybe;
}

export const ResourceManagerFactory = (owner: Owner | undefined) => {
  assert(`Cannot create resource without an owner`, owner);

  return new FunctionResourceManager(owner);
};
