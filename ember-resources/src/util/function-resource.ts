// @ts-ignore
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import {
  associateDestroyableChild,
  registerDestructor,
  unregisterDestructor,
} from '@ember/destroyable';
// @ts-ignore
import { capabilities as helperCapabilities, invokeHelper, setHelperManager } from '@ember/helper';

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
 *  import { use, resource } from 'ember-resources/util/function-resource';
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
 *  import { resource } from 'ember-resources/util/function-resource';
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
 *  import { resource } from 'ember-resources/util/function-resource';
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
):
  | Value
  | { [INTERNAL]: true; [INTERMEDIATE_VALUE]: ResourceFunction<Value> }
  | ResourceFunction<Value> {
  /**
   * With only one argument, we have to do a bunch of lying to
   * TS, because we need a special object to pass to `@use`
   */
  if (typeof context === 'function' && !setup) {
    setHelperManager(() => MANAGER, context);

    // Add secret key to help @use assert against
    // using vanilla functions as resources without the resource wrapper
    (context as any)[INTERNAL] = true;

    return context as ResourceFunction<Value>;
  }

  setHelperManager(() => MANAGER, setup);

  let cache: Cache;

  /*
   * Having an object that we use invokeHelper + getValue on
   * is how we convert the "function" in to a reactive utility
   * (along with the following proxy for accessing anything on this 'value')
   *
   */
  const target = {
    get [INTERMEDIATE_VALUE]() {
      if (!cache) {
        cache = invokeHelper(context, setup, () => ({}));
      }

      return getValue<Value>(cache);
    },
  };

  /**
   * This proxy takes everything called on or accessed on "target"
   * and forwards it along to target.value (where the actual resource instance is)
   *
   * It's important to only access .value within these proxy-handler methods so that
   * consumers "reactively entangle with" the Resource.
   */
  return new Proxy(target, {
    get(target, key): unknown {
      const state = target[INTERMEDIATE_VALUE];

      return Reflect.get(state, key, state);
    },

    ownKeys(target): (string | symbol)[] {
      const value = target[INTERMEDIATE_VALUE];

      return Reflect.ownKeys(value);
    },

    getOwnPropertyDescriptor(target, key): PropertyDescriptor | undefined {
      const value = target[INTERMEDIATE_VALUE];

      return Reflect.getOwnPropertyDescriptor(value, key);
    },
  }) as never as Value;
}

export type Hooks = {
  on: {
    /**
     * Optionally a function-resource can provide a cleanup function.
     *
     *
     *  Example:
     *  ```js
     *  import { resource } from 'ember-resources/util/function-resource';
     *  import { TrackedObject } from 'tracked-built-ins';
     *
     *  const load = resource(({ on }) => {
     *    let state = new TrackedObject({});
     *    let controller = new AbortController();
     *
     *    on.cleanup(() => controller.abort());
     *
     *    fetch(this.url, { signal: controller.signal })
     *      // ...
     *
     *    return state;
     *  })
     */
    cleanup: (destroyer: Destructor) => void;
  };
};
type Destructor = () => void;
type ResourceFunction<Value = unknown> = (hooks: Hooks) => Value;
type Cache = object;

const INTERMEDIATE_VALUE = '__Intermediate_Value__';
const INTERNAL = '__INTERNAL__';

let DESTROYERS = new WeakMap();

/**
 * Note, a function-resource receives
 */
class FunctionResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  createHelper(fn: ResourceFunction) {
    /**
     * The helper is only created once.
     * It's the cache's callback that is invoked multiple times,
     * based on reactive behavior
     *
     */
    let cache: Cache = createCache(() => {
      let destroyer = DESTROYERS.get(fn);

      /**
       * Because every function invocation shares the same cache,
       * we gotta take care of destruction manually.
       *
       * Glimmer will handle the last destruction for us when it tears down the cache
       *
       * It is not guaranteed if destruction is async or sync, and this may change in the future if it needs to
       */
      if (destroyer) {
        unregisterDestructor(fn, destroyer);
        destroyer();
      }

      let value = fn({
        on: {
          cleanup: (destroyer: Destructor) => {
            associateDestroyableChild(cache, fn);
            registerDestructor(fn, destroyer);

            DESTROYERS.set(fn, destroyer);
          },
        },
      });

      return value;
    });

    return cache;
  }

  getValue(cache: Cache) {
    return getValue(cache);
  }

  getDestroyable(cache: Cache) {
    return cache;
  }
}

type ResourceFactory = (...args: any[]) => ReturnType<typeof resource>;

class ResourceInvokerManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  createHelper(fn: ResourceFactory, args: any): ReturnType<typeof resource> {
    // this calls `resource`, which registers
    // with the other helper manager
    return fn(...args.positional);
  }

  getValue(helper: ReturnType<typeof resource>) {
    let result = invokeHelper(this, helper, () => ({}));

    return getValue(result);
  }

  getDestroyable(helper: ReturnType<typeof resource>) {
    return helper;
  }
}

// Provide a singleton manager.
const MANAGER = new FunctionResourceManager();
const ResourceInvoker = new ResourceInvokerManager();

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
 *  import { resource, registerResourceWrapper } from 'ember-resources/util/function-resource';
 *
 *  function RemoteData(url) {
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
 * }
 *
 * registerResourceWrapper(RemoteData)
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
 *
 *  Alternatively, `registerResourceWrapper` can wrap the wrapper function.
 *
 *  ```js
 *  const RemoteData = registerResourceWrapper((url) => {
 *    return resource(({ on }) => {
 *      ...
 *    });
 *  })
 *  ```
 */
export function registerResourceWrapper(wrapperFn: ResourceFactory) {
  setHelperManager(() => ResourceInvoker, wrapperFn);

  return wrapperFn;
}

interface Descriptor {
  initializer: () => unknown;
}

/**
 * The `@use` decorator has two responsibilities
 *    - abstract away the underlying reactivity configuration (invokeHelper)
 *       - by doing this, we get destruction-association properly cofigured so that
 *         when the host class is destroyed, if the resource has a destructor, it
 *         will be called during destruction
 *    - allows the return value of the resource to be "the" value of the property.
 *
 *
 * This `@use` decorator is needed for function-resources, and *not* needed for class-based
 * resources (for now).
 *
 * @example
 * ```js
 * import { resource, use } from 'ember-resources/util/function-resource';
 *
 * class MyClass {
 *   @use data = resource(() => {
 *     return 2;
 *   });
 * }
 *
 * (new MyClass()).data === 2
 * ```
 */
export function use(_prototype: object, key: string, descriptor?: Descriptor): void {
  if (!descriptor) return;

  assert(`@use can only be used with string-keys`, typeof key === 'string');

  let caches = new WeakMap<object, any>();

  let { initializer } = descriptor;

  // https://github.com/pzuraq/ember-could-get-used-to-this/blob/master/addon/index.js
  return {
    get() {
      let cache = caches.get(this as object);

      if (!cache) {
        let fn = initializer.call(this);

        assert(
          `Expected initialized value under @use to have used the resource wrapper function`,
          isResourceInitializer(fn)
        );

        cache = invokeHelper(this, fn, () => ({}));

        caches.set(this as object, cache);
      }

      return getValue(cache);
    },
  } as unknown as void /* Thanks TS. */;
}

type ResourceInitializer = {
  [INTERNAL]: true;
};

function isResourceInitializer(obj: unknown): obj is ResourceInitializer {
  return typeof obj === 'function' && obj !== null && INTERNAL in obj;
}
