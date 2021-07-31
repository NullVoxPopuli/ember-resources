/* eslint-disable @typescript-eslint/ban-types */
import type { ArgsWrapper, Thunk } from './types';

export const DEFAULT_THUNK = () => [];

export function normalizeThunk(thunk?: Thunk): ArgsWrapper {
  if (!thunk) {
    return { named: {}, positional: [] };
  }

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
