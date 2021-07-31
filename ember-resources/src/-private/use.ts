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

import { FUNCTION_TO_RUN, FunctionRunner, INITIAL_VALUE } from './resources/function-runner';
import { normalizeThunk } from './utils';

import type { Thunk } from './types';

interface Class<T = unknown> {
  new (...args: unknown[]): T;
}

interface Descriptor {
  initializer: () => [Class, Thunk];
}

/**
 * works with
 * - resources (both Resource and LifecycleResource)
 * - functions
 */
export function use(prototype: object, key: string, descriptor?: Descriptor): void {
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
          let klass = class AnonymousFunctionRunner extends FunctionRunner<unknown, unknown[]> {
            [INITIAL_VALUE] = undefined;
            [FUNCTION_TO_RUN] = initialized;
          };

          let resource = invokeHelper(this, klass, () => {
            return normalizeThunk();
          });

          wrapper = { resource, type: 'function' };
          resources.set(this as object, wrapper);
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
