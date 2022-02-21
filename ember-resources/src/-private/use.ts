/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
// typed-ember has not publihsed types for this yet
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { invokeHelper } from '@ember/helper';

import { normalizeThunk } from './utils';

import type { Thunk } from './types';

interface Class<T = unknown> {
  new (...args: unknown[]): T;
}

interface Descriptor {
  initializer: () => [Class, Thunk];
}

/**
 * @decorator `@use`
 *
 * -------------
 *
 * The `@use` decorator abstracts away the underlying reactivity configuration
 * needed to use a [[Resource]].
 * `@use` can work with [[Resource]] or [[LifecycleResource]].
 *
 * @example
 * ```js
 * import { use } from 'ember-resources';
 * import { SomeResource } from './some-resource';
 *
 * class MyClass {
 *   @use data = SomeResource.with(() => [arg list]);
 * }
 * ```
 *
 * All subclasses of [[Resource]] and [[LifecycleResource]] have a static method, `with`.
 * This `with` method takes the same argument Thunk you'll see throughout other usages
 * of Resources in this document.
 *
 * The `type` of `data` in this example will be an instance of `SomeResource`, so that
 * typescript is happy / correct.
 *
 */
export function use(_prototype: object, key: string, descriptor?: Descriptor): void {
  if (!descriptor) return;

  assert(`@use can only be used with string-keys`, typeof key === 'string');

  let resources = new WeakMap<object, { resource: unknown; type: 'class' | 'function' }>();
  let { initializer } = descriptor;

  // https://github.com/pzuraq/ember-could-get-used-to-this/blob/master/addon/index.js
  return {
    get() {
      let wrapper = resources.get(this as object);

      if (!wrapper) {
        let initialized = initializer.call(this);

        if (Array.isArray(initialized)) {
          assert(
            `@use ${key} was given unexpected value. Make sure usage is '@use ${key} = MyResource.with(() => ...)'`,

            initialized.length === 2 && typeof initialized[1] === 'function'
          );

          let [Klass, thunk] = initialized;

          let resource = invokeHelper(this, Klass, () => {
            return normalizeThunk(thunk);
          });

          wrapper = { resource, type: 'class' };
          resources.set(this as object, wrapper);
        } else if (typeof initialized === 'function') {
          throw new Error('Functions are not yet supported by @use');
        }
      }

      assert(`Resource could not be created`, wrapper);

      switch (wrapper.type) {
        case 'function':
          return getValue(wrapper.resource).value;
        case 'class':
          return getValue(wrapper.resource);

        default:
          assert('Resource value could not be extracted', false);
      }
    },
  } as unknown as void /* Thanks TS. */;
}

/**
 * Class:
 *   typeof klass.prototype === 'object'
 *   typeof klass === 'function'
 *   klass instanceof Object === true
 *   Symbol.hasInstance in klass === true
 * Function:
 *   typeof fun.prototype === 'object';
 *   typeof fun === 'function';
 *   fun instanceof Object === true
 *   Symbol.hasInstance in fun === true
 * Object:
 *   typeof obj.prototype === 'undefined'
 *   typeof obj === 'object'
 *
 */
// function isClass(klass?: any) {
//   return typeof klass === 'function' && /^class\s/.test(Function.prototype.toString.call(klass));
// }
