import { ResourceFunction } from "./types.js";
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
declare function resource<Value>(setup: ResourceFunction<Value>): Value;
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
declare function resource<Value>(context: object, setup: ResourceFunction<Value>): Value;
export { resource };
