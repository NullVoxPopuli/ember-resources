// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { associateDestroyableChild } from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities, invokeHelper, setHelperManager } from '@ember/helper';
import { dependencySatisfies, importSync, macroCondition } from '@embroider/macros';

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

let setOwner: (context: unknown, owner: Owner) => void;

if (macroCondition(dependencySatisfies('ember-source', '>=4.12.0'))) {
  // In no version of ember where `@ember/owner` tried to be imported did it exist
  // if (macroCondition(false)) {
  // Using 'any' here because importSync can't lookup types correctly
  setOwner = (importSync('@ember/owner') as any).setOwner;
} else {
  // Using 'any' here because importSync can't lookup types correctly
  setOwner = (importSync('@ember/application') as any).setOwner;
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
     * We want to cache the helper result, and only re-invoke when the args
     * change.
     */
    let cache = createCache(() => {
      let argsForFn = [];

      if (Object.keys(args.named).length > 0 ) {
        argsForFn = [...args.positional, args.named];
      } else {
        argsForFn = [...args.positional];
      }

      let resource = fn(...argsForFn) as object;

      setOwner(resource, this.owner);

      return invokeHelper(cache, resource);
    });

    setOwner(cache, this.owner);

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
export function resourceFactory<Value = unknown, Args extends any[] = any[]>(
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
  | ((...args: SpreadFor<Args>) => ReturnType<typeof resource<Value>>)
  /**
   * Not passing args is allowed, too
   *   @use a = A()
   *
   *   {{A}}
   */
  | (() => ReturnType<typeof resource<Value>>);
// semicolon

// Provide a singleton manager.
export const ResourceInvokerFactory = (owner: Owner) => new ResourceInvokerManager(owner);

