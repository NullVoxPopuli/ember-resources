import { _ as _defineProperty } from '../../defineProperty-oklmLEhu.js';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild, registerDestructor, destroy } from '@ember/destroyable';
import { capabilities, invokeHelper } from '@ember/helper';
import { macroCondition, dependencySatisfies, importSync } from '@embroider/macros';
import { R as ReadonlyCell } from '../../cell-8gZlr81z.js';
import { CURRENT, INTERNAL } from './types.js';

let setOwner;
if (macroCondition(dependencySatisfies('ember-source', '>=4.12.0'))) {
  // In no version of ember where `@ember/owner` tried to be imported did it exist
  // if (macroCondition(false)) {
  // Using 'any' here because importSync can't lookup types correctly
  importSync('@ember/owner').getOwner;
  setOwner = importSync('@ember/owner').setOwner;
} else {
  // Using 'any' here because importSync can't lookup types correctly
  importSync('@ember/application').getOwner;
  setOwner = importSync('@ember/application').setOwner;
}

/**
 * Note, a function-resource receives on object, hooks.
 *    We have to build that manually in this helper manager
 */
class FunctionResourceManager {
  constructor(owner) {
    _defineProperty(this, "capabilities", capabilities('3.23', {
      hasValue: true,
      hasDestroyable: true
    }));
    this.owner = owner;
  }

  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(config) {
    let {
      definition: fn
    } = config;
    /**
     * We have to copy the `fn` in case there are multiple
     * usages or invocations of the function.
     *
     * This copy is what we'll ultimately work with and eventually
     * destroy.
     */
    let thisFn = fn.bind(null);
    let previousFn;
    let usableCache = new WeakMap();
    let owner = this.owner;
    let cache = createCache(() => {
      if (previousFn) {
        destroy(previousFn);
      }
      let currentFn = thisFn.bind(null);
      associateDestroyableChild(thisFn, currentFn);
      previousFn = currentFn;
      const use = usable => {
        assert(`Expected the resource's \`use(...)\` utility to have been passed an object, but a \`${typeof usable}\` was passed.`, typeof usable === 'object');
        assert(`Expected the resource's \`use(...)\` utility to have been passed a truthy value, instead was passed: ${usable}.`, usable);
        assert(`Expected the resource's \`use(...)\` utility to have been passed another resource, but something else was passed.`, INTERNAL in usable);
        let previousCache = usableCache.get(usable);
        if (previousCache) {
          destroy(previousCache);
        }
        let nestedCache = invokeHelper(cache, usable);
        associateDestroyableChild(currentFn, nestedCache);
        usableCache.set(usable, nestedCache);
        return new ReadonlyCell(() => {
          let cache = usableCache.get(usable);
          return getValue(cache);
        });
      };
      let maybeValue = currentFn({
        on: {
          cleanup: destroyer => {
            registerDestructor(currentFn, destroyer);
          }
        },
        use,
        owner: this.owner
      });
      return maybeValue;
    });
    setOwner(cache, owner);
    return {
      fn: thisFn,
      cache
    };
  }
  getValue({
    cache
  }) {
    let maybeValue = getValue(cache);
    if (typeof maybeValue === 'function') {
      return maybeValue();
    }
    if (isReactive(maybeValue)) {
      return maybeValue[CURRENT];
    }
    return maybeValue;
  }
  getDestroyable({
    fn
  }) {
    return fn;
  }
}
function isReactive(maybe) {
  return typeof maybe === 'object' && maybe !== null && CURRENT in maybe;
}
const ResourceManagerFactory = owner => new FunctionResourceManager(owner);

export { ResourceManagerFactory };
//# sourceMappingURL=manager.js.map
