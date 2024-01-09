// NOTE: https://2ality.com/2022/10/javascript-decorators.html#class-getter-decorators%2C-class-setter-decorators
// (for spec decorators, when it comes time to implement those)
//
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { ReadonlyCell } from './cell';
import { INTERNAL } from './function-based/types';
import { normalizeThunk } from './utils';

import type { InternalFunctionResourceConfig, Reactive } from './function-based/types';
import type { ClassResourceConfig, Stage1DecoratorDescriptor } from '[core-types]';

type Config = ClassResourceConfig | InternalFunctionResourceConfig;

type NonInstanceType<K> = K extends InstanceType<any> ? object : K;
type DecoratorKey<K> = K extends string | symbol ? K : never;
type NonDecoratorKey<K> = K extends string | symbol ? never : ThisType<K>;

/**
 * The `@use(...)` decorator can be used to use a Resource in javascript classes
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource( ... );
 *
 * class Demo {
 *   @use(Clock) time;
 * }
 * ```
 */
export function use<Value>(definition: Value | (() => Value)): PropertyDecorator;

/**
 * The `@use` decorator can be used to use a Resource in javascript classes
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource(() => 2);
 *
 * class MyClass {
 *   @use data = Clock;
 * }
 *
 * (new MyClass()).data === 2
 * ```
 */
export function use<Prototype, Key>(
  prototype: NonInstanceType<Prototype>,
  key: DecoratorKey<Key>,
  descriptor?: Stage1DecoratorDescriptor,
): void;

/**
 * The `use function can be used to use a Resource in javascript classes
 *
 * Note that when using this version of `use`, the value is only accessible on the `current`
 * property.
 *
 * ```js
 * import { resource, use } from 'ember-resources';
 *
 * const Clock = resource( ... );
 *
 * class Demo {
 *   data = use(this, Clock);
 * }
 *
 * (new Demo()).data.current === 2
 * ```
 */
export function use<Value>(
  parent: object,
  definition: Value | (() => Value),
  _?: never,
): Reactive<Value extends Reactive<any> ? Value['current'] : Value>;

export function use(
  ...args:
    | Parameters<typeof initializerDecorator>
    | Parameters<typeof argumentToDecorator>
    | Parameters<typeof classContextLink>
) {
  if (args.length === 3) {
    return initializerDecorator(...args);
  }

  if (args.length === 2) {
    if (typeof args[1] !== 'string' && typeof args[1] !== 'symbol') {
      return classContextLink(args[0], args[1]);
    }
  }

  if (args.length === 1) {
    return argumentToDecorator(args[0]);
  }

  assert(`Unknown arity for \`use\`. Received ${args.length} arguments`, false);
}

function getCurrentValue<Value>(value: Value | Reactive<Value>): Value {
  /**
   * If we are working with a cell, forward the '.current' call to it.
   */
  if (typeof value === 'object' && value !== null && 'current' in value) {
    return value.current;
  }

  return value;
}

function classContextLink<Value>(
  context: object,
  definition: Value | (() => Value),
): Reactive<Value> {
  let cache: ReturnType<typeof invokeHelper>;

  return new ReadonlyCell<Value>(() => {
    if (!cache) {
      cache = invokeHelper(context, definition);

      associateDestroyableChild(context, cache);
    }

    let value = getValue(cache);

    return getCurrentValue(value);
  });
}

function argumentToDecorator<Value>(definition: Value | (() => Value)): PropertyDecorator {
  return (
    _prototype: object,
    key: string | symbol,
    descriptor?: Stage1DecoratorDescriptor,
  ): void => {
    // TS's types for decorators use the Stage2 implementation, even though Babel uses Stage 1
    if (!descriptor) return;

    assert(`@use can only be used with string-keys`, typeof key === 'string');

    assert(
      `When @use(...) is passed a resource, an initialized value is not allowed. ` +
        `\`@use(Clock) time;`,
      !descriptor.initializer,
    );

    let newDescriptor = descriptorGetter(definition);

    return newDescriptor as unknown as void /* Thanks, TS and Stage 2 Decorators */;
  };
}

function descriptorGetter(initializer: unknown | (() => unknown)) {
  let caches = new WeakMap<object, any>();

  return {
    get(this: object) {
      let cache = caches.get(this);

      if (!cache) {
        let config = (
          typeof initializer === 'function' ? initializer.call(this) : initializer
        ) as Config;

        assert(
          `Expected initialized value under @use to have used either the \`resource\` wrapper function, or a \`Resource.from\` call`,
          INTERNAL in config,
        );

        if (config.type === 'function-based') {
          cache = invokeHelper(this, config);
          caches.set(this as object, cache);
          associateDestroyableChild(this, cache);
        } else if (config.type === 'class-based') {
          let { definition, thunk } = config;

          cache = invokeHelper(this, definition, () => normalizeThunk(thunk));
          caches.set(this as object, cache);
          associateDestroyableChild(this, cache);
        }

        assert(`Failed to create cache for internal resource configuration object`, cache);
      }

      let value = getValue(cache);

      return getCurrentValue(value);
    },
  };
}

function initializerDecorator(
  _prototype: object,
  key: string | symbol,
  descriptor?: Stage1DecoratorDescriptor,
): void {
  // TS's types for decorators use the Stage2 implementation, even though Babel uses Stage 1
  if (!descriptor) return;

  assert(`@use can only be used with string-keys`, typeof key === 'string');

  let { initializer } = descriptor;

  assert(
    `@use may only be used on initialized properties. For example, ` +
      `\`@use foo = resource(() => { ... })\` or ` +
      `\`@use foo = SomeResource.from(() => { ... });\``,
    initializer,
  );

  return descriptorGetter(initializer) as unknown as void /* Thanks, TS and Stage 2 Decorators */;
}
