// @ts-ignore
import { type createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';

import { CURRENT, INTERMEDIATE_VALUE, type Reactive } from './types.ts';

import type { Builder, Resource } from './intermediate-representation.ts';
import type Owner from '@ember/owner';

export function shallowFlat<Value>(cache: ReturnType<typeof createCache>): Value {
  let maybeValue = getValue(cache);

  if (typeof maybeValue === 'function') {
    return maybeValue();
  }

  if (isReactive(maybeValue)) {
    return maybeValue[CURRENT] as Value;
  }

  return maybeValue as Value;
}

export function isReactive<Value>(maybe: unknown): maybe is Reactive<Value> {
  return typeof maybe === 'object' && maybe !== null && CURRENT in maybe;
}

export function getCurrentValue<Value>(value: Value | Reactive<Value>): Value {
  /**
   * If we are working with a cell, forward the '.current' call to it.
   */
  if (typeof value === 'object' && value !== null && 'current' in value) {
    return value.current;
  }

  return value;
}

/**
 * This is what allows resource to be used without @use.
 * The caveat though is that a property must be accessed
 * on the return object.
 *
 * A resource not using use *must* be an object.
 */
export function wrapForPlainUsage<Value>(context: object, builder: Builder<Value>) {
  let cache: Resource<Value>;

  /*
   * Having an object that we use invokeHelper + getValue on
   * is how we convert the "function" in to a reactive utility
   * (along with the following proxy for accessing anything on this 'value')
   *
   */
  const target = {
    get [INTERMEDIATE_VALUE]() {
      if (!cache) {
        cache = builder.create();
        cache.link(context);
      }

      // SAFETY: the types for the helper manager APIs aren't fully defined to infer
      //         nor allow passing the value.
      return cache.current;
    },
  };

  /**
   * This proxy takes everything called on or accessed on "target"
   * and forwards it along to target[INTERMEDIATE_VALUE] (where the actual resource instance is)
   *
   * It's important to only access .[INTERMEDIATE_VALUE] within these proxy-handler methods so that
   * consumers "reactively entangle with" the Resource.
   */
  return new Proxy(target, {
    get(target, key): unknown {
      const state = target[INTERMEDIATE_VALUE];

      assert('[BUG]: it should not have been possible for this to be undefined', state);

      return Reflect.get(state, key, state);
    },

    ownKeys(target): (string | symbol)[] {
      const value = target[INTERMEDIATE_VALUE];

      assert('[BUG]: it should not have been possible for this to be undefined', value);

      return Reflect.ownKeys(value);
    },

    getOwnPropertyDescriptor(target, key): PropertyDescriptor | undefined {
      const value = target[INTERMEDIATE_VALUE];

      assert('[BUG]: it should not have been possible for this to be undefined', value);

      return Reflect.getOwnPropertyDescriptor(value, key);
    },
  }) as never as Value;
}
