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
