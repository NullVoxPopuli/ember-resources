// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';
// @ts-ignore
import { invokeHelper, setHelperManager } from '@ember/helper';

import { ReadonlyCell } from './cell.ts';
import { ResourceManagerFactory } from './resource-manager.ts';
import { INTERNAL } from './types.ts';
import { registerUsable, TYPE_KEY } from './use.ts';
import { shallowFlat } from './utils.ts';

import type { Destructor, Reactive, ResourceFunction } from './types.ts';
import type Owner from '@ember/owner';

export const CREATE_KEY = Symbol.for('__configured-resource-key__');
export const DEBUG_NAME = Symbol.for('DEBUG_NAME');
export const RESOURCE_CACHE = Symbol.for('__resource_cache__');

import { compatOwner } from './ember-compat.ts';

const getOwner = compatOwner.getOwner;
const setOwner = compatOwner.setOwner;

/**
 * The return value from resource()
 *
 * This is semi-public API, and is meant to de-magic the intermediary
 * value returned from resource(), allowing us to both document how to
 * - manually create a resource (instance)
 * - explain how the helper manager interacts with the methods folks
 *   can use to manually create a resource
 *
 *
 * With an owner, you can manually create a resource this way:
 * ```js
 * import { destroy } from '@ember/destroyable';
 * import { resource } from 'ember-resources';
 *
 * const builder = resource(() => {}); // builder can be invoked multiple times
 * const owner = {};
 * const state = builder.create(owner); // state can be created any number of times
 *
 * state.current // the current value
 * destroy(state); // some time later, calls cleanup
 * ```
 */
export class Builder<Value> {
  #fn: ResourceFunction<Value>;

  [TYPE_KEY] = TYPE;

  constructor(fn: ResourceFunction<Value>, key: Symbol) {
    assert(
      `Cannot instantiate ConfiguredResource without using the resource() function.`,
      key === CREATE_KEY,
    );

    this.#fn = fn;
  }

  create() {
    return new Resource(this.#fn);
  }
}

const TYPE = 'function-based';

registerUsable(TYPE, (context: object, config: Builder<unknown>) => {
  let instance = config.create();

  instance.link(context);

  return instance[RESOURCE_CACHE];
});

/**
 * TODO:
 */
export class Resource<Value> {
  #originalFn: ResourceFunction<Value>;
  #owner: Owner | undefined;
  #previousFn: object | undefined;
  #usableCache = new WeakMap<object, ReturnType<typeof invokeHelper>>();
  #cache: ReturnType<typeof invokeHelper>;

  constructor(fn: ResourceFunction<Value>) {
    /**
     * We have to copy the `fn` in case there are multiple
     * usages or invocations of the function.
     *
     * This copy is what we'll ultimately work with and eventually
     * destroy.
     */
    this.#originalFn = fn.bind(null);

    this.#cache = createCache(() => {
      if (this.#previousFn) {
        destroy(this.#previousFn);
      }

      let currentFn = this.#originalFn.bind(null);

      associateDestroyableChild(this.#originalFn, currentFn);
      this.#previousFn = currentFn;

      assert(
        `Cannot create a resource without an owner. Must have previously called .link()`,
        this.#owner,
      );

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
            INTERNAL in usable || usable instanceof Builder,
          );

          let previousCache = this.#usableCache.get(usable);

          if (previousCache) {
            destroy(previousCache);
          }

          let nestedCache = invokeHelper(this.#cache, usable);

          associateDestroyableChild(currentFn, nestedCache as object);

          this.#usableCache.set(usable, nestedCache);

          return new ReadonlyCell<any>(() => {
            let cache = this.#usableCache.get(usable);

            assert(`Cache went missing while evaluating the result of a resource.`, cache);

            return getValue(cache);
          });
        },
        owner: this.#owner,
      });

      return maybeValue;
    });
  }
  link(context: object) {
    let owner = getOwner(context);

    if (!owner) {
      if ('lookup' in context) {
        owner = context as Owner;
      }
    }

    assert(`Cannot link without an owner`, owner);

    this.#owner = owner;

    associateDestroyableChild(context, this.#cache);
    associateDestroyableChild(context, this.#originalFn);

    setOwner(this.#cache, this.#owner);
  }

  get [RESOURCE_CACHE](): unknown {
    return this.#cache;
  }

  get fn() {
    return this.#originalFn;
  }

  get current() {
    return shallowFlat(this.#cache);
  }

  [DEBUG_NAME]() {
    return `Resource Function`;
  }
}

setHelperManager(ResourceManagerFactory, Builder.prototype);
