/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import type { ArgsWrapper, Cache } from './types';

interface Constructable<T> {
  new (...args: unknown[]): T;
}

type Thunk =
  // vanilla array
  | (() => ArgsWrapper['positional'])
  // plain named args
  | (() => ArgsWrapper['named'])
  // both named and positional args... but why would you choose this? :upsidedownface:
  | (() => ArgsWrapper);

function normalizeThunk(thunk: Thunk): ArgsWrapper {
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

// https://github.com/josemarluedke/glimmer-apollo/blob/main/packages/glimmer-apollo/src/-private/use-resource.ts
function useUnproxiedResource<Instance = unknown>(
  context: object,
  klass: Constructable<Instance>,
  thunk: Thunk
): { value: Instance } {
  let resource: Cache<Instance>;

  return {
    get value(): Instance {
      if (!resource) {
        resource = invokeHelper(context, klass, () => {
          return normalizeThunk(thunk);
        }) as Cache<Instance>;
      }

      return getValue<Instance>(resource)!; // eslint-disable-line
    },
  };
}

/**
 * For use in the body of a class.
 * Constructs a cached Resource that will reactively respond to tracked data changes
 *
 */
export function useResource<Instance extends object>(
  context: object,
  klass: Constructable<Instance>,
  thunk: Thunk
): Instance {
  const target = useUnproxiedResource<Instance>(context, klass, thunk);

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
