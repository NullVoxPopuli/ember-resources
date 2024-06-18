import { assert } from '@ember/debug';
// @ts-ignore
import { invokeHelper, setHelperManager } from '@ember/helper';

import { registerUsable } from '../use.ts';
import { ResourceManagerFactory } from './manager.ts';
import { INTERNAL } from './types.ts';
import { wrapForPlainUsage } from './utils.ts';

import type { InternalFunctionResourceConfig, ResourceFn, ResourceFunction } from './types.ts';

const TYPE = 'function-based';

registerUsable(TYPE, (context: object, config: InternalFunctionResourceConfig) => {
  return invokeHelper(context, config);
});

/**
 * `resource` provides a single reactive read-only value with lifetime and may have cleanup.
 *
 * Arguments passed to the `resource` function:
 * ```js
 *  resource(
 *    ({
 *      // provided callback functions:
 *      //  - `cleanup`
 *      on,
 *
 *      // used for composing other resources
 *      use,
 *
 *      // used for accessing services, etc on the app/engine owner instance
 *      owner
 *    }) => {
 *      // ✂️  resource body ✂️
 *    }
 *  );
 *  ```
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
 *
 *
 *
 *  Example using strict mode + `<template>` syntax and a template-only component:
 *
 *  ```js
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
export function resource<Value>(setup: ResourceFunction<Value>): Value;

/**
 * `resource` is an alternative API to the class-based `Resource`.
 * It may provide a single read-only value and provides a way to optionally cleanup.
 *
 * When would you reach for the class-based `Resource`?
 *  - the capabilities of the function-based resource and class-based resource are identical,
 *    with the exception that function-based resources may represent a single value, rather than
 *    an object with properties/methods (the only option with class-based resources)
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
 */
export function resource<Value>(
  context: object | ResourceFunction<Value>,
  setup?: ResourceFunction<Value>,
): Value | InternalFunctionResourceConfig<Value> | ResourceFn<Value> {
  if (!setup) {
    assert(
      `When using \`resource\` with @use, ` +
        `the first argument to \`resource\` must be a function. ` +
        `Instead, a ${typeof context} was received.`,
      typeof context === 'function',
    );

    let internalConfig: InternalFunctionResourceConfig<Value> = {
      definition: context as ResourceFunction<Value>,
      type: 'function-based',
      name: 'Resource',
      [INTERNAL]: true,
    };

    /**
     * Functions have a different identity every time they are defined.
     * The primary purpose of the `resource` wrapper is to individually
     * register each function with our helper manager.
     */
    setHelperManager(ResourceManagerFactory, internalConfig);

    /**
     * With only one argument, we have to do a bunch of lying to
     * TS, because we need a special object to pass to `@use`
     *
     * Add secret key to help @use assert against
     * using vanilla functions as resources without the resource wrapper
     *
     */
    return internalConfig as unknown as ResourceFn<Value>;
  }

  assert(
    `Mismatched argument types passed to \`resource\`. ` +
      `Expected the first arg, the context, to be a type of object. This is usually the \`this\`. ` +
      `Received ${typeof context} instead.`,
    typeof context === 'object',
  );
  assert(
    `Mismatched argument type passed to \`resource\`. ` +
      `Expected the second arg to be a function but instead received ${typeof setup}.`,
    typeof setup === 'function',
  );

  let internalConfig: InternalFunctionResourceConfig<Value> = {
    definition: setup as ResourceFunction<Value>,
    type: TYPE,
    name: getDebugName(setup),
    [INTERNAL]: true,
  };

  setHelperManager(ResourceManagerFactory, internalConfig);

  return wrapForPlainUsage(context, internalConfig);
}

function getDebugName(obj: object) {
  if ('name' in obj) {
    return `Resource Function: ${obj.name}`;
  }

  return `Resource Function`;
}
