import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild } from '@ember/destroyable';
import { invokeHelper } from '@ember/helper';
import { R as ReadonlyCell } from '../cell-8gZlr81z.js';
import { INTERNAL } from './function-based/types.js';
import { normalizeThunk } from './utils.js';

// NOTE: https://2ality.com/2022/10/javascript-decorators.html#class-getter-decorators%2C-class-setter-decorators
// (for spec decorators, when it comes time to implement those)
//
// @ts-ignore

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

function use(...args) {
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
function getCurrentValue(value) {
  /**
   * If we are working with a cell, forward the '.current' call to it.
   */
  if (typeof value === 'object' && value !== null && 'current' in value) {
    return value.current;
  }
  return value;
}
function classContextLink(context, definition) {
  let cache;
  return new ReadonlyCell(() => {
    if (!cache) {
      cache = invokeHelper(context, definition);
      associateDestroyableChild(context, cache);
    }
    let value = getValue(cache);
    return getCurrentValue(value);
  });
}
function argumentToDecorator(definition) {
  return (_prototype, key, descriptor) => {
    // TS's types for decorators use the Stage2 implementation, even though Babel uses Stage 1
    if (!descriptor) return;
    assert(`@use can only be used with string-keys`, typeof key === 'string');
    assert(`When @use(...) is passed a resource, an initialized value is not allowed. ` + `\`@use(Clock) time;`, !descriptor.initializer);
    let newDescriptor = descriptorGetter(definition);
    return newDescriptor /* Thanks, TS and Stage 2 Decorators */;
  };
}

function descriptorGetter(initializer) {
  let caches = new WeakMap();
  return {
    get() {
      let cache = caches.get(this);
      if (!cache) {
        let config = typeof initializer === 'function' ? initializer.call(this) : initializer;
        assert(`Expected initialized value under @use to have used either the \`resource\` wrapper function, or a \`Resource.from\` call`, INTERNAL in config);
        if (config.type === 'function-based') {
          cache = invokeHelper(this, config);
          caches.set(this, cache);
          associateDestroyableChild(this, cache);
        } else if (config.type === 'class-based') {
          let {
            definition,
            thunk
          } = config;
          cache = invokeHelper(this, definition, () => normalizeThunk(thunk));
          caches.set(this, cache);
          associateDestroyableChild(this, cache);
        }
        assert(`Failed to create cache for internal resource configuration object`, cache);
      }
      let value = getValue(cache);
      return getCurrentValue(value);
    }
  };
}
function initializerDecorator(_prototype, key, descriptor) {
  // TS's types for decorators use the Stage2 implementation, even though Babel uses Stage 1
  if (!descriptor) return;
  assert(`@use can only be used with string-keys`, typeof key === 'string');
  let {
    initializer
  } = descriptor;
  assert(`@use may only be used on initialized properties. For example, ` + `\`@use foo = resource(() => { ... })\` or ` + `\`@use foo = SomeResource.from(() => { ... });\``, initializer);
  return descriptorGetter(initializer) /* Thanks, TS and Stage 2 Decorators */;
}

export { use };
//# sourceMappingURL=use.js.map
