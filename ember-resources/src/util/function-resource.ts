// @ts-ignore
import { getValue } from '@glimmer/tracking/primitives/cache';
import { assert } from '@ember/debug';
import { associateDestroyableChild, destroy, registerDestructor } from '@ember/destroyable';
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
): Value | InternalIntermediate<Value> | ResourceFunction<Value> {
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

    return context as ResourceFunction<Value>;
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

const INTERMEDIATE_VALUE = '__Intermediate_Value__';
const INTERNAL = '__INTERNAL__';

/**
 * This is what allows resource to be used withotu @use.
 * The caveat though is that a property must be accessed
 * on the return object.
 *
 * A resource not using use *must* be an object.
 */
function wrapForPlainUsage<Value>(context: object, setup: ResourceFunction<Value>) {
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
        cache = invokeHelper(context, setup);
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

/**
 * Secret args to allow `resource` to be used without
 * a decorator
 */
interface InternalIntermediate<Value> {
  [INTERNAL]: true;
  [INTERMEDIATE_VALUE]: ResourceFunction<Value>;
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

/**
 * Note, a function-resource receives on object, hooks.
 *    We have to build that manually in this helper manager
 */
class FunctionResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: unknown) {}

  /**
   * Resources do not take args.
   * However, they can access tracked data
   */
  createHelper(fn: ResourceFunction) {
    let thisFn = fn.bind(null);

    associateDestroyableChild(fn, thisFn);

    return thisFn;
  }

  previousFn?: object;

  getValue(fn: ResourceFunction) {
    if (this.previousFn) {
      destroy(this.previousFn);
    }

    let currentFn = fn.bind(null);

    associateDestroyableChild(fn, currentFn);
    this.previousFn = currentFn;

    return currentFn({
      on: {
        cleanup: (destroyer: Destructor) => {
          registerDestructor(currentFn, destroyer);
        },
      },
    });
  }

  getDestroyable(fn: ResourceFunction) {
    return fn;
  }
}

type ResourceFactory = (...args: any[]) => ReturnType<typeof resource>;

class ResourceInvokerManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(protected owner: unknown) {}

  createHelper(fn: ResourceFactory, args: any): Cache {
    return { fn, args };
  }

  getValue({ fn, args }: { fn: ResourceFactory; args: any }) {
    let helper = fn(...args.positional) as object;
    let result = invokeHelper(this, helper);

    return getValue(result);
  }

  getDestroyable({ fn }: { fn: ResourceFactory }) {
    return fn;
  }
}

// Provide a singleton manager.
const ResourceManagerFactory = (owner: unknown) => new FunctionResourceManager(owner);
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
 *    {{#let (RemoteData) as |state|}}
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

/**
 * @deprecated - use resourceFactory (same behavior, just renamed)
 */
export const registerResourceWrapper = resourceFactory;

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
    get(this: object) {
      let cache = caches.get(this);

      if (!cache) {
        let fn = initializer.call(this);

        assert(
          `Expected initialized value under @use to have used the resource wrapper function`,
          isResourceInitializer(fn)
        );

        cache = invokeHelper(this, fn);

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
