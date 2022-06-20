// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
// @ts-ignore
import { capabilities as helperCapabilities, invokeHelper, setHelperManager } from '@ember/helper';

import type { resource } from './resource';
import type { Cache } from './types';

type ResourceFactory = (...args: any[]) => ReturnType<typeof resource>;

class ResourceInvokerManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: unknown) {}

  createHelper(fn: ResourceFactory, args: any) {
    let helper: object;
    /**
     * This cache is for args passed to the ResourceInvoker/Factory
     *
     * We want to cache the helper result, and only re-inoke when the args
     * change.
     */
    let cache = createCache(() => {
      if (helper === undefined) {
        let resource = fn(...args.positional) as object;

        helper = invokeHelper(cache, resource);
      }

      return helper;
    });

    return { fn, args, cache: getValue(cache) };
  }

  getValue({ cache }: { cache: Cache }) {
    return getValue(cache);
  }

  getDestroyable({ fn }: { fn: ResourceFactory }) {
    return fn;
  }
}

// Provide a singleton manager.
const ResourceInvokerFactory = (owner: unknown) => new ResourceInvokerManager(owner);

/**
 * Allows wrapper functions to provide a [[resource]] for use in templates.
 *
 * Only library authors may care about this, but helper function is needed to "register"
 * the wrapper function with a helper manager that specifically handles invoking both the
 * resource wrapper function as well as the underlying resource.
 *
 * _App-devs / consumers may not ever need to know this utility function exists_
 *
 *  Example using strict mode + <template> syntax and a template-only component:
 *  ```js
 *  import { resource, resourceFactory } from 'ember-resources/util/function-resource';
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
export function resourceFactory(wrapperFn: ResourceFactory) {
  setHelperManager(ResourceInvokerFactory, wrapperFn);

  return wrapperFn;
}
