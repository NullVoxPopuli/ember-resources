/* eslint-disable @typescript-eslint/ban-types */
import type { ArgsWrapper, Thunk } from './types';

export const DEFAULT_THUNK = () => [];

// TODO: this has got to be exported somewhere from Ember, right?
// TODO: RFC making the utility public api if it isn't already
//       https://github.com/glimmerjs/glimmer-vm/blob/4f1bef0d9a8a3c3ebd934c5b6e09de4c5f6e4468/packages/%40glimmer/manager/lib/util/args-proxy.ts#L56

/**
 * But the args-proxy may not work, because:
 *  - even if we access _any_ property, and lazily evaluate the thunk,
 *  - all tracked data within the thunk is consumed
 *  - accessing any property on the args entangles with all the args
 *
 *  We need to
 *   - evaluate the thunk _without tracking_ (but still collect the REFs?)
 *   - wrap in a proxy
 *   - upon access, entangle with the source REF
 */
export function normalizeThunk(thunk: Thunk): ArgsWrapper {
  let args = thunk();

  if (Array.isArray(args)) {
    return { named: {}, positional: args };
  }

  if (!args) {
    return { named: {}, positional: [] };
  }

  /**
   * Hopefully people aren't using args named "named"
   */
  if ('positional' in args || 'named' in args) {
    return args;
  }

  return { named: args as Record<string, unknown>, positional: [] };
}

export function proxyClass<Instance extends object>(target: { value: Instance }) {
  return new Proxy(target, {
    get(target, key): unknown {
      const instance = target.value;
      const value = Reflect.get(instance as object, key, instance);

      return typeof value === 'function' ? value.bind(instance) : value;
    },
    ownKeys(target): (string | symbol)[] {
      return Reflect.ownKeys(target.value);
    },
    getOwnPropertyDescriptor(target, key): PropertyDescriptor | undefined {
      return Reflect.getOwnPropertyDescriptor(target.value, key);
    },
  }) as never as Instance;
}
