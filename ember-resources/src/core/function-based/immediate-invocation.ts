// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities, invokeHelper, setHelperManager } from '@ember/helper';

import type { resource } from './resource';
import type { Cache } from './types';
import type Owner from '@ember/owner';

type SpreadFor<T> = T extends Array<any> ? T : [T];
type ResourceFactory<Value = any, Args = any> = (...args: SpreadFor<Args>) => Value;

interface State {
  cache: Cache;
  fn: any;
  args: any;
  _?: any;
}

class ResourceInvokerManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: Owner) {}

  createHelper(fn: ResourceFactory, args: any): State {
    /**
     * This cache is for args passed to the ResourceInvoker/Factory
     *
     * We want to cache the helper result, and only re-inoke when the args
     * change.
     */
    let cache = createCache(() => {
      let resource = fn(...args.positional) as object;

      return invokeHelper(cache, resource);
    });


    return { fn, args, cache, _: getValue(cache) };
  }

  /**
   * getValue is re-called when args change
   */
  getValue({ cache }: State) {
    let resource = getValue(cache);

    associateDestroyableChild(cache, resource);

    return getValue(resource);
  }

  getDestroyable({ cache }: State) {
    return cache;
  }

  // createHelper(fn: AnyFunction, args: Arguments): State {
  //   return { fn, args };
  // }

  // getValue({ fn, args }: State): unknown {
  //   if (Object.keys(args.named).length > 0) {
  //     let argsForFn: FnArgs<Arguments> = [...args.positional, args.named];

  //     return fn(...argsForFn);
  //   }

  //   return fn(...args.positional);
  // }

  // getDebugName(fn: AnyFunction): string {
  //   if (fn.name) {
  //     return `(helper function ${fn.name})`;
  //   }

  //   return '(anonymous helper function)';
  // }
}

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
export function resourceFactory<Value = unknown, Args extends unknown[] = unknown[]>(
  wrapperFn: (...args: Args) => ReturnType<typeof resource<Value>>
  /**
    * This is a bonkers return type.
    * Here are the scenarios:
    *   const A = resourceFactory((...args) => {
    *     return resource(({ on }) => {
    *       ...
    *     })
    *   })
    *
    * Invocation styles need to be type-correct:
    *   @use a = A(() => [b, c, d])
    *   => single argument which is a function where the return type is the args
    *
    *   {{#let (A b c d) as |a|}}
    *      {{a}}
    *   {{/let}}
    *   => args are passed directly as positional arguments
    */
) {
  setHelperManager(ResourceInvokerFactory, wrapperFn);

  return wrapperFn as ResourceBlueprint<Value, Args>;
}

type ResourceBlueprint<Value, Args> =
  /**
    * type for JS invocation with @use
    *   @use a = A.from(() => [b, c, d])
    */
  | ((thunk: () => SpreadFor<Args>) => ReturnType<typeof resource<Value>>)
  /**
   * Type for template invocation
    *  {{#let (A b c d) as |a|}}
    *     {{a}}
    *  {{/let}}
   */
  | ((...args: SpreadFor<Args>) => ReturnType<typeof resource<Value>>)
  /**
    * Not passing args is allowed, too
    *   @use a = A.from()
    *
    *   {{A}}
    */
  | (() => ReturnType<typeof resource<Value>>)
  // semicolon
  ;


// Provide a singleton manager.
const ResourceInvokerFactory = (owner: Owner) => new ResourceInvokerManager(owner);
