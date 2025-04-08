import { getValue } from '@glimmer/tracking/primitives/cache';
import { invokeHelper } from '@ember/helper';
import { INTERMEDIATE_VALUE } from './types.js';

// @ts-ignore
/**
 * This is what allows resource to be used withotu @use.
 * The caveat though is that a property must be accessed
 * on the return object.
 *
 * A resource not using use *must* be an object.
 */
function wrapForPlainUsage(context, setup) {
  let cache;

  /*
   * Having an object that we use invokeHelper + getValue on
   * is how we convert the "function" in to a reactive utility
   * (along with the following proxy for accessing anything on this 'value')
   *
   */
  const target = {
    get [INTERMEDIATE_VALUE]() {
      if (!cache) {
        cache = invokeHelper(context, setup);
      }
      return getValue(cache);
    }
  };

  /**
   * This proxy takes everything called on or accessed on "target"
   * and forwards it along to target[INTERMEDIATE_VALUE] (where the actual resource instance is)
   *
   * It's important to only access .[INTERMEDIATE_VALUE] within these proxy-handler methods so that
   * consumers "reactively entangle with" the Resource.
   */
  return new Proxy(target, {
    get(target, key) {
      const state = target[INTERMEDIATE_VALUE];
      return Reflect.get(state, key, state);
    },
    ownKeys(target) {
      const value = target[INTERMEDIATE_VALUE];
      return Reflect.ownKeys(value);
    },
    getOwnPropertyDescriptor(target, key) {
      const value = target[INTERMEDIATE_VALUE];
      return Reflect.getOwnPropertyDescriptor(value, key);
    }
  });
}

export { wrapForPlainUsage };
//# sourceMappingURL=utils.js.map
