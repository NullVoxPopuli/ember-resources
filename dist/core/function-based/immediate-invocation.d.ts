import { resource } from "./resource.js";
type SpreadFor<T> = T extends Array<any> ? T : [T];
/**
 * Allows wrapper functions to provide a [[resource]] for use in templates.
 *
 * Only library authors may care about this, but helper function is needed to "register"
 * the wrapper function with a helper manager that specifically handles invoking both the
 * resource wrapper function as well as the underlying resource.
 *
 * _App-devs / consumers may not ever need to know this utility function exists_
 *
 *  Example using strict mode + `<template>` syntax and a template-only component:
 *  ```js
 *  import { resource, resourceFactory } from 'ember-resources';
 *
 *  const RemoteData = resourceFactory((url) => {
 *    return resource(({ on }) => {
 *      let state = new TrackedObject({});
 *      let controller = new AbortController();
 *
 *      on.cleanup(() => controller.abort());
 *
 *      fetch(url, { signal: controller.signal })
 *        .then(response => response.json())
 *        .then(data => {
 *          state.value = data;
 *        })
 *        .catch(error => {
 *          state.error = error;
 *        });
 *
 *      return state;
 *    })
 * });
 *
 *  <template>
 *    {{#let (RemoteData "http://....") as |state|}}
 *      {{#if state.value}}
 *        ...
 *      {{else if state.error}}
 *        {{state.error}}
 *      {{/if}}
 *    {{/let}}
 *  </template>
 *  ```
 *
 *  Alternatively, `resourceFactory` can wrap the wrapper function.
 *
 *  ```js
 *  const RemoteData = resourceFactory((url) => {
 *    return resource(({ on }) => {
 *      ...
 *    });
 *  })
 *  ```
 */
declare function resourceFactory<Value = unknown, Args extends any[] = any[]>(wrapperFn: (...args: Args) => ReturnType<typeof resource<Value>>): ResourceBlueprint<Value, Args>;
type ResourceBlueprint<Value, Args> = 
/**
 * Type for template invocation
 *  {{#let (A b c d) as |a|}}
 *     {{a}}
 *  {{/let}}
 *
 * This could also be used in JS w/ invocation with @use
 *   @use a = A(() => b)
 *
 * NOTE: it is up to the function passed to resourceFactory to handle some of the parameter ambiguity
 */
((...args: SpreadFor<Args>) => ReturnType<typeof resource<Value>>)
/**
 * Not passing args is allowed, too
 *   @use a = A()
 *
 *   {{A}}
 */
 | (() => ReturnType<typeof resource<Value>>);
export { resourceFactory };
