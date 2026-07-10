// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities, invokeHelper } from '@ember/helper';
import { appEmberSatisfies, importSync, macroCondition } from '@embroider/macros';

import { ReadonlyCell } from './cell.ts';
import { compatOwner } from './ember-compat.ts';
import { CURRENT, INTERNAL } from './types.ts';

import type {
  Destructor,
  InternalFunctionResourceConfig,
  Reactive,
  ResourceFunction,
} from './types.ts';
import type Owner from '@ember/owner';

const setOwner = compatOwner.setOwner;

/**
 * `tracked(initialValue)` from `@glimmer/tracking` creates a standalone
 * reactive value -- an instance of `TrackedValue` from `@glimmer/validator`.
 * These unwrap when returned from a resource, the same way `Cell`s do.
 */
let TrackedValue: undefined | (new (...args: never[]) => { value: unknown });

if (macroCondition(appEmberSatisfies('>=7.3.0-alpha.2'))) {
  TrackedValue = (importSync('@glimmer/validator') as any).TrackedValue;
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
    const { definition: fn } = config;
    /**
     * We have to copy the `fn` in case there are multiple
     * usages or invocations of the function.
     *
     * This copy is what we'll ultimately work with and eventually
     * destroy.
     */
    const thisFn = fn.bind(null);
    let previousFn: object;
    const usableCache = new WeakMap<object, ReturnType<typeof invokeHelper>>();
    const owner = this.owner;

    const cache = createCache(() => {
      if (previousFn) {
        destroy(previousFn);
      }

      const currentFn = thisFn.bind(null);

      associateDestroyableChild(thisFn, currentFn);
      previousFn = currentFn;

      const maybeValue = currentFn({
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
            `Expected the resource's \`use(...)\` utility to have been passed a truthy value, instead was passed: ${String(usable)}.`,
            usable,
          );
          assert(
            `Expected the resource's \`use(...)\` utility to have been passed another resource, but something else was passed.`,
            INTERNAL in usable,
          );

          const previousCache = usableCache.get(usable);

          if (previousCache) {
            destroy(previousCache);
          }

          const nestedCache = invokeHelper(cache, usable);

          associateDestroyableChild(currentFn, nestedCache as object);

          usableCache.set(usable, nestedCache);

          return new ReadonlyCell<any>(() => {
            const cache = usableCache.get(usable);

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
    const maybeValue = getValue(cache);

    if (typeof maybeValue === 'function') {
      return maybeValue();
    }

    if (isReactive(maybeValue)) {
      return maybeValue[CURRENT];
    }

    if (TrackedValue && maybeValue instanceof TrackedValue) {
      return maybeValue.value;
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
