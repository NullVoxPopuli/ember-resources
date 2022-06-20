import { assert } from '@ember/debug';
// @ts-ignore
import { setHelperManager } from '@ember/helper';

import { ResourceManagerFactory } from './manager';
import { INTERNAL } from './types';
import { wrapForPlainUsage } from './utils';

import type { InternalIntermediate, ResourceFn, ResourceFunction } from './types';

/**
 * `resource` is an alternative API to the class-based `Resource`.
 * It provides a single read-only value and provides a way to optionally cleanup.
 *
 * When would you reach for the class-based `Resource`?
 *  - If you want to provide some api that has methods (so that you can manage binding, etc).
 *  - If you want service injections
 *
 * A function-resource
 *  - _must_ return a value.
 *  - cannot, itself, be async - but can interact with promises and update a value
 *
 *  Example using `fetch` + `AbortController`
 *  ```js
 *  import { use, resource } from 'ember-resources';
 *  import { TrackedObject } from 'tracked-built-ins';
 *  import { tracked } from '@glimmer/tracking';
 *
 *  class Demo {
 *    @tracked url = '...';
 *
 *    @use myData = resource(({ on }) => {
 *      let state = new TrackedObject({ ... });
 *
 *      let controller = new AbortController();
 *
 *      on.cleanup(() => controller.abort());
 *
 *      // because this.url is tracked, anytime url changes,
 *      // this resource will re-run
 *      fetch(this.url, { signal: controller.signal })
 *        .then(response => response.json())
 *        .then(data => {
 *          state.value = data;
 *          // ...
 *        })
 *        .catch(error => {
 *          state.error = error;
 *          // ...
 *        });
 *      // Note that this fetch request could be written async by wrapping in an
 *      // immediately invoked async function, e.g: (async () => {})()
 *
 *
 *      return state;
 *    })
 *  }
 *  ```
 */
export function resource<Value>(setup: ResourceFunction<Value>): Value;

/**
 * `resource` is an alternative API to the class-based `Resource`.
 * It provides a single read-only value and provides a way to optionally cleanup.
 *
 * When would you reach for the class-based `Resource`?
 *  - If you want to provide some api that has methods (so that you can manage binding, etc).
 *  - If you want service injections
 *
 * A function-resource
 *  - _must_ return a value.
 *  - cannot, itself, be async - but can interact with promises and update a value
 *
 *  Example using `fetch` + `AbortController`
 *  ```js
 *  import { resource } from 'ember-resources';
 *  import { TrackedObject } from 'tracked-built-ins';
 *  import { tracked } from '@glimmer/tracking';
 *
 *  class Demo {
 *    @tracked url = '...';
 *
 *    myData = resource(this, ({ on }) => {
 *      let state = new TrackedObject({ isResolved: false, isLoading: true, isError: false });
 *
 *      let controller = new AbortController();
 *
 *      on.cleanup(() => controller.abort());
 *
 *      // because this.url is tracked, anytime url changes,
 *      // this resource will re-run
 *      fetch(this.url, { signal: controller.signal })
 *        .then(response => response.json())
 *        .then(data => {
 *          state.value = data;
 *          state.isResolved = true;
 *          state.isLoading = false;
 *          state.isError = false;
 *        })
 *        .catch(error => {
 *          state.error = error;
 *          state.isResolved = true;
 *          state.isLoading = false;
 *          state.isError = true;
 *        });
 *      // Note that this fetch request could be written async by wrapping in an
 *      // immediately invoked async function, e.g: (async () => {})()
 *
 *
 *      return state;
 *    })
 *  }
 *  ```
 */
export function resource<Value>(context: object, setup: ResourceFunction<Value>): Value;

/**
 *
 *  Example using strict mode + <template> syntax and a template-only component:
 *  ```jsx gjs
 *  import { resource } from 'ember-resources';
 *  import { TrackedObject } from 'tracked-built-ins';
 *
 *  const load = resource(({ on }) => {
 *    let state = new TrackedObject({});
 *    let controller = new AbortController();
 *
 *    on.cleanup(() => controller.abort());
 *
 *    fetch(this.url, { signal: controller.signal })
 *      .then(response => response.json())
 *      .then(data => {
 *        state.value = data;
 *      })
 *      .catch(error => {
 *        state.error = error;
 *      });
 *
 *    return state;
 *  })
 *
 *  <template>
 *    {{#let (load) as |state|}}
 *      {{#if state.value}}
 *        ...
 *      {{else if state.error}}
 *        {{state.error}}
 *      {{/if}}
 *    {{/let}}
 *  </template>
 *  ```
 */
export function resource<Value>(
  context: object | ResourceFunction<Value>,
  setup?: ResourceFunction<Value>
): Value | InternalIntermediate<Value> | ResourceFn<Value> {
  if (!setup) {
    assert(
      `When using \`resource\` with @use, ` +
        `the first argument to \`resource\` must be a function. ` +
        `Instead, a ${typeof context} was received.`,
      typeof context === 'function'
    );

    /**
     * Functions have a different identity every time they are defined.
     * The primary purpose of the `resource` wrapper is to individually
     * register each function with our helper manager.
     */
    setHelperManager(ResourceManagerFactory, context);

    /**
     * With only one argument, we have to do a bunch of lying to
     * TS, because we need a special object to pass to `@use`
     *
     * Add secret key to help @use assert against
     * using vanilla functions as resources without the resource wrapper
     */
    (context as any)[INTERNAL] = true;

    return context as ResourceFn<Value>;
  }

  assert(
    `Mismatched argument typs passed to \`resource\`. ` +
      `Expected the first arg, the context, to be a type of object. This is usually the \`this\`. ` +
      `Received ${typeof context} instead.`,
    typeof context === 'object'
  );
  assert(
    `Mismatched argument type passed to \`resource\`. ` +
      `Expected the second arg to be a function but instead received ${typeof setup}.`,
    typeof setup === 'function'
  );

  setHelperManager(ResourceManagerFactory, setup);

  return wrapForPlainUsage(context, setup);
}
